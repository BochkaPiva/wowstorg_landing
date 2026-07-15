import { getPublicMediaUrl, requireSupabase } from "@shared/api/supabase";

export type CatalogCategory = {
  id: "teambuilding" | "welcome" | "game_zone" | "props";
  title: string;
  description: string;
  sortOrder: number;
  isVisible: boolean;
};

export type CatalogMediaRecord = {
  id: string;
  storagePath: string;
  src: string;
  alt: string;
  sortOrder: number;
};

export type CatalogItemRecord = {
  id: string;
  categoryId: CatalogCategory["id"];
  kind: "package" | "zone" | "service" | "prop";
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  effectStatement: string;
  priceFrom: number | null;
  priceUnit: string | null;
  stockQuantity: number | null;
  guestMin: number | null;
  guestMax: number | null;
  durationMin: number | null;
  durationMax: number | null;
  includedItems: string[];
  requirements: string[];
  badges: string[];
  leadIntent: "consultation" | "estimate" | "selection" | "rent";
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  sortOrder: number;
  updatedAt: string;
  media: CatalogMediaRecord[];
};

type CatalogItemRow = {
  id: string;
  category_id: CatalogCategory["id"];
  kind: CatalogItemRecord["kind"];
  slug: string;
  title: string;
  short_description: string;
  description: string;
  effect_statement: string;
  price_from: number | string | null;
  price_unit: string | null;
  stock_quantity: number | null;
  guest_min: number | null;
  guest_max: number | null;
  duration_min: number | null;
  duration_max: number | null;
  included_items: string[];
  requirements: string[];
  badges: string[];
  lead_intent: CatalogItemRecord["leadIntent"];
  status: CatalogItemRecord["status"];
  is_featured: boolean;
  sort_order: number;
  updated_at: string;
  catalog_media?: Array<{ id: string; storage_path: string; alt_text: string; sort_order: number }>;
};

function mapItem(row: CatalogItemRow): CatalogItemRecord {
  return {
    id: row.id,
    categoryId: row.category_id,
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    effectStatement: row.effect_statement,
    priceFrom: row.price_from === null ? null : Number(row.price_from),
    priceUnit: row.price_unit,
    stockQuantity: row.stock_quantity,
    guestMin: row.guest_min,
    guestMax: row.guest_max,
    durationMin: row.duration_min,
    durationMax: row.duration_max,
    includedItems: row.included_items ?? [],
    requirements: row.requirements ?? [],
    badges: row.badges ?? [],
    leadIntent: row.lead_intent,
    status: row.status,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    media: (row.catalog_media ?? []).sort((a, b) => a.sort_order - b.sort_order).map((media) => ({
      id: media.id,
      storagePath: media.storage_path,
      src: getPublicMediaUrl(media.storage_path),
      alt: media.alt_text,
      sortOrder: media.sort_order,
    })),
  };
}

export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  const { data, error } = await requireSupabase().from("catalog_categories")
    .select("id, title, description, sort_order, is_visible")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as CatalogCategory["id"],
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
  }));
}

export async function listCatalogItems(): Promise<CatalogItemRecord[]> {
  const { data, error } = await requireSupabase().from("catalog_items")
    .select("*, catalog_media(id, storage_path, alt_text, sort_order)")
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as CatalogItemRow[]).map(mapItem);
}

export type CatalogItemInput = Omit<CatalogItemRecord, "id" | "updatedAt" | "media">;

function toPayload(input: CatalogItemInput, userId: string) {
  return {
    category_id: input.categoryId,
    kind: input.kind,
    slug: input.slug,
    title: input.title.trim(),
    short_description: input.shortDescription.trim(),
    description: input.description.trim(),
    effect_statement: input.effectStatement.trim(),
    price_from: input.priceFrom,
    price_unit: input.priceUnit || null,
    stock_quantity: input.stockQuantity,
    guest_min: input.guestMin,
    guest_max: input.guestMax,
    duration_min: input.durationMin,
    duration_max: input.durationMax,
    included_items: input.includedItems.filter(Boolean),
    requirements: input.requirements.filter(Boolean),
    badges: input.badges.filter(Boolean),
    lead_intent: input.leadIntent,
    status: input.status,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    updated_by: userId,
  };
}

export async function saveCatalogItem(id: string | null, input: CatalogItemInput, userId: string): Promise<CatalogItemRecord> {
  const client = requireSupabase();
  const query = id
    ? client.from("catalog_items").update(toPayload(input, userId)).eq("id", id)
    : client.from("catalog_items").insert(toPayload(input, userId));
  const { data, error } = await query.select("*, catalog_media(id, storage_path, alt_text, sort_order)").single();
  if (error) throw error;
  return mapItem(data as CatalogItemRow);
}

export async function archiveCatalogItem(id: string, userId: string) {
  const { error } = await requireSupabase().from("catalog_items").update({ status: "archived", updated_by: userId }).eq("id", id);
  if (error) throw error;
}

export async function uploadCatalogImage(itemId: string, file: File, alt: string, sortOrder: number) {
  const allowed = new Map([
    ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"],
  ]);
  const extension = allowed.get(file.type);
  if (!extension) throw new Error("Поддерживаются JPG, PNG, WebP и AVIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Файл должен быть не больше 10 МБ.");
  if (alt.trim().length < 2) throw new Error("Добавьте короткое описание изображения для доступности и SEO.");

  const client = requireSupabase();
  const storagePath = `catalog/${itemId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage.from("site-media").upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error: rowError } = await client.from("catalog_media").insert({
    item_id: itemId,
    storage_path: storagePath,
    alt_text: alt.trim(),
    sort_order: sortOrder,
  }).select("id, storage_path, alt_text, sort_order").single();
  if (rowError) {
    await client.storage.from("site-media").remove([storagePath]);
    throw rowError;
  }
  return {
    id: data.id,
    storagePath: data.storage_path,
    src: getPublicMediaUrl(data.storage_path),
    alt: data.alt_text,
    sortOrder: data.sort_order,
  } satisfies CatalogMediaRecord;
}

export async function deleteCatalogImage(media: CatalogMediaRecord) {
  const client = requireSupabase();
  const { error } = await client.from("catalog_media").delete().eq("id", media.id);
  if (error) throw error;
  const { error: storageError } = await client.storage.from("site-media").remove([media.storagePath]);
  if (storageError) throw storageError;
}
