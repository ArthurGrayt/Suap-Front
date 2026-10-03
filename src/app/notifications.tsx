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

  return (
    <View className="flex-1 bg-surface">
      <Header showProfileInfo={true} />

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
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

      {/* FIXED BOTTOM NAVBAR */}
      <View className="absolute bottom-0 w-full">
        <BottomNavbar activeTab="notificacoes" />
      </View>
    </View>
  );
}
