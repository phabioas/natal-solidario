import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Gift, RefreshCw, TreePine } from 'lucide-react'
import { subscribeCriancasPublicas, subscribeListaPublica } from '@/services/firestore'
import type { CriancaPublica, ListaPublica } from '@/models/types'

export function PublicDisponiveisPage() {
  const { token = '' } = useParams()
  const [lista, setLista] = useState<ListaPublica | null>(null)
  const [criancas, setCriancas] = useState<CriancaPublica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Crianças disponíveis · Natal Solidário GETJ'
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    const previousRobots = robots.content
    robots.content = 'noindex, nofollow, noarchive'
    return () => {
      document.title = previousTitle
      if (created) robots?.remove()
      else if (robots) robots.content = previousRobots
    }
  }, [])

  useEffect(() => {
    let metaLoaded = false
    let childrenLoaded = false
    const finish = () => {
      if (metaLoaded && childrenLoaded) setLoading(false)
    }
    const onError = () => { setError(true); setLoading(false) }
    const unsubLista = subscribeListaPublica(token, (value) => {
      setLista(value)
      metaLoaded = true
      finish()
    }, onError)
    const unsubCriancas = subscribeCriancasPublicas(token, (value) => {
      setCriancas(value)
      childrenLoaded = true
      finish()
    }, onError)
    return () => { unsubLista(); unsubCriancas() }
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50 p-6">
        <div className="flex items-center gap-2 text-green-800"><RefreshCw className="h-5 w-5 animate-spin" /> Carregando lista...</div>
      </div>
    )
  }

  if (error || !lista) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <div><TreePine className="mx-auto mb-3 h-10 w-10 text-gray-400" /><h1 className="text-xl font-bold">Lista indisponível</h1><p className="mt-2 text-sm text-gray-600">Confira se o link recebido está completo.</p></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="text-4xl text-green-700">★</div>
          <h1 className="mt-1 text-2xl font-bold text-green-800 sm:text-3xl">Natal Solidário GETJ</h1>
          <p className="mt-1 text-gray-600">{lista.nome}</p>
          <h2 className="mt-5 text-lg font-semibold">Crianças disponíveis para apadrinhamento</h2>
          <p className="mt-2 text-sm text-gray-600">Escolha uma criança e informe o número da ficha para a pessoa responsável pelo apadrinhamento.</p>
          <div className="mt-4 inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
            {criancas.length} {criancas.length === 1 ? 'criança disponível' : 'crianças disponíveis'}
          </div>
        </header>

        {criancas.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <Gift className="mx-auto h-10 w-10 text-green-600" />
            <h2 className="mt-3 text-lg font-bold">Todas as crianças foram apadrinhadas!</h2>
            <p className="mt-1 text-sm text-gray-600">Obrigado a todos que participaram.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {criancas.map((crianca) => (
              <article key={crianca.id} className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-lg font-semibold text-gray-900">{crianca.nomePublico}</div>
                    <div className="mt-1 text-sm text-gray-600">Idade: <strong>{crianca.idade}</strong></div>
                  </div>
                  <div className="shrink-0 rounded-lg bg-green-100 px-3 py-2 font-mono text-base font-bold text-green-800">
                    {crianca.idCrianca}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-8 border-t pt-4 text-center text-xs text-gray-500">
          Esta lista é atualizada automaticamente. Nomes são parcialmente ocultados para preservar a privacidade das crianças.
        </footer>
      </div>
    </main>
  )
}
