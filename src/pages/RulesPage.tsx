import { ERA_RULES, getDefaultSeason } from '@/data/catalog'
import { formatKindLabel } from '@/lib/formatters'

export function RulesPage() {
  const season = getDefaultSeason()

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>赛制规则</h1>
        <p className="muted" style={{ margin: 0 }}>
          当前赛季：{season.name} · {formatKindLabel(season.formatKind)}
        </p>
      </header>

      <section className="card card-pad">
        <h2 style={{ marginTop: 0 }}>本赛季赛程阶段</h2>
        <p>{season.rules.summary}</p>
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {season.rules.stages.map((stage, idx) => (
            <div
              key={stage.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '0.85rem',
                padding: '0.85rem',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--gold-soft)',
                  color: 'var(--gold)',
                  fontWeight: 800,
                }}
              >
                {idx + 1}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{stage.name}</div>
                {stage.period && (
                  <div className="muted" style={{ fontSize: '0.85rem', margin: '0.15rem 0 0.35rem' }}>
                    {stage.period}
                  </div>
                )}
                <div style={{ fontSize: '0.95rem' }}>{stage.format}</div>
              </div>
            </div>
          ))}
        </div>
        {season.rules.tiebreakers && (
          <div style={{ marginTop: '1rem' }}>
            <h3>同分规则</h3>
            <ol>
              {season.rules.tiebreakers.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section>
        <h2>历年赛制演进</h2>
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {ERA_RULES.map((era) => (
            <div key={era.id} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <strong>{era.title}</strong>
                <span className="badge badge-soon">
                  {era.years} · {formatKindLabel(era.formatKind)}
                </span>
              </div>
              <p className="muted" style={{ marginBottom: 0 }}>
                {era.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
