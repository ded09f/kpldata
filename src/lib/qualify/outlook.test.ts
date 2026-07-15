import { describe, expect, it } from 'vitest'
import { getDefaultSeason } from '@/data/catalog'
import { computeStage2Outlooks, monteCarloPlayoffOutlook } from '@/lib/qualify/outlook'
import { buildGroupScenarios } from '@/lib/qualify/scenarios'
import { MC_SEED } from '@/lib/qualify/rng'

describe('outlook integration', () => {
  const season = getDefaultSeason()
  const groups = season.groups!.stage2

  it('stage2 outlook probabilities roughly sum to 1 per team', () => {
    const outlooks = computeStage2Outlooks(season.matches, season.teams, groups)
    expect(outlooks.length).toBe(18)
    for (const o of outlooks) {
      const labelSum = Object.values(o.labels).reduce((a, b) => a + b, 0)
      expect(labelSum).toBeGreaterThan(0.98)
      expect(labelSum).toBeLessThan(1.02)
      const seatSum = o.afterSeat.toS3 + o.afterSeat.toA3 + o.afterSeat.out
      expect(seatSum).toBeGreaterThan(0.98)
      expect(seatSum).toBeLessThan(1.02)
    }
  })

  it('monte carlo is deterministic with seed 42', () => {
    const a = monteCarloPlayoffOutlook(season.matches, season.teams, groups, 200, MC_SEED)
    const b = monteCarloPlayoffOutlook(season.matches, season.teams, groups, 200, MC_SEED)
    expect(a[0].probs.upper).toBe(b[0].probs.upper)
  })

  it('scenarios enumerate all paths for a group', () => {
    const rem = season.matches.filter((m) => m.stage === 'stage2' && m.group === 'S' && m.status === 'scheduled')
    const sc = buildGroupScenarios(season.matches, season.teams, 'S', groups.S)
    expect(sc.totalPaths).toBe(2 ** rem.length)
    const probSum = sc.groups.reduce((s, g) => s + g.probability, 0)
    expect(probSum).toBeGreaterThan(0.98)
    expect(probSum).toBeLessThan(1.02)
  })
})
