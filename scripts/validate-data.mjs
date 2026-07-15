import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = join(root, 'src/data/seasons/index.json')
const index = JSON.parse(readFileSync(indexPath, 'utf8'))

const yearCounts = {}
for (const s of index.seasons) {
  yearCounts[s.year] = (yearCounts[s.year] || 0) + 1
}

const errors = []

if (yearCounts[2016] !== 2) errors.push(`2016 expected 2, got ${yearCounts[2016]}`)
if (yearCounts[2017] !== 3) errors.push(`2017 expected 3, got ${yearCounts[2017]}`)
for (let y = 2018; y <= 2026; y++) {
  if (yearCounts[y] !== 4) errors.push(`${y} expected 4, got ${yearCounts[y]}`)
}

if (index.defaultSeasonId !== '2026-summer') {
  errors.push(`defaultSeasonId should be 2026-summer`)
}

const summerPath = join(root, 'src/data/seasons/2026/summer.json')
if (!existsSync(summerPath)) errors.push('missing 2026/summer.json')
else {
  const summer = JSON.parse(readFileSync(summerPath, 'utf8'))
  if (!summer.teams || summer.teams.length !== 18) errors.push('summer teams should be 18')
  if (!Array.isArray(summer.matches) || summer.matches.length < 45) errors.push('summer matches too few')
  const teamIds = new Set(summer.teams.map((t) => t.id))
  for (const m of summer.matches) {
    if (!teamIds.has(m.home) || !teamIds.has(m.away)) {
      errors.push(`match ${m.id} references unknown team`)
      break
    }
    if (m.status === 'completed') {
      if (!m.score || m.score.home == null || m.score.away == null) {
        errors.push(`completed match ${m.id} missing score`)
        break
      }
      if (!m.winner) {
        errors.push(`completed match ${m.id} missing winner`)
        break
      }
    }
  }
  for (const stage of summer.standings) {
    for (const table of stage.tables) {
      for (const row of table.rows) {
        if (!teamIds.has(row.teamId)) errors.push(`standing unknown team ${row.teamId}`)
      }
    }
  }
}

if (errors.length) {
  console.error('validate-data failed:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}

console.log('validate-data ok')
console.log('year counts', yearCounts)
console.log('seasons', index.seasons.length)
