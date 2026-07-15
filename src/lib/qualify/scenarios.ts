import type { Match, Team } from '@/types'
import { completedInGroup, remainingMatchProbs, type MatchProb } from '@/lib/qualify/outlook'
import { labelFromStage2Rank, rankGroup, type Stage2Label } from '@/lib/qualify/rank'
import { expandMatchOutcomes, type HypoResult } from '@/lib/qualify/scorelines'
import { createRng, MC_SEED } from '@/lib/qualify/rng'

export interface ScenarioPath {
  /** 每场：主队比分-客队比分，如 3-1 */
  scores: string[]
  results: HypoResult[]
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

const EXACT_MAX = 7

/**
 * 按组穷举/抽样剩余场次（含小分），按最终名次指纹分组。
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
  mode: 'exact' | 'mc'
} {
  void teams
  const remaining = remainingMatchProbs(matches, teams, 'stage2', group)
  const completed = completedInGroup(matches, 'stage2', group)
  const n = remaining.length
  const outcomesPerMatch = remaining.map((m) => expandMatchOutcomes(m.pHome))
  const map = new Map<string, ScenarioGroup>()

  const addPath = (order: string[], prob: number, results: HypoResult[]) => {
    if (prob <= 0) return
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
    g.paths.push({
      results,
      scores: results.map((r) => `${r.scoreHome}-${r.scoreAway}`),
      prob,
    })
  }

  let totalPaths = 0
  let mode: 'exact' | 'mc' = 'exact'

  if (n === 0) {
    addPath(rankGroup(teamIds, completed, []), 1, [])
    totalPaths = 1
  } else if (n <= EXACT_MAX) {
    totalPaths = Math.round(Math.pow(6, n))
    const walk = (depth: number, prob: number, hypo: HypoResult[]) => {
      if (prob <= 0) return
      if (depth === n) {
        addPath(rankGroup(teamIds, completed, hypo), prob, hypo.map((h) => ({ ...h })))
        return
      }
      const m = remaining[depth]
      for (const o of outcomesPerMatch[depth]) {
        hypo.push({
          home: m.home,
          away: m.away,
          winner: o.homeWins ? m.home : m.away,
          scoreHome: o.scoreHome,
          scoreAway: o.scoreAway,
        })
        walk(depth + 1, prob * o.prob, hypo)
        hypo.pop()
      }
    }
    walk(0, 1, [])
  } else {
    mode = 'mc'
    const samples = 200_000
    totalPaths = samples
    const rng = createRng(MC_SEED + group.charCodeAt(0))
    for (let s = 0; s < samples; s++) {
      const hypo: HypoResult[] = []
      for (let i = 0; i < n; i++) {
        const m = remaining[i]
        const options = outcomesPerMatch[i]
        let r = rng()
        let chosen = options[options.length - 1]
        for (const o of options) {
          r -= o.prob
          if (r <= 0) {
            chosen = o
            break
          }
        }
        hypo.push({
          home: m.home,
          away: m.away,
          winner: chosen.homeWins ? m.home : m.away,
          scoreHome: chosen.scoreHome,
          scoreAway: chosen.scoreAway,
        })
      }
      addPath(rankGroup(teamIds, completed, hypo), 1 / samples, hypo)
    }
  }

  const groups = [...map.values()].sort((a, b) => b.probability - a.probability)
  for (const g of groups) {
    g.paths.sort((a, b) => b.prob - a.prob)
    if (g.paths.length > topK) g.paths = g.paths.slice(0, topK)
  }

  return { remaining, groups, totalPaths, mode }
}
