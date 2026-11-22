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

export function TenantServicesContent({ services, onSeeAll, onAddService, onPressService }: Props) {
  const [contentWidth, setContentWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const cardWidth = Math.max(128, Math.min(200, (contentWidth - 32) / 2));

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
            <View aria-hidden><ChevronRight size={16} color={colors.primary} /></View>
          </TenantPressable>
        )}
      </View>
      {services.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {services.map(service => {
            const price = `Rp${Number(service.price).toLocaleString('id-ID')}`;
            return (
              <TenantPressable
                key={service.id}
                accessibilityRole="button" accessibilityLabel={`${service.name}, ${price}`}
                style={[dashboardStyles.card, styles.service, { width: cardWidth }]}
                onPress={() => onPressService(service)}
              >
                <View aria-hidden>
                  <ServicePhoto
                    uri={getPrimaryPhotoUrl(service)}
                    style={styles.photo}
                    placeholderStyle={[styles.photo, styles.placeholder]}
                    iconSize={20}
                    iconColor={colors.onSurfaceVariant}
                  />
                </View>
                <Text numberOfLines={fontScale > tenantLayout.largeFontScale ? undefined : 2} style={styles.name}>
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
  carousel: { gap: spacing.stackSm },
  service: { padding: 8, gap: 4, justifyContent: 'flex-start' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, marginBottom: 4 },
  placeholder: { backgroundColor: colors.grayPale, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.bodyMd, color: colors.onSurface },
  price: { ...typography.labelMd, color: colors.primary },
  empty: { padding: 16, gap: 4, alignItems: 'flex-start' },
  emptyDescription: { ...typography.bodySm, color: colors.onSurfaceVariant },
  add: {
    alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 4, maxWidth: '100%',
  },
  addText: { ...typography.labelMd, color: colors.onPrimary, textAlign: 'center' },
});
