// Importa React e hooks de estado, efeito, callback e ref para auto-save com debounce
import React, { useState, useEffect, useCallback, useRef } from 'react';
// Importa componentes de interface do React Native
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator } from 'react-native';
// Importa os ícones MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa a barra inferior de navegação
import BottomNavbar from '@/components/bottom-navbar';
// Importa o cabeçalho institucional superior
import Header from '@/components/header';
// Importa o cliente Supabase para persistência de preferências e regras
import { supabase } from '@/lib/supabase';
// Importa os diálogos multiplataforma compatíveis com Web e Mobile
import { showAlert, showConfirm } from '@/utils/dialog';

// Define a estrutura tipada de uma regra personalizada de lembrete
interface NotificationRule {
  // Identificador único no banco
  id: string;
  // Título exibido na lista de regras
  title: string;
  // Texto enviado na notificação push
  custom_message: string;
  // Quantidade de tempo antes do prazo para disparo
  trigger_time_value: number;
  // Unidade do disparo ('hours' ou 'minutes')
  trigger_time_unit: string;
  // Intervalo de repetição (0 significa sem repetição)
  recurrence_time_value: number;
  // Unidade da repetição ('hours' ou 'minutes')
  recurrence_time_unit: string;
  // Indica se a regra está ativa
  is_active: boolean;
}

