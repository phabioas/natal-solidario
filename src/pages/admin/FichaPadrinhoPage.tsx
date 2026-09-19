import { useState, useEffect } from 'react'
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

  const handleShareWhatsApp = () => {
    const text = montaTextoWhatsApp(crianca, idade, campanha.ano)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleSaveImage = () => {
    try {
      const dataUrl = gerarImagemFicha(crianca, idade, campanha.ano, campanha.nome)
      downloadImage(dataUrl, crianca.idCrianca)
      toast.success('Imagem salva!')
    } catch (err) {
      console.error('Erro:', err)
      toast.error('Erro ao gerar imagem.')
    }
  }

  const handleShareImage = async () => {
    try {
      const dataUrl = gerarImagemFicha(crianca, idade, campanha.ano, campanha.nome)
      const blob = dataURLtoBlob(dataUrl)
      const file = new File([blob], `ficha-${crianca.idCrianca.replace('/', '-')}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Ficha ${crianca.idCrianca}` })
      } else {
        downloadImage(dataUrl, crianca.idCrianca)
        toast.success('Imagem baixada! Compartilhe no WhatsApp.')
      }
    } catch (err) {
      console.error('Erro:', err)
      // Não mostrar erro se o user cancelou o share
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Erro ao compartilhar. Use o botão Salvar.')
      }
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
              <Share2 className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveImage}>
              <Download className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareImage}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
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
          <FichaPadrinhoCard
            crianca={crianca}
            idade={idade}
            ano={campanha.ano}
            campanhaNome={campanha.nome}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Canvas image generator ──────────────────────────────

