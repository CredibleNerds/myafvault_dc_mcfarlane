import { Monitor, Share, Smartphone, SquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: {
  id: string;
  title: string;
  subtitle: string;
  Icon: typeof Smartphone;
  steps: string[];
}[] = [
  {
    id: "ios",
    title: "iPhone & iPad",
    subtitle: "Safari on Apple devices",
    Icon: Smartphone,
    steps: [
      "Open myafvault.com in Safari (not Chrome or in-app browsers).",
      "Tap the Share button at the bottom (square with an up arrow).",
      "Scroll and tap Add to Home Screen.",
      "Name it MyAFVault, then tap Add. The V icon appears on your Home Screen.",
    ],
  },
  {
    id: "android",
    title: "Android",
    subtitle: "Chrome on phones and tablets",
    Icon: Smartphone,
    steps: [
      "Open myafvault.com in Chrome.",
      "Tap the three-dot menu in the top right.",
      "Tap Install app or Add to Home screen.",
      "Confirm Install. MyAFVault opens like any other app.",
    ],
  },
  {
    id: "windows",
    title: "Windows",
    subtitle: "Edge or Chrome on a PC",
    Icon: Monitor,
    steps: [
      "Open myafvault.com in Microsoft Edge or Google Chrome.",
      "Look for the install icon in the address bar (a monitor with a down arrow), or open the browser menu.",
      "Choose Install MyAFVault / Apps → Install this site as an app.",
      "Pin it to the taskbar or Start menu from the prompt.",
    ],
  },
  {
    id: "mac",
    title: "Mac",
    subtitle: "Safari, Chrome, or Edge",
    Icon: Monitor,
    steps: [
      "Safari: File → Add to Dock (or Share → Add to Dock).",
      "Chrome or Edge: click the install icon in the address bar, then Install.",
      "Open it from the Dock or Applications like a regular Mac app.",
    ],
  },
];

export function InstallSteps({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("grid gap-3", compact ? "" : "sm:grid-cols-2")}>
      {STEPS.map((block) => (
        <section
          key={block.id}
          className="rounded-[var(--radius-md)] border border-border bg-surface p-4 space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary/15 text-primary">
              <block.Icon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{block.title}</h3>
              <p className="text-xs text-muted">{block.subtitle}</p>
            </div>
          </div>
          <ol className="space-y-1.5 pl-1">
            {block.steps.map((step, i) => (
              <li
                key={step}
                className="flex gap-2 text-sm leading-relaxed text-muted"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {!compact && (
        <p className="sm:col-span-2 text-xs text-subtle flex items-start gap-1.5">
          <Share className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          After install, sign in once. Your vault stays in the cloud — the app
          is just a shortcut to this site.
          <SquarePlus className="hidden" />
        </p>
      )}
    </div>
  );
}
