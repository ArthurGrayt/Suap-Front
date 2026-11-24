// Importa o tipo Task que descreve a estrutura de uma atividade do SUAP
import { Task } from '@/types/task';
// Importa os formatadores padronizados de data e hora
import { formatDate, formatTime } from '@/utils/date';

// Define os cinco níveis únicos de urgência e estado de uma tarefa
export type TaskUrgency = 'overdue' | 'today' | 'week' | 'later' | 'completed';

// Define o contrato visual e textual retornado para cada nível de urgência
export interface TaskStatusMeta {
  // Rótulo principal exibido no badge da tarefa
  label: string;
  // Rótulo curto usado em filtros e resumos
  shortLabel: string;
  // Classe Tailwind para a faixa lateral e barra de progresso
  barColor: string;
  // Classe Tailwind de fundo do badge de status
  badgeBg: string;
  // Classe Tailwind da cor do texto dentro do badge
  badgeText: string;
  // Classe Tailwind do ponto indicador no badge
  badgeDot: string;
  // Classe Tailwind para colorir a data do prazo limite
  deadlineTextColor: string;
  // Cor hexadecimal aplicada ao ícone de calendário do prazo
  deadlineIconColor: string;
}

// Classifica uma tarefa em um único nível de urgência de forma determinística
export function getTaskUrgency(
  task: Pick<Task, 'status' | 'deadline'>,
  nowMs = Date.now()
): TaskUrgency {
  // Tarefas concluídas sempre pertencem ao estado 'completed'
  if (task.status === 'completed') {
    return 'completed';
  }

  // Calcula a diferença em milissegundos entre o prazo final e o instante atual
  const diffMs = new Date(task.deadline).getTime() - nowMs;

  // Tarefas expiradas no banco ou com prazo já vencido entram em 'overdue' (nunca em 'today')
  if (task.status === 'expired' || diffMs <= 0) {
    return 'overdue';
  }

  // Converte o tempo restante em horas para separar hoje, semana e depois
  const diffHours = diffMs / (1000 * 60 * 60);

  // Prazos dentro das próximas 24 horas são urgentes ('today')
  if (diffHours <= 24) {
    return 'today';
  }

  // Prazos entre 24 horas e 7 dias entram na janela semanal ('week')
  if (diffHours <= 24 * 7) {
    return 'week';
  }

  // Prazos acima de 7 dias ficam classificados como futuros ('later')
  return 'later';
}

// Retorna rótulos e classes visuais consistentes a partir da urgência da tarefa
export function getTaskStatusMeta(
  urgency: TaskUrgency,
  timerLabel?: string,
  submittedAt?: string | null
): TaskStatusMeta {
  // Trata tarefas expiradas com rótulo oficial do SUAP e estilo neutro apagado (sem alarme vermelho)
  if (urgency === 'overdue') {
    return {
      label: 'Expirado',
      shortLabel: 'Expirados',
      barColor: 'bg-outline-variant',
      badgeBg: 'bg-surface-variant',
      badgeText: 'text-on-surface-variant',
      badgeDot: 'bg-outline',
      deadlineTextColor: 'text-on-surface-variant',
      deadlineIconColor: '#707971',
    };
  }

  // Tarefas com entrega em até 24h recebem destaque vermelho de urgência imediata
  if (urgency === 'today') {
    return {
      label: timerLabel || 'Hoje',
      shortLabel: 'Hoje',
      barColor: 'bg-error',
      badgeBg: 'bg-error-container',
      badgeText: 'text-on-error-container',
      badgeDot: 'bg-error',
      deadlineTextColor: 'text-error',
      deadlineIconColor: '#ba1a1a',
    };
  }

  // Tarefas da semana recebem destaque âmbar moderado sem alarme falso de erro
  if (urgency === 'week') {
    return {
      label: timerLabel || 'Esta semana',
      shortLabel: 'Esta semana',
      barColor: 'bg-warning',
      badgeBg: 'bg-warning-container',
      badgeText: 'text-on-warning-container',
      badgeDot: 'bg-warning',
      deadlineTextColor: 'text-on-surface',
      deadlineIconColor: '#3d4a40',
    };
  }

  // Tarefas mais distantes mantêm visual calmo em verde secundário
  if (urgency === 'later') {
    return {
      label: timerLabel || 'Depois',
      shortLabel: 'Depois',
      barColor: 'bg-secondary',
      badgeBg: 'bg-secondary-container',
      badgeText: 'text-on-secondary-fixed-variant',
      badgeDot: 'bg-secondary',
      deadlineTextColor: 'text-on-surface-variant',
      deadlineIconColor: '#3d4a40',
    };
  }

  // Tarefas entregues exibem data e hora da submissão quando disponíveis
  const deliveredLabel = submittedAt
    ? `Entregue em ${formatDate(submittedAt)} às ${formatTime(submittedAt)}`
    : 'Entregue';

  // Retorna o padrão institucional verde escuro para tarefas concluídas
  return {
    label: deliveredLabel,
    shortLabel: 'Entregue',
    barColor: 'bg-primary',
    badgeBg: 'bg-primary-container',
    badgeText: 'text-on-primary',
    badgeDot: 'bg-on-primary-container',
    deadlineTextColor: 'text-primary',
    deadlineIconColor: '#195e38',
  };
}
