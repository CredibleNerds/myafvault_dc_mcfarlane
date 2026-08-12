import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const INBOX = "myafvault@crediblenerds.com";

const TOPICS = [
  { id: "question", label: "Question", subject: "Question about MyAFVault" },
  { id: "feedback", label: "Feedback", subject: "Feedback on MyAFVault" },
  { id: "other", label: "Something else", subject: "Note from MyAFVault" },
] as const;

type FeedbackButtonProps = {
  className?: string;
  /** Footer-style text link vs a compact header button. */
  variant?: "link" | "button";
};

export function FeedbackButton({
  className,
  variant = "link",
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["id"]>("question");
  const [message, setMessage] = useState("");

  function send() {
    const picked = TOPICS.find((t) => t.id === topic) ?? TOPICS[0];
    const body = message.trim();
    if (!body) {
      toast.error("Write a short note first");
      return;
    }
    const href = `mailto:${INBOX}?subject=${encodeURIComponent(picked.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setOpen(false);
    setMessage("");
    toast.success("Opening your mail app");
  }

  return (
    <>
      {variant === "button" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("gap-1.5", className)}
          onClick={() => setOpen(true)}
        >
          <Mail className="h-3.5 w-3.5" />
          Questions & feedback
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg",
            className,
          )}
        >
          <Mail className="h-4 w-4" />
          Questions & feedback

        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Questions & feedback</DialogTitle>
            <DialogDescription>
              Send a question, an idea, or a note about something that isn’t
              working. Your mail app opens with the message ready to send — the
              address stays off the page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What’s this about?</Label>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      topic === t.id
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-muted hover:text-fg",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-note">Your note</Label>
              <Textarea
                id="feedback-note"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question or tell us what would make the vault better…"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={send}>
                <Mail className="h-4 w-4" />
                Open mail app
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
