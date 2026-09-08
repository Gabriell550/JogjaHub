import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../../store';
import { setTenantProfile } from '../../../../features/auth/store/authSlice';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing } from '../../../../constants/theme';
import { Input } from '../../../../components/Input/Input';
import { Button } from '../../../../components/Button/Button';
import { RealCategoryMultiSelect } from '../components/RealCategoryMultiSelect';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';
import type { TenantProfile } from '../../../../types/vendor';

type CategoryOption = { id: number; name: string };

// FR-03 tahap 2: "Lengkapi Profil Bisnis" — beda dari form registrasi awal.
// Ini yang manggil PUT /tenant/profile, dan datanya jauh lebih lengkap dari yang diisi
// saat daftar: address object penuh, lat/long presisi, category_ids ASLI dari database.
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
  const hasChanges = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const list = (res.data?.data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
        setCategories(list);
      } catch (err) {
        console.log('Gagal ambil kategori:', err);
        Toast.show({ type: 'error', text1: 'Gagal memuat kategori', text2: 'Coba lagi nanti.' });
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // Pre-populate from existing profile
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

  const markDirty = () => {
    hasChanges.current = true;
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Izin lokasi ditolak', text2: 'Aktifkan izin lokasi untuk pakai fitur ini.' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
      markDirty();
      Toast.show({ type: 'success', text1: 'Lokasi berhasil diambil' });
    } catch (err) {
      console.log('Gagal ambil lokasi:', err);
      Toast.show({ type: 'error', text1: 'Gagal ambil lokasi', text2: 'Isi lat/long manual atau coba lagi.' });
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    // Client-side validation
    const errors: Record<string, string> = {};
    if (!businessName.trim()) errors.business_name = 'Nama bisnis wajib diisi.';
    if (!street.trim()) errors.street = 'Nama jalan wajib diisi.';
    if (!city.trim()) errors.city = 'Kota wajib diisi.';
    if (!province.trim()) errors.province = 'Provinsi wajib diisi.';
    if (!whatsappNumber.trim()) errors.whatsapp_number = 'Nomor WhatsApp wajib diisi.';
    if (!latitude || !longitude) errors.coordinates = 'Lokasi wajib diisi.';
    if (selectedCategoryIds.length === 0) errors.category_ids = 'Pilih minimal satu kategori.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      Toast.show({ type: 'error', text1: 'Data belum lengkap', text2: 'Periksa kembali form.' });
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

      // Update Redux with server response (source of truth)
      const profileData = res.data?.data as TenantProfile | undefined;
      if (profileData) {
        dispatch(setTenantProfile(profileData));
      }

      Toast.show({ type: 'success', text1: 'Profil bisnis tersimpan', text2: 'Menunggu approval admin.' });
      hasChanges.current = false;
      navigation.goBack();
    } catch (err: any) {
      console.log('Gagal simpan profil:', err?.response?.data ?? err);

      // Map Laravel validation errors
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(validationErrors)) {
          const message = Array.isArray(messages) ? messages[0] : messages;
          const fieldLabel = getFieldLabel(field);
          mapped[field] = typeof message === 'string' ? message : `${fieldLabel} tidak valid.`;
        }
        setFieldErrors(mapped);

        // Show first error
        const firstField = Object.keys(mapped)[0];
        if (firstField) {
          Toast.show({ type: 'error', text1: mapped[firstField] });
        }
      } else {
        const message = err?.response?.data?.message ?? 'Gagal menyimpan profil. Coba lagi.';
        Toast.show({ type: 'error', text1: 'Gagal menyimpan', text2: message });
      }
    } finally {
      setSaving(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      business_name: 'Nama bisnis',
      description: 'Deskripsi',
      'address.street': 'Nama jalan',
      'address.city': 'Kota',
      'address.province': 'Provinsi',
      'address.postal_code': 'Kode pos',
      latitude: 'Latitude',
      longitude: 'Longitude',
      whatsapp_number: 'Nomor WhatsApp',
      category_ids: 'Kategori',
    };
    return labels[field] || field;
  };

  // Track unsaved changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      const hasUnsaved =
        businessName !== (existingProfile?.business_name || '') ||
        description !== (existingProfile?.description || '') ||
        street !== (existingProfile?.address?.street || '') ||
        city !== (existingProfile?.address?.city || '') ||
        province !== (existingProfile?.address?.province || '') ||
        postalCode !== (existingProfile?.address?.postal_code || '') ||
        whatsappNumber !== (existingProfile?.whatsapp_number || '') ||
        latitude !== (existingProfile?.latitude ? String(existingProfile.latitude) : '') ||
        longitude !== (existingProfile?.longitude ? String(existingProfile.longitude) : '') ||
        JSON.stringify(selectedCategoryIds.sort()) !==
          JSON.stringify((existingProfile?.categories?.map((c) => c.id) || []).sort());
      hasChanges.current = hasUnsaved;
    }, 100);
    return () => clearTimeout(timeout);
  }, [businessName, description, street, city, province, postalCode, whatsappNumber, latitude, longitude, selectedCategoryIds, existingProfile]);

  // Unsaved changes confirmation on back
  useFocusEffect(
    useCallback(() => {
      const subscription = navigation.addListener('beforeRemove', (e) => {
        if (!hasChanges.current) return;
        e.preventDefault();
        Alert.alert(
          'Perubahan belum disimpan',
          'Apakah Anda yakin ingin keluar? Perubahan Anda akan hilang.',
          [
            { text: 'Tinggalkan', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
            { text: 'Batalkan', style: 'cancel', onPress: () => {} },
          ],
        );
      });
     return () => subscription();
    }, [navigation]),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backText}>{'← Kembali'}</Text>
      </Pressable>

      <Text style={styles.title}>Lengkapi Profil Bisnis</Text>
      <Text style={styles.subtitle}>Data ini yang dilihat customer & dipakai admin untuk verifikasi.</Text>

      <Input
        placeholder="Nama Bisnis"
        value={businessName}
        onChangeText={(text) => { setBusinessName(text); markDirty(); setFieldErrors(prev => ({ ...prev, business_name: '' })); }}
        style={styles.inputSpacing}
        error={fieldErrors.business_name}
      />
      <Input
        placeholder="Deskripsi singkat bisnis"
        value={description}
        onChangeText={(text) => { setDescription(text); markDirty(); }}
        multiline
        numberOfLines={3}
        style={[styles.inputSpacing, styles.textArea]}
      />

      <Text style={styles.sectionLabel}>Alamat</Text>
      <Input
        placeholder="Nama Jalan"
        value={street}
        onChangeText={(text) => { setStreet(text); markDirty(); setFieldErrors(prev => ({ ...prev, street: '', 'address.street': '' })); }}
        style={styles.inputSpacing}
        error={fieldErrors.street || fieldErrors['address.street']}
      />
      <Input
        placeholder="Kota"
        value={city}
        onChangeText={(text) => { setCity(text); markDirty(); setFieldErrors(prev => ({ ...prev, city: '', 'address.city': '' })); }}
        style={styles.inputSpacing}
        error={fieldErrors.city || fieldErrors['address.city']}
      />
      <Input
        placeholder="Provinsi"
        value={province}
        onChangeText={(text) => { setProvince(text); markDirty(); setFieldErrors(prev => ({ ...prev, province: '', 'address.province': '' })); }}
        style={styles.inputSpacing}
        error={fieldErrors.province || fieldErrors['address.province']}
      />
      <Input
        placeholder="Kode Pos (opsional)"
        value={postalCode}
        onChangeText={(text) => { setPostalCode(text); markDirty(); }}
        keyboardType="number-pad"
        style={styles.inputSpacing}
      />

      <Input
        placeholder="Nomor WhatsApp"
        value={whatsappNumber}
        onChangeText={(text) => { setWhatsappNumber(text); markDirty(); setFieldErrors(prev => ({ ...prev, whatsapp_number: '' })); }}
        keyboardType="phone-pad"
        style={styles.inputSpacing}
        error={fieldErrors.whatsapp_number}
      />

      <Text style={styles.sectionLabel}>Lokasi (untuk peta customer)</Text>
      <Pressable style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
        <Text style={styles.locationButtonText}>{locating ? 'Mengambil lokasi...' : '📍 Gunakan Lokasi Saat Ini'}</Text>
      </Pressable>
      <View style={styles.row}>
        <Input
          placeholder="Latitude"
          value={latitude}
          onChangeText={(text) => { setLatitude(text); markDirty(); }}
          keyboardType="numbers-and-punctuation"
          style={[styles.inputSpacing, styles.rowInput]}
          error={fieldErrors.coordinates}
        />
        <Input
          placeholder="Longitude"
          value={longitude}
          onChangeText={(text) => { setLongitude(text); markDirty(); }}
          keyboardType="numbers-and-punctuation"
          style={[styles.inputSpacing, styles.rowInput]}
          error={fieldErrors.coordinates}
        />
      </View>
      <Text style={styles.helperText}>
        Belum ada tampilan peta interaktif — isi manual kalau tombol di atas tidak akurat.
      </Text>

      <Text style={styles.sectionLabel}>Kategori Layanan (bisa pilih lebih dari satu)</Text>
      {loadingCategories ? (
        <Text style={styles.helperText}>Memuat kategori...</Text>
      ) : (
        <RealCategoryMultiSelect
          categories={categories}
          selected={selectedCategoryIds}
          onChange={(ids) => { setSelectedCategoryIds(ids); markDirty(); setFieldErrors(prev => ({ ...prev, category_ids: '' })); }}
        />
      )}
      {fieldErrors.category_ids && (
        <Text style={[styles.helperText, { color: colors.error }]}>{fieldErrors.category_ids}</Text>
      )}

      <View style={{ height: spacing.stackLg }} />
      <Button label={saving ? 'Menyimpan...' : 'Simpan Profil Bisnis'} onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap },
  backRow: { marginBottom: spacing.stackLg },
  backText: { color: colors.onSurfaceVariant, fontFamily: typography.bodyMd.fontFamily, fontSize: typography.bodyMd.fontSize },
  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    color: colors.onSurface,
  },
  subtitle: { fontFamily: typography.bodyMd.fontFamily, fontSize: typography.bodyMd.fontSize, color: colors.onSurfaceVariant, marginTop: 4, marginBottom: spacing.stackLg },
  sectionLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginBottom: spacing.stackSm,
    marginTop: spacing.stackSm,
  },
  inputSpacing: { marginBottom: spacing.stackSm },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.stackSm },
  rowInput: { flex: 1 },
  locationButton: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: spacing.stackSm,
  },
  locationButtonText: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, fontWeight: '600', color: colors.onSecondaryContainer },
  helperText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
});
