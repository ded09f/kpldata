import { useEffect, useMemo, useState } from 'react'
import { getDefaultSeason } from '@/data/catalog'
import official from '@/data/rules/kpl-2026-official.json'
import { TeamAvatar } from '@/components/TeamChip'
import {
  computeStage2Outlooks,
  monteCarloPlayoffOutlookAsync,
  type TeamPlayoffOutlook,
} from '@/lib/qualify/outlook'
import { buildGroupScenarios } from '@/lib/qualify/scenarios'
import { MC_ITERATIONS, MC_SEED } from '@/lib/qualify/rng'
import { pct, teamName, teamShort } from '@/lib/formatters'
import type { PlayoffLabel, Stage2Label } from '@/lib/qualify/rank'

const STAGE2_LABEL_TEXT: Record<Stage2Label, string> = {
  'S3-lock': '直通第三轮 S',
  'seat-SA': '打 S↔A 卡位',
  'A3-lock': '直通第三轮 A',
  'seat-AB': '打 A↔B 卡位',
  'elim-B': 'B组直接淘汰',
}

const STAGE2_COLORS: Record<Stage2Label, string> = {
  'S3-lock': '#e8b4b8',
  'seat-SA': '#c3aed6',
  'A3-lock': '#a8d8ea',
  'seat-AB': '#d4a5a5',
  'elim-B': '#b8b8aa',
}

const PLAYOFF_TEXT: Record<PlayoffLabel, string> = {
  upper: '胜者组',
  'lower-R2': '败者组第二轮',
  'lower-R1': '败者组第一轮',
  'out-A56': '第三轮 A5/A6 淘汰',
  'out-early': '第二轮/卡位淘汰',
}

/** 马卡龙 / 莫兰迪：豆沙粉、雾霾蓝、豆青绿、焦糖杏、暖灰 */
const PLAYOFF_COLORS: Record<PlayoffLabel, string> = {
  upper: '#e8b4b8',
  'lower-R2': '#9bb7d4',
  'lower-R1': '#a8c5b8',
  'out-A56': '#e0c4a8',
  'out-early': '#c5c0b8',
}

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

  const [playoffOutlooks, setPlayoffOutlooks] = useState<TeamPlayoffOutlook[]>([])
  const [mcProgress, setMcProgress] = useState(0)
  const [mcRunning, setMcRunning] = useState(false)
  const [mcError, setMcError] = useState<string | null>(null)

  useEffect(() => {
    if (!groups) return
    const ac = new AbortController()
    setMcRunning(true)
    setMcProgress(0)
    setMcError(null)
    setPlayoffOutlooks([])

    void monteCarloPlayoffOutlookAsync(season.matches, season.teams, groups, {
      iterations: MC_ITERATIONS,
      seed: MC_SEED,
      chunkSize: 2500,
      signal: ac.signal,
      onProgress: (done, total) => setMcProgress(done / total),
    })
      .then((result) => {
        if (!ac.signal.aborted) {
          setPlayoffOutlooks(result)
          setMcRunning(false)
          setMcProgress(1)
        }
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return
        setMcRunning(false)
        setMcError(err instanceof Error ? err.message : '模拟失败')
      })

    return () => ac.abort()
  }, [season, groups])

  const playoffById = useMemo(() => {
    return new Map(playoffOutlooks.map((p) => [p.teamId, p]))
  }, [playoffOutlooks])

  const sortedTeams = useMemo(() => {
    return [...stage2Outlooks].sort((a, b) => {
      const pa = playoffById.get(a.teamId)?.probs.upper ?? a.afterSeat.toS3
      const pb = playoffById.get(b.teamId)?.probs.upper ?? b.afterSeat.toS3
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
    if (!groups) return { remaining: [], groups: [], totalPaths: 0, mode: 'exact' as const }
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
          并以蒙特卡洛（seed={MC_SEED}，N={MC_ITERATIONS.toLocaleString('en-US')}）模拟第三轮→季后赛入口。
        </p>
      </header>

      <div className="card card-pad" style={{ fontSize: '0.9rem' }}>
        <strong>规则锚点：</strong>
        {official.stage2.note} 卡位（{official.seat.rule}）：{official.seat.sa.join('；')}（{official.seat.saResult}）；
        {official.seat.ab.join('；')}（{official.seat.abResult}）。
        季后赛：{official.playoffs.teams}。{official.playoffs.bracketNote}
      </div>

      {mcRunning && (
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>季后赛入口模拟中…</strong>
            <span className="muted">{Math.round(mcProgress * 100)}%</span>
          </div>
          <div className="prob-track" style={{ height: 10 }}>
            <div style={{ width: `${mcProgress * 100}%`, background: 'var(--gold)' }} />
          </div>
        </div>
      )}
      {mcError && <div className="card card-pad" style={{ color: 'var(--red)' }}>{mcError}</div>}

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
            const pf = playoffById.get(o.teamId)
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
                      .map((k) => ({
                        label: STAGE2_LABEL_TEXT[k],
                        value: o.labels[k],
                        color: STAGE2_COLORS[k],
                      }))}
                  />
                </div>

                <div>
                  <div className="muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                    季后赛入口（含第三轮模拟）
                  </div>
                  {pf ? (
                    <ProbRow
                      items={(Object.keys(PLAYOFF_TEXT) as PlayoffLabel[])
                        .filter((k) => pf.probs[k] > 0.005)
                        .map((k) => ({
                          label: PLAYOFF_TEXT[k],
                          value: pf.probs[k],
                          color: PLAYOFF_COLORS[k],
                        }))}
                    />
                  ) : (
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {mcRunning ? '等待模拟完成…' : '暂无数据'}
                    </div>
                  )}
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
                {scenarioGroup === g
                  ? ` · ${scenarios.mode === 'exact' ? `${scenarios.totalPaths} 种含小分赛程` : `MC ${scenarios.totalPaths.toLocaleString()} 次`}`
                  : ''}
                ）
              </button>
            ))}
          </div>

          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            下列每一组是一种「最终名次/晋级标签」结果（已计入 BO5 小分 3-0/3-1/3-2 对净胜局的影响）。
            组内列出对应赛程；队名使用简称以节省宽度。剩余场次较多时用蒙特卡洛抽样。
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
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setExpanded(expanded === g.fingerprint ? null : g.fingerprint)}
                  >
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
                              {teamShort(season.teams, m.home)}-{teamShort(season.teams, m.away)}
                            </th>
                          ))}
                          <th>路径概率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.paths.map((p, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            {p.scores.map((score, i) => {
                              const r = p.results[i]
                              const homeShort = teamShort(season.teams, scenarios.remaining[i].home)
                              const awayShort = teamShort(season.teams, scenarios.remaining[i].away)
                              const winnerShort = r.winner === r.home ? homeShort : awayShort
                              return (
                                <td key={i}>
                                  <span className="gold">{winnerShort}</span>
                                  <span className="muted"> {score}</span>
                                </td>
                              )
                            })}
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

function ProbRow({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  return (
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <div className="prob-track" style={{ height: 12 }}>
        {items.map((item) => (
          <div
            key={item.label}
            title={`${item.label} ${pct(item.value)}`}
            style={{
              width: `${(item.value / total) * 100}%`,
              background: item.color,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', fontSize: '0.85rem' }}>
        {items.map((item) => (
          <span key={item.label}>
            <span style={{ color: item.color }}>●</span> {item.label} <strong>{pct(item.value)}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
