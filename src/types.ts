export interface Cuboid {
  id: number;
  row: number;
  column: number;
  worldX: number;
  worldZ: number;
  baseHeight: number;
  currentHeight: number;
  targetHeight: number;
  initialScale: number;
  preFinalScale: number;
  targetScale: number;
  currentScale: number;
  horizontalScale?: number;
  propagationDelay: number;
  isLogo: boolean;
  logoType: number; // 0 = non-logo, 1 = white left stem, 2 = electric blue right stem/crossbar
  layerMetric: number; // Layered floor metric for architectural construction wave
  outerEdges?: number[]; // [left, right, top, bottom] outer boundary indicators (1 = outer edge, 0 = inner)
  offsetX?: number;
  offsetZ?: number;
  hasFinalLocking: boolean;
  startDelay: number;
  duration: number;
}

export type HoverMode = 'elevate' | 'ripple' | 'dent' | 'pulse';
export type ColorTheme = 'cyber-blue' | 'synthwave' | 'matrix-green' | 'amber-gold' | 'neon-purple' | 'ice-white';

export interface MatrixSettings {
  gridCols: number;
  gridRows: number;
  cubeSize: number;
  cubeGap: number;
}

export interface ShowcaseSubmission {
  id?: string;
  createdAt?: string;
  submittedAt?: string;

  // SECTION: TEAM
  teamName: string;
  teamMembers: string;
  organization: string;
  teamRepresentative: string;
  contactEmail: string;
  socialHandles?: string;

  // SECTION: PROJECT
  projectName: string;
  shortDescription: string;
  problemStatement: string;
  solutionApproach: string;
  techStack: string;

  // SECTION: PROJECT LINKS
  repositoryUrl?: string;
  prototypeUrl?: string;
  demoVideoUrl?: string;
  documentationUrl?: string;

  // SECTION: SHOWCASE
  consentGiven: boolean;
}

export type ShowcaseFormErrors = Partial<Record<keyof ShowcaseSubmission | 'form', string>>;

export interface ShowcaseDbRecord {
  id: string;
  team_name: string;
  team_representative: string;
  contact_email: string;
  organization: string;
  team_members: string;
  social_handles: string | null;
  project_name: string;
  short_description: string;
  problem_statement: string;
  solution_approach: string;
  tech_stack: string;
  repository_url: string;
  prototype_url: string;
  demo_video_url: string;
  documentation_url: string | null;
  consent_given: boolean;
  created_at: string;
}

