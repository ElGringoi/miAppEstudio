import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, font } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const bg = variant === 'primary' ? colors.text
    : variant === 'danger'   ? colors.error + '22'
    : colors.surface2;

  const fg = variant === 'primary' ? colors.bg
    : variant === 'danger'   ? colors.error
    : colors.textSec;

  return (
    <TouchableOpacity
      style={[styles.base, { backgroundColor: bg }, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={fg} />
        : <Text style={[styles.label, { color: fg }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: font.base,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
