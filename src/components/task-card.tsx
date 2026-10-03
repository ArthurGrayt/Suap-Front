import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '@/types/task';
import { getDaysDifference, getHoursDifference, formatDate, formatTime, getWeekday } from '@/utils/date';
import { useTaskTimer } from '@/hooks/useTaskTimer';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const isOverdue = task.status === 'expired';
  const isCompleted = task.status === 'completed';

  const timer = useTaskTimer(task.deadline, task.status);
  const { daysLeft } = timer;
  
  const isCritical = daysLeft <= 1 && !isOverdue && !isCompleted;
  const isAttention = daysLeft > 1 && daysLeft <= 15 && !isOverdue && !isCompleted;
  
  // Cores dinâmicas
  let barColor = 'bg-secondary';
  let badgeBg = 'bg-secondary-container';
  let badgeText = 'text-on-secondary-container';
  let badgeDot = 'bg-secondary';
  let badgeLabel = '';

  if (isCompleted) {
    barColor = 'bg-primary';
    badgeBg = 'bg-primary-container';
    badgeText = 'text-on-primary-container';
    badgeDot = 'bg-primary';
    if (task.submitted_at) {
      badgeLabel = `Entregue dia ${formatDate(task.submitted_at)} às ${formatTime(task.submitted_at)}`;
    } else {
      badgeLabel = 'Entregue';
    }
  } else if (isOverdue) {
    barColor = 'bg-error opacity-50';
    badgeBg = 'bg-surface-variant';
    badgeText = 'text-on-surface-variant';
    badgeDot = 'bg-error';
    badgeLabel = 'Perdido';
  } else if (isCritical) {
    barColor = 'bg-error';
    badgeBg = 'bg-error-container';
    badgeText = 'text-on-error-container';
    badgeDot = 'bg-error';
    badgeLabel = timer.label;
  } else if (isAttention) {
    barColor = 'bg-tertiary-container';
    badgeBg = 'bg-tertiary-fixed';
    badgeText = 'text-on-tertiary-fixed';
    badgeDot = 'bg-tertiary';
    badgeLabel = timer.label;
  } else {
    badgeLabel = timer.label;
  }

  // Cálculo dinâmico do progresso da barra
  let progressValue = 0;
  if (isCompleted || isOverdue) {
    progressValue = 100;
  } else {
    const start = new Date(task.requested_at || task.created_at).getTime();
    const end = new Date(task.deadline).getTime();
    const current = new Date().getTime(); // O hook useTaskTimer faz o re-render
    
    if (end > start) {
      const total = end - start;
      const elapsed = current - start;
      progressValue = Math.max(0, Math.min(100, (elapsed / total) * 100));
    }
  }

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      className={`bg-surface-container-lowest rounded-xl shadow-sm p-4 flex-col overflow-hidden mb-4 ${isOverdue ? 'opacity-70' : ''}`}
    >
      {/* Faixa lateral indicando urgência */}
      <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`} />
      
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs px-2 py-1 bg-transparent text-primary font-bold">
          {task.discipline_id} • {task.clean_subject || task.subject}
        </Text>
        {/* Badge de Prazo */}
        <View className={`flex-row items-center ${badgeBg} px-2.5 py-1 bg-transparent`}>
          <View className={`w-2 h-2 ${badgeDot} rounded-full mr-1`} />
          <Text className={`text-[10px] ${badgeText} font-bold`}>{badgeLabel}</Text>
        </View>
      </View>
      
      <Text className="text-lg font-bold text-on-surface mt-1">{task.title}</Text>
      {task.description && (
        <Text className="text-sm text-on-surface-variant mt-1.5" numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {/* Termômetro visual */}
      <View className="w-full bg-surface-container h-1.5 rounded-full my-3 overflow-hidden">
        <View 
          className={`${barColor} h-full rounded-full`} 
          style={{ width: `${progressValue}%` }} 
        />
      </View>

      {/* Metadados da atividade */}
      <View className="flex-row items-center gap-4 mb-2">
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="calendar-today" size={14} color="#707971" />
          <Text className={`text-[10px] ${isCritical ? 'text-error' : 'text-on-surface-variant'} font-bold`}>
            {formatDate(task.deadline)} ({getWeekday(task.deadline)})
          </Text>
        </View>
       
      </View>

      {/* Ações do Card - Esconde se estiver concluído ou perdido */}
      {!isCompleted && !isOverdue && (
        <View className="flex-row items-center gap-2 mt-2">
          {isCritical ? (
            <TouchableOpacity className="h-10 flex-1 rounded-lg bg-primary-container flex-row items-center justify-center shadow-sm">
              <MaterialIcons name="upload" size={18} color="#ffffff" />
              <Text className="text-on-primary text-sm font-bold ml-1">Entregar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="h-10 flex-1 rounded-lg bg-surface-container-high flex-row items-center justify-center">
              <MaterialIcons name="edit-note" size={18} color="#195e38" />
              <Text className="text-primary-container text-sm font-bold ml-1">Preparar Submissão</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={onPress}
            className="h-10 w-10 rounded-lg bg-surface-container items-center justify-center"
          >
            <MaterialIcons name="info-outline" size={20} color="#195e38" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
