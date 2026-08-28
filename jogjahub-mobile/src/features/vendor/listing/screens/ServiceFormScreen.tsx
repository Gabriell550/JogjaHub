import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { Input } from '../../../../components/Input/Input';
import { Button } from '../../../../components/Button/Button';
import { FileUploadField } from '../../../../components/FileUploadField/FileUploadField';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';

type SubcategoryOption = { id: number; name: string; categoryName: string };
type RouteParams = { mode: 'create' } | { mode: 'edit'; serviceId: number };

// Tambah/Edit layanan. Backend Tenant/ServiceController sudah support penuh (store/update/destroy
// + upload foto), jadi form ini langsung kesambung ke API asli, bukan mock.
export default function ServiceFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const isEdit = params?.mode === 'edit';

  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photos, setPhotos] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const flat: SubcategoryOption[] = [];
        for (const cat of res.data?.data ?? []) {
          for (const sub of cat.subcategories ?? []) {
            flat.push({ id: sub.id, name: sub.name, categoryName: cat.name });
          }
        }
        setSubcategories(flat);

        // Mode edit: cari data layanan yang mau diedit dari daftar milik vendor sendiri —
        // backend tidak punya endpoint "GET satu service by id", jadi diambil dari list index.
        if (isEdit) {
          const listRes = await vendorApi.listMyServices();
          const found = (listRes.data?.data?.data ?? []).find((s: any) => s.id === (params as any).serviceId);
          if (found) {
            setName(found.name);
            setDescription(found.description ?? '');
            setPrice(String(found.price));
            setSelectedSubcategoryId(found.subcategory_id ?? found.subcategory?.id ?? null);
          }
        }
      } catch (err) {
        console.log('Gagal ambil data awal form:', err);
        Toast.show({ type: 'error', text1: 'Gagal memuat data', text2: 'Coba lagi.' });
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, []);

  const pickPhotos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      setPhotos((prev) => [...prev, ...result.assets]);
    } catch (err) {
      console.log('Gagal pilih foto:', err);
      Alert.alert('Gagal memilih foto', 'Terjadi kesalahan saat memilih foto. Coba lagi.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubcategoryId || !name || !price) {
      Toast.show({ type: 'error', text1: 'Data belum lengkap', text2: 'Kategori, nama, dan harga wajib diisi.' });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        // Update TIDAK support ganti foto di backend (Tenant/ServiceController::update cuma
        // terima subcategory_id/name/description/price) — foto baru diabaikan kalau mode edit.
        await vendorApi.updateService((params as any).serviceId, {
          subcategory_id: selectedSubcategoryId,
          name,
          description: description || undefined,
          price: Number(price),
        });
      } else {
        const formData = new FormData();
        formData.append('subcategory_id', String(selectedSubcategoryId));
        formData.append('name', name);
        if (description) formData.append('description', description);
        formData.append('price', price);
        photos.forEach((photo, index) => {
          // @ts-ignore - format file React Native/Expo (uri/name/type), bukan File API browser
          formData.append('photos[]', {
            uri: photo.uri,
            name: photo.name ?? `photo_${index}.jpg`,
            type: photo.mimeType ?? 'image/jpeg',
          });
        });
        await vendorApi.createService(formData);
      }

      Toast.show({ type: 'success', text1: isEdit ? 'Layanan diperbarui' : 'Layanan ditambahkan' });
      navigation.goBack();
    } catch (err: any) {
      console.log('Gagal simpan layanan:', err?.response?.data ?? err);
      const message = err?.response?.data?.message ?? 'Gagal menyimpan layanan. Coba lagi.';
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

      <Text style={styles.title}>{isEdit ? 'Edit Layanan' : 'Tambah Layanan'}</Text>

      {loadingInitial ? (
        <Text style={styles.helperText}>Memuat...</Text>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Kategori</Text>
          <View style={styles.chipsWrap}>
            {subcategories.map((sub) => {
              const active = selectedSubcategoryId === sub.id;
              return (
                <Pressable
                  key={sub.id}
                  onPress={() => setSelectedSubcategoryId(sub.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{sub.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input placeholder="Nama Layanan" value={name} onChangeText={setName} style={styles.inputSpacing} />
          <Input
            placeholder="Deskripsi"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.inputSpacing, styles.textArea]}
          />
          <Input placeholder="Harga (Rp)" value={price} onChangeText={setPrice} keyboardType="number-pad" style={styles.inputSpacing} />

          {!isEdit && (
            <>
              <Text style={styles.sectionLabel}>Foto Layanan</Text>
              <FileUploadField
                label="Upload Foto (bisa lebih dari satu)"
                fileName={photos.length ? `${photos.length} foto dipilih` : null}
                onPress={pickPhotos}
              />
            </>
          )}

          <View style={{ height: spacing.stackLg }} />
          <Button label={saving ? 'Menyimpan...' : 'Simpan'} onPress={handleSubmit} disabled={saving} />
        </>
      )}
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
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.stackMd },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant },
  chipLabelActive: { color: colors.onPrimary, fontWeight: '600' },
  inputSpacing: { marginBottom: spacing.stackSm },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  helperText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant },
});
