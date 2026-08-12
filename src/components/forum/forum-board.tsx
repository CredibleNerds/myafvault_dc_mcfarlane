import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Heart,
  HelpCircle,
  ImageIcon,
  Layers,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/image";
import {
  addForumComment,
  createForumPost,
  deleteForumPost,
  getForumMembership,
  joinForum,
  leaveForum,
  listForumPosts,
  toggleForumLike,
  type ForumKind,
  type ForumPost,
} from "@/lib/forum";
import { cn } from "@/lib/utils";

const KINDS: { id: ForumKind; label: string; Icon: typeof Camera }[] = [
  { id: "photo", label: "Photo", Icon: ImageIcon },
  { id: "collection", label: "Collection", Icon: Layers },
  { id: "question", label: "Question", Icon: HelpCircle },
];

export function ForumBoard() {
  const [joined, setJoined] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh(isMember = joined) {
    if (!isMember) {
      setPosts([]);
      return;
    }
    const next = await listForumPosts();
    setPosts(next);
  }

  useEffect(() => {
    let cancelled = false;
    void getForumMembership()
      .then(async (s) => {
        if (cancelled) return;
        setJoined(s.joined);
        if (s.joined) {
          const next = await listForumPosts();
          if (!cancelled) setPosts(next);
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not load board");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onJoin() {
    try {
      await joinForum();
      setJoined(true);
      await refresh(true);
      toast.success("You’re on the collector board");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join");
    }
  }

  async function onLeave() {
    try {
      await leaveForum();
      setJoined(false);
      setPosts([]);
      toast.success("You left the board. Your posts stay up.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not leave");
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the board…
      </p>
    );
  }

  if (!joined) {
    return (
      <section className="mx-auto max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface p-6 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Collector board
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Opt in to share shelf photos, collection shots, and questions with
          other MyAFVault collectors. Like posts, leave comments, and keep it
          simple.
        </p>
        <ul className="text-sm text-muted space-y-1.5">
          <li>Share a figure or collection photo</li>
          <li>Ask the room a question</li>
          <li>Like and comment on other posts</li>
        </ul>
        <Button type="button" className="w-full sm:w-auto" onClick={() => void onJoin()}>
          Join the board
        </Button>
      </section>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Collector board
          </h2>
          <p className="text-sm text-muted">
            Photos, shelves, and questions from the vault.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => void onLeave()}>
          Leave
        </Button>
      </div>

      <Composer
        onCreated={(post) => setPosts((list) => [post, ...list])}
      />

      {posts.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing here yet. Post a shelf shot or a question.
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                onChange={(next) =>
                  setPosts((list) =>
                    list.map((p) => (p.id === next.id ? next : p)),
                  )
                }
                onDelete={(id) =>
                  setPosts((list) => list.filter((p) => p.id !== id))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Composer({ onCreated }: { onCreated: (post: ForumPost) => void }) {
  const [kind, setKind] = useState<ForumKind>("photo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const post = await createForumPost({
        data: { kind, title, body, imageData: image },
      });
      onCreated(post);
      setTitle("");
      setBody("");
      setImage(null);
      toast.success("Posted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap gap-2">
        {KINDS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
              kind === id
                ? "border-primary bg-primary text-primary-fg"
                : "border-border text-muted hover:text-fg",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="forum-title">Title</Label>
        <Input
          id="forum-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            kind === "question"
              ? "What’s your question?"
              : "Name this shot"
          }
          maxLength={80}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="forum-body">
          {kind === "question" ? "Question" : "Caption"}
        </Label>
        <Textarea
          id="forum-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === "question"
              ? "Ask the other collectors…"
              : "Optional notes"
          }
          rows={3}
          maxLength={800}
        />
      </div>
      {image && (
        <img
          src={image}
          alt=""
          className="max-h-56 w-full rounded-[var(--radius-sm)] object-cover"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="h-3.5 w-3.5" />
          {image ? "Change photo" : "Add photo"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void compressImage(file, 1200, 0.82)
              .then(setImage)
              .catch(() => toast.error("Could not read that photo"));
            e.target.value = "";
          }}
        />
        <Button type="submit" size="sm" disabled={busy} className="ml-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post
        </Button>
      </div>
    </form>
  );
}

function PostCard({
  post,
  onChange,
  onDelete,
}: {
  post: ForumPost;
  onChange: (post: ForumPost) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const kindLabel =
    post.kind === "question"
      ? "Question"
      : post.kind === "collection"
        ? "Collection"
        : "Photo";

  async function like() {
    try {
      const result = await toggleForumLike({ data: { postId: post.id } });
      onChange({
        ...post,
        likedByMe: result.liked,
        likeCount: result.likeCount,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not like");
    }
  }

  async function comment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await addForumComment({
        data: { postId: post.id, body: draft },
      });
      onChange({ ...post, comments: [...post.comments, next] });
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not comment");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    try {
      await deleteForumPost({ data: { postId: post.id } });
      onDelete(post.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            {kindLabel} · {post.authorName}
          </p>
          <h3 className="font-semibold leading-snug">{post.title}</h3>
        </div>
        {post.mine && (
          <button
            type="button"
            onClick={() => void remove()}
            className="text-muted hover:text-danger"
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>
      {post.imageData && (
        <img
          src={post.imageData}
          alt=""
          className="mt-3 max-h-[420px] w-full object-cover"
        />
      )}
      {post.body && (
        <p className="px-4 pt-3 text-sm leading-relaxed text-fg">{post.body}</p>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => void like()}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            post.likedByMe ? "text-primary" : "text-muted hover:text-fg",
          )}
        >
          <Heart
            className={cn("h-4 w-4", post.likedByMe && "fill-primary")}
          />
          {post.likeCount}
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <MessageCircle className="h-4 w-4" />
          {post.comments.length}
        </span>
      </div>
      {post.comments.length > 0 && (
        <ul className="space-y-2 border-t border-border px-4 py-3">
          {post.comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.authorName}</span>{" "}
              <span className="text-muted">{c.body}</span>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={comment}
        className="flex gap-2 border-t border-border p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment…"
          maxLength={400}
        />
        <Button type="submit" size="sm" disabled={busy || !draft.trim()}>
          Reply
        </Button>
      </form>
    </article>
  );
}
