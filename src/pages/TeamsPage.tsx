import { Link } from 'react-router-dom'
import { getDefaultSeason } from '@/data/catalog'
import { TeamAvatar } from '@/components/TeamChip'
import { computeElo } from '@/lib/predict'

export function TeamsPage() {
  const season = getDefaultSeason()
  const elo = computeElo(
    season.matches,
    season.teams.map((t) => t.id),
  )

  const records = season.teams.map((team) => {
    let wins = 0
    let losses = 0
    for (const m of season.matches) {
      if (m.status !== 'completed' || !m.winner) continue
      if (m.home !== team.id && m.away !== team.id) continue
      if (m.winner === team.id) wins += 1
      else losses += 1
    }
    return { team, wins, losses, elo: elo[team.id] ?? 1500 }
  })
  records.sort((a, b) => b.elo - a.elo)

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>参赛战队</h1>
        <p className="muted" style={{ margin: 0 }}>
          按本赛季 Elo 排序 · 点击可进入胜率预测
        </p>
      </header>
      <div className="grid-cards">
        {records.map(({ team, wins, losses, elo: rating }) => (
          <Link key={team.id} to={`/predict?home=${team.id}`} className="card card-pad" style={{ display: 'grid', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <TeamAvatar team={team} size={40} />
              <div>
                <div style={{ fontWeight: 700 }}>{team.name}</div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {team.city && team.city !== '—' ? team.city : '临时席位'} ·{' '}
                  {team.seatType === 'temporary' ? '临时席' : '固定席'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span>
                战绩 <strong className="gold">{wins}-{losses}</strong>
              </span>
              <span>
                Elo <strong>{rating.toFixed(0)}</strong>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
