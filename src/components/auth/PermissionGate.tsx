import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface PermissionGateProps {
  permission: string;
  fallbackPath?: string;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallbackPath = '/dashboard', children }: PermissionGateProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
