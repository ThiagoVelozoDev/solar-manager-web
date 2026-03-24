'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
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
  Wrench,
  DollarSign,
  Settings,
  User
} from "lucide-react"

import { Sun } from "lucide-react"

const classNames = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ')

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [monitoringOpen, setMonitoringOpen] = useState(true)
  const [clientsOpen, setClientsOpen] = useState(true)

  return (
    <>
      <div>

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

        {/* MOBILE HEADER */}
        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700"
          >
            <Bars3Icon className="size-6" />
          </button>

          <span className="font-semibold">Dashboard</span>
        </div>

      </div>
    </>
  )
}


function SidebarContent({
  monitoringOpen,
  setMonitoringOpen,
  clientsOpen,
  setClientsOpen
}: any) {

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
            <a className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-xs sm:text-sm font-semibold text-amber-600">
              <LayoutDashboard className="size-4 sm:size-5 flex-shrink-0" />
              <span>Dashboard</span>
            </a>
          </li>

          {/* MONITORAMENTO */}
          <li>

            <button
              onClick={() => setMonitoringOpen(!monitoringOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Activity className="size-4 sm:size-5 flex-shrink-0"/>
                <span className="truncate">Monitoramento</span>
              </span>

              <ChevronDownIcon className={classNames(
                monitoringOpen ? "rotate-180" : "",
                "size-4 transition flex-shrink-0"
              )}/>
            </button>

            {monitoringOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">

                <li className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-amber-600 cursor-pointer">
                  <Activity className="size-3 sm:size-4 flex-shrink-0"/>
                  <span>Tempo Real</span>
                </li>

              </ul>
            )}

          </li>


          {/* ALARMES */}
          <li className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100">

            <span className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-700 min-w-0">
              <AlertTriangle className="size-4 sm:size-5 flex-shrink-0"/>
              <span className="truncate">Alarmes</span>
            </span>

            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              3
            </span>

          </li>


          {/* CLIENTES */}
          <li>

            <button
              onClick={() => setClientsOpen(!clientsOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Building2 className="size-4 sm:size-5 flex-shrink-0"/>
                <span className="truncate">Gestão de Clientes</span>
              </span>

              <ChevronDownIcon className={classNames(
                clientsOpen ? "rotate-180" : "",
                "size-4 transition flex-shrink-0"
              )}/>
            </button>

            {clientsOpen && (
              <ul className="ml-6 sm:ml-8 mt-2 space-y-2">

                <li className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-amber-600 cursor-pointer">
                  <Factory className="size-3 sm:size-4 flex-shrink-0"/>
                  <span>Clientes</span>
                </li>

                <li className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-amber-600 cursor-pointer">
                  <Factory className="size-3 sm:size-4 flex-shrink-0"/>
                  <span>Usinas</span>
                </li>

                <li className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-amber-600 cursor-pointer">
                  <Cpu className="size-3 sm:size-4 flex-shrink-0"/>
                  <span>Equipamentos</span>
                </li>

                <li className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-amber-600 cursor-pointer">
                  <Building2 className="size-3 sm:size-4 flex-shrink-0"/>
                  <span>Empresas</span>
                </li>

              </ul>
            )}

          </li>


          {/* ANALISE */}
          <li className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-xs sm:text-sm text-gray-700">
            <LineChart className="size-4 sm:size-5 flex-shrink-0"/>
            <span>Análise</span>
          </li>


          {/* MANUTENCAO */}
          <li className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-xs sm:text-sm text-gray-700">
            <Wrench className="size-4 sm:size-5 flex-shrink-0"/>
            <span>Manutenção</span>
          </li>


          {/* FINANCEIRO */}
          <li className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-xs sm:text-sm text-gray-700">
            <DollarSign className="size-4 sm:size-5 flex-shrink-0"/>
            <span>Financeiro</span>
          </li>


          {/* CONFIG */}
          <li className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-xs sm:text-sm text-gray-700">
            <Settings className="size-4 sm:size-5 flex-shrink-0"/>
            <span>Configurações</span>
          </li>

        </ul>


        {/* PROFILE */}
        <div className="mt-auto border-t pt-3 sm:pt-4 pb-3 sm:pb-4">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">

            <div className="bg-gray-200 rounded-full p-1.5 sm:p-2 flex-shrink-0">
              <User className="size-3 sm:size-5"/>
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