"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads ?tempPassword=...&for=... from the URL once on mount, shows a banner
 * with a copy button, and strips the query params from the URL so a refresh
 * won't re-render the credential.
 */
export function TempPasswordBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Lazy state initialiser runs once on mount; we never call setSnapshot, so
  // a later router.replace() doesn't lose the value.
  const [snapshot] = useState<{ pwd: string; who: string } | null>(() => {
    const pwd = params.get("tempPassword");
    const who = params.get("for");
    return pwd && who ? { pwd, who } : null;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!snapshot) return;
    const next = new URLSearchParams(params.toString());
    next.delete("tempPassword");
    next.delete("for");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // Effect should run once on mount with the initial URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!snapshot) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snapshot.pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select manually */
    }
  };

  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
      <p className="font-semibold text-amber-100">Temporary password for {snapshot.who}</p>
      <p className="mt-1 text-amber-100/80">
        Share this with the user. It will not be shown again — generate a new one if you
        miss it.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="rounded-md border border-amber-400/30 bg-black/40 px-3 py-1.5 font-mono text-amber-50 tracking-wide">
          {snapshot.pwd}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-400/25"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
