import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { colors, typography, spacing } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { FileUploadField } from '../../../components/FileUploadField/FileUploadField';
import CategoryMultiSelect from '../components/CategoryMultiSelect';
import { useRegister } from '../hooks/useRegister';
import type { AuthStackParamList } from '../../../navigation/types';
import Toast from 'react-native-toast-message';

type RegisterVendorNav = NativeStackNavigationProp<AuthStackParamList, 'RegisterVendor'>;

// FR-01/FR-03: form registrasi vendor. Beda dari customer — vendor wajib isi identitas bisnis
// (nama, kategori, alamat) dan upload 2 dokumen verifikasi (KTP + Surat Badan Usaha) di awal,
// supaya admin punya bahan lengkap untuk approve/reject (FR-04) tanpa bolak-balik minta data.
export default function RegisterVendorScreen() {
  const navigation = useNavigation<RegisterVendorNav>();
  const { registerVendor, loading, error } = useRegister();

  const [businessName, setBusinessName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Simpan objek file lengkap (uri, name, type), bukan cuma nama-nya — uri ini yang nanti
  // dipakai buildFileFormData() (services/fileUploadService.ts) saat upload beneran ke backend.
  const [idCardFile, setIdCardFile] = useState<DocumentPickerAsset | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<DocumentPickerAsset | null>(null);

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

  const handlePickIdCard = () => pickDocument(setIdCardFile, 'KTP');
  const handlePickBusinessLicense = () => pickDocument(setBusinessLicenseFile, 'Surat Badan Usaha');

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
    if (!idCardFile || !businessLicenseFile) {
      Toast.show({
        type: 'error',
        text1: 'Dokumen belum lengkap',
        text2: 'Upload KTP dan Surat Badan Usaha dulu sebelum daftar.',
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
      idCardFile: {
        uri: idCardFile!.uri,
        name: idCardFile!.name ?? undefined,
        type: idCardFile!.mimeType ?? 'application/octet-stream',
      },
      businessLicenseFile: {
        uri: businessLicenseFile!.uri,
        name: businessLicenseFile!.name ?? undefined,
        type: businessLicenseFile!.mimeType ?? 'application/octet-stream',
      },
    });

    if (result.success) {
      // reset (bukan navigate) supaya form registrasi hilang dari history — back dari
      // PendingApproval tidak bisa balik ke form ini lagi.
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingApproval', params: { businessName } }],
      });
    }
    // Kalau gagal, pesan errornya sudah otomatis tampil lewat `error` dari useRegister.
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backText}>{'← Kembali ke Login'}</Text>
      </Pressable>

      <Text style={styles.title}>Daftar sebagai Vendor</Text>

      <Input placeholder="Nama Bisnis" value={businessName} onChangeText={setBusinessName} style={styles.inputSpacing} />

      <Text style={styles.sectionLabel}>Kategori Layanan (bisa pilih lebih dari satu)</Text>
      <CategoryMultiSelect selected={categories} onChange={setCategories} />

      <Input
        placeholder="Alamat Lengkap"
        value={address}
        onChangeText={setAddress}
        multiline
        numberOfLines={3}
        style={[styles.inputSpacing, styles.textArea, { marginTop: spacing.stackMd }]}
      />
      <Input placeholder="Nomor Telepon" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.inputSpacing} />
      <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.inputSpacing} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.inputSpacing} />
      <Input placeholder="Konfirmasi Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.inputSpacing} />

      <Text style={styles.sectionLabel}>Dokumen Verifikasi</Text>
      <FileUploadField label="Upload KTP" fileName={idCardFile?.name} onPress={handlePickIdCard} />
      <View style={{ height: spacing.stackSm }} />
      <FileUploadField label="Upload Surat Badan Usaha" fileName={businessLicenseFile?.name} onPress={handlePickBusinessLicense} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={{ height: spacing.stackLg }} />
      <Button label={loading ? 'Memproses...' : 'Sign Up'} onPress={handleRegister} disabled={loading} />
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
    marginBottom: spacing.stackLg,
  },
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
  errorText: { color: colors.error, fontFamily: typography.bodyMd.fontFamily, fontSize: 13, marginTop: spacing.stackSm },
});
