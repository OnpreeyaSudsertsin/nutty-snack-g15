import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles, colors } from '../theme';

export default function AppButton({
  title,
  onPress,
  light = false,
  danger = false,
  style,
  textStyle,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      style={[
        styles.button,
        light && {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
        },
        danger && {
          backgroundColor: '#FFF0F0',
          borderWidth: 1.5,
          borderColor: colors.red,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          danger && { color: colors.red },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
