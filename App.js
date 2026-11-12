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
import {
  parseEventFromSupabase,
  formatEventForSupabase,
  formatDateRange,
} from './lib/tripUtils';

export default function App() {
  const [screen, setScreen] = useState('Login');
  const [previousScreen, setPreviousScreen] = useState('Home');

  const [user, setUser] = useState({
    id: null,
    name: '',
    email: '',
  });

  // ข้อ 1: ให้เริ่มโดยไม่มี event ขึ้น เริ่มต้นเป็น array ว่าง []
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);

  // รายการอีเวนต์ที่ Joined, Created, และ Left (เริ่มต้นว่างเปล่า [])
  const [joinedIds, setJoinedIds] = useState([]);
  const [createdIds, setCreatedIds] = useState([]);
  const [leftIds, setLeftIds] = useState([]);

  // Ref เก็บ leftIds ป้องกัน race condition ใน realtime
  const leftIdsRef = useRef([]);
  leftIdsRef.current = leftIds;

  // ตรวจสอบสถานะการล็อกอิน (ทั้งจาก Supabase Auth และ AsyncStorage)
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 1. ตรวจสอบจาก AsyncStorage (สำหรับ custom login)
        const storedUserJson = await AsyncStorage.getItem('current_app_user');
        if (storedUserJson) {
          const parsedUser = JSON.parse(storedUserJson);
          if (parsedUser?.name) {
            setUser(parsedUser);
            setScreen('Home');
            return;
          }
        }

        // 2. ตรวจสอบจาก Supabase Auth Session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const displayName =
            session.user.user_metadata?.display_name ||
            session.user.email?.split('@')[0] ||
            'Amy';
          const loggedUser = {
            id: session.user.id,
            name: displayName,
            email: session.user.email || '',
          };
          setUser(loggedUser);
          setScreen('Home');
        }
      } catch (err) {
        console.warn('Check login error:', err);
      }
    };

    checkLoginStatus();

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
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // โหลดรายการ joinedIds, createdIds, leftIds ของ user ปัจจุบันจาก AsyncStorage
  useEffect(() => {
    const loadStoredIds = async () => {
      const userKey = user?.id || 'guest';
      try {
        const storedLeft = await AsyncStorage.getItem(`left_event_ids_${userKey}`);
        let parsedLeft = [];
        if (storedLeft) {
          parsedLeft = JSON.parse(storedLeft);
          setLeftIds(parsedLeft);
        }

        const storedJoined = await AsyncStorage.getItem(`joined_event_ids_${userKey}`);
        if (storedJoined) {
          const parsed = JSON.parse(storedJoined);
          setJoinedIds(parsed.filter((id) => !parsedLeft.includes(id)));
        } else {
          setJoinedIds([]);
        }

        const storedCreated = await AsyncStorage.getItem(`created_event_ids_${userKey}`);
        if (storedCreated) {
          const parsed = JSON.parse(storedCreated);
          setCreatedIds(parsed.filter((id) => !parsedLeft.includes(id)));
        } else {
          setCreatedIds([]);
        }
      } catch (err) {
        console.warn('Load stored IDs error:', err);
      }
    };

    loadStoredIds();
  }, [user?.id]);

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

      if (data) {
        const formatted = data.map((item) => parseEventFromSupabase(item));
        setEvents(formatted);

        const currentLeft = leftIdsRef.current;
        const currentUserId = user?.id;

        // ค้นหาอีเวนต์ที่ user ปัจจุบันเป็น Host สร้าง
        const userCreated = currentUserId
          ? formatted
              .filter(
                (item) =>
                  String(item.host_id) === String(currentUserId) &&
                  !currentLeft.includes(String(item.id))
              )
              .map((item) => String(item.id))
          : [];

        // ค้นหาอีเวนต์ที่ user ปัจจุบันร่วมโหวตหรือกด Join ไว้
        const userJoined = currentUserId
          ? formatted
              .filter(
                (item) =>
                  Boolean(item.memberVotes && item.memberVotes[currentUserId]) &&
                  !currentLeft.includes(String(item.id))
              )
              .map((item) => String(item.id))
          : [];

        if (userCreated.length > 0) {
          setCreatedIds((old) => {
            const merged = [...new Set([...old, ...userCreated])];
            const userKey = user?.id || 'guest';
            AsyncStorage.setItem(
              `created_event_ids_${userKey}`,
              JSON.stringify(merged)
            ).catch(() => {});
            return merged;
          });
        }

        if (userJoined.length > 0 || userCreated.length > 0) {
          setJoinedIds((old) => {
            const merged = [...new Set([...old, ...userJoined, ...userCreated])];
            const userKey = user?.id || 'guest';
            AsyncStorage.setItem(
              `joined_event_ids_${userKey}`,
              JSON.stringify(merged)
            ).catch(() => {});
            return merged;
          });
        }
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
        (payload) => {
          fetchEvents();
          // อัปเดต selectedEvent ถ้าเป็นอันที่กำลังดูอยู่
          if (payload?.new && selectedEvent && String(selectedEvent.id) === String(payload.new.id)) {
            setSelectedEvent(parseEventFromSupabase(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedEvent?.id]);

  // เปิดหน้า Event Detail
  const openDetail = (event, from = 'Home') => {
    setSelectedEvent(event);
    setPreviousScreen(from);
    setScreen('Detail');
  };

  // ข้อ 5: สมาชิกกด Join Event
  const joinEvent = async (updatedEventData, memberInfo) => {
    const eventIdStr = String(updatedEventData.id);
    const userKey = user?.id || 'guest';

    // ลบออกจาก leftIds หากเคยออกจากอีเวนต์นี้
    const updatedLeft = leftIds.filter((id) => id !== eventIdStr);
    setLeftIds(updatedLeft);
    AsyncStorage.setItem(`left_event_ids_${userKey}`, JSON.stringify(updatedLeft)).catch(() => {});

    // บันทึกลง joinedIds
    const updatedJoinedIds = [...new Set([...joinedIds, eventIdStr])];
    setJoinedIds(updatedJoinedIds);
    AsyncStorage.setItem(`joined_event_ids_${userKey}`, JSON.stringify(updatedJoinedIds)).catch(() => {});

    // อัปเดตไปยัง Supabase
    try {
      const payload = formatEventForSupabase({
        title: updatedEventData.title,
        startDate: updatedEventData.startDate,
        endDate: updatedEventData.endDate,
        deadline: updatedEventData.deadline,
        places: updatedEventData.places || [],
        memberVotes: updatedEventData.memberVotes || {},
        finalDate: updatedEventData.finalDate || null,
        hostId: updatedEventData.host_id,
        hostName: updatedEventData.host_name,
        code: updatedEventData.code,
        status: updatedEventData.status || 'voting',
        membersCount: updatedEventData.members || 1,
      });

      const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', updatedEventData.id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase join update error:', error.message);
      } else if (data) {
        const parsed = parseEventFromSupabase(data);
        setEvents((old) =>
          old.map((item) => (String(item.id) === eventIdStr ? parsed : item))
        );
        setSelectedEvent(parsed);
      }
    } catch (err) {
      console.warn('Supabase join error:', err);
    }

    showAlert('Joined Event! 🎉', `You have joined "${updatedEventData.title}".`);
  };

  // อัปเดตข้อมูลอีเวนต์ (เช่น สมาชิกแก้ไขวันว่าง, เพิ่มสถานที่, หรือ Host สรุปวัน)
  const updateEventData = async (eventId, patchData) => {
    const eventIdStr = String(eventId);
    const targetEvent = events.find((e) => String(e.id) === eventIdStr) || selectedEvent;
    if (!targetEvent) return;

    const merged = {
      ...targetEvent,
      ...patchData,
    };

    const payload = formatEventForSupabase({
      title: merged.title,
      startDate: merged.startDate,
      endDate: merged.endDate,
      deadline: merged.deadline,
      places: merged.places || [],
      memberVotes: merged.memberVotes || {},
      finalDate: merged.finalDate || null,
      hostId: merged.host_id,
      hostName: merged.host_name,
      code: merged.code,
      status: merged.status || (merged.finalDate ? 'finalized' : 'voting'),
      membersCount: merged.members || 1,
    });

    try {
      const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.warn('Error updating event in Supabase:', error.message);
      } else if (data) {
        const parsed = parseEventFromSupabase(data);
        setEvents((old) =>
          old.map((item) => (String(item.id) === eventIdStr ? parsed : item))
        );
        setSelectedEvent(parsed);
      }
    } catch (err) {
      console.warn('Update event error:', err);
    }
  };

  // ออกจากอีเวนต์ (Leave Event)
  const leaveEvent = async (event) => {
    const eventIdStr = String(event.id);
    const userKey = user?.id || 'guest';

    // 1. บันทึกเข้า leftIds
    const updatedLeftIds = [...new Set([...leftIds, eventIdStr])];
    setLeftIds(updatedLeftIds);
    AsyncStorage.setItem(`left_event_ids_${userKey}`, JSON.stringify(updatedLeftIds)).catch(() => {});

    // 2. นำออกจาก joinedIds
    const updatedJoinedIds = joinedIds.filter((id) => id !== eventIdStr);
    setJoinedIds(updatedJoinedIds);
    AsyncStorage.setItem(`joined_event_ids_${userKey}`, JSON.stringify(updatedJoinedIds)).catch(() => {});

    // 3. นำออกจาก createdIds (ถ้ามี)
    const updatedCreatedIds = createdIds.filter((id) => id !== eventIdStr);
    setCreatedIds(updatedCreatedIds);
    AsyncStorage.setItem(`created_event_ids_${userKey}`, JSON.stringify(updatedCreatedIds)).catch(() => {});

    // 4. ลดสมาชิกใน Supabase
    const newMembers = Math.max(1, (Number(event.members) || 1) - 1);
    try {
      await supabase
        .from('events')
        .update({ members: newMembers })
        .eq('id', event.id);
    } catch (err) {
      console.warn('Supabase member decrement error:', err);
    }

    setEvents((oldEvents) =>
      oldEvents.map((item) =>
        String(item.id) === eventIdStr ? { ...item, members: newMembers } : item
      )
    );

    setScreen(previousScreen || 'Home');
    showAlert('Left Event', `You have left "${event.title}".`);
  };

  // Create new event and save directly to Supabase
  const handleCreateEvent = async (eventData) => {
    const finalCode = (
      eventData.code || Math.random().toString(36).slice(2, 8)
    ).toUpperCase();

    const hostId = user?.id || null;
    const hostName = user?.name || 'Host';

    const newEventPayload = formatEventForSupabase({
      title: eventData.title,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      deadline: eventData.deadline,
      places: eventData.places || [],
      memberVotes: eventData.memberVotes || {},
      finalDate: null,
      hostId,
      hostName,
      code: finalCode,
      status: 'voting',
      membersCount: 1,
    });

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([newEventPayload])
        .select()
        .single();

      const userKey = user?.id || 'guest';

      if (error) {
        console.error('Error inserting to Supabase:', error.message);
        showAlert('Database Error', error.message || 'Could not save to Supabase.');
        return;
      }

      if (data) {
        const createdEvent = parseEventFromSupabase(data);
        setEvents((old) => [
          createdEvent,
          ...old.filter((e) => String(e.id) !== createdEvent.id),
        ]);

        const updatedCreated = [...new Set([...createdIds, createdEvent.id])];
        setCreatedIds(updatedCreated);
        AsyncStorage.setItem(`created_event_ids_${userKey}`, JSON.stringify(updatedCreated)).catch(() => {});

        const updatedJoined = [...new Set([...joinedIds, createdEvent.id])];
        setJoinedIds(updatedJoined);
        AsyncStorage.setItem(`joined_event_ids_${userKey}`, JSON.stringify(updatedJoined)).catch(() => {});

        showAlert(
          'Event Created! 🎉',
          `Share this code with your friends:\n👉 ${createdEvent.code || createdEvent.event_code}`
        );
      }
    } catch (err) {
      console.error('Create event error:', err);
      showAlert('Error', err.message || 'Failed to create event.');
    }

    setScreen('Home');
  };

  // Shared props
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
    updateEventData,
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
