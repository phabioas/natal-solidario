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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Autorizar Email
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Emails autorizados a acessar o sistema. O usuário deve fazer login com Google com este email.
      </p>

      <div className="overflow-x-auto rounded-lg border">
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
                    {u.role === 'admin' ? 'Admin' : 'Cadastrador'}
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
                        <option value="cadastrador">Cadastrador</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
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
  const [role, setRole] = useState<UserRole>('cadastrador')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Autorizar Email</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
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
              <option value="cadastrador">Cadastrador (só cadastra fichas)</option>
              <option value="admin">Admin (acesso total)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" disabled={!email || !nome} onClick={() => onSave({ email, nome, role })}>
              Autorizar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
