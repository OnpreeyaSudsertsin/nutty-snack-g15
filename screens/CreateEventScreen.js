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
import DatePickerModal from '../components/DatePickerModal';
import { styles, colors } from '../theme';
import { showAlert } from '../lib/alert';
import {
  formatDate,
  formatDateRange,
  getDatesInRange,
  getGoogleMapsUrl,
} from '../lib/tripUtils';

const generateRandomCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const getInitialDates = () => {
  const today = new Date();
  const nextFriday = new Date();
  const day = today.getDay();
  const diffToFriday = (5 - day + 7) % 7 || 7;
  nextFriday.setDate(today.getDate() + diffToFriday);

  const nextSunday = new Date(nextFriday);
  nextSunday.setDate(nextFriday.getDate() + 2);

  const deadlineDate = new Date(nextFriday);
  deadlineDate.setDate(nextFriday.getDate() - 2);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  return {
    start: fmt(nextFriday),
    end: fmt(nextSunday),
    deadline: fmt(deadlineDate),
  };
};

export default function CreateEventScreen({ goTo, onCreate, user }) {
  const initDates = useMemo(() => getInitialDates(), []);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initDates.start);
  const [endDate, setEndDate] = useState(initDates.end);
  const [deadline, setDeadline] = useState(initDates.deadline);

  // Host votes for available days
  const [hostVotes, setHostVotes] = useState([initDates.start, initDates.end]);

  // Places list: at least 1, max 5
  const [places, setPlaces] = useState([
    { id: '1', name: '' },
  ]);

  const [code, setCode] = useState(generateRandomCode());
  const [pickerTarget, setPickerTarget] = useState(null);

  const daysInRange = useMemo(
    () => getDatesInRange(startDate, endDate),
    [startDate, endDate]
  );

  const toggleHostVote = (dayStr) => {
    if (hostVotes.includes(dayStr)) {
      setHostVotes(hostVotes.filter((d) => d !== dayStr));
    } else {
      setHostVotes([...hostVotes, dayStr]);
    }
  };

  const selectAllDays = () => {
    setHostVotes([...daysInRange]);
  };

  const clearVotes = () => {
    setHostVotes([]);
  };

  const handlePlaceNameChange = (idx, text) => {
    const nextPlaces = [...places];
    nextPlaces[idx] = { ...nextPlaces[idx], name: text };
    setPlaces(nextPlaces);
  };

  const addPlace = () => {
    if (places.length >= 5) {
      showAlert('Limit Reached', 'Maximum 5 places allowed.');
      return;
    }
    setPlaces([...places, { id: String(Date.now()), name: '' }]);
  };

  const removePlace = (idx) => {
    if (places.length <= 1) {
      showAlert('Required', 'At least 1 place is required.');
      return;
    }
    setPlaces(places.filter((_, i) => i !== idx));
  };

  const openMaps = (placeName) => {
    const query = placeName?.trim() || 'Bangkok';
    Linking.openURL(getGoogleMapsUrl(query)).catch(() => {
      showAlert('Error', 'Could not open Google Maps.');
    });
  };

  const handleSelectDate = (dateStr) => {
    if (pickerTarget === 'start') {
      setStartDate(dateStr);
      if (dateStr > endDate) {
        setEndDate(dateStr);
      }
      if (deadline > dateStr) {
        setDeadline(dateStr);
      }
    } else if (pickerTarget === 'end') {
      if (dateStr < startDate) {
        setStartDate(dateStr);
      }
      setEndDate(dateStr);
    } else if (pickerTarget === 'deadline') {
      setDeadline(dateStr);
    }
    setPickerTarget(null);
  };

  const submit = () => {
    if (!title.trim()) {
      showAlert('Required', 'Please enter a trip name.');
      return;
    }
    if (!startDate || !endDate) {
      showAlert('Required', 'Please select a date range.');
      return;
    }
    if (startDate > endDate) {
      showAlert('Invalid Date', 'End date must be after start date.');
      return;
    }
    if (!deadline) {
      showAlert('Required', 'Please set a deadline.');
      return;
    }
    if (hostVotes.length === 0) {
      showAlert('Required', 'Please select at least 1 date you can attend.');
      return;
    }

    const validPlaces = places
      .map((p) => ({
        id: p.id,
        name: p.name.trim(),
        mapsUrl: getGoogleMapsUrl(p.name.trim()),
      }))
      .filter((p) => p.name.length > 0);

    if (validPlaces.length === 0) {
      showAlert('Required', 'Please specify at least 1 place.');
      return;
    }

    const hostUserId = user?.id || `user_${Date.now()}`;
    const hostUserName = user?.name || 'Host';

    const initialMemberVotes = {
      [hostUserId]: {
        userName: hostUserName,
        isHost: true,
        dates: hostVotes,
      },
    };

    onCreate({
      title: title.trim(),
      startDate,
      endDate,
      deadline,
      date: formatDateRange(startDate, endDate),
      places: validPlaces,
      place: validPlaces.map((p) => p.name).join(', '),
      memberVotes: initialMemberVotes,
      emoji: '🐥',
      code: code.trim().toUpperCase(),
      hostId: hostUserId,
      hostName: hostUserName,
      membersCount: 1,
    });
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => goTo('Home')}>
          <Text style={{ fontSize: 30, color: colors.navy, marginBottom: 12 }}>‹</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={styles.title}>Create Event </Text>
          <LogoIcon size={30} />
        </View>

        {/* 1. Trip Name */}
        <Text style={formStyles.label}>Trip Name</Text>
        <InputField
          placeholder="e.g. Khao Yai Getaway 🌲"
          value={title}
          onChangeText={setTitle}
        />

        {/* 2. Date Range */}
        <Text style={formStyles.label}>Date Range</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            style={formStyles.dateBtn}
            onPress={() => setPickerTarget('start')}
          >
            <Text style={formStyles.dateBtnLabel}>Start Date</Text>
            <Text style={formStyles.dateBtnValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={formStyles.dateBtn}
            onPress={() => setPickerTarget('end')}
          >
            <Text style={formStyles.dateBtnLabel}>End Date</Text>
            <Text style={formStyles.dateBtnValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Deadline */}
        <Text style={formStyles.label}>Deadline</Text>
        <TouchableOpacity
          style={[formStyles.dateBtn, { marginBottom: 16 }]}
          onPress={() => setPickerTarget('deadline')}
        >
          <Text style={formStyles.dateBtnLabel}>Voting Deadline</Text>
          <Text style={formStyles.dateBtnValue}>{formatDate(deadline)}</Text>
        </TouchableOpacity>

        {/* 4. Host Votes */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={formStyles.label}>Your Available Dates</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={selectAllDays}>
                <Text style={formStyles.linkText}>Select All</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.gray }}>|</Text>
              <TouchableOpacity onPress={clearVotes}>
                <Text style={formStyles.linkText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={formStyles.chipGrid}>
            {daysInRange.map((dayStr) => {
              const isSelected = hostVotes.includes(dayStr);
              return (
                <TouchableOpacity
                  key={dayStr}
                  onPress={() => toggleHostVote(dayStr)}
                  style={[
                    formStyles.dayChip,
                    isSelected && formStyles.dayChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      formStyles.dayChipText,
                      isSelected && formStyles.dayChipTextSelected,
                    ]}
                  >
                    {isSelected ? '✓ ' : ''}
                    {formatDate(dayStr)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Places (1-5) */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={formStyles.label}>Places</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.navy }}>
              ({places.length}/5)
            </Text>
          </View>

          {places.map((place, idx) => (
            <View key={place.id} style={formStyles.placeCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={formStyles.placeNumber}>Place {idx + 1}</Text>
                {places.length > 1 && (
                  <TouchableOpacity onPress={() => removePlace(idx)}>
                    <Text style={{ color: colors.red, fontSize: 13, fontWeight: '700' }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Enter place name"
                    placeholderTextColor={colors.gray}
                    value={place.name}
                    onChangeText={(txt) => handlePlaceNameChange(idx, txt)}
                    style={formStyles.placeInput}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => openMaps(place.name)}
                  style={formStyles.mapsBtn}
                >
                  <Text style={formStyles.mapsBtnText}>Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {places.length < 5 && (
            <TouchableOpacity onPress={addPlace} style={formStyles.addPlaceBtn}>
              <Text style={formStyles.addPlaceBtnText}>+ Add Place</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 6. Event Code */}
        <View style={{ marginBottom: 16 }}>
          <Text style={formStyles.label}>Event Code</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <InputField
                placeholder="TRIP01"
                value={code}
                onChangeText={(txt) => setCode(txt.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              onPress={() => setCode(generateRandomCode())}
              style={formStyles.rerollBtn}
            >
              <Text style={formStyles.rerollBtnText}>Random</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <View style={{ marginTop: 8 }}>
          <AppButton title="Create Event     →" onPress={submit} />
          <AppButton title="Cancel" light onPress={() => goTo('Home')} />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelectDate={handleSelectDate}
        title={
          pickerTarget === 'start'
            ? 'Select Start Date'
            : pickerTarget === 'end'
            ? 'Select End Date'
            : 'Select Deadline'
        }
        initialDate={
          pickerTarget === 'start'
            ? startDate
            : pickerTarget === 'end'
            ? endDate
            : deadline
        }
      />
    </View>
  );
}

const formStyles = {
  label: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 6,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.3,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'center',
  },
  dateBtnLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateBtnValue: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '900',
  },
  linkText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: colors.white,
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
  placeCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  placeNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  placeInput: {
    height: 46,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.navy,
    fontSize: 14,
    backgroundColor: colors.cream,
  },
  mapsBtn: {
    height: 46,
    backgroundColor: colors.yellowLight,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
  addPlaceBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    marginBottom: 10,
  },
  addPlaceBtnText: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 14,
  },
  rerollBtn: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: colors.yellowLight,
    borderRadius: 13,
    borderWidth: 1.3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  rerollBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
};
