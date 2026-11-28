import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantLayout } from '../../../../constants/theme/tenant';
import { getPrimaryPhotoUrl } from '../../../../utils/serviceImage';
import { TenantPressable } from '../../components/TenantPressable';
import { ServicePhoto } from '../../listing/components/ServicePhoto';
import type { ServiceItem } from './MyServicesSection';
import { dashboardStyles } from './tenantDashboardStyles';

type Props = {
  services: ServiceItem[];
  onSeeAll: () => void;
  onAddService: () => void;
  onPressService: (service: ServiceItem) => void;
};

const placeholderPalettes = [
  { bg: '#FFF7ED', border: '#FFEDD5', icon: '#FB923C' },
  { bg: '#F0F9FF', border: '#E0F2FE', icon: '#38BDF8' },
  { bg: '#FAF5FF', border: '#F3E8FF', icon: '#C084FC' },
];

export function TenantServicesContent({ services, onSeeAll, onAddService, onPressService }: Props) {
  const [contentWidth, setContentWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const cardWidth = Math.max(150, Math.min(180, (contentWidth - 20) / 2.2));

  return (
    <View style={styles.section} onLayout={event => setContentWidth(event.nativeEvent.layout.width)}>
      <View style={dashboardStyles.headingRow}>
        <Text accessibilityRole="header" style={dashboardStyles.heading}>Layanan Saya</Text>
        {services.length > 0 && (
          <TenantPressable
            accessibilityRole="button" accessibilityLabel="Lihat Semua Layanan"
            style={dashboardStyles.link} onPress={onSeeAll}
          >
            <Text style={dashboardStyles.linkText}>Lihat Semua</Text>
            <View aria-hidden><ChevronRight size={15} color="#EA580C" /></View>
          </TenantPressable>
        )}
      </View>
      {services.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {services.map((service, index) => {
            const price = `Rp${Number(service.price).toLocaleString('id-ID')}`;
            const palette = placeholderPalettes[index % placeholderPalettes.length];
            return (
              <TenantPressable
                key={service.id}
                accessibilityRole="button" accessibilityLabel={`${service.name}, ${price}`}
                style={[styles.serviceCard, { width: cardWidth }]}
                onPress={() => onPressService(service)}
              >
                <View aria-hidden>
                  <ServicePhoto
                    uri={getPrimaryPhotoUrl(service)}
                    style={styles.photo}
                    placeholderStyle={[styles.photo, styles.placeholder, { backgroundColor: palette.bg, borderColor: palette.border }]}
                    iconSize={26}
                    iconColor={palette.icon}
                  />
                </View>
                <Text numberOfLines={fontScale > tenantLayout.largeFontScale ? undefined : 1} style={styles.name}>
                  {service.name}
                </Text>
                <Text style={styles.price}>{price}</Text>
              </TenantPressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[dashboardStyles.card, styles.empty]}>
          <Text style={styles.name}>Belum ada layanan</Text>
          <Text style={styles.emptyDescription}>Tambahkan layanan yang kamu tawarkan.</Text>
          <TenantPressable
            accessibilityRole="button" style={styles.add} onPress={onAddService}
            onDark focusRadius={radius.full}
          >
            <Text style={styles.addText}>Tambah Layanan</Text>
          </TenantPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.stackLg, gap: spacing.stackSm },
  carousel: { gap: 14, paddingVertical: 2 },
  serviceCard: {
    padding: 12,
    gap: 4,
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  photo: { width: '100%', height: 96, borderRadius: 12, marginBottom: 8 },
  placeholder: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '700', color: '#0F172A' },
  price: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '800', color: '#C2410C', marginTop: 2 },
  empty: { padding: 16, gap: 4, alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.85)' },
  emptyDescription: { ...typography.bodySm, color: '#64748B' },
  add: {
    alignItems: 'center', backgroundColor: '#EA580C', borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 4, maxWidth: '100%',
  },
  addText: { ...typography.labelMd, color: colors.onPrimary, textAlign: 'center' },
});
