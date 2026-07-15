import type { Match, Team } from '@/types'
import { predictMatch } from '@/lib/predict'
import { createRng, MC_ITERATIONS, MC_SEED } from '@/lib/qualify/rng'
import {
  labelFromStage2Rank,
  playoffLabelFromStage3,
  rankGroup,
  type PlayoffLabel,
  type Stage2Label,
} from '@/lib/qualify/rank'
import { expandMatchOutcomes, type HypoResult } from '@/lib/qualify/scorelines'

export interface MatchProb {
  home: string
  away: string
  pHome: number
}

export function remainingMatchProbs(
  matches: Match[],
  teams: Team[],
  stage: string,
  group: string,
): MatchProb[] {
  return matches
    .filter((m) => m.stage === stage && m.group === group && m.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((m) => {
      const pred = predictMatch(matches, teams, m.home, m.away)
      return { home: m.home, away: m.away, pHome: pred.winProbA }
    })
}

export function completedInGroup(matches: Match[], stage: string, group: string): Match[] {
  return matches.filter(
    (m) => m.stage === stage && m.group === group && m.status === 'completed',
  )
}

const EXACT_SCORE_MAX = 7 // 6^7 ≈ 28万；更大则改用蒙特卡洛

/** 穷举组内剩余场次（含 BO5 小分 3-0/3-1/3-2），返回排名路径与概率 */
export function enumerateGroupPaths(
  teamIds: string[],
  completed: Match[],
  remaining: MatchProb[],
  opts?: { seed?: number; mcSamples?: number },
): Array<{ order: string[]; prob: number; results?: HypoResult[] }> {
  const n = remaining.length
  if (n === 0) {
    return [{ order: rankGroup(teamIds, completed, []), prob: 1 }]
  }

  const outcomesPerMatch = remaining.map((m) => expandMatchOutcomes(m.pHome))

  if (n <= EXACT_SCORE_MAX) {
    const out: Array<{ order: string[]; prob: number; results: HypoResult[] }> = []
    const idxs = new Array(n).fill(0)
    const walk = (depth: number, prob: number, hypo: HypoResult[]) => {
      if (prob <= 0) return
      if (depth === n) {
        out.push({
          order: rankGroup(teamIds, completed, hypo),
          prob,
          results: hypo.map((h) => ({ ...h })),
        })
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
    void idxs
    return out
  }

  // 场次过多：带小分的蒙特卡洛近似
  const samples = opts?.mcSamples ?? 200_000
  const rng = createRng(opts?.seed ?? MC_SEED)
  const map = new Map<string, { order: string[]; prob: number; count: number }>()
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
    const order = rankGroup(teamIds, completed, hypo)
    const key = order.join(',')
    const prev = map.get(key)
    if (prev) prev.count += 1
    else map.set(key, { order, prob: 0, count: 1 })
  }
  return [...map.values()].map((v) => ({
    order: v.order,
    prob: v.count / samples,
  }))
}

export function collapsePaths(
  paths: Array<{ order: string[]; prob: number }>,
): Array<{ order: string[]; prob: number }> {
  const map = new Map<string, number>()
  const orders = new Map<string, string[]>()
  for (const p of paths) {
    const key = p.order.join(',')
    map.set(key, (map.get(key) ?? 0) + p.prob)
    orders.set(key, p.order)
  }
  return [...map.entries()].map(([key, prob]) => ({ order: orders.get(key)!, prob }))
}

export interface TeamStage2Outlook {
  teamId: string
  group: 'S' | 'A' | 'B'
  labels: Record<Stage2Label, number>
  /** 卡位后再细分 */
  afterSeat: {
    toS3: number
    toA3: number
    out: number
  }
  rankProb: number[] // index 0 unused, 1..6
}

function emptyLabels(): Record<Stage2Label, number> {
  return { 'S3-lock': 0, 'seat-SA': 0, 'A3-lock': 0, 'seat-AB': 0, 'elim-B': 0 }
}

function seatWinProb(
  matches: Match[],
  teams: Team[],
  a: string,
  b: string,
  cache: Map<string, number>,
): number {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`
  const flipped = a > b
  const cached = cache.get(key)
  if (cached != null) return flipped ? 1 - cached : cached
  const p = predictMatch(matches, teams, a < b ? a : b, a < b ? b : a).winProbA
  cache.set(key, p)
  return flipped ? 1 - p : p
}

/**
 * 计算各队第二轮→卡位/第三轮前景。
 * S×A / A×B 用双组路径笛卡尔（每组 ≤4096，乘积可接受）。
 */
export function computeStage2Outlooks(
  matches: Match[],
  teams: Team[],
  groups: Record<string, string[]>,
): TeamStage2Outlook[] {
  const groupKeys = ['S', 'A', 'B'] as const
  const paths: Record<string, Array<{ order: string[]; prob: number }>> = {}
  for (const g of groupKeys) {
    const ids = groups[g]
    const rem = remainingMatchProbs(matches, teams, 'stage2', g)
    const done = completedInGroup(matches, 'stage2', g)
    paths[g] = collapsePaths(enumerateGroupPaths(ids, done, rem))
  }

  const byTeam: Record<string, TeamStage2Outlook> = {}
  for (const g of groupKeys) {
    for (const id of groups[g]) {
      byTeam[id] = {
        teamId: id,
        group: g,
        labels: emptyLabels(),
        afterSeat: { toS3: 0, toA3: 0, out: 0 },
        rankProb: [0, 0, 0, 0, 0, 0, 0],
      }
    }
  }

  const cache = new Map<string, number>()

  // 边际名次 + 非卡位标签
  for (const g of groupKeys) {
    for (const path of paths[g]) {
      path.order.forEach((tid, idx) => {
        const rank = idx + 1
        const t = byTeam[tid]
        t.rankProb[rank] += path.prob
        t.labels[labelFromStage2Rank(g, rank)] += path.prob
      })
    }
  }

  // S/A 卡位：S5vsA2, S6vsA1
  for (const sp of paths.S) {
    for (const ap of paths.A) {
      const joint = sp.prob * ap.prob
      if (joint <= 0) continue
      const pairs: Array<[string, string]> = [
        [sp.order[4], ap.order[1]], // S5 vs A2
        [sp.order[5], ap.order[0]], // S6 vs A1
      ]
      for (const [sTeam, aTeam] of pairs) {
        const pS = seatWinProb(matches, teams, sTeam, aTeam, cache)
        byTeam[sTeam].afterSeat.toS3 += joint * pS
        byTeam[sTeam].afterSeat.toA3 += joint * (1 - pS)
        byTeam[aTeam].afterSeat.toS3 += joint * (1 - pS)
        byTeam[aTeam].afterSeat.toA3 += joint * pS
      }
    }
  }

  // A/B 卡位：A5vsB2, A6vsB1
  for (const ap of paths.A) {
    for (const bp of paths.B) {
      const joint = ap.prob * bp.prob
      if (joint <= 0) continue
      const pairs: Array<[string, string]> = [
        [ap.order[4], bp.order[1]], // A5 vs B2
        [ap.order[5], bp.order[0]], // A6 vs B1
      ]
      for (const [aTeam, bTeam] of pairs) {
        const pA = seatWinProb(matches, teams, aTeam, bTeam, cache)
        byTeam[aTeam].afterSeat.toA3 += joint * pA
        byTeam[aTeam].afterSeat.out += joint * (1 - pA)
        byTeam[bTeam].afterSeat.toA3 += joint * (1 - pA)
        byTeam[bTeam].afterSeat.out += joint * pA
      }
    }
  }

  // 直接晋级/淘汰计入 afterSeat，便于 UI 统一
  for (const t of Object.values(byTeam)) {
    t.afterSeat.toS3 += t.labels['S3-lock']
    t.afterSeat.toA3 += t.labels['A3-lock']
    t.afterSeat.out += t.labels['elim-B']
  }

  return Object.values(byTeam)
}

export interface TeamPlayoffOutlook {
  teamId: string
  probs: Record<PlayoffLabel, number>
}

/** 蒙特卡洛：第二轮剩余 + 卡位 + 第三轮 → 季后赛入口 */
export function monteCarloPlayoffOutlook(
  matches: Match[],
  teams: Team[],
  groups: Record<string, string[]>,
  iterations = MC_ITERATIONS,
  seed = MC_SEED,
): TeamPlayoffOutlook[] {
  const rng = createRng(seed)
  const cache = new Map<string, number>()
  const remByGroup: Record<string, MatchProb[]> = {}
  const doneByGroup: Record<string, Match[]> = {}
  for (const g of ['S', 'A', 'B'] as const) {
    remByGroup[g] = remainingMatchProbs(matches, teams, 'stage2', g)
    doneByGroup[g] = completedInGroup(matches, 'stage2', g)
  }

  const counts: Record<string, Record<PlayoffLabel, number>> = {}
  for (const t of teams) {
    counts[t.id] = { upper: 0, 'lower-R2': 0, 'lower-R1': 0, 'out-A56': 0, 'out-early': 0 }
  }

  const sampleRemaining = (rem: MatchProb[]) => {
    const hypo: HypoResult[] = []
    for (const m of rem) {
      const options = expandMatchOutcomes(m.pHome)
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
    return hypo
  }

  for (let i = 0; i < iterations; i++) {
    const orderS = rankGroup(groups.S, doneByGroup.S, sampleRemaining(remByGroup.S))
    const orderA = rankGroup(groups.A, doneByGroup.A, sampleRemaining(remByGroup.A))
    const orderB = rankGroup(groups.B, doneByGroup.B, sampleRemaining(remByGroup.B))

    for (const tid of orderB.slice(2)) {
      counts[tid]['out-early'] += 1
    }

    const stage3S: string[] = orderS.slice(0, 4)
    const stage3A: string[] = orderA.slice(2, 4)
    const saPairs: Array<[string, string]> = [
      [orderS[4], orderA[1]],
      [orderS[5], orderA[0]],
    ]
    for (const [sTeam, aTeam] of saPairs) {
      const p = seatWinProb(matches, teams, sTeam, aTeam, cache)
      if (rng() < p) {
        stage3S.push(sTeam)
        stage3A.push(aTeam)
      } else {
        stage3S.push(aTeam)
        stage3A.push(sTeam)
      }
    }

    const abPairs: Array<[string, string]> = [
      [orderA[4], orderB[1]],
      [orderA[5], orderB[0]],
    ]
    for (const [aTeam, bTeam] of abPairs) {
      const p = seatWinProb(matches, teams, aTeam, bTeam, cache)
      if (rng() < p) {
        stage3A.push(aTeam)
        counts[bTeam]['out-early'] += 1
      } else {
        stage3A.push(bTeam)
        counts[aTeam]['out-early'] += 1
      }
    }

    const simRoundRobin = (ids: string[]) => {
      const hypo: HypoResult[] = []
      for (let a = 0; a < ids.length; a++) {
        for (let b = a + 1; b < ids.length; b++) {
          const home = ids[a]
          const away = ids[b]
          const p = seatWinProb(matches, teams, home, away, cache)
          const options = expandMatchOutcomes(p)
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
            home,
            away,
            winner: chosen.homeWins ? home : away,
            scoreHome: chosen.scoreHome,
            scoreAway: chosen.scoreAway,
          })
        }
      }
      return rankGroup(ids, [], hypo)
    }

    const finalS = simRoundRobin(stage3S)
    const finalA = simRoundRobin(stage3A)

    finalS.forEach((tid, idx) => {
      counts[tid][playoffLabelFromStage3('S', idx + 1)] += 1
    })
    finalA.forEach((tid, idx) => {
      counts[tid][playoffLabelFromStage3('A', idx + 1)] += 1
    })
  }

  return teams.map((t) => {
    const c = counts[t.id]
    const probs = { ...c } as Record<PlayoffLabel, number>
    for (const k of Object.keys(probs) as PlayoffLabel[]) {
      probs[k] = c[k] / iterations
    }
    return { teamId: t.id, probs }
  })
}

/** 分块异步蒙特卡洛，避免主线程长时间卡死 */
export async function monteCarloPlayoffOutlookAsync(
  matches: Match[],
  teams: Team[],
  groups: Record<string, string[]>,
  options?: {
    iterations?: number
    seed?: number
    chunkSize?: number
    onProgress?: (done: number, total: number) => void
    signal?: AbortSignal
  },
): Promise<TeamPlayoffOutlook[]> {
  const iterations = options?.iterations ?? MC_ITERATIONS
  const seed = options?.seed ?? MC_SEED
  const chunkSize = options?.chunkSize ?? 2500
  const onProgress = options?.onProgress
  const signal = options?.signal

  const rng = createRng(seed)
  const cache = new Map<string, number>()
  const remByGroup: Record<string, MatchProb[]> = {}
  const doneByGroup: Record<string, Match[]> = {}
  for (const g of ['S', 'A', 'B'] as const) {
    remByGroup[g] = remainingMatchProbs(matches, teams, 'stage2', g)
    doneByGroup[g] = completedInGroup(matches, 'stage2', g)
  }

  const counts: Record<string, Record<PlayoffLabel, number>> = {}
  for (const t of teams) {
    counts[t.id] = { upper: 0, 'lower-R2': 0, 'lower-R1': 0, 'out-A56': 0, 'out-early': 0 }
  }

  const sampleRemaining = (rem: MatchProb[]) => {
    const hypo: HypoResult[] = []
    for (const m of rem) {
      const options = expandMatchOutcomes(m.pHome)
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
    return hypo
  }

  const runOne = () => {
    const orderS = rankGroup(groups.S, doneByGroup.S, sampleRemaining(remByGroup.S))
    const orderA = rankGroup(groups.A, doneByGroup.A, sampleRemaining(remByGroup.A))
    const orderB = rankGroup(groups.B, doneByGroup.B, sampleRemaining(remByGroup.B))

    for (const tid of orderB.slice(2)) counts[tid]['out-early'] += 1

    const stage3S: string[] = orderS.slice(0, 4)
    const stage3A: string[] = orderA.slice(2, 4)
    for (const [sTeam, aTeam] of [
      [orderS[4], orderA[1]],
      [orderS[5], orderA[0]],
    ] as const) {
      const p = seatWinProb(matches, teams, sTeam, aTeam, cache)
      if (rng() < p) {
        stage3S.push(sTeam)
        stage3A.push(aTeam)
      } else {
        stage3S.push(aTeam)
        stage3A.push(sTeam)
      }
    }
    for (const [aTeam, bTeam] of [
      [orderA[4], orderB[1]],
      [orderA[5], orderB[0]],
    ] as const) {
      const p = seatWinProb(matches, teams, aTeam, bTeam, cache)
      if (rng() < p) {
        stage3A.push(aTeam)
        counts[bTeam]['out-early'] += 1
      } else {
        stage3A.push(bTeam)
        counts[aTeam]['out-early'] += 1
      }
    }

    const simRoundRobin = (ids: string[]) => {
      const hypo: HypoResult[] = []
      for (let a = 0; a < ids.length; a++) {
        for (let b = a + 1; b < ids.length; b++) {
          const home = ids[a]
          const away = ids[b]
          const p = seatWinProb(matches, teams, home, away, cache)
          const options = expandMatchOutcomes(p)
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
            home,
            away,
            winner: chosen.homeWins ? home : away,
            scoreHome: chosen.scoreHome,
            scoreAway: chosen.scoreAway,
          })
        }
      }
      return rankGroup(ids, [], hypo)
    }

    const finalS = simRoundRobin(stage3S)
    const finalA = simRoundRobin(stage3A)
    finalS.forEach((tid, idx) => {
      counts[tid][playoffLabelFromStage3('S', idx + 1)] += 1
    })
    finalA.forEach((tid, idx) => {
      counts[tid][playoffLabelFromStage3('A', idx + 1)] += 1
    })
  }

  for (let done = 0; done < iterations; ) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const end = Math.min(done + chunkSize, iterations)
    for (let i = done; i < end; i++) runOne()
    done = end
    onProgress?.(done, iterations)
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }

  return teams.map((t) => {
    const c = counts[t.id]
    const probs = { ...c } as Record<PlayoffLabel, number>
    for (const k of Object.keys(probs) as PlayoffLabel[]) {
      probs[k] = c[k] / iterations
    }
    return { teamId: t.id, probs }
  })
}
