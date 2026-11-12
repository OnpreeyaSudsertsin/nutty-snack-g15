import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';
import { MONTHS, DAYS } from '../lib/tripUtils';

export default function DatePickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Date',
  minDate,
}) {
  const today = new Date();
  const init = initialDate ? new Date(initialDate) : today;

  const [currentYear, setCurrentYear] = useState(
    isNaN(init.getFullYear()) ? today.getFullYear() : init.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(init.getMonth()) ? today.getMonth() : init.getMonth()
  );
  const [selectedDayStr, setSelectedDayStr] = useState(
    initialDate ||
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`
  );

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handleDayPress = (day) => {
    const formatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    setSelectedDayStr(formatted);
  };

  const confirm = () => {
    onSelectDate(selectedDayStr);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>{title}</Text>

          {/* Month / Year nav */}
          <View style={modalStyles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={modalStyles.navBtn}>
              <Text style={modalStyles.navBtnText}>‹</Text>
            </TouchableOpacity>

            <Text style={modalStyles.monthYearText}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity onPress={nextMonth} style={modalStyles.navBtn}>
              <Text style={modalStyles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day names */}
          <View style={modalStyles.daysHeader}>
            {DAYS.map((d, idx) => (
              <Text
                key={idx}
                style={[
                  modalStyles.dayHeaderText,
                  idx === 0 && { color: colors.red },
                  idx === 6 && { color: '#888' },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={modalStyles.daysGrid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={modalStyles.dayCell} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;
              const isSelected = selectedDayStr === dateStr;
              const isPast = minDate && dateStr < minDate;

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => !isPast && handleDayPress(day)}
                  disabled={isPast}
                  style={[
                    modalStyles.dayCell,
                    isSelected && modalStyles.dayCellSelected,
                    isPast && modalStyles.dayCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.dayText,
                      isSelected && modalStyles.dayTextSelected,
                      isPast && modalStyles.dayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected preview */}
          <View style={modalStyles.previewBox}>
            <Text style={modalStyles.previewLabel}>Selected:</Text>
            <Text style={modalStyles.previewValue}>{selectedDayStr}</Text>
          </View>

          {/* Actions */}
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={onClose} style={[modalStyles.actionBtn, modalStyles.cancelBtn]}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={confirm} style={[modalStyles.actionBtn, modalStyles.confirmBtn]}>
              <Text style={modalStyles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 35, 75, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.cream,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.navy,
    lineHeight: 26,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  dayTextSelected: {
    fontWeight: '900',
    color: colors.navy,
  },
  dayTextDisabled: {
    color: colors.gray,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 15,
  },
  confirmBtn: {
    backgroundColor: colors.yellow,
  },
  confirmBtnText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 15,
  },
});
