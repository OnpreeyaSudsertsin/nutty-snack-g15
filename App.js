import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import EventScreen from './screens/EventScreen';
import ProfileScreen from './screens/ProfileScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import JoinEventScreen from './screens/JoinEventScreen';

import { styles } from './theme';
import { supabase } from './lib/supabase';
import { showAlert } from './lib/alert';

// รหัสอีเวนต์ตั้งต้นที่มีอยู่แล้วทั้งหมด (นับว่าเข้าร่วมแล้วโดยอัตโนมัติหากยังไม่เคยกด Leave)
const DEFAULT_JOINED_CODES = ['BEACH01', 'CAFE002', 'MOVIE003', 'KHAI004'];

// ตัวอย่างอีเวนต์เริ่มต้น (fallback ในกรณีที่ยังออฟไลน์)
const initialEvents = [
  {
    id: '1',
    title: 'Beach Trip with Friends 🏖️',
    date: 'Sat, Nov 15',
    place: 'Pattaya',
    emoji: '🏝️',
    members: 3,
    code: 'BEACH01',
    event_code: 'BEACH01',
  },
  {
    id: '2',
    title: 'Cafe Hopping ☕',
    date: 'Sun, Oct 29',
    place: 'Various Cafes',
    emoji: '☕',
    members: 2,
    code: 'CAFE002',
    event_code: 'CAFE002',
  },
  {
    id: '3',
    title: 'Movie Night 🎬',
    date: 'Wed, Nov 1',
    place: 'Cineplex 8',
    emoji: '🎬',
    members: 5,
    code: 'MOVIE003',
    event_code: 'MOVIE003',
  },
  {
    id: '4',
    title: 'Khao Yai Getaway 🌲',
    date: 'Fri, Dec 20',
    place: 'Khao Yai',
    emoji: '🌲',
    members: 4,
    code: 'KHAI004',
    event_code: 'KHAI004',
  },
];

