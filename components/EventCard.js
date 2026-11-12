import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles, colors } from '../theme';
import LogoIcon from './LogoIcon';

export default function EventCard({ event, onPress }) {
  const isDuck = !event.emoji || event.emoji === '🐥';
  const isFinalized = Boolean(event.finalDate || event.status === 'finalized');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.eventCard}
      onPress={onPress}
    >
      <View style={styles.eventImage}>
        {isDuck ? (
          <LogoIcon size={37} />
        ) : (
          <Text style={{ fontSize: 37 }}>{event.emoji}</Text>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.navy,
              fontSize: 14,
              fontWeight: '800',
            }}
          >
            {event.title}
          </Text>
          {isFinalized ? (
            <View
              style={{
                backgroundColor: '#D1FADF',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 4,
              }}
            >
              <Text style={{ color: '#027A48', fontSize: 10, fontWeight: '800' }}>
                Finalized
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.yellowLight,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 4,
              }}
            >
              <Text style={{ color: colors.navy, fontSize: 10, fontWeight: '800' }}>
                Voting
              </Text>
            </View>
          )}
        </View>

        <Text style={{ color: colors.gray, fontSize: 11, marginBottom: 3 }}>
          🗓️ {isFinalized && event.finalDate ? `Date: ${event.finalDate}` : event.date}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.gray, fontSize: 11 }}>
          📍 {event.place || 'Various Locations'}
        </Text>
      </View>
      <Text style={{ color: colors.navy, fontSize: 27, marginLeft: 4 }}>›</Text>
    </TouchableOpacity>
  );
}
