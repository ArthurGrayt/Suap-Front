import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNavbar from '@/components/bottom-navbar';
import Header from '@/components/header';
import { supabase } from '@/lib/supabase';

export default function NotificationsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State para preferências
  const [pushEnabled, setPushEnabled] = useState(true);
  const [notifyBeforeHours, setNotifyBeforeHours] = useState(24);
  const [notificationInterval, setNotificationInterval] = useState(2);
  const [intervalUnit, setIntervalUnit] = useState<'horas' | 'minutos'>('horas');
  const [prefId, setPrefId] = useState<string | null>(null);

  // State para Regras Personalizadas
  const [rules, setRules] = useState<any[]>([]);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleMessage, setNewRuleMessage] = useState('');
  const [triggerVal, setTriggerVal] = useState('24');
  const [triggerUnit, setTriggerUnit] = useState('hours');
  const [recurrenceVal, setRecurrenceVal] = useState('0');
  const [recurrenceUnit, setRecurrenceUnit] = useState('hours');
  const [addingRule, setAddingRule] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase.from('user_preferences').select('*').limit(1).single();
        if (data) {
          setPrefId(data.id);
          setPushEnabled(data.push_enabled ?? true);
          setNotifyBeforeHours(data.notify_before_hours ?? 24);
          setNotificationInterval(data.notification_interval_hours ?? 2);
          setIntervalUnit(data.unity_time || 'horas');
        }
        
        const { data: rulesData } = await supabase.from('notification_rules').select('*').order('created_at', { ascending: false });
        if (rulesData) setRules(rulesData);
      } catch (err) {
        console.error("Erro ao buscar preferências", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    if (!prefId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          push_enabled: pushEnabled,
          notify_before_hours: notifyBeforeHours,
          notification_interval_hours: notificationInterval,
          unity_time: intervalUnit,
          updated_at: new Date().toISOString()
        })
        .eq('id', prefId);
        
      if (error) throw error;
      Alert.alert("Sucesso", "Preferências salvas com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRuleTitle.trim() || !newRuleMessage.trim()) {
      Alert.alert('Erro', 'Preencha o título e a mensagem da regra.');
      return;
    }
    setAddingRule(true);
    try {
      const { data, error } = await supabase.from('notification_rules').insert([{
        title: newRuleTitle,
        custom_message: newRuleMessage,
        trigger_time_value: Number(triggerVal) || 0,
        trigger_time_unit: triggerUnit,
        recurrence_time_value: Number(recurrenceVal) || 0,
        recurrence_time_unit: recurrenceUnit
      }]).select().single();
      
      if (error) throw error;
      setRules([data, ...rules]);
      setNewRuleTitle('');
      setNewRuleMessage('');
      setTriggerVal('24');
      setRecurrenceVal('0');
      setShowNewRuleForm(false);
      Alert.alert('Sucesso', 'Regra criada!');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível criar a regra.');
    } finally {
      setAddingRule(false);
    }
  };

  const toggleRule = async (id: string, current: boolean) => {
    const { error } = await supabase.from('notification_rules').update({ is_active: !current }).eq('id', id);
    if (!error) {
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !current } : r));
    }
  };

  const deleteRule = async (id: string) => {
    Alert.alert('Remover regra', 'Tem certeza que deseja apagar essa regra?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('notification_rules').delete().eq('id', id);
          if (!error) setRules(rules.filter(r => r.id !== id));
      }}
    ]);
  };

  return (
    <View className="flex-1 bg-surface">
      <Header showProfileInfo={true} />

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#195e38" />
            <Text className="mt-4 text-on-surface-variant font-medium">Carregando preferências...</Text>
          </View>
        ) : (
          <View className="px-4 flex-col gap-6 pt-6">
            
            <View className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex-col gap-4">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="notifications-active" size={22} color="#004525" />
                <Text className="text-base text-on-surface font-semibold">Configurações de Alerta</Text>
              </View>

              <View className="flex-col gap-2">
                <View className="flex-row items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm text-on-surface font-semibold">Alertas de Prazos</Text>
                    <Text className="text-xs text-on-surface-variant">Notificar tarefas ativas via push</Text>
                  </View>
                  <Switch 
                    value={pushEnabled} 
                    onValueChange={setPushEnabled} 
                    trackColor={{ false: '#d8e3fb', true: '#195e38' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View className="flex-row items-center justify-between p-3 bg-surface-container-low rounded-lg opacity-90">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm text-on-surface font-semibold">Antecedência do Alerta</Text>
                    <Text className="text-xs text-on-surface-variant">Avisar {notifyBeforeHours} horas antes do encerramento</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <TouchableOpacity 
                      onPress={() => setNotifyBeforeHours(Math.max(1, notifyBeforeHours - 1))}
                      className="w-8 h-8 bg-surface-container items-center justify-center rounded-full"
                    >
                      <MaterialIcons name="remove" size={16} color="#111c2d" />
                    </TouchableOpacity>
                    <Text className="font-bold w-6 text-center text-on-surface">{notifyBeforeHours}</Text>
                    <TouchableOpacity 
                      onPress={() => setNotifyBeforeHours(Math.min(72, notifyBeforeHours + 1))}
                      className="w-8 h-8 bg-surface-container items-center justify-center rounded-full"
                    >
                      <MaterialIcons name="add" size={16} color="#111c2d" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row items-center justify-between p-3 bg-surface-container-low rounded-lg opacity-90 mt-1">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm text-on-surface font-semibold">Repetição</Text>
                    <Text className="text-xs text-on-surface-variant">Lembrar novamente a cada</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <TextInput 
                      value={String(notificationInterval)}
                      onChangeText={(val) => setNotificationInterval(Number(val.replace(/[^0-9]/g, '')) || 0)}
                      keyboardType="number-pad"
                      className="w-10 h-8 bg-surface-container rounded-md text-center font-bold text-on-surface"
                    />
                    <View className="ml-1 h-8 bg-surface-container rounded-lg p-0.5 flex-row items-center">
                      <TouchableOpacity 
                        onPress={() => setIntervalUnit('horas')}
                        className={`px-2 h-full justify-center rounded-md ${intervalUnit === 'horas' ? 'bg-[#195e38]' : ''}`}
                      >
                        <Text className={`text-[10px] font-bold uppercase ${intervalUnit === 'horas' ? 'text-white' : 'text-on-surface-variant'}`}>Hrs</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setIntervalUnit('minutos')}
                        className={`px-2 h-full justify-center rounded-md ${intervalUnit === 'minutos' ? 'bg-[#195e38]' : ''}`}
                      >
                        <Text className={`text-[10px] font-bold uppercase ${intervalUnit === 'minutos' ? 'text-white' : 'text-on-surface-variant'}`}>Min</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* REGRAS PERSONALIZADAS */}
            <View className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex-col gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="rule" size={22} color="#004525" />
                  <Text className="text-base text-on-surface font-semibold">Regras Personalizadas</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNewRuleForm(!showNewRuleForm)} className="bg-primary-container px-3 py-1.5 rounded-lg flex-row items-center gap-1 active:bg-primary/20">
                  <MaterialIcons name={showNewRuleForm ? "close" : "add"} size={16} color="#004525" />
                  <Text className="text-[#004525] font-semibold text-xs">{showNewRuleForm ? "Cancelar" : "Nova Regra"}</Text>
                </TouchableOpacity>
              </View>

              {showNewRuleForm && (
                <View className="bg-surface-container-low p-3 rounded-lg gap-3">
                  <Text className="font-bold text-sm text-on-surface">Criar nova regra</Text>
                  
                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-on-surface-variant">Título da Regra</Text>
                    <TextInput value={newRuleTitle} onChangeText={setNewRuleTitle} placeholder="Ex: Aviso 24h antes" className="bg-surface-container h-10 px-3 rounded-md text-sm text-on-surface" placeholderTextColor="#707971" />
                  </View>
                  
                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-on-surface-variant">Mensagem Personalizada</Text>
                    <TextInput value={newRuleMessage} onChangeText={setNewRuleMessage} placeholder="Ex: Sua tarefa está acabando!" className="bg-surface-container h-10 px-3 rounded-md text-sm text-on-surface" placeholderTextColor="#707971" />
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Disparo (Tempo)</Text>
                      <TextInput value={triggerVal} onChangeText={setTriggerVal} keyboardType="number-pad" className="bg-surface-container h-10 px-3 rounded-md text-sm text-on-surface" />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Disparo (Unidade)</Text>
                      <View className="flex-row bg-surface-container h-10 rounded-md p-1">
                        <TouchableOpacity onPress={() => setTriggerUnit('hours')} className={`flex-1 justify-center items-center rounded ${triggerUnit === 'hours' ? 'bg-[#195e38]' : ''}`}>
                          <Text className={`text-[10px] font-bold ${triggerUnit === 'hours' ? 'text-white' : 'text-on-surface-variant'}`}>Hrs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setTriggerUnit('minutes')} className={`flex-1 justify-center items-center rounded ${triggerUnit === 'minutes' ? 'bg-[#195e38]' : ''}`}>
                          <Text className={`text-[10px] font-bold ${triggerUnit === 'minutes' ? 'text-white' : 'text-on-surface-variant'}`}>Min</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Recor. (0 = Sem)</Text>
                      <TextInput value={recurrenceVal} onChangeText={setRecurrenceVal} keyboardType="number-pad" className="bg-surface-container h-10 px-3 rounded-md text-sm text-on-surface" />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">Recor. (Unidade)</Text>
                      <View className="flex-row bg-surface-container h-10 rounded-md p-1">
                        <TouchableOpacity onPress={() => setRecurrenceUnit('hours')} className={`flex-1 justify-center items-center rounded ${recurrenceUnit === 'hours' ? 'bg-[#195e38]' : ''}`}>
                          <Text className={`text-[10px] font-bold ${recurrenceUnit === 'hours' ? 'text-white' : 'text-on-surface-variant'}`}>Hrs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setRecurrenceUnit('minutes')} className={`flex-1 justify-center items-center rounded ${recurrenceUnit === 'minutes' ? 'bg-[#195e38]' : ''}`}>
                          <Text className={`text-[10px] font-bold ${recurrenceUnit === 'minutes' ? 'text-white' : 'text-on-surface-variant'}`}>Min</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity onPress={handleAddRule} disabled={addingRule} className={`bg-[#195e38] h-10 rounded-md items-center justify-center mt-2 ${addingRule ? 'opacity-70' : ''}`}>
                    <Text className="text-white font-bold text-sm">{addingRule ? 'Criando...' : 'Adicionar Regra'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {rules.length === 0 ? (
                <Text className="text-sm text-on-surface-variant text-center py-2">Nenhuma regra personalizada ativa.</Text>
              ) : (
                <View className="gap-2">
                  {rules.map(rule => (
                    <View key={rule.id} className={`flex-col p-3 rounded-lg border border-outline-variant/30 ${rule.is_active ? 'bg-surface-container-low' : 'bg-surface-container-lowest opacity-60'}`}>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 pr-2">
                          <Text className="font-bold text-sm text-on-surface">{rule.title}</Text>
                          <Text className="text-xs text-on-surface-variant mt-0.5">Disparo: {rule.trigger_time_value} {rule.trigger_time_unit === 'hours' ? 'horas' : 'minutos'} antes</Text>
                          {rule.recurrence_time_value > 0 && (
                            <Text className="text-xs text-[#005785]">Repete a cada {rule.recurrence_time_value} {rule.recurrence_time_unit === 'hours' ? 'horas' : 'minutos'}</Text>
                          )}
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Switch 
                            value={rule.is_active} 
                            onValueChange={() => toggleRule(rule.id, rule.is_active)}
                            trackColor={{ false: '#d8e3fb', true: '#195e38' }}
                            thumbColor="#ffffff"
                          />
                          <TouchableOpacity onPress={() => deleteRule(rule.id)} className="p-1.5 active:bg-error-container rounded-full">
                            <MaterialIcons name="delete-outline" size={20} color="#ba1a1a" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View className="mt-2 bg-surface-container p-2 rounded">
                        <Text className="text-xs italic text-on-surface-variant">"{rule.custom_message}"</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* BOTÃO DE SALVAR */}
            <View className="flex-col gap-3 mt-4">
              <TouchableOpacity 
                onPress={handleSave}
                disabled={saving}
                className={`w-full h-12 bg-primary-container rounded-lg flex-row items-center justify-center shadow-md active:bg-primary ${saving ? 'opacity-70' : ''}`}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="save" size={20} color="#ffffff" />
                )}
                <Text className="text-on-primary font-bold text-sm ml-2">
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Text>
              </TouchableOpacity>
            </View>
            
          </View>
        )}
      </ScrollView>

      {/* BOTTOM NAVBAR no fluxo: o scroll termina acima dela e dos botões do sistema */}
      <BottomNavbar activeTab="notificacoes" />
    </View>
  );
}
