import '../global.css';
// Importa o Stack do expo-router para gerenciar a navegação em pilha
import { Stack } from 'expo-router';
// Importa o StatusBar do expo para controlar a barra de status do dispositivo
import { StatusBar } from 'expo-status-bar';
// Importa o componente View do react-native para estruturar o layout
import { View } from 'react-native';
// Importa o hook customizado de notificações push
import { usePushNotifications } from '../hooks/usePushNotifications';
// Importa o cliente Supabase configurado
import { supabase } from '../lib/supabase';
// Importa o hook useEffect do React
import { useEffect } from 'react';
// Importa o hook useFonts do expo-font para pré-carregar fontes customizadas e de ícones
import { useFonts } from 'expo-font';
// Importa o conjunto de ícones MaterialIcons para obter sua definição de fonte
import { MaterialIcons } from '@expo/vector-icons';
// Importa o provedor de estado global do Modo PRO
import { PremiumProvider } from '../contexts/PremiumContext';
// Importa o modal global de simulação de pagamento (Paywall)
import PremiumModal from '../components/PremiumModal';

// Componente raiz que envolve todas as rotas da aplicação
export default function RootLayout() {
  // Pré-carrega a fonte do MaterialIcons garantindo que os ícones funcionem na web e no mobile
  const [fontsLoaded] = useFonts(MaterialIcons.font);
  // Obtém o token de notificação push do dispositivo
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken) {
      const saveToken = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .update({ expo_push_token: expoPushToken })
            .eq('id', user.id);
        }
      };
      saveToken();
    }
  }, [expoPushToken]);

  return (
    // Envolve toda a aplicação com o contexto global do Modo PRO
    <PremiumProvider>
      {/* Fundo da tela inteira (cinza claro em telas grandes) */}
      <View className="flex-1 bg-surface-container-low sm:items-center sm:justify-center">
        {/* Wrapper que simula o celular em telas grandes (sm: e superiores) */}
        <View className="w-full h-full bg-surface sm:max-w-[400px] sm:max-h-[850px] sm:h-[95vh] sm:rounded-[3rem] sm:overflow-hidden sm:shadow-2xl sm:border-[8px] sm:border-surface-container-highest relative">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        {/* Modal global do Paywall controlado pelo PremiumContext */}
        <PremiumModal />
        {/* Mantém ícones da barra de status claros sobre o cabeçalho verde escuro */}
        <StatusBar style="light" />
      </View>
    </PremiumProvider>
  );
}
