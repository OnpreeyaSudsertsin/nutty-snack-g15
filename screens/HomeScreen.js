import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';

import EventCard from '../components/EventCard';
import BottomNav from '../components/BottomNav';
import EggIllustration from '../components/EggIllustration';

export default function HomeScreen({
  goTo,
  user,
  events = [],
  openDetail,
  joinedIds = [],
  createdIds = [],
  refreshing,
  onRefresh,
}) {
  // รวมอีเวนต์ที่ผู้ใช้สร้างและเข้าร่วม
  const myEventIds = [
    ...new Set([...joinedIds, ...createdIds]),
  ];

  const myEvents = events.filter((event) =>
    myEventIds.includes(event.id)
  );

  const hasMyEvents = myEvents.length > 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFF9E9',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              colors={['#FFD45C']}
            />
          ) : undefined
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 30,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '900',
                color: '#10234B',
              }}
            >
              Hi, {user?.name || 'Amy'}! 👋
            </Text>

            <Text
              style={{
                fontSize: 18,
                color: '#10234B',
                marginTop: 8,
              }}
            >
              Where are we going next?
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Notifications',
                'You are all caught up!'
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Text style={{ fontSize: 28 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Create Event and Join Event */}
        <View
          style={{
            flexDirection: 'row',
            gap: 14,
            marginBottom: 20,
          }}
        >
          {/* Create New Event */}
          <TouchableOpacity
            onPress={() => goTo('Create')}
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: 190,
              backgroundColor: '#FFF0BC',
              borderRadius: 28,
              padding: 20,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: '#10234B',
                marginBottom: 18,
              }}
            >
              Create
            </Text>

            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: '#10234B',
                lineHeight: 28,
              }}
            >
              New Event →
            </Text>
          </TouchableOpacity>

          {/* Join an Event */}
          <TouchableOpacity
            onPress={() => goTo('JoinCode')}
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: 190,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E7DFCE',
              borderRadius: 28,
              padding: 20,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: '#10234B',
                marginBottom: 18,
              }}
            >
              Join
            </Text>

            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: '#10234B',
                lineHeight: 28,
              }}
            >
              an Event →
            </Text>

            <Text
              style={{
                color: '#898989',
                fontSize: 14,
                marginTop: 8,
              }}
            >
              Enter event code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {!hasMyEvents ? (
          <View
            style={{
              flex: 1,
              minHeight: 330,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 12,
              paddingBottom: 20,
            }}
          >
            <Image
              source={require('../assets/logo.png')}
              style={{
                width: 220,
                height: 220,
                resizeMode: 'contain',
              }}
            />

            <Text
              style={{
                fontSize: 23,
                fontWeight: '900',
                color: '#10234B',
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              Hey gang!!!
            </Text>

            <Text
              style={{
                fontSize: 17,
                color: '#10234B',
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 25,
              }}
            >
              let’s hang out together.
            </Text>
          </View>
        ) : (
          /* Upcoming Events */
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  fontSize: 25,
                  fontWeight: '900',
                  color: '#10234B',
                }}
              >
                Upcoming Events
              </Text>

              <TouchableOpacity
                onPress={() => goTo('Event')}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: '#10234B',
                  }}
                >
                  See all →
                </Text>
              </TouchableOpacity>
            </View>

            {myEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() =>
                  openDetail(event, 'Home')
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav
        current="Home"
        goTo={goTo}
      />
    </View>
  );
}
