import React, { useState } from 'react';
import { Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import { styles, colors } from '../theme';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen({ goTo, user, setUser }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Missing information', 'Please enter your name.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: name.trim() },
      });

      if (error) {
        Alert.alert('Update Failed', error.message);
        return;
      }

      setUser((old) => ({ ...old, name: name.trim() }));
      Alert.alert('Success', 'Profile updated successfully!');
      goTo('Profile');
    } catch (err) {
      setUser((old) => ({ ...old, name: name.trim() }));
      goTo('Profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => goTo('Profile')}>
        <Text style={{ fontSize: 30, color: colors.navy }}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { marginVertical: 20 }]}>Edit Profile</Text>
      <Text style={{ color: colors.navy, marginBottom: 8, fontWeight: '700' }}>Display name</Text>
      <InputField placeholder="Your name" value={name} onChangeText={setName} />
      <Text style={{ color: colors.navy, marginBottom: 8, fontWeight: '700' }}>Email (read-only)</Text>
      <InputField
        placeholder="Email address"
        value={email}
        editable={false}
        style={{ backgroundColor: '#F0EBDD' }}
      />
      <AppButton
        title={loading ? 'Saving...' : 'Save Changes'}
        onPress={save}
      />
    </ScrollView>
  );
}
