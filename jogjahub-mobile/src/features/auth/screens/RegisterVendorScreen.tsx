import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { colors, typography, spacing, radius } from '../../../constants/theme';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { FileUploadField } from '../../../components/FileUploadField/FileUploadField';
import CategoryMultiSelect from '../components/CategoryMultiSelect';
import { useRegister } from '../hooks/useRegister';
import type { AuthStackParamList } from '../../../navigation/types';
import Toast from 'react-native-toast-message';
import { User, Mail, Lock, Phone, ArrowLeft, MapPin, Building2, Store } from 'lucide-react-native';

type RegisterVendorNav = NativeStackNavigationProp<AuthStackParamList, 'RegisterVendor'>;

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
  
    const result = await registerVendor({
      businessName,
      categories,
      address,
      phone,
      email,
      password,
      passwordConfirmation: confirmPassword,
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
          <Text style={styles.title}>Daftar Tenant</Text>
          <Text style={styles.subtitle}>Mari berkembang bersama JogjaHub dan jangkau lebih banyak pelanggan</Text>
        </View>

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
          <Text style={styles.helperText}>Bisa dilengkapi nanti melalui menu Profil setelah akun aktif.</Text>
          
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
      </ScrollView>
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
  footerSpacing: { marginBottom: spacing.stackXl },
});
