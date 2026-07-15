import type { Match, Team } from '@/types'
import { completedInGroup, remainingMatchProbs, type MatchProb } from '@/lib/qualify/outlook'
import { labelFromStage2Rank, rankGroup, type Stage2Label } from '@/lib/qualify/rank'

export interface ScenarioPath {
  /** 剩余场次：true 表示主队胜 */
  results: boolean[]
  prob: number
}

export interface ScenarioGroup {
  fingerprint: string
  order: string[]
  labels: Record<string, Stage2Label>
  probability: number
  paths: ScenarioPath[]
  pathCount: number
}

/**
 * 按组穷举剩余场次，按最终名次指纹分组（官方 4.1.2 排名逻辑）。
 * 剩余场次 > 8 时每组只保留概率最高的 topK 条赛程示例。
 */
export function buildGroupScenarios(
  matches: Match[],
  teams: Team[],
  group: 'S' | 'A' | 'B',
  teamIds: string[],
  topK = 20,
): {
  remaining: MatchProb[]
  groups: ScenarioGroup[]
  totalPaths: number
} {
  void teams
  const remaining = remainingMatchProbs(matches, teams, 'stage2', group)
  const completed = completedInGroup(matches, 'stage2', group)
  const n = remaining.length
  if (n > 14) {
    throw new Error(`Too many remaining matches: ${n}`)
  }
  const totalPaths = 1 << n
  const map = new Map<string, ScenarioGroup>()

  for (let mask = 0; mask < totalPaths; mask++) {
    let prob = 1
    const results: boolean[] = []
    const hypo: Array<{ home: string; away: string; winner: string }> = []
    for (let i = 0; i < n; i++) {
      const m = remaining[i]
      const homeWins = ((mask >> i) & 1) === 1
      results.push(homeWins)
      prob *= homeWins ? m.pHome : 1 - m.pHome
      hypo.push({ home: m.home, away: m.away, winner: homeWins ? m.home : m.away })
    }
    if (prob <= 0) continue

    const order = rankGroup(teamIds, completed, hypo)
    const fp = order.join(',')
    let g = map.get(fp)
    if (!g) {
      const labels: Record<string, Stage2Label> = {}
      order.forEach((tid, idx) => {
        labels[tid] = labelFromStage2Rank(group, idx + 1)
      })
      g = { fingerprint: fp, order, labels, probability: 0, paths: [], pathCount: 0 }
      map.set(fp, g)
    }
    g.probability += prob
    g.pathCount += 1
    g.paths.push({ results, prob })
  }

  const groups = [...map.values()].sort((a, b) => b.probability - a.probability)
  for (const g of groups) {
    g.paths.sort((a, b) => b.prob - a.prob)
    if (n > 8) g.paths = g.paths.slice(0, topK)
  }

  return { remaining, groups, totalPaths }
}
