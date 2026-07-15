# 数据维护说明

## 文件

| 路径 | 用途 |
|------|------|
| `src/data/meta.json` | 站点元信息、默认赛季 |
| `src/data/seasons/index.json` | 全部赛季摘要索引 |
| `src/data/seasons/2026/summer.json` | 当前赛季完整明细 |
| `src/data/rules/by-era.json` | 赛制时代说明 |

## 更新 2026 夏季赛赛果

1. 编辑 `summer.json` 的 `matches`：将对应场次 `status` 设为 `completed`，填写 `score` 与 `winner`
2. 重新计算并更新 `standings` 对应阶段表格（或运行仓库内生成脚本）
3. 更新 `updatedAt`
4. 运行 `npm run validate-data`

## 校验

```bash
npm run validate-data
npm test
```
