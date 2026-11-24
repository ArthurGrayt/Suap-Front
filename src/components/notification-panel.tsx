// Importa React e useState para controlar o filtro de exibição das notificações
import React, { useState } from 'react';
// Importa componentes visuais e Modal do React Native
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
// Importa os ícones MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa hooks e tipos de áreas seguras
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
// Importa o roteador para navegar para a tarefa vinculada
import { router } from 'expo-router';
// Importa o store Zustand com as notificações persistidas
import { useNotificationStore } from '@/store/useNotificationStore';
// Importa os formatadores padronizados de data e hora do aplicativo
import { formatDate, formatTime } from '@/utils/date';

// Interface das propriedades aceitas pelo painel de notificações
interface NotificationPanelProps {
  // Callback para fechar o painel ao tocar fora, no botão voltar ou após navegar
  onClose: () => void;
}

// Componente interno com o corpo do painel (recebe insets do provider raiz)
function NotificationPanelBody({ onClose, insets }: NotificationPanelProps & { insets: EdgeInsets }) {
  // Estado para alternar entre todas as notificações ou apenas não lidas
  const [filter, setFilter] = useState<'todas' | 'nao-lidas'>('todas');

  // Obtém lista de notificações e ações do store global
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  // Calcula quantidade de notificações ainda não lidas
  const unreadCount = notifications.filter((n) => !n.read).length;
  // Filtra a lista exibida conforme a pílula selecionada
  const displayedNotifications = filter === 'todas' ? notifications : notifications.filter((n) => !n.read);

  // Calcula a altura da janela para compensar espaço inferior do mockup na Web
  const windowHeight = Dimensions.get('window').height;
  // Altura máxima do frame simulador definida em _layout.tsx
  const emulatorHeight = Math.min(850, windowHeight * 0.95);
  // Diferença de altura caso a tela do navegador seja maior que o mockup
  const overflowHeight = Math.max(0, windowHeight - emulatorHeight);
  // Espaçamento inferior seguro para não cortar o último item do scroll
  const scrollBottomPadding = overflowHeight + insets.bottom + 24;

  return (
    <View style={{ flex: 1 }}>
      {/* Backdrop escuro clicável para fechar o painel */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar painel de notificações"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
      />

      {/* Painel branco principal contendo cabeçalho de filtros e lista */}
      <View
        className="absolute top-0 left-0 right-0 bg-surface shadow-2xl overflow-hidden flex-col"
        style={{ bottom: 0 }}
      >
        {/* Cabeçalho interno do painel */}
        <View className="w-full px-4 pt-4">
          <View className="flex-row items-center pb-3">
            <View className="flex-row items-center gap-1.5">
              {/* Botão de fechar/voltar com área de toque >= 44px */}
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar notificações"
                className="w-11 h-11 -ml-2 items-center justify-center rounded-full active:bg-surface-container"
              >
                <MaterialIcons name="arrow-back" size={24} color="#141d17" />
              </TouchableOpacity>
              {/* Título da seção */}
              <Text className="text-2xl font-bold text-on-surface">Notificações</Text>
              {/* Contador vermelho quando existem itens não lidos */}
              {unreadCount > 0 && (
                <View className="w-5 h-5 rounded-full bg-error items-center justify-center shadow-sm ml-1">
                  <Text className="text-[11px] font-bold text-on-error">{unreadCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Barra de pílulas de filtro e ação de marcar todas como lidas */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              {/* Filtro Todas */}
              <TouchableOpacity
                onPress={() => setFilter('todas')}
                accessibilityRole="button"
                accessibilityLabel={`Mostrar todas as notificações (${notifications.length})`}
                accessibilityState={{ selected: filter === 'todas' }}
                className={`px-3 py-2 rounded-full flex-row items-center gap-1.5 ${
                  filter === 'todas' ? 'bg-primary-container' : 'bg-transparent'
                }`}
              >
                <Text className={`font-semibold text-[13px] ${filter === 'todas' ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  Todas
                </Text>
                <View
                  className={`w-[18px] h-[18px] rounded-full items-center justify-center ${
                    filter === 'todas' ? 'bg-primary' : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-bold text-[10px] ${filter === 'todas' ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                    {notifications.length}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Filtro Não lidas */}
              <TouchableOpacity
                onPress={() => setFilter('nao-lidas')}
                accessibilityRole="button"
                accessibilityLabel={`Mostrar notificações não lidas (${unreadCount})`}
                accessibilityState={{ selected: filter === 'nao-lidas' }}
                className={`px-3 py-2 rounded-full flex-row items-center gap-1.5 ${
                  filter === 'nao-lidas' ? 'bg-primary-container' : 'bg-transparent'
                }`}
              >
                <Text className={`font-semibold text-[13px] ${filter === 'nao-lidas' ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  Não lidas
                </Text>
                <Text className={`font-bold text-[11px] ${filter === 'nao-lidas' ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {unreadCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ação em massa para marcar todas como lidas */}
            <TouchableOpacity
              onPress={markAllAsRead}
              accessibilityRole="button"
              accessibilityLabel="Marcar todas as notificações como lidas"
              className="px-2 py-2 rounded-lg active:bg-surface-container"
            >
              <Text className="text-primary-container font-semibold text-sm">Marcar como lidas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista rolável das notificações */}
        <ScrollView
          className="flex-1 w-full px-4"
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-col gap-3">
            {displayedNotifications.length === 0 ? (
              // Estado vazio quando não há notificações para o filtro escolhido
              <View className="items-center justify-center py-10">
                <MaterialIcons name="notifications-none" size={48} color="#3d4a40" />
                <Text className="mt-4 font-semibold text-on-surface-variant">
                  {filter === 'nao-lidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </Text>
              </View>
            ) : (
              // Mapeia cada notificação para um card clicável
              displayedNotifications.map((notification) => {
                // Converte timestamp numérico ou string para ISO antes de formatar no padrão do app
                const createdIso = new Date(notification.createdAt).toISOString();
                // Formata o horário e a data usando o mesmo utilitário padronizado do app
                const timeLabel = formatTime(createdIso);
                const dateLabel = formatDate(createdIso);

                return (
                  <TouchableOpacity
                    key={notification.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${notification.title}. ${notification.body}`}
                    onPress={() => {
                      // Marca a notificação como lida antes de navegar
                      markAsRead(notification.id);
                      // Fecha o painel suspenso
                      onClose();
                      // Se houver tarefa associada, navega direto para /task/[id]; caso contrário volta à Home
                      if (notification.taskId) {
                        router.push(`/task/${notification.taskId}` as any);
                      } else {
                        router.push('/');
                      }
                    }}
                    className={`relative flex-row p-4 rounded-xl shadow-sm overflow-hidden active:opacity-80 ${
                      !notification.read ? 'bg-surface-container-lowest' : 'bg-surface-container-low opacity-70'
                    }`}
                  >
                    {/* Barra lateral verde para não lidas ou neutra para lidas */}
                    <View
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        !notification.read ? 'bg-primary-container' : 'bg-surface-variant'
                      }`}
                    />

                    <View className="flex-row items-start gap-3 pl-1 flex-1">
                      {/* Ícone circular temático */}
                      <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0 bg-primary-fixed">
                        <MaterialIcons name="notifications" size={22} color="#00210f" />
                      </View>

                      <View className="flex-col flex-1 gap-1">
                        {/* Título e bolinha de status não lido */}
                        <View className="flex-row items-center justify-between gap-1">
                          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                            <Text className="font-bold text-[15px] text-on-surface" numberOfLines={1}>
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <View className="w-2 h-2 rounded-full shrink-0 bg-primary-container" />
                            )}
                          </View>
                        </View>

                        {/* Corpo descritivo do alerta */}
                        <Text className="text-[14px] text-on-surface-variant leading-5 mt-1">{notification.body}</Text>

                        {/* Rodapé com carimbo de data/hora e link para abrir o trabalho */}
                        <View className="flex-row items-center justify-between pt-3 mt-1">
                          <View className="flex-row items-center gap-1">
                            <MaterialIcons name="schedule" size={14} color="#707971" />
                            <Text className="font-bold text-[11px] text-on-surface">
                              {dateLabel} às {timeLabel}
                            </Text>
                          </View>
                          {notification.taskId && (
                            <View className="flex-row items-center gap-0.5">
                              <Text className="font-semibold text-[13px] text-primary-container">Ver trabalho</Text>
                              <MaterialIcons name="arrow-forward" size={16} color="#195e38" />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// Componente principal exportado que renderiza o painel de notificações dentro de um Modal
export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  // Obtém as margens seguras do dispositivo (status bar e barra inferior)
  const insets = useSafeAreaInsets();
  // Calcula a altura total do cabeçalho para posicionar o painel logo abaixo dele
  const headerHeight = 64 + insets.top;

  return (
    // Modal transparente que sobrepõe a tela atual
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* Container raiz que centraliza o conteúdo em telas grandes (desktop) igual ao _layout.tsx */}
      <View className="flex-1 sm:items-center sm:justify-center">
        {/* Wrapper com as mesmas dimensões do mockup de celular na web para não vazar na tela inteira */}
        <View className="w-full h-full sm:max-w-[400px] sm:max-h-[850px] sm:h-[95vh] sm:rounded-[3rem] sm:overflow-hidden sm:border-[8px] sm:border-transparent relative">
          {/* Área clicável transparente sobre o header para fechar o painel ao tocar fora */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight }}
          />
          {/* Container posicionado exatamente abaixo do header dentro dos limites do aparelho */}
          <View style={{ position: 'absolute', top: headerHeight, left: 0, right: 0, bottom: 0 }}>
            {/* Corpo do painel de notificações com filtros e lista */}
            <NotificationPanelBody onClose={onClose} insets={insets} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
