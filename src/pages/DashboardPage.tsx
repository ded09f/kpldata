import { Link } from 'react-router-dom'
import { getDefaultSeason } from '@/data/catalog'
import { MatchCard } from '@/components/MatchCard'
import { StandingTableView } from '@/components/StandingTableView'
import { currentStageLabel, formatDate, formatKindLabel, statusClass, statusLabel } from '@/lib/formatters'

export function DashboardPage() {
  const season = getDefaultSeason()
  const stage = season.standings.find((s) => s.stage === season.currentStage) ?? season.standings[0]
  const upcoming = [...season.matches]
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)
  const recent = [...season.matches]
    .filter((m) => m.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  const completed = season.matches.filter((m) => m.status === 'completed').length

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <section className="card card-pad" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className={`badge ${statusClass(season.status)}`}>{statusLabel(season.status)}</span>
              <span className="badge badge-soon">{formatKindLabel(season.formatKind)}</span>
            </div>
            <h1 style={{ margin: '0 0 0.35rem', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>{season.name}</h1>
            <p className="muted" style={{ margin: 0, maxWidth: 720 }}>
              {season.rules.summary}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Link className="btn btn-primary" to="/predict">
              胜率预测
            </Link>
            <Link className="btn" to="/outlook">
              晋级前景
            </Link>
            <Link className="btn" to="/rules">
              查看赛制
            </Link>
          </div>
        </div>
        <div className="grid-cards">
          <Stat label="当前阶段" value={currentStageLabel(season)} />
          <Stat label="参赛战队" value={`${season.teams.length}`} />
          <Stat label="已赛场次" value={`${completed}`} />
          <Stat label="赛程跨度" value={`${formatDate(season.startDate)} → ${formatDate(season.endDate)}`} />
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{stage.label} · 积分榜</h2>
          <Link className="gold" to="/standings">
            查看完整榜单 →
          </Link>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {stage.tables.map((t) => (
            <StandingTableView key={t.group} table={t} teams={season.teams} />
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>近期赛果</h2>
            <Link className="gold" to="/schedule">
              全部赛程 →
            </Link>
          </div>
          {recent.map((m) => (
            <MatchCard key={m.id} match={m} teams={season.teams} />
          ))}
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>即将开始</h2>
            <Link className="gold" to="/predict">
              去预测 →
            </Link>
          </div>
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} teams={season.teams} showPredict />
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-pad">
      <div className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{value}</div>
    </div>
  )
}
