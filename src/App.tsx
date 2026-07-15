import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { StandingsPage } from '@/pages/StandingsPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { H2HPage } from '@/pages/H2HPage'
import { PredictPage } from '@/pages/PredictPage'
import { TeamsPage } from '@/pages/TeamsPage'
import { RulesPage } from '@/pages/RulesPage'
import { ArchivePage } from '@/pages/ArchivePage'
import { ArchiveDetailPage } from '@/pages/ArchiveDetailPage'
import { AboutPage } from '@/pages/AboutPage'
import { OutlookPage } from '@/pages/OutlookPage'

export default function App() {
  return (
    <BrowserRouter basename="/kpldata">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="standings" element={<StandingsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="h2h" element={<H2HPage />} />
          <Route path="predict" element={<PredictPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="archive/:seasonId" element={<ArchiveDetailPage />} />
          <Route path="outlook" element={<OutlookPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
