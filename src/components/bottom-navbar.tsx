// Importa o React para construção do componente
import React from 'react';
// Importa View, Text e TouchableOpacity para estruturar a barra de navegação inferior
import { View, Text, TouchableOpacity } from 'react-native';
// Importa os ícones do MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa o hook de roteamento do Expo Router
import { useRouter } from 'expo-router';
// Importa o hook de áreas seguras para respeitar botões virtuais na base da tela
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define os identificadores válidos das 3 abas principais
type TabKey = 'prazos' | 'notificacoes' | 'perfil';

// Interface que define a aba atualmente selecionada
interface BottomNavbarProps {
  // Identificador da aba ativa ('prazos', 'notificacoes' ou 'perfil')
  activeTab?: TabKey;
}

// Barra de navegação inferior fixa com os 3 destinos principais na ordem Prazos / Lembretes / Perfil
export default function BottomNavbar({ activeTab = 'prazos' }: BottomNavbarProps) {
  // Obtém a instância do roteador para navegar entre as telas
  const router = useRouter();
  // Obtém as dimensões de área segura (especialmente a barra inferior no Android/iOS)
  const insets = useSafeAreaInsets();

  // Navega via replace apenas se o destino for diferente da aba atual, evitando empilhar histórico
  const navigateToTab = (tab: TabKey, path: '/' | '/notifications' | '/profile') => {
    // Ignora toque redundante na aba que já está visível
    if (activeTab === tab) return;
    // Substitui a rota atual para manter o botão voltar previsível no Android
    router.replace(path);
  };

  return (
    // Container inferior com altura base de 64px somada ao inset do sistema
    <View
      style={{ height: 64 + insets.bottom, paddingBottom: 8 + insets.bottom }}
      className="flex-row items-center bg-surface-container-lowest border-t border-surface-container"
    >
      {/* Aba 1: Prazos (Tela inicial) */}
      <TouchableOpacity
        onPress={() => navigateToTab('prazos', '/')}
        accessibilityRole="tab"
        accessibilityLabel="Prazos"
        accessibilityState={{ selected: activeTab === 'prazos' }}
        className="flex-1 min-h-[44px] items-center justify-center mt-1"
      >
        {/* Ícone de calendário de prazos */}
        <MaterialIcons
          name="event-available"
          size={24}
          color={activeTab === 'prazos' ? '#195e38' : '#3d4a40'}
        />
        {/* Rótulo da aba Prazos sem opacidade reduzida para manter contraste >= 4.5:1 */}
        <Text
          className={`text-xs font-bold mt-0.5 ${
            activeTab === 'prazos' ? 'text-primary-container' : 'text-on-surface-variant'
          }`}
        >
          Prazos
        </Text>
      </TouchableOpacity>

      {/* Aba 2: Lembretes (Configuração de regras e horários de notificação) */}
      <TouchableOpacity
        onPress={() => navigateToTab('notificacoes', '/notifications')}
        accessibilityRole="tab"
        accessibilityLabel="Lembretes"
        accessibilityState={{ selected: activeTab === 'notificacoes' }}
        className="flex-1 min-h-[44px] items-center justify-center mt-1"
      >
        {/* Ícone distinto para configurações de lembrete */}
        <MaterialIcons
          name="notifications-active"
          size={24}
          color={activeTab === 'notificacoes' ? '#195e38' : '#3d4a40'}
        />
        {/* Rótulo renomeado para Lembretes para diferenciar da caixa de notificações do topo */}
        <Text
          className={`text-xs font-bold mt-0.5 ${
            activeTab === 'notificacoes' ? 'text-primary-container' : 'text-on-surface-variant'
          }`}
        >
          Lembretes
        </Text>
      </TouchableOpacity>

      {/* Aba 3: Perfil do estudante */}
      <TouchableOpacity
        onPress={() => navigateToTab('perfil', '/profile')}
        accessibilityRole="tab"
        accessibilityLabel="Perfil"
        accessibilityState={{ selected: activeTab === 'perfil' }}
        className="flex-1 min-h-[44px] items-center justify-center mt-1"
      >
        {/* Ícone de usuário */}
        <MaterialIcons
          name="person"
          size={24}
          color={activeTab === 'perfil' ? '#195e38' : '#3d4a40'}
        />
        {/* Rótulo da aba Perfil */}
        <Text
          className={`text-xs font-bold mt-0.5 ${
            activeTab === 'perfil' ? 'text-primary-container' : 'text-on-surface-variant'
          }`}
        >
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
}
