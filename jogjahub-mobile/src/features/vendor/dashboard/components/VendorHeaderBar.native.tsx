import React, { useId, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Settings } from 'lucide-react-native';
import { radius, spacing, typography } from '../../../../constants/theme';
import { tenantLayout } from '../../../../constants/theme/tenant';
import { TenantPressable } from '../../components/TenantPressable';

type Props = {
  businessName: string;
  nativeLayout?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onPressBell?: () => void;
  onPressAvatar?: () => void;
};

export function VendorHeaderBar({
  businessName,
  isOpen: controlledOpen,
  onToggleOpen,
  onPressAvatar,
}: Props) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlledOpen ?? localOpen;
  const handleToggle = onToggleOpen ?? (() => setLocalOpen(prev => !prev));

  const { width, fontScale } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const stacked = width - left - right < tenantLayout.narrowWidth || fontScale > tenantLayout.largeFontScale;
  const gradientId = `header-bg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View style={styles.header}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0B111E" />
            <Stop offset="50%" stopColor="#0F172A" />
            <Stop offset="100%" stopColor="#131F37" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>

      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox} aria-hidden>
            <Image
              source={require('../../../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.tenantTag}>TENANT</Text>
            <Text style={styles.brandTitle}>JogjaHub</Text>
          </View>
        </View>

        <TenantPressable
          accessibilityRole="button"
          accessibilityLabel="Pengaturan"
          onPress={onPressAvatar}
          onDark
          style={styles.settingsButton}
        >
          <Settings size={18} color="#E2E8F0" />
        </TenantPressable>
      </View>

      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <View style={[styles.nameRow, stacked && styles.nameStack]}>
          <Text accessibilityRole="header" numberOfLines={1} style={styles.businessName}>
            {businessName}
          </Text>
          <TenantPressable
            accessibilityRole="switch"
            accessibilityLabel="Status toko"
            accessibilityState={{ checked: isOpen }}
            onPress={handleToggle}
            onDark
            focusRadius={radius.full}
            style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusClosed]}
          >
            <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
            <Text style={styles.statusText}>
              {isOpen ? 'Toko Buka' : 'Toko Tutup'}
            </Text>
          </TenantPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  tenantTag: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 1.2,
  },
  brandTitle: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    marginTop: 2,
  },
  greeting: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.stackSm,
  },
  nameStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  businessName: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    flexShrink: 1,
    textTransform: 'capitalize',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusClosed: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(51, 65, 85, 0.7)',
  },
  statusOpen: {
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dotClosed: {
    backgroundColor: '#F43F5E',
  },
  dotOpen: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
});
