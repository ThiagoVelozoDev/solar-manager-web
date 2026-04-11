import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

interface RoleListResponse {
  roles: Array<{
    id: number;
    label: string;
    description: string | null;
    permissions: Array<{
      id: number;
      label: string;
      resource: string;
    }>;
  }>;
}

const MODULE_LABEL_BY_RESOURCE: Record<string, string> = {
  dashboard: 'Dashboard',
  alerts: 'Alarmes',
  insights: 'Insights Inteligentes',
  clients: 'Clientes',
  plants: 'Usinas',
  inverters: 'Inversores',
  companies: 'Empresas',
  users: 'Usuarios',
  roles: 'Perfis e Permissoes',
  workorders: 'Ordem de Servico',
  financial: 'Financeiro',
  sync: 'Sincronizacao',
};

export default function SettingsProfilePage() {
  const [roleRows, setRoleRows] = useState<RoleListResponse['roles']>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await apiFetch<RoleListResponse>('/roles');
        setRoleRows(response.roles ?? []);
      } catch {
        setRoleRows([]);
      } finally {
        setRolesLoading(false);
      }
    };

    void loadRoles();
  }, []);

  if (rolesLoading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Carregando perfil...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Configurações de Perfil</h1>
        <p className="text-sm text-gray-600">Visualize os perfis e suas permissões.</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-gray-900">Perfis existentes</p>
          {roleRows.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum perfil disponível.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[760px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">id_perfil</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">nome_perfil</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">descricao_perfil</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">permissoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {roleRows.map((role) => (
                    <tr key={role.id}>
                      <td className="px-3 py-2 text-sm text-gray-900">{role.id}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{role.label}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{role.description ?? '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {role.permissions.length ? (
                          <div className="space-y-2">
                            {Array.from(
                              role.permissions.reduce((acc, permission) => {
                                const module = MODULE_LABEL_BY_RESOURCE[permission.resource] ?? permission.resource;
                                const list = acc.get(module) ?? [];
                                list.push(permission);
                                acc.set(module, list);
                                return acc;
                              }, new Map<string, RoleListResponse['roles'][number]['permissions']>()),
                            ).map(([module, modulePermissions]) => (
                              <div key={`${role.id}-${module}`}>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{module}</p>
                                <div className="flex flex-wrap gap-2">
                                  {modulePermissions.map((permission) => (
                                    <span
                                      key={`${role.id}-${permission.id}`}
                                      className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800"
                                    >
                                      {permission.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Sem permissões</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
