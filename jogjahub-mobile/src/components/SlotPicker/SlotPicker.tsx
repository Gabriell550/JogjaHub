// Dipakai di customer/booking (pilih slot) & vendor/calendar (atur kapasitas slot).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  availableSlots: string[];
  selectedSlot?: string;
  onSelect: (slot: string) => void;
  fullSlots?: string[];
};

export function SlotPicker({ availableSlots, selectedSlot, onSelect, fullSlots = [] }: Props) {
  return (
    <View style={styles.grid}>
      {availableSlots.map((slot) => {
        const isSelected = selectedSlot === slot;
        const isFull = fullSlots.includes(slot);

        return (
          <TouchableOpacity
            key={slot}
            style={[
              styles.slotCard,
              isFull && styles.slotCardFull,
              isSelected && styles.slotCardSelected,
            ]}
            onPress={() => !isFull && onSelect(slot)}
            disabled={isFull}
            activeOpacity={0.85}
          >
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.timeText,
                  isFull && styles.timeTextFull,
                  isSelected && styles.timeTextSelected,
                ]}
              >
                {slot}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={16} color="#FF6B00" />
              )}
            </View>

            <View style={styles.statusRow}>
              {isSelected ? (
                <Text style={styles.selectedLabel}>Selected</Text>
              ) : isFull ? (
                <>
                  <View style={styles.greyDot} />
                  <Text style={styles.fullLabel}>Penuh</Text>
                </>
              ) : (
                <>
                  <View style={styles.blueDot} />
                  <Text style={styles.availableLabel}>Tersedia</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  slotCardSelected: {
    borderColor: '#FF6B00',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  slotCardFull: {
    backgroundColor: '#F3F6FA',
    borderColor: '#F3F6FA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeTextFull: {
    color: '#94A3B8',
  },
  timeTextSelected: {
    color: '#1E293B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
    marginRight: 6,
  },
  greyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  availableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  fullLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
});
