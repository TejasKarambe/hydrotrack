import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Droplet, Calendar, BarChart3, Settings } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme/ThemeProvider';

export default function TabLayout() {
  const { colors, typography, isDark } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          elevation: 10,
          shadowColor: isDark ? '#000000' : '#0284C7',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Droplet
              size={22}
              color={color}
              strokeWidth={focused ? 2.8 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Calendar
              size={22}
              color={color}
              strokeWidth={focused ? 2.8 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <BarChart3
              size={22}
              color={color}
              strokeWidth={focused ? 2.8 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings
              size={22}
              color={color}
              strokeWidth={focused ? 2.8 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
