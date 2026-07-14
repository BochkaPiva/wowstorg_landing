import { getPublicMediaUrl, requireSupabase } from "@shared/api/supabase";

export type PortfolioCollectionRecord = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  isVisible: boolean;
};

export type PortfolioMediaRecord = {
  id: string;
  storagePath: string;
  src: string;
  alt: string;
  isCover: boolean;
  sortOrder: number;
};

export type PortfolioProjectRecord = {
  id: string;
  collectionId: string;
  slug: string;
  title: string;
  meta: string;
  lead: string;
  facts: string[];
  result: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  updatedAt: string;
  media: PortfolioMediaRecord[];
};

type ProjectRow = {
  id: string;
  collection_id: string;
  slug: string;
  title: string;
  meta: string;
  lead: string;
  facts: string[];
  result: string;
  status: PortfolioProjectRecord["status"];
  sort_order: number;
  updated_at: string;
  portfolio_media?: Array<{ id: string; storage_path: string; alt_text: string; is_cover: boolean; sort_order: number }>;
};

function mapProject(row: ProjectRow): PortfolioProjectRecord {
  return {
    id: row.id,
    collectionId: row.collection_id,
    slug: row.slug,
    title: row.title,
    meta: row.meta,
    lead: row.lead,
    facts: row.facts ?? [],
    result: row.result,
    status: row.status,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    media: (row.portfolio_media ?? []).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order).map((media) => ({
      id: media.id,
      storagePath: media.storage_path,
      src: getPublicMediaUrl(media.storage_path),
      alt: media.alt_text,
      isCover: media.is_cover,
      sortOrder: media.sort_order,
    })),
  };
}

export async function listPortfolio() {
  const client = requireSupabase();
  const [collectionsResult, projectsResult] = await Promise.all([
    client.from("portfolio_collections").select("id, title, description, sort_order, is_visible").order("sort_order"),
    client.from("portfolio_projects").select("*, portfolio_media(id, storage_path, alt_text, is_cover, sort_order)").order("sort_order").order("created_at", { ascending: false }),
  ]);
  if (collectionsResult.error) throw collectionsResult.error;
  if (projectsResult.error) throw projectsResult.error;
  return {
    collections: (collectionsResult.data ?? []).map((row) => ({ id: row.id, title: row.title, description: row.description, sortOrder: row.sort_order, isVisible: row.is_visible })) as PortfolioCollectionRecord[],
    projects: ((projectsResult.data ?? []) as ProjectRow[]).map(mapProject),
  };
}

export type PortfolioProjectInput = Omit<PortfolioProjectRecord, "id" | "updatedAt" | "media">;

export async function savePortfolioProject(id: string | null, input: PortfolioProjectInput, userId: string) {
  const client = requireSupabase();
  const payload = {
    collection_id: input.collectionId,
    slug: input.slug,
    title: input.title.trim(),
    meta: input.meta.trim(),
    lead: input.lead.trim(),
    facts: input.facts.filter(Boolean),
    result: input.result.trim(),
    status: input.status,
    sort_order: input.sortOrder,
    updated_by: userId,
  };
  const query = id ? client.from("portfolio_projects").update(payload).eq("id", id) : client.from("portfolio_projects").insert(payload);
  const { data, error } = await query.select("*, portfolio_media(id, storage_path, alt_text, is_cover, sort_order)").single();
  if (error) throw error;
  return mapProject(data as ProjectRow);
}

export async function uploadPortfolioImage(projectId: string, file: File, alt: string, sortOrder: number, isCover: boolean) {
  const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);
  const extension = allowed.get(file.type);
  if (!extension) throw new Error("Поддерживаются JPG, PNG, WebP и AVIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Файл должен быть не больше 10 МБ.");
  if (alt.trim().length < 2) throw new Error("Добавьте описание изображения.");
  const client = requireSupabase();
  const storagePath = `cases/${projectId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage.from("site-media").upload(storagePath, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  if (isCover) await client.from("portfolio_media").update({ is_cover: false }).eq("project_id", projectId);
  const { data, error } = await client.from("portfolio_media").insert({ project_id: projectId, storage_path: storagePath, alt_text: alt.trim(), sort_order: sortOrder, is_cover: isCover }).select("id, storage_path, alt_text, is_cover, sort_order").single();
  if (error) { await client.storage.from("site-media").remove([storagePath]); throw error; }
  return { id: data.id, storagePath: data.storage_path, src: getPublicMediaUrl(data.storage_path), alt: data.alt_text, isCover: data.is_cover, sortOrder: data.sort_order } satisfies PortfolioMediaRecord;
}

export async function deletePortfolioImage(media: PortfolioMediaRecord) {
  const client = requireSupabase();
  const { error } = await client.from("portfolio_media").delete().eq("id", media.id);
  if (error) throw error;
  const { error: storageError } = await client.storage.from("site-media").remove([media.storagePath]);
  if (storageError) throw storageError;
}
