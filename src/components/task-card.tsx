// Importa React para construir o componente do card de tarefa
import React from 'react';
// Importa View, Text e TouchableOpacity do React Native
import { View, Text, TouchableOpacity } from 'react-native';
// Importa o conjunto de ícones MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa o tipo Task que descreve uma atividade acadêmica
import { Task } from '@/types/task';
// Importa utilitários de formatação de data e dia da semana
import { formatDate, getWeekday } from '@/utils/date';
// Importa o hook responsável pela contagem regressiva em tempo real da tarefa
import { useTaskTimer } from '@/hooks/useTaskTimer';
// Importa o modelo único de urgência e estilo semântico compartilhado entre telas
import { getTaskStatusMeta, getTaskUrgency } from '@/utils/task-status';

// Interface de propriedades recebidas pelo card de tarefa
interface TaskCardProps {
  // Objeto contendo todos os dados da tarefa do SUAP
  task: Task;
  // Função de navegação disparada ao tocar no card
  onPress?: () => void;
}

// Card de exibição resumida de uma atividade na Central de Prazos
export default function TaskCard({ task, onPress }: TaskCardProps) {
  // Obtém o timer calculado e o tempo restante até o prazo em tempo real
  const timer = useTaskTimer(task.deadline, task.status);
  // Classifica a tarefa no modelo único de urgência compartilhado
  const urgency = getTaskUrgency(task);
  // Recupera rótulo e tokens de cor coerentes com o nível de urgência
  const statusMeta = getTaskStatusMeta(urgency, timer.label, task.submitted_at);

  // Calcula a porcentagem preenchida da barra de progresso temporal
  let progressValue = 0;
  // Tarefas concluídas ou atrasadas preenchem 100% da barra
  if (urgency === 'completed' || urgency === 'overdue') {
    progressValue = 100;
  } else {
    // Obtém o timestamp inicial (solicitação ou criação)
    const start = new Date(task.requested_at || task.created_at).getTime();
    // Obtém o timestamp do prazo final
    const end = new Date(task.deadline).getTime();
    // Obtém o timestamp atual para calcular o tempo decorrido
    const current = new Date().getTime();

    // Evita divisão por zero caso as datas coincidam
    if (end > start) {
      const total = end - start;
      const elapsed = current - start;
      progressValue = Math.max(0, Math.min(100, (elapsed / total) * 100));
    }
  }

  // Monta a identificação da disciplina omitindo partes nulas ou vazias
  const disciplineLabel = [task.discipline_id, task.clean_subject || task.subject]
    .filter((part) => Boolean(part && String(part).trim().length > 0))
    .join(' • ');
  // Identifica se a atividade veio da aba Materiais de Aula (sem entrega aberta em Trabalhos)
  const isFromClassMaterials = Boolean(task.suap_id && task.suap_id.includes('-mat-'));

  return (
    // Card inteiro clicável como alvo único acessível; tarefas expiradas ficam apagadas em tom neutro
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Tarefa ${task.title}, ${disciplineLabel || 'Disciplina não informada'}, status ${statusMeta.label}`}
      className={`rounded-xl border border-surface-container p-4 flex-col overflow-hidden mb-3 active:bg-surface-container-low ${
        urgency === 'overdue'
          ? 'bg-surface-container-low opacity-65'
          : 'bg-surface-container-lowest'
      }`}
    >
      {/* Faixa vertical esquerda indicando o nível de urgência */}
      <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusMeta.barColor}`} />

      {/* Cabeçalho do card: tag da disciplina e badge semântico de prazo */}
      <View className="flex-row items-center justify-between gap-2 mb-2 pl-1">
        {/* Identificação da disciplina com fundo sutil para leitura */}
        <Text
          className="text-xs px-2 py-1 rounded-md bg-surface-container-low text-primary font-bold flex-shrink"
          numberOfLines={1}
        >
          {disciplineLabel || 'Disciplina'}
        </Text>
        {/* Badge de prazo com contraste garantido pelo modelo único de status */}
        <View className={`flex-row items-center ${statusMeta.badgeBg} px-2.5 py-1 rounded-full shrink-0`}>
          <View className={`w-2 h-2 ${statusMeta.badgeDot} rounded-full mr-1.5`} />
          <Text className={`text-xs ${statusMeta.badgeText} font-bold`}>{statusMeta.label}</Text>
        </View>
      </View>

      {/* Título principal da atividade */}
      <Text className="text-lg font-bold text-on-surface mt-0.5 pl-1">{task.title}</Text>

      {/* Tag discreta quando o trabalho foi detectado na aba Materiais de Aula */}
      {isFromClassMaterials && (
        <View className="flex-row items-center self-start gap-1 bg-tertiary-fixed/70 px-2 py-0.5 rounded-md mt-1.5 ml-1">
          <MaterialIcons name="menu-book" size={12} color="#004b73" />
          <Text className="text-[10.5px] font-bold text-on-tertiary-fixed-variant">
            Materiais de Aula{task.points ? ` • ${task.points}` : ''}
          </Text>
        </View>
      )}

      {/* Enunciado resumido em no máximo 2 linhas quando disponível */}
      {task.description && (
        <Text className="text-sm text-on-surface-variant mt-1.5 pl-1" numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {/* Barra de progresso temporal do prazo */}
      <View className="w-full bg-surface-container h-1.5 rounded-full my-3 overflow-hidden">
        <View
          className={`${statusMeta.barColor} h-full rounded-full`}
          style={{ width: `${progressValue}%` }}
        />
      </View>

      {/* Rodapé informativo com data do prazo e seta discreta indicando navegação para detalhes */}
      <View className="flex-row items-center justify-between pl-1">
        <View className="flex-row items-center gap-1.5">
          <MaterialIcons name="calendar-today" size={14} color={statusMeta.deadlineIconColor} />
          <Text className={`text-xs ${statusMeta.deadlineTextColor} font-bold`}>
            {formatDate(task.deadline)} ({getWeekday(task.deadline)})
          </Text>
        </View>
        {/* Indicador visual não interativo para evitar botões aninhados no leitor de tela */}
        <MaterialIcons name="chevron-right" size={20} color="#3d4a40" />
      </View>
    </TouchableOpacity>
  );
}
