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
      const msg = 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
      setErrorMessage(msg);
      showAlert('ข้อมูลไม่ครบถ้วน', msg);
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      let supabaseUserId = null;

      // 1. ลองบันทึกลงตาราง app_users ใน Supabase (ถ้ามีตาราง)
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
      } catch (e) {
        // หากยังไม่ได้รัน SQL สร้างตาราง app_users ก็ไม่เป็นไร
      }

      // 2. บันทึกบัญชีลงในเครื่อง (AsyncStorage) เพื่อให้ล็อกอินได้ทันทีโดยไม่ติด Rate Limit
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

      // 3. บันทึก Session การล็อกอินปัจจุบัน
      await AsyncStorage.setItem('current_app_user', JSON.stringify(newUser));

      setUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      });

      showAlert('สร้างบัญชีสำเร็จ! 🎉', `ยินดีต้อนรับ ${cleanName}`);
      goTo('Home');
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.title, { fontSize: 38 }]}>สร้างบัญชีเข้าแอป </Text>
          <LogoIcon size={38} />
        </View>
        <Text style={styles.subtitle}>ตั้งชื่อและรหัสผ่านสำหรับเข้าใช้งานของตัวเอง</Text>
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <LogoIcon size={50} />
        </View>
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
        อีเมลหรือชื่อผู้ใช้สำหรับล็อกอิน
      </Text>
      <InputField
        placeholder="เช่น yourname@gmail.com หรือ onpreeya"
        value={email}
        onChangeText={(txt) => {
          setEmail(txt);
          if (errorMessage) setErrorMessage('');
        }}
        autoCapitalize="none"
      />

      <Text style={{ color: colors.navy, fontWeight: '700', marginBottom: 6 }}>
        รหัสผ่านเข้าแอป (ตั้งเองได้เลย ไม่ใช่รหัสผ่านอีเมลจริง)
      </Text>
      <InputField
        placeholder="ตั้งรหัสเข้าแอป เช่น 1234 หรือ mypass"
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
