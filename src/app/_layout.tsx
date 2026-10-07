import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { NavigationBar } from 'expo-navigation-bar';
import { PinGatekeeper } from '@/components/auth/PinGatekeeper';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    SystemUI.setBackgroundColorAsync('#ffffff').catch(() => {});
    NavigationBar.setStyle('light');
  }, []);

  return (
    <PinGatekeeper>
      <NavigationBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerTintColor: '#083D77',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: 'กลับ',
          contentStyle: {
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="reports"
          options={{
            headerShown: true,
            title: 'รายงานและสถิติ',
          }}
        />
        <Stack.Screen
          name="recurring"
          options={{
            headerShown: true,
            title: 'ค่าใช้จ่ายประจำ',
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            headerShown: true,
            title: 'จัดการหมวดหมู่',
          }}
        />
        <Stack.Screen
          name="pin-settings"
          options={{
            headerShown: true,
            title: 'ตั้งค่าความปลอดภัย PIN',
          }}
        />
        <Stack.Screen
          name="backup"
          options={{
            headerShown: true,
            title: 'สำรองและกู้คืนข้อมูล',
          }}
        />
      </Stack>
    </PinGatekeeper>
  );
}
