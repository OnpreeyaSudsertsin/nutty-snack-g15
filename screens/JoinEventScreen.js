import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';

export default function JoinEventScreen({
  goTo,
  events,
  joinedIds,
  joinEvent,
  openDetail,
}) {
  const [eventCode, setEventCode] = useState('');

  const handleJoin = () => {
    const code = eventCode.trim().toUpperCase();

    // 1. ตรวจสอบว่ากรอกรหัสหรือยัง
    if (!code) {
      Alert.alert('Missing Code', 'Please enter an event code.');
      return;
    }

    // 2. ค้นหา Event จากรหัส (รองรับทั้งฟิลด์ code และ event_code)
    const event = events.find(
      (item) =>
        item.code?.toUpperCase() === code ||
        item.event_code?.toUpperCase() === code
    );

    if (!event) {
      Alert.alert(
        'Event Not Found',
        'Invalid event code. Please check and try again.'
      );
      return;
    }

    // 3. ตรวจสอบว่าเคย Join แล้วหรือยัง
    if (joinedIds.includes(String(event.id))) {
      Alert.alert(
        'Already Joined',
        'You have already joined this event.'
      );
      openDetail(event, 'JoinCode');
      return;
    }

    // 4. บันทึกการเข้าร่วม
    joinEvent(event);

    // 5. ไปหน้า Event
    goTo('Event');
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => goTo('Home')}>
          <Text style={{
            fontSize: 30,
            color: colors.navy,
            marginBottom: 25,
          }}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Text style={{ fontSize: 85 }}>🔗</Text>
          <Text style={[styles.title, { marginTop: 15 }]}>
            Join an Event
          </Text>
          <Text style={[
            styles.subtitle,
            { textAlign: 'center', lineHeight: 22 },
          ]}>
            Enter the event code shared by your friends
            to join their adventure!
          </Text>
        </View>

        <Text style={{
          color: colors.navy,
          fontWeight: '700',
          marginBottom: 10,
        }}>
          Event Code
        </Text>

        <InputField
          placeholder="Enter your event code"
          value={eventCode}
          onChangeText={setEventCode}
        />

        <AppButton
          title="Join Event  →"
          onPress={handleJoin}
        />

        <AppButton
          title="Cancel"
          light
          onPress={() => goTo('Home')}
        />

        <Text style={{
          textAlign: 'center',
          color: colors.gray,
          marginTop: 20,
          lineHeight: 21,
        }}>
          Don't have a code? Ask the event creator
          to share it with you.
        </Text>

        <View style={{ alignItems: 'center', marginTop: 25 }}>
          <LogoIcon size={55} />
        </View>
      </ScrollView>
    </View>
  );
}
