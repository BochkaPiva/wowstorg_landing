import type { PortfolioCollectionRecord, PortfolioMediaRecord, PortfolioProjectRecord } from "./portfolioRepository";
import { resolvePublicMediaUrl } from "@shared/lib/publicMedia";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

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

async function publicRest<T>(path: string): Promise<T> {
  if (!supabaseUrl || !supabasePublishableKey) throw new Error("Supabase is not configured");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
    },
  });
  if (!response.ok) throw new Error(`Public portfolio request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function listPublicPortfolio() {
  const [collections, projects] = await Promise.all([
    publicRest<Array<{ id: string; title: string; description: string; sort_order: number; is_visible: boolean }>>(
      "portfolio_collections?select=id,title,description,sort_order,is_visible&is_visible=eq.true&order=sort_order.asc",
    ),
    publicRest<ProjectRow[]>(
      "portfolio_projects?select=*,portfolio_media(id,storage_path,alt_text,is_cover,sort_order)&status=eq.published&order=sort_order.asc,created_at.desc",
    ),
  ]);

  return {
    collections: collections.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
      isVisible: row.is_visible,
    })) satisfies PortfolioCollectionRecord[],
    projects: projects.map((row) => ({
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
      media: (row.portfolio_media ?? [])
        .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
        .map((media) => ({
          id: media.id,
          storagePath: media.storage_path,
          src: resolvePublicMediaUrl(media.storage_path),
          alt: media.alt_text,
          isCover: media.is_cover,
          sortOrder: media.sort_order,
        } satisfies PortfolioMediaRecord)),
    })) satisfies PortfolioProjectRecord[],
  };
}
