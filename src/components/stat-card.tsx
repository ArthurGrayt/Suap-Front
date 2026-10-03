import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  colorTitle: string;
  iconColor: string;
}

export default function StatCard({ title, value, subtitle, icon, colorTitle, iconColor }: StatCardProps) {
  return (
    <View className="flex-1 bg-surface-container-lowest p-2 rounded-lg shadow-sm">
      <View className="flex-row items-center justify-between mb-1">
        <Text className={`text-[10px] ${colorTitle} uppercase font-bold`}>{title}</Text>
        <MaterialIcons name={icon} size={16} color={iconColor} />
      </View>
      <Text className="text-lg font-bold text-on-surface">{value}</Text>
      <Text className="text-xs text-on-surface-variant">{subtitle}</Text>
    </View>
  );
}
