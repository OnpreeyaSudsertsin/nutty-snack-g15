import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';
import { showAlert } from '../lib/alert';
import { supabase } from '../lib/supabase';
import {
  formatDate,
  formatShortDate,
  formatDateRange,
  getDatesInRange,
  getGoogleMapsUrl,
  parseEventFromSupabase,
} from '../lib/tripUtils';

export default function JoinEventScreen({
  goTo,
  events,
  joinedIds,
  joinEvent,
  openDetail,
  user,
}) {
  const [eventCode, setEventCode] = useState('');
  const [foundEvent, setFoundEvent] = useState(null);
  const [searching, setSearching] = useState(false);

  // Member's date votes
  const [selectedDates, setSelectedDates] = useState([]);
  const [isSavedVotes, setIsSavedVotes] = useState(false);

  // Places
  const [eventPlaces, setEventPlaces] = useState([]);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [showAddPlaceInput, setShowAddPlaceInput] = useState(false);

  // Dates in range - always guaranteed to return dates
  const daysInRange = useMemo(() => {
    if (!foundEvent) return [];
    return getDatesInRange(foundEvent.startDate, foundEvent.endDate);
  }, [foundEvent]);

  // Search event by code
  const handleSearchEvent = async () => {
    const code = eventCode.trim().toUpperCase();
    if (!code) {
      showAlert('Missing Code', 'Please enter an event code.');
      return;
    }

    setSearching(true);

    try {
      // 1. Check local state
      let target = events.find(
        (item) =>
          item.code?.toUpperCase() === code ||
          item.event_code?.toUpperCase() === code
      );

      // 2. Query Supabase
      if (!target) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .ilike('event_code', code)
          .limit(1);

        if (error) {
          console.warn('Query Supabase error:', error.message);
        }

        if (data && data.length > 0) {
          target = parseEventFromSupabase(data[0]);
        }
      }

      if (!target) {
        showAlert('Event Not Found', `No event found with code "${code}".`);
        return;
      }

      // Check if already joined
      if (joinedIds.includes(String(target.id))) {
        showAlert('Already Joined', `You have already joined "${target.title}".`, [
          {
            text: 'View Event',
            onPress: () => openDetail(target, 'Home'),
          },
        ]);
        return;
      }

      const memberUserId = user?.id || 'guest_user';
      const existingVote = target.memberVotes?.[memberUserId]?.dates || [];

      setFoundEvent(target);
      setSelectedDates(existingVote);
      setIsSavedVotes(existingVote.length > 0);
      setEventPlaces(target.places || []);
    } catch (err) {
      console.warn('Search event error:', err);
      showAlert('Error', 'Failed to find event.');
    } finally {
      setSearching(false);
    }
  };

  // Toggle date
  const toggleDate = (dayStr) => {
    setIsSavedVotes(false);
    if (selectedDates.includes(dayStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dayStr));
    } else {
      setSelectedDates([...selectedDates, dayStr]);
    }
  };

  // Select button
  const handleSelectFreeDays = () => {
    if (selectedDates.length === 0) {
      showAlert('Select Dates', 'Please select at least 1 date you are available.');
      return;
    }
    setIsSavedVotes(true);
  };

  // Open Google Maps
  const openMaps = (placeName) => {
    const query = placeName?.trim() || 'Thailand';
    Linking.openURL(getGoogleMapsUrl(query)).catch(() => {
      showAlert('Error', 'Could not open Google Maps.');
    });
  };

  // Add place
  const handleAddOptionalPlace = () => {
    const trimmed = newPlaceName.trim();
    if (!trimmed) {
      showAlert('Missing Name', 'Please enter a place name.');
      return;
    }
    if (eventPlaces.length >= 5) {
      showAlert('Limit Reached', 'Maximum 5 places allowed.');
      return;
    }

    const newPlace = {
      id: String(Date.now()),
      name: trimmed,
      mapsUrl: getGoogleMapsUrl(trimmed),
      addedBy: user?.name || 'Member',
    };

    setEventPlaces([...eventPlaces, newPlace]);
    setNewPlaceName('');
    setShowAddPlaceInput(false);
  };

  // Confirm Join
  const handleConfirmJoin = async () => {
    if (!isSavedVotes || selectedDates.length === 0) {
      showAlert(
        'Select Dates',
        'Please select your available dates and tap "Select" before joining.'
      );
      return;
    }

    const memberUserId = user?.id || `user_${Date.now()}`;
    const memberUserName = user?.name || 'Amy';

    const updatedVotes = {
      ...(foundEvent.memberVotes || {}),
      [memberUserId]: {
        userName: memberUserName,
        isHost: false,
        dates: selectedDates,
      },
    };

    const updatedEvent = {
      ...foundEvent,
      memberVotes: updatedVotes,
      places: eventPlaces,
      members: (Number(foundEvent.members) || 1) + 1,
    };

    await joinEvent(updatedEvent, {
      memberId: memberUserId,
      memberName: memberUserName,
      dates: selectedDates,
      places: eventPlaces,
    });

    goTo('Event');
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => {
            if (foundEvent) {
              setFoundEvent(null);
            } else {
              goTo('Home');
            }
          }}
        >
          <Text style={{ fontSize: 30, color: colors.navy, marginBottom: 16 }}>‹</Text>
        </TouchableOpacity>

        {/* STEP 1: Code Search */}
        {!foundEvent ? (
          <View>
            <View style={{ alignItems: 'center', marginBottom: 25 }}>
              <Text style={{ fontSize: 75 }}>🔗</Text>
              <Text style={[styles.title, { marginTop: 12 }]}>Join an Event</Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>
                Enter the event code shared by your friends
              </Text>
            </View>

            <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 14, marginBottom: 8 }}>
              Event Code
            </Text>

            <InputField
              placeholder="e.g. TRIP01"
              value={eventCode}
              onChangeText={(txt) => setEventCode(txt.toUpperCase())}
              autoCapitalize="characters"
            />

            <AppButton
              title={searching ? 'Searching...' : 'Join Event  →'}
              onPress={handleSearchEvent}
            />

            <AppButton title="Cancel" light onPress={() => goTo('Home')} />

            <View style={{ alignItems: 'center', marginTop: 35 }}>
              <LogoIcon size={55} />
            </View>
          </View>
        ) : (
          /* STEP 2: Event Details, Available Dates, Places */
          <View>
            {/* Event Summary Card */}
            <View style={joinStyles.eventCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={joinStyles.avatarCircle}>
                  <Text style={{ fontSize: 32 }}>{foundEvent.emoji || '🐥'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={joinStyles.eventTitle}>{foundEvent.title}</Text>
                  <Text style={joinStyles.hostName}>
                    Host: {foundEvent.host_name || 'Host'}
                  </Text>
                </View>
              </View>

              <View style={joinStyles.divider} />

              <View style={joinStyles.infoRow}>
                <Text style={joinStyles.infoLabel}>Date Range:</Text>
                <Text style={joinStyles.infoValue}>
                  {formatDateRange(foundEvent.startDate, foundEvent.endDate)}
                </Text>
              </View>

              <View style={joinStyles.infoRow}>
                <Text style={joinStyles.infoLabel}>Deadline:</Text>
                <Text style={[joinStyles.infoValue, { color: colors.red }]}>
                  {formatDate(foundEvent.deadline)}
                </Text>
              </View>

              <View style={joinStyles.infoRow}>
                <Text style={joinStyles.infoLabel}>Members:</Text>
                <Text style={joinStyles.infoValue}>{foundEvent.members || 1}</Text>
              </View>
            </View>

            {/* 1. Available Dates Selection */}
            <View style={joinStyles.section}>
              <Text style={joinStyles.sectionTitle}>Available Dates</Text>

              <View style={joinStyles.chipGrid}>
                {daysInRange.map((dayStr) => {
                  const isSelected = selectedDates.includes(dayStr);
                  return (
                    <TouchableOpacity
                      key={dayStr}
                      onPress={() => toggleDate(dayStr)}
                      style={[
                        joinStyles.dayChip,
                        isSelected && joinStyles.dayChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          joinStyles.dayChipText,
                          isSelected && joinStyles.dayChipTextSelected,
                        ]}
                      >
                        {isSelected ? '✓ ' : ''}
                        {formatDate(dayStr)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Just the Select button */}
              <TouchableOpacity
                onPress={handleSelectFreeDays}
                style={[
                  joinStyles.selectBtn,
                  isSavedVotes && joinStyles.selectBtnActive,
                ]}
              >
                <Text
                  style={[
                    joinStyles.selectBtnText,
                    isSavedVotes && joinStyles.selectBtnTextActive,
                  ]}
                >
                  {isSavedVotes ? 'Selected ✓' : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Places (1-5) */}
            <View style={joinStyles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={joinStyles.sectionTitle}>Places</Text>
                <Text style={{ fontSize: 13, color: colors.gray, fontWeight: '700' }}>
                  ({eventPlaces.length}/5)
                </Text>
              </View>

              {eventPlaces.map((place, idx) => (
                <View key={place.id || idx} style={joinStyles.placeItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={joinStyles.placeName}>
                      {idx + 1}. {place.name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => openMaps(place.name)}
                    style={joinStyles.mapsBtn}
                  >
                    <Text style={joinStyles.mapsBtnText}>Google Maps</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Place */}
              {eventPlaces.length < 5 && (
                <View style={{ marginTop: 8 }}>
                  {!showAddPlaceInput ? (
                    <TouchableOpacity
                      onPress={() => setShowAddPlaceInput(true)}
                      style={joinStyles.addPlaceToggle}
                    >
                      <Text style={joinStyles.addPlaceToggleText}>+ Add Place</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={joinStyles.addPlaceBox}>
                      <TextInput
                        placeholder="Enter place name"
                        placeholderTextColor={colors.gray}
                        value={newPlaceName}
                        onChangeText={setNewPlaceName}
                        style={joinStyles.newPlaceInput}
                      />
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity
                          onPress={() => openMaps(newPlaceName)}
                          style={[joinStyles.mapsBtn, { flex: 1 }]}
                        >
                          <Text style={joinStyles.mapsBtnText}>Google Maps</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleAddOptionalPlace}
                          style={joinStyles.savePlaceBtn}
                        >
                          <Text style={joinStyles.savePlaceBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={{ marginTop: 10, marginBottom: 20 }}>
              <AppButton title="Join Event     →" onPress={handleConfirmJoin} />
              <AppButton title="Cancel" light onPress={() => setFoundEvent(null)} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const joinStyles = {
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.navy,
  },
  hostName: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dayChip: {
    backgroundColor: colors.cream,
    borderWidth: 1.3,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  dayChipSelected: {
    backgroundColor: colors.yellow,
    borderColor: colors.navy,
  },
  dayChipText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  dayChipTextSelected: {
    fontWeight: '900',
  },
  selectBtn: {
    backgroundColor: colors.yellowLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.navy,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnActive: {
    backgroundColor: '#D1FADF',
    borderColor: '#039855',
  },
  selectBtnText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
  },
  selectBtnTextActive: {
    color: '#027A48',
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  mapsBtn: {
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
  addPlaceToggle: {
    borderWidth: 1.3,
    borderStyle: 'dashed',
    borderColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addPlaceToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  addPlaceBox: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newPlaceInput: {
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.navy,
    fontSize: 14,
  },
  savePlaceBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePlaceBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.navy,
  },
};
