import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeUsuarios, createUsuario, updateUsuario, deleteUsuario } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, X } from 'lucide-react'
import type { Usuario, UserRole } from '@/models/types'
import { toast } from 'sonner'

export function UsuariosPage() {
  const { usuario: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    return subscribeUsuarios(setUsuarios)
  }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Usuários</h1>
        <Button className="h-11 md:h-10" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Autorizar Email
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Emails autorizados a acessar o sistema. O usuário deve fazer login com Google com este email.
      </p>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Perfil</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{u.email}</td>
                <td className="p-3">{u.nome}</td>
                <td className="p-3">
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                    {u.role === 'admin' ? 'Admin' : 'Equipe'}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  {u.id !== currentUser?.id && (
                    <>
                      <select
                        className="mr-2 h-9 rounded-md border px-2 text-xs"
                        value={u.role}
                        onChange={(e) => updateUsuario(u.id, { role: e.target.value as UserRole }).then(() => toast.success('Perfil atualizado'))}
                      >
                        <option value="admin">Admin</option>
                        <option value="equipe">Equipe</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        aria-label={`Remover acesso de ${u.nome}`}
                        title="Remover acesso"
                        onClick={() => {
                          if (confirm(`Remover acesso de ${u.email}?`)) {
                            deleteUsuario(u.id).then(() => toast.success('Acesso removido'))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {usuarios.map((u) => (
          <article key={u.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-base font-semibold">{u.nome}</h2>
                <div className="break-all text-sm text-muted-foreground">{u.email}</div>
              </div>
              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="shrink-0">
                {u.role === 'admin' ? 'Admin' : 'Equipe'}
              </Badge>
            </div>

            {u.id === currentUser?.id ? (
              <div className="mt-4 border-t pt-3 text-right text-xs text-muted-foreground">
                Usuário atual
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 border-t pt-3">
                <label className="sr-only" htmlFor={`role-${u.id}`}>Perfil de {u.nome}</label>
                <select
                  id={`role-${u.id}`}
                  className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                  value={u.role}
                  onChange={(e) => updateUsuario(u.id, { role: e.target.value as UserRole }).then(() => toast.success('Perfil atualizado'))}
                >
                  <option value="admin">Admin</option>
                  <option value="equipe">Equipe</option>
                </select>
                <Button
                  variant="outline"
                  className="h-11 w-11 shrink-0 p-0 text-red-600"
                  onClick={() => {
                    if (confirm(`Remover acesso de ${u.email}?`)) {
                      deleteUsuario(u.id).then(() => toast.success('Acesso removido'))
                    }
                  }}
                  aria-label={`Remover acesso de ${u.nome}`}
                  title="Remover acesso"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>

      {usuarios.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum usuário autorizado.
        </div>
      )}

      {showForm && (
        <UsuarioForm
          onClose={() => setShowForm(false)}
          onSave={async (data) => {
            // Note: uid is set when user first logs in. For now, use email as placeholder.
            // The admin creates the record; when the user logs in with Google, we match by email.
            await createUsuario({ ...data }, data.email.replace(/[^a-zA-Z0-9]/g, '_'))
            toast.success('Email autorizado')
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function UsuarioForm({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<Usuario, 'id' | 'createdAt'>) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [role, setRole] = useState<UserRole>('equipe')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Autorizar Email</h2>
          <Button variant="ghost" className="h-11 w-11 p-0" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Email Google *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@gmail.com" />
          </div>
          <div>
            <Label className="mb-1 block">Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Perfil</Label>
            <select className="h-10 w-full rounded-md border px-3" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="equipe">Equipe (acesso ao fluxo operacional)</option>
              <option value="admin">Admin (operacional + configurações)</option>
            </select>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="h-11 flex-1" disabled={!email || !nome} onClick={() => onSave({ email, nome, role })}>
              Autorizar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
