const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");

export function resolvePublicMediaUrl(path: string): string {
  const value = path.trim();
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
  if (!supabaseUrl) return value;

  const objectPath = value
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/site-media/${objectPath}`;
}
