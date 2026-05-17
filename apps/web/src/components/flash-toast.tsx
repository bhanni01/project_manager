"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Reads ?saved=1 / ?error=<code> / ?rolled=<label> from the URL once on mount,
 * fires the matching toast, and strips the param so a refresh doesn't repeat.
 *
 * `messages` lets a page customise error codes → human-readable strings.
 */
export function FlashToast({
  messages,
  successMessage = "Saved.",
}: {
  messages?: Record<string, string>;
  successMessage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [snapshot] = useState<{ kind: "success" | "error"; message: string } | null>(
    () => {
      const saved = params.get("saved");
      const error = params.get("error");
      const rolled = params.get("rolled");
      if (saved) return { kind: "success", message: successMessage };
      if (rolled) {
        return {
          kind: "success",
          message: `Rolled over. New current fiscal year is ${rolled}.`,
        };
      }
      if (error) {
        const m = messages?.[error] ?? "Something went wrong.";
        return { kind: "error", message: m };
      }
      return null;
    },
  );

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.kind === "success") toast.success(snapshot.message);
    else toast.error(snapshot.message);

    const next = new URLSearchParams(params.toString());
    next.delete("saved");
    next.delete("error");
    next.delete("rolled");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // Run once at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
