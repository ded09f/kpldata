import { Link } from 'react-router-dom'
import { META, SEASON_INDEX } from '@/data/catalog'
import { formatDate } from '@/lib/formatters'

export function AboutPage() {
  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: 800 }}>
      <h1 style={{ margin: 0 }}>关于本站</h1>
      <div className="card card-pad">
        <p>
          <strong>KPL Data</strong> 是面向王者荣耀职业联赛（KPL）的粉丝向数据站，提供历年赛事档案、赛制说明，以及最新赛季的积分榜、赛程、对战矩阵与胜率预测。
        </p>
        <p className="muted">
          本站非腾讯 / KPL 官方产品。数据整理自公开资料（维基百科、Liquipedia、官方规则公告等），可能存在延迟或疏漏。预测模型为启发式估计，不构成投注建议。
        </p>
        <ul>
          <li>默认赛季：{SEASON_INDEX.defaultSeasonId}</li>
          <li>数据更新：{formatDate(SEASON_INDEX.updatedAt, true)}</li>
          <li>
            仓库：{' '}
            <a className="gold" href={META.repo} target="_blank" rel="noreferrer">
              {META.repo}
            </a>
          </li>
        </ul>
        <Link className="btn" to="/">
          返回总览
        </Link>
      </div>
    </div>
  )
}
