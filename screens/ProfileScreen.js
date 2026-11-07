import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import BottomNav from '../components/BottomNav';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alert';

export default function ProfileScreen({
  goTo, user, events, joinedIds = [], createdIds = [],
}) {
  const menu = [
    ['♙', 'Edit Profile', 'EditProfile'],
    ['♧', 'Notifications', 'Notifications'],
    ['ⓘ', 'Help & Support', 'Help'],
    ['⚙', 'Settings', 'Settings'],
  ];

  const handleLogout = () => {
    showAlert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.warn('Sign out error:', err);
            }
            goTo('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => goTo('Settings')}>
            <Text style={{ fontSize: 26, color: colors.navy }}>⚙</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Text style={{ fontSize: 85 }}>👩🏻</Text>
          <Text style={[styles.title, { fontSize: 23, marginTop: 8 }]}>
            {user.name || 'Amy'} ✎
          </Text>
          <Text style={styles.subtitle}>{user.email || 'amy@example.com'}</Text>
          <LogoIcon size={36} style={{ marginTop: 8 }} />
        </View>

        <View style={{
          flexDirection: 'row', backgroundColor: colors.white,
          paddingVertical: 15, borderRadius: 15, marginBottom: 20,
        }}>
          {[
            [joinedIds.length, 'Joined'],
            [createdIds.length, 'Created'],
            [0, 'Completed'],
          ].map(([number, label]) => (
            <View key={label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.navy }}>
                {number}
              </Text>
              <Text style={{ fontSize: 11, color: colors.navy }}>{label}</Text>
            </View>
          ))}
        </View>

        {menu.map(([icon, label, target]) => (
          <TouchableOpacity
            key={label}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 17, borderBottomWidth: 1,
              borderColor: colors.border,
            }}
            onPress={() => {
              if (target === 'EditProfile') {
                goTo(target);
              } else {
                showAlert(label, 'This feature is not connected yet.');
              }
            }}
          >
            <Text style={{ fontSize: 22, width: 42, color: colors.navy }}>{icon}</Text>
            <Text style={{ flex: 1, color: colors.navy, fontSize: 15 }}>{label}</Text>
            <Text style={{ color: colors.navy, fontSize: 24 }}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={{ paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between' }}
          onPress={handleLogout}
        >
          <Text style={{ color: colors.red, fontSize: 15, fontWeight: '700' }}>⇥  Log Out</Text>
          <Text style={{ color: colors.navy, fontSize: 24 }}>›</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav current="Profile" goTo={goTo} />
    </View>
  );
}
