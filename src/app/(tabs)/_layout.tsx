import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Compute safe bottom padding using insets.bottom
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabHeight = 56 + bottomInset;

  return (
    <>
      <NavigationBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#083D77',
          tabBarInactiveTintColor: '#94a3b8',
          headerShown: false,
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
          ),
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            height: tabHeight,
            paddingTop: 6,
            paddingBottom: bottomInset,
            elevation: 0, // remove Android shadow / gradient
            shadowOpacity: 0, // remove iOS shadow
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 0,
            borderBottomWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -2,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'ภาพรวม',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'pie-chart' : 'pie-chart-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'ธุรกรรม',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'บัญชี',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'งบประมาณ',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'เพิ่มเติม',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
