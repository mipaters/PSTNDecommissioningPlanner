import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity, Bot, Boxes, Briefcase, DollarSign, GitBranch, LayoutDashboard, Map, MessageSquare, Moon, Network, PlayCircle, RotateCcw, Sun, Workflow,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/ui'
import { CopilotPanel } from '@/components/CopilotPanel'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Executive Walkthrough', icon: PlayCircle },
  { to: '/dashboard', label: 'Program Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Network Map', icon: Map },
  { to: '/dependencies', label: 'Dependency Explorer', icon: GitBranch },
  { to: '/waves', label: 'Wave Planner', icon: Workflow },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/scenarios', label: 'User Scenarios', icon: Briefcase },
  { to: '/architecture', label: 'Architecture', icon: Boxes },
  { to: '/business-case', label: 'Business Case', icon: DollarSign },
]

export function Layout() {
  const { carrier, theme, toggleTheme, reset, copilotOpen, setCopilotOpen } = useStore()
  const loc = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setCopilotOpen(!useStore.getState().copilotOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCopilotOpen])

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1 text-center text-xs font-semibold text-navy-950" role="status">
        <Activity className="h-3.5 w-3.5" aria-hidden /> Demo mode · Illustrative data – for demonstration purposes
      </div>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Primary" className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 text-navy-950">
              <Network className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight text-slate-900 dark:text-white">LegacyLift</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{carrier} · PSTN sunset</div>
            </div>
          </div>
          <ul className="flex-1 space-y-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                      isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
                    )
                  }
                >
                  <n.icon className="h-4 w-4" aria-hidden /> {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-white/10">
            <Button className="w-full" onClick={() => setCopilotOpen(!copilotOpen)}>
              <MessageSquare className="h-4 w-4" aria-hidden /> AI Copilot <kbd className="ml-1 rounded bg-white/20 px-1.5 text-xs">C</kbd>
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={toggleTheme} aria-label="Toggle dark / light theme">
                {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={reset}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Reset demo
              </Button>
            </div>
          </div>
        </nav>
        <main key={loc.pathname} className="min-w-0 flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
        {copilotOpen && <CopilotPanel onClose={() => setCopilotOpen(false)} />}
      </div>
    </div>
  )
}
