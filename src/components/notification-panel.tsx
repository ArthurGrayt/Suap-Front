import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [filter, setFilter] = useState<'todas' | 'nao-lidas'>('todas');
  const mockUnreadCount = 3;

  const windowHeight = Dimensions.get('window').height;
  // O _layout.tsx usa sm:max-h-[850px] e sm:h-[95vh]
  const emulatorHeight = Math.min(850, windowHeight * 0.95);
  const overflowHeight = windowHeight - emulatorHeight;
  const paddingToOffsetOverflow = overflowHeight + 100; // 100 de margem de segurança + 64 do header

  return (
    <View style={{ position: 'absolute', top: 64, left: 0, right: 0, bottom: -1000, zIndex: 100 }}>
      {/* Backdrop Escuro */}
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
      />
      
      {/* Painel Branco */}
      <View 
        className="absolute top-0 left-0 right-0 bg-surface shadow-2xl overflow-hidden flex-col"
        style={{ height: Dimensions.get('window').height }}
      >
        <View className="w-full px-4 pt-4">
          <View className="flex-row items-center pb-3">
            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity onPress={onClose} className="mr-1 active:opacity-70">
                <MaterialIcons name="arrow-back" size={24} color="#111c2d" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-[#111c2d]">Notificações</Text>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ba1a1a', alignItems: 'center', justifyContent: 'center' }} className="shadow-sm ml-1">
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff', lineHeight: 14 }}>{mockUnreadCount}</Text>
              </View>
            </View>
          </View>

          {/* Pílulas de Filtro e Ações */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity 
                onPress={() => setFilter('todas')}
                className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 shadow-sm ${filter === 'todas' ? 'bg-[#195e38]' : 'bg-transparent'}`}
              >
                <Text className={`font-semibold text-[13px] ${filter === 'todas' ? 'text-white' : 'text-[#404941]'}`}>Todas</Text>
                <View className={`w-[18px] h-[18px] rounded-full items-center justify-center ${filter === 'todas' ? 'bg-[#004525]' : 'bg-transparent'}`}>
                  <Text className={`font-bold text-[10px] ${filter === 'todas' ? 'text-white' : 'text-[#404941]'}`}>3</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setFilter('nao-lidas')}
                className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${filter === 'nao-lidas' ? 'bg-[#195e38] shadow-sm' : 'bg-transparent'}`}
              >
                <Text className={`font-semibold text-[13px] ${filter === 'nao-lidas' ? 'text-white' : 'text-[#404941]'}`}>Não lidas</Text>
                <Text className={`font-bold text-[11px] ${filter === 'nao-lidas' ? 'text-white' : 'text-[#404941]'}`}>2</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity className="px-2 py-1 rounded-lg active:bg-surface-container">
              <Text className="text-[#195e38] font-semibold text-sm">Marcar como lidas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1 w-full px-4" 
          contentContainerStyle={{ paddingBottom: paddingToOffsetOverflow }}
          showsVerticalScrollIndicator={false}
        >
          {/* Lista de Notificações */}
          <View className="flex-col gap-3">
            
            {/* Card 1: Crítico */}
            <TouchableOpacity className="relative flex-row p-4 rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden active:opacity-80">
              <View className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: '#ba1a1a' }} />
              
              <View className="flex-row items-start gap-3 pl-1 flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: '#ffdad6' }}>
                  <MaterialIcons name="local-fire-department" size={22} color="#ba1a1a" />
                </View>
                
                <View className="flex-col flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-1">
                    <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                      <Text className="font-bold text-[15px] text-[#111c2d]" numberOfLines={1}>Prazo Crítico!</Text>
                      <View className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#ba1a1a' }} />
                    </View>
                    <View className="px-1 py-[3px] shrink-0 bg-transparent">
                      <Text className="font-bold text-[10px] text-[#93000a]">&lt; 12h restantes</Text>
                    </View>
                  </View>
                  
                  <Text className="text-[14px] text-[#404941] leading-5 mt-1">O Trabalho de divisão e conquista (P.A.A.) vence em menos de 12 horas.</Text>
                  
                  <View className="flex-row items-center justify-between pt-3 mt-1">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="schedule" size={14} color="#707971" />
                      <Text className="font-bold text-[11px] text-[#111c2d]">Há 10 min</Text>
                    </View>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="font-semibold text-[13px] text-[#195e38]">Ir para o trabalho</Text>
                      <MaterialIcons name="arrow-forward" size={16} color="#195e38" />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Briefing */}
            <TouchableOpacity className="relative flex-row p-4 rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden active:opacity-80">
              <View className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: '#005785' }} />
              
              <View className="flex-row items-start gap-3 pl-1 flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: '#d8e3fb' }}>
                  <MaterialIcons name="wb-sunny" size={22} color="#005785" />
                </View>
                
                <View className="flex-col flex-1 gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-[15px] text-[#111c2d] flex-1" numberOfLines={1}>Briefing de Segunda-feira</Text>
                    <View className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#005785' }} />
                  </View>
                  
                  <Text className="text-[14px] text-[#404941] leading-5 mt-1">Você tem 2 entregas de P.A.A. para esta semana e 1 de Sistemas Distribuídos. Bom estudo!</Text>
                  
                  <View className="flex-row items-center justify-between pt-3 mt-1">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="today" size={14} color="#707971" />
                      <Text className="font-bold text-[11px] text-[#111c2d]">Hoje, 08:00</Text>
                    </View>
                    <View className="px-1 py-[3px] bg-transparent">
                      <Text className="font-medium text-[11px] text-[#005785]">3 tarefas na semana</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 3: Sincronização SUAP */}
            <TouchableOpacity className="relative flex-row p-4 rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden opacity-90 active:opacity-100">
              <View className="flex-row items-start gap-3 flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: '#c4eed0' }}>
                  <MaterialIcons name="cloud-done" size={22} color="#00391c" />
                </View>
                
                <View className="flex-col flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-1">
                    <Text className="font-semibold text-[15px] text-[#111c2d] flex-1" numberOfLines={1}>Sincronização SUAP</Text>
                    <View className="px-1 py-0.5 bg-transparent">
                      <Text className="font-semibold text-[10px] text-[#00391c]">Concluída</Text>
                    </View>
                  </View>
                  
                  <Text className="text-[14px] text-[#404941] leading-5 mt-1">3 novos trabalhos encontrados no diário virtual e adicionados ao seu calendário com sucesso.</Text>
                  
                  <View className="flex-row items-center justify-between pt-2 mt-1">
                    <Text className="font-bold text-[11px] text-[#111c2d]">Ontem, 23:45</Text>
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="smart-toy" size={14} color="#404941" />
                      <Text className="text-[12px] text-[#404941]">Sistema automático</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 4: Reunião */}
            <TouchableOpacity className="relative flex-row p-4 rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden active:opacity-80">
              <View className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: '#ffb400' }} />
              
              <View className="flex-row items-start gap-3 pl-1 flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: '#fff0c2' }}>
                  <MaterialIcons name="groups" size={22} color="#7a5600" />
                </View>
                
                <View className="flex-col flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-1">
                    <Text className="font-bold text-[15px] text-[#111c2d]" numberOfLines={1}>Reunião de Orientação</Text>
                    <View className="px-1 py-[3px] shrink-0 bg-transparent">
                      <Text className="font-bold text-[10px] text-[#7a5600]">Em 2 horas</Text>
                    </View>
                  </View>
                  
                  <Text className="text-[14px] text-[#404941] leading-5 mt-1">O professor marcou um encontro no Meet para alinhar o projeto final.</Text>
                  
                  <View className="flex-row items-center justify-between pt-3 mt-1">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="videocam" size={14} color="#707971" />
                      <Text className="font-bold text-[11px] text-[#111c2d]">Hoje, 14:00</Text>
                    </View>
                    <Text className="font-bold text-[11px] text-[#195e38]">Entrar na sala &rarr;</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 5: Novo Material */}
            <TouchableOpacity className="relative flex-row p-4 rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden active:opacity-80">
              <View className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: '#6200ee' }} />
              
              <View className="flex-row items-start gap-3 pl-1 flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: '#e5d5ff' }}>
                  <MaterialIcons name="library-books" size={22} color="#3700b3" />
                </View>
                
                <View className="flex-col flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-1">
                    <Text className="font-bold text-[15px] text-[#111c2d]" numberOfLines={1}>Material Disponível</Text>
                  </View>
                  
                  <Text className="text-[14px] text-[#404941] leading-5 mt-1">Foram adicionados 3 novos slides referentes à disciplina de Programação Web.</Text>
                  
                  <View className="flex-row items-center justify-between pt-3 mt-1">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="today" size={14} color="#707971" />
                      <Text className="font-bold text-[11px] text-[#111c2d]">Ontem, 16:30</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    </View>
  );
}
