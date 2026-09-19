import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Share2, Printer, Download } from 'lucide-react'
import type { Ficha, Crianca } from '@/models/types'
import { calcularIdade } from '@/lib/idade'
import { toast } from 'sonner'

export function FichaPadrinhoPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const fichaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const dataFesta = campanha?.dataEvento
    ? new Date(campanha.dataEvento.seconds * 1000).toISOString().split('T')[0]
    : '2026-12-13'

  const resultado = fichas
    .filter((f) => f.status === 'ativa')
    .flatMap((f) => f.criancas.map((c) => ({ ficha: f, crianca: c })))
    .find(({ crianca }) => crianca.idCrianca === params.criancaId)

  if (!campanha || !resultado) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Criança não encontrada</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    )
  }

  const { crianca } = resultado
  const idade = crianca.dataNascimento
    ? calcularIdade(crianca.dataNascimento, dataFesta)
    : crianca.idadeTexto || '-'

  const handleShareWhatsApp = async () => {
    const text = montaTextoWhatsApp(crianca, idade, campanha.ano)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleShareImage = async () => {
    if (!fichaRef.current) return
    try {
      toast.loading('Gerando imagem...', { id: 'img' })
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(fichaRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/png')

      // Tenta compartilhar como arquivo (mobile)
      if (navigator.canShare) {
        try {
          const res = await fetch(dataUrl)
          const blob = await res.blob()
          const file = new File([blob], `ficha-${crianca.idCrianca.replace('/', '-')}.png`, { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Ficha ${crianca.idCrianca}`,
            })
            toast.dismiss('img')
            return
          }
        } catch {
          // User cancelou ou não suporta - cai pro download
        }
      }

      // Fallback: download da imagem
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `ficha-${crianca.idCrianca.replace('/', '-')}.png`
      a.click()
      toast.success('Imagem baixada! Compartilhe no WhatsApp.', { id: 'img' })
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
      toast.error('Erro ao gerar imagem. Use o botão WhatsApp.', { id: 'img' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print sticky top-0 z-10 border-b bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
              <Share2 className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareImage}>
              <Download className="mr-2 h-4 w-4" />
              Imagem
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-4 print:p-0">
        <div className="print-area">
          <div ref={fichaRef}>
            <FichaPadrinhoCard
              crianca={crianca}
              idade={idade}
              ano={campanha.ano}
              campanhaNome={campanha.nome}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FichaPadrinhoCard({
  crianca,
  idade,
  ano,
  campanhaNome,
}: {
  crianca: Crianca
  idade: string
  ano: number
  campanhaNome: string
}) {
  return (
    <div style={{ background: '#fff', padding: '32px', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '3px solid #16a34a', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>Grupo Espírita Trabalhadores de Jesus</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>★ Natal Solidário {ano}</div>
      </div>

      {/* Ficha number - destaque */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', border: '3px solid #16a34a', borderRadius: '12px', padding: '12px 32px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>NÚMERO DA FICHA</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#16a34a' }}>{crianca.idCrianca}</div>
        </div>
      </div>

      {/* Dados da criança */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
          Dados da Criança
        </div>
        <table style={{ width: '100%', fontSize: '15px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0' }}><strong>Nome:</strong> {crianca.nomeCompleto}</td>
              <td style={{ padding: '4px 0' }}><strong>Sexo:</strong> {crianca.sexo === 'M' ? '♂ Masculino' : '♀ Feminino'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}><strong>Idade na festa:</strong> {idade}</td>
              <td style={{ padding: '4px 0' }}><strong>Nascimento:</strong> {crianca.dataNascimento ? formatDate(crianca.dataNascimento) : '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}><strong>Camisa:</strong> {crianca.tamCamiseta || '-'}</td>
              <td style={{ padding: '4px 0' }}><strong>Calça:</strong> {crianca.tamCalca || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}><strong>Calçado:</strong> {crianca.tamCalcado || '-'}</td>
              <td style={{ padding: '4px 0' }}><strong>TEA:</strong> {crianca.tea ? '🧩 Sim' : 'Não'}</td>
            </tr>
          </tbody>
        </table>
        {crianca.observacao && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            <strong>Obs.:</strong> {crianca.observacao}
          </div>
        )}
      </div>

      {/* Instruções da sacolinha */}
      <div style={{ background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a', marginBottom: '8px' }}>
          🎁 A sacolinha deve conter:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
          <li>Conjunto de roupa nova (camiseta, calça, vestido, meias, cuecas, calcinha, etc.)</li>
          <li>Calçado novo</li>
          <li>Brinquedo novo</li>
          <li>Produtos de higiene (escova, pasta dental, shampoo, condicionador)</li>
        </ul>
      </div>

      {/* Prazo de entrega */}
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#92400e' }}>
          ⏰ A sacolinha deve ser entregue até o dia 06/12/{ano}
        </div>
        <div style={{ fontSize: '12px', color: '#92400e' }}>(uma semana antes da festa)</div>
      </div>

      {/* Contato */}
      <div style={{ background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '14px' }}>
        <strong>📞 Dúvidas ou participação na entrega:</strong><br />
        WhatsApp: (11) 98117-6718
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
        {campanhaNome} · Ficha gerada em {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  )
}

function montaTextoWhatsApp(crianca: Crianca, idade: string, ano: number): string {
  let text = `*★ NATAL SOLIDÁRIO GETJ ${ano}*\n\n`
  text += `*Ficha:* ${crianca.idCrianca}\n`
  text += `*Nome:* ${crianca.nomeCompleto}\n`
  text += `*Sexo:* ${crianca.sexo === 'M' ? '♂ Masculino' : '♀ Feminino'}\n`
  text += `*Idade na festa:* ${idade}\n`
  text += `*Camisa:* ${crianca.tamCamiseta || '-'}\n`
  text += `*Calça:* ${crianca.tamCalca || '-'}\n`
  text += `*Calçado:* ${crianca.tamCalcado || '-'}\n`
  text += `*TEA:* ${crianca.tea ? '🧩 Sim' : 'Não'}\n\n`
  text += `*🎁 A sacolinha deve conter:*\n`
  text += `• Conjunto de roupa nova\n`
  text += `• Calçado novo\n`
  text += `• Brinquedo novo\n`
  text += `• Produtos de higiene\n\n`
  text += `*⏰ Entregar até 06/12/${ano}*\n\n`
  text += `📞 WhatsApp: (11) 98117-6718`
  return text
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}
