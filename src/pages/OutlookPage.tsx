import { useMemo, useState } from 'react'
import { getDefaultSeason } from '@/data/catalog'
import official from '@/data/rules/kpl-2026-official.json'
import { TeamAvatar } from '@/components/TeamChip'
import { computeStage2Outlooks, monteCarloPlayoffOutlook } from '@/lib/qualify/outlook'
import { buildGroupScenarios } from '@/lib/qualify/scenarios'
import { MC_ITERATIONS, MC_SEED } from '@/lib/qualify/rng'
import { pct, teamName } from '@/lib/formatters'
import type { Stage2Label } from '@/lib/qualify/rank'

const STAGE2_LABEL_TEXT: Record<Stage2Label, string> = {
  'S3-lock': '直通第三轮 S',
  'seat-SA': '打 S↔A 卡位',
  'A3-lock': '直通第三轮 A',
  'seat-AB': '打 A↔B 卡位',
  'elim-B': 'B组直接淘汰',
}

const PLAYOFF_TEXT = {
  upper: '胜者组',
  'lower-R2': '败者组第二轮',
  'lower-R1': '败者组第一轮',
  'out-A56': '第三轮 A5/A6 淘汰',
  'out-early': '第二轮/卡位淘汰',
} as const

export function OutlookPage() {
  const season = getDefaultSeason()
  const [tab, setTab] = useState<'teams' | 'scenarios'>('teams')
  const [scenarioGroup, setScenarioGroup] = useState<'S' | 'A' | 'B'>('S')
  const [expanded, setExpanded] = useState<string | null>(null)
  const groups = season.groups?.stage2

  const stage2Outlooks = useMemo(() => {
    if (!groups) return []
    return computeStage2Outlooks(season.matches, season.teams, groups)
  }, [season, groups])

  const playoffOutlooks = useMemo(() => {
    if (!groups) return []
    return monteCarloPlayoffOutlook(season.matches, season.teams, groups)
  }, [season, groups])

  const playoffById = useMemo(() => {
    const m = new Map(playoffOutlooks.map((p) => [p.teamId, p]))
    return m
  }, [playoffOutlooks])

  const sortedTeams = useMemo(() => {
    return [...stage2Outlooks].sort((a, b) => {
      const pa = playoffById.get(a.teamId)?.probs.upper ?? 0
      const pb = playoffById.get(b.teamId)?.probs.upper ?? 0
      return pb - pa
    })
  }, [stage2Outlooks, playoffById])

  const remCounts = useMemo(() => {
    const counts = { S: 0, A: 0, B: 0 } as Record<'S' | 'A' | 'B', number>
    for (const g of ['S', 'A', 'B'] as const) {
      counts[g] = season.matches.filter(
        (m) => m.stage === 'stage2' && m.group === g && m.status === 'scheduled',
      ).length
    }
    return counts
  }, [season.matches])

  const scenarios = useMemo(() => {
    if (!groups) return { remaining: [], groups: [], totalPaths: 0 }
    return buildGroupScenarios(season.matches, season.teams, scenarioGroup, groups[scenarioGroup])
  }, [season, scenarioGroup, groups])

  if (!groups) {
    return <div className="card card-pad">缺少第二轮分组数据</div>
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem' }}>晋级前景</h1>
        <p className="muted" style={{ margin: 0 }}>
          基于官方规则 {official.seat.rule} / {official.playoffs.rule}，用本赛季战绩模型推断剩余第二轮与卡位赛，
          并以蒙特卡洛（seed={MC_SEED}，N={MC_ITERATIONS}）模拟第三轮→季后赛入口。
        </p>
      </header>

      <div className="card card-pad" style={{ fontSize: '0.9rem' }}>
        <strong>规则锚点：</strong>
        {official.stage2.note} 卡位（{official.seat.rule}）：{official.seat.sa.join('；')}（{official.seat.saResult}）；
        {official.seat.ab.join('；')}（{official.seat.abResult}）。
        季后赛：{official.playoffs.teams}。{official.playoffs.bracketNote}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button type="button" className={`tab${tab === 'teams' ? ' active' : ''}`} onClick={() => setTab('teams')}>
          战队前景
        </button>
        <button
          type="button"
          className={`tab${tab === 'scenarios' ? ' active' : ''}`}
          onClick={() => setTab('scenarios')}
        >
          情景推演
        </button>
      </div>

      {tab === 'teams' && (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {sortedTeams.map((o) => {
            const team = season.teams.find((t) => t.id === o.teamId)
            const pf = playoffById.get(o.teamId)!
            return (
              <article key={o.teamId} className="card card-pad" style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <TeamAvatar team={team} size={36} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{team?.name ?? o.teamId}</div>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        当前第二轮 {o.group} 组
                      </div>
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    直通S {pct(o.afterSeat.toS3)} · 进A {pct(o.afterSeat.toA3)} · 出局 {pct(o.afterSeat.out)}
                  </div>
                </div>

                <div>
                  <div className="muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                    下一阶段（第二轮名次 → 卡位/第三轮）
                  </div>
                  <ProbRow
                    items={(Object.keys(STAGE2_LABEL_TEXT) as Stage2Label[])
                      .filter((k) => o.labels[k] > 0.005)
                      .map((k) => ({ label: STAGE2_LABEL_TEXT[k], value: o.labels[k] }))}
                  />
                </div>

                <div>
                  <div className="muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                    季后赛入口（含第三轮模拟）
                  </div>
                  <ProbRow
                    items={(Object.keys(PLAYOFF_TEXT) as (keyof typeof PLAYOFF_TEXT)[])
                      .filter((k) => pf.probs[k] > 0.005)
                      .map((k) => ({ label: PLAYOFF_TEXT[k], value: pf.probs[k] }))}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

      {tab === 'scenarios' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {(['S', 'A', 'B'] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={`tab${scenarioGroup === g ? ' active' : ''}`}
                onClick={() => {
                  setScenarioGroup(g)
                  setExpanded(null)
                }}
              >
                {g} 组剩余（{remCounts[g]} 场
                {scenarioGroup === g ? ` · ${scenarios.totalPaths} 种赛程` : ''}）
              </button>
            ))}
          </div>

          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            下列每一组是一种「最终名次/晋级标签」结果；组内列出能产生该结果的剩余比赛胜负组合（场次多时仅展示概率最高的路径）。
          </p>

          {scenarios.remaining.length === 0 ? (
            <div className="card card-pad muted">该组已无剩余比赛。</div>
          ) : (
            scenarios.groups.slice(0, 40).map((g) => (
              <article key={g.fingerprint} className="card card-pad" style={{ display: 'grid', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>概率 {pct(g.probability)}</strong>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      {g.pathCount} 种赛程
                    </span>
                  </div>
                  <button type="button" className="btn" onClick={() => setExpanded(expanded === g.fingerprint ? null : g.fingerprint)}>
                    {expanded === g.fingerprint ? '收起赛程' : '查看对应赛程'}
                  </button>
                </div>
                <div style={{ fontSize: '0.92rem' }}>
                  名次：{g.order.map((id, i) => `${i + 1}.${teamName(season.teams, id)}`).join(' → ')}
                </div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  标签：
                  {g.order
                    .map((id) => `${teamName(season.teams, id)}=${STAGE2_LABEL_TEXT[g.labels[id]]}`)
                    .join('；')}
                </div>
                {expanded === g.fingerprint && (
                  <div className="table-wrap">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>#</th>
                          {scenarios.remaining.map((m) => (
                            <th key={`${m.home}-${m.away}`}>
                              {teamName(season.teams, m.home)} vs {teamName(season.teams, m.away)}
                            </th>
                          ))}
                          <th>路径概率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.paths.map((p, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            {p.results.map((homeWins, i) => (
                              <td key={i} className={homeWins ? 'gold' : ''}>
                                {homeWins
                                  ? teamName(season.teams, scenarios.remaining[i].home)
                                  : teamName(season.teams, scenarios.remaining[i].away)}
                                胜
                              </td>
                            ))}
                            <td>{pct(p.prob, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ProbRow({ items }: { items: Array<{ label: string; value: number }> }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  return (
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <div className="prob-track" style={{ height: 10 }}>
        {items.map((item) => (
          <div
            key={item.label}
            title={`${item.label} ${pct(item.value)}`}
            style={{
              width: `${(item.value / total) * 100}%`,
              background: colorFor(item.label),
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', fontSize: '0.85rem' }}>
        {items.map((item) => (
          <span key={item.label}>
            <span style={{ color: colorFor(item.label) }}>●</span> {item.label}{' '}
            <strong>{pct(item.value)}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

function colorFor(label: string): string {
  if (label.includes('胜者') || label.includes('直通第三轮 S') || label.includes('S')) return '#f5a524'
  if (label.includes('败者组第二')) return '#60a5fa'
  if (label.includes('败者组第一') || label.includes('直通第三轮 A') || label.includes('A')) return '#3b82f6'
  if (label.includes('卡位')) return '#f472b6'
  if (label.includes('淘汰') || label.includes('出局')) return '#94a3b8'
  return '#a78bfa'
}
