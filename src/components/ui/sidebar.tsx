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
  AlertTriangle,
  Building2,
  Factory,
  Cpu,
  ClipboardList,
  DollarSign,
  Settings,
  User,
  Workflow,
  BrainCircuit,
  LogOut,
  Wrench,
  FileText,
  Users2,
  Stethoscope,
  BarChart2
} from "lucide-react"
import { useAuth } from '../auth/AuthContext'
import logoImage from '../../assets/logo 2.jpeg'

const classNames = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ')

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [clientsOpen, setClientsOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [osConfigOpen, setOsConfigOpen] = useState(false)
  const [osMenuOpen, setOsMenuOpen] = useState(true)

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
              clientsOpen={clientsOpen}
              setClientsOpen={setClientsOpen}
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
              osConfigOpen={osConfigOpen}
              setOsConfigOpen={setOsConfigOpen}
              osMenuOpen={osMenuOpen}
              setOsMenuOpen={setOsMenuOpen}
              onNavClick={() => setSidebarOpen(false)}
            />

          </DialogPanel>
        </div>
      </Dialog>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col">
        <SidebarContent
          clientsOpen={clientsOpen}
          setClientsOpen={setClientsOpen}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          osConfigOpen={osConfigOpen}
          setOsConfigOpen={setOsConfigOpen}
          osMenuOpen={osMenuOpen}
          setOsMenuOpen={setOsMenuOpen}
        />
      </div>
    </>
  )
}


