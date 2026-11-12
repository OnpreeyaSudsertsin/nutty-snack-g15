import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import AppButton from '../components/AppButton';
import LogoIcon from '../components/LogoIcon';
import { styles, colors } from '../theme';
import { showAlert } from '../lib/alert';
import {
  formatDate,
  formatDateRange,
  getDatesInRange,
  getGoogleMapsUrl,
  getGoogleCalendarUrl,
} from '../lib/tripUtils';

export default function EventDetailScreen({
  event,
  goTo,
  previousScreen = 'Home',
  user,
  leaveEvent,
  updateEventData,
}) {
  if (!event) return null;

  const eventCode = event.code || event.event_code || '';
  const currentUserId = user?.id || 'guest_user';
  const currentUserName = user?.name || 'Amy';
  const isHost =
    Boolean(event.host_id && event.host_id === currentUserId) ||
    Boolean(event.host_name && event.host_name === currentUserName);

  // Dates in range
  const daysInRange = useMemo(() => {
    return getDatesInRange(event.startDate, event.endDate);
  }, [event.startDate, event.endDate]);

  const memberVotes = event.memberVotes || {};

  // Compute votes per day
  const votesPerDay = useMemo(() => {
    const map = {};
    daysInRange.forEach((d) => {
      map[d] = [];
    });
    Object.values(memberVotes).forEach((v) => {
      if (Array.isArray(v.dates)) {
        v.dates.forEach((d) => {
          if (!map[d]) map[d] = [];
          if (!map[d].includes(v.userName || 'Member')) {
            map[d].push(v.userName || 'Member');
          }
        });
      }
    });
    return map;
  }, [daysInRange, memberVotes]);

  // Find top voted day
  const topDayInfo = useMemo(() => {
    let topDay = null;
    let maxVotes = 0;
    daysInRange.forEach((d) => {
      const count = (votesPerDay[d] || []).length;
      if (count > maxVotes) {
        maxVotes = count;
        topDay = d;
      }
    });
    return { topDay, maxVotes };
  }, [daysInRange, votesPerDay]);

  // Places
  const places = event.places || [];
  const [newPlaceInput, setNewPlaceInput] = useState('');
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  // Edit user votes
  const userExistingDates = memberVotes[currentUserId]?.dates || [];
  const [myVoteDates, setMyVoteDates] = useState(userExistingDates);
  const [isEditingMyVotes, setIsEditingMyVotes] = useState(false);

  // Finalize date
  const [selectedFinalDate, setSelectedFinalDate] = useState(
    event.finalDate || topDayInfo.topDay || event.startDate
  );
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Google Maps
  const openMaps = (placeName) => {
    const query = placeName?.trim() || event.place || 'Thailand';
    Linking.openURL(getGoogleMapsUrl(query)).catch(() => {
      showAlert('Error', 'Could not open Google Maps.');
    });
  };

  // Google Calendar
  const openGoogleCalendar = (targetDate) => {
    const dateToUse = targetDate || event.finalDate || topDayInfo.topDay || event.startDate;
    const primaryPlace = places.length > 0 ? places[0].name : (event.place || '');
    const placeListStr = places.map((p, i) => `${i + 1}. ${p.name}`).join(', ');

    const calendarUrl = getGoogleCalendarUrl({
      title: event.title,
      startDate: dateToUse,
      endDate: dateToUse,
      location: primaryPlace,
      details: `Trip: ${event.title}\nPlaces: ${placeListStr}\nMembers: ${event.members || 1}\nPlanned via Nutty Snack`,
    });

    Linking.openURL(calendarUrl).catch(() => {
      showAlert('Error', 'Could not open Google Calendar.');
    });
  };

  const toggleMyVote = (dayStr) => {
    if (myVoteDates.includes(dayStr)) {
      setMyVoteDates(myVoteDates.filter((d) => d !== dayStr));
    } else {
      setMyVoteDates([...myVoteDates, dayStr]);
    }
  };

  const saveMyVotes = async () => {
    if (myVoteDates.length === 0) {
      showAlert('Select Dates', 'Please select at least 1 date.');
      return;
    }

    const updatedMemberVotes = {
      ...memberVotes,
      [currentUserId]: {
        userName: currentUserName,
        isHost,
        dates: myVoteDates,
      },
    };

    if (updateEventData) {
      await updateEventData(event.id, {
        memberVotes: updatedMemberVotes,
      });
    }

    setIsEditingMyVotes(false);
  };

  const handleAddPlace = async () => {
    const trimmed = newPlaceInput.trim();
    if (!trimmed) {
      showAlert('Required', 'Please enter a place name.');
      return;
    }
    if (places.length >= 5) {
      showAlert('Limit Reached', 'Maximum 5 places allowed.');
      return;
    }

    const newPlace = {
      id: String(Date.now()),
      name: trimmed,
      mapsUrl: getGoogleMapsUrl(trimmed),
      addedBy: currentUserName,
    };

    const updatedPlaces = [...places, newPlace];

    if (updateEventData) {
      await updateEventData(event.id, {
        places: updatedPlaces,
        place: updatedPlaces.map((p) => p.name).join(', '),
      });
    }

    setNewPlaceInput('');
    setIsAddingPlace(false);
  };

  const handleConfirmFinalDate = async () => {
    if (!selectedFinalDate) {
      showAlert('Required', 'Please select a date.');
      return;
    }

    if (updateEventData) {
      await updateEventData(event.id, {
        finalDate: selectedFinalDate,
        status: 'finalized',
      });
    }

    setShowFinalizeModal(false);
  };

  const handleLeave = () => {
    showAlert(
      'Leave Event',
      `Are you sure you want to leave "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Event',
          style: 'destructive',
          onPress: () => {
            if (leaveEvent) {
              leaveEvent(event);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => goTo(previousScreen)}>
          <Text style={{ fontSize: 30, color: colors.navy, marginBottom: 15 }}>‹</Text>
        </TouchableOpacity>

        {/* Hero header */}
        <View style={detailStyles.heroCard}>
          <Text style={{ fontSize: 60, marginBottom: 10 }}>{event.emoji || '🐥'}</Text>
          <Text style={detailStyles.heroTitle}>{event.title}</Text>
          <Text style={detailStyles.heroSubtitle}>
            Host: {event.host_name || 'Host'}
          </Text>
        </View>

        {/* Event Code Box */}
        {!!eventCode && (
          <View style={detailStyles.codeBox}>
            <Text style={detailStyles.codeLabel}>EVENT CODE</Text>
            <Text style={detailStyles.codeValue}>{eventCode}</Text>
          </View>
        )}

        {/* Finalized Banner & GCal Link */}
        {event.finalDate ? (
          <View style={detailStyles.finalizedBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={detailStyles.finalizedTitle}>Trip Date Finalized!</Text>
                <Text style={detailStyles.finalizedDate}>
                  {formatDate(event.finalDate)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => openGoogleCalendar(event.finalDate)}
              style={detailStyles.gcalBtn}
            >
              <Text style={detailStyles.gcalBtnText}>
                📅 Add to Google Calendar
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Status & Finalize Button */
          <View style={detailStyles.votingStatusBox}>
            <Text style={detailStyles.votingStatusTitle}>Voting in Progress</Text>
            <Text style={detailStyles.votingStatusSubtitle}>
              Deadline: {formatDate(event.deadline)}
            </Text>

            {!!topDayInfo.topDay && (
              <Text style={detailStyles.topDayHighlight}>
                Most Available: {formatDate(topDayInfo.topDay)} ({topDayInfo.maxVotes} members)
              </Text>
            )}

            {isHost && (
              <TouchableOpacity
                onPress={() => setShowFinalizeModal(true)}
                style={detailStyles.finalizeActionBtn}
              >
                <Text style={detailStyles.finalizeActionBtnText}>
                  Finalize Date
                </Text>
              </TouchableOpacity>
            )}

            {!!topDayInfo.topDay && (
              <TouchableOpacity
                onPress={() => openGoogleCalendar(topDayInfo.topDay)}
                style={detailStyles.previewGCalBtn}
              >
                <Text style={detailStyles.previewGCalBtnText}>
                  Add to Google Calendar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Available Dates */}
        <View style={detailStyles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={detailStyles.sectionTitle}>
              Available Dates
            </Text>
            <TouchableOpacity onPress={() => setIsEditingMyVotes(!isEditingMyVotes)}>
              <Text style={detailStyles.editVotesLink}>
                {isEditingMyVotes ? 'Close' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Edit own votes inline */}
          {isEditingMyVotes && (
            <View style={detailStyles.editVotesBox}>
              <View style={detailStyles.chipGrid}>
                {daysInRange.map((dayStr) => {
                  const isSelected = myVoteDates.includes(dayStr);
                  return (
                    <TouchableOpacity
                      key={dayStr}
                      onPress={() => toggleMyVote(dayStr)}
                      style={[
                        detailStyles.dayChip,
                        isSelected && detailStyles.dayChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          detailStyles.dayChipText,
                          isSelected && detailStyles.dayChipTextSelected,
                        ]}
                      >
                        {isSelected ? '✓ ' : ''}
                        {formatDate(dayStr)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={saveMyVotes} style={detailStyles.saveVotesBtn}>
                <Text style={detailStyles.saveVotesBtnText}>Select</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Day by Day vote tally */}
          <View style={{ marginTop: 4 }}>
            {daysInRange.map((dayStr) => {
              const voters = votesPerDay[dayStr] || [];
              const isTop = topDayInfo.topDay === dayStr && topDayInfo.maxVotes > 0;
              const isFinal = event.finalDate === dayStr;

              return (
                <View
                  key={dayStr}
                  style={[
                    detailStyles.voteRow,
                    isFinal && detailStyles.voteRowFinal,
                    isTop && !isFinal && detailStyles.voteRowTop,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={detailStyles.voteDateText}>
                        {formatDate(dayStr)}
                      </Text>
                      {isFinal && (
                        <View style={detailStyles.finalBadge}>
                          <Text style={detailStyles.finalBadgeText}>Finalized</Text>
                        </View>
                      )}
                      {isTop && !isFinal && (
                        <View style={detailStyles.topBadge}>
                          <Text style={detailStyles.topBadgeText}>Top Pick</Text>
                        </View>
                      )}
                    </View>

                    <Text style={detailStyles.voterNames}>
                      {voters.length > 0 ? voters.join(', ') : 'No votes'}
                    </Text>
                  </View>

                  <View style={detailStyles.voteCountBadge}>
                    <Text style={detailStyles.voteCountNumber}>{voters.length}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Places */}
        <View style={detailStyles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={detailStyles.sectionTitle}>
              Places ({places.length}/5)
            </Text>
            {places.length < 5 && (
              <TouchableOpacity onPress={() => setIsAddingPlace(!isAddingPlace)}>
                <Text style={detailStyles.editVotesLink}>
                  {isAddingPlace ? 'Close' : '+ Add Place'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {places.map((place, idx) => (
            <View key={place.id || idx} style={detailStyles.placeCard}>
              <View style={{ flex: 1 }}>
                <Text style={detailStyles.placeTitle}>
                  {idx + 1}. {place.name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => openMaps(place.name)}
                style={detailStyles.mapsActionBtn}
              >
                <Text style={detailStyles.mapsActionBtnText}>Google Maps</Text>
              </TouchableOpacity>
            </View>
          ))}

          {isAddingPlace && places.length < 5 && (
            <View style={detailStyles.addPlaceBox}>
              <TextInput
                placeholder="Enter place name"
                placeholderTextColor={colors.gray}
                value={newPlaceInput}
                onChangeText={setNewPlaceInput}
                style={detailStyles.placeInput}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => openMaps(newPlaceInput)}
                  style={[detailStyles.mapsActionBtn, { flex: 1 }]}
                >
                  <Text style={detailStyles.mapsActionBtnText}>Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddPlace}
                  style={detailStyles.savePlaceBtn}
                >
                  <Text style={detailStyles.savePlaceBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Leave Event */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <AppButton
            title="Leave Event"
            danger
            onPress={handleLeave}
          />

          <AppButton
            title="Back"
            light
            onPress={() => goTo(previousScreen)}
          />
        </View>
      </ScrollView>

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <View style={detailStyles.modalOverlay}>
          <View style={detailStyles.modalCard}>
            <Text style={detailStyles.modalTitle}>Finalize Trip Date</Text>

            <View style={{ marginVertical: 14 }}>
              {daysInRange.map((dayStr) => {
                const count = (votesPerDay[dayStr] || []).length;
                const isSelected = selectedFinalDate === dayStr;
                return (
                  <TouchableOpacity
                    key={dayStr}
                    onPress={() => setSelectedFinalDate(dayStr)}
                    style={[
                      detailStyles.finalChoiceRow,
                      isSelected && detailStyles.finalChoiceRowSelected,
                    ]}
                  >
                    <Text
                      style={[
                        detailStyles.finalChoiceDate,
                        isSelected && { fontWeight: '900', color: colors.navy },
                      ]}
                    >
                      {isSelected ? '✓ ' : '○ '}
                      {formatDate(dayStr)}
                    </Text>
                    <Text style={detailStyles.finalChoiceCount}>{count} votes</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowFinalizeModal(false)}
                style={[detailStyles.modalBtn, detailStyles.modalBtnCancel]}
              >
                <Text style={detailStyles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmFinalDate}
                style={[detailStyles.modalBtn, detailStyles.modalBtnConfirm]}
              >
                <Text style={detailStyles.modalBtnConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const detailStyles = {
  heroCard: {
    backgroundColor: colors.yellowLight,
    borderRadius: 24,
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.navy,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: '700',
    marginTop: 6,
  },
  codeBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 4,
  },
  finalizedBanner: {
    backgroundColor: '#ECFDF3',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#039855',
    padding: 16,
    marginBottom: 16,
  },
  finalizedTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#027A48',
  },
  finalizedDate: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
  },
  gcalBtn: {
    backgroundColor: '#039855',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  gcalBtnText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 14,
  },
  votingStatusBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  votingStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },
  votingStatusSubtitle: {
    fontSize: 13,
    color: colors.red,
    fontWeight: '700',
    marginTop: 2,
  },
  topDayHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B54708',
    marginTop: 4,
  },
  finalizeActionBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  finalizeActionBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.navy,
  },
  previewGCalBtn: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  previewGCalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.navy,
  },
  editVotesLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    textDecorationLine: 'underline',
  },
  editVotesBox: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  dayChip: {
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  dayChipSelected: {
    backgroundColor: colors.yellow,
    borderColor: colors.navy,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  dayChipTextSelected: {
    fontWeight: '900',
  },
  saveVotesBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  saveVotesBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.navy,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.cream,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  voteRowTop: {
    borderColor: '#FDB022',
    backgroundColor: '#FEF0C7',
  },
  voteRowFinal: {
    borderColor: '#039855',
    backgroundColor: '#D1FADF',
  },
  voteDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  finalBadge: {
    backgroundColor: '#039855',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  finalBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  topBadge: {
    backgroundColor: '#FDB022',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topBadgeText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '800',
  },
  voterNames: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  voteCountBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 32,
  },
  voteCountNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.navy,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  mapsActionBtn: {
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapsActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
  addPlaceBox: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeInput: {
    height: 42,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.navy,
  },
  savePlaceBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePlaceBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.navy,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 35, 75, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.cream,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.navy,
    textAlign: 'center',
  },
  finalChoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  finalChoiceRowSelected: {
    backgroundColor: '#D1FADF',
    borderColor: '#039855',
  },
  finalChoiceDate: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '700',
  },
  finalChoiceCount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gray,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnCancelText: {
    color: colors.navy,
    fontWeight: '800',
  },
  modalBtnConfirm: {
    backgroundColor: colors.yellow,
  },
  modalBtnConfirmText: {
    color: colors.navy,
    fontWeight: '900',
  },
};
