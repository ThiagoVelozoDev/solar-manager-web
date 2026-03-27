import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import type { User } from './types'
import { userSchema, saveUser } from './types'

export default function CreateUser() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<User>({
    resolver: zodResolver(userSchema),
  })

  const onSubmit = (data: User) => {
    try {
      saveUser(data)
      navigate('/users')
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-6">
          
          <span className="text-gray-700 font-medium">Configurações</span>
          <ChevronRight className="size-4" />
          <span className="text-gray-700 font-medium">Usuários</span>
          <ChevronRight className="size-4" />
          <span className="text-gray-900 font-medium">Novo Usuário</span>
        </div>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="size-5 text-gray-600" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Criar Novo Usuário</h1>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* NOME */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nome *
              </label>
              <input
                {...register('nome')}
                type="text"
                placeholder="Digite o nome"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.nome && (
                <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="Digite o email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                CPF *
              </label>
              <input
                {...register('cpf')}
                type="text"
                placeholder="Digite o CPF (sem pontos)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.cpf && (
                <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p>
              )}
            </div>

            {/* TELEFONE */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Telefone *
              </label>
              <input
                {...register('telefone')}
                type="tel"
                placeholder="Digite o telefone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.telefone && (
                <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>
              )}
            </div>

            {/* SENHA */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Senha *
              </label>
              <input
                {...register('senha')}
                type="password"
                placeholder="Digite a senha"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {errors.senha && (
                <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>
              )}
            </div>

            {/* ATIVO */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Ativo *
              </label>
              <select
                {...register('ativo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione uma opção</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
              {errors.ativo && (
                <p className="mt-1 text-xs text-red-600">{errors.ativo.message}</p>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-medium transition-all"
              >
                Salvar Usuário
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
