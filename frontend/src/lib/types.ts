// =============================================================================
// TypeScript Types — Mirrors Phase 1/2 Prisma Models
// =============================================================================

export enum Role {
  ADMIN = "ADMIN",
  VOTER = "VOTER",
}

export enum ElectionStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Election {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: ElectionStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    candidates: number;
    voterRegistries: number;
    ballots: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface VoterRegistryEntry {
  id: string;
  userId: string;
  hasVoted: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ElectionDetail extends Election {
  candidates: Candidate[];
  voterRegistries: VoterRegistryEntry[];
}

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  voteCount: number;
}

export interface ElectionResults {
  election: {
    id: string;
    title: string;
    status: ElectionStatus;
  };
  totalRegistered: number;
  totalVotesCast: number;
  turnoutPercent: number;
  results: CandidateResult[];
}

export interface JwtPayload {
  userId: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface ApiError {
  error: string;
}
