import { useState, useEffect } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeContatos, createContato, updateContato, deleteContato } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Contato } from '@/models/types'
import { toast } from 'sonner'

export function ContatosPage() {
  const { campanha } = useCampanha()
  const { usuario } = useAuth()
  const [contatos, setContatos] = useState<Contato[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contato | null>(null)

  useEffect(() => {
    if (!campanha) return
    return subscribeContatos(campanha.id, setContatos)
  }, [campanha])

  if (!campanha) return null

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Contatos</h1>
        <Button className="h-11 md:h-10" onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Voluntários do GETJ que intermediam o apadrinhamento. São o ponto de contato para problemas e responsáveis por conferir as sacolas.
      </p>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
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
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setShowForm(true) }} aria-label={`Editar ${c.nome}`} title="Editar contato">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {usuario?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      aria-label={`Excluir ${c.nome}`}
                      title="Excluir contato"
                      onClick={() => {
                        if (confirm(`Excluir contato ${c.nome}?`)) {
                          deleteContato(campanha.id, c.id).then(() => toast.success('Contato excluído'))
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {contatos.map((contato) => (
          <article key={contato.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="break-words text-base font-semibold">{contato.nome}</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Telefone</div>
                <a className="font-mono text-primary underline-offset-2 hover:underline" href={`tel:${contato.telefone}`}>
                  {contato.telefone}
                </a>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                {contato.email ? (
                  <a className="break-all text-primary underline-offset-2 hover:underline" href={`mailto:${contato.email}`}>
                    {contato.email}
                  </a>
                ) : '-'}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                className="h-11 w-11 p-0"
                onClick={() => { setEditing(contato); setShowForm(true) }}
                aria-label={`Editar ${contato.nome}`}
                title="Editar contato"
              >
                <Pencil className="h-5 w-5" />
              </Button>
              {usuario?.role === 'admin' && (
                <Button
                  variant="outline"
                  className="h-11 w-11 p-0 text-red-600"
                  onClick={() => {
                    if (confirm(`Excluir contato ${contato.nome}?`)) {
                      deleteContato(campanha.id, contato.id).then(() => toast.success('Contato excluído'))
                    }
                  }}
                  aria-label={`Excluir ${contato.nome}`}
                  title="Excluir contato"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      {contatos.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum contato cadastrado.
        </div>
      )}

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{contato ? 'Editar Contato' : 'Novo Contato'}</h2>
          <Button variant="ghost" className="h-11 w-11 p-0" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></Button>
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
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="h-11 flex-1"
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
