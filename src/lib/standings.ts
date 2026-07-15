import type { FormatKind, Match, StandingRow, StandingStage, StandingTable } from '@/types'

export type StandingSortKey = 'points' | 'gameDiff' | 'gameWins'

/** 同分排序：积分 → 净胜局 → 小分（局胜场） */
export function sortStandingRows(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff
    return b.gameWins - a.gameWins
  })
}

export function reRank(rows: StandingRow[]): StandingRow[] {
  return sortStandingRows(rows).map((row, index) => ({ ...row, rank: index + 1 }))
}

export function getStageById(
  standings: StandingStage[],
  stageId: string | undefined,
): StandingStage | undefined {
  if (!stageId) return standings[0]
  return standings.find((s) => s.stage === stageId) ?? standings[0]
}

/** 按 formatKind 给出默认展示阶段与文案提示 */
export function formatStandingHint(kind: FormatKind): string {
  switch (kind) {
    case 'east-west':
      return '东西部赛区分别排名；分区前列进入季后赛，垫底面临保级。'
    case 'sab':
      return 'SAB 升降组赛制：按轮次切换分组查看；色条表示晋级 / 卡位 / 淘汰形势。'
    case 'single-table':
      return '大组统一积分榜，按积分与净胜局排序。'
    case 'masters-elites':
      return '年度总决赛：大师组与精英组分组展示。'
    case 'ab-groups':
      return 'A/B 双组循环，各组前列晋级季后赛。'
    case 'knockout':
      return '淘汰赛制，无常规赛积分榜。'
    default:
      return '按积分与净胜局排序。'
  }
}

export function emptyStandingRow(teamId: string): StandingRow {
  return {
    teamId,
    rank: 0,
    played: 0,
    wins: 0,
    losses: 0,
    points: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDiff: 0,
  }
}

/** 从已赛结果重算某组积分（系列胜负计 1 分） */
export function computeGroupTable(
  matches: Match[],
  teamIds: string[],
  group?: string | null,
): StandingTable {
  const stats: Record<string, StandingRow> = {}
  for (const id of teamIds) stats[id] = emptyStandingRow(id)

  for (const m of matches) {
    if (m.status !== 'completed' || !m.score || !m.winner) continue
    if (group && m.group && m.group !== group) continue
    if (!stats[m.home] || !stats[m.away]) continue

    const home = stats[m.home]
    const away = stats[m.away]
    home.played += 1
    away.played += 1
    home.gameWins += m.score.home
    home.gameLosses += m.score.away
    away.gameWins += m.score.away
    away.gameLosses += m.score.home

    if (m.winner === m.home) {
      home.wins += 1
      home.points += 1
      away.losses += 1
    } else {
      away.wins += 1
      away.points += 1
      home.losses += 1
    }
  }

  for (const row of Object.values(stats)) {
    row.gameDiff = row.gameWins - row.gameLosses
  }

  return {
    group: group ?? 'ALL',
    rows: reRank(Object.values(stats)),
  }
}
