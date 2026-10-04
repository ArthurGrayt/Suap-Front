import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNotificationStore } from '@/store/useNotificationStore';

interface NotificationPanelProps {
  onClose: () => void;
}

// Componente interno: recebe os insets do provider raiz por props (o Modal é outra janela)
function NotificationPanelBody({ onClose, insets }: NotificationPanelProps & { insets: EdgeInsets }) {
  const [filter, setFilter] = useState<'todas' | 'nao-lidas'>('todas');
  
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = filter === 'todas' ? notifications : notifications.filter(n => !n.read);

  const windowHeight = Dimensions.get('window').height;
  // O _layout.tsx usa sm:max-h-[850px] e sm:h-[95vh]
  const emulatorHeight = Math.min(850, windowHeight * 0.95);
  const overflowHeight = windowHeight - emulatorHeight;
  // 100 de margem + status bar + barra de navegação (usado só na web, onde o painel vaza por baixo)
  const paddingToOffsetOverflow = overflowHeight + 100 + insets.top + insets.bottom;

  // Altura real do header (64 + status bar)
  const headerHeight = 64 + insets.top;
  // Overlay container settings
  const containerStyle = { flex: 1 };
  
  // O painel branco fica colado na parte inferior. Usamos insets.bottom para padding final.
  const panelStyle = { bottom: 0 };
  const scrollBottomPadding = paddingToOffsetOverflow + insets.bottom + 16;

  const content = (
    <View style={containerStyle}>
      {/* Backdrop Escuro */}
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
      />
      
      {/* Painel Branco */}
      <View 
        className="absolute top-0 left-0 right-0 bg-surface shadow-2xl overflow-hidden flex-col"
        style={panelStyle}
      >
        <View className="w-full px-4 pt-4">
          <View className="flex-row items-center pb-3">
            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity onPress={onClose} className="mr-1 active:opacity-70">
                <MaterialIcons name="arrow-back" size={24} color="#111c2d" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-[#111c2d]">Notificações</Text>
              {unreadCount > 0 && (
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ba1a1a', alignItems: 'center', justifyContent: 'center' }} className="shadow-sm ml-1">
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff', lineHeight: 14 }}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Pílulas de Filtro e Ações */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity 
                onPress={() => setFilter('todas')}
                className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                style={{ backgroundColor: filter === 'todas' ? '#195e38' : 'transparent' }}
              >
                <Text className={`font-semibold text-[13px] ${filter === 'todas' ? 'text-white' : 'text-[#404941]'}`}>Todas</Text>
                <View className={`w-[18px] h-[18px] rounded-full items-center justify-center ${filter === 'todas' ? 'bg-[#004525]' : 'bg-transparent'}`}>
                  <Text className={`font-bold text-[10px] ${filter === 'todas' ? 'text-white' : 'text-[#404941]'}`}>{notifications.length}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setFilter('nao-lidas')}
                className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                style={{ backgroundColor: filter === 'nao-lidas' ? '#195e38' : 'transparent' }}
              >
                <Text className={`font-semibold text-[13px] ${filter === 'nao-lidas' ? 'text-white' : 'text-[#404941]'}`}>Não lidas</Text>
                <Text className={`font-bold text-[11px] ${filter === 'nao-lidas' ? 'text-white' : 'text-[#404941]'}`}>{unreadCount}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={markAllAsRead} className="px-2 py-1 rounded-lg active:bg-surface-container">
              <Text className="text-[#195e38] font-semibold text-sm">Marcar como lidas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1 w-full px-4" 
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          {/* Lista de Notificações */}
          <View className="flex-col gap-3">
            
            {displayedNotifications.length === 0 ? (
               <View className="items-center justify-center py-10 opacity-70">
                 <MaterialIcons name="notifications-none" size={48} color="#404941" />
                 <Text className="mt-4 font-semibold text-[#404941]">Nenhuma notificação</Text>
               </View>
            ) : (
               displayedNotifications.map((notification) => {
                 const timeLabel = new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 const dateLabel = new Date(notification.createdAt).toLocaleDateString();
                 
                 return (
                  <TouchableOpacity 
                    key={notification.id}
                    onPress={() => {
                      markAsRead(notification.id);
                      onClose();
                      router.push('/');
                    }}
                    className={`relative flex-row p-4 rounded-xl shadow-sm overflow-hidden active:opacity-80 ${!notification.read ? 'bg-surface-container-lowest' : 'bg-surface-container-low opacity-70'}`}
                  >
                    <View className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: !notification.read ? '#195e38' : '#d8e3fb' }} />
                    
                    <View className="flex-row items-start gap-3 pl-1 flex-1">
                      <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: '#c4eed0' }}>
                        <MaterialIcons name="notifications" size={22} color="#00391c" />
                      </View>
                      
                      <View className="flex-col flex-1 gap-1">
                        <View className="flex-row items-center justify-between gap-1">
                          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                            <Text className="font-bold text-[15px] text-[#111c2d]" numberOfLines={1}>{notification.title}</Text>
                            {!notification.read && <View className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#195e38' }} />}
                          </View>
                        </View>
                        
                        <Text className="text-[14px] text-[#404941] leading-5 mt-1">{notification.body}</Text>
                        
                        <View className="flex-row items-center justify-between pt-3 mt-1">
                          <View className="flex-row items-center gap-1">
                            <MaterialIcons name="schedule" size={14} color="#707971" />
                            <Text className="font-bold text-[11px] text-[#111c2d]">{dateLabel} às {timeLabel}</Text>
                          </View>
                          {notification.taskId && (
                            <View className="flex-row items-center gap-0.5">
                              <Text className="font-semibold text-[13px] text-[#195e38]">Ver trabalho</Text>
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

  return content;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = 64 + insets.top;

  return (
    <Modal 
      visible={true} 
      transparent={true} 
      animationType="fade" 
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1 }}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight }}
        />
        <View style={{ position: 'absolute', top: headerHeight, left: 0, right: 0, bottom: 0 }}>
          <NotificationPanelBody onClose={onClose} insets={insets} />
        </View>
      </View>
    </Modal>
  );
}
