import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BottomNavbarProps {
  activeTab?: string;
}

export default function BottomNavbar({ activeTab = 'prazos' }: BottomNavbarProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center h-16 bg-surface-container-lowest/90 border-t border-surface-container pb-2">
      
      {/* Aba: Prazos */}
      <TouchableOpacity 
        onPress={() => router.push('/')}
        className={`flex-1 items-center justify-center mt-2 ${activeTab !== 'prazos' ? 'opacity-60' : ''}`}
      >
        <MaterialIcons 
          name="event-available" 
          size={24} 
          color={activeTab === 'prazos' ? "#195e38" : "#404941"} 
        />
        <Text 
          className={`text-[10px] font-bold mt-1 ${activeTab === 'prazos' ? 'text-primary-container' : 'text-on-surface-variant'}`}
        >
          Prazos
        </Text>
      </TouchableOpacity>

      {/* Aba: Perfil */}
      <TouchableOpacity 
        onPress={() => router.push('/profile')}
        className={`flex-1 items-center justify-center mt-2 ${activeTab !== 'perfil' ? 'opacity-60' : ''}`}
      >
        <MaterialIcons 
          name="person" 
          size={24} 
          color={activeTab === 'perfil' ? "#195e38" : "#404941"} 
        />
        <Text 
          className={`text-[10px] font-bold mt-1 ${activeTab === 'perfil' ? 'text-primary-container' : 'text-on-surface-variant'}`}
        >
          Perfil
        </Text>
      </TouchableOpacity>

      {/* Aba: Notificações */}
      <TouchableOpacity 
        onPress={() => router.push('/notifications')}
        className={`flex-1 items-center justify-center mt-2 ${activeTab !== 'notificacoes' ? 'opacity-60' : ''}`}
      >
        <MaterialIcons 
          name="notifications" 
          size={24} 
          color={activeTab === 'notificacoes' ? "#195e38" : "#404941"} 
        />
        <Text 
          className={`text-[10px] font-bold mt-1 ${activeTab === 'notificacoes' ? 'text-primary-container' : 'text-on-surface-variant'}`}
        >
          Notificações
        </Text>
      </TouchableOpacity>

    </View>
  );
}
