import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';
import { showAlert } from '../lib/alert';

export default function EventDetailScreen({
  event,
  goTo,
  previousScreen,
  joinedIds = [],
  leaveEvent,
}) {
  if (!event) return null;

  const eventCode = event.code || event.event_code || '';

  const handleLeave = () => {
    showAlert(
      'Leave Event',
      `Are you sure you want to leave "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Event',
          style: 'destructive',
          onPress: () => {
            if (leaveEvent) {
              leaveEvent(event);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => goTo(previousScreen)}>
        <Text style={{ fontSize: 30, color: colors.navy, marginBottom: 15 }}>‹</Text>
      </TouchableOpacity>

      <View style={{
        backgroundColor: colors.yellowLight, borderRadius: 24,
        alignItems: 'center', padding: 30, marginBottom: 20,
      }}>
        {(!event.emoji || event.emoji === '🐥') ? (
          <LogoIcon size={90} />
        ) : (
          <Text style={{ fontSize: 90 }}>{event.emoji}</Text>
        )}
        <Text style={[styles.title, { fontSize: 23, textAlign: 'center', marginTop: 12 }]}>
          {event.title}
        </Text>
      </View>

      {/* กล่องแสดงรหัสอีเวนต์สำหรับให้เพื่อนใช้เข้าร่วม */}
      {!!eventCode && (
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 18,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: colors.yellow,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 13, color: colors.gray, fontWeight: '700', marginBottom: 6 }}>
            🔑 EVENT CODE (รหัสสำหรับแชร์ให้เพื่อน)
          </Text>
          <Text style={{
            fontSize: 28,
            fontWeight: '900',
            color: colors.navy,
            letterSpacing: 4,
          }}>
            {eventCode}
          </Text>
          <Text style={{ fontSize: 12, color: colors.gray, marginTop: 6, textAlign: 'center' }}>
            เพื่อนสามารถนำรหัสนี้ไปใส่ในหน้า Join Event เพื่อเข้าร่วมได้เลย
          </Text>
        </View>
      )}

      <View style={{
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <Text style={{ color: colors.navy, fontSize: 16, paddingVertical: 10 }}>
          🗓️  {event.date}
        </Text>
        <Text style={{ color: colors.navy, fontSize: 16, paddingVertical: 10 }}>
          📍  {event.place}
        </Text>
        <Text style={{ color: colors.navy, fontSize: 16, paddingVertical: 10 }}>
          👥  {event.members || 1} people
        </Text>
      </View>

      {/* ปุ่มออกจากอีเวนต์ */}
      <AppButton
        title="🚪  Leave Event"
        danger
        onPress={handleLeave}
      />

      <AppButton
        title="Go Back"
        light
        onPress={() => goTo(previousScreen)}
      />
    </ScrollView>
  );
}
