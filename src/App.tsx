

import './App.css';
import { LoginPage } from './pages/login';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/ui/layout';

import { Home } from '../src/pages/home';
import DashboardPage from './pages/dashboard';
import CompanyPage from './pages/company';
import InverterPage from './pages/inverter';


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
            element: <DashboardPage />, // Placeholder
          },
          {
            path: "/plants",
            element: <DashboardPage />, // Placeholder
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
            element: <DashboardPage />, // Placeholder
          },
          {
            path: "/financial",
            element: <DashboardPage />, // Placeholder
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
