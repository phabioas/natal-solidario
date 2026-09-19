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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-muted/30">
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
          <div className="mb-2 text-xs text-muted-foreground">
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