// Tela de configurações de lembretes e regras personalizadas de notificação
export default function NotificationsScreen() {
  // Estado para ativação geral das notificações push no aplicativo
  const [pushEnabled, setPushEnabled] = useState(true);
  // Estado que define com quantas horas de antecedência o alerta principal será enviado
  const [notifyBeforeHours, setNotifyBeforeHours] = useState(24);
  // Estado numérico da frequência de repetição do aviso
  const [notificationInterval, setNotificationInterval] = useState(2);
  // Texto editável do campo de repetição para permitir digitação fluida antes da validação
  const [intervalText, setIntervalText] = useState('2');
  // Mensagem inline quando o intervalo digitado estiver fora dos limites permitidos
  const [intervalError, setIntervalError] = useState<string | null>(null);
  // Estado que define a unidade de tempo da repetição (horas ou minutos)
  const [intervalUnit, setIntervalUnit] = useState<'horas' | 'minutos'>('horas');
  // Estado para armazenar o ID do registro de preferências no banco
  const [prefId, setPrefId] = useState<string | null>(null);
  // Estado de carregamento inicializado em true até concluir o fetch real
  const [loading, setLoading] = useState(true);
  // Estado de erro amigável caso o carregamento inicial das preferências falhe
  const [loadError, setLoadError] = useState<string | null>(null);
  // Estado visual discreto do auto-save ('idle', 'saving', 'saved', 'error')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Referência para o temporizador de debounce do auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lista de regras personalizadas carregadas do Supabase
  const [rules, setRules] = useState<NotificationRule[]>([]);
  // Estado para controlar a exibição do formulário de criação de regra
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  // Estado do campo de título da nova regra
  const [newRuleTitle, setNewRuleTitle] = useState('');
  // Estado do campo de mensagem personalizada da nova regra
  const [newRuleMessage, setNewRuleMessage] = useState('');
  // Estado do valor numérico de disparo
  const [triggerVal, setTriggerVal] = useState('24');
  // Estado da unidade de disparo ('hours' ou 'minutes')
  const [triggerUnit, setTriggerUnit] = useState<'hours' | 'minutes'>('hours');
  // Estado do valor numérico de recorrência
  const [recurrenceVal, setRecurrenceVal] = useState('0');
  // Estado da unidade de recorrência ('hours' ou 'minutes')
  const [recurrenceUnit, setRecurrenceUnit] = useState<'hours' | 'minutes'>('hours');
  // Estado indicador de criação de regra em progresso
  const [addingRule, setAddingRule] = useState(false);

  // Valida o intervalo de repetição conforme a unidade selecionada (evita spam de push)
  const validateInterval = useCallback((value: number, unit: 'horas' | 'minutos'): string | null => {
    // Em minutos, exige no mínimo 15 min e no máximo 1440 min (24h)
    if (unit === 'minutos') {
      if (!Number.isFinite(value) || value < 15 || value > 1440) {
        return 'Em minutos, informe um valor entre 15 e 1440.';
      }
      return null;
    }

    // Em horas, exige no mínimo 1h e no máximo 168h (7 dias)
    if (!Number.isFinite(value) || value < 1 || value > 168) {
      return 'Em horas, informe um valor entre 1 e 168.';
    }
    return null;
  }, []);

  // Busca as preferências e regras personalizadas do usuário ao montar a tela
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Consulta preferências globais de alerta do usuário
      const { data, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (prefError) throw prefError;

      if (data) {
        const loadedInterval = data.notification_interval_hours ?? 2;
        const loadedUnit: 'horas' | 'minutos' = data.unity_time === 'minutos' ? 'minutos' : 'horas';
        setPrefId(data.id);
        setPushEnabled(data.push_enabled ?? true);
        setNotifyBeforeHours(data.notify_before_hours ?? 24);
        setNotificationInterval(loadedInterval);
        setIntervalText(String(loadedInterval));
        setIntervalUnit(loadedUnit);
        setIntervalError(validateInterval(loadedInterval, loadedUnit));
      }

      // Consulta regras personalizadas cadastradas ordenadas da mais recente para a mais antiga
      const { data: rulesData, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;
      if (rulesData) setRules(rulesData as NotificationRule[]);
    } catch (err) {
      // Registra erro técnico no console e exibe aviso amigável na tela
      console.error('Erro ao buscar preferências:', err);
      setLoadError('Não foi possível carregar suas configurações de lembretes.');
    } finally {
      setLoading(false);
    }
  }, [validateInterval]);

  // Carrega dados iniciais ao montar a tela sem chamar setState síncrono direto no corpo do efeito
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const { data, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!active) return;
        if (prefError) throw prefError;

        if (data) {
          const loadedInterval = data.notification_interval_hours ?? 2;
          const loadedUnit: 'horas' | 'minutos' = data.unity_time === 'minutos' ? 'minutos' : 'horas';
          setPrefId(data.id);
          setPushEnabled(data.push_enabled ?? true);
          setNotifyBeforeHours(data.notify_before_hours ?? 24);
          setNotificationInterval(loadedInterval);
          setIntervalText(String(loadedInterval));
          setIntervalUnit(loadedUnit);
          setIntervalError(validateInterval(loadedInterval, loadedUnit));
        }

        const { data: rulesData, error: rulesError } = await supabase
          .from('notification_rules')
          .select('*')
          .order('created_at', { ascending: false });

        if (!active) return;
        if (rulesError) throw rulesError;
        if (rulesData) setRules(rulesData as NotificationRule[]);
      } catch (err) {
        if (!active) return;
        console.error('Erro ao buscar preferências:', err);
        setLoadError('Não foi possível carregar suas configurações de lembretes.');
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [validateInterval]);

  // Persiste preferências validadas no Supabase automaticamente
  const persistPreferences = useCallback(
    async (nextValues: {
      pushEnabled: boolean;
      notifyBeforeHours: number;
      notificationInterval: number;
      intervalUnit: 'horas' | 'minutos';
    }) => {
      // Cancela qualquer salvamento agendado anteriormente
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Não tenta salvar se o registro ainda não existir no banco
      if (!prefId) return;

      // Impede gravar intervalo inválido no banco
      const validationMsg = validateInterval(nextValues.notificationInterval, nextValues.intervalUnit);
      if (validationMsg) {
        setIntervalError(validationMsg);
        return;
      }

      setAutoSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            push_enabled: nextValues.pushEnabled,
            notify_before_hours: nextValues.notifyBeforeHours,
            notification_interval_hours: nextValues.notificationInterval,
            unity_time: nextValues.intervalUnit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prefId);

        if (error) throw error;
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('error');
        showAlert('Erro', 'Não foi possível salvar a alteração automaticamente.');
      }
    },
    [prefId, validateInterval]
  );

  // Agenda auto-save com debounce de 500ms para controles numéricos e steppers
  const scheduleAutoSave = useCallback(
    (nextValues: {
      pushEnabled: boolean;
      notifyBeforeHours: number;
      notificationInterval: number;
      intervalUnit: 'horas' | 'minutos';
    }) => {
      // Limpa debounce anterior antes de criar o novo
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Valida antes mesmo de agendar para feedback imediato
      const validationMsg = validateInterval(nextValues.notificationInterval, nextValues.intervalUnit);
      if (validationMsg) {
        setIntervalError(validationMsg);
        return;
      }
      setAutoSaveStatus('saving');
      saveTimerRef.current = setTimeout(() => {
        persistPreferences(nextValues);
      }, 500);
    },
    [persistPreferences, validateInterval]
  );

  // Alterna alertas push globais e salva imediatamente
  const handleTogglePush = (value: boolean) => {
    setPushEnabled(value);
    persistPreferences({
      pushEnabled: value,
      notifyBeforeHours,
      notificationInterval,
      intervalUnit,
    });
  };

  // Ajusta antecedência em horas respeitando o intervalo 1..72h e salva com debounce
  const handleChangeBeforeHours = (nextHours: number) => {
    const clamped = Math.max(1, Math.min(72, nextHours));
    setNotifyBeforeHours(clamped);
    scheduleAutoSave({
      pushEnabled,
      notifyBeforeHours: clamped,
      notificationInterval,
      intervalUnit,
    });
  };

  // Atualiza texto e validação do campo de intervalo de repetição
  const handleIntervalTextChange = (raw: string) => {
    // Mantém apenas dígitos numéricos
    const digits = raw.replace(/[^0-9]/g, '');
    setIntervalText(digits);

    // Se o campo estiver vazio durante a digitação, orienta o usuário sem salvar zero
    if (digits.length === 0) {
      setIntervalError(
        intervalUnit === 'minutos'
          ? 'Em minutos, informe um valor entre 15 e 1440.'
          : 'Em horas, informe um valor entre 1 e 168.'
      );
      return;
    }

    const parsed = Number(digits);
    const validationMsg = validateInterval(parsed, intervalUnit);
    setIntervalError(validationMsg);

    // Só atualiza o valor persistido e dispara auto-save quando válido
    if (!validationMsg) {
      setNotificationInterval(parsed);
      scheduleAutoSave({
        pushEnabled,
        notifyBeforeHours,
        notificationInterval: parsed,
        intervalUnit,
      });
    }
  };

  // Troca a unidade do intervalo ajustando automaticamente valores abaixo do mínimo (ex: 2h -> 15min)
  const handleChangeIntervalUnit = (nextUnit: 'horas' | 'minutos') => {
    if (nextUnit === intervalUnit) return;
    setIntervalUnit(nextUnit);

    let nextValue = Number(intervalText) || notificationInterval;
    // Se mudou para minutos e estava menor que 15, ajusta para o mínimo seguro de 15 minutos
    if (nextUnit === 'minutos' && nextValue < 15) {
      nextValue = 15;
    // Se mudou para horas e excede 168h, ajusta para o limite de 168h
    } else if (nextUnit === 'horas' && nextValue > 168) {
      nextValue = 168;
    } else if (nextUnit === 'horas' && nextValue < 1) {
      nextValue = 1;
    }

    setNotificationInterval(nextValue);
    setIntervalText(String(nextValue));
    setIntervalError(null);
    persistPreferences({
      pushEnabled,
      notifyBeforeHours,
      notificationInterval: nextValue,
      intervalUnit: nextUnit,
    });
  };

  // Cria uma nova regra personalizada de disparo no Supabase com validação completa
  const handleAddRule = async () => {
    // Valida preenchimento dos campos de texto
    if (!newRuleTitle.trim() || !newRuleMessage.trim()) {
      showAlert('Campos obrigatórios', 'Preencha o título e a mensagem da regra.');
      return;
    }

    // Valida tempo mínimo de disparo antes do prazo
    const parsedTrigger = Number(triggerVal);
    if (!Number.isFinite(parsedTrigger) || parsedTrigger < 1) {
      showAlert('Tempo inválido', 'Informe um tempo de disparo de pelo menos 1.');
      return;
    }

    // Valida recorrência quando diferente de zero para evitar spam de notificações
    const parsedRecurrence = Number(recurrenceVal) || 0;
    if (parsedRecurrence < 0) {
      showAlert('Repetição inválida', 'A repetição não pode ser negativa.');
      return;
    }
    if (parsedRecurrence > 0 && recurrenceUnit === 'minutes' && parsedRecurrence < 15) {
      showAlert('Repetição muito curta', 'Quando a repetição for em minutos, informe pelo menos 15 minutos.');
      return;
    }

    setAddingRule(true);
    try {
      // Insere a nova regra e retorna o registro criado
      const { data, error } = await supabase
        .from('notification_rules')
        .insert([
          {
            title: newRuleTitle.trim(),
            custom_message: newRuleMessage.trim(),
            trigger_time_value: parsedTrigger,
            trigger_time_unit: triggerUnit,
            recurrence_time_value: parsedRecurrence,
            recurrence_time_unit: recurrenceUnit,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Atualiza lista local e reseta o formulário
      setRules((prev) => [data as NotificationRule, ...prev]);
      setNewRuleTitle('');
      setNewRuleMessage('');
      setTriggerVal('24');
      setRecurrenceVal('0');
      setShowNewRuleForm(false);
      showAlert('Sucesso', 'Regra criada com sucesso.');
    } catch (err) {
      console.error(err);
      showAlert('Erro', 'Não foi possível criar a regra. Tente novamente.');
    } finally {
      setAddingRule(false);
    }
  };

  // Ativa ou desativa uma regra existente no banco com feedback caso ocorra falha
  const toggleRule = async (id: string, current: boolean) => {
    // Atualiza otimisticamente para resposta rápida e reverte se falhar
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)));
    const { error } = await supabase.from('notification_rules').update({ is_active: !current }).eq('id', id);
    if (error) {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: current } : r)));
      showAlert('Erro', 'Não foi possível atualizar o status da regra.');
    }
  };

  // Solicita confirmação multiplataforma antes de apagar uma regra e trata erro se falhar
  const deleteRule = (id: string) => {
    showConfirm(
      'Remover regra',
      'Tem certeza que deseja apagar essa regra?',
      async () => {
        const { error } = await supabase.from('notification_rules').delete().eq('id', id);
        if (error) {
          showAlert('Erro', 'Não foi possível remover a regra. Tente novamente.');
          return;
        }
        setRules((prev) => prev.filter((r) => r.id !== id));
      },
      'Apagar'
    );
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Cabeçalho institucional com título específico da tela */}
      <Header title="Lembretes" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          // Estado inicial de carregamento das preferências reais
          <View className="flex-1 items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#195e38" />
            <Text className="mt-4 text-on-surface-variant font-medium">Carregando lembretes...</Text>
          </View>
        ) : loadError ? (
          // Estado de erro amigável com opção de tentar novamente
          <View className="flex-1 items-center justify-center px-6 mt-20">
            <MaterialIcons name="error-outline" size={40} color="#ba1a1a" />
            <Text className="text-error mt-4 font-bold text-center">{loadError}</Text>
            <TouchableOpacity
              onPress={fetchPreferences}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar lembretes novamente"
              className="mt-4 px-5 py-3 bg-primary-container rounded-xl active:bg-primary"
            >
              <Text className="text-on-primary font-bold text-sm">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4 flex-col gap-5 pt-5">
            {/* Seção de configurações globais com salvamento automático */}
            <View className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container flex-col gap-4">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="notifications-active" size={22} color="#004525" />
                  <Text className="text-base text-on-surface font-semibold">Configurações de alerta</Text>
                </View>

                {/* Indicador discreto do status do auto-save */}
                {autoSaveStatus !== 'idle' && (
                  <View
                    className={`px-2.5 py-1 rounded-full ${
                      autoSaveStatus === 'error'
                        ? 'bg-error-container'
                        : autoSaveStatus === 'saved'
                        ? 'bg-secondary-container'
                        : 'bg-surface-container-high'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        autoSaveStatus === 'error'
                          ? 'text-on-error-container'
                          : autoSaveStatus === 'saved'
                          ? 'text-on-secondary-fixed-variant'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {autoSaveStatus === 'saving'
                        ? 'Salvando...'
                        : autoSaveStatus === 'saved'
                        ? 'Salvo'
                        : 'Erro ao salvar'}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-col gap-2.5">
                {/* Switch geral de alertas via push */}
                <View className="flex-row items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm text-on-surface font-semibold">Alertas de prazos</Text>
                    <Text className="text-xs text-on-surface-variant">Notificar tarefas ativas via push</Text>
                  </View>
                  <Switch
                    value={pushEnabled}
                    onValueChange={handleTogglePush}
                    accessibilityLabel="Ativar alertas de prazos via push"
                    trackColor={{ false: '#cedbd1', true: '#195e38' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Controle de antecedência em horas com botões >= 44px */}
                <View className="flex-row items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm text-on-surface font-semibold">Antecedência do alerta</Text>
                    <Text className="text-xs text-on-surface-variant">
                      Avisar {notifyBeforeHours} {notifyBeforeHours === 1 ? 'hora' : 'horas'} antes do encerramento
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <TouchableOpacity
                      onPress={() => handleChangeBeforeHours(notifyBeforeHours - 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Diminuir horas de antecedência"
                      className="w-11 h-11 bg-surface-container items-center justify-center rounded-full active:bg-surface-container-high"
                    >
                      <MaterialIcons name="remove" size={18} color="#141d17" />
                    </TouchableOpacity>
                    <Text className="font-bold w-7 text-center text-on-surface">{notifyBeforeHours}</Text>
                    <TouchableOpacity
                      onPress={() => handleChangeBeforeHours(notifyBeforeHours + 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Aumentar horas de antecedência"
                      className="w-11 h-11 bg-surface-container items-center justify-center rounded-full active:bg-surface-container-high"
                    >
                      <MaterialIcons name="add" size={18} color="#141d17" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Controle do intervalo de repetição com validação de limite mínimo */}
                <View className="p-3 bg-surface-container-low rounded-lg">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-sm text-on-surface font-semibold">Repetição</Text>
                      <Text className="text-xs text-on-surface-variant">
                        {intervalUnit === 'minutos' ? 'Mínimo de 15 minutos' : 'Lembrar novamente a cada'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <TextInput
                        value={intervalText}
                        onChangeText={handleIntervalTextChange}
                        keyboardType="number-pad"
                        maxLength={4}
                        accessibilityLabel="Intervalo numérico de repetição"
                        className={`w-12 h-11 bg-surface-container rounded-md text-center font-bold text-on-surface ${
                          intervalError ? 'border border-error' : ''
                        }`}
                      />
                      <View className="ml-1 h-11 bg-surface-container rounded-lg p-1 flex-row items-center">
                        <TouchableOpacity
                          onPress={() => handleChangeIntervalUnit('horas')}
                          accessibilityRole="button"
                          accessibilityLabel="Repetição em horas"
                          accessibilityState={{ selected: intervalUnit === 'horas' }}
                          className={`px-2.5 h-full justify-center rounded-md ${
                            intervalUnit === 'horas' ? 'bg-primary-container' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              intervalUnit === 'horas' ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Horas
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleChangeIntervalUnit('minutos')}
                          accessibilityRole="button"
                          accessibilityLabel="Repetição em minutos"
                          accessibilityState={{ selected: intervalUnit === 'minutos' }}
                          className={`px-2.5 h-full justify-center rounded-md ${
                            intervalUnit === 'minutos' ? 'bg-primary-container' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              intervalUnit === 'minutos' ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Min
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Mensagem de erro inline quando o valor estiver fora do intervalo permitido */}
                  {intervalError && (
                    <Text className="text-xs font-semibold text-error mt-2">{intervalError}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Seção de regras personalizadas */}
            <View className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container flex-col gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="rule" size={22} color="#004525" />
                  <Text className="text-base text-on-surface font-semibold">Regras personalizadas</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowNewRuleForm(!showNewRuleForm)}
                  accessibilityRole="button"
                  accessibilityLabel={showNewRuleForm ? 'Cancelar criação de regra' : 'Criar nova regra de lembrete'}
                  className="bg-primary-container px-3 min-h-[44px] rounded-lg flex-row items-center gap-1 active:bg-primary"
                >
                  <MaterialIcons name={showNewRuleForm ? 'close' : 'add'} size={16} color="#ffffff" />
                  <Text className="text-on-primary font-semibold text-xs">
                    {showNewRuleForm ? 'Cancelar' : 'Nova regra'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Formulário expansível para criar uma nova regra com rótulos claros e acessíveis */}
              {showNewRuleForm && (
                <View className="bg-surface-container-low p-3 rounded-lg gap-3">
                  <Text className="font-bold text-sm text-on-surface">Criar nova regra</Text>

                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-on-surface-variant">Título da regra</Text>
                    <TextInput
                      value={newRuleTitle}
                      onChangeText={setNewRuleTitle}
                      placeholder="Ex: Aviso 24h antes"
                      accessibilityLabel="Título da regra"
                      className="bg-surface-container h-11 px-3 rounded-md text-sm text-on-surface"
                      placeholderTextColor="#707971"
                    />
                  </View>

                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-on-surface-variant">Mensagem personalizada</Text>
                    <TextInput
                      value={newRuleMessage}
                      onChangeText={setNewRuleMessage}
                      placeholder="Ex: Sua tarefa está acabando!"
                      accessibilityLabel="Mensagem personalizada da regra"
                      className="bg-surface-container h-11 px-3 rounded-md text-sm text-on-surface"
                      placeholderTextColor="#707971"
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Avisar quanto tempo antes</Text>
                      <TextInput
                        value={triggerVal}
                        onChangeText={(v) => setTriggerVal(v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        accessibilityLabel="Quantidade de tempo antes do prazo para disparo"
                        className="bg-surface-container h-11 px-3 rounded-md text-sm text-on-surface"
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Unidade do aviso</Text>
                      <View className="flex-row bg-surface-container h-11 rounded-md p-1">
                        <TouchableOpacity
                          onPress={() => setTriggerUnit('hours')}
                          accessibilityRole="button"
                          accessibilityLabel="Disparo em horas"
                          accessibilityState={{ selected: triggerUnit === 'hours' }}
                          className={`flex-1 justify-center items-center rounded ${
                            triggerUnit === 'hours' ? 'bg-primary-container' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              triggerUnit === 'hours' ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Horas
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setTriggerUnit('minutes')}
                          accessibilityRole="button"
                          accessibilityLabel="Disparo em minutos"
                          accessibilityState={{ selected: triggerUnit === 'minutes' }}
                          className={`flex-1 justify-center items-center rounded ${
                            triggerUnit === 'minutes' ? 'bg-primary-container' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              triggerUnit === 'minutes' ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Min
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Repetir a cada (0 = não repetir)</Text>
                      <TextInput
                        value={recurrenceVal}
                        onChangeText={(v) => setRecurrenceVal(v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        accessibilityLabel="Intervalo de repetição da regra (0 para não repetir)"
                        className="bg-surface-container h-11 px-3 rounded-md text-sm text-on-surface"
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Unidade da repetição</Text>
                      <View className="flex-row bg-surface-container h-11 rounded-md p-1">
                        <TouchableOpacity
                          onPress={() => setRecurrenceUnit('hours')}
                          accessibilityRole="button"
                          accessibilityLabel="Repetição da regra em horas"
                          accessibilityState={{ selected: recurrenceUnit === 'hours' }}
                          className={`flex-1 justify-center items-center rounded ${
                            recurrenceUnit === 'hours' ? 'bg-primary-container' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              recurrenceUnit === 'hours' ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Horas
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setRecurrenceUnit('minutes')}
                          accessibilityRole="button"
                          accessibilityLabel="Repetição da regra em minutos"
                          accessibilityState={{ selected: recurrenceUnit === 'minutes' }}
                          className={`flex-1 justify-center items-center rounded ${
                            recurrenceUnit === 'minutes' ? 'bg-primary-container' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              recurrenceUnit === 'minutes' ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            Min
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleAddRule}
                    disabled={addingRule}
                    accessibilityRole="button"
                    accessibilityLabel="Adicionar regra personalizada"
                    className={`bg-primary-container h-11 rounded-md items-center justify-center mt-2 active:bg-primary ${
                      addingRule ? 'opacity-70' : ''
                    }`}
                  >
                    <Text className="text-on-primary font-bold text-sm">
                      {addingRule ? 'Criando...' : 'Adicionar regra'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Lista de regras cadastradas ou aviso de vazio */}
              {rules.length === 0 ? (
                <Text className="text-sm text-on-surface-variant text-center py-2">
                  Nenhuma regra personalizada ativa.
                </Text>
              ) : (
                <View className="gap-2">
                  {rules.map((rule) => (
                    <View
                      key={rule.id}
                      className={`flex-col p-3 rounded-lg border border-outline-variant/30 ${
                        rule.is_active ? 'bg-surface-container-low' : 'bg-surface-container-lowest opacity-75'
                      }`}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 pr-2">
                          <Text className="font-bold text-sm text-on-surface">{rule.title}</Text>
                          <Text className="text-xs text-on-surface-variant mt-0.5">
                            Disparo: {rule.trigger_time_value}{' '}
                            {rule.trigger_time_unit === 'hours' ? 'horas' : 'minutos'} antes
                          </Text>
                          {rule.recurrence_time_value > 0 && (
                            <Text className="text-xs text-primary font-semibold">
                              Repete a cada {rule.recurrence_time_value}{' '}
                              {rule.recurrence_time_unit === 'hours' ? 'horas' : 'minutos'}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Switch
                            value={rule.is_active}
                            onValueChange={() => toggleRule(rule.id, rule.is_active)}
                            accessibilityLabel={`Alternar regra ${rule.title}`}
                            trackColor={{ false: '#cedbd1', true: '#195e38' }}
                            thumbColor="#ffffff"
                          />
                          <TouchableOpacity
                            onPress={() => deleteRule(rule.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Apagar regra ${rule.title}`}
                            className="w-11 h-11 items-center justify-center active:bg-error-container rounded-full"
                          >
                            <MaterialIcons name="delete-outline" size={20} color="#ba1a1a" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View className="mt-2 bg-surface-container p-2 rounded">
                        <Text className="text-xs italic text-on-surface-variant">{`"${rule.custom_message}"`}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Barra de navegação inferior com aba Lembretes ativa */}
      <BottomNavbar activeTab="notificacoes" />
    </View>
  );
}
