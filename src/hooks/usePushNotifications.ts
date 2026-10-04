import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type * as NotificationsType from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Detecta se está rodando dentro do Expo Go (push remoto não é suportado nele)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Carrega o módulo só fora do Expo Go, evitando erro fatal no import (require dinâmico)
const Notifications: typeof NotificationsType | null = isExpoGo
  ? null
  : (require('expo-notifications') as typeof NotificationsType);

// Configuração base para como as notificações devem se comportar quando o app está aberto (foreground)
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    // Exibe o banner no topo da tela (substitui o antigo shouldShowAlert)
    shouldShowBanner: true,
    // Exibe a notificação na lista da central de notificações
    shouldShowList: true,
    // Toca o som da notificação
    shouldPlaySound: true,
    // Atualiza o badge do ícone do app
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string;
  notification: NotificationsType.Notification | undefined;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<NotificationsType.Notification | undefined>(undefined);
  
  // Refs das assinaturas, iniciadas com null (useRef exige valor inicial)
  const notificationListener = useRef<NotificationsType.EventSubscription | null>(null);
  const responseListener = useRef<NotificationsType.EventSubscription | null>(null);

  async function registerForPushNotificationsAsync() {
    let token = '';

    // Sai cedo se o módulo não foi carregado (Expo Go)
    if (!Notifications) return token;

    if (Platform.OS === 'android') {
      // OBRIGATÓRIO PARA ANDROID 8+: Canais de notificação para garantir entrega e som.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alertas Padrão',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#195e38', // Cor do SUAP
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Falha ao obter permissão de push notification!');
        return '';
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          console.warn('ID do projeto não encontrado. Certifique-se de ter rodado "eas build:configure" no projeto.');
        }

        // Obtém o token EXPO que é compatível com o serviço Expo Push
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (e) {
        console.error("Erro ao gerar token:", e);
      }
    } else {
      console.warn('Use um dispositivo físico para Testar Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    // No Expo Go não registra nada, evitando o crash
    if (!Notifications) {
      console.log('Push notifications desativadas no Expo Go. Use um development build.');
      return;
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    // Escuta notificações recebidas com o app aberto
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Escuta quando o usuário CLICA na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notificação Clicada!', response);
      // Aqui você poderia redirecionar o usuário dependendo da resposta
    });

    return () => {
      // Remove as assinaturas usando o método remove() (API atual)
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
