import { NavLink, Outlet } from 'react-router-dom'
import { META, SEASON_INDEX } from '@/data/catalog'
import { SeasonSwitcher } from '@/components/SeasonSwitcher'
import { formatDate } from '@/lib/formatters'

const links = [
  { to: '/', label: '总览', end: true },
  { to: '/standings', label: '积分榜' },
  { to: '/schedule', label: '赛程' },
  { to: '/h2h', label: '对战' },
  { to: '/predict', label: '胜率预测' },
  { to: '/teams', label: '战队' },
  { to: '/rules', label: '赛制规则' },
  { to: '/archive', label: '历史档案' },
  { to: '/about', label: '关于' },
]

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(12px)',
          background: 'rgba(11, 15, 25, 0.85)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.85rem 0',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#F5A524,#3B82F6)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  color: '#0B0F19',
                }}
              >
                K
              </span>
              <div>
                <div style={{ fontWeight: 800, letterSpacing: '0.02em' }}>KPL Data</div>
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  默认 · 2026 夏季赛
                </div>
              </div>
            </NavLink>
            <SeasonSwitcher />
          </div>
          <nav style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 0 2.5rem' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 0' }}>
        <div className="container muted" style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            数据更新于 {formatDate(SEASON_INDEX.updatedAt, true)} · 非官方粉丝数据站
          </span>
          <a href={META.repo} target="_blank" rel="noreferrer" className="gold">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
