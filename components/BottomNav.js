
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles, colors } from '../theme';

const items = [
  { name: 'Event', icon: '▦' },
  { name: 'Home', icon: '⌂' },
  { name: 'Profile', icon: '♙' },
];

export default function BottomNav({ current, goTo }) {
  return (
    <View style={styles.nav}>
      {items.map(item => (
        <TouchableOpacity
          key={item.name}
          activeOpacity={0.6}
          onPress={() => goTo(item.name)}
          style={[
            styles.navButton,
            current === item.name && styles.navActive,
          ]}
        >
          <Text style={{ fontSize: 25, color: colors.navy }}>
            {item.icon}
          </Text>
          <Text style={{ fontSize: 11, color: colors.navy }}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
