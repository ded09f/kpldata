import type { Match } from '@/types'

export interface RankRow {
  teamId: string
  wins: number
  losses: number
  points: number
  gameWins: number
  gameLosses: number
  gameDiff: number
}

/** 从已完成+假设结果计算组内排名：积分→净胜局(小分)→相互战绩→小分胜场→字典序 */
export function rankGroup(
  teamIds: string[],
  completed: Match[],
  hypothetical: Array<{
    home: string
    away: string
    winner: string
    scoreHome?: number
    scoreAway?: number
  }>,
): string[] {
  const stats: Record<string, RankRow> = {}
  for (const id of teamIds) {
    stats[id] = {
      teamId: id,
      wins: 0,
      losses: 0,
      points: 0,
      gameWins: 0,
      gameLosses: 0,
      gameDiff: 0,
    }
  }

  const h2hWins: Record<string, Record<string, number>> = {}
  for (const a of teamIds) {
    h2hWins[a] = {}
    for (const b of teamIds) h2hWins[a][b] = 0
  }

  const apply = (home: string, away: string, winner: string, gwHome: number, gwAway: number) => {
    if (!stats[home] || !stats[away]) return
    const loser = winner === home ? away : home
    stats[winner].wins += 1
    stats[winner].points += 1
    stats[loser].losses += 1
    stats[home].gameWins += gwHome
    stats[home].gameLosses += gwAway
    stats[away].gameWins += gwAway
    stats[away].gameLosses += gwHome
    h2hWins[winner][loser] += 1
  }

  for (const m of completed) {
    if (m.status !== 'completed' || !m.winner || !m.score) continue
    if (!stats[m.home] || !stats[m.away]) continue
    apply(m.home, m.away, m.winner, m.score.home, m.score.away)
  }
  for (const h of hypothetical) {
    const sh = h.scoreHome ?? (h.winner === h.home ? 3 : 1)
    const sa = h.scoreAway ?? (h.winner === h.away ? 3 : 1)
    apply(h.home, h.away, h.winner, sh, sa)
  }

  for (const id of teamIds) {
    stats[id].gameDiff = stats[id].gameWins - stats[id].gameLosses
  }

  const ids = [...teamIds]
  ids.sort((a, b) => {
    const sa = stats[a]
    const sb = stats[b]
    if (sb.points !== sa.points) return sb.points - sa.points
    if (sb.gameDiff !== sa.gameDiff) return sb.gameDiff - sa.gameDiff
    const h2h = (h2hWins[b][a] ?? 0) - (h2hWins[a][b] ?? 0)
    if (h2h !== 0) return h2h
    if (sb.gameWins !== sa.gameWins) return sb.gameWins - sa.gameWins
    return a.localeCompare(b)
  })
  return ids
}

export type Stage2Label = 'S3-lock' | 'seat-SA' | 'A3-lock' | 'seat-AB' | 'elim-B'

export function labelFromStage2Rank(group: 'S' | 'A' | 'B', rank: number): Stage2Label {
  if (group === 'S') return rank <= 4 ? 'S3-lock' : 'seat-SA'
  if (group === 'A') {
    if (rank <= 2) return 'seat-SA'
    if (rank <= 4) return 'A3-lock'
    return 'seat-AB'
  }
  return rank <= 2 ? 'seat-AB' : 'elim-B'
}

export type PlayoffLabel = 'upper' | 'lower-R2' | 'lower-R1' | 'out-A56' | 'out-early'

/** 第三轮结束后的季后赛入口（官方4.2 + 公开赛历轮次） */
export function playoffLabelFromStage3(group: 'S' | 'A', rank: number): PlayoffLabel {
  if (group === 'S') {
    if (rank <= 4) return 'upper'
    return 'lower-R2'
  }
  if (rank <= 4) return 'lower-R1'
  return 'out-A56'
}
