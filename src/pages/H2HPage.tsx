import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDefaultSeason } from '@/data/catalog'
import { buildH2HMatrix } from '@/lib/predict'
import { TeamAvatar } from '@/components/TeamChip'

export function H2HPage() {
  const season = getDefaultSeason()
  const [scope, setScope] = useState<'all' | 'stage2' | 'stage1'>('all')

  const matches = useMemo(() => {
    if (scope === 'all') return season.matches
    return season.matches.filter((m) => m.stage === scope)
  }, [season.matches, scope])

  const teamIds = season.teams.map((t) => t.id)
  const matrix = useMemo(() => buildH2HMatrix(matches, teamIds), [matches, teamIds])

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>对战矩阵</h1>
        <p className="muted" style={{ margin: 0 }}>
          单元格为「行队 胜-负 列队」。点击战队可进入预测页两两对比。
        </p>
      </header>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {(
          [
            ['all', '本赛季全部'],
            ['stage2', '第二轮'],
            ['stage1', '第一轮'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className={`tab${scope === k ? ' active' : ''}`} onClick={() => setScope(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="card card-pad table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>战队</th>
              {season.teams.map((t) => (
                <th key={t.id} title={t.name}>
                  <TeamAvatar team={t} size={24} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {season.teams.map((rowTeam) => (
              <tr key={rowTeam.id}>
                <td>
                  <Link to={`/predict?home=${rowTeam.id}`} className="team-chip">
                    <TeamAvatar team={rowTeam} size={24} />
                    <span>{rowTeam.shortName}</span>
                  </Link>
                </td>
                {season.teams.map((colTeam) => {
                  if (rowTeam.id === colTeam.id) {
                    return (
                      <td key={colTeam.id}>
                        <div className="h2h-cell h2h-self">—</div>
                      </td>
                    )
                  }
                  const cell = matrix[rowTeam.id][colTeam.id]
                  const played = cell.wins + cell.losses
                  const cls = played === 0 ? 'h2h-empty' : cell.wins > cell.losses ? 'h2h-win' : cell.wins < cell.losses ? 'h2h-lose' : 'h2h-empty'
                  return (
                    <td key={colTeam.id}>
                      <Link to={`/predict?home=${rowTeam.id}&away=${colTeam.id}`}>
                        <div className={`h2h-cell ${cls}`}>
                          {played === 0 ? '·' : `${cell.wins}-${cell.losses}`}
                        </div>
                      </Link>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
