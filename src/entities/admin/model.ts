export type AdminWorkspaceSection =
  | "overview"
  | "pages"
  | "catalog"
  | "cases"
  | "leads"
  | "integration";

export type ContentLink = {
  label: string;
  href: string;
};

export type TrustLogo = {
  name: string;
  imagePath: string;
  href: string;
};

export type LandingFormat = {
  title: string;
  text: string;
  note: string;
};

export type CatalogSectionContent = {
  id: string;
  index: string;
  tab: string;
  title: string;
  subtitle: string;
  description: string;
};

export type PortfolioProject = {
  number: string;
  title: string;
  meta: string;
  lead: string;
  facts: string[];
  result: string;
  cover: string;
  gallery: Array<{ src: string; alt: string }>;
};

export type PortfolioCollection = {
  title: string;
  meta: string;
  code: string;
  projects: PortfolioProject[];
};

export type StorySceneContent = {
  title: string;
  text: string;
  aside: string;
  align: "left" | "right" | "center";
  action: ContentLink | null;
};

export type LegalDocumentContent = {
  title: string;
  status: string;
  introduction: string;
  revision: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
};

export type LandingContentDraft = {
  version: 3;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    ctaLabel: string;
    videoPath: string;
  };
  trust: {
    label: string;
    items: TrustLogo[];
  };
  formats: {
    eyebrow: string;
    title: string;
    summary: string;
    catalogNote: string;
    catalogCtaLabel: string;
    items: LandingFormat[];
  };
  catalogGateway: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    ctaLabel: string;
    sections: CatalogSectionContent[];
  };
  cases: {
    eyebrow: string;
    title: string;
    description: string;
    collections: PortfolioCollection[];
  };
  story: {
    label: string;
    scenes: StorySceneContent[];
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  leadForm: {
    eyebrow: string;
    title: string;
    description: string;
    eventTypes: string[];
    guestRanges: string[];
    contactTypes: string[];
  };
  contacts: {
    email: string;
    phones: [string, string];
    city: string;
  };
  legal: {
    privacy: LegalDocumentContent;
    personalData: LegalDocumentContent;
    cookies: LegalDocumentContent;
  };
  footer: {
    heading: string;
    description: string;
    locationDescription: string;
  };
};

export type LandingLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "rejected"
  | "converted";

export type LandingLead = {
  id: string;
  status: LandingLeadStatus;
  source: "landing" | "manual";
  name: string;
  company?: string;
  contactType?: string;
  contact: string;
  eventType?: string;
  guestRange?: string;
  eventDate?: string;
  dateIsFlexible?: boolean;
  message?: string;
  catalogSelectionIds: string[];
  createdAt: string;
  convertedProjectId?: string;
};

export type CatalogInventoryReference = {
  publicCatalogItemId: string;
  sourceInventoryId: string;
  sourceSystem: "webapp-wowstorg";
  syncedAt?: string;
};
