import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, Trash2, ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { categoryApi } from '../../../../api/categoryApi';
import Toast from 'react-native-toast-message';
import type { VendorServicesStackParamList } from '../../../../navigation/types';

type ServiceFormRoute = RouteProp<VendorServicesStackParamList, 'ServiceForm'>;

type Category = { id: number; name: string };
type Subcategory = { id: number; name: string };
type PickedPhoto = { uri: string; name: string; type: string };

// Catatan scope: form ini pakai 1 harga per layanan (bukan multi-package) dan tidak
// punya field lokasi tersendiri — lokasi layanan mengikuti alamat tenant yang sudah
// diisi di vendorApi.updateMyProfile(), bukan per-servis.
//
// Catatan backend: ServiceController@update belum memproses `photos` maupun `is_active`
// (cuma store() yang menerimanya). Jadi saat mode edit, upload foto & toggle available
// ditampilkan tapi dinonaktifkan (disabled) supaya tidak menyesatkan pengguna.

export default function ServiceForm() {
  const navigation = useNavigation();
  const { params } = useRoute<ServiceFormRoute>();
  const isEdit = params.mode === 'edit';
  const existingService = isEdit ? params.service : null;

  const [name, setName] = useState(existingService?.name ?? '');
  const [description, setDescription] = useState(existingService?.description ?? '');
  const [price, setPrice] = useState(existingService ? String(existingService.price) : '');
  const [isActive, setIsActive] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    existingService?.subcategory?.category?.id ?? null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(
    existingService?.subcategory?.id ?? null
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        setCategories(res.data.data ?? res.data);
      } catch {
        Toast.show({ type: 'error', text1: 'Gagal memuat kategori', position: 'top' });
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      return;
    }
    (async () => {
      try {
        const res = await categoryApi.getSubcategories(selectedCategoryId);
        setSubcategories(res.data.data ?? res.data);
      } catch {
        Toast.show({ type: 'error', text1: 'Gagal memuat sub-kategori', position: 'top' });
      }
    })();
  }, [selectedCategoryId]);

  const handlePickPhoto = async () => {
    if (isEdit) return;
    if (photos.length >= 10) {
      Toast.show({ type: 'error', text1: 'Maksimal 10 foto', position: 'top' });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Izin galeri ditolak', position: 'top' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setPhotos((prev) => [
      ...prev,
      { uri: asset.uri, name: asset.fileName ?? `photo_${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Nama layanan wajib diisi', position: 'top' });
      return;
    }
    if (!selectedSubcategoryId) {
      Toast.show({ type: 'error', text1: 'Pilih sub-kategori dulu', position: 'top' });
      return;
    }
    if (!price || isNaN(Number(price))) {
      Toast.show({ type: 'error', text1: 'Harga tidak valid', position: 'top' });
      return;
    }

    setSaving(true);
    try {
      // Foto & is_active cuma relevan saat CREATE — backend update() tidak memprosesnya.
      const hasNewPhotos = !isEdit && photos.length > 0;

      if (hasNewPhotos) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('subcategory_id', String(selectedSubcategoryId));
        formData.append('price', price);
        formData.append('description', description);
        formData.append('is_active', isActive ? '1' : '0');
        photos.forEach((photo) => {
          // @ts-ignore - format file React Native (uri/name/type)
          formData.append('photos[]', { uri: photo.uri, name: photo.name, type: photo.type });
        });

        await vendorApi.createService(formData);
      } else {
        const payload = {
          name,
          subcategory_id: selectedSubcategoryId,
          price: Number(price),
          description,
        };
        if (isEdit && existingService) {
          await vendorApi.updateService(existingService.id, payload);
        } else {
          await vendorApi.createService(payload);
        }
      }

      Toast.show({
        type: 'success',
        text1: isEdit ? 'Layanan diperbarui' : 'Layanan ditambahkan',
        position: 'top',
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal menyimpan layanan',
        text2: 'Coba lagi dalam beberapa saat.',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;
  const selectedSubcategoryName = subcategories.find((s) => s.id === selectedSubcategoryId)?.name;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Service' : 'Tambah Service'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Portfolio & Photos (maks 10)</Text>
        {isEdit && (
          <Text style={styles.notSupportedNote}>
            ⚠️ Ubah foto belum didukung saat edit — foto hanya bisa diisi saat pertama kali membuat layanan.
          </Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.stackLg }}>
          <TouchableOpacity
            style={[styles.addPhotoBox, isEdit && styles.disabledBox]}
            onPress={handlePickPhoto}
            disabled={isEdit}
          >
            <Camera size={22} color={isEdit ? colors.secondary : colors.primary} />
            <Text style={[styles.addPhotoText, isEdit && { color: colors.secondary }]}>Add Photo</Text>
          </TouchableOpacity>
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.photoThumbWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                <Trash2 size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>SERVICE NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nama layanan"
          placeholderTextColor={colors.secondary}
        />

        <Text style={styles.fieldLabel}>CATEGORY</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowCategoryPicker(true)}
          disabled={loadingCategories}
        >
          <Text style={selectedCategoryName ? styles.dropdownText : styles.dropdownPlaceholder}>
            {loadingCategories ? 'Memuat...' : selectedCategoryName ?? 'Pilih kategori'}
          </Text>
          <ChevronDown size={18} color={colors.secondary} />
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>SUB-CATEGORY</Text>
        <TouchableOpacity
          style={[styles.dropdown, !selectedCategoryId && styles.dropdownDisabled]}
          onPress={() => selectedCategoryId && setShowSubcategoryPicker(true)}
        >
          <Text style={selectedSubcategoryName ? styles.dropdownText : styles.dropdownPlaceholder}>
            {selectedSubcategoryName ?? 'Pilih sub-kategori'}
          </Text>
          <ChevronDown size={18} color={colors.secondary} />
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>HARGA (Rp)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="150000"
          placeholderTextColor={colors.secondary}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>SERVICE DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Jelaskan layanan Anda..."
          placeholderTextColor={colors.secondary}
          multiline
          numberOfLines={4}
        />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Available for Order</Text>
            <Text style={styles.toggleSubtitle}>
              {isEdit
                ? '⚠️ Belum didukung backend — tidak berpengaruh saat edit'
                : 'Aktifkan jika layanan ini bisa dipesan'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            disabled={isEdit}
            trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Pilih Kategori</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCategoryId(item.id);
                    setSelectedSubcategoryId(null);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerItemText}>Tidak ada kategori</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSubcategoryPicker} transparent animationType="slide" onRequestClose={() => setShowSubcategoryPicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSubcategoryPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Pilih Sub-Kategori</Text>
            <FlatList
              data={subcategories}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSubcategoryId(item.id);
                    setShowSubcategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerItemText}>Tidak ada sub-kategori</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 56,
    paddingBottom: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 16, color: colors.primary, fontWeight: '700' },
  saveText: { fontFamily: typography.button.fontFamily, fontSize: 15, color: colors.primary, fontWeight: '700' },
  content: { padding: spacing.containerMargin, paddingBottom: spacing.sectionGap },
  sectionLabel: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.stackSm,
  },
  addPhotoBox: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.stackSm,
  },
  disabledBox: { opacity: 0.4, borderColor: colors.secondary },
  notSupportedNote: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.error,
    marginBottom: spacing.stackSm,
  },
  addPhotoText: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.primary, marginTop: 4 },
  photoThumbWrap: { marginRight: spacing.stackSm },
  photoThumb: { width: 88, height: 88, borderRadius: radius.lg },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.full,
    padding: 4,
  },
  fieldLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 0.5,
    marginTop: spacing.stackMd,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 12,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: colors.onSurface,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  dropdown: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownDisabled: { opacity: 0.5 },
  dropdownText: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  dropdownPlaceholder: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.secondary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.stackLg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
  },
  pickerItem: { paddingHorizontal: spacing.stackMd, paddingVertical: 10 },
  pickerItemText: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.stackLg,
    padding: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
  },
  toggleTitle: { fontFamily: typography.button.fontFamily, fontSize: 14, color: colors.onSurface },
  toggleSubtitle: { fontFamily: typography.bodyMd.fontFamily, fontSize: 12, color: colors.secondary, marginTop: 2 },
});