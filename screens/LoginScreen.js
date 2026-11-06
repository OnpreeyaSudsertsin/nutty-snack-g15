import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
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
      const msg = 'กรุณากรอกทั้งอีเมลและรหัสผ่านเข้าแอป';
      setErrorMessage(msg);
      showAlert('ข้อมูลไม่ครบถ้วน', msg);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (หากยังไม่มีบัญชี ให้กด "Sign Up" ด้านล่างเพื่อตั้งรหัสเข้าใช้งานก่อนครับ)';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'บัญชีนี้ยังไม่ได้ยืนยันอีเมลใน Supabase (สามารถไปปิด Confirm email ใน Supabase Auth เพื่อให้ล็อกอินได้ทันที)';
        }
        setErrorMessage(msg);
        showAlert('เข้าสู่ระบบไม่สำเร็จ', msg);
        return;
      }

      if (data?.user) {
        const displayName =
          data.user.user_metadata?.display_name ||
          email.trim().split('@')[0];

        setUser({
          id: data.user.id,
          name: displayName,
          email: data.user.email,
        });

        goTo('Home');
      }
    } catch (err) {
      const msg = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setErrorMessage(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { justifyContent: 'center' }]}>
      <View style={{ alignItems: 'center', marginBottom: 25 }}>
        <Text style={[styles.title, { fontSize: 43 }]}>Nutty 🐥</Text>
        <Text style={styles.subtitle}>Ready to hang out?</Text>
        <Text style={{ fontSize: 35, marginTop: 12 }}>☀️ 🐥 ☀️</Text>
      </View>

      {/* กล่องแจ้งเตือน Error */}
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
        อีเมลสำหรับเข้าแอป
      </Text>
      <InputField
        placeholder="✉  example@email.com"
        value={email}
        onChangeText={(txt) => {
          setEmail(txt);
          if (errorMessage) setErrorMessage('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        รหัสผ่านเข้าแอป (ที่ตั้งไว้)
      </Text>
      <InputField
        placeholder="รหัสผ่านเข้าแอป"
        value={password}
        onChangeText={(txt) => {
          setPassword(txt);
          if (errorMessage) setErrorMessage('');
        }}
        secureTextEntry
      />

      <AppButton
        title={loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)     →'}
        onPress={login}
      />

      <Text style={{ textAlign: 'center', marginTop: 25, color: colors.navy, fontSize: 15 }}>
        ยังไม่มีบัญชีเข้าแอปใช่ไหม?{' '}
        <Text
          style={{ color: colors.red, textDecorationLine: 'underline', fontWeight: '800' }}
          onPress={() => goTo('SignUp')}
        >
          กดสมัครที่นี่ (Sign Up)
        </Text>
      </Text>

      <Text style={{ fontSize: 70, textAlign: 'center', marginTop: 25 }}>🐥</Text>
    </ScrollView>
  );
}
