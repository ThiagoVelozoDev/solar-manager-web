
import './App.css';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { LoginPage } from './pages/login';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/ui/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionGate } from './components/auth/PermissionGate';

const DashboardPage = lazy(() => import('./pages/dashboard'));
const CompanyPage = lazy(() => import('./pages/company'));
const InverterPage = lazy(() => import('./pages/inverter/index'));
const PlantPage = lazy(() => import('./pages/plant/index'));
const ClientPage = lazy(() => import('./pages/client/index'));
const WorkOrdersPage = lazy(() => import('./pages/work-orders/index'));
const WorkOrderCreatePage = lazy(() => import('./pages/work-orders/create'));
const WorkOrderEditPage = lazy(() => import('./pages/work-orders/edit'));
const WorkOrderConclusionPage = lazy(() => import('./pages/work-orders/conclusion'));
const WorkOrderPrintPage = lazy(() => import('./pages/work-orders/print'));
const UserList = lazy(() => import('./pages/user/index'));
const UserCreate = lazy(() => import('./pages/user/create'));
const UserEdit = lazy(() => import('./pages/user/edit'));
const FinancialPage = lazy(() => import('./pages/financial/index'));
const SyncMonitorPage = lazy(() => import('./pages/sync'));
const AlertsPage = lazy(() => import('./pages/alerts'));
const InsightsPage = lazy(() => import('./pages/insights'));
const SettingsProfilePage = lazy(() => import('./pages/settings/profile'));
const SettingsPermissionsPage = lazy(() => import('./pages/settings/permissions'));
const ServiceCodesPage = lazy(() => import('./pages/settings/service-codes/index'));
const ServiceReasonsPage = lazy(() => import('./pages/settings/service-reasons/index'));
const TeamsPage = lazy(() => import('./pages/settings/teams/index'));
const DiagnosticsPage = lazy(() => import('./pages/settings/diagnostics/index'));
const WorkOrderAnalysisPage = lazy(() => import('./pages/work-orders/analysis'));
const WorkOrderConclusionEditPage = lazy(() => import('./pages/work-orders/conclusion-edit'));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
      Carregando pagina...
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function withPermission(permission: string, element: ReactNode) {
  return withSuspense(<PermissionGate permission={permission}>{element}</PermissionGate>);
}


const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />, // Página de login NÃO precisa de Layout
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/maintenance/print/:id",
        element: withPermission('workorders:read', <WorkOrderPrintPage />),
      },
      {
        element: <Layout />, // Layout com Sidebar/Header
        children: [
          {
            path: "/dashboard",
            element: withPermission('dashboard:read', <DashboardPage />),
          },
          {
            path: "/company",
            element: withPermission('companies:read', <CompanyPage />),
          },
          {
            path: "/inverter",
            element: withPermission('inverters:read', <InverterPage />),
          },
          {
            path: "/monitoring",
            element: withPermission('dashboard:read', <DashboardPage />), // Placeholder
          },
          {
            path: "/alerts",
            element: withPermission('alerts:read', <AlertsPage />),
          },
          {
            path: "/clients",
            element: withPermission('clients:read', <ClientPage />),
          },
          {
            path: "/plants",
            element: withPermission('plants:read', <PlantPage />),
          },
          {
            path: "/equipment",
            element: withPermission('dashboard:read', <DashboardPage />), // Placeholder
          },
          {
            path: "/analytics",
            element: withPermission('insights:read', <InsightsPage />),
          },
          {
            path: "/insights",
            element: withPermission('insights:read', <InsightsPage />),
          },
          {
            path: "/maintenance",
            element: withPermission('workorders:read', <WorkOrdersPage />),
          },
          {
            path: "/maintenance/create",
            element: withPermission('workorders:write', <WorkOrderCreatePage />),
          },
          {
            path: "/maintenance/edit/:id",
            element: withPermission('workorders:write', <WorkOrderEditPage />),
          },
          {
            path: "/maintenance/conclusion/:id",
            element: withPermission('workorders:write', <WorkOrderConclusionPage />),
          },
          {
            path: "/users",
            element: withPermission('users:read', <UserList />),
          },
          {
            path: "/users/create",
            element: withPermission('users:write', <UserCreate />),
          },
          {
            path: "/users/edit/:id",
            element: withPermission('users:write', <UserEdit />),
          },
          {
            path: "/financial",
            element: withPermission('financial:read', <FinancialPage />),
          },
          {
            path: "/sync-monitor",
            element: withPermission('sync:read', <SyncMonitorPage />),
          },
          {
            path: "/settings",
            element: withPermission('roles:read', <SettingsProfilePage />),
          },
          {
            path: "/settings/profile",
            element: withPermission('roles:read', <SettingsProfilePage />),
          },
          {
            path: "/settings/permissions",
            element: withPermission('roles:read', <SettingsPermissionsPage />),
          },
          {
            path: "/settings/service-codes",
            element: withPermission('service-config:read', <ServiceCodesPage />),
          },
          {
            path: "/settings/service-reasons",
            element: withPermission('service-config:read', <ServiceReasonsPage />),
          },
          {
            path: "/settings/teams",
            element: withPermission('service-config:read', <TeamsPage />),
          },
          {
            path: "/settings/diagnostics",
            element: withPermission('service-config:read', <DiagnosticsPage />),
          },
          {
            path: "/maintenance/analysis",
            element: withPermission('workorders:read', <WorkOrderAnalysisPage />),
          },
          {
            path: "/maintenance/conclusion-edit/:id",
            element: withPermission('workorders:write', <WorkOrderConclusionEditPage />),
          },
        ],
      },
    ],
  },
]);

export { router };
