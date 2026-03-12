

import './App.css';
import { LoginPage } from './pages/login';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/ui/layout';

import { Home } from '../src/pages/home';


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
            element: <Home />,
          },

        ],
      },
    ],
  },
]);

export { router };
