// The three admission routes a Vietnamese student might use
export type RouteId = "thpt" | "hsa" | "sat";
export type RouteFilter = RouteId | "all";

export interface Interests {
  universityIds: string[];
  categoryIds: string[];
}

export interface Catalog {
  universities: { id: string; name: string; shortName: string }[];
  categories: { id: string; label: string }[];
}

export interface Progress {
  completedTaskIds: string[];
  scores: Record<RouteId, number>;
  interests: Interests;
}

// Each source links back to an official government or university page
export type SourceStatus = "Verified" | "Archived" | "Needs review";

export interface Source {
  id: string;
  shortLabel: string;
  title: string;
  publisher: string;
  url: string;
  cycle: string;
  publishedAt: string;
  verifiedAt: string;
  status: SourceStatus;
  fields: string[];
  note: string;
}

// A step in the admission timeline (e.g. "register preferences")
export interface Milestone {
  id: string;
  phase: string;
  title: string;
  plainLanguage: string;
  displayDate: string;
  routeIds: RouteId[];
  sourceIds: string[];
  checklist: string[];
  status: "complete" | "next" | "later";
}

// Historical score cutoffs from a specific university + year
export interface Benchmark {
  id: string;
  university: string;
  universityId: string;
  program: string;
  programId: string;
  code: string;
  campus: string | null;
  categoryIds: string[];
  methodId: string;
  methodLabel: string;
  subjectGroups: string[];
  admissionRound: string;
  score: number;
  scale: number;
  cycle: string;
  sourceId: string;
  note: string;
}

// Auth response from the server
export interface AuthUser {
  id: number;
  name: string;
  grade: string | null;
}

// Route metadata (from the routes table)
export interface RouteInfo {
  label: string;
  detail: string;
  scale: number;
}
