import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface CategoryIconProps {
  name?: string | null;
  size?: number;
  color?: string;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Utensils: 'restaurant-outline',
  Coffee: 'cafe-outline',
  Car: 'car-outline',
  Home: 'home-outline',
  ShoppingBag: 'bag-handle-outline',
  Zap: 'flash-outline',
  HeartPulse: 'fitness-outline',
  Tv: 'tv-outline',
  GraduationCap: 'school-outline',
  Receipt: 'receipt-outline',
  MoreHorizontal: 'ellipsis-horizontal',
  Briefcase: 'briefcase-outline',
  Laptop: 'laptop-outline',
  Gift: 'gift-outline',
  Store: 'storefront-outline',
  TrendingUp: 'trending-up-outline',
  PlusCircle: 'add-circle-outline',
  Tag: 'pricetag-outline',
  FastFood: 'fast-food-outline',
  Cart: 'cart-outline',
  Medical: 'medkit-outline',
  Airplane: 'airplane-outline',
  Film: 'film-outline',
  Book: 'book-outline',
};

export const AVAILABLE_CATEGORY_ICONS = Object.keys(ICON_MAP);

export function CategoryIcon({ name, size = 20, color = '#64748b' }: CategoryIconProps) {
  const iconName = (name && ICON_MAP[name]) ? ICON_MAP[name] : 'pricetag-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
}