function SidebarContent({
  clientsOpen,
  setClientsOpen,
  settingsOpen,
  setSettingsOpen,
  osConfigOpen,
  setOsConfigOpen,
  osMenuOpen,
  setOsMenuOpen,
  onNavClick
}: any) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, hasPermission, logout } = useAuth()

  const handleNavigation = (path: string) => {
    navigate(path)
    onNavClick?.()
  }

  const can = (permission: string) => hasPermission(permission)

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div className="flex grow flex-col overflow-y-auto border-r border-gray-200 bg-white px-4 sm:px-6">

      <div className="flex items-center justify-center py-5 border-b border-gray-100">
        <img src={logoImage} alt="CM Energia" className="w-[95%] h-auto object-contain" />
      </div>

      <nav className="flex flex-1 flex-col">

        <ul className="space-y-1.5 sm:space-y-2">

          {/* DASHBOARD */}
          {can('dashboard:read') && <li>
            <button
              onClick={() => handleNavigation('/dashboard')}
              className={classNames(
                isActive('/dashboard')
                  ? 'bg-[#e6f4fc] text-[#0055a3]'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold w-full transition-colors mt-2'
              )}
            >
              <LayoutDashboard className="size-4 sm:size-5 flex-shrink-0" />
              <span>Dashboard</span>
            </button>
          </li>}

          {/* ALARMES */}
          {can('alerts:read') && <li>
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
          </li>}

          {can('insights:read') && <li>
            <button
              onClick={() => handleNavigation('/insights')}
              className={classNames(
                isActive('/insights') || isActive('/analytics')
                  ? 'bg-[#e6f4fc] text-[#008ed3]'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium w-full transition-colors'
              )}
            >
              <BrainCircuit className="size-4 sm:size-5 flex-shrink-0" />
              <span>Insights Inteligentes</span>
            </button>
          </li>}

        {/*          
          ANÁLISE------
          {(can('clients:read') || can('plants:read') || can('inverters:read') || can('companies:read')) && <li>
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

          */}

          {/* CLIENTES */}
          {(can('clients:read') || can('plants:read') || can('inverters:read') || can('companies:read')) && <li>

            <button
              onClick={() => setClientsOpen(!clientsOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Building2 className="size-4 sm:size-5 flex-shrink-0" />
                <span className="truncate">Gestão Operacional</span>
              </span>

              <ChevronDownIcon className={classNames(
                clientsOpen ? "rotate-180" : "",
                "size-4 transition flex-shrink-0"
              )} />
            </button>

            {clientsOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">

                {can('clients:read') && <li>
                  <button
                    onClick={() => handleNavigation('/clients')}
                    className={classNames(
                      isActive('/clients')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Factory className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Clientes</span>
                  </button>
                </li>}

                {can('plants:read') && <li>
                  <button
                    onClick={() => handleNavigation('/plants')}
                    className={classNames(
                      isActive('/plants')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Factory className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Usinas</span>
                  </button>
                </li>}
                {can('inverters:read') && <li>
                  <button
                    onClick={() => handleNavigation('/inverter')}
                    className={classNames(
                      isActive('/inverter')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Cpu className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Inversores</span>
                  </button>
                </li>}

                {can('companies:read') && <li>
                  <button
                    onClick={() => handleNavigation('/company')}
                    className={classNames(
                      isActive('/company')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Building2 className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Empresas</span>
                  </button>
                </li>}

              </ul>
            )}

          </li>}

          {/* ORDEM DE SERVICO */}
          {can('workorders:read') && <li>
            <button
              onClick={() => setOsMenuOpen(!osMenuOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <ClipboardList className="size-4 sm:size-5 flex-shrink-0" />
                <span className="truncate">Ordem de Serviço</span>
              </span>
              <ChevronDownIcon className={classNames(osMenuOpen ? 'rotate-180' : '', 'size-4 transition flex-shrink-0')} />
            </button>
            {osMenuOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">
                <li>
                  <button
                    onClick={() => handleNavigation('/maintenance')}
                    className={classNames(
                      isActive('/maintenance') && !isActive('/maintenance/analysis')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <ClipboardList className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Ordens de Serviço</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/maintenance/analysis')}
                    className={classNames(
                      isActive('/maintenance/analysis')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <BarChart2 className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Análise de Conclusão</span>
                  </button>
                </li>
              </ul>
            )}
          </li>}

          {/* FINANCEIRO */}
          {can('financial:read') && <li>
            <button
              onClick={() => handleNavigation('/financial')}
              className={classNames(
                isActive('/financial')
                  ? 'bg-emerald-50 text-[#00a971]'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-xs sm:text-sm transition-colors'
              )}
            >
              <DollarSign className="size-4 sm:size-5 flex-shrink-0" />
              <span>Financeiro</span>
            </button>
          </li>}

          {/* SINCRONIZACAO */}
          {can('sync:read') && <li>
            <button
              onClick={() => handleNavigation('/sync-monitor')}
              className={classNames(
                isActive('/sync-monitor')
                  ? 'bg-[#e6f4fc] text-[#0055a3]'
                  : 'text-gray-700 hover:bg-gray-100',
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-xs sm:text-sm transition-colors'
              )}
            >
              <Workflow className="size-4 sm:size-5 flex-shrink-0" />
              <span>Sincronizacao</span>
            </button>
          </li>}


          {/* CONFIG */}
          {(can('users:read') || can('roles:read') || can('service-config:read')) && <li>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Settings className="size-4 sm:size-5 flex-shrink-0" />
                <span className="truncate">Configurações</span>
              </span>

              <ChevronDownIcon className={classNames(
                settingsOpen ? "rotate-180" : "",
                "size-4 transition flex-shrink-0"
              )} />
            </button>

            {settingsOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">

                {can('roles:read') && <li>
                  <button
                    onClick={() => handleNavigation('/settings/profile')}
                    className={classNames(
                      isActive('/settings/profile')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <User className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Perfil</span>
                  </button>
                </li>}

                {can('roles:read') && <li>
                  <button
                    onClick={() => handleNavigation('/settings/permissions')}
                    className={classNames(
                      isActive('/settings/permissions')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <Settings className="size-3 sm:size-4 flex-shrink-0" />
                    <span>Permissões</span>
                  </button>
                </li>}

                {can('users:read') && <li>
                  <button
                    onClick={() => handleNavigation('/users')}
                    className={classNames(
                      isActive('/users')
                        ? 'text-[#0055a3] font-medium'
                        : 'text-gray-600 hover:text-[#008ed3]',
                      'flex items-center gap-2 text-xs sm:text-sm w-full cursor-pointer transition-colors'
                    )}
                  >
                    <User className="size-3 sm:size-4 flex-shrink-0 " />
                    <span>Usuários</span>
                  </button>
                </li>}

                {can('service-config:read') && <li className="mt-2">
                  <button
                    onClick={() => setOsConfigOpen(!osConfigOpen)}
                    className="flex w-full items-center justify-between text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#008ed3] transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ClipboardList className="size-3 sm:size-4 flex-shrink-0" />
                      <span className="truncate">Ordem de Serviço</span>
                    </span>
                    <ChevronDownIcon className={classNames(osConfigOpen ? 'rotate-180' : '', 'size-3 transition flex-shrink-0')} />
                  </button>
                  {osConfigOpen && (
                    <ul className="ml-4 mt-1.5 space-y-1.5 mb-4">
                      <li>
                        <button
                          onClick={() => handleNavigation('/settings/service-codes')}
                          className={classNames(
                            isActive('/settings/service-codes') ? 'text-[#0055a3] font-medium' : 'text-gray-600 hover:text-[#008ed3]',
                            'flex items-center gap-2 text-xs w-full cursor-pointer transition-colors'
                          )}
                        >
                          <Wrench className="size-3 flex-shrink-0" />
                          <span>Serviços</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNavigation('/settings/service-reasons')}
                          className={classNames(
                            isActive('/settings/service-reasons') ? 'text-[#0055a3] font-medium' : 'text-gray-600 hover:text-[#008ed3]',
                            'flex items-center gap-2 text-xs w-full cursor-pointer transition-colors'
                          )}
                        >
                          <FileText className="size-3 flex-shrink-0" />
                          <span>Motivos de Serviço</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNavigation('/settings/teams')}
                          className={classNames(
                            isActive('/settings/teams') ? 'text-[#0055a3] font-medium' : 'text-gray-600 hover:text-[#008ed3]',
                            'flex items-center gap-2 text-xs w-full cursor-pointer transition-colors'
                          )}
                        >
                          <Users2 className="size-3 flex-shrink-0" />
                          <span>Equipes</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNavigation('/settings/diagnostics')}
                          className={classNames(
                            isActive('/settings/diagnostics') ? 'text-[#0055a3] font-medium' : 'text-gray-600 hover:text-[#008ed3]',
                            'flex items-center gap-2 text-xs w-full cursor-pointer transition-colors'
                          )}
                        >
                          <Stethoscope className="size-3 flex-shrink-0" />
                          <span>Diagnósticos</span>
                        </button>
                      </li>
                    </ul>
                  )}
                </li>}

              </ul>
            )}

          </li>}

        </ul>


        {/* PROFILE */}
        <div className="mt-auto border-t pt-3 sm:pt-4 pb-3 sm:pb-4">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">

            <div className="bg-gray-200 rounded-full p-1.5 sm:p-2 flex-shrink-0">
              <User className="size-3 sm:size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">{user?.name ?? 'Usuário'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.roleName ?? 'Sem perfil'}</p>
            </div>

          </div>

          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="size-3.5" />
            Sair
          </button>

        </div>

      </nav>

    </div>
  )
}