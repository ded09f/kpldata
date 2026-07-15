import { Link } from 'react-router-dom'
import type { Team } from '@/types'

export function TeamAvatar({ team, size = 28 }: { team?: Team; size?: number }) {
  const label = (team?.shortName ?? '?').slice(0, 3).toUpperCase()
  const color = team?.color ?? '#64748B'
  return (
    <span
      className="team-avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.32 }}
      title={team?.name}
    >
      {label}
    </span>
  )
}

export function TeamChip({
  team,
  to,
}: {
  team?: Team
  to?: string
}) {
  const content = (
    <span className="team-chip">
      <TeamAvatar team={team} />
      <span>{team?.name ?? '未知战队'}</span>
    </span>
  )
  if (to) return <Link to={to}>{content}</Link>
  return content
}
