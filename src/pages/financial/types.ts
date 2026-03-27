import { z } from 'zod'

export const subscriptionClientSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(2, 'Nome da empresa e obrigatorio'),
  contactName: z.string().min(2, 'Nome do contato e obrigatorio'),
  email: z.string().email('Email invalido'),
  plan: z.enum(['Basico', 'Profissional', 'Enterprise']),
  monthlyAmount: z.coerce.number().min(1, 'Valor mensal deve ser maior que zero'),
  dueDay: z.coerce.number().min(1, 'Dia invalido').max(28, 'Use um dia entre 1 e 28'),
  paymentStatus: z.enum(['Pago', 'Pendente', 'Atrasado']),
  nextBillingDate: z.string().min(1, 'Proximo vencimento e obrigatorio'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type SubscriptionClientForm = z.input<typeof subscriptionClientSchema>
export type SubscriptionClient = z.infer<typeof subscriptionClientSchema>

export const FINANCIAL_STORAGE_KEY = 'solar_manager_financial_clients'

export const getSubscriptionClients = (): SubscriptionClient[] => {
  const raw = localStorage.getItem(FINANCIAL_STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const saveSubscriptionClient = (payload: SubscriptionClient): void => {
  const clients = getSubscriptionClients()

  const newClient: SubscriptionClient = {
    ...payload,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  clients.push(newClient)
  localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(clients))
}

export const updateSubscriptionClient = (
  id: string,
  updates: Partial<SubscriptionClient>
): void => {
  const clients = getSubscriptionClients()
  const index = clients.findIndex((client) => client.id === id)

  if (index < 0) return

  clients[index] = {
    ...clients[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(clients))
}

export const deleteSubscriptionClient = (id: string): void => {
  const clients = getSubscriptionClients()
  const filtered = clients.filter((client) => client.id !== id)
  localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(filtered))
}
