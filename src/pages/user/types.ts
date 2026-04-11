import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ativo: z.enum(['Sim', 'Não']),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  roleId: z.string().min(1, 'Perfil é obrigatório'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type User = z.infer<typeof userSchema>

export const editUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  ativo: z.enum(['Sim', 'Não']),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  senha: z.string().refine(val => val === '' || val.length >= 6, {
    message: 'Senha deve ter no mínimo 6 caracteres',
  }),
  roleId: z.string().min(1, 'Perfil é obrigatório'),
})

export type EditUser = z.infer<typeof editUserSchema>

export interface UserFromAPI {
  id: number
  name: string
  email: string
  cpf: string
  phone: string
  active: boolean
  roleId?: number | null
  role?: { id: number; name: string; label: string } | null
  createdAt: string
  updatedAt: string
}
