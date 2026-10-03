import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/task';
import { formatDate, formatTime, getDaysDifference, getHoursDifference } from '@/utils/date';
import { useTaskTimer } from '@/hooks/useTaskTimer';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTask() {
      if (!id) return;
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setTask(data as Task);
      }
      setLoading(false);
    }
    loadTask();
  }, [id]);

  const timer = useTaskTimer(task?.deadline || new Date().toISOString(), task?.status || 'pending');

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator size="large" color="#195e38" />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <Text className="text-on-surface-variant mb-4">Tarefa não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-4 py-2 bg-primary rounded-lg">
          <Text className="text-on-primary font-bold">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  
  const isOverdue = task.status === 'expired';
  const isCompleted = task.status === 'completed';

  const { daysLeft } = timer;
  
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
    if (task.submitted_at) {
      badgeLabel = `Entregue dia ${formatDate(task.submitted_at)} às ${formatTime(task.submitted_at)}`;
      statusPessoal = `Entregue em ${formatDate(task.submitted_at)}`;
    } else {
      badgeLabel = 'Entregue';
      statusPessoal = 'Entregue';
    }
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
    
    badgeLabel = timer.label;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header Fixo */}
      <View className="px-4 py-4 flex-row items-center border-b border-surface-container-high shadow-sm bg-surface">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 -ml-2 rounded-full items-center justify-center active:bg-surface-container"
        >
          <MaterialIcons name="arrow-back" size={24} color="#111c2d" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-on-surface ml-2 flex-1" numberOfLines={1}>
          Detalhes da Tarefa
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {/* Título e Badge */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-on-surface mb-2 leading-tight tracking-tight">
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
                <View className="bg-transparent px-1 py-0.5">
                  <Text className={`text-[11px] ${statusColor}`}>
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
      </ScrollView>

      {/* Action Footer */}
      <View className="p-4 bg-surface border-t border-surface-container-high shadow-lg shrink-0 gap-3 pb-8">
        <TouchableOpacity 
          onPress={() => Linking.openURL(`https://suap.ifmg.edu.br/edu/aluno_trabalho/${task.suap_id}/`)}
          className="bg-primary hover:bg-primary/90 rounded-xl py-3.5 px-4 flex-row items-center justify-center shadow-sm"
        >
          <Text className="text-on-primary font-bold text-sm mr-2">Abrir no SUAP</Text>
          <MaterialIcons name="open-in-new" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
