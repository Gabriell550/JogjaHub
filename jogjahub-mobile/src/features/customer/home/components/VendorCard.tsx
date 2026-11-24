import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import type { CatalogCard } from '../../catalog/useCatalog';

interface VendorCardProps {
  vendor: CatalogCard;
  onPressCard?: () => void;
  onPressBook?: () => void;
}

function formatPrice(value: number) {
  if (value >= 1000000) {
    return `Rp${(value / 1000000).toFixed(1)}jt`;
  }
  return `Rp${Math.round(value / 1000)}k`;
}

export default function VendorCard({ vendor, onPressCard, onPressBook }: VendorCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <TouchableOpacity
          onPress={onPressCard}
          disabled={!onPressCard}
          accessibilityRole="button"
          accessibilityLabel={'Lihat detail ' + vendor.serviceName}
        >
          {vendor.imageUrl ? <Image source={{ uri: vendor.imageUrl }} style={styles.image} /> : <View style={styles.image} />}
        </TouchableOpacity>

      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{vendor.category}</Text>
        <TouchableOpacity accessibilityRole="button" disabled={!onPressCard} onPress={onPressCard} style={styles.titleButton}>
          <Text style={styles.name}>{vendor.serviceName}</Text>
        </TouchableOpacity>
        <Text style={styles.location}>{vendor.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />
          <Text style={styles.location} numberOfLines={1}>
            {vendor.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>{vendor.perNight ? 'Per malam' : 'Harga layanan'}</Text>
            <Text style={styles.price}>{formatPrice(vendor.priceFrom)}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.bookButton} onPress={onPressBook} activeOpacity={0.85}>
            <Text style={styles.bookButtonText}>Pesan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 224, maxWidth: '100%', marginRight: 12, overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.xl,
    borderWidth: 1, borderColor: customerColors.border,
  },
  image: { width: '100%', height: 138, backgroundColor: colors.accentGreenContainer },
  ratingBadge: {
    position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 4,
    alignItems: 'center', backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingText: { ...typography.labelSm, color: colors.navy },
  favoriteButton: {
    position: 'absolute', top: 8, right: 8, width: 48, height: 48,
    borderRadius: radius.full, backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 12, gap: 4 },
  category: { ...typography.labelSm, color: colors.primary },
  titleButton: { minHeight: 48, justifyContent: 'center' },
  name: { ...typography.headlineSm, color: colors.navy },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { ...typography.bodySm, color: colors.onSurfaceVariant, flexShrink: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 6 },
  priceLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  price: { ...typography.labelLg, color: customerColors.hero },
  bookButton: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 14, minHeight: 48, justifyContent: 'center',
  },
  bookButtonText: { ...typography.labelLg, color: colors.onPrimary },
});
