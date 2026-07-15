import { describe, expect, it } from 'vitest'
import {
  labelFromStage2Rank,
  playoffLabelFromStage3,
  rankGroup,
} from '@/lib/qualify/rank'
import { createRng, MC_SEED } from '@/lib/qualify/rng'
import type { Match } from '@/types'

describe('official rule mappings', () => {
  it('maps stage2 S ranks per 4.1.2 / 4.1.3', () => {
    expect(labelFromStage2Rank('S', 1)).toBe('S3-lock')
    expect(labelFromStage2Rank('S', 4)).toBe('S3-lock')
    expect(labelFromStage2Rank('S', 5)).toBe('seat-SA')
    expect(labelFromStage2Rank('S', 6)).toBe('seat-SA')
  })

  it('maps stage2 A/B ranks', () => {
    expect(labelFromStage2Rank('A', 2)).toBe('seat-SA')
    expect(labelFromStage2Rank('A', 3)).toBe('A3-lock')
    expect(labelFromStage2Rank('A', 5)).toBe('seat-AB')
    expect(labelFromStage2Rank('B', 2)).toBe('seat-AB')
    expect(labelFromStage2Rank('B', 3)).toBe('elim-B')
  })

  it('maps stage3 to playoff entries per 4.2 + public bracket', () => {
    expect(playoffLabelFromStage3('S', 1)).toBe('upper')
    expect(playoffLabelFromStage3('S', 4)).toBe('upper')
    expect(playoffLabelFromStage3('S', 5)).toBe('lower-R2')
    expect(playoffLabelFromStage3('A', 1)).toBe('lower-R1')
    expect(playoffLabelFromStage3('A', 5)).toBe('out-A56')
  })
})

describe('rankGroup', () => {
  it('orders by points then game diff', () => {
    const teams = ['a', 'b', 'c']
    const matches: Match[] = [
      {
        id: '1',
        stage: 'stage2',
        group: 'S',
        date: '2026-07-01T12:00:00+08:00',
        bo: 5,
        status: 'completed',
        home: 'a',
        away: 'b',
        score: { home: 3, away: 0 },
        winner: 'a',
      },
    ]
    const order = rankGroup(teams, matches, [
      { home: 'a', away: 'c', winner: 'a' },
      { home: 'b', away: 'c', winner: 'b' },
    ])
    expect(order[0]).toBe('a')
  })
})

describe('rng seed 42', () => {
  it('is deterministic', () => {
    const a = createRng(MC_SEED)
    const b = createRng(MC_SEED)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})
