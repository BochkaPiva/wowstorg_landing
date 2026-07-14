import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "wowstorg.admin.session",
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase не настроен. Проверьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  return supabase;
}

export function getPublicMediaUrl(storagePath: string) {
  if (!storagePath) return "";
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  if (!supabase) return storagePath.startsWith("/") ? storagePath : `/${storagePath}`;
  return supabase.storage.from("site-media").getPublicUrl(storagePath).data.publicUrl;
}

export async function uploadSiteImage(folder: "logos" | "landing", file: File) {
  const extensions = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);
  const extension = extensions.get(file.type);
  if (!extension) throw new Error("Поддерживаются JPG, PNG, WebP и AVIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Файл должен быть не больше 10 МБ.");
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await requireSupabase().storage.from("site-media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
