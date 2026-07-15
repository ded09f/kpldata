/** BO5 胜者比分线：3-0 / 3-1 / 3-2 */
export type ScoreLine = { win: 3; lose: 0 | 1 | 2 }

export const BO5_LINES: ScoreLine[] = [
  { win: 3, lose: 0 },
  { win: 3, lose: 1 },
  { win: 3, lose: 2 },
]

/**
 * 在「已确定系列赛胜者」条件下，小分分布。
 * 胜率越高，越容易大比分（3-0）；胶着时 3-2 更常见。
 */
export function scorelineWeights(pWinner: number): number[] {
  const p = Math.min(0.95, Math.max(0.55, pWinner))
  const raw = [p * p, p * (1.15 - p), (1.05 - p) * (1.05 - p)]
  const sum = raw[0] + raw[1] + raw[2]
  return raw.map((w) => w / sum)
}

export interface MatchOutcome {
  homeWins: boolean
  scoreHome: number
  scoreAway: number
  prob: number
}

/** 单场 BO5：6 种结果（主队 3-0/3-1/3-2 或客队 3-0/3-1/3-2）及概率 */
export function expandMatchOutcomes(pHome: number): MatchOutcome[] {
  const out: MatchOutcome[] = []
  const homeW = scorelineWeights(pHome)
  const awayW = scorelineWeights(1 - pHome)
  BO5_LINES.forEach((line, i) => {
    out.push({
      homeWins: true,
      scoreHome: line.win,
      scoreAway: line.lose,
      prob: pHome * homeW[i],
    })
    out.push({
      homeWins: false,
      scoreHome: line.lose,
      scoreAway: line.win,
      prob: (1 - pHome) * awayW[i],
    })
  })
  return out
}

export interface HypoResult {
  home: string
  away: string
  winner: string
  scoreHome: number
  scoreAway: number
}
