import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing } from '../../../../constants/theme';
import { Input } from '../../../../components/Input/Input';
import { Button } from '../../../../components/Button/Button';
import { RealCategoryMultiSelect } from '../components/RealCategoryMultiSelect';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';

type CategoryOption = { id: number; name: string };

// FR-03 tahap 2: "Lengkapi Profil Bisnis" — beda dari form registrasi awal.
// Ini yang manggil PUT /tenant/profile, dan datanya jauh lebih lengkap dari yang diisi
// saat daftar: address object penuh, lat/long presisi, category_ids ASLI dari database.
export default function VendorOnboardingScreen() {
  const navigation = useNavigation();

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

  useEffect(() => {
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        // Response asli: { success, data: [{ id, name, subcategories: [...] }] }
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
      Toast.show({ type: 'success', text1: 'Lokasi berhasil diambil' });
    } catch (err) {
      console.log('Gagal ambil lokasi:', err);
      Toast.show({ type: 'error', text1: 'Gagal ambil lokasi', text2: 'Isi lat/long manual atau coba lagi.' });
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!businessName || !street || !city || !province || !whatsappNumber) {
      Toast.show({ type: 'error', text1: 'Data belum lengkap', text2: 'Nama bisnis, alamat, dan WhatsApp wajib diisi.' });
      return;
    }
    if (!latitude || !longitude) {
      Toast.show({ type: 'error', text1: 'Lokasi belum diisi', text2: 'Pakai tombol "Gunakan Lokasi Saat Ini" atau isi manual.' });
      return;
    }
    if (selectedCategoryIds.length === 0) {
      Toast.show({ type: 'error', text1: 'Kategori belum dipilih', text2: 'Pilih minimal 1 kategori layanan.' });
      return;
    }

    setSaving(true);
    try {
      await vendorApi.updateMyProfile({
        business_name: businessName,
        description: description || undefined,
        address: { street, city, province, postal_code: postalCode || undefined },
        latitude: Number(latitude),
        longitude: Number(longitude),
        whatsapp_number: whatsappNumber,
        category_ids: selectedCategoryIds,
      });
      Toast.show({ type: 'success', text1: 'Profil bisnis tersimpan', text2: 'Menunggu approval admin.' });
      navigation.goBack();
    } catch (err: any) {
      console.log('Gagal simpan profil:', err?.response?.data ?? err);
      const message = err?.response?.data?.message ?? 'Gagal menyimpan profil. Coba lagi.';
      Toast.show({ type: 'error', text1: 'Gagal menyimpan', text2: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backText}>{'← Kembali'}</Text>
      </Pressable>

      <Text style={styles.title}>Lengkapi Profil Bisnis</Text>
      <Text style={styles.subtitle}>Data ini yang dilihat customer & dipakai admin untuk verifikasi.</Text>

      <Input placeholder="Nama Bisnis" value={businessName} onChangeText={setBusinessName} style={styles.inputSpacing} />
      <Input
        placeholder="Deskripsi singkat bisnis"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={[styles.inputSpacing, styles.textArea]}
      />

      <Text style={styles.sectionLabel}>Alamat</Text>
      <Input placeholder="Nama Jalan" value={street} onChangeText={setStreet} style={styles.inputSpacing} />
      <Input placeholder="Kota" value={city} onChangeText={setCity} style={styles.inputSpacing} />
      <Input placeholder="Provinsi" value={province} onChangeText={setProvince} style={styles.inputSpacing} />
      <Input placeholder="Kode Pos (opsional)" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" style={styles.inputSpacing} />

      <Input placeholder="Nomor WhatsApp" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" style={styles.inputSpacing} />

      <Text style={styles.sectionLabel}>Lokasi (untuk peta customer)</Text>
      <Pressable style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
        <Text style={styles.locationButtonText}>{locating ? 'Mengambil lokasi...' : '📍 Gunakan Lokasi Saat Ini'}</Text>
      </Pressable>
      <View style={styles.row}>
        <Input
          placeholder="Latitude"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numbers-and-punctuation"
          style={[styles.inputSpacing, styles.rowInput]}
        />
        <Input
          placeholder="Longitude"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numbers-and-punctuation"
          style={[styles.inputSpacing, styles.rowInput]}
        />
      </View>
      <Text style={styles.helperText}>
        Belum ada tampilan peta interaktif — isi manual kalau tombol di atas tidak akurat.
      </Text>

      <Text style={styles.sectionLabel}>Kategori Layanan (bisa pilih lebih dari satu)</Text>
      {loadingCategories ? (
        <Text style={styles.helperText}>Memuat kategori...</Text>
      ) : (
        <RealCategoryMultiSelect categories={categories} selected={selectedCategoryIds} onChange={setSelectedCategoryIds} />
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
