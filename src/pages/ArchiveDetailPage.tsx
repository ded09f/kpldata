import { Link, useParams } from 'react-router-dom'
import { getSeasonSummary, hasFullDetail, SEASON_INDEX } from '@/data/catalog'
import { StandingTableView } from '@/components/StandingTableView'
import {
  formatDate,
  formatKindLabel,
  statusClass,
  statusLabel,
} from '@/lib/formatters'
import eastWestDemo from '@/data/demos/east-west-2019-spring.json'
import sabDemo from '@/data/demos/sab-2021-spring.json'
import type { StandingStage, Team } from '@/types'

interface DemoBundle {
  id: string
  title: string
  note: string
  formatKind: string
  teams: Team[]
  standings: StandingStage[]
}

const DEMO_BY_SEASON: Record<string, DemoBundle> = {
  '2019-spring': eastWestDemo as DemoBundle,
  '2021-spring': sabDemo as DemoBundle,
}

export function ArchiveDetailPage() {
  const { seasonId = '' } = useParams()
  const summary = getSeasonSummary(seasonId)

  if (!summary) {
    return (
      <div className="card card-pad" style={{ display: 'grid', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>未找到赛事</h1>
        <p className="muted">ID：{seasonId}</p>
        <Link className="btn" to="/archive">
          返回历史档案
        </Link>
      </div>
    )
  }

  const demo = DEMO_BY_SEASON[seasonId]
  const isDefault = seasonId === SEASON_INDEX.defaultSeasonId

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <Link className="muted" to={`/archive?year=${summary.year}`} style={{ fontSize: '0.9rem' }}>
          ← 返回 {summary.year} 年档案
        </Link>
      </div>

      <header className="card card-pad" style={{ display: 'grid', gap: '0.65rem' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span className={`badge ${statusClass(summary.status)}`}>{statusLabel(summary.status)}</span>
          <span className="badge badge-soon">{formatKindLabel(summary.formatKind)}</span>
          {hasFullDetail(summary.id) && <span className="badge badge-live">完整数据</span>}
          {demo && <span className="badge badge-soon">分组榜演示</span>}
        </div>
        <h1 style={{ margin: 0 }}>{summary.name}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {formatDate(summary.startDate)} → {formatDate(summary.endDate)}
        </p>
        <p style={{ margin: 0 }}>{summary.summary}</p>
        <div>
          <strong>规则摘要：</strong>
          {summary.rulesSummary}
        </div>
        {(summary.champion || summary.top4) && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {summary.champion && (
              <span>
                冠军 <strong className="gold">{summary.champion}</strong>
              </span>
            )}
            {summary.runnerUp && (
              <span>
                亚军 <strong>{summary.runnerUp}</strong>
              </span>
            )}
            {summary.fmvp && (
              <span>
                FMVP <strong>{summary.fmvp}</strong>
              </span>
            )}
            {summary.top4 && (
              <span>
                四强 <strong>{summary.top4.join(' / ')}</strong>
              </span>
            )}
          </div>
        )}
        {isDefault && (
          <div>
            <Link className="btn btn-primary" to="/">
              打开完整赛季仪表盘
            </Link>
          </div>
        )}
      </header>

      {demo ? (
        <section style={{ display: 'grid', gap: '0.85rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem' }}>{demo.title}</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              {demo.note}
            </p>
          </div>
          {demo.standings.map((stage) => (
            <div key={stage.stage} style={{ display: 'grid', gap: '0.85rem' }}>
              <h3 style={{ margin: 0 }}>{stage.label}</h3>
              <div
                style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                }}
              >
                {stage.tables.map((table) => (
                  <StandingTableView key={table.group} table={table} teams={demo.teams} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="card card-pad muted">
          本场赛事目前为档案摘要。完整逐场数据优先覆盖默认赛季（2026 夏季赛）。
          {summary.formatKind === 'east-west' && (
            <div style={{ marginTop: '0.75rem' }}>
              东西部双栏榜演示可查看{' '}
              <Link className="gold" to="/archive/2019-spring">
                2019 春季赛
              </Link>
              。
            </div>
          )}
          {summary.formatKind === 'sab' && summary.id !== '2026-summer' && (
            <div style={{ marginTop: '0.75rem' }}>
              SAB 分组榜演示可查看{' '}
              <Link className="gold" to="/archive/2021-spring">
                2021 春季赛
              </Link>
              ，或返回{' '}
              <Link className="gold" to="/">
                2026 夏季赛完整数据
              </Link>
              。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
