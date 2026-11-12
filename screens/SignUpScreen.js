import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alert';

export default function SignUpScreen({ goTo, setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const signup = async () => {
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      const msg = 'Please fill in all fields.';
      setErrorMessage(msg);
      showAlert('Missing Information', msg);
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      let supabaseUserId = null;

      try {
        const { data: dbUser } = await supabase
          .from('app_users')
          .insert([
            {
              name: cleanName,
              email: cleanEmail,
              password: password,
            },
          ])
          .select()
          .single();

        if (dbUser?.id) {
          supabaseUserId = String(dbUser.id);
        }
      } catch (e) {}

      const storedUsersRaw = await AsyncStorage.getItem('app_registered_users');
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      const newUser = {
        id: supabaseUserId || String(Date.now()),
        name: cleanName,
        email: cleanEmail,
        password: password,
      };

      const updatedUsers = [
        newUser,
        ...storedUsers.filter((u) => u.email !== cleanEmail),
      ];
      await AsyncStorage.setItem('app_registered_users', JSON.stringify(updatedUsers));
      await AsyncStorage.setItem('current_app_user', JSON.stringify(newUser));

      setUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      });

      showAlert('Account Created! 🎉', `Welcome, ${cleanName}!`);
      goTo('Home');
    } catch (err) {
      const msg = err.message || 'An error occurred. Please try again.';
      setErrorMessage(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => goTo('Login')}>
        <Text style={{ fontSize: 18, color: colors.navy, marginBottom: 15 }}>
          ‹ Back
        </Text>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.title, { fontSize: 38 }]}>Sign Up </Text>
          <LogoIcon size={38} />
        </View>
        <Text style={styles.subtitle}>Create your profile to get started</Text>
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <LogoIcon size={50} />
        </View>
      </View>

      {!!errorMessage && (
        <View style={{
          backgroundColor: '#FFF0F0',
          borderWidth: 1.2,
          borderColor: colors.red,
          padding: 14,
          borderRadius: 14,
          marginBottom: 16,
        }}>
          <Text style={{ color: colors.red, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>
            ⚠️ {errorMessage}
          </Text>
        </View>
      )}

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        Display Name
      </Text>
      <InputField
        placeholder="e.g. Amy"
        value={name}
        onChangeText={(txt) => {
          setName(txt);
          if (errorMessage) setErrorMessage('');
        }}
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        Email or Username
      </Text>
      <InputField
        placeholder="e.g. amy@example.com"
        value={email}
        onChangeText={(txt) => {
          setEmail(txt);
          if (errorMessage) setErrorMessage('');
        }}
        autoCapitalize="none"
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        Password
      </Text>
      <InputField
        placeholder="Create a password"
        value={password}
        onChangeText={(txt) => {
          setPassword(txt);
          if (errorMessage) setErrorMessage('');
        }}
        secureTextEntry
      />

      <AppButton
        title={loading ? 'Creating...' : 'Sign Up     →'}
        onPress={signup}
      />

      <Text style={{ textAlign: 'center', marginTop: 25, color: colors.navy, fontSize: 15 }}>
        Already have an account?{' '}
        <Text
          style={{ color: colors.red, textDecorationLine: 'underline', fontWeight: '800' }}
          onPress={() => goTo('Login')}
        >
          Sign In
        </Text>
      </Text>
    </ScrollView>
  );
}
