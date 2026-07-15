import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getDefaultSeason } from '@/data/catalog'
import { PREDICT_WEIGHTS, predictMatch } from '@/lib/predict'
import { pct } from '@/lib/formatters'
import { TeamAvatar } from '@/components/TeamChip'

export function PredictPage() {
  const season = getDefaultSeason()
  const [params, setParams] = useSearchParams()
  const initialHome = params.get('home') ?? season.teams[0]?.id ?? ''
  const initialAway = params.get('away') ?? season.teams[1]?.id ?? ''
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway === initialHome ? season.teams[1]?.id ?? '' : initialAway)

  const result = useMemo(() => {
    if (!home || !away || home === away) return null
    return predictMatch(season.matches, season.teams, home, away)
  }, [season, home, away])

  const homeTeam = season.teams.find((t) => t.id === home)
  const awayTeam = season.teams.find((t) => t.id === away)

  function update(nextHome: string, nextAway: string) {
    setHome(nextHome)
    setAway(nextAway)
    const sp = new URLSearchParams()
    sp.set('home', nextHome)
    sp.set('away', nextAway)
    setParams(sp, { replace: true })
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>胜率预测</h1>
        <p className="muted" style={{ margin: 0 }}>
          基于本赛季已赛战绩的 Elo、近 5 场状态与交锋记录加权估计（
          {Math.round(PREDICT_WEIGHTS.elo * 100)}% / {Math.round(PREDICT_WEIGHTS.form * 100)}% /{' '}
          {Math.round(PREDICT_WEIGHTS.h2h * 100)}%）。仅供参考，非官方赔率。
        </p>
      </header>

      <div className="card card-pad" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span className="muted">战队 A</span>
            <select className="select" value={home} onChange={(e) => update(e.target.value, away)}>
              {season.teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === away}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span className="muted">战队 B</span>
            <select className="select" value={away} onChange={(e) => update(home, e.target.value)}>
              {season.teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === home}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {result && homeTeam && awayTeam && (
          <>
            <div className="prob-bar">
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <TeamAvatar team={homeTeam} />
                  {homeTeam.shortName}
                </div>
                <div className="gold" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  {pct(result.winProbA)}
                </div>
              </div>
              <div style={{ minWidth: 160 }}>
                <div className="prob-track">
                  <div className="left" style={{ width: `${result.winProbA * 100}%` }} />
                  <div className="right" style={{ width: `${result.winProbB * 100}%` }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <TeamAvatar team={awayTeam} />
                  {awayTeam.shortName}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>
                  {pct(result.winProbB)}
                </div>
              </div>
            </div>

            <div className="grid-cards">
              <Metric
                title="Elo 评分"
                a={`${result.breakdown.eloA.toFixed(0)}`}
                b={`${result.breakdown.eloB.toFixed(0)}`}
                note={`期望胜率 ${pct(result.breakdown.eloWinProb)}`}
              />
              <Metric
                title="近 5 场胜率"
                a={pct(result.breakdown.formA)}
                b={pct(result.breakdown.formB)}
                note={`状态权重胜率 ${pct(result.breakdown.formWinProb)}`}
              />
              <Metric
                title="本赛季交锋"
                a={`${result.breakdown.h2hWinsA}`}
                b={`${result.breakdown.h2hWinsB}`}
                note={
                  result.breakdown.h2hPlayed === 0
                    ? '暂无交锋，回退 Elo'
                    : `共 ${result.breakdown.h2hPlayed} 场 · H2H 胜率 ${pct(result.breakdown.h2hWinProb)}`
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Metric({ title, a, b, note }: { title: string; a: string; b: string; note: string }) {
  return (
    <div className="card card-pad">
      <div className="muted" style={{ fontSize: '0.8rem' }}>
        {title}
      </div>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0.35rem 0' }}>
        {a} <span className="muted">vs</span> {b}
      </div>
      <div className="muted" style={{ fontSize: '0.85rem' }}>
        {note}
      </div>
    </div>
  )
}
