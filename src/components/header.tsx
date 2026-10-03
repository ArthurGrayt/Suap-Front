import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import NotificationPanel from './notification-panel';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showProfileInfo?: boolean;
}

export default function Header({ 
  title = "Central de Atividades", 
  showBackButton = false,
  showProfileInfo = false 
}: HeaderProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (showProfileInfo) {
      const fetchName = async () => {
        const { data } = await supabase.from('user_preferences').select('full_name').limit(1).single();
        if (data?.full_name) {
          setFirstName(data.full_name.split(' ')[0]);
        }
      };
      fetchName();
    }
  }, [showProfileInfo]);

  return (
    <View style={{ zIndex: 9999, elevation: 9999 }} className="relative h-16 px-4 flex-row items-center justify-between bg-primary-container/95 border-b border-surface-container">
      <View className="flex-row items-center">
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()} className="mr-3 active:opacity-70">
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        {!showBackButton && (
          <>
            <Text className="text-on-primary font-bold text-lg lowercase tracking-tight">suap</Text>
            <View className="h-4 w-px bg-on-primary/30 mx-2" />
          </>
        )}
        <Text className={`font-medium ${showBackButton ? 'text-lg text-on-primary font-bold' : 'text-sm text-on-primary-container'}`}>
          {title}
        </Text>
      </View>

      {!showBackButton && (
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{ backgroundColor: isNotificationsOpen ? '#ffffff' : 'transparent' }}
            className={`w-10 h-10 items-center justify-center rounded-full relative ${!isNotificationsOpen ? 'active:bg-white/10' : ''}`}
          >
            <MaterialIcons 
              name="notifications" 
              size={22} 
              color={isNotificationsOpen ? "#195e38" : "#ffffff"} 
            />
            {!isNotificationsOpen && (
              <View className="absolute top-2 right-2 w-2 h-2 rounded-full border border-primary-container" style={{ backgroundColor: '#ba1a1a' }} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {isNotificationsOpen && (
        <NotificationPanel onClose={() => setIsNotificationsOpen(false)} />
      )}
    </View>
  );
}