export default function App() {
  const [screen, setScreen] = useState('Login');
  const [previousScreen, setPreviousScreen] = useState('Home');

  const [user, setUser] = useState({
    id: null,
    name: '',
    email: '',
  });

  const [events, setEvents] = useState(initialEvents);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);

  // รายการอีเวนต์ที่ Joined, Created, และ Left (ออกจากอีเวนต์แล้ว)
  const [joinedIds, setJoinedIds] = useState(['1', '2', '3', '4', '5', '6', '7', '8']);
  const [createdIds, setCreatedIds] = useState([]);
  const [leftIds, setLeftIds] = useState([]);

  // ใช้ Ref เพื่อเก็บ leftIds ล่าสุด ป้องกัน race condition ใน realtime
  const leftIdsRef = useRef([]);
  leftIdsRef.current = leftIds;

  // ตรวจสอบสถานะการล็อกอินจาก Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const displayName =
          session.user.user_metadata?.display_name ||
          session.user.email?.split('@')[0] ||
          'Amy';
        setUser({
          id: session.user.id,
          name: displayName,
          email: session.user.email || '',
        });
        setScreen('Home');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const displayName =
          session.user.user_metadata?.display_name ||
          session.user.email?.split('@')[0] ||
          'Amy';
        setUser({
          id: session.user.id,
          name: displayName,
          email: session.user.email || '',
        });
      } else {
        setUser({ id: null, name: '', email: '' });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // โหลดรายการ joinedIds, createdIds, leftIds จาก AsyncStorage เมื่อเปิดแอป
  useEffect(() => {
    const loadStoredIds = async () => {
      try {
        const storedLeft = await AsyncStorage.getItem('left_event_ids');
        let parsedLeft = [];
        if (storedLeft) {
          parsedLeft = JSON.parse(storedLeft);
          setLeftIds(parsedLeft);
        }

        const storedJoined = await AsyncStorage.getItem('joined_event_ids');
        if (storedJoined) {
          const parsed = JSON.parse(storedJoined);
          setJoinedIds(parsed.filter((id) => !parsedLeft.includes(id)));
        } else {
          setJoinedIds(['1', '2', '3', '4', '5', '6', '7', '8'].filter((id) => !parsedLeft.includes(id)));
        }

        const storedCreated = await AsyncStorage.getItem('created_event_ids');
        if (storedCreated) {
          const parsed = JSON.parse(storedCreated);
          setCreatedIds(parsed.filter((id) => !parsedLeft.includes(id)));
        }
      } catch (err) {
        console.warn('Load stored IDs error:', err);
      }
    };
    loadStoredIds();
  }, []);

  // ดึงข้อมูลอีเวนต์จาก Supabase
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Could not fetch events from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const formatted = data.map((item) => {
          const resolvedCode = item.event_code || item.code || '';
          return {
            id: String(item.id),
            title: item.title,
            date: item.date,
            place: item.place,
            emoji: item.emoji || '🐥',
            members: Number(item.members) || 1,
            code: resolvedCode,
            event_code: resolvedCode,
            host_id: item.host_id,
          };
        });

        setEvents(formatted);

        const currentLeft = leftIdsRef.current;

        // นำอีเวนต์ตั้งต้นทั้งหมดมารวมใน joinedIds (ยกเว้นไอดีที่เคยกด Leave ไปแล้ว)
        const defaultJoined = formatted
          .filter((item) => {
            const c = (item.code || '').toUpperCase();
            return DEFAULT_JOINED_CODES.includes(c);
          })
          .map((item) => String(item.id))
          .filter((id) => !currentLeft.includes(id));

        // อีเวนต์ที่ user ปัจจุบันสร้างไว้
        const userCreated = user?.id
          ? formatted
              .filter((item) => item.host_id === user.id)
              .map((item) => String(item.id))
              .filter((id) => !currentLeft.includes(id))
          : [];

        if (userCreated.length > 0) {
          setCreatedIds((old) => [...new Set([...old, ...userCreated])]);
        }

        setJoinedIds((oldIds) => {
          const filteredOld = oldIds.filter((id) => !currentLeft.includes(id));
          const updated = [...new Set([...filteredOld, ...defaultJoined, ...userCreated])];
          AsyncStorage.setItem('joined_event_ids', JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } catch (err) {
      console.warn('Fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // ดึงข้อมูลเมื่อเริ่มแอป และเชื่อม Realtime กับ Supabase
  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // เปิดหน้า Event Detail
  const openDetail = (event, from = 'Home') => {
    setSelectedEvent(event);
    setPreviousScreen(from);
    setScreen('Detail');
  };

  // เข้าร่วมอีเวนต์ (เมื่อ Join แล้วจะบันทึก id เข้า joinedIds)
  const joinEvent = async (event) => {
    const eventIdStr = String(event.id);
    if (joinedIds.includes(eventIdStr)) {
      showAlert('Already Joined', 'You have already joined this event.');
      return;
    }

    // ลบออกจาก leftIds หากเคยออกจากอีเวนต์นี้
    const updatedLeft = leftIds.filter((id) => id !== eventIdStr);
    setLeftIds(updatedLeft);
    AsyncStorage.setItem('left_event_ids', JSON.stringify(updatedLeft)).catch(() => {});

    const updatedJoinedIds = [...joinedIds, eventIdStr];
    setJoinedIds(updatedJoinedIds);
    AsyncStorage.setItem('joined_event_ids', JSON.stringify(updatedJoinedIds)).catch(() => {});

    const newMembers = (Number(event.members) || 1) + 1;

    // อัปเดตไปยัง Supabase
    try {
      await supabase
        .from('events')
        .update({ members: newMembers })
        .eq('id', event.id);
    } catch (err) {
      console.warn('Supabase member update error:', err);
    }

    setEvents((oldEvents) =>
      oldEvents.map((item) =>
        String(item.id) === eventIdStr
          ? {
              ...item,
              members: newMembers,
            }
          : item
      )
    );

    showAlert('Success!', `You joined ${event.title}`);
  };

  // ออกจากอีเวนต์ (Leave Event)
  const leaveEvent = async (event) => {
    const eventIdStr = String(event.id);

    // 1. บันทึกไอดีนี้เข้า leftIds เพื่อไม่ให้โหลดกลับมาอีก
    const updatedLeftIds = [...new Set([...leftIds, eventIdStr])];
    setLeftIds(updatedLeftIds);
    AsyncStorage.setItem('left_event_ids', JSON.stringify(updatedLeftIds)).catch(() => {});

    // 2. นำออกจาก joinedIds ทันที (หน้า Home, Event, และ Profile จะลดลงทันที)
    const updatedJoinedIds = joinedIds.filter((id) => id !== eventIdStr);
    setJoinedIds(updatedJoinedIds);
    AsyncStorage.setItem('joined_event_ids', JSON.stringify(updatedJoinedIds)).catch(() => {});

    // 3. นำออกจาก createdIds (ถ้ามี)
    const updatedCreatedIds = createdIds.filter((id) => id !== eventIdStr);
    setCreatedIds(updatedCreatedIds);
    AsyncStorage.setItem('created_event_ids', JSON.stringify(updatedCreatedIds)).catch(() => {});

    // 4. ลดจำนวนสมาชิกลง 1 คนใน Supabase
    const newMembers = Math.max(1, (Number(event.members) || 1) - 1);
    try {
      await supabase
        .from('events')
        .update({ members: newMembers })
        .eq('id', event.id);
    } catch (err) {
      console.warn('Supabase member decrement error:', err);
    }

    // 5. อัปเดต state
    setEvents((oldEvents) =>
      oldEvents.map((item) =>
        String(item.id) === eventIdStr
          ? { ...item, members: newMembers }
          : item
      )
    );

    // 6. ย้อนกลับไปหน้าที่เปิดมาก่อนหน้าทันที
    setScreen(previousScreen || 'Home');
    showAlert('Left Event', `คุณได้ออกจาก "${event.title}" เรียบร้อยแล้ว`);
  };

  // สร้างอีเวนต์ใหม่และบันทึกลง Supabase
  const handleCreateEvent = async (eventData) => {
    const finalCode = (
      eventData.code ||
      Math.random().toString(36).slice(2, 8)
    ).toUpperCase();

    const newEventPayload = {
      title: eventData.title,
      date: eventData.date,
      place: eventData.place,
      emoji: eventData.emoji || '🐥',
      members: 1,
      code: finalCode,
      event_code: finalCode,
      host_id: user?.id || null,
    };

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([newEventPayload])
        .select()
        .single();

      if (error) {
        console.warn('Error inserting to Supabase:', error.message);
        // Fallback บันทึกในเครื่อง
        const localId = String(Date.now());
        const localEvent = { ...newEventPayload, id: localId };
        setEvents((old) => [localEvent, ...old]);

        const updatedCreated = [...createdIds, localId];
        setCreatedIds(updatedCreated);
        AsyncStorage.setItem('created_event_ids', JSON.stringify(updatedCreated)).catch(() => {});

        const updatedJoined = [...new Set([...joinedIds, localId])];
        setJoinedIds(updatedJoined);
        AsyncStorage.setItem('joined_event_ids', JSON.stringify(updatedJoined)).catch(() => {});

        showAlert(
          'Event Created! 🎉',
          `Share this code with your friends:\n👉 ${finalCode}`
        );
      } else {
        const resolvedCode = data.event_code || data.code || finalCode;
        const createdEvent = {
          ...data,
          id: String(data.id),
          code: resolvedCode,
          event_code: resolvedCode,
        };
        setEvents((old) => [createdEvent, ...old.filter((e) => String(e.id) !== createdEvent.id)]);

        const updatedCreated = [...createdIds, createdEvent.id];
        setCreatedIds(updatedCreated);
        AsyncStorage.setItem('created_event_ids', JSON.stringify(updatedCreated)).catch(() => {});

        const updatedJoined = [...new Set([...joinedIds, createdEvent.id])];
        setJoinedIds(updatedJoined);
        AsyncStorage.setItem('joined_event_ids', JSON.stringify(updatedJoined)).catch(() => {});

        showAlert(
          'Event Created! 🎉',
          `Share this code with your friends:\n👉 ${resolvedCode}`
        );
      }
    } catch (err) {
      console.warn('Create event error:', err);
    }

    setScreen('Home');
  };

  // ข้อมูลและฟังก์ชันที่ส่งให้ทุกหน้า
  const shared = {
    goTo: setScreen,
    user,
    setUser,
    events,
    setEvents,
    openDetail,
    joinedIds,
    createdIds,
    joinEvent,
    leaveEvent,
    refreshing,
    onRefresh,
    fetchEvents,
  };

  return (
    <View style={styles.webContainer}>
      <SafeAreaView style={styles.phoneContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF9E9" />

        {screen === 'Login' && <LoginScreen {...shared} />}

        {screen === 'SignUp' && <SignUpScreen {...shared} />}

        {screen === 'Home' && <HomeScreen {...shared} />}

        {screen === 'Event' && <EventScreen {...shared} />}

        {screen === 'Profile' && <ProfileScreen {...shared} />}

        {screen === 'Create' && (
          <CreateEventScreen
            {...shared}
            onCreate={handleCreateEvent}
          />
        )}

        {screen === 'Detail' && selectedEvent && (
          <EventDetailScreen
            {...shared}
            event={selectedEvent}
            previousScreen={previousScreen}
          />
        )}

        {screen === 'EditProfile' && <EditProfileScreen {...shared} />}

        {screen === 'JoinCode' && <JoinEventScreen {...shared} />}
      </SafeAreaView>
    </View>
  );
}
