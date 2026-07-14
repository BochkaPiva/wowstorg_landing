import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loader) return loader;

  const pending = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-wowstorg-turnstile="true"]');
    const script = existing ?? document.createElement("script");
    const finish = () => window.turnstile
      ? resolve(window.turnstile)
      : reject(new Error("Turnstile unavailable"));

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")), { once: true });
    if (!existing) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.wowstorgTurnstile = "true";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    loader = null;
    throw error;
  });

  loader = pending;
  return pending;
}

export function TurnstileWidget({ siteKey, onToken, onError }: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: (code?: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let widgetId = "";

    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "lead-form",
          theme: "light",
          size: "flexible",
          appearance: "interaction-only",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(""),
          "timeout-callback": () => onToken(""),
          "error-callback": (code: string) => {
            onToken("");
            onError(code);
          },
        });
      })
      .catch(() => onError());

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onError, onToken, siteKey]);

  return <div className="brief-turnstile" ref={containerRef} aria-label="Защита формы от автоматических отправок" />;
}
