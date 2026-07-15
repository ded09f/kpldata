import type { FormatKind, SeasonDetail, SeasonSummary, Team } from '@/types'

export function formatDate(iso: string | undefined, withTime = false): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (!withTime) return `${y}-${m}-${day}`
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function formatKindLabel(kind: FormatKind): string {
  const map: Record<FormatKind, string> = {
    'ab-groups': 'A/B 双组',
    'east-west': '东西部赛区',
    'single-table': '大组积分',
    sab: 'SAB 升降组',
    'masters-elites': '大师/精英组',
    knockout: '淘汰赛',
  }
  return map[kind] ?? kind
}

export function statusLabel(status: string): string {
  if (status === 'ongoing') return '进行中'
  if (status === 'completed') return '已结束'
  if (status === 'upcoming') return '未开始'
  return status
}

export function statusClass(status: string): string {
  if (status === 'ongoing') return 'badge-live'
  if (status === 'completed') return 'badge-done'
  return 'badge-soon'
}

export function teamById(teams: Team[], id: string): Team | undefined {
  return teams.find((t) => t.id === id)
}

export function teamName(teams: Team[], id: string): string {
  return teamById(teams, id)?.name ?? id
}

export function groupLabel(group: string): string {
  const map: Record<string, string> = {
    G1: '第一组',
    G2: '第二组',
    G3: '第三组',
    S: 'S 组',
    A: 'A 组',
    B: 'B 组',
    East: '东部',
    West: '西部',
    Masters: '大师组',
    Elites: '精英组',
  }
  return map[group] ?? group
}

export function qualificationLabel(q?: string): string {
  if (!q) return ''
  const map: Record<string, string> = {
    S: '→ S组',
    A: '→ A组',
    B: '→ B组',
    S3: '锁定 S组·季后赛',
    A3: '锁定 A组',
    'seat-SA': '卡位赛 S↔A',
    'seat-AB': '卡位赛 A↔B',
    elim: '淘汰区',
  }
  return map[q] ?? q
}

export function qualificationClass(q?: string): string {
  if (!q) return ''
  if (q === 'S' || q === 'S3') return 'qual-s'
  if (q === 'A' || q === 'A3') return 'qual-a'
  if (q === 'B' || q === 'elim') return 'qual-b'
  if (q.startsWith('seat')) return 'qual-seat'
  return ''
}

export function yearsFromIndex(seasons: SeasonSummary[]): number[] {
  return [...new Set(seasons.map((s) => s.year))].sort((a, b) => b - a)
}

export function currentStageLabel(season: SeasonDetail): string {
  const stage = season.standings.find((s) => s.stage === season.currentStage)
  return stage?.label ?? season.currentStage ?? '—'
}
