import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '@/types/task';
import { formatDate, formatTime, getDaysDifference, getHoursDifference, isToday, isTomorrow } from '@/utils/date';

interface TaskDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function TaskDetailsModal({ visible, onClose, task }: TaskDetailsModalProps) {
  if (!task) return null;

  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  
  const isOverdue = task.status === 'expired';
  const isCompleted = task.status === 'completed';

  const daysLeft = getDaysDifference(task.deadline);
  const hoursLeft = getHoursDifference(task.deadline);
  
  const isCritical = daysLeft <= 1 && !isOverdue && !isCompleted;
  const isAttention = daysLeft > 1 && daysLeft <= 15 && !isOverdue && !isCompleted;

  let badgeBg = 'bg-secondary-container';
  let badgeText = 'text-on-secondary-container';
  let badgeDot = 'bg-secondary';
  let badgeLabel = '';
  let statusPessoal = 'Não iniciado';
  let statusColor = 'text-tertiary font-semibold';
  let statusBg = 'bg-tertiary-container border border-tertiary-fixed';

  if (isCompleted) {
    badgeBg = 'bg-primary-container';
    badgeText = 'text-on-primary-container';
    badgeDot = 'bg-primary';
    badgeLabel = 'Concluído';
    statusPessoal = 'Entregue';
    statusColor = 'text-primary font-bold';
    statusBg = 'bg-primary-container border border-primary/30';
  } else if (isOverdue) {
    badgeBg = 'bg-surface-variant';
    badgeText = 'text-on-surface-variant';
    badgeDot = 'bg-error';
    badgeLabel = 'Perdido';
    statusPessoal = 'Prazo Encerrado';
    statusColor = 'text-error font-bold';
    statusBg = 'bg-error-container border border-error/30';
  } else {
    if (isCritical) {
      badgeBg = 'bg-error-container';
      badgeText = 'text-on-error-container';
      badgeDot = 'bg-error';
    } else if (isAttention) {
      badgeBg = 'bg-tertiary-fixed';
      badgeText = 'text-on-tertiary-fixed';
      badgeDot = 'bg-tertiary';
    }
    
    if (isToday(task.deadline)) {
      badgeLabel = `Hoje • ${formatTime(task.deadline)}`;
    } else if (isTomorrow(task.deadline)) {
      badgeLabel = `Amanhã • ${formatTime(task.deadline)}`;
    } else {
      badgeLabel = `Em ${daysLeft} dias`;
    }
  }

