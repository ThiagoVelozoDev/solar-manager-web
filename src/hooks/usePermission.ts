import { useAuth } from '../components/auth/AuthContext';

export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}
