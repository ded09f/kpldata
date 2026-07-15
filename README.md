# KPL Data

王者荣耀职业联赛（KPL）粉丝向数据站：历年赛事档案、赛制规则、积分榜、赛程、对战矩阵与胜率预测。

默认展示 **2026 KPL 夏季赛**。

在线访问（开启 GitHub Pages 后）：<https://ded09f.github.io/kpldata/>

## 功能

- 2026 夏季赛完整积分榜（SAB 多阶段）、赛程与赛果
- 对战矩阵 + Elo / 近况 / 交锋加权胜率预测
- 2016–2026 赛事档案（2016 两场、2017 三场、其余四年四场）
- 东西部 / 大组 / SAB / 年总大师精英组等赛制演进说明

## 本地开发

```bash
npm install
npm run validate-data
npm run dev
```

构建：

```bash
npm run build
npm run preview
```

注意：站点 `base` 为 `/kpldata/`，本地 preview 请访问 `http://localhost:4173/kpldata/`。

## 数据更新

- 赛季索引：`src/data/seasons/index.json`
- 当前赛季明细：`src/data/seasons/2026/summer.json`
- 时代规则：`src/data/rules/by-era.json`

修改 JSON 后执行：

```bash
npm run validate-data
```

## GitHub Pages 部署

1. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
2. 推送到 `main`（或本仓库已配置的分支）触发 `.github/workflows/deploy.yml`
3. 等待 Actions 成功后访问 `https://ded09f.github.io/kpldata/`

## 预测模型说明

确定性加权：

- Elo 期望胜率 55%（初值 1500，K=32）
- 近 5 场胜率 25%
- 本赛季交锋胜率 20%（无交锋时回退 Elo）

结果裁剪在 5%–95%。仅供参考。

## 免责声明

非官方站点。数据来自公开资料整理，可能存在延迟或错误。
