// Importa React e hooks de efeito, callback e estado
import React, { useCallback, useEffect, useState } from 'react';
// Importa componentes de UI, TextInput e Linking para abertura segura de links externos
import { View, Text, TextInput, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
// Importa SafeAreaView para respeitar a borda inferior em dispositivos com notch
import { SafeAreaView } from 'react-native-safe-area-context';
// Importa hooks de parâmetros e navegação do Expo Router
import { useLocalSearchParams, useRouter } from 'expo-router';
// Importa os ícones MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa o cliente Supabase para buscar os detalhes da tarefa pelo ID
import { supabase } from '@/lib/supabase';
// Importa o tipo Task
import { Task } from '@/types/task';
// Importa utilitários de formatação de data e hora
import { formatDate, formatTime } from '@/utils/date';
// Importa o hook de contagem regressiva em tempo real
import { useTaskTimer } from '@/hooks/useTaskTimer';
// Importa o cabeçalho institucional padrão com botão de voltar
import Header from '@/components/header';
// Importa o diálogo multiplataforma para feedback de erro ao abrir links
import { showAlert } from '@/utils/dialog';
// Importa o modelo único de urgência e estilo semântico compartilhado
import { getTaskStatusMeta, getTaskUrgency } from '@/utils/task-status';

// Determina ícone e cor adequados conforme a extensão do anexo vinculado
function getAttachmentVisual(url: string): {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  containerClass: string;
} {
  // Remove query strings antes de checar a extensão real do arquivo
  const cleanUrl = url.split('?')[0].toLowerCase();

  // Documentos PDF usam ícone específico de PDF em container suave de destaque
  if (cleanUrl.endsWith('.pdf')) {
    return {
      icon: 'picture-as-pdf',
      iconColor: '#ba1a1a',
      containerClass: 'bg-error-container',
    };
  }

  // Arquivos de imagem usam ícone de imagem na paleta verde institucional
  if (/\.(png|jpg|jpeg|webp|gif)$/.test(cleanUrl)) {
    return {
      icon: 'image',
      iconColor: '#195e38',
      containerClass: 'bg-surface-container-high',
    };
  }

  // Demais tipos (doc, zip, txt, link) usam ícone genérico de anexo
  return {
    icon: 'attach-file',
    iconColor: '#195e38',
    containerClass: 'bg-surface-container-high',
  };
}

// Tela de detalhes completos de uma atividade do SUAP
export default function TaskDetailsScreen() {
  // Recupera o parâmetro dinâmico id da rota
  const { id } = useLocalSearchParams<{ id: string }>();
  // Instância do roteador para navegação de retorno
  const router = useRouter();

  // Estado para armazenar os dados reais da tarefa buscada no banco
  const [task, setTask] = useState<Task | null>(null);
  // Estado de carregamento inicializado em true até o término da busca
  const [loading, setLoading] = useState(true);
  // Estado separado para falhas de rede/servidor (evita confundir erro de rede com tarefa inexistente)
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Estado local do campo editável de pontuação/valor da atividade
  const [pointsInput, setPointsInput] = useState('');
  // Estado que indica salvamento da pontuação em andamento no Supabase
  const [savingPoints, setSavingPoints] = useState(false);

  // Carrega os detalhes da tarefa selecionada no Supabase com tratamento explícito de erros
  const loadTask = useCallback(async () => {
    // Se não houver ID válido na rota, encerra sem erro de rede
    if (!id) {
      setLoading(false);
      return;
    }

    // Reinicia os estados antes de iniciar a consulta
    setLoading(true);
    setFetchError(null);

    try {
      // Busca a tarefa correspondente ao ID da rota usando maybeSingle para distinguir ausência real de falha
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // Propaga erro retornado pelo Supabase para exibir recuperação amigável
      if (error) {
        throw error;
      }

      // Atualiza o estado com a tarefa encontrada ou null quando realmente não existe
      const loadedTask = (data as Task) || null;
      setTask(loadedTask);
      // Sincroniza o campo editável de pontuação com o valor salvo no banco
      setPointsInput(loadedTask?.points || '');
    } catch (err: unknown) {
      // Registra detalhes técnicos apenas no console
      console.error('Erro ao carregar tarefa:', err);
      const rawMessage =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: unknown }).message || '')
          : '';
      // Exibe mensagem amigável diferenciando queda de conexão de falha genérica
      if (/network|fetch|timeout|failed to fetch|connection/i.test(rawMessage)) {
        setFetchError('Sem conexão com a internet. Não foi possível carregar os detalhes da tarefa.');
      } else {
        setFetchError('Não foi possível carregar os detalhes da tarefa. Tente novamente.');
      }
    } finally {
      // Finaliza o indicador de carregamento
      setLoading(false);
    }
  }, [id]);

  // Dispara a busca ao montar ou mudar o ID da rota sem setState síncrono no corpo do efeito
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!id) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!active) return;
        if (error) throw error;
        const loadedTask = (data as Task) || null;
        setTask(loadedTask);
        // Sincroniza o campo editável de pontuação com o valor inicial carregado
        setPointsInput(loadedTask?.points || '');
      } catch (err: unknown) {
        if (!active) return;
        console.error('Erro ao carregar tarefa:', err);
        const rawMessage =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: unknown }).message || '')
            : '';
        if (/network|fetch|timeout|failed to fetch|connection/i.test(rawMessage)) {
          setFetchError('Sem conexão com a internet. Não foi possível carregar os detalhes da tarefa.');
        } else {
          setFetchError('Não foi possível carregar os detalhes da tarefa. Tente novamente.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [id]);

  // Inicializa o timer dinâmico com fallback seguro enquanto carrega
  const timer = useTaskTimer(task?.deadline || new Date().toISOString(), task?.status || 'pending');

  // Persiste a pontuação/valor editada pelo aluno na tabela tasks do Supabase
  const handleSavePoints = async () => {
    // Garante que existe uma tarefa carregada antes de tentar atualizar
    if (!task) return;
    // Normaliza o texto removendo espaços extras nas pontas
    const trimmed = pointsInput.trim();
    // Converte string vazia para null ao persistir no banco
    const nextPoints = trimmed.length > 0 ? trimmed : null;
    // Evita chamada desnecessária ao Supabase se o valor não mudou
    if ((task.points || null) === nextPoints) return;

    // Ativa indicador discreto de salvamento
    setSavingPoints(true);
    try {
      // Atualiza a coluna points na tabela tasks correspondente ao ID atual
      const { error } = await supabase
        .from('tasks')
        .update({ points: nextPoints })
        .eq('id', task.id);

      // Lança exceção caso o Supabase retorne erro na atualização
      if (error) throw error;

      // Atualiza o objeto local da tarefa mantendo a interface sincronizada
      setTask((prev) => (prev ? { ...prev, points: nextPoints } : prev));
    } catch (err) {
      // Registra falha técnica no console
      console.error('Erro ao salvar pontuação da tarefa:', err);
      // Exibe feedback amigável ao usuário
      showAlert('Erro', 'Não foi possível salvar a pontuação da atividade.');
    } finally {
      // Finaliza o indicador de salvamento
      setSavingPoints(false);
    }
  };

  // Função auxiliar para abrir URLs externas tratando falhas de forma segura
  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showAlert('Erro', 'Não foi possível abrir o endereço no dispositivo.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showAlert('Erro', 'Não foi possível abrir o link.');
    }
  };

  // Exibe indicador de carregamento centralizado enquanto busca os dados
  if (loading) {
    return (
      <View className="flex-1 bg-surface">
        <Header title="Detalhes da tarefa" showBackButton={true} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#195e38" />
        </View>
      </View>
    );
  }

  // Exibe tela de erro com botão de tentar novamente quando houver falha de rede/consulta
  if (fetchError) {
    return (
      <View className="flex-1 bg-surface">
        <Header title="Detalhes da tarefa" showBackButton={true} />
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="wifi-off" size={44} color="#ba1a1a" />
          <Text className="text-on-surface mt-3 mb-4 text-center font-semibold">
            {fetchError}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a lista de tarefas"
              className="px-5 py-3 bg-surface-container-high rounded-xl"
            >
              <Text className="text-on-surface font-bold">Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={loadTask}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar tarefa novamente"
              className="px-5 py-3 bg-primary-container rounded-xl"
            >
              <Text className="text-on-primary font-bold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Exibe mensagem amigável e botão voltar caso a tarefa realmente não exista
  if (!task) {
    return (
      <View className="flex-1 bg-surface">
        <Header title="Detalhes da tarefa" showBackButton={true} />
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="assignment-late" size={44} color="#3d4a40" />
          <Text className="text-on-surface-variant mt-3 mb-4 text-center font-medium">
            Tarefa não encontrada.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a lista de tarefas"
            className="px-5 py-3 bg-primary-container rounded-xl"
          >
            <Text className="text-on-primary font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Classifica a tarefa e obtém metadados visuais do modelo único de status
  const urgency = getTaskUrgency(task);
  const statusMeta = getTaskStatusMeta(urgency, timer.label, task.submitted_at);

  // Monta identificação limpa da disciplina omitindo partes nulas ou vazias
  const disciplineLabel = [task.discipline_id, task.clean_subject || task.subject]
    .filter((part) => Boolean(part && String(part).trim().length > 0))
    .join(' • ');

  // Define visual do material de apoio conforme o tipo de arquivo quando houver anexo
  const attachmentVisual = task.attachment_url ? getAttachmentVisual(task.attachment_url) : null;
  // Identifica se o trabalho foi importado da aba Materiais de Aula no SUAP
  const isFromClassMaterials = Boolean(task.suap_id && task.suap_id.includes('-mat-'));
  // Define o link correto da sala virtual no SUAP conforme a aba de origem da tarefa
  const suapTargetUrl = isFromClassMaterials
    ? `https://suap.ifmg.edu.br/edu/sala_virtual/${task.discipline_id}/?tab=materiais`
    : `https://suap.ifmg.edu.br/edu/sala_virtual/${task.discipline_id}/?tab=trabalhos`;

  return (
    <View className="flex-1 bg-surface">
      {/* Cabeçalho padronizado institucional com botão de voltar em sentence case */}
      <Header title="Detalhes da tarefa" showBackButton={true} />

      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {/* Título principal e identificação da disciplina */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-on-surface mb-2 leading-tight tracking-tight">
            {task.title}
          </Text>

          <View className="flex-row items-center flex-wrap gap-2">
            <View className="bg-surface-container-low px-2.5 py-1 rounded-md">
              <Text className="text-primary font-bold text-xs">
                {disciplineLabel || 'Disciplina'}
              </Text>
            </View>
            {isFromClassMaterials && (
              <View className="bg-tertiary-fixed/80 px-2.5 py-1 rounded-md flex-row items-center gap-1">
                <MaterialIcons name="menu-book" size={13} color="#004b73" />
                <Text className="text-on-tertiary-fixed-variant font-bold text-xs">
                  Materiais de Aula
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Grid 2x2 com informações críticas da atividade */}
        <View className="bg-surface-container-lowest border border-surface-container rounded-2xl p-4 mb-5">
          <View className="flex-row flex-wrap gap-4">
            {/* Prazo limite colorido conforme urgência real da tarefa */}
            <View className="flex-1 min-w-[45%]">
              <View className="flex-row items-center gap-1.5 mb-1">
                <MaterialIcons name="calendar-today" size={14} color={statusMeta.deadlineIconColor} />
                <Text className="text-xs font-medium text-on-surface-variant">Prazo limite</Text>
              </View>
              <Text className={`text-sm font-bold ${statusMeta.deadlineTextColor}`}>
                {formatDate(task.deadline)} às {formatTime(task.deadline)}
              </Text>
            </View>

            {/* Etapa letiva */}
            <View className="flex-1 min-w-[45%]">
              <View className="flex-row items-center gap-1.5 mb-1">
                <MaterialIcons name="military-tech" size={16} color="#195e38" />
                <Text className="text-xs font-medium text-on-surface-variant">Etapa</Text>
              </View>
              <Text className="text-sm font-bold text-on-surface">
                {task.etapa || 'Não especificada'}
              </Text>
            </View>

            {/* Quantidade de submissões */}
            <View className="flex-1 min-w-[45%] mt-2">
              <View className="flex-row items-center gap-1.5 mb-1">
                <MaterialIcons name="people-outline" size={16} color="#3d4a40" />
                <Text className="text-xs font-medium text-on-surface-variant">Submissões</Text>
              </View>
              <Text className="text-xs font-semibold text-on-surface">
                {task.submission_count !== null ? `${task.submission_count} na turma` : 'Indisponível'}
              </Text>
            </View>

            {/* Status pessoal com badge contrastado do modelo compartilhado */}
            <View className="flex-1 min-w-[45%] mt-2">
              <View className="flex-row items-center gap-1.5 mb-1">
                <MaterialIcons name="account-circle" size={16} color="#3d4a40" />
                <Text className="text-xs font-medium text-on-surface-variant">Seu status</Text>
              </View>
              <View className="items-start mt-0.5">
                <View className={`${statusMeta.badgeBg} px-2.5 py-1 rounded-full flex-row items-center gap-1.5`}>
                  <View className={`w-2 h-2 rounded-full ${statusMeta.badgeDot}`} />
                  <Text className={`text-xs font-bold ${statusMeta.badgeText}`}>{statusMeta.label}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Campo editável discreto para Pontuação / Valor salvo automaticamente no Supabase */}
          <View className="mt-4 pt-3 border-t border-surface-container flex-row items-center justify-between gap-3">
            {/* Rótulo com ícone de troféu/estrela */}
            <View className="flex-row items-center gap-1.5 shrink-0">
              <MaterialIcons name="emoji-events" size={16} color="#195e38" />
              <Text className="text-xs font-medium text-on-surface-variant">Pontuação / Valor</Text>
            </View>

            {/* Input compacto com overflow-hidden e minWidth 0 para manter o ícone sempre dentro da caixa no Web e Mobile */}
            <View className="flex-row items-center bg-surface-container-low border border-surface-container rounded-lg px-2.5 h-9 w-36 overflow-hidden">
              <TextInput
                value={pointsInput}
                onChangeText={setPointsInput}
                onBlur={handleSavePoints}
                onSubmitEditing={handleSavePoints}
                returnKeyType="done"
                placeholder="Ex: 15 pts"
                placeholderTextColor="#707971"
                accessibilityLabel="Pontuação ou valor da atividade"
                style={{ minWidth: 0 }}
                className="flex-1 min-w-0 text-xs font-bold text-on-surface text-right"
              />
              {/* Exibe spinner enquanto salva ou ícone discreto de edição sem vazar da borda */}
              <View className="ml-1.5 shrink-0">
                {savingPoints ? (
                  <ActivityIndicator size="small" color="#195e38" />
                ) : (
                  <MaterialIcons name="edit" size={13} color="#707971" />
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Seção de enunciado e diretrizes */}
        <View className="mb-5">
          <Text className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Enunciado e diretrizes
          </Text>
          <View className="bg-surface-container-low p-4 rounded-xl border border-surface-container">
            <Text className="text-sm leading-relaxed text-on-surface">
              {task.description || 'Nenhum enunciado foi fornecido para este trabalho.'}
            </Text>
          </View>
        </View>

        {/* Seção de material de apoio anexado quando existir */}
        {task.attachment_url && attachmentVisual && (
          <View className="mb-6">
            <Text className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Material de apoio
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenUrl(task.attachment_url as string)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir material de apoio ${task.attachment_url.split('/').pop() || 'anexo'}`}
              className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-3 flex-row items-center justify-between active:bg-surface-container-low"
            >
              <View className="flex-row items-center gap-3 overflow-hidden flex-1">
                <View className={`w-10 h-10 rounded-lg ${attachmentVisual.containerClass} items-center justify-center`}>
                  <MaterialIcons name={attachmentVisual.icon} size={22} color={attachmentVisual.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
                    {task.attachment_url.split('/').pop() || 'anexo_trabalho'}
                  </Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">Tocar para abrir</Text>
                </View>
              </View>
              <View className="p-2">
                <MaterialIcons name="open-in-new" size={20} color="#195e38" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Rodapé com botão de ação principal protegido pela área segura inferior */}
      <SafeAreaView edges={['bottom']} className="p-4 bg-surface border-t border-surface-container-high shrink-0">
        <TouchableOpacity
          onPress={() => handleOpenUrl(suapTargetUrl)}
          accessibilityRole="button"
          accessibilityLabel="Abrir tarefa no portal SUAP"
          className="bg-primary active:bg-primary-container rounded-xl h-12 px-4 flex-row items-center justify-center"
        >
          <Text className="text-on-primary font-bold text-sm mr-2">
            {isFromClassMaterials ? 'Abrir Materiais de Aula no SUAP' : 'Abrir no SUAP'}
          </Text>
          <MaterialIcons name="open-in-new" size={18} color="#ffffff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
