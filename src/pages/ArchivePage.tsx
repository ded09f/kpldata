import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getSeasonSummaries, hasFullDetail, SEASON_INDEX } from '@/data/catalog'
import { formatDate, formatKindLabel, statusClass, statusLabel, yearsFromIndex } from '@/lib/formatters'

export function ArchivePage() {
  const seasons = getSeasonSummaries()
  const years = yearsFromIndex(seasons)
  const [params, setParams] = useSearchParams()
  const yearFromQuery = Number(params.get('year'))
  const [year, setYear] = useState<number>(years.includes(yearFromQuery) ? yearFromQuery : 2026)

  useEffect(() => {
    if (years.includes(yearFromQuery) && yearFromQuery !== year) {
      setYear(yearFromQuery)
    }
  }, [yearFromQuery, year, years])

  const list = useMemo(() => seasons.filter((s) => s.year === year), [seasons, year])

  function selectYear(y: number) {
    setYear(y)
    const next = new URLSearchParams(params)
    next.set('year', String(y))
    setParams(next, { replace: true })
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>历史档案</h1>
        <p className="muted" style={{ margin: 0 }}>
          2016 两场 · 2017 三场 · 其余年份四场。点击卡片查看详情；2019 春（东西部）与 2021 春（SAB）含分组榜演示。
        </p>
      </header>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {years.map((y) => (
          <button key={y} type="button" className={`tab${year === y ? ' active' : ''}`} onClick={() => selectYear(y)}>
            {y}
            <span className="muted" style={{ marginLeft: 6 }}>
              ({seasons.filter((s) => s.year === y).length})
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {list.map((s) => (
          <article key={s.id} className="card card-pad" style={{ display: 'grid', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${statusClass(s.status)}`}>{statusLabel(s.status)}</span>
                  <span className="badge badge-soon">{formatKindLabel(s.formatKind)}</span>
                  {hasFullDetail(s.id) && <span className="badge badge-live">完整数据</span>}
                  {(s.id === '2019-spring' || s.id === '2021-spring') && (
                    <span className="badge badge-soon">分组榜演示</span>
                  )}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                  <Link to={s.id === SEASON_INDEX.defaultSeasonId ? '/' : `/archive/${s.id}`}>{s.name}</Link>
                </h2>
              </div>
              <div className="muted" style={{ fontSize: '0.9rem' }}>
                {formatDate(s.startDate)} → {formatDate(s.endDate)}
              </div>
            </div>
            <p style={{ margin: 0 }}>{s.summary}</p>
            <div className="muted" style={{ fontSize: '0.92rem' }}>
              <strong>规则：</strong>
              {s.rulesSummary}
            </div>
            {(s.champion || s.top4) && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                {s.champion && (
                  <span>
                    冠军 <strong className="gold">{s.champion}</strong>
                  </span>
                )}
                {s.runnerUp && (
                  <span>
                    亚军 <strong>{s.runnerUp}</strong>
                  </span>
                )}
                {s.fmvp && (
                  <span>
                    FMVP <strong>{s.fmvp}</strong>
                  </span>
                )}
                {s.top4 && s.top4.length > 0 && (
                  <span>
                    四强 <strong>{s.top4.join(' / ')}</strong>
                  </span>
                )}
              </div>
            )}
            <div>
              {s.id === SEASON_INDEX.defaultSeasonId ? (
                <Link className="btn btn-primary" to="/">
                  打开完整赛季页
                </Link>
              ) : (
                <Link className="btn" to={`/archive/${s.id}`}>
                  查看详情
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
