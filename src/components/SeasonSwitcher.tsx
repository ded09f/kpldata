import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getSeasonSummaries, SEASON_INDEX } from '@/data/catalog'

/** 顶栏年份 / 赛事快速跳转 */
export function SeasonSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const seasons = getSeasonSummaries()

  const years = useMemo(
    () => [...new Set(seasons.map((s) => s.year))].sort((a, b) => b - a),
    [seasons],
  )

  const currentYear = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const y = Number(params.get('year'))
    if (y && years.includes(y)) return y
    if (location.pathname.startsWith('/archive')) return years[0] ?? 2026
    return 2026
  }, [location, years])

  const yearSeasons = seasons.filter((s) => s.year === currentYear)

  return (
    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <select
        className="select"
        aria-label="选择年份"
        value={currentYear}
        onChange={(e) => {
          const y = Number(e.target.value)
          navigate(`/archive?year=${y}`)
        }}
        style={{ padding: '0.35rem 0.55rem', fontSize: '0.85rem' }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}年（{seasons.filter((s) => s.year === y).length}场）
          </option>
        ))}
      </select>
      <select
        className="select"
        aria-label="选择赛事"
        value={
          yearSeasons.find((s) => location.pathname.includes(s.id))?.id ??
          (currentYear === 2026 ? SEASON_INDEX.defaultSeasonId : yearSeasons[0]?.id ?? '')
        }
        onChange={(e) => {
          const id = e.target.value
          if (id === SEASON_INDEX.defaultSeasonId) {
            navigate('/')
            return
          }
          navigate(`/archive/${id}`)
        }}
        style={{ padding: '0.35rem 0.55rem', fontSize: '0.85rem', maxWidth: 220 }}
      >
        {yearSeasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name.replace(/^\d{4}\s*/, '')}
          </option>
        ))}
      </select>
    </div>
  )
}
