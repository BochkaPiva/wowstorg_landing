export type CatalogSection = "teambuilding" | "welcome" | "game_zone" | "props";

export type CatalogItemKind = "package" | "zone" | "service" | "prop";

export type CatalogPublicationStatus = "draft" | "published" | "archived";

export type CatalogAudience =
  | "hr"
  | "marketing"
  | "event_manager"
  | "business_owner"
  | "agency_partner";

export type CatalogMedia = {
  id: string;
  src: string;
  alt: string;
  kind: "image" | "video";
  sortOrder: number;
};

export type CatalogPackageDetails = {
  durationMinutes?: { min: number; max: number };
  guestCount?: { min: number; max?: number };
  venueRequirements?: string[];
  includedInventoryIds: string[];
  optionalInventoryIds?: string[];
  staffing?: string[];
};

export type CatalogItem = {
  id: string;
  section: CatalogSection;
  kind: CatalogItemKind;
  slug: string;
  title: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  audience: CatalogAudience[];
  useCases: string[];
  effectStatement: string;
  media: CatalogMedia[];
  packageDetails?: CatalogPackageDetails;
  sourceInventoryId?: string;
  leadIntent: "consultation" | "estimate" | "selection" | "rent";
  isFeatured: boolean;
  publicationStatus: CatalogPublicationStatus;
  sortOrder: number;
  updatedAt: string;
};

export type PublicCatalogItem = Omit<
  CatalogItem,
  "sourceInventoryId" | "publicationStatus"
>;
