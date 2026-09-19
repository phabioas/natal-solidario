import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { CampanhaProvider } from '@/contexts/CampanhaContext'
import App from '@/App'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CampanhaProvider>
          <App />
          <Toaster position="top-right" richColors />
        </CampanhaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
