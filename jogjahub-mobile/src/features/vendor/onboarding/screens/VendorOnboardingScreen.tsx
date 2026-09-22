import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../../store';
import { setTenantProfile } from '../../../../features/auth/store/authSlice';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Input } from '../../../../components/Input/Input';
import { Button } from '../../../../components/Button/Button';
import { RealCategoryMultiSelect } from '../components/RealCategoryMultiSelect';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';
import type { TenantProfile } from '../../../../types/vendor';
import { 
  Store, MapPin, Tag, ChevronLeft, Map, Compass, 
  AlignLeft
} from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';

type CategoryOption = { id: number; name: string };

export default function VendorOnboardingScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const existingProfile = useSelector((state: RootState) => state.auth.tenantProfile);

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const list = (res.data?.data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
        setCategories(list);
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Gagal memuat kategori' });
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (existingProfile) {
      setBusinessName(existingProfile.business_name || '');
      setDescription(existingProfile.description || '');
      setStreet(existingProfile.address?.street || '');
      setCity(existingProfile.address?.city || '');
      setProvince(existingProfile.address?.province || '');
      setPostalCode(existingProfile.address?.postal_code || '');
      setWhatsappNumber(existingProfile.whatsapp_number || '');
      setLatitude(existingProfile.latitude ? String(existingProfile.latitude) : '');
      setLongitude(existingProfile.longitude ? String(existingProfile.longitude) : '');
      setSelectedCategoryIds(existingProfile.categories?.map((c) => c.id) || []);
    }
  }, [existingProfile]);

  // ── Auto-fill Reverse Geocoding ──
  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Izin lokasi ditolak', text2: 'Aktifkan GPS Anda.' });
        return;
      }
      
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
      
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geocoded.length > 0) {
        const addr = geocoded[0];
        
        // Gabungkan nama tempat, jalan, dan kecamatan agar lebih lengkap
        const addressParts = [addr.name, addr.street, addr.district].filter(Boolean);
        const combinedStreet = addressParts.join(', ');
        
        if (combinedStreet) setStreet(combinedStreet);
        if (addr.city || addr.subregion) setCity(addr.city || addr.subregion || '');
        if (addr.region) setProvince(addr.region);
        if (addr.postalCode) setPostalCode(addr.postalCode);
      }

      Toast.show({ type: 'success', text1: 'Lokasi & alamat otomatis terisi!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal mendeteksi lokasi', text2: 'Isi manual atau coba lagi.' });
    } finally {
      setLocating(false);
    }
  };

  const handleOpenMapPicker = () => {
    Alert.alert(
      "Fitur Segera Hadir", 
      "Pemilihan titik manual via peta interaktif sedang dalam tahap pengembangan. Silakan gunakan tombol Deteksi Otomatis untuk saat ini."
    );
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!businessName.trim()) errors.business_name = 'Nama bisnis wajib diisi.';
    if (!street.trim()) errors.street = 'Jalan wajib diisi.';
    if (!city.trim()) errors.city = 'Kota wajib diisi.';
    if (!province.trim()) errors.province = 'Provinsi wajib diisi.';
    if (!whatsappNumber.trim()) errors.whatsapp_number = 'WhatsApp wajib diisi.';
    if (!latitude || !longitude) errors.coordinates = 'Koordinat wajib diisi (Gunakan deteksi GPS).';
    if (selectedCategoryIds.length === 0) errors.category_ids = 'Pilih minimal satu kategori.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      Toast.show({ type: 'error', text1: 'Data belum lengkap', text2: 'Periksa peringatan merah di form.' });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const res = await vendorApi.updateMyProfile({
        business_name: businessName,
        description: description || undefined,
        address: { street, city, province, postal_code: postalCode || undefined },
        latitude: Number(latitude),
        longitude: Number(longitude),
        whatsapp_number: whatsappNumber,
        category_ids: selectedCategoryIds,
      });

      const profileData = res.data?.data as TenantProfile | undefined;
      if (profileData && existingProfile) {
        if (existingProfile.status === 'approved') profileData.status = 'approved';
        dispatch(setTenantProfile(profileData));
      }

      Toast.show({ type: 'success', text1: 'Profil berhasil diperbarui!' });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Gagal menyimpan data.';
      Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: msg });
    } finally {
      setSaving(false);
    }
  };

  // Kalkulasi Kelengkapan Profil
  let completeness = 0;
  if (businessName) completeness += 20;
  if (description) completeness += 10;
  if (whatsappNumber) completeness += 20;
  if (street && city && province) completeness += 20;
  if (latitude && longitude) completeness += 10;
  if (selectedCategoryIds.length > 0) completeness += 20;

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil Bisnis</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── PROGRESS BAR ── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Kelengkapan Data</Text>
          <Text style={styles.progressValue}>{completeness}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completeness}%` }]} />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Pastikan informasi di bawah valid agar pelanggan mudah memesan layanan Anda.
        </Text>

        {/* ── SECTION 1: INFO UTAMA ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}><Store size={18} color={colors.primary} /></View>
            <Text style={styles.sectionTitle}>Identitas Bisnis</Text>
          </View>
          
          <Text style={styles.inputLabelText}>Nama Bisnis</Text>
          <Input
            placeholder="Contoh: Jasa Servis AC Makmur"
            value={businessName}
            onChangeText={(text) => { setBusinessName(text); setFieldErrors(prev => ({ ...prev, business_name: '' })); }}
            style={styles.inputSpacing}
            error={fieldErrors.business_name}
          />
          
          <View style={styles.inputGroupLabel}>
            <AlignLeft size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.inputLabelText}>Deskripsi Singkat</Text>
          </View>
          <Input
            placeholder="Ceritakan spesialisasi, jam operasional, atau keunggulan layanan Anda..."
            value={description}
            onChangeText={(text) => setDescription(text)}
            multiline
            numberOfLines={4}
            style={[styles.inputSpacing, styles.textArea]}
          />

          <View style={styles.inputGroupLabel}>
            <FontAwesome name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.inputLabelText}>Nomor WhatsApp</Text>
          </View>
          <Input
            placeholder="Contoh: 08123456789"
            value={whatsappNumber}
            onChangeText={(text) => { setWhatsappNumber(text); setFieldErrors(prev => ({ ...prev, whatsapp_number: '' })); }}
            keyboardType="phone-pad"
            error={fieldErrors.whatsapp_number}
          />
        </View>

        {/* ── SECTION 2: KATEGORI ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}><Tag size={18} color={colors.primary} /></View>
            <Text style={styles.sectionTitle}>Kategori & Layanan</Text>
          </View>
          
          <Text style={styles.helperTextBold}>Pilih Kategori (Bisa lebih dari 1)</Text>
          {loadingCategories ? (
            <Text style={styles.helperText}>Memuat kategori...</Text>
          ) : (
            <RealCategoryMultiSelect
              categories={categories}
              selected={selectedCategoryIds}
              onChange={(ids) => { setSelectedCategoryIds(ids); setFieldErrors(prev => ({ ...prev, category_ids: '' })); }}
            />
          )}
          {fieldErrors.category_ids && (
            <Text style={styles.errorText}>{fieldErrors.category_ids}</Text>
          )}
        </View>

        {/* ── SECTION 3: LOKASI ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}><MapPin size={18} color={colors.primary} /></View>
            <Text style={styles.sectionTitle}>Alamat & Lokasi Map</Text>
          </View>

          {/* Tombol Ajaib Deteksi Lokasi */}
          <View style={styles.locationButtonsRow}>
            <TouchableOpacity style={styles.magicButton} onPress={useCurrentLocation} disabled={locating}>
              <Compass size={18} color="#fff" />
              <Text style={styles.magicButtonText}>
                {locating ? 'Mendeteksi...' : 'Deteksi Lokasi GPS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMapPicker}>
              <Map size={18} color={colors.primary} />
              <Text style={styles.mapButtonText}>Pilih dari Peta</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperTextCenter}>
            (Otomatis mengisi alamat dan mengamankan koordinat GPS Anda)
          </Text>

          <View style={styles.divider} />

          <Text style={styles.inputLabelText}>Alamat Lengkap (Otomatis Terisi)</Text>
          <Input
            placeholder="Nama Jalan / Detail Gedung / Blok"
            value={street}
            onChangeText={(text) => { setStreet(text); setFieldErrors(prev => ({ ...prev, street: '' })); }}
            style={styles.inputSpacing}
            error={fieldErrors.street}
          />
          
          <View style={styles.row}>
            <Input
              placeholder="Kota/Kabupaten"
              value={city}
              onChangeText={(text) => { setCity(text); setFieldErrors(prev => ({ ...prev, city: '' })); }}
              style={[styles.inputSpacing, styles.rowInput]}
              error={fieldErrors.city}
            />
            <Input
              placeholder="Provinsi"
              value={province}
              onChangeText={(text) => { setProvince(text); setFieldErrors(prev => ({ ...prev, province: '' })); }}
              style={[styles.inputSpacing, styles.rowInput]}
              error={fieldErrors.province}
            />
          </View>

          <Input
            placeholder="Kode Pos (Opsional)"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="number-pad"
            style={styles.inputSpacing}
          />

          {/* Indikator Koordinat (menggantikan input manual) */}
          {latitude && longitude ? (
            <Text style={[styles.helperText, { color: colors.accentGreen, marginTop: 4, fontWeight: '500' }]}>
              ✓ Titik koordinat GPS berhasil disimpan (Tersembunyi)
            </Text>
          ) : (
            <Text style={[styles.helperText, { color: colors.error, marginTop: 4 }]}>
              {fieldErrors.coordinates || '⚠️ Koordinat GPS belum didapatkan. Tekan tombol Deteksi Lokasi di atas.'}
            </Text>
          )}
        </View>

      </ScrollView>

      {/* ── STICKY FOOTER ── */}
      <View style={styles.stickyFooter}>
        <Button 
          label={saving ? 'Menyimpan Perubahan...' : 'Simpan Profil'} 
          onPress={handleSave} 
          disabled={saving} 
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'flex-start', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  
  // Progress
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  progressTextRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  progressLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, color: colors.secondary, fontWeight: '600',
  },
  progressValue: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, color: colors.primary, fontWeight: '700',
  },
  progressBarBg: {
    height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', backgroundColor: colors.accentGreen, borderRadius: 3,
  },

  content: { padding: spacing.containerMargin, paddingBottom: 100 },
  subtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13, color: colors.secondary, marginBottom: 20, lineHeight: 20,
  },
  
  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 15, fontWeight: '700', color: colors.onSurface,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 },

  // Inputs
  inputSpacing: { marginBottom: 14 },
  textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  row: { flexDirection: 'row', gap: 10 },
  rowInput: { flex: 1 },
  
  inputLabelText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 6,
  },
  inputGroupLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 4,
  },

  // Location Auto Deteksi
  locationButtonsRow: {
    flexDirection: 'row', gap: 10, marginTop: 6
  },
  magicButton: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  magicButtonText: {
    fontFamily: typography.labelMd.fontFamily, fontSize: 13, fontWeight: '700', color: '#fff',
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: radius.md,
    paddingVertical: 14, borderWidth: 1, borderColor: '#DBEAFE',
  },
  mapButtonText: {
    fontFamily: typography.labelMd.fontFamily, fontSize: 13, fontWeight: '700', color: colors.primary,
  },

  helperTextCenter: { 
    fontFamily: typography.bodyMd.fontFamily, fontSize: 11, color: colors.secondary, 
    textAlign: 'center', marginTop: 12, marginBottom: 4 
  },
  
  helperText: { fontFamily: typography.bodyMd.fontFamily, fontSize: 12, color: colors.secondary },
  helperTextBold: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 8 },
  errorText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.error, marginTop: 4 },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: spacing.containerMargin,
    paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 32 : spacing.containerMargin,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 10,
  },
});