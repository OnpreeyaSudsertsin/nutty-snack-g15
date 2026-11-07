import React from 'react';
import { Image } from 'react-native';

export default function LogoIcon({ size = 32, style }) {
  return (
    <Image
      source={require('../assets/logo.png')}
      style={[
        {
          width: size,
          height: size,
          resizeMode: 'contain',
        },
        style,
      ]}
    />
  );
}
