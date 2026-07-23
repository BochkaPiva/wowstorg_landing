import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileApi = {
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileWidgetHandle = {
  execute: () => Promise<string>;
  reset: () => void;
};

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

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, {
  siteKey: string;
  onError: (code?: string) => void;
  onReady: (ready: boolean) => void;
}>(function TurnstileWidget({ siteKey, onError, onReady }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef("");
  const pendingRef = useRef<{
    reject: (error: Error) => void;
    resolve: (token: string) => void;
    timeout: number;
  } | null>(null);

  const rejectPending = (message: string) => {
    const pending = pendingRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timeout);
    pending.reject(new Error(message));
    pendingRef.current = null;
  };

  useImperativeHandle(ref, () => ({
    execute: () => new Promise<string>((resolve, reject) => {
      const widgetId = widgetIdRef.current;
      if (!widgetId || !window.turnstile) {
        reject(new Error("Проверка безопасности ещё загружается. Подождите секунду и отправьте снова."));
        return;
      }

      rejectPending("Проверка безопасности была перезапущена.");
      window.turnstile.reset(widgetId);
      const timeout = window.setTimeout(() => {
        pendingRef.current = null;
        reject(new Error("Проверка безопасности заняла слишком много времени. Попробуйте отправить ещё раз."));
      }, 20_000);
      pendingRef.current = { resolve, reject, timeout };
      window.turnstile.execute(widgetId);
    }),
    reset: () => {
      rejectPending("Проверка безопасности была сброшена.");
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    onReady(false);

    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "lead-form",
          theme: "light",
          size: "flexible",
          appearance: "execute",
          execution: "execute",
          retry: "auto",
          "refresh-expired": "auto",
          "refresh-timeout": "auto",
          callback: (token: string) => {
            const pending = pendingRef.current;
            if (!pending) return;
            window.clearTimeout(pending.timeout);
            pending.resolve(token);
            pendingRef.current = null;
          },
          "expired-callback": () => rejectPending("Проверка безопасности устарела. Отправьте форму ещё раз."),
          "timeout-callback": () => rejectPending("Проверка безопасности не завершилась. Отправьте форму ещё раз."),
          "error-callback": (code: string) => {
            rejectPending("Не удалось пройти проверку безопасности. Попробуйте ещё раз.");
            onError(code);
          },
        });
        onReady(true);
      })
      .catch(() => onError());

    return () => {
      cancelled = true;
      onReady(false);
      rejectPending("Проверка безопасности была закрыта.");
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      widgetIdRef.current = "";
    };
  }, [onError, onReady, siteKey]);

  return <div className="brief-turnstile" ref={containerRef} aria-label="Защита формы от автоматических отправок" />;
});
