import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (dateFilter: string, points: number) => void;
  initialDateFilter?: string;
  initialPoints?: number;
}

export default function FilterModal({ 
  visible, 
  onClose, 
  onApply,
  initialDateFilter = 'any',
  initialPoints = 10 
}: FilterModalProps) {
  // Insets do sistema (botões de navegação na borda inferior)
  const insets = useSafeAreaInsets();
  const [dateFilter, setDateFilter] = useState(initialDateFilter); // 'any', '7days', 'month', 'custom'
  const [points, setPoints] = useState(initialPoints); // Slider value (fake)

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/40 justify-end items-center" 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={{ paddingBottom: 24 + insets.bottom }} className="w-full max-w-[400px] bg-surface rounded-t-[32px] p-6 pt-2 shadow-2xl">
          
          {/* Pill de arrastar (estético) */}
          <View className="w-12 h-1.5 bg-surface-variant rounded-full self-center mb-6 mt-2" />
          
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-on-surface">Filtros Avançados</Text>
            <TouchableOpacity onPress={onClose} className="bg-surface-container-high rounded-full p-1.5 outline-none" style={{ outlineStyle: 'none' } as any}>
              <MaterialIcons name="close" size={20} color="#404941" />
            </TouchableOpacity>
          </View>

          {/* Filtro de Data */}
          <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">
            Por Data de Entrega
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            <TouchableOpacity 
              onPress={() => setDateFilter('any')}
              className={`px-4 py-2 rounded-lg border outline-none ${dateFilter === 'any' ? 'bg-primary-container border-primary/20' : 'bg-surface-container border-surface-variant'}`}
              style={{ outlineStyle: 'none' } as any}
            >
              <Text className={`font-bold text-sm ${dateFilter === 'any' ? 'text-on-primary-container' : 'text-on-surface'}`}>Qualquer data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setDateFilter('7days')}
              className={`px-4 py-2 rounded-lg border outline-none ${dateFilter === '7days' ? 'bg-primary-container border-primary/20' : 'bg-surface-container border-surface-variant'}`}
              style={{ outlineStyle: 'none' } as any}
            >
              <Text className={`font-bold text-sm ${dateFilter === '7days' ? 'text-on-primary-container' : 'text-on-surface'}`}>Próximos 7 dias</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setDateFilter('custom')}
              className={`px-4 py-2 rounded-lg border outline-none ${dateFilter === 'custom' ? 'bg-primary-container border-primary/20' : 'bg-surface-container border-surface-variant'}`}
              style={{ outlineStyle: 'none' } as any}
            >
              <Text className={`font-bold text-sm ${dateFilter === 'custom' ? 'text-on-primary-container' : 'text-on-surface'}`}>Personalizado</Text>
            </TouchableOpacity>
          </View>

          {/* Se a opção Personalizado for escolhida, mostrar os inputs de data */}
          {dateFilter === 'custom' && (
            <View className="flex-row gap-2 mb-6">
              <View className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-xl p-2 flex-row items-center">
                <MaterialIcons name="event" size={16} color="#707971" />
                <TextInput 
                  placeholder="Início (DD/MM/AAAA)"
                  className="flex-1 ml-2 text-xs text-on-surface outline-none border-0"
                  style={{ outlineStyle: 'none' } as any}
                  placeholderTextColor="#707971"
                />
              </View>
              <View className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-xl p-2 flex-row items-center">
                <MaterialIcons name="event" size={16} color="#707971" />
                <TextInput 
                  placeholder="Fim (Opcional)"
                  className="flex-1 ml-2 text-xs text-on-surface outline-none border-0"
                  style={{ outlineStyle: 'none' } as any}
                  placeholderTextColor="#707971"
                />
              </View>
            </View>
          )}

          {/* Filtro de Pontuação com Slider (Simulado) */}
          <View className="mt-2 mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Mínimo de Pontos
              </Text>
              <Text className="text-primary font-bold text-base">{points} pts</Text>
            </View>
            
            {/* Componente Visual do Slider Interativo */}
            <View className="h-10 justify-center">
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={50}
                step={1}
                value={points}
                onValueChange={(val) => setPoints(val)}
                minimumTrackTintColor="#195e38"
                maximumTrackTintColor="#cce8d3"
                thumbTintColor="#195e38"
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-[10px] text-on-surface-variant">0 pts</Text>
              <Text className="text-[10px] text-on-surface-variant">50 pts</Text>
            </View>
          </View>

          {/* Botão Aplicar */}
          <TouchableOpacity 
            className="w-full h-12 bg-primary rounded-xl items-center justify-center shadow-sm mb-4 outline-none"
            style={{ outlineStyle: 'none' } as any}
            onPress={() => onApply(dateFilter, points)}
          >
            <Text className="text-on-primary font-bold text-base">Aplicar Filtros</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
