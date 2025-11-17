import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import type { BottomTabBarProps } from './types';

function mergeStyles(...stylesList: StyleProp<ViewStyle>[]) {
  return stylesList.filter(Boolean);
}

export function BottomTabBar({
  tabs,
  activeKey,
  onTabPress,
  style,
  inactiveColor = '#9ca3af',
  activeColor = '#14b8a6'
}: BottomTabBarProps) {
  return (
    <View style={mergeStyles(styles.container, style)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="button"
            accessibilityLabel={tab.accessibilityLabel ?? tab.label}
            accessibilityState={{ selected: isActive }}
            testID={tab.testID}
            onPress={(event) => onTabPress?.(tab.key, event)}
            activeOpacity={0.85}
          >
            <Icon
              size={22}
              color={isActive ? activeColor : inactiveColor}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(94, 234, 212, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10
  },
  tabActive: {
    backgroundColor: 'rgba(94, 234, 212, 0.15)'
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '400'
  },
  labelActive: {
    color: '#0f766e',
    fontWeight: '600'
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 4
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600'
  }
});
