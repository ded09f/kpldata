import type { Match, PredictResult, Team } from '@/types'

const ELO_K = 32
const ELO_INIT = 1500
const W_ELO = 0.55
const W_FORM = 0.25
const W_H2H = 0.2
const FORM_WINDOW = 5

function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + 10 ** ((rb - ra) / 400))
}

export function computeElo(matches: Match[], teamIds: string[]): Record<string, number> {
  const elo: Record<string, number> = {}
  for (const id of teamIds) elo[id] = ELO_INIT

  const sorted = [...matches]
    .filter((m) => m.status === 'completed' && m.winner)
    .sort((a, b) => a.date.localeCompare(b.date))

  for (const m of sorted) {
    const ra = elo[m.home] ?? ELO_INIT
    const rb = elo[m.away] ?? ELO_INIT
    const ea = expectedScore(ra, rb)
    const eb = 1 - ea
    const sa = m.winner === m.home ? 1 : 0
    const sb = 1 - sa
    elo[m.home] = ra + ELO_K * (sa - ea)
    elo[m.away] = rb + ELO_K * (sb - eb)
  }
  return elo
}

function recentForm(matches: Match[], teamId: string, window = FORM_WINDOW): number {
  const recent = [...matches]
    .filter(
      (m) =>
        m.status === 'completed' &&
        m.winner &&
        (m.home === teamId || m.away === teamId),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, window)

  if (recent.length === 0) return 0.5
  const wins = recent.filter((m) => m.winner === teamId).length
  return wins / recent.length
}

function headToHead(
  matches: Match[],
  a: string,
  b: string,
): { winsA: number; winsB: number; played: number } {
  let winsA = 0
  let winsB = 0
  for (const m of matches) {
    if (m.status !== 'completed' || !m.winner) continue
    const pair = new Set([m.home, m.away])
    if (!pair.has(a) || !pair.has(b)) continue
    if (m.winner === a) winsA += 1
    else if (m.winner === b) winsB += 1
  }
  return { winsA, winsB, played: winsA + winsB }
}

export function predictMatch(
  matches: Match[],
  teams: Team[],
  teamA: string,
  teamB: string,
): PredictResult {
  const ids = teams.map((t) => t.id)
  const elo = computeElo(matches, ids)
  const eloA = elo[teamA] ?? ELO_INIT
  const eloB = elo[teamB] ?? ELO_INIT
  const eloWinProb = expectedScore(eloA, eloB)

  const formA = recentForm(matches, teamA)
  const formB = recentForm(matches, teamB)
  const formSum = formA + formB
  const formWinProb = formSum === 0 ? 0.5 : formA / formSum

  const h2h = headToHead(matches, teamA, teamB)
  let h2hWinProb = eloWinProb
  if (h2h.played > 0) {
    h2hWinProb = h2h.winsA / h2h.played
  }

  const winProbA = W_ELO * eloWinProb + W_FORM * formWinProb + W_H2H * h2hWinProb
  const clamped = Math.min(0.95, Math.max(0.05, winProbA))

  return {
    teamA,
    teamB,
    winProbA: clamped,
    winProbB: 1 - clamped,
    breakdown: {
      eloWinProb,
      formWinProb,
      h2hWinProb,
      eloA,
      eloB,
      formA,
      formB,
      h2hWinsA: h2h.winsA,
      h2hWinsB: h2h.winsB,
      h2hPlayed: h2h.played,
    },
  }
}

export function buildH2HMatrix(
  matches: Match[],
  teamIds: string[],
): Record<string, Record<string, { wins: number; losses: number }>> {
  const matrix: Record<string, Record<string, { wins: number; losses: number }>> = {}
  for (const a of teamIds) {
    matrix[a] = {}
    for (const b of teamIds) {
      matrix[a][b] = { wins: 0, losses: 0 }
    }
  }
  for (const m of matches) {
    if (m.status !== 'completed' || !m.winner) continue
    if (!matrix[m.home] || !matrix[m.away]) continue
    if (m.winner === m.home) {
      matrix[m.home][m.away].wins += 1
      matrix[m.away][m.home].losses += 1
    } else {
      matrix[m.away][m.home].wins += 1
      matrix[m.home][m.away].losses += 1
    }
  }
  return matrix
}

export const PREDICT_WEIGHTS = { elo: W_ELO, form: W_FORM, h2h: W_H2H, k: ELO_K, init: ELO_INIT }
