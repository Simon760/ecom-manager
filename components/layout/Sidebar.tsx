'use client'
// ============================================================
// SIDEBAR — Navigation principale de l'application
// ============================================================
import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth, ProjectRefreshContext } from '@/contexts/AuthContext'
import { getProjects } from '@/services/projects.service'
import { Project } from '@/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  BarChart2,
  Calculator,
  Wallet,
  Palette,
  Package,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react'

// --- Navigation items par projet ---
const projectNavItems = [
  { href: '/tracker',    label: 'Tracker',       icon: BarChart2 },
  { href: '/calculator', label: 'Calculateur',   icon: Calculator },
  { href: '/finance',    label: 'Finance P&L',   icon: Wallet },
  { href: '/creatives',  label: 'Créatives',     icon: Palette },
  { href: '/products',   label: 'Produits',      icon: Package },
  { href: '/forecast',   label: 'Forecast',      icon: TrendingUp },
]

interface SidebarProps {
  onNewProject: () => void
}

interface SidebarContentProps {
  projects: Project[]
  loading: boolean
  expandedProjectId: string | null
  currentProjectId: string | null
  pathname: string
  onNewProject: () => void
  onToggleProject: (id: string) => void
  user: { displayName?: string | null; email?: string | null } | null
  signOut: () => void
}

// SidebarContent est défini en dehors du composant principal pour éviter les re-montages
function SidebarContent({
  projects,
  loading,
  expandedProjectId,
  currentProjectId,
  pathname,
  onNewProject,
  onToggleProject,
  user,
  signOut,
}: SidebarContentProps) {
  const isProjectActive = (projectId: string) => currentProjectId === projectId

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-zinc-100 tracking-tight">EcomManager</span>
        </div>
      </div>

      {/* Nav globale */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-2">
          Global
        </p>
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === '/dashboard' || pathname === '/dashboard/'}
        />
        <NavItem
          href="/projects"
          icon={FolderKanban}
          label="Mes projets"
          active={pathname === '/projects' || pathname === '/projects/'}
        />
      </div>

      {/* Projets */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            Projets
          </p>
          <button
            onClick={onNewProject}
            className="p-0.5 rounded text-zinc-600 hover:text-violet-400 transition-colors"
            title="Nouveau projet"
          >
            <Plus size={13} />
          </button>
        </div>

        {loading ? (
          <div className="px-2 py-3 text-xs text-zinc-600">Chargement…</div>
        ) : projects.length === 0 ? (
          <button
            onClick={onNewProject}
            className="w-full text-left px-2 py-2.5 rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors"
          >
            + Créer votre premier projet
          </button>
        ) : (
          <div className="space-y-0.5">
            {projects.map((project) => (
              <div key={project.id}>
                {/* Project header */}
                <button
                  onClick={() => onToggleProject(project.id)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors',
                    isProjectActive(project.id)
                      ? 'bg-violet-600/15 text-violet-300'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  )}
                >
                  <span className="truncate text-left">{project.name}</span>
                  {expandedProjectId === project.id ? (
                    <ChevronDown size={12} className="shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="shrink-0" />
                  )}
                </button>

                {/* Sub-navigation du projet */}
                {expandedProjectId === project.id && (
                  <div className="ml-2 pl-2 border-l border-zinc-800 mt-0.5 space-y-0.5">
                    {projectNavItems.map((item) => {
                      const href = `${item.href}?projectId=${project.id}`
                      const active =
                        (pathname === item.href || pathname === `${item.href}/`) &&
                        currentProjectId === project.id
                      return (
                        <Link
                          key={item.href}
                          href={href}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                            active
                              ? 'bg-violet-600/20 text-violet-300'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          )}
                        >
                          <item.icon size={12} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer utilisateur */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">
              {user?.displayName || 'Utilisateur'}
            </p>
            <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ onNewProject }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  const { refreshKey } = useContext(ProjectRefreshContext)
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentProjectId = searchParams.get('projectId')

  // Charge les projets — se redéclenche aussi quand refreshKey change (création depuis AppLayout)
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    getProjects(user.uid)
      .then((ps) => {
        if (cancelled) return
        setProjects(ps)
        // Auto-expand le projet actif
        if (currentProjectId) {
          setExpandedProjectId(currentProjectId)
        } else if (ps.length > 0) {
          setExpandedProjectId((prev) => prev ?? ps[0].id)
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Erreur chargement projets sidebar:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user, currentProjectId, refreshKey]) // refreshKey force le rechargement après création

  // Ferme le sidebar mobile sur navigation
  useEffect(() => setMobileOpen(false), [pathname, currentProjectId])

  const handleToggleProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId))
  }

  const contentProps: SidebarContentProps = {
    projects,
    loading,
    expandedProjectId,
    currentProjectId,
    pathname,
    onNewProject,
    onToggleProject: handleToggleProject,
    user,
    signOut,
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300"
        >
          <X size={16} />
        </button>
        <SidebarContent {...contentProps} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0">
        <SidebarContent {...contentProps} />
      </aside>
    </>
  )
}

// --- Nav Item ---
function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5',
        active
          ? 'bg-violet-600/20 text-violet-300'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
      )}
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}
