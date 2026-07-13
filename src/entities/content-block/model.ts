export type ContentBlockKind =
  | "hero"
  | "statement"
  | "proof"
  | "formats"
  | "services"
  | "catalog_preview"
  | "games"
  | "use_cases"
  | "case_studies"
  | "wow_mechanic"
  | "process"
  | "faq"
  | "final_cta"
  | "footer";

export type ContentBlock = {
  id: string;
  kind: ContentBlockKind;
  slug: string;
  title: string;
  body?: string;
  payload: Record<string, unknown>;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string;
};
