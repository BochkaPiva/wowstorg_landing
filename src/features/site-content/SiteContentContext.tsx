import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { LandingContentDraft } from "@entities/admin/model";
import { defaultLandingContentDraft, loadLocalDraft, normalizeLandingContent } from "@features/admin-content/localDraftRepository";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const canLoadPublishedContent = Boolean(supabaseUrl && supabasePublishableKey);

type SiteContentState = {
  content: LandingContentDraft;
  loading: boolean;
  source: "default" | "preview" | "published";
};

const SiteContentContext = createContext<SiteContentState | null>(null);

function isLandingContent(value: unknown): value is LandingContentDraft {
  if (!value || typeof value !== "object") return false;
  const content = value as Partial<LandingContentDraft>;
  return content.version === 3 && Boolean(content.hero && content.formats && content.leadForm);
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const isPreview = new URLSearchParams(window.location.search).get("preview") === "local";
  const [state, setState] = useState<SiteContentState>(() => ({
    content: isPreview ? loadLocalDraft() : structuredClone(defaultLandingContentDraft),
    loading: !isPreview && canLoadPublishedContent,
    source: isPreview ? "preview" : "default",
  }));

  useEffect(() => {
    if (isPreview || !canLoadPublishedContent) return;
    const controller = new AbortController();
    const endpoint = `${supabaseUrl}/rest/v1/published_content?content_key=eq.landing&select=payload&limit=1`;
    void fetch(endpoint, {
      headers: {
        apikey: supabasePublishableKey!,
        Authorization: `Bearer ${supabasePublishableKey!}`,
      },
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Published content request failed: ${response.status}`);
      const rows = await response.json() as Array<{ payload?: unknown }>;
      const payload = rows[0]?.payload;
      if (isLandingContent(payload)) {
        setState({ content: normalizeLandingContent(payload), loading: false, source: "published" });
      } else {
        setState((current) => ({ ...current, loading: false }));
      }
    }).catch(() => {
      if (controller.signal.aborted) return;
      setState((current) => ({ ...current, loading: false }));
    });
    return () => controller.abort();
  }, [isPreview]);

  const value = useMemo(() => state, [state]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error("useSiteContent must be used inside SiteContentProvider");
  return context;
}
