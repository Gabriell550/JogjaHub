import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import CustomerPhoto from '../../catalog/components/CustomerPhoto';
import type { CatalogCard } from '../../catalog/useCatalog';

interface VendorCardProps {
  vendor: CatalogCard;
  onPressCard?: () => void;
  fullWidth?: boolean;
}

export default function VendorCard({ vendor, onPressCard, fullWidth = false }: VendorCardProps) {
  return (
    <TouchableOpacity style={[styles.card, fullWidth && styles.fullWidth]} onPress={onPressCard} disabled={!onPressCard}
      accessibilityRole="button" accessibilityHint="Buka detail layanan">
      <CustomerPhoto urls={vendor.imageUrls} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.category}>{vendor.category}</Text>
        <Text style={styles.name}>{vendor.serviceName}</Text>
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
            <Text style={styles.price}>{'Rp ' + vendor.priceFrom.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Lihat detail</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 224, maxWidth: '100%', marginRight: 12, overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.xl,
    borderWidth: 1, borderColor: customerColors.border,
  },
  fullWidth: { width: '100%', marginRight: 0 },
  image: { width: '100%', height: 138, backgroundColor: colors.accentGreenContainer },
  content: { padding: 12, gap: 4 },
  category: { ...typography.labelSm, color: colors.primary },
  name: { ...typography.headlineSm, color: colors.navy },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { ...typography.bodySm, color: colors.onSurfaceVariant, flexShrink: 1 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 6 },
  priceLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  price: { ...typography.labelLg, color: customerColors.hero },
  bookButton: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 14, minHeight: 48, justifyContent: 'center',
  },
  bookButtonText: { ...typography.labelLg, color: colors.onPrimary },
});
