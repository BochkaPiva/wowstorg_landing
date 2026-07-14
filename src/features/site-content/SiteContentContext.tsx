import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { LandingContentDraft } from "@entities/admin/model";
import { defaultLandingContentDraft, loadLocalDraft, normalizeLandingContent } from "@features/admin-content/localDraftRepository";
import { supabase } from "@shared/api/supabase";

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
    loading: !isPreview && Boolean(supabase),
    source: isPreview ? "preview" : "default",
  }));

  useEffect(() => {
    if (isPreview || !supabase) return;
    let active = true;
    supabase.from("published_content").select("payload").eq("content_key", "landing").maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && isLandingContent(data?.payload)) {
          setState({ content: normalizeLandingContent(data.payload), loading: false, source: "published" });
        } else {
          setState((current) => ({ ...current, loading: false }));
        }
      });
    return () => { active = false; };
  }, [isPreview]);

  const value = useMemo(() => state, [state]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error("useSiteContent must be used inside SiteContentProvider");
  return context;
}
