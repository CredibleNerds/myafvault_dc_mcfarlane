import { toast } from "sonner";
import { fetchCloudVault, saveCloudVault } from "@/lib/collection-sync";
import {
  mergeCollections,
  mergeEntries,
  entriesFingerprint,
} from "@/lib/merge-entries";
import { useCatalogue } from "@/lib/store";

export type SyncStatus =
  | "idle"
  | "signing-in"
  | "pulling"
  | "pushing"
  | "synced"
  | "offline"
  | "error";

type Listener = (status: SyncStatus, detail?: string) => void;

let status: SyncStatus = "idle";
let detail = "";
let listeners = new Set<Listener>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedFp = "";
let activeUserId: string | null = null;
let unsubStore: (() => void) | null = null;
let syncing = false;
let applyingRemote = false;
let startedForUser: string | null = null;

function setStatus(next: SyncStatus, nextDetail = "") {
  status = next;
  detail = nextDetail;
  listeners.forEach((l) => l(status, detail));
}

export function getSyncStatus() {
  return { status, detail };
}

export function subscribeSyncStatus(listener: Listener) {
  listeners.add(listener);
  listener(status, detail);
  return () => {
    listeners.delete(listener);
  };
}

function vaultFingerprint() {
  const { entries, collections } = useCatalogue.getState();
  return entriesFingerprint(entries, collections);
}

/** Merge local + cloud, write both sides, start watching for changes. */
export async function startCloudSync(userId: string): Promise<void> {
  if (
    startedForUser === userId &&
    (status === "synced" || status === "pulling" || status === "pushing")
  ) {
    return;
  }
  startedForUser = userId;
  activeUserId = userId;
  setStatus("pulling");

  try {
    const cloud = await fetchCloudVault();
    const localEntries = useCatalogue.getState().entries;
    const localCollections = useCatalogue.getState().collections;
    const mergedEntries = mergeEntries(localEntries, cloud.entries);
    const mergedCollections = mergeCollections(
      localCollections,
      cloud.collections ?? {},
    );

    applyingRemote = true;
    useCatalogue.getState().replaceEntries(mergedEntries);
    useCatalogue.getState().replaceCollections(mergedCollections);
    applyingRemote = false;

    setStatus("pushing");
    const saved = await saveCloudVault({
      data: { entries: mergedEntries, collections: mergedCollections },
    });
    lastPushedFp = entriesFingerprint(mergedEntries, mergedCollections);
    setStatus("synced", saved.updatedAt ?? undefined);
    toast.success("Collection synced to the cloud");
  } catch (err) {
    applyingRemote = false;
    const msg = err instanceof Error ? err.message : "Sync failed";
    if (/unauthorized/i.test(msg)) {
      startedForUser = null;
      setStatus("idle");
      return;
    }
    // Older DBs without collections column — still try entries-only once
    if (/column .*collections/i.test(msg)) {
      setStatus("error", "Run migrations for collections support, then re-sync");
    } else {
      setStatus("error", msg);
    }
    toast.error(msg);
  }

  unsubStore?.();
  unsubStore = useCatalogue.subscribe((state, prev) => {
    if (applyingRemote) return;
    if (
      state.entries === prev.entries &&
      state.collections === prev.collections
    ) {
      return;
    }
    if (!activeUserId) return;
    schedulePush();
  });
}

export function stopCloudSync() {
  activeUserId = null;
  startedForUser = null;
  unsubStore?.();
  unsubStore = null;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  setStatus("idle");
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushNow();
  }, 1200);
}

export async function pushNow(): Promise<void> {
  if (!activeUserId || syncing || applyingRemote) return;
  const { entries, collections } = useCatalogue.getState();
  const fp = entriesFingerprint(entries, collections);
  if (fp === lastPushedFp) {
    setStatus("synced");
    return;
  }
  syncing = true;
  setStatus("pushing");
  try {
    const saved = await saveCloudVault({ data: { entries, collections } });
    lastPushedFp = entriesFingerprint(entries, collections);
    setStatus("synced", saved.updatedAt ?? undefined);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    setStatus("error", msg);
  } finally {
    syncing = false;
  }
}

/** Manual full re-sync (pull + merge + push). */
export async function forceResync(): Promise<void> {
  if (!activeUserId) return;
  const uid = activeUserId;
  startedForUser = null;
  lastPushedFp = "";
  await startCloudSync(uid);
}
