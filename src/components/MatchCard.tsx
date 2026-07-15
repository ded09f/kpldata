import { Link } from 'react-router-dom'
import type { Match, Team } from '@/types'
import { formatDate } from '@/lib/formatters'
import { TeamAvatar } from '@/components/TeamChip'

export function MatchCard({
  match,
  teams,
  showPredict = false,
}: {
  match: Match
  teams: Team[]
  showPredict?: boolean
}) {
  const home = teams.find((t) => t.id === match.home)
  const away = teams.find((t) => t.id === match.away)
  const done = match.status === 'completed'

  return (
    <div className="card card-pad" style={{ display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          {formatDate(match.date, true)} · BO{match.bo}
          {match.group ? ` · ${match.group}` : ''}
        </span>
        <span className={`badge ${done ? 'badge-done' : 'badge-soon'}`}>
          {done ? '已结束' : '未开始'}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 600, textAlign: 'right' }}>{home?.shortName ?? match.home}</span>
          <TeamAvatar team={home} />
        </div>
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          {done && match.score ? (
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              <span className={match.winner === match.home ? 'gold' : ''}>{match.score.home}</span>
              <span className="muted"> : </span>
              <span className={match.winner === match.away ? 'gold' : ''}>{match.score.away}</span>
            </div>
          ) : (
            <div className="muted" style={{ fontWeight: 700 }}>
              VS
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TeamAvatar team={away} />
          <span style={{ fontWeight: 600 }}>{away?.shortName ?? match.away}</span>
        </div>
      </div>
      {!done && showPredict && (
        <Link
          className="btn"
          to={`/predict?home=${match.home}&away=${match.away}`}
          style={{ width: '100%' }}
        >
          预测胜率
        </Link>
      )}
    </div>
  )
}
