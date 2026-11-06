
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles, colors } from '../theme';

export default function EventCard({ event, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.eventCard}
      onPress={onPress}
    >
      <View style={styles.eventImage}>
        <Text style={{ fontSize: 37 }}>{event.emoji || '🐥'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{
          color: colors.navy, fontSize: 13,
          fontWeight: '800', marginBottom: 7,
        }}>
          {event.title}
        </Text>
        <Text style={{ color: colors.gray, fontSize: 11, marginBottom: 4 }}>
          🗓️ {event.date}
        </Text>
        <Text style={{ color: colors.gray, fontSize: 11 }}>
          📍 {event.place}
        </Text>
      </View>
      <Text style={{ color: colors.navy, fontSize: 27 }}>›</Text>
    </TouchableOpacity>
  );
}
