import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { colors, typography, spacing, radius } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { FileUploadField } from '../../../components/FileUploadField/FileUploadField';
import CategoryMultiSelect from '../components/CategoryMultiSelect';
import { MapPickerModal, type Coordinate } from '../components/MapPickerModal';
import { useRegister } from '../hooks/useRegister';
import { useResubmit } from '../hooks/useResubmit';
import { setTenantProfile, setTenantStatusPending } from '../store/authSlice';
import { vendorApi } from '../../../api/vendorApi';
import type { TenantProfile } from '../../../types/vendor';
import type { RootState } from '../../../store';
import type { AuthStackParamList } from '../../../navigation/types';
import Toast from 'react-native-toast-message';
import { User, Mail, Lock, Phone, ArrowLeft, MapPin, Building2, Store, X, AlertCircle } from 'lucide-react-native';

type RegisterVendorNav = NativeStackNavigationProp<AuthStackParamList, 'RegisterVendor'>;
type RegisterVendorRoute = RouteProp<AuthStackParamList, 'RegisterVendor'>;

// Baris informasi read-only — dipakai saat mode resubmit supaya tenant melihat
// data lamanya tetap tersimpan tanpa perlu mengisi ulang (issue #59).
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function RegisterVendorScreen() {
  const navigation = useNavigation<RegisterVendorNav>();
  const route = useRoute<RegisterVendorRoute>();
  const dispatch = useDispatch();

  // Mode 'resubmit' = form registrasi awal dipakai tenant rejected untuk
  // mengajukan ulang (hanya unggah dokumen, data lama dipertahankan).
  const isResubmit = route.params?.mode === 'resubmit';

  const { registerVendor, loading, error } = useRegister();
  const { resubmit, loading: resubmitLoading, error: resubmitError } = useResubmit();

  const tenantProfile = useSelector((state: RootState) => state.auth.tenantProfile);
  const user = useSelector((state: RootState) => state.auth.user);
  const rejectionReason = useSelector((state: RootState) => state.auth.rejectionReason);

  const [businessName, setBusinessName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Teks read-only data lama saat mode resubmit.
  const [categoriesText, setCategoriesText] = useState('');
  const [addressText, setAddressText] = useState('');
  const [coordinateText, setCoordinateText] = useState('');

  const [ktpFile, setKtpFile] = useState<DocumentPickerAsset | null>(null);
  const [nibFile, setNibFile] = useState<DocumentPickerAsset | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<DocumentPickerAsset | null>(null);

  const pickDocument = async (
    setFile: (file: DocumentPickerAsset | null) => void,
    label: string,
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;
      setFile(result.assets[0]);
    } catch (err) {
      console.error(`Gagal memilih ${label}:`, err);
      Alert.alert('Gagal memilih file', `Terjadi kesalahan saat memilih ${label}. Coba lagi.`);
    }
  };

  // Pre-fill data lama tenant dari profil yang tersimpan — tenant TIDAK perlu
  // mengisi ulang informasi yang sama saat mengajukan ulang (issue #59).
  useEffect(() => {
    if (!isResubmit) return;

    (async () => {
      let profile = tenantProfile;
      if (!profile) {
        try {
          const res = await vendorApi.getMyProfile();
          profile = res.data?.data as TenantProfile | undefined;
          if (profile) dispatch(setTenantProfile(profile));
        } catch {
          // Profil tidak bisa dimuat — form tetap tampil dengan data yang ada.
        }
      }

      if (profile) {
        setBusinessName(profile.business_name || '');
        setCategoriesText((profile.categories ?? []).map((c) => c.name).join(', '));
        const addr = profile.address;
        setAddressText([addr?.street, addr?.city, addr?.province, addr?.postal_code].filter(Boolean).join(', '));
        const lat = profile.location?.latitude ?? profile.latitude;
        const lng = profile.location?.longitude ?? profile.longitude;
        setCoordinateText(
          typeof lat === 'number' && typeof lng === 'number' ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : ''
        );
        setPhone(profile.whatsapp_number || '');
        setEmail(user?.email ?? '');
      }
    })();
  }, [isResubmit, tenantProfile, user, dispatch]);

  const handleResubmit = async () => {
    if (!ktpFile && !nibFile && !portfolioFile) {
      Toast.show({
        type: 'error',
        text1: 'Belum ada dokumen dipilih',
        text2: 'Unggah minimal satu dokumen untuk mengajukan ulang pendaftaran.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    const result = await resubmit({
      ktpFile: ktpFile
        ? { uri: ktpFile.uri, name: ktpFile.name ?? undefined, type: ktpFile.mimeType ?? 'application/octet-stream' }
        : undefined,
      nibFile: nibFile
        ? { uri: nibFile.uri, name: nibFile.name ?? undefined, type: nibFile.mimeType ?? 'application/octet-stream' }
        : undefined,
      portfolioFile: portfolioFile
        ? { uri: portfolioFile.uri, name: portfolioFile.name ?? undefined, type: portfolioFile.mimeType ?? 'application/octet-stream' }
        : undefined,
    });

    if (result.success) {
      // Status rejected → pending + rejection_reason dihapus dari state lokal.
      dispatch(setTenantStatusPending());

      Toast.show({
        type: 'success',
        text1: 'Pengajuan ulang terkirim',
        text2: 'Status pendaftaran kini menunggu persetujuan admin.',
        position: 'top',
        visibilityTime: 3000,
      });

      // Kembali ke layar status (tanpa mode rejected karena sudah pending).
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingApproval', params: { businessName } }],
      });
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password tidak cocok',
        text2: 'Password dan konfirmasi password harus sama.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    if (categories.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Kategori belum dipilih',
        text2: 'Pilih minimal 1 kategori layanan.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    if (!coordinate) {
      setLocationError(true);
      Toast.show({
        type: 'error',
        text1: 'Titik lokasi belum dipilih',
        text2: 'Pilih titik lokasi usaha Anda di peta.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
  
    const result = await registerVendor({
      businessName,
      categories,
      address,
      phone,
      email,
      password,
      passwordConfirmation: confirmPassword,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      ...(ktpFile && {
        ktpFile: {
          uri: ktpFile.uri,
          name: ktpFile.name ?? undefined,
          type: ktpFile.mimeType ?? 'application/octet-stream',
        },
      }),
      ...(nibFile && {
        nibFile: {
          uri: nibFile.uri,
          name: nibFile.name ?? undefined,
          type: nibFile.mimeType ?? 'application/octet-stream',
        },
      }),
      ...(portfolioFile && {
        portfolioFile: {
          uri: portfolioFile.uri,
          name: portfolioFile.name ?? undefined,
          type: portfolioFile.mimeType ?? 'application/octet-stream',
        },
      }),
    });

    if (result.success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingApproval', params: { businessName } }],
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.title}>{isResubmit ? 'Ajukan Ulang Pendaftaran' : 'Daftar Tenant'}</Text>
          <Text style={styles.subtitle}>
            {isResubmit
              ? 'Data pendaftaran lama Anda sudah tersimpan dan tetap digunakan. Cukup unggah ulang dokumen yang diminta admin, lalu kirim ulang.'
              : 'Mari berkembang bersama JogjaHub dan jangkau lebih banyak pelanggan'}
          </Text>
        </View>

        {isResubmit && (
          <View>
            {/* ── BANNER CATATAN REVISI ADMIN (tetap terlihat saat memperbaiki) ── */}
            <View style={styles.rejectionBanner}>
              <View style={styles.rejectionBannerHeader}>
                <AlertCircle size={18} color="#BE123C" />
                <Text style={styles.rejectionBannerTitle}>Catatan Revisi dari Admin</Text>
              </View>
              <Text style={styles.rejectionBannerMessage}>
                {rejectionReason || 'Admin belum menyertakan catatan khusus. Silakan periksa kembali dokumen Anda.'}
              </Text>
            </View>

            {/* ── 1. INFORMASI BISNIS (read-only, data lama dipertahankan) ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Informasi Bisnis</Text>
              <View style={styles.infoBox}>
                <InfoRow label="Nama Bisnis / Toko" value={businessName} />
                <InfoRow label="Kategori Layanan" value={categoriesText} />
                <InfoRow label="Alamat Lengkap" value={addressText} />
                <InfoRow label="Titik Lokasi" value={coordinateText} />
              </View>
            </View>

            {/* ── 2. INFORMASI AKUN (read-only, data lama dipertahankan) ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Informasi Akun</Text>
              <View style={styles.infoBox}>
                <InfoRow label="Email" value={email} />
                <InfoRow label="Nomor Telepon / WhatsApp" value={phone} />
              </View>
            </View>

            {/* ── 3. DOKUMEN VERIFIKASI (satu-satunya yang perlu diunggah ulang) ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Dokumen Verifikasi</Text>
              <Text style={styles.helperText}>
                Unggah ulang dokumen yang diminta admin (minimal 1 dokumen). Dokumen lama yang tidak diunggah ulang akan tetap dipertahankan.
              </Text>

              <View style={{ marginTop: 16 }}>
                <FileUploadField
                  label="KTP Pemilik"
                  fileName={ktpFile?.name}
                  onPress={() => pickDocument(setKtpFile, 'KTP')}
                  onRemove={() => setKtpFile(null)}
                />
                <FileUploadField
                  label="NIB (Nomor Induk Berusaha)"
                  fileName={nibFile?.name}
                  onPress={() => pickDocument(setNibFile, 'NIB')}
                  onRemove={() => setNibFile(null)}
                />
                <FileUploadField
                  label="Portofolio Layanan"
                  fileName={portfolioFile?.name}
                  onPress={() => pickDocument(setPortfolioFile, 'Portofolio')}
                  onRemove={() => setPortfolioFile(null)}
                />
              </View>
            </View>

            {resubmitError ? <Text style={styles.errorText}>{resubmitError}</Text> : null}

            <View style={styles.footerSpacing}>
              <Button label="Simpan & Ajukan Ulang" onPress={handleResubmit} loading={resubmitLoading} />
            </View>
          </View>
        )}

        {!isResubmit && (
          <>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informasi Bisnis</Text>
          <Input 
            label="Nama Bisnis / Toko" 
            placeholder="Masukkan nama bisnis Anda" 
            value={businessName} 
            onChangeText={setBusinessName}
            leftIcon={<Store size={20} color={colors.outline} />}
          />
          
          <Text style={styles.inputLabel}>Kategori Layanan</Text>
          <CategoryMultiSelect selected={categories} onChange={setCategories} />
          <View style={{ height: 16 }} />

          <Input
            label="Alamat Lengkap"
            placeholder="Contoh: Jl. Kaliurang KM 5..."
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            leftIcon={<MapPin size={20} color={colors.outline} style={{ marginTop: 12 }} />}
            style={styles.textArea}
          />

          <Pressable
            style={({ pressed }) => [styles.mapPickerRow, pressed && styles.mapPickerRowPressed, locationError && !coordinate && styles.mapPickerRowError]}
            onPress={() => setMapVisible(true)}
          >
            <MapPin size={20} color={colors.primaryContainer} />
            <View style={styles.mapPickerTextWrap}>
              <Text style={styles.mapPickerTitle}>
                {coordinate ? 'Titik lokasi dipilih' : 'Pilih titik lokasi di peta'}
              </Text>
              <Text style={[styles.mapPickerSub, locationError && !coordinate && styles.mapPickerSubError]} numberOfLines={1}>
                {coordinate
                  ? `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`
                  : 'Wajib dipilih — tandai lokasi usaha Anda di peta'}
              </Text>
            </View>
            {coordinate ? (
              <Pressable onPress={() => setCoordinate(null)} hitSlop={12}>
                <X size={18} color={colors.error} />
              </Pressable>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Informasi Akun</Text>
          <Input 
            label="Email" 
            placeholder="Masukkan email aktif" 
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={email} 
            onChangeText={setEmail}
            leftIcon={<Mail size={20} color={colors.outline} />}
          />
          <Input 
            label="Nomor Telepon / WhatsApp" 
            placeholder="Masukkan nomor HP" 
            keyboardType="phone-pad" 
            value={phone} 
            onChangeText={setPhone}
            leftIcon={<Phone size={20} color={colors.outline} />}
          />
          <Input 
            label="Password" 
            placeholder="Buat password" 
            isPassword 
            value={password} 
            onChangeText={setPassword}
            leftIcon={<Lock size={20} color={colors.outline} />}
          />
          <Input 
            label="Konfirmasi Password" 
            placeholder="Ulangi password" 
            isPassword 
            value={confirmPassword} 
            onChangeText={setConfirmPassword}
            leftIcon={<Lock size={20} color={colors.outline} />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Dokumen Verifikasi</Text>
          <Text style={styles.helperText}>wajib dilengkapi untuk Verifikasi admin</Text>
          
          <View style={{ marginTop: 16 }}>
            <FileUploadField 
              label="KTP Pemilik" 
              fileName={ktpFile?.name} 
              onPress={() => pickDocument(setKtpFile, 'KTP')} 
              onRemove={() => setKtpFile(null)}
            />
            <FileUploadField 
              label="NIB (Nomor Induk Berusaha)" 
              fileName={nibFile?.name} 
              onPress={() => pickDocument(setNibFile, 'NIB')} 
              onRemove={() => setNibFile(null)}
            />
            <FileUploadField 
              label="Portofolio Layanan" 
              fileName={portfolioFile?.name} 
              onPress={() => pickDocument(setPortfolioFile, 'Portofolio')} 
              onRemove={() => setPortfolioFile(null)}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.footerSpacing}>
          <Button label="Daftar Sekarang" onPress={handleRegister} loading={loading} />
        </View>
          </>
        )}
      </ScrollView>

      {!isResubmit && (
        <MapPickerModal
          visible={mapVisible}
          initialCoordinate={coordinate}
          onClose={() => setMapVisible(false)}
          onConfirm={(picked) => {
            setCoordinate(picked);
            setLocationError(false);
            setMapVisible(false);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap },
  header: { marginBottom: spacing.stackXl },
  backBtn: { marginBottom: spacing.stackLg },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.stackLg,
    marginBottom: spacing.stackLg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: typography.headlineSm.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
  },
  inputLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurface,
    marginBottom: 6,
  },
  textArea: { 
    minHeight: 80, 
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helperText: { 
    color: colors.onSurfaceVariant, 
    fontFamily: typography.bodySm.fontFamily, 
    fontSize: typography.bodySm.fontSize, 
    lineHeight: 20 
  },
  errorText: { 
    color: colors.error, 
    fontFamily: typography.bodyMd.fontFamily, 
    fontSize: 13, 
    marginTop: spacing.stackSm,
    marginBottom: spacing.stackLg,
    textAlign: 'center'
  },
  mapPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerLowest,
  },
  mapPickerRowPressed: { backgroundColor: colors.surfaceContainerLow, borderColor: colors.primaryContainer },
  mapPickerTextWrap: { flex: 1 },
  mapPickerTitle: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: typography.labelLg.fontSize,
    color: colors.onSurface,
  },
  mapPickerSub: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
    color: colors.outline,
  },
  mapPickerRowError: { borderColor: colors.error },
  mapPickerSubError: { color: colors.error },

  // Banner Catatan Revisi Admin (mode resubmit)
  rejectionBanner: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: spacing.stackLg,
  },
  rejectionBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rejectionBannerTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#BE123C',
  },
  rejectionBannerMessage: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: '#881337',
    lineHeight: 18,
  },

  // Kartu info read-only data lama (mode resubmit)
  infoBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  infoValue: {
    flex: 2,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'right',
  },

  footerSpacing: { marginBottom: spacing.stackXl },
});
