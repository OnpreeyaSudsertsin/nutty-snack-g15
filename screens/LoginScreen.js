import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alert';

export default function LoginScreen({ goTo, user, setUser }) {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const login = async () => {
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter both email and password.';
      setErrorMessage(msg);
      showAlert('Missing Information', msg);
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      // 1. Supabase app_users table
      try {
        const { data: dbUser } = await supabase
          .from('app_users')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', password)
          .single();

        if (dbUser) {
          const loggedUser = {
            id: String(dbUser.id),
            name: dbUser.name,
            email: dbUser.email,
          };
          await AsyncStorage.setItem('current_app_user', JSON.stringify(loggedUser));
          setUser(loggedUser);
          goTo('Home');
          return;
        }
      } catch (e) {}

      // 2. AsyncStorage
      const storedUsersRaw = await AsyncStorage.getItem('app_registered_users');
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      const matchedUser = storedUsers.find(
        (u) => u.email === cleanEmail && u.password === password
      );

      if (matchedUser) {
        await AsyncStorage.setItem('current_app_user', JSON.stringify(matchedUser));
        setUser({
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
        });
        goTo('Home');
        return;
      }

      // 3. Supabase Auth
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });
        if (authData?.user) {
          const displayName =
            authData.user.user_metadata?.display_name || cleanEmail.split('@')[0];
          const loggedUser = {
            id: authData.user.id,
            name: displayName,
            email: authData.user.email,
          };
          await AsyncStorage.setItem('current_app_user', JSON.stringify(loggedUser));
          setUser(loggedUser);
          goTo('Home');
          return;
        }
      } catch (e) {}

      const msg = 'Invalid email or password.';
      setErrorMessage(msg);
      showAlert('Login Failed', msg);
    } catch (err) {
      const msg = err.message || 'An error occurred. Please try again.';
      setErrorMessage(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { justifyContent: 'center' }]}>
      <View style={{ alignItems: 'center', marginBottom: 25 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.title, { fontSize: 43 }]}>Nutty </Text>
          <LogoIcon size={44} />
        </View>
        <Text style={styles.subtitle}>Ready to hang out?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
          <Text style={{ fontSize: 35 }}>☀️ </Text>
          <LogoIcon size={36} />
          <Text style={{ fontSize: 35 }}> ☀️</Text>
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
        placeholder="Enter your password"
        value={password}
        onChangeText={(txt) => {
          setPassword(txt);
          if (errorMessage) setErrorMessage('');
        }}
        secureTextEntry
      />

      <AppButton
        title={loading ? 'Signing in...' : 'Sign In     →'}
        onPress={login}
      />

      <Text style={{ textAlign: 'center', marginTop: 25, color: colors.navy, fontSize: 15 }}>
        Don't have an account?{' '}
        <Text
          style={{ color: colors.red, textDecorationLine: 'underline', fontWeight: '800' }}
          onPress={() => goTo('SignUp')}
        >
          Sign Up
        </Text>
      </Text>

      <View style={{ alignItems: 'center', marginTop: 25 }}>
        <LogoIcon size={70} />
      </View>
    </ScrollView>
  );
}
