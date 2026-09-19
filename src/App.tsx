import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCampanha } from '@/contexts/CampanhaContext'
import { LoginPage } from '@/pages/LoginPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { CampanhasPage } from '@/pages/admin/CampanhasPage'
import { FichasListPage } from '@/pages/admin/FichasListPage'
import { ImportacaoPage } from '@/pages/admin/ImportacaoPage'
import { ContatosPage } from '@/pages/admin/ContatosPage'
import { ApadrinhamentoPage } from '@/pages/admin/ApadrinhamentoPage'
import { SacolasPage } from '@/pages/admin/SacolasPage'
import { CheckinPage } from '@/pages/admin/CheckinPage'
import { RelatoriosPage } from '@/pages/admin/RelatoriosPage'
import { UsuariosPage } from '@/pages/admin/UsuariosPage'
import { CadastroFichaPage } from '@/pages/cadastro/CadastroFichaPage'
import { FichasCadastradorPage } from '@/pages/cadastro/FichasCadastradorPage'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg text-muted-foreground">Carregando...</div>
    </div>
  )
}

function NoCampanha() {
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-destructive">Nenhuma campanha ativa</h1>
        <p className="mt-4 text-muted-foreground">
          O administrador precisa criar e ativar uma campanha antes que o sistema possa ser usado.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, usuario, loading } = useAuth()
  const { campanha, loading: campanhaLoading } = useCampanha()

  if (loading) return <LoadingScreen />
  if (!user || !usuario) return <LoginPage />

  // Cadastrador: só vê o cadastro de fichas
  if (usuario.role === 'cadastrador') {
    if (campanhaLoading) return <LoadingScreen />
    if (!campanha) return <NoCampanha />
    return (
      <Routes>
        <Route path="/" element={<FichasCadastradorPage />} />
        <Route path="/nova-ficha" element={<CadastroFichaPage />} />
        <Route path="/editar-ficha/:fichaId" element={<CadastroFichaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Admin: vê tudo
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="campanhas" element={<CampanhasPage />} />
        <Route path="fichas" element={<FichasListPage />} />
        <Route path="fichas/nova" element={<CadastroFichaPage />} />
        <Route path="fichas/editar/:fichaId" element={<CadastroFichaPage />} />
        <Route path="importacao" element={<ImportacaoPage />} />
        <Route path="contatos" element={<ContatosPage />} />
        <Route path="apadrinhamento" element={<ApadrinhamentoPage />} />
        <Route path="sacolas" element={<SacolasPage />} />
        <Route path="checkin" element={<CheckinPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
