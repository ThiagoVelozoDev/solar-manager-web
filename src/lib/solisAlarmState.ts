// Utilitário para normalizar status de alarmes Solis no frontend
// 0 = Ativo, 1 = Em tratamento, 2 = Resolvido

export type SolisAlarmState = 0 | 1 | 2 | number;

export function normalizeSolisAlarmState(state: SolisAlarmState): {
  label: string;
  color: 'red' | 'yellow' | 'green';
  status: 'ativo' | 'em_tratamento' | 'resolvido' | 'desconhecido';
} {
  switch (state) {
    case 0:
      return { label: 'Ativo', color: 'red', status: 'ativo' };
    case 1:
      return { label: 'Em tratamento', color: 'yellow', status: 'em_tratamento' };
    case 2:
      return { label: 'Resolvido', color: 'green', status: 'resolvido' };
    default:
      return { label: 'Desconhecido', color: 'yellow', status: 'desconhecido' };
  }
}
