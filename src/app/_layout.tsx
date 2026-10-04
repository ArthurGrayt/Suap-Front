import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useEffect } from 'react';

export default function RootLayout() {
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    // Aqui no futuro você pode enviar o expoPushToken para a API (Supabase)
    if (expoPushToken) {
      console.log("Token de Notificação (Expo):", expoPushToken);
    }
  }, [expoPushToken]);

  return (
    // Fundo da tela inteira (cinza claro em telas grandes)
    <View className="flex-1 bg-surface-container-low sm:items-center sm:justify-center">
      {/* Wrapper que simula o celular em telas grandes (sm: e superiores) */}
      <View className="w-full h-full bg-surface sm:max-w-[400px] sm:max-h-[850px] sm:h-[95vh] sm:rounded-[3rem] sm:overflow-hidden sm:shadow-2xl sm:border-[8px] sm:border-surface-container-highest relative">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
