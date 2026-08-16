import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Button } from '../../../../components/Button/Button';
import type { AuthStackParamList } from '../../../../navigation/types';
import { logout } from '../../../auth/store/authSlice';
import { setToken } from '../../../../services/tokenStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'PendingApproval'>;
type Route = RouteProp<AuthStackParamList, 'PendingApproval'>;

// Tampil setelah RegisterVendorScreen sukses submit atau saat login jika status masih pending/rejected.
// Vendor BELUM bisa login penuh sampai admin approve.
export default function PendingApprovalScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const { params } = useRoute<Route>();
  const isRejected = params?.rejected ?? false;

  const handleBackToLogin = () => {
    dispatch(logout());
    setToken(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.iconCircle, isRejected && styles.iconCircleError]}>
        <Text style={styles.icon}>{isRejected ? '❌' : '⏳'}</Text>
      </View>

      <Text style={styles.title}>{isRejected ? 'Pendaftaran Ditolak' : 'Menunggu Persetujuan Admin'}</Text>

      <Text style={styles.body}>
        {isRejected
          ? `Pendaftaran ${params?.businessName ?? 'Anda'} tidak disetujui oleh admin JogjaHub.`
          : `${params?.businessName ? `Pendaftaran ${params.businessName} ` : 'Pendaftaran Anda '}berhasil dikirim. Admin JogjaHub akan meninjau KTP dan Surat Badan Usaha yang kamu upload — proses ini biasanya memakan waktu 1–2 hari kerja.`}
      </Text>

      <Text style={styles.bodySecondary}>
        {isRejected
          ? 'Silakan hubungi support untuk informasi lebih lanjut atau coba daftar ulang dengan data yang benar.'
          : 'Kamu akan bisa login penuh sebagai vendor setelah status akun disetujui. Silakan cek lagi nanti.'}
      </Text>

      <Button label="Kembali ke Login" onPress={handleBackToLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.containerMargin,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.stackLg,
  },
  iconCircleError: {
    backgroundColor: colors.errorContainer,
  },
  icon: { fontSize: 40 },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.stackMd,
  },
  body: {
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.stackMd,
    lineHeight: typography.bodyLg.lineHeight,
  },
  bodySecondary: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sectionGap,
    lineHeight: typography.bodyMd.lineHeight,
  },
});
