import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import EventCard from '../components/EventCard';
import BottomNav from '../components/BottomNav';

export default function EventScreen({
  goTo,
  events = [],
  openDetail,
  joinedIds = [],
  createdIds = [],
  refreshing,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // ค้นหาและกรองอีเวนต์ (แสดงเฉพาะอีเวนต์ที่เข้าร่วมแล้ว หรือสร้างเองเท่านั้น)
  const filteredEvents = events.filter((event) => {
    const title = (event.title || '').toLowerCase();
    const place = (event.place || '').toLowerCase();
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      title.includes(keyword) ||
      place.includes(keyword);

    const isJoined = joinedIds.includes(String(event.id));
    const isCreated = createdIds.includes(String(event.id));
    const isMyEvent = isJoined || isCreated;

    const matchesFilter =
      (activeFilter === 'All' && isMyEvent) ||
      (activeFilter === 'Joined' && isJoined) ||
      (activeFilter === 'Created' && isCreated);

    return matchesSearch && matchesFilter;
  });

  const filters = ['All', 'Joined', 'Created'];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFF9E9',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 28,
          paddingBottom: 30,
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
        {/* Page title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <Text
            style={{
              fontSize: 42,
              fontWeight: '900',
              color: '#10234B',
            }}
          >
            Event
          </Text>

          <Text style={{ fontSize: 32 }}>🐥</Text>
        </View>

        {/* Search input */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="⌕  Search event name"
          placeholderTextColor="#898989"
          style={{
            height: 46,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E7DFCE',
            borderRadius: 25,
            paddingHorizontal: 18,
            fontSize: 17,
            color: '#10234B',
            marginBottom: 20,
          }}
        />

        {/* Filter buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 22,
          }}
        >
          {filters.map((filter) => {
            const selected = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={{
                  backgroundColor: selected
                    ? '#FFD45C'
                    : '#F0EBDD',
                  paddingHorizontal: 22,
                  paddingVertical: 15,
                  borderRadius: 30,
                }}
              >
                <Text
                  style={{
                    color: '#10234B',
                    fontSize: 17,
                    fontWeight: '800',
                  }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Event list */}
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => openDetail(event, 'Event')}
            />
          ))
        ) : (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 55,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#10234B',
                textAlign: 'center',
              }}
            >
              {search.trim()
                ? 'No events found.'
                : activeFilter === 'Joined'
                ? 'You have not joined any events yet.'
                : activeFilter === 'Created'
                ? 'You have not created any events yet.'
                : 'No events joined yet. Use code to join!'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation */}
      <BottomNav
        current="Event"
        goTo={goTo}
      />
    </View>
  );
}
