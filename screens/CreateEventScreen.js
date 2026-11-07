import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';

const generateRandomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CreateEventScreen({ goTo, onCreate }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [code, setCode] = useState(generateRandomCode());

  const submit = () => {
    if (!title.trim() || !date.trim() || !place.trim() || !code.trim()) {
      Alert.alert('Missing information', 'Please fill in all fields including the event code.');
      return;
    }

    onCreate({
      title: title.trim(),
      date: date.trim(),
      place: place.trim(),
      emoji: '🐥',
      code: code.trim().toUpperCase(),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => goTo('Home')}>
        <Text style={{ fontSize: 30, color: colors.navy, marginBottom: 15 }}>‹</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.title}>Create Event </Text>
        <LogoIcon size={30} />
      </View>
      <Text style={[styles.subtitle, { marginBottom: 25 }]}>
        Let's plan something fun!
      </Text>

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 8 }}>
        Event name
      </Text>
      <InputField
        placeholder="e.g. Weekend Cafe Hopping"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 8 }}>
        Date
      </Text>
      <InputField
        placeholder="e.g. Sat, Nov 15"
        value={date}
        onChangeText={setDate}
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 8 }}>
        Location
      </Text>
      <InputField
        placeholder="e.g. Bangkok"
        value={place}
        onChangeText={setPlace}
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 8 }}>
        Event Code (รหัสสำหรับให้เพื่อนกดเข้า)
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <InputField
            placeholder="e.g. PARTY01"
            value={code}
            onChangeText={(txt) => setCode(txt.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity
          onPress={() => setCode(generateRandomCode())}
          style={{
            height: 52,
            paddingHorizontal: 14,
            backgroundColor: colors.yellowLight,
            borderRadius: 13,
            borderWidth: 1.3,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 13,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.navy }}>
            🎲 สุ่มใหม่
          </Text>
        </TouchableOpacity>
      </View>

      <AppButton title="Create Event     →" onPress={submit} />
      <AppButton title="Cancel" light onPress={() => goTo('Home')} />
    </ScrollView>
  );
}
