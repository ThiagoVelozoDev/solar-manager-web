import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Save } from 'lucide-react';
import { apiFetch } from '../../../lib/api';

interface PermissionItem {
  id: number;
  resource: string;
  action: string;
  label: string;
}

interface RoleItem {
  id: number;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: Array<PermissionItem & { key: string }>;
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

export default function SettingsPermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiFetch<{ roles: RoleItem[] }>('/roles'),
        apiFetch<{ permissions: PermissionItem[] }>('/roles/permissions'),
      ]);

      setRoles(rolesRes.roles);
      setAllPermissions(permsRes.permissions);

      const firstRole = rolesRes.roles[0] ?? null;
      setSelectedRoleId(firstRole?.id ?? null);
      setSelectedPerms(new Set(firstRole?.permissions.map((p) => p.key) ?? []));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar perfis e permissões';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const permissionsByModule = useMemo(() => {
    const grouped = new Map<string, PermissionItem[]>();

    for (const permission of allPermissions) {
      const moduleLabel = MODULE_LABEL_BY_RESOURCE[permission.resource] ?? permission.resource;
      const list = grouped.get(moduleLabel) ?? [];
      list.push(permission);
      grouped.set(moduleLabel, list);
    }

    return Array.from(grouped.entries()).map(([module, permissions]) => ({ module, permissions }));
  }, [allPermissions]);

  const onRoleChange = (roleId: number) => {
    setSelectedRoleId(roleId);
    const role = roles.find((r) => r.id === roleId);
    setSelectedPerms(new Set(role?.permissions.map((p) => p.key) ?? []));
  };

  const togglePermission = (permKey: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permKey)) next.delete(permKey);
      else next.add(permKey);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      await apiFetch(`/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          label: selectedRole.label,
          description: selectedRole.description,
          permissions: Array.from(selectedPerms.values()),
        }),
      });

      toast.success('Permissões atualizadas com sucesso');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar permissões';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Carregando perfis...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Perfis e Permissões</h1>
        <p className="text-sm text-gray-600">Defina quais funcionalidades cada perfil pode acessar no frontend e backend.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Perfis</p>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedRoleId === role.id
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{role.label}</div>
                <div className="text-xs text-gray-500">{role.userCount} usuário(s)</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {selectedRole ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <ShieldCheck className="size-4" />
                    <h2 className="text-lg font-semibold">{selectedRole.label}</h2>
                  </div>
                  <p className="text-sm text-gray-500">{selectedRole.description ?? 'Sem descrição'}</p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  <Save className="size-4" />
                  {saving ? 'Salvando...' : 'Salvar permissões'}
                </button>
              </div>

              <div className="space-y-4">
                {permissionsByModule.map(({ module, permissions }) => (
                  <section key={module} className="rounded-lg border border-gray-200 p-3">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">{module}</h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {permissions.map((perm) => {
                        const key = `${perm.resource}:${perm.action}`;
                        const checked = selectedPerms.has(key);
                        return (
                          <label key={perm.id} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(key)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="block text-sm font-medium text-gray-900">{perm.label}</span>
                              <span className="block text-xs text-gray-500">{perm.resource}:{perm.action}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Selecione um perfil para editar permissões.</div>
          )}
        </div>
      </section>
    </div>
  );
}
