import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { FileUploadField } from '../../../components/FileUploadField/FileUploadField';
import CategoryMultiSelect from '../components/CategoryMultiSelect';

export default function RegisterVendorScreen() {
  const navigation = useNavigation();

  const [businessName, setBusinessName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Simpan objek file lengkap (uri, name, mimeType), bukan cuma nama-nya — uri ini yang nanti
  // dipakai buildFileFormData() (services/fileUploadService.ts) saat upload beneran ke backend.
  const [idCardFile, setIdCardFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const pickDocument = async (
    setFile: (file: DocumentPicker.DocumentPickerAsset | null) => void,
    label: string,
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'], // KTP/Surat Badan Usaha boleh foto atau hasil scan PDF
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return; // user batal pilih file, bukan error
      const [file] = result.assets;
      if (!file) return;
      setFile(file);
    } catch (err) {
      console.error(`Gagal memilih ${label}:`, err);
      Alert.alert('Gagal memilih file', `Terjadi kesalahan saat memilih ${label}. Coba lagi.`);
    }
  };

  const handlePickIdCard = () => pickDocument(setIdCardFile, 'KTP');
  const handlePickBusinessLicense = () => pickDocument(setBusinessLicenseFile, 'Surat Badan Usaha');

  const handleRegister = () => {
    if (!idCardFile || !businessLicenseFile) {
      Alert.alert('Dokumen belum lengkap', 'Upload KTP dan Surat Badan Usaha dulu sebelum daftar.');
      return;
    }
    // TODO: panggil useRegister() -> authApi.registerVendor({
    //   businessName, categories, address, phone, email, password,
    // }) lalu uploadApi.uploadFile(buildFileFormData('idCard', idCardFile.uri, idCardFile.name, idCardFile.mimeType))
    // dan sekali lagi untuk businessLicenseFile — nunggu endpoint dari backend siap.
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

      <View style={{ height: spacing.stackLg }} />
      <Button label="Sign Up" onPress={handleRegister} />
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
});