function gerarImagemFicha(crianca: Crianca, idade: string, ano: number, campanhaNome: string): string {
  const W = 800
  const P = 40 // padding
  let y = P
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = W
  canvas.height = 900 // will adjust
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, canvas.height)

  // Helper
  const centerText = (text: string, size: number, color: string, bold = false) => {
    ctx.fillStyle = color
    ctx.font = `${bold ? 'bold ' : ''}${size}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(text, W / 2, y)
    y += size + 6
  }
  const labelValue = (label: string, value: string, x: number, maxWidth?: number) => {
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.fillStyle = '#333'
    ctx.textAlign = 'left'
    ctx.fillText(label, x, y)
    const labelW = ctx.measureText(label).width
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText(value, x + labelW + 6, y, maxWidth ? maxWidth - labelW - 6 : undefined)
  }
  const drawBox = (x: number, w: number, h: number, fill: string, border?: string) => {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h) }
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h) }
  }

  // Header
  centerText('Grupo Espírita Trabalhadores de Jesus', 14, '#666')
  y += 10
  centerText(`★ Natal Solidário ${ano}`, 28, '#16a34a', true)
  y += 14
  // Green line
  ctx.strokeStyle = '#16a34a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(P, y)
  ctx.lineTo(W - P, y)
  ctx.stroke()
  y += 24

  // Ficha number box
  const boxW = 280
  const boxX = (W - boxW) / 2
  const boxY = y
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#16a34a'
  ctx.lineWidth = 3
  ctx.fillRect(boxX, boxY, boxW, 70)
  ctx.strokeRect(boxX, boxY, boxW, 70)
  ctx.fillStyle = '#666'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('NÚMERO DA FICHA', W / 2, boxY + 22)
  ctx.fillStyle = '#16a34a'
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(crianca.idCrianca, W / 2, boxY + 58)
  y = boxY + 70 + 24

  // Dados da criança
  ctx.fillStyle = '#333'
  ctx.font = 'bold 18px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Dados da Criança', P, y)
  y += 8
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(P, y)
  ctx.lineTo(W - P, y)
  ctx.stroke()
  y += 24

  const colW = (W - P * 2) / 2
  const sexo = crianca.sexo === 'M' ? '♂ Masculino' : '♀ Feminino'
  const nasc = crianca.dataNascimento ? formatDate(crianca.dataNascimento) : '-'

  labelValue('Nome:', crianca.nomeCompleto, P, W - P * 2)
  y += 28
  labelValue('Sexo:', sexo, P, colW)
  labelValue('Idade:', idade, P + colW, colW)
  y += 28
  labelValue('Nascimento:', nasc, P, colW)
  labelValue('Camisa:', crianca.tamCamiseta || '-', P + colW, colW)
  y += 28
  labelValue('Calça:', crianca.tamCalca || '-', P, colW)
  labelValue('Calçado:', crianca.tamCalcado || '-', P + colW, colW)
  y += 28
  labelValue('TEA:', crianca.tea ? 'SIM' : 'Não', P, colW)
  y += 30

  if (crianca.observacao) {
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillStyle = '#666'
    ctx.textAlign = 'left'
    const obs = `Obs.: ${crianca.observacao}`
    ctx.fillText(obs, P, y, W - P * 2)
    y += 24
  }
  y += 16

  // Sacolinha box
  const sacH = 130
  drawBox(P, W - P * 2, sacH, '#f0fdf4', '#16a34a')
  ctx.fillStyle = '#16a34a'
  ctx.font = 'bold 16px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🎁 A sacolinha deve conter:', P + 16, y + 24)
  ctx.fillStyle = '#333'
  ctx.font = '14px system-ui, sans-serif'
  const items = [
    '• Conjunto de roupa nova (camiseta, calça, vestido, meias, etc.)',
    '• Calçado novo',
    '• Brinquedo novo',
    '• Produtos de higiene (escova, pasta, shampoo, condicionador)',
  ]
  items.forEach((item, i) => {
    ctx.fillText(item, P + 16, y + 48 + i * 20, W - P * 2 - 32)
  })
  y += sacH + 16

  // Prazo box
  const prazoH = 56
  drawBox(P, W - P * 2, prazoH, '#fef3c7', '#f59e0b')
  ctx.fillStyle = '#92400e'
  ctx.font = 'bold 15px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`⏰ A sacolinha deve ser entregue até o dia 06/12/${ano}`, W / 2, y + 24)
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('(uma semana antes da festa)', W / 2, y + 42)
  y += prazoH + 16

  // Contato box
  const contH = 50
  drawBox(P, W - P * 2, contH, '#dbeafe', '#3b82f6')
  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('📞 Dúvidas ou participação na entrega:', W / 2, y + 20)
  ctx.font = '14px system-ui, sans-serif'
  ctx.fillText('WhatsApp: (11) 98117-6718', W / 2, y + 40)
  y += contH + 16

  // Footer
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(P, y)
  ctx.lineTo(W - P, y)
  ctx.stroke()
  y += 16
  ctx.fillStyle = '#999'
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const footer = `${campanhaNome} · Ficha gerada em ${new Date().toLocaleDateString('pt-BR')}`
  ctx.fillText(footer, W / 2, y)

  // Crop to actual height
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = W
  finalCanvas.height = y + P
  const fctx = finalCanvas.getContext('2d')!
  fctx.fillStyle = '#ffffff'
  fctx.fillRect(0, 0, W, finalCanvas.height)
  fctx.drawImage(canvas, 0, 0)

  return finalCanvas.toDataURL('image/png')
}

// ─── Helpers ─────────────────────────────────────────────

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
      <div style={{ textAlign: 'center', borderBottom: '3px solid #16a34a', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>Grupo Espírita Trabalhadores de Jesus</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>★ Natal Solidário {ano}</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', border: '3px solid #16a34a', borderRadius: '12px', padding: '12px 32px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>NÚMERO DA FICHA</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#16a34a' }}>{crianca.idCrianca}</div>
        </div>
      </div>

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
              <td style={{ padding: '4px 0' }}><strong>Idade:</strong> {idade}</td>
              <td style={{ padding: '4px 0' }}><strong>Nascimento:</strong> {crianca.dataNascimento ? formatDate(crianca.dataNascimento) : '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}><strong>Camisa:</strong> {crianca.tamCamiseta || '-'}</td>
              <td style={{ padding: '4px 0' }}><strong>Calça:</strong> {crianca.tamCalca || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}><strong>Calçado:</strong> {crianca.tamCalcado || '-'}</td>
              <td style={{ padding: '4px 0' }}><strong>TEA:</strong> {crianca.tea ? 'SIM' : 'Não'}</td>
            </tr>
          </tbody>
        </table>
        {crianca.observacao && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            <strong>Obs.:</strong> {crianca.observacao}
          </div>
        )}
      </div>

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

      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#92400e' }}>
          ⏰ A sacolinha deve ser entregue até o dia 06/12/{ano}
        </div>
        <div style={{ fontSize: '12px', color: '#92400e' }}>(uma semana antes da festa)</div>
      </div>

      <div style={{ background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '14px' }}>
        <strong>📞 Dúvidas ou participação na entrega:</strong><br />
        WhatsApp: (11) 98117-6718
      </div>

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
  text += `*Idade:* ${idade}\n`
  text += `*Camisa:* ${crianca.tamCamiseta || '-'}\n`
  text += `*Calça:* ${crianca.tamCalca || '-'}\n`
  text += `*Calçado:* ${crianca.tamCalcado || '-'}\n`
  text += `*TEA:* ${crianca.tea ? 'SIM' : 'Não'}\n\n`
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

function downloadImage(dataUrl: string, idCrianca: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `ficha-${idCrianca.replace('/', '-')}.png`
  a.click()
}

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  const n = bstr.length
  const u8 = new Uint8Array(n)
  for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i)
  return new Blob([u8], { type: mime })
}
