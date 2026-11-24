// Importa React e useState para controlar a abertura do painel de notificações
import React, { useState } from 'react';
// Importa View, Text e TouchableOpacity do React Native
import { View, Text, TouchableOpacity } from 'react-native';
// Importa os ícones MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa o hook de margens seguras para respeitar a status bar
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Importa o roteador para ação do botão voltar
import { router } from 'expo-router';
// Importa o store Zustand de notificações para contar avisos não lidos
import { useNotificationStore } from '@/store/useNotificationStore';
// Importa o componente do painel suspenso de notificações
import NotificationPanel from './notification-panel';

// Interface que define as propriedades opcionais do cabeçalho
interface HeaderProps {
  // Título exibido ao lado da marca ou ao lado do botão voltar
  title?: string;
  // Quando verdadeiro, exibe botão de voltar em vez do logotipo e do sino
  showBackButton?: boolean;
}

// Cabeçalho institucional superior compartilhado pelas telas do aplicativo
export default function Header({
  title = 'Prazos',
  showBackButton = false,
}: HeaderProps) {
  // Obtém as áreas seguras do dispositivo (status bar no topo)
  const insets = useSafeAreaInsets();
  // Controla se a caixa de notificações está aberta ou fechada
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Conta quantas notificações locais ainda não foram lidas
  const unreadCount = useNotificationStore((state) => state.notifications.filter((n) => !n.read).length);

  return (
    // Barra verde institucional sólida com altura base de 64px + status bar do aparelho
    <View
      style={{ height: 64 + insets.top, paddingTop: insets.top }}
      className="relative px-4 flex-row items-center justify-between bg-primary-container border-b border-primary"
    >
      {/* Lado esquerdo: botão de voltar opcional ou marca SUAP + título da tela */}
      <View className="flex-row items-center flex-1 pr-2">
        {showBackButton && (
          // Botão voltar com área de toque mínima de 44x44px e rótulo acessível
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
            className="w-11 h-11 -ml-2 mr-1 items-center justify-center rounded-full active:bg-white/10"
          >
            {/* Ícone de seta para a esquerda em branco */}
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        {!showBackButton && (
          // Marca institucional SUAP com separador vertical discreto
          <>
            <Text className="text-on-primary font-bold text-lg lowercase tracking-tight">suap</Text>
            <View className="h-4 w-px bg-on-primary/30 mx-2" />
          </>
        )}
        {/* Título específico da tela com alto contraste em branco sobre o fundo verde */}
        <Text
          className={`font-semibold ${showBackButton ? 'text-lg text-on-primary font-bold' : 'text-base text-on-primary'}`}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Lado direito: botão do sino de notificações (oculto em telas com botão voltar) */}
      {!showBackButton && (
        <View className="flex-row items-center">
          {/* Botão acessível com área de toque de 44x44px */}
          <TouchableOpacity
            onPress={() => setIsNotificationsOpen(!isNotificationsOpen)}
            accessibilityRole="button"
            accessibilityLabel={isNotificationsOpen ? 'Fechar notificações' : `Abrir notificações (${unreadCount} não lidas)`}
            style={{ backgroundColor: isNotificationsOpen ? '#ffffff' : 'transparent' }}
            className={`w-11 h-11 items-center justify-center rounded-full relative ${!isNotificationsOpen ? 'active:bg-white/10' : ''}`}
          >
            {/* Ícone do sino invertendo a cor quando o painel está aberto */}
            <MaterialIcons
              name="notifications"
              size={22}
              color={isNotificationsOpen ? '#195e38' : '#ffffff'}
            />
            {/* Indicador circular vermelho quando existem notificações não lidas */}
            {!isNotificationsOpen && unreadCount > 0 && (
              <View
                className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border border-primary-container bg-error"
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Renderiza o painel de notificações quando o usuário toca no sino */}
      {isNotificationsOpen && (
        <NotificationPanel onClose={() => setIsNotificationsOpen(false)} />
      )}
    </View>
  );
}
