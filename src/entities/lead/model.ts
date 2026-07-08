export type LeadSource = "landing" | "b2b-webapp" | "manual";

export type LeadStatus = "new" | "in_progress" | "qualified" | "archived";

export type Lead = {
  id: string;
  status: LeadStatus;
  source: LeadSource;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  eventDate?: string;
  eventFormat?: string;
  guestCount?: number;
  message?: string;
  utm?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};
