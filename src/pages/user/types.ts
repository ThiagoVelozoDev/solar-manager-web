import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ativo: z.enum(['Sim', 'Não']),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type User = z.infer<typeof userSchema>

export const STORAGE_KEY = 'solar_manager_users'

export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export const saveUser = (user: User): void => {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: user.id || Date.now().toString(),
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  users.push(newUser)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export const updateUser = (id: string, updates: Partial<User>): void => {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  if (index >= 0) {
    users[index] = {
      ...users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  }
}

export const deleteUser = (id: string): void => {
  const users = getUsers()
  const filtered = users.filter(u => u.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export const getUserById = (id: string): User | undefined => {
  const users = getUsers()
  return users.find(u => u.id === id)
}