  const handleOpenSuap = () => {
    // Exemplo de link para o SUAP usando o suap_id da tarefa
    Linking.openURL(`https://suap.ifmg.edu.br/edu/aluno_trabalho/${task.suap_id}/`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop escurecido */}
      <View className="flex-1 bg-black/60 justify-end items-center">
        {/* Container do Modal */}
        <View className="bg-surface rounded-t-[32px] w-full max-w-md h-[86%] flex-col overflow-hidden shadow-2xl">
          
          {/* Drag Handle */}
          <View className="pt-3 pb-1 shrink-0 flex items-center justify-center">
            <View className="w-12 h-1.5 bg-surface-variant rounded-full" />
          </View>

          {/* Modal Header */}
          <View className="px-5 pt-2 pb-3 shrink-0 border-b border-surface-container-high">
            <View className="flex-row items-center justify-end">
              {/* Botão Fechar */}
              <TouchableOpacity 
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high items-center justify-center"
              >
                <MaterialIcons name="close" size={20} color="#444746" />
              </TouchableOpacity>
            </View>

            <Text className="text-xl font-bold text-on-surface mt-3 mb-1.5 leading-snug tracking-tight">
              {task.title}
            </Text>
            
            <View className="flex-row items-center flex-wrap gap-2 text-xs">
              <View className="bg-transparent px-1 py-0.5">
                <Text className="text-primary font-bold text-[11px]">
                  {task.discipline_id} • {task.clean_subject || task.subject}
                </Text>
              </View>
            </View>
          </View>

          {/* Área Rolável */}
          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            
            {/* Grid de Informações Críticas */}
            <View className="bg-surface-container-lowest border border-surface-container rounded-2xl p-4 shadow-sm mb-5">
              <View className="flex-row flex-wrap gap-4">
                
                {/* Prazo */}
                <View className="flex-1 min-w-[45%]">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <MaterialIcons name="calendar-today" size={14} color="#ba1a1a" />
                    <Text className="text-[11px] font-medium text-on-surface-variant">Prazo Limite</Text>
                  </View>
                  <Text className="text-sm font-bold text-error">
                    {formatDate(task.deadline)} às {formatTime(task.deadline)}
                  </Text>
                </View>

                {/* Etapa/Peso */}
                <View className="flex-1 min-w-[45%]">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <MaterialIcons name="military-tech" size={16} color="#005785" />
                    <Text className="text-[11px] font-medium text-on-surface-variant">Etapa</Text>
                  </View>
                  <Text className="text-sm font-bold text-on-surface">
                    {task.etapa || 'Não especificada'}
                  </Text>
                </View>

                {/* Submissões */}
                <View className="flex-1 min-w-[45%] mt-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <MaterialIcons name="people-outline" size={16} color="#707971" />
                    <Text className="text-[11px] font-medium text-on-surface-variant">Submissões</Text>
                  </View>
                  <Text className="text-xs font-semibold text-on-surface">
                    {task.submission_count !== null ? `${task.submission_count} na turma` : 'Indisponível'}
                  </Text>
                </View>

                {/* Status Pessoal */}
                <View className="flex-1 min-w-[45%] mt-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <MaterialIcons name="account-circle" size={16} color="#707971" />
                    <Text className="text-[11px] font-medium text-on-surface-variant">Seu Status</Text>
                  </View>
                  <View className="items-start mt-0.5">
                    <View className="bg-transparent py-0.5">
                      <Text className={`text-[11px] font-bold ${statusColor}`}>
                        {statusPessoal}
                      </Text>
                    </View>
                  </View>
                </View>

              </View>
            </View>

            {/* Enunciado */}
            <View className="mb-5">
              <Text className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Enunciado & Diretrizes
              </Text>
              <View className="bg-surface-container-low p-4 rounded-xl border border-surface-container">
                <Text className="text-sm leading-relaxed text-on-surface">
                  {task.description || 'Nenhum enunciado foi fornecido para este trabalho.'}
                </Text>
              </View>
            </View>

            {/* Anexos */}
            {task.attachment_url && (
              <View className="mb-6">
                <Text className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Material de Apoio
                </Text>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(task.attachment_url as string)}
                  className="bg-surface border border-surface-container-high rounded-xl p-3 flex-row items-center justify-between shadow-sm active:bg-surface-container-lowest"
                >
                  <View className="flex-row items-center gap-3 overflow-hidden flex-1">
                    <View className="w-10 h-10 rounded-lg bg-error-container items-center justify-center">
                      <MaterialIcons name="picture-as-pdf" size={24} color="#ba1a1a" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
                        {task.attachment_url.split('/').pop() || 'anexo_trabalho'}
                      </Text>
                      <Text className="text-[10px] text-on-surface-variant mt-0.5">Tocar para baixar</Text>
                    </View>
                  </View>
                  <View className="p-2">
                    <MaterialIcons name="file-download" size={22} color="#195e38" />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View className="h-10" />
          </ScrollView>

          {/* Action Footer */}
          <View className="p-4 bg-surface border-t border-surface-container-high shadow-lg shrink-0 gap-3 pb-8">
            <TouchableOpacity 
              onPress={handleOpenSuap}
              className="bg-primary hover:bg-primary/90 rounded-xl py-3.5 px-4 flex-row items-center justify-center shadow-sm"
            >
              <Text className="text-on-primary font-bold text-sm mr-2">Abrir no SUAP</Text>
              <MaterialIcons name="open-in-new" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
