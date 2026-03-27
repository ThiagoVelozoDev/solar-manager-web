import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, Plus, CheckCircle2, Clock3, AlertCircle, Trash2 } from 'lucide-react'
import type { SubscriptionClient, SubscriptionClientForm } from './types'
import {
  subscriptionClientSchema,
  getSubscriptionClients,
  saveSubscriptionClient,
  updateSubscriptionClient,
  deleteSubscriptionClient,
} from './types'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const compareDate = (isoDate: string) => {
  const now = new Date()
  const date = new Date(isoDate)

  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  if (date < now) return 'Atrasado'
  return 'Pendente'
}

export default function FinancialPage() {
  const [clients, setClients] = useState<SubscriptionClient[]>(getSubscriptionClients())
  const [filter, setFilter] = useState<'Todos' | 'Pago' | 'Pendente' | 'Atrasado'>('Todos')
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscriptionClientForm>({
    resolver: zodResolver(subscriptionClientSchema),
    defaultValues: {
      plan: 'Profissional',
      paymentStatus: 'Pendente',
      dueDay: 10,
    },
  })

  const onSubmit = (data: SubscriptionClientForm) => {
    const payload = subscriptionClientSchema.parse(data)
    saveSubscriptionClient(payload)
    setClients(getSubscriptionClients())
    setShowForm(false)
    reset({
      plan: 'Profissional',
      paymentStatus: 'Pendente',
      dueDay: 10,
      companyName: '',
      contactName: '',
      email: '',
      monthlyAmount: undefined,
      nextBillingDate: '',
    })
  }

  const syncStatusByDate = (client: SubscriptionClient) => {
    if (client.paymentStatus === 'Pago') return client

    return {
      ...client,
      paymentStatus: compareDate(client.nextBillingDate) as 'Pendente' | 'Atrasado',
    }
  }

  const normalizedClients = useMemo(() => {
    return clients.map(syncStatusByDate)
  }, [clients])

  const filteredClients = useMemo(() => {
    if (filter === 'Todos') return normalizedClients
    return normalizedClients.filter((client) => client.paymentStatus === filter)
  }, [filter, normalizedClients])

  const metrics = useMemo(() => {
    const paid = normalizedClients.filter((c) => c.paymentStatus === 'Pago')
    const pending = normalizedClients.filter((c) => c.paymentStatus === 'Pendente')
    const delayed = normalizedClients.filter((c) => c.paymentStatus === 'Atrasado')

    const mrr = paid.reduce((acc, current) => acc + current.monthlyAmount, 0)

    return {
      total: normalizedClients.length,
      paid: paid.length,
      pending: pending.length,
      delayed: delayed.length,
      mrr,
    }
  }, [normalizedClients])

  const markAsPaid = (id: string) => {
    updateSubscriptionClient(id, { paymentStatus: 'Pago' })
    setClients(getSubscriptionClients())
  }

  const markAsPending = (client: SubscriptionClient) => {
    const fallback = compareDate(client.nextBillingDate) as 'Pendente' | 'Atrasado'
    updateSubscriptionClient(client.id!, { paymentStatus: fallback })
    setClients(getSubscriptionClients())
  }

  const removeClient = (id: string) => {
    if (!confirm('Deseja remover este cliente da carteira de assinaturas?')) return
    deleteSubscriptionClient(id)
    setClients(getSubscriptionClients())
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span className="text-gray-700 font-medium">Financeiro</span>
          <ChevronRight className="size-4" />
          <span className="text-gray-900 font-medium">Assinaturas</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestao de Assinaturas</h1>
            <p className="text-sm text-gray-600 mt-1">
              Controle sua carteira de clientes SaaS, vencimentos e pagamentos em um unico painel.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white font-medium hover:shadow-lg transition-all"
          >
            <Plus className="size-4" />
            {showForm ? 'Fechar cadastro' : 'Cadastrar cliente'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Clientes ativos</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.total}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Pagos</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{metrics.paid}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{metrics.pending}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Atrasados</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{metrics.delayed}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">MRR confirmado</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.mrr)}</p>
          </div>
        </div>

        {showForm && (
          <div className="rounded-xl bg-white border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Novo cliente de assinatura</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Empresa</label>
                  <input
                    {...register('companyName')}
                    placeholder="Ex: Solar Prime Energia"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Contato responsavel</label>
                  <input
                    {...register('contactName')}
                    placeholder="Nome do contato"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="financeiro@cliente.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Plano</label>
                  <select
                    {...register('plan')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="Basico">Basico</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Valor mensal (R$)</label>
                  <input
                    {...register('monthlyAmount')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="299.90"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {errors.monthlyAmount && <p className="text-xs text-red-600 mt-1">{errors.monthlyAmount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Dia de vencimento</label>
                  <input
                    {...register('dueDay')}
                    type="number"
                    min="1"
                    max="28"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {errors.dueDay && <p className="text-xs text-red-600 mt-1">{errors.dueDay.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Proximo vencimento</label>
                  <input
                    {...register('nextBillingDate')}
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {errors.nextBillingDate && <p className="text-xs text-red-600 mt-1">{errors.nextBillingDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Status de pagamento</label>
                  <select
                    {...register('paymentStatus')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:shadow-lg transition-all"
                >
                  Salvar cliente
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Carteira de clientes</h2>

            <div className="flex flex-wrap gap-2">
              {(['Todos', 'Pago', 'Pendente', 'Atrasado'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    filter === option
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Nenhum cliente encontrado para o filtro selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Empresa</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Plano</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Valor</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Vencimento</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3">
                        <p className="text-sm font-medium text-gray-900">{client.companyName}</p>
                        <p className="text-xs text-gray-500">{client.contactName} • {client.email}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">{client.plan}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">{formatCurrency(client.monthlyAmount)}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                        Dia {client.dueDay} • {new Date(client.nextBillingDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            client.paymentStatus === 'Pago'
                              ? 'bg-green-100 text-green-700'
                              : client.paymentStatus === 'Pendente'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {client.paymentStatus === 'Pago' && <CheckCircle2 className="size-3.5" />}
                          {client.paymentStatus === 'Pendente' && <Clock3 className="size-3.5" />}
                          {client.paymentStatus === 'Atrasado' && <AlertCircle className="size-3.5" />}
                          {client.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {client.paymentStatus !== 'Pago' ? (
                            <button
                              onClick={() => markAsPaid(client.id!)}
                              className="px-2.5 py-1 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              Marcar pago
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsPending(client)}
                              className="px-2.5 py-1 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              Reabrir
                            </button>
                          )}
                          <button
                            onClick={() => removeClient(client.id!)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Remover cliente"
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
          )}
        </div>
      </div>
    </div>
  )
}
