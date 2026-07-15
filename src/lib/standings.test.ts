import { describe, expect, it } from 'vitest'
import {
  computeGroupTable,
  formatStandingHint,
  reRank,
  sortStandingRows,
} from '@/lib/standings'
import type { Match, StandingRow } from '@/types'

function row(partial: Partial<StandingRow> & { teamId: string }): StandingRow {
  return {
    rank: 0,
    played: 0,
    wins: 0,
    losses: 0,
    points: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDiff: 0,
    ...partial,
  }
}

describe('sortStandingRows', () => {
  it('sorts by points then gameDiff then gameWins', () => {
    const rows = [
      row({ teamId: 'a', points: 2, gameDiff: 1, gameWins: 5 }),
      row({ teamId: 'b', points: 3, gameDiff: 0, gameWins: 3 }),
      row({ teamId: 'c', points: 2, gameDiff: 3, gameWins: 4 }),
      row({ teamId: 'd', points: 2, gameDiff: 1, gameWins: 7 }),
    ]
    const sorted = sortStandingRows(rows).map((r) => r.teamId)
    expect(sorted).toEqual(['b', 'c', 'd', 'a'])
  })

  it('reRank assigns 1-based ranks', () => {
    const ranked = reRank([
      row({ teamId: 'x', points: 1 }),
      row({ teamId: 'y', points: 3 }),
    ])
    expect(ranked[0]).toMatchObject({ teamId: 'y', rank: 1 })
    expect(ranked[1]).toMatchObject({ teamId: 'x', rank: 2 })
  })
})

describe('computeGroupTable', () => {
  const matches: Match[] = [
    {
      id: '1',
      stage: 's',
      group: 'S',
      date: '2026-07-01T12:00:00+08:00',
      bo: 5,
      status: 'completed',
      home: 'wb',
      away: 'ksg',
      score: { home: 3, away: 2 },
      winner: 'wb',
    },
    {
      id: '2',
      stage: 's',
      group: 'S',
      date: '2026-07-02T12:00:00+08:00',
      bo: 5,
      status: 'completed',
      home: 'ttg',
      away: 'wb',
      score: { home: 0, away: 3 },
      winner: 'wb',
    },
  ]

  it('aggregates wins points and gameDiff', () => {
    const table = computeGroupTable(matches, ['wb', 'ksg', 'ttg'], 'S')
    const wb = table.rows.find((r) => r.teamId === 'wb')!
    expect(wb.wins).toBe(2)
    expect(wb.points).toBe(2)
    expect(wb.gameDiff).toBe(4)
    expect(wb.rank).toBe(1)
  })
})

describe('formatStandingHint', () => {
  it('returns east-west specific copy', () => {
    expect(formatStandingHint('east-west')).toContain('东西部')
  })

  it('returns sab specific copy', () => {
    expect(formatStandingHint('sab')).toContain('SAB')
  })
})
