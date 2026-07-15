import { describe, expect, it } from 'vitest'
import { expandMatchOutcomes, scorelineWeights } from '@/lib/qualify/scorelines'

describe('scorelines', () => {
  it('expands to six BO5 outcomes summing to 1', () => {
    const outs = expandMatchOutcomes(0.62)
    expect(outs).toHaveLength(6)
    const sum = outs.reduce((s, o) => s + o.prob, 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('favors sweeps when favorite is strong', () => {
    const strong = scorelineWeights(0.9)
    const weak = scorelineWeights(0.55)
    expect(strong[0]).toBeGreaterThan(weak[0])
  })
})
