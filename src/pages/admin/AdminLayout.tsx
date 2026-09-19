import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCampanha } from '@/contexts/CampanhaContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderPlus,
  FileSpreadsheet,
  Users,
  HeartHandshake,
  Package,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  TreePine,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/fichas', label: 'Fichas', icon: FolderPlus },
  { to: '/apadrinhamento', label: 'Apadrinhamento', icon: HeartHandshake },
  { to: '/sacolas', label: 'Sacolas', icon: Package },
  { to: '/contatos', label: 'Contatos', icon: Users },
  { to: '/checkin', label: 'Check-in', icon: ClipboardCheck },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/importacao', label: 'Importação', icon: FileSpreadsheet },
  { to: '/campanhas', label: 'Campanhas', icon: TreePine },
  { to: '/usuarios', label: 'Usuários', icon: Settings },
]

export function AdminLayout() {
  const { usuario, signOutUser } = useAuth()
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-2xl text-green-600">★</span>
        <div>
          <div className="text-sm font-bold">Natal Solidário</div>
          <div className="text-xs text-muted-foreground">GETJ</div>
        </div>
      </div>

      {campanha && (
        <div className="border-b px-6 py-3">
          <div className="text-xs text-muted-foreground">Campanha ativa</div>
          <div className="text-sm font-semibold">{campanha.nome}</div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-2 truncate text-xs text-muted-foreground">
          {usuario?.nome || usuario?.email}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            signOutUser()
            navigate('/')
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xl text-green-600">★</span>
          <span className="text-sm font-bold">Natal Solidário</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-white shadow-xl transition-transform duration-200 md:static md:bg-muted/30 md:shadow-none md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-2 top-2 z-10 p-1 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
