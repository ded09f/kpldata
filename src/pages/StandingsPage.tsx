import { useMemo, useState } from 'react'
import { getDefaultSeason } from '@/data/catalog'
import { StandingTableView } from '@/components/StandingTableView'

export function StandingsPage() {
  const season = getDefaultSeason()
  const [stageId, setStageId] = useState(season.currentStage ?? season.standings[0]?.stage)
  const stage = useMemo(
    () => season.standings.find((s) => s.stage === stageId) ?? season.standings[0],
    [season, stageId],
  )

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>积分榜</h1>
        <p className="muted" style={{ margin: 0 }}>
          按赛制阶段查看 SAB 分组排名。左侧色条表示晋级/卡位/淘汰形势。
        </p>
      </header>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {season.standings.map((s) => (
          <button
            key={s.stage}
            className={`tab${s.stage === stage.stage ? ' active' : ''}`}
            onClick={() => setStageId(s.stage)}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {stage.tables.map((t) => (
          <StandingTableView key={t.group} table={t} teams={season.teams} />
        ))}
      </div>
      <div className="card card-pad muted" style={{ fontSize: '0.9rem' }}>
        同分排序：积分 → 净胜局 → 小分（局胜场）。第一轮结束后积分清零进入第二轮 SAB。
      </div>
    </div>
  )
}
