import { useState, useEffect } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeContatos, createContato, updateContato, deleteContato } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Contato } from '@/models/types'
import { toast } from 'sonner'

export function ContatosPage() {
  const { campanha } = useCampanha()
  const [contatos, setContatos] = useState<Contato[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contato | null>(null)

  useEffect(() => {
    if (!campanha) return
    return subscribeContatos(campanha.id, setContatos)
  }, [campanha])

  if (!campanha) return null

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contatos</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Voluntários do GETJ que intermediam o apadrinhamento. São o ponto de contato para problemas e responsáveis por conferir as sacolas.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Telefone</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contatos.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{c.nome}</td>
                <td className="p-3 font-mono text-xs">{c.telefone}</td>
                <td className="p-3 text-xs">{c.email || '-'}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setShowForm(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => {
                      if (confirm(`Excluir contato ${c.nome}?`)) {
                        deleteContato(campanha.id, c.id).then(() => toast.success('Contato excluído'))
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ContatoForm
          contato={editing}
          onClose={() => setShowForm(false)}
          onSave={async (data) => {
            if (editing) {
              await updateContato(campanha.id, editing.id, data)
              toast.success('Contato atualizado')
            } else {
              await createContato(campanha.id, data)
              toast.success('Contato criado')
            }
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function ContatoForm({
  contato,
  onClose,
  onSave,
}: {
  contato: Contato | null
  onClose: () => void
  onSave: (data: Omit<Contato, 'id' | 'createdAt'>) => Promise<void>
}) {
  const [nome, setNome] = useState(contato?.nome || '')
  const [telefone, setTelefone] = useState(contato?.telefone || '')
  const [email, setEmail] = useState(contato?.email || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{contato ? 'Editar Contato' : 'Novo Contato'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Telefone *</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11999999999" />
          </div>
          <div>
            <Label className="mb-1 block">Email (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Para futuro login" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1"
              disabled={!nome || !telefone}
              onClick={() => onSave({ nome, telefone, email: email || null, uid: contato?.uid || null })}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
