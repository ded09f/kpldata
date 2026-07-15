import type { StandingTable, Team } from '@/types'
import { groupLabel, qualificationClass, qualificationLabel } from '@/lib/formatters'
import { TeamChip } from '@/components/TeamChip'

export function StandingTableView({
  table,
  teams,
  showQualification = true,
}: {
  table: StandingTable
  teams: Team[]
  showQualification?: boolean
}) {
  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>{groupLabel(table.group)}</h3>
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          {table.rows.length} 支战队
        </span>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>战队</th>
              <th>胜</th>
              <th>负</th>
              <th>积分</th>
              <th>净胜局</th>
              <th>小分</th>
              {showQualification && <th>形势</th>}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => {
              const team = teams.find((t) => t.id === row.teamId)
              return (
                <tr key={row.teamId} className={qualificationClass(row.qualification)}>
                  <td>{row.rank}</td>
                  <td>
                    <TeamChip team={team} />
                  </td>
                  <td>{row.wins}</td>
                  <td>{row.losses}</td>
                  <td className="gold" style={{ fontWeight: 700 }}>
                    {row.points}
                  </td>
                  <td>
                    {row.gameDiff > 0 ? '+' : ''}
                    {row.gameDiff}
                  </td>
                  <td>
                    {row.gameWins}-{row.gameLosses}
                  </td>
                  {showQualification && (
                    <td className="muted">{qualificationLabel(row.qualification)}</td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
