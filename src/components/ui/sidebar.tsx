'use client'

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Building2,
  Factory,
  Cpu,
  LineChart,
  ClipboardList,
  DollarSign,
  Settings,
  User,
  Sun
} from "lucide-react"

const classNames = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ')

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [monitoringOpen, setMonitoringOpen] = useState(true)
  const [clientsOpen, setClientsOpen] = useState(true)

  return (
    <>
      {/* MOBILE SIDEBAR */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop className="fixed inset-0 bg-gray-900/80" />

        <div className="fixed inset-0 flex">
          <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">

            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
                <button onClick={() => setSidebarOpen(false)}>
                  <XMarkIcon className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <SidebarContent
              monitoringOpen={monitoringOpen}
              setMonitoringOpen={setMonitoringOpen}
              clientsOpen={clientsOpen}
              setClientsOpen={setClientsOpen}
              onNavClick={() => setSidebarOpen(false)}
            />

          </DialogPanel>
        </div>
      </Dialog>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col">
        <SidebarContent
          monitoringOpen={monitoringOpen}
          setMonitoringOpen={setMonitoringOpen}
          clientsOpen={clientsOpen}
          setClientsOpen={setClientsOpen}
        />
      </div>
    </>
  )
}


function SidebarContent({
  monitoringOpen,
  setMonitoringOpen,
  clientsOpen,
  setClientsOpen,
  onNavClick
}: any) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (path: string) => {
    navigate(path)
    onNavClick?.()
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="flex grow flex-col overflow-y-auto border-r border-gray-200 bg-white px-4 sm:px-6">

      {/* LOGO */}
      <div className="flex h-5 items-center gap-3 py-4 sm:py-6">
        <div className="bg-amber-500 p-1.5 rounded-lg">
          <Sun className="size-4 text-white" />
        </div>
        <span className="font-bold text-sm sm:text-base truncate">Solar Manager</span>
      </div>

      <nav className="flex flex-1 flex-col">

        <ul className="space-y-1.5 sm:space-y-2">

          {/* DASHBOARD */}
          <li>
            <button
              onClick={() => handleNavigation('/')}
              className={classNames(
                isActive('/')
                  ? 'bg-amber-50 text-amber-600'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold w-full transition-colors'
              )}
            >
              <LayoutDashboard className="size-4 sm:size-5 flex-shrink-0" />
              <span>Dashboard</span>
            </button>
          </li>

          {/* MONITORAMENTO */}
          <li>

            <button
              onClick={() => setMonitoringOpen(!monitoringOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Activity className="size-4 sm:size-5 flex-shrink-0" />
                <span className="truncate">Monitoramento</span>
              </span>

              <ChevronDownIcon className={classNames(
                monitoringOpen ? "rotate-180" : "",
                "size-4 transition flex-shrink-0"
              )} />
            </button>

            {monitoringOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">

                <li>
                  <button
                    onClick={() => handleNavigation('/monitoring')}
                    className={classNames(
                      isActive('/monitoring')
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600 hover:text-amber-600',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Activity className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Tempo Real</span>
                  </button>
                </li>

              </ul>
            )}

          </li>


          {/* ALARMES */}
          <li>
            <button
              onClick={() => handleNavigation('/alerts')}
              className={classNames(
                isActive('/alerts')
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center justify-between px-3 py-2 rounded-lg w-full transition-colors'
              )}
            >

              <span className="flex items-center gap-3 text-xs sm:text-sm font-medium min-w-0">
                <AlertTriangle className="size-4 sm:size-5 flex-shrink-0" />
                <span className="truncate">Alarmes</span>
              </span>

              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                3
              </span>

            </button>
          </li>


          {/* CLIENTES */}
          <li>

            <button
              onClick={() => setClientsOpen(!clientsOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Building2 className="size-4 sm:size-5 flex-shrink-0" />
                <span className="truncate">Gestão de Clientes</span>
              </span>

              <ChevronDownIcon className={classNames(
                clientsOpen ? "rotate-180" : "",
                "size-4 transition flex-shrink-0"
              )} />
            </button>

            {clientsOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">

                <li>
                  <button
                    onClick={() => handleNavigation('/clients')}
                    className={classNames(
                      isActive('/clients')
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600 hover:text-amber-600',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Factory className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Clientes</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNavigation('/plants')}
                    className={classNames(
                      isActive('/plants')
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600 hover:text-amber-600',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Factory className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Usinas</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/inverter')}
                    className={classNames(
                      isActive('/inverter')
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600 hover:text-amber-600',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Cpu className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Inversores</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNavigation('/company')}
                    className={classNames(
                      isActive('/company')
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600 hover:text-amber-600',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Building2 className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Empresas</span>
                  </button>
                </li>

              </ul>
            )}

          </li>


          {/* ANALISE */}
          <li>
            <button
              onClick={() => handleNavigation('/analytics')}
              className={classNames(
                isActive('/analytics')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-xs sm:text-sm transition-colors'
              )}
            >
              <LineChart className="size-4 sm:size-5 flex-shrink-0" />
              <span>Análise</span>
            </button>
          </li>


          {/* ORDEM DE SERVICO */}
          <li>
            <button
              onClick={() => handleNavigation('/maintenance')}
              className={classNames(
                isActive('/maintenance')
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-xs sm:text-sm transition-colors'
              )}
            >
              <ClipboardList className="size-4 sm:size-5 flex-shrink-0" />
              <span>Ordem de Serviço</span>
            </button>
          </li>


          {/* FINANCEIRO */}
          <li>
            <button
              onClick={() => handleNavigation('/financial')}
              className={classNames(
                isActive('/financial')
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-xs sm:text-sm transition-colors'
              )}
            >
              <DollarSign className="size-4 sm:size-5 flex-shrink-0" />
              <span>Financeiro</span>
            </button>
          </li>


          {/* CONFIG */}
          <li>
            <button
              onClick={() => handleNavigation('/settings')}
              className={classNames(
                isActive('/settings')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-xs sm:text-sm transition-colors'
              )}
            >
              <Settings className="size-4 sm:size-5 flex-shrink-0" />
              <span>Configurações</span>
            </button>
          </li>

        </ul>


        {/* PROFILE */}
        <div className="mt-auto border-t pt-3 sm:pt-4 pb-3 sm:pb-4">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">

            <div className="bg-gray-200 rounded-full p-1.5 sm:p-2 flex-shrink-0">
              <User className="size-3 sm:size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">Thiago Velozo</p>
              <p className="text-xs text-gray-500 truncate">Administrador</p>
            </div>

          </div>

        </div>

      </nav>

    </div>
  )
}