import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { UserFromAPI } from './types'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '../../components/ui/alert-dialog'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000'

export default function UserList() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserFromAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserFromAPI | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/users`)
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao carregar usuários')
      }
      setUsers(data.users || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao deletar usuário')
      }
      toast.success('Usuário excluído com sucesso!')
      await fetchUsers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao deletar usuário'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const openDeleteDialog = (user: UserFromAPI) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleEdit = (id: number) => {
    navigate(`/users/edit/${id}`)
  }

  const handleCreate = () => {
    navigate('/users/create')
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">

          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-6">
            <span className="text-gray-900 font-medium">Configurações</span>
            <ChevronRight className="size-4" />
            <span className="text-gray-900 font-medium">Usuários</span>
          </div>

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Usuários</h1>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="size-5" />
              <span>Novo Usuário</span>
            </button>
          </div>

          {/* CONTENT */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">Nenhum usuário registrado</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Nome</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">CPF</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Telefone</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 font-medium">{user.name}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">{user.cpf}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="size-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir o usuário{' '}
              <span className="font-semibold text-gray-900">{userToDelete?.name}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={() => userToDelete && handleDelete(userToDelete.id)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg font-medium transition-all text-sm"
            >
              Excluir
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

