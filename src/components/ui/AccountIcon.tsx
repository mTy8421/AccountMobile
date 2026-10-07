import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AccountIconProps {
  type: string;
  size?: number;
  color?: string;
}

export function AccountIcon({ type, size = 20, color = '#3b82f6' }: AccountIconProps) {
  switch (type?.toUpperCase()) {
    case 'CASH':
      return <Ionicons name="cash-outline" size={size} color={color} />;
    case 'BANK':
      return <Ionicons name="business-outline" size={size} color={color} />;
    case 'WALLET':
      return <Ionicons name="wallet-outline" size={size} color={color} />;
    case 'CREDIT_CARD':
      return <Ionicons name="card-outline" size={size} color={color} />;
    case 'INVESTMENT':
      return <MaterialCommunityIcons name="chart-line" size={size} color={color} />;
    default:
      return <Ionicons name="cash-outline" size={size} color={color} />;
  }
}
