

import './App.css';
import { LoginPage } from './pages/login';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/ui/layout';

import DashboardPage from './pages/dashboard';
import CompanyPage from './pages/company';
import InverterPage from './pages/inverter';
import PlantPage from './pages/plant';
import ClientPage from './pages/client';
import WorkOrdersPage from './pages/work-orders/index'; 
import WorkOrderCreatePage from './pages/work-orders/create'; 
import WorkOrderEditPage from './pages/work-orders/edit';
import WorkOrderConclusionPage from './pages/work-orders/conclusion';
import UserList from './pages/user/index';
import UserCreate from './pages/user/create';
import UserEdit from './pages/user/edit';
import FinancialPage from './pages/financial/index';


const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />, // Página de login NÃO precisa de Layout
  },
  {
    // Comentado até você implementar o contexto de autenticação
    // element: <PrivateRoute />, // Protegerá as rotas abaixo no futuro
    children: [
      {
        element: <Layout />, // Layout com Sidebar/Header
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/company",
            element: <CompanyPage />,
          },
          {
            path: "/inverter",
            element: <InverterPage />,
          },
          {
            path: "/monitoring",
            element: <DashboardPage />, // Placeholder
          },
          {
            path: "/alerts",
            element: <DashboardPage />, // Placeholder
          },
          {
            path: "/clients",
            element: <ClientPage />,
          },
          {
            path: "/plants",
            element: <PlantPage />,
          },
          {
            path: "/equipment",
            element: <DashboardPage />, // Placeholder
          },
          {
            path: "/analytics",
            element: <DashboardPage />, // Placeholder
          },
          {
            path: "/maintenance",
            element: <WorkOrdersPage />,
          },
          {
            path: "/maintenance/create",
            element: <WorkOrderCreatePage />,
          },
          {
            path: "/maintenance/edit/:id",
            element: <WorkOrderEditPage />,
          },
          {
            path: "/maintenance/conclusion/:id",
            element: <WorkOrderConclusionPage />,
          },
          {
            path: "/users",
            element: <UserList />,
          },
          {
            path: "/users/create",
            element: <UserCreate />,
          },
          {
            path: "/users/edit/:id",
            element: <UserEdit />,
          },
          {
            path: "/financial",
            element: <FinancialPage />,
          },
          {
            path: "/settings",
            element: <DashboardPage />, // Placeholder
          },
        ],
      },
    ],
  },
]);

export { router };
