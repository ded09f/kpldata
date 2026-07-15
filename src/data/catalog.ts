import seasonIndex from '@/data/seasons/index.json'
import summer2026 from '@/data/seasons/2026/summer.json'
import eraRules from '@/data/rules/by-era.json'
import meta from '@/data/meta.json'
import type { EraRule, SeasonDetail, SeasonIndex, SeasonSummary } from '@/types'

const detailMap: Record<string, SeasonDetail> = {
  '2026-summer': summer2026 as SeasonDetail,
}

export const META = meta as { name: string; defaultSeasonId: string; updatedAt: string; repo: string }
export const SEASON_INDEX = seasonIndex as SeasonIndex
export const ERA_RULES = eraRules as EraRule[]

export function getSeasonSummaries(): SeasonSummary[] {
  return SEASON_INDEX.seasons
}

export function getSeasonSummary(id: string): SeasonSummary | undefined {
  return SEASON_INDEX.seasons.find((s) => s.id === id)
}

export function getSeasonDetail(id: string): SeasonDetail | undefined {
  return detailMap[id]
}

export function getDefaultSeason(): SeasonDetail {
  const id = SEASON_INDEX.defaultSeasonId
  const detail = getSeasonDetail(id)
  if (!detail) throw new Error(`Default season missing: ${id}`)
  return detail
}

export function hasFullDetail(id: string): boolean {
  return Boolean(detailMap[id])
}
