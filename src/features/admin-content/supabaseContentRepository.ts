import type { LandingContentDraft } from "@entities/admin/model";
import { defaultLandingContentDraft, normalizeLandingContent } from "./localDraftRepository";
import { requireSupabase } from "@shared/api/supabase";

export type ContentDocument = {
  id: string | null;
  content: LandingContentDraft;
  version: number;
  updatedAt: string | null;
};

function isLandingContent(value: unknown): value is LandingContentDraft {
  return Boolean(value && typeof value === "object" && (value as LandingContentDraft).version === 3);
}

export async function loadLandingDocument(): Promise<ContentDocument> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("content_documents")
    .select("id, draft_payload, version, updated_at")
    .eq("content_key", "landing")
    .maybeSingle();
  if (error) throw error;
  return {
    id: data?.id ?? null,
    content: isLandingContent(data?.draft_payload) ? normalizeLandingContent(data.draft_payload) : structuredClone(defaultLandingContentDraft),
    version: data?.version ?? 1,
    updatedAt: data?.updated_at ?? null,
  };
}

export async function saveLandingDocument(document: ContentDocument, userId: string): Promise<ContentDocument> {
  const client = requireSupabase();
  const payload = {
    content_key: "landing",
    draft_payload: { ...document.content, updatedAt: new Date().toISOString() },
    updated_by: userId,
  };
  const { data, error } = document.id
    ? await client.from("content_documents").update(payload).eq("id", document.id).select("id, draft_payload, version, updated_at").single()
    : await client.from("content_documents").insert(payload).select("id, draft_payload, version, updated_at").single();
  if (error) throw error;
  return {
    id: data.id,
    content: data.draft_payload as LandingContentDraft,
    version: data.version,
    updatedAt: data.updated_at,
  };
}

export async function publishLandingDocument(document: ContentDocument): Promise<number> {
  if (!document.id) throw new Error("Сначала сохраните черновик.");
  const client = requireSupabase();
  const { data, error } = await client.rpc("publish_content", {
    document_id: document.id,
    expected_version: document.version,
  });
  if (error) throw error;
  return Number(data);
}
