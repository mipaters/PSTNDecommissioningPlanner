import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useStore } from '@/store/useStore'
import Walkthrough from '@/pages/Walkthrough'
import Dashboard from '@/pages/Dashboard'
import NetworkMap from '@/pages/NetworkMap'
import Dependencies from '@/pages/Dependencies'
import WavePlanner from '@/pages/WavePlanner'
import Agents from '@/pages/Agents'
import Scenarios from '@/pages/Scenarios'
import Architecture from '@/pages/Architecture'
import BusinessCase from '@/pages/BusinessCase'

export default function App() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Walkthrough />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="map" element={<NetworkMap />} />
        <Route path="dependencies" element={<Dependencies />} />
        <Route path="waves" element={<WavePlanner />} />
        <Route path="agents" element={<Agents />} />
        <Route path="scenarios/:id?" element={<Scenarios />} />
        <Route path="architecture" element={<Architecture />} />
        <Route path="business-case" element={<BusinessCase />} />
        <Route path="*" element={<Walkthrough />} />
      </Route>
    </Routes>
  )
}
