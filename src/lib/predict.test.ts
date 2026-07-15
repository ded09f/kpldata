import { describe, expect, it } from 'vitest'
import { predictMatch, computeElo, PREDICT_WEIGHTS } from '@/lib/predict'
import type { Match, Team } from '@/types'

const teams: Team[] = [
  { id: 'a', name: 'A', shortName: 'A' },
  { id: 'b', name: 'B', shortName: 'B' },
  { id: 'c', name: 'C', shortName: 'C' },
]

const matches: Match[] = [
  {
    id: '1',
    stage: 's',
    date: '2026-06-01T12:00:00+08:00',
    bo: 5,
    status: 'completed',
    home: 'a',
    away: 'b',
    score: { home: 3, away: 1 },
    winner: 'a',
  },
  {
    id: '2',
    stage: 's',
    date: '2026-06-02T12:00:00+08:00',
    bo: 5,
    status: 'completed',
    home: 'a',
    away: 'c',
    score: { home: 3, away: 0 },
    winner: 'a',
  },
  {
    id: '3',
    stage: 's',
    date: '2026-06-03T12:00:00+08:00',
    bo: 5,
    status: 'completed',
    home: 'b',
    away: 'c',
    score: { home: 3, away: 2 },
    winner: 'b',
  },
]

describe('predictMatch', () => {
  it('probabilities sum to 1', () => {
    const r = predictMatch(matches, teams, 'a', 'b')
    expect(r.winProbA + r.winProbB).toBeCloseTo(1, 10)
  })

  it('favors the stronger team', () => {
    const r = predictMatch(matches, teams, 'a', 'c')
    expect(r.winProbA).toBeGreaterThan(0.5)
  })

  it('is symmetric when swapped', () => {
    const ab = predictMatch(matches, teams, 'a', 'b')
    const ba = predictMatch(matches, teams, 'b', 'a')
    expect(ab.winProbA).toBeCloseTo(ba.winProbB, 10)
  })

  it('exposes configured weights', () => {
    expect(PREDICT_WEIGHTS.elo + PREDICT_WEIGHTS.form + PREDICT_WEIGHTS.h2h).toBeCloseTo(1)
  })
})

describe('computeElo', () => {
  it('raises winner rating', () => {
    const elo = computeElo(matches, ['a', 'b', 'c'])
    expect(elo.a).toBeGreaterThan(elo.c)
  })
})
