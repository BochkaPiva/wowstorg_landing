export type ContentBlockKind =
  | "hero"
  | "statement"
  | "formats"
  | "games"
  | "use_cases"
  | "process"
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
