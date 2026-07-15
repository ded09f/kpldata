export type FormatKind =
  | 'ab-groups'
  | 'east-west'
  | 'single-table'
  | 'sab'
  | 'masters-elites'
  | 'knockout'

export type SeasonStatus = 'completed' | 'ongoing' | 'upcoming'
export type SeasonType = 'league' | 'cup' | 'world' | 'grand-finals'

export interface Team {
  id: string
  name: string
  shortName: string
  city?: string
  seatType?: 'fixed' | 'temporary'
  color?: string
}

export interface MatchScore {
  home: number
  away: number
}

export interface Match {
  id: string
  stage: string
  group?: string | null
  date: string
  bo: number
  status: 'completed' | 'scheduled'
  home: string
  away: string
  score: MatchScore | null
  winner: string | null
}

export interface StandingRow {
  teamId: string
  rank: number
  played: number
  wins: number
  losses: number
  points: number
  gameWins: number
  gameLosses: number
  gameDiff: number
  qualification?: string
}

export interface StandingTable {
  group: string
  rows: StandingRow[]
}

export interface StandingStage {
  stage: string
  label: string
  tables: StandingTable[]
}

export interface RuleStage {
  id: string
  name: string
  format: string
  period?: string
}

export interface SeasonRules {
  summary: string
  stages: RuleStage[]
  tiebreakers?: string[]
  formatKind: FormatKind
}

export interface SeasonDetail {
  id: string
  name: string
  year: number
  slug: string
  type: SeasonType
  status: SeasonStatus
  currentStage?: string
  startDate: string
  endDate: string
  prizePool?: string
  formatKind: FormatKind
  default?: boolean
  teams: Team[]
  groups?: Record<string, Record<string, string[]>>
  standings: StandingStage[]
  matches: Match[]
  rules: SeasonRules
  champion?: string | null
  top4?: string[] | null
  fmvp?: string | null
  sources?: string[]
  updatedAt: string
}

export interface SeasonSummary {
  id: string
  year: number
  slug: string
  name: string
  type: SeasonType
  status: SeasonStatus
  formatKind: FormatKind
  startDate: string
  endDate: string
  champion?: string | null
  runnerUp?: string | null
  top4?: string[] | null
  fmvp?: string | null
  summary: string
  rulesSummary: string
  detail?: string
}

export interface SeasonIndex {
  defaultSeasonId: string
  updatedAt: string
  seasons: SeasonSummary[]
}

export interface EraRule {
  id: string
  years: string
  formatKind: FormatKind
  title: string
  body: string
}

export interface PredictBreakdown {
  eloWinProb: number
  formWinProb: number
  h2hWinProb: number
  eloA: number
  eloB: number
  formA: number
  formB: number
  h2hWinsA: number
  h2hWinsB: number
  h2hPlayed: number
}

export interface PredictResult {
  teamA: string
  teamB: string
  winProbA: number
  winProbB: number
  breakdown: PredictBreakdown
}
