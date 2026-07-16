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
  isSeeded?: boolean;
};

const seededCatalogCovers: Record<string, { src: string; alt: string }> = {
  "komandnyy-konstruktor": { src: "/catalog-covers/komandnyy-konstruktor.webp", alt: "Команда строит общий город из блочного конструктора" },
  "bolshoy-dachnyy-sezon": { src: "/catalog-covers/bolshoy-dachnyy-sezon.webp", alt: "Участники проходят командное испытание в летнем саду" },
  "komandnyy-blockbuster": { src: "/catalog-covers/komandnyy-blockbuster.webp", alt: "Команда проходит кинематографический маршрут с лазерной сигнализацией" },
  "neolimpiyskie-igry": { src: "/catalog-covers/neolimpiyskie-igry.webp", alt: "Команды соревнуются в необычной спортивной дисциплине" },
  "skazochnye-tropy": { src: "/catalog-covers/skazochnye-tropy.webp", alt: "Команда проходит сказочный верёвочный маршрут в лесу" },
  "stroyka-yarmarka": { src: "/catalog-covers/stroyka-yarmarka.webp", alt: "Команда собирает ярмарочный корнер из бруса, ОСБ и картона" },
};

export type CatalogPropGroup = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
};

export type CatalogItemRecord = {
  id: string;
  categoryId: CatalogCategory["id"];
  propGroupId: string | null;
  kind: "package" | "zone" | "service" | "prop";
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  effectStatement: string;
  priceFrom: number | null;
  priceUnit: string | null;
  stockQuantity: number | null;
  presentationPath: string | null;
  presentationName: string | null;
  presentationUrl: string | null;
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
  prop_group_id: string | null;
  kind: CatalogItemRecord["kind"];
  slug: string;
  title: string;
  short_description: string;
  description: string;
  effect_statement: string;
  price_from: number | string | null;
  price_unit: string | null;
  stock_quantity: number | null;
  presentation_path: string | null;
  presentation_name: string | null;
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
  const storedMedia = (row.catalog_media ?? []).sort((a, b) => a.sort_order - b.sort_order).map((media) => ({
    id: media.id,
    storagePath: media.storage_path,
    src: getPublicMediaUrl(media.storage_path),
    alt: media.alt_text,
    sortOrder: media.sort_order,
  }));
  const seededCover = seededCatalogCovers[row.slug];

  return {
    id: row.id,
    categoryId: row.category_id,
    propGroupId: row.prop_group_id,
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    effectStatement: row.effect_statement,
    priceFrom: row.price_from === null ? null : Number(row.price_from),
    priceUnit: row.price_unit,
    stockQuantity: row.stock_quantity,
    presentationPath: row.presentation_path,
    presentationName: row.presentation_name,
    presentationUrl: row.presentation_path ? getPublicMediaUrl(row.presentation_path) : null,
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
    media: storedMedia.length || !seededCover ? storedMedia : [{
      id: `seed-cover-${row.slug}`,
      storagePath: seededCover.src,
      src: seededCover.src,
      alt: seededCover.alt,
      sortOrder: 0,
      isSeeded: true,
    }],
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

export async function listCatalogPropGroups(includeHidden = false): Promise<CatalogPropGroup[]> {
  let query = requireSupabase().from("catalog_prop_groups")
    .select("id, slug, title, sort_order, is_visible")
    .order("sort_order")
    .order("title");
  if (!includeHidden) query = query.eq("is_visible", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
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

export type PublicCatalogPage = {
  items: CatalogItemRecord[];
  total: number;
};

export async function listPublicCatalogItems({
  categoryId,
  propGroupId = null,
  search = "",
  page = 1,
  pageSize,
}: {
  categoryId: CatalogCategory["id"];
  propGroupId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PublicCatalogPage> {
  let query = requireSupabase().from("catalog_items")
    .select("*, catalog_media(id, storage_path, alt_text, sort_order)", { count: "exact" })
    .eq("category_id", categoryId)
    .eq("status", "published");

  if (categoryId === "props" && propGroupId) query = query.eq("prop_group_id", propGroupId);
  const normalizedSearch = search.trim().replace(/[%_,()]/g, " ").replace(/\s+/g, " ");
  if (normalizedSearch) {
    query = query.or(`title.ilike.%${normalizedSearch}%,short_description.ilike.%${normalizedSearch}%`);
  }

  query = query
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (pageSize) {
    const from = Math.max(0, page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: ((data ?? []) as CatalogItemRow[]).map(mapItem), total: count ?? 0 };
}

export type CatalogItemInput = Omit<CatalogItemRecord, "id" | "updatedAt" | "media" | "presentationUrl">;

function toPayload(input: CatalogItemInput, userId: string) {
  return {
    category_id: input.categoryId,
    prop_group_id: input.categoryId === "props" ? input.propGroupId : null,
    kind: input.kind,
    slug: input.slug,
    title: input.title.trim(),
    short_description: input.shortDescription.trim(),
    description: input.description.trim(),
    effect_statement: input.effectStatement.trim(),
    price_from: input.priceFrom,
    price_unit: input.priceUnit || null,
    stock_quantity: input.stockQuantity,
    presentation_path: input.presentationPath,
    presentation_name: input.presentationName,
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

export async function saveCatalogPropGroup(
  id: string | null,
  input: Omit<CatalogPropGroup, "id">,
  userId: string,
): Promise<CatalogPropGroup> {
  const payload = {
    slug: input.slug,
    title: input.title.trim(),
    sort_order: input.sortOrder,
    is_visible: input.isVisible,
    updated_by: userId,
  };
  const client = requireSupabase();
  const request = id
    ? client.from("catalog_prop_groups").update(payload).eq("id", id)
    : client.from("catalog_prop_groups").insert(payload);
  const { data, error } = await request.select("id, slug, title, sort_order, is_visible").single();
  if (error) throw error;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    sortOrder: data.sort_order,
    isVisible: data.is_visible,
  };
}

export async function deleteCatalogPropGroup(id: string) {
  const { error } = await requireSupabase().from("catalog_prop_groups").delete().eq("id", id);
  if (error) throw error;
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

export async function uploadCatalogImages(
  itemId: string,
  files: Array<{ file: File; alt: string }>,
  startSortOrder = 0,
) {
  const uploaded: CatalogMediaRecord[] = [];
  try {
    for (const [index, entry] of files.entries()) {
      uploaded.push(await uploadCatalogImage(itemId, entry.file, entry.alt, startSortOrder + index));
    }
    return uploaded;
  } catch (cause) {
    await Promise.allSettled(uploaded.map((media) => deleteCatalogImage(media)));
    throw cause;
  }
}

export async function deleteCatalogImage(media: CatalogMediaRecord) {
  if (media.isSeeded) throw new Error("Встроенную обложку нельзя удалить. Загрузите новую фотографию, чтобы заменить её.");
  const client = requireSupabase();
  const { error } = await client.from("catalog_media").delete().eq("id", media.id);
  if (error) throw error;
  const { error: storageError } = await client.storage.from("site-media").remove([media.storagePath]);
  if (storageError) throw storageError;
}

export async function uploadCatalogPresentation(
  itemId: string,
  file: File,
  userId: string,
  previousPath?: string | null,
): Promise<CatalogItemRecord> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Можно загрузить только PDF-файл.");
  }
  if (file.size > 30 * 1024 * 1024) {
    throw new Error("PDF должен быть не больше 30 МБ.");
  }

  const supabase = requireSupabase();
  const { data: currentItem, error: currentItemError } = await supabase
    .from("catalog_items")
    .select("category_id, kind")
    .eq("id", itemId)
    .single();
  if (currentItemError) throw currentItemError;
  if (currentItem.category_id === "props" || currentItem.kind === "prop") {
    throw new Error("Для реквизита презентации не используются.");
  }

  const storagePath = `catalog/${itemId}/presentations/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("site-media")
    .upload(storagePath, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: updateError } = await supabase
    .from("catalog_items")
    .update({ presentation_path: storagePath, presentation_name: file.name, updated_by: userId })
    .eq("id", itemId)
    .select("*, catalog_media(id, storage_path, alt_text, sort_order)")
    .single();
  if (updateError) {
    await supabase.storage.from("site-media").remove([storagePath]);
    throw updateError;
  }

  if (previousPath && previousPath !== storagePath && !/^https?:\/\//i.test(previousPath) && !previousPath.startsWith("/")) {
    const { error: removeError } = await supabase.storage.from("site-media").remove([previousPath]);
    if (removeError) throw removeError;
  }

  return mapItem(data as CatalogItemRow);
}

export async function deleteCatalogPresentation(
  itemId: string,
  storagePath: string,
  userId: string,
): Promise<CatalogItemRecord> {
  const supabase = requireSupabase();
  const { data, error: updateError } = await supabase
    .from("catalog_items")
    .update({ presentation_path: null, presentation_name: null, updated_by: userId })
    .eq("id", itemId)
    .select("*, catalog_media(id, storage_path, alt_text, sort_order)")
    .single();
  if (updateError) throw updateError;
  if (!/^https?:\/\//i.test(storagePath) && !storagePath.startsWith("/")) {
    const { error: storageError } = await supabase.storage.from("site-media").remove([storagePath]);
    if (storageError) throw storageError;
  }
  return mapItem(data as CatalogItemRow);
}
