import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredAuthToken } from '../../lib/api';

export function ProtectedRoute() {
  const location = useLocation();
  const token = getStoredAuthToken();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}