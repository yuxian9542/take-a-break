import type { ComponentType } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

export interface TabDefinition {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  badgeCount?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export interface BottomTabBarProps {
  tabs: TabDefinition[];
  activeKey: string;
  onTabPress?: (key: string, event?: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  inactiveColor?: string;
  activeColor?: string;
}
