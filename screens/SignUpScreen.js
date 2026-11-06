import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
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
      const msg = 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
      setErrorMessage(msg);
      showAlert('ข้อมูลไม่ครบถ้วน', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'รหัสผ่านเข้าแอปต้องมีอย่างน้อย 6 ตัวอักษร (เช่น 123456)';
      setErrorMessage(msg);
      showAlert('รหัสผ่านสั้นเกินไป', msg);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            display_name: name.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        showAlert('สมัครสมาชิกไม่สำเร็จ', error.message);
        return;
      }

      if (data?.session) {
        setUser({
          id: data.user.id,
          name: name.trim(),
          email: email.trim(),
        });
        showAlert('ยินดีต้อนรับ! 🎉', `สร้างบัญชีสำหรับ ${name.trim()} เรียบร้อยแล้ว`);
        goTo('Home');
      } else if (data?.user) {
        showAlert(
          'สร้างบัญชีสำเร็จ! 🎉',
          'สร้างบัญชีเรียบร้อยแล้วครับ หากปิด Confirm email ใน Supabase แล้ว สามารถเข้าสู่ระบบได้ทันที',
          [{ text: 'ไปหน้าเข้าสู่ระบบ', onPress: () => goTo('Login') }]
        );
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
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => goTo('Login')}>
        <Text style={{ fontSize: 18, color: colors.navy, marginBottom: 15 }}>
          ‹ ย้อนกลับ
        </Text>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={[styles.title, { fontSize: 38 }]}>สร้างบัญชีเข้าแอป 🐥</Text>
        <Text style={styles.subtitle}>ตั้งชื่อและรหัสผ่านสำหรับเข้าใช้งานของตัวเอง</Text>
        <Text style={{ fontSize: 50, marginVertical: 8 }}>🐥</Text>
      </View>

      {/* ข้อความแจ้งเตือน Error */}
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
        ชื่อที่ต้องการให้แสดงในแอป
      </Text>
      <InputField
        placeholder="เช่น Amy หรือ Onpreeya"
        value={name}
        onChangeText={(txt) => {
          setName(txt);
          if (errorMessage) setErrorMessage('');
        }}
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        อีเมลสำหรับใช้ล็อกอิน
      </Text>
      <InputField
        placeholder="เช่น yourname@gmail.com"
        value={email}
        onChangeText={(txt) => {
          setEmail(txt);
          if (errorMessage) setErrorMessage('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        รหัสผ่านสำหรับเข้าแอป (ตั้งเองได้เลย ไม่ใช่รหัสผ่านอีเมลจริง)
      </Text>
      <InputField
        placeholder="ตั้งรหัสเข้าแอป (อย่างน้อย 6 ตัว เช่น 123456)"
        value={password}
        onChangeText={(txt) => {
          setPassword(txt);
          if (errorMessage) setErrorMessage('');
        }}
        secureTextEntry
      />

      <AppButton
        title={loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชีเข้าแอป     →'}
        onPress={signup}
      />

      <Text style={{ textAlign: 'center', marginTop: 25, color: colors.navy, fontSize: 15 }}>
        มีบัญชีอยู่แล้วใช่ไหม?{' '}
        <Text
          style={{ color: colors.red, textDecorationLine: 'underline', fontWeight: '800' }}
          onPress={() => goTo('Login')}
        >
          เข้าสู่ระบบ (Sign In)
        </Text>
      </Text>
    </ScrollView>
  );
}
