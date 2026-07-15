import { useMemo, useState } from 'react'
import { getDefaultSeason } from '@/data/catalog'
import { MatchCard } from '@/components/MatchCard'
import { groupLabel } from '@/lib/formatters'

export function SchedulePage() {
  const season = getDefaultSeason()
  const [stage, setStage] = useState<'all' | string>(season.currentStage ?? 'all')
  const [status, setStatus] = useState<'all' | 'completed' | 'scheduled'>('all')

  const stages = useMemo(() => {
    const set = new Set(season.matches.map((m) => m.stage))
    return ['all', ...set]
  }, [season.matches])

  const filtered = useMemo(() => {
    return [...season.matches]
      .filter((m) => (stage === 'all' ? true : m.stage === stage))
      .filter((m) => (status === 'all' ? true : m.status === status))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [season.matches, stage, status])

  const stageLabel = (id: string) => {
    if (id === 'all') return '全部阶段'
    return season.standings.find((s) => s.stage === id)?.label ?? id
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>赛程与结果</h1>
        <p className="muted" style={{ margin: 0 }}>
          共 {filtered.length} 场 · 未开始的对阵可跳转胜率预测
        </p>
      </header>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {stages.map((s) => (
          <button
            key={s}
            type="button"
            className={`tab${stage === s ? ' active' : ''}`}
            onClick={() => setStage(s)}
          >
            {stageLabel(s)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(
          [
            ['all', '全部'],
            ['completed', '已结束'],
            ['scheduled', '未开始'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`tab${status === k ? ' active' : ''}`}
            onClick={() => setStatus(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {filtered.map((m) => (
          <div key={m.id}>
            <div className="muted" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              {m.group ? groupLabel(m.group) : m.stage}
            </div>
            <MatchCard match={m} teams={season.teams} showPredict />
          </div>
        ))}
      </div>
    </div>
  )
}
