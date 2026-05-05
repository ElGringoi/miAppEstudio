import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { QF } from '@/constants/questflow';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: QF.colors.accent,
        tabBarInactiveTintColor: QF.colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: QF.colors.surface,
            borderTopColor: QF.colors.cardBorder,
          },
          default: {
            backgroundColor: QF.colors.surface,
            borderTopColor: QF.colors.cardBorder,
          },
        }),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Battle HQ',
          tabBarIcon: ({ color }) => <Ionicons name="shield-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Battle Log',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gym"
        options={{
          title: 'Gym',
          tabBarIcon: ({ color }) => <Ionicons name="barbell-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rpg"
        options={{
          title: 'RPG',
          tabBarIcon: ({ color }) => <Ionicons name="star-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="materias"
        options={{
          title: 'Estudio',
          tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={24} color={color} />,
        }}
      />
      {/* Ocultar tabs legacy del nav bar */}
      <Tabs.Screen name="agenda" options={{ href: null }} />
      <Tabs.Screen name="pregunteros" options={{ href: null }} />
    </Tabs>
  );
}
