import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ImagePlus,
  Info,
  Layers3,
  Package,
  Tag,
  Trash2,
  X,
} from 'lucide-react-native';
import { isAxiosError } from 'axios';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { categoryApi } from '../../../../api/categoryApi';
import { getPhotoUrl, type ServicePhotoLike } from '../../../../utils/serviceImage';
import Toast from 'react-native-toast-message';
import type { ServiceParam, VendorServicesStackParamList } from '../../../../navigation/types';

type ServiceFormRoute = RouteProp<VendorServicesStackParamList, 'ServiceForm'>;
type Subcategory = { id: number; name: string };
type Category = { id: number; name: string; subcategories: Subcategory[] };
type PickedPhoto = { uri: string; name: string; type: string };
type ExistingPhoto = ServicePhotoLike;
type FieldName = 'name' | 'category' | 'price' | 'description' | 'photos';
type FormErrors = Partial<Record<FieldName, string>>;
type FieldLayout = { y: number; height: number };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_SERVICE_NAME_LENGTH = 255;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PRICE_SUGGESTIONS = [50_000, 100_000, 250_000];
const FIELD_ORDER: FieldName[] = ['name', 'category', 'price', 'description', 'photos'];

function formatThousands(value: string): string {
  const cleanNumber = value.replace(/\D/g, '');
  if (!cleanNumber) return '';
  return Number(cleanNumber).toLocaleString('id-ID');
}

function terbilangRupiah(nominal: number): string {
  if (!Number.isSafeInteger(nominal) || nominal <= 0 || nominal >= 1_000_000_000) return '';
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  const say = (value: number): string => {
    if (value < 12) return units[value];
    if (value < 20) return `${say(value - 10)} Belas`;
    if (value < 100) return `${say(Math.floor(value / 10))} Puluh ${say(value % 10)}`.trim();
    if (value < 200) return `Seratus ${say(value - 100)}`.trim();
    if (value < 1000) return `${say(Math.floor(value / 100))} Ratus ${say(value % 100)}`.trim();
    if (value < 2000) return `Seribu ${say(value - 1000)}`.trim();
    if (value < 1_000_000) return `${say(Math.floor(value / 1000))} Ribu ${say(value % 1000)}`.trim();
    return `${say(Math.floor(value / 1_000_000))} Juta ${say(value % 1_000_000)}`.trim();
  };

  return `${say(nominal).replace(/\s+/g, ' ').trim()} Rupiah`;
}

function parseCategories(payload: unknown): Category[] {
  if (!payload || typeof payload !== 'object') throw new Error('Format kategori tidak valid.');
  const response = payload as { data?: unknown };
  const rows = Array.isArray(response.data) ? response.data : null;
  if (!rows) throw new Error('Daftar kategori tidak tersedia.');

  return rows.map((row): Category => {
    if (!row || typeof row !== 'object') throw new Error('Data kategori tidak valid.');
    const category = row as { id?: unknown; name?: unknown; subcategories?: unknown };
    if (!Number.isInteger(Number(category.id)) || typeof category.name !== 'string' || !Array.isArray(category.subcategories)) {
      throw new Error('Data kategori tidak valid.');
    }
    const subcategories = category.subcategories.map((item): Subcategory => {
      if (!item || typeof item !== 'object') throw new Error('Data sub-kategori tidak valid.');
      const subcategory = item as { id?: unknown; name?: unknown };
      if (!Number.isInteger(Number(subcategory.id)) || typeof subcategory.name !== 'string') {
        throw new Error('Data sub-kategori tidak valid.');
      }
      return { id: Number(subcategory.id), name: subcategory.name };
    });
    return { id: Number(category.id), name: category.name, subcategories };
  });
}

function photoSort(a: ExistingPhoto, b: ExistingPhoto): number {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

function getApiErrorData(error: unknown): {
  errors?: Record<string, string | string[]>;
  message?: string;
} | undefined {
  if (!isAxiosError(error) || !error.response?.data || typeof error.response.data !== 'object') return undefined;
  return error.response.data as { errors?: Record<string, string | string[]>; message?: string };
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>{icon}</View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function InlineError({ children }: { children?: string }) {
  if (!children) return null;
  return <Text style={styles.inlineError}>{children}</Text>;
}

export default function ServiceFormScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<ServiceFormRoute>();
  const insets = useSafeAreaInsets();
  const isEdit = params.mode === 'edit';
  const existingService: ServiceParam | null = isEdit ? params.service : null;

  const [name, setName] = useState(existingService?.name ?? '');
  const [description, setDescription] = useState(existingService?.description ?? '');
  const [rawPrice, setRawPrice] = useState(existingService ? String(existingService.price) : '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(
    existingService?.subcategory?.id ?? null,
  );
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(
    [...(existingService?.photos ?? [])].sort(photoSort),
  );
  const [newPhotos, setNewPhotos] = useState<PickedPhoto[]>([]);
  const [removedPhotoUrls, setRemovedPhotoUrls] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const nameInputRef = useRef<TextInputInstance>(null);
  const priceInputRef = useRef<TextInputInstance>(null);
  const fieldLayouts = useRef<Partial<Record<FieldName, FieldLayout>>>({});

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setLoadingCategories(true);
      setCategoryError(null);
      try {
        const response = await categoryApi.getCategories();
        const parsed = parseCategories(response.data);
        if (active) setCategories(parsed);
      } catch (error) {
        if (active) {
          setCategoryError(isAxiosError(error)
            ? error.response?.data?.message ?? 'Gagal memuat kategori. Periksa koneksi lalu coba lagi.'
            : error instanceof Error ? error.message : 'Gagal memuat kategori.');
        }
      } finally {
        if (active) setLoadingCategories(false);
      }
    };
    void loadCategories();
    return () => { active = false; };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.subcategories.some((subcategory) => subcategory.id === selectedSubcategoryId)),
    [categories, selectedSubcategoryId],
  );
  const selectedSubcategory = selectedCategory?.subcategories.find((subcategory) => subcategory.id === selectedSubcategoryId);
  const photoCount = existingPhotos.length + newPhotos.length;
  const formattedPrice = formatThousands(rawPrice);
  const priceWords = terbilangRupiah(Number(rawPrice));
  const availablePhotoSlots = Math.max(0, MAX_PHOTOS - photoCount);

  const clearError = (field: FieldName) => {
    setFieldErrors((current) => current[field] ? { ...current, [field]: undefined } : current);
  };

  const recordLayout = (field: FieldName) => (event: { nativeEvent: { layout: FieldLayout } }) => {
    fieldLayouts.current[field] = event.nativeEvent.layout;
  };

  const focusFirstError = (errors: FormErrors) => {
    const firstError = FIELD_ORDER.find((field) => errors[field]);
    if (!firstError) return;
    const layout = fieldLayouts.current[firstError];
    if (layout) scrollRef.current?.scrollTo({ y: Math.max(0, layout.y - spacing.stackMd), animated: true });

    setTimeout(() => {
      if (firstError === 'name') nameInputRef.current?.focus();
      if (firstError === 'price') priceInputRef.current?.focus();
      if (firstError === 'category') setCategorySheetOpen(true);
    }, 250);
  };

  const handlePickPhotos = async () => {
    if (availablePhotoSlots <= 0) {
      Alert.alert('Batas foto tercapai', 'Maksimal 10 foto telah tercapai.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin galeri diperlukan', 'Izinkan akses galeri untuk menambahkan foto layanan.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: availablePhotoSlots,
        quality: 0.7,
      });
      if (result.canceled) return;

      const accepted: PickedPhoto[] = [];
      let unsupportedCount = 0;
      let oversizedCount = 0;
      for (const [index, asset] of result.assets.entries()) {
        const mimeType = asset.mimeType ?? 'image/jpeg';
        if (!ALLOWED_PHOTO_TYPES.includes(mimeType)) {
          unsupportedCount += 1;
          continue;
        }
        if (asset.fileSize !== undefined && asset.fileSize > MAX_PHOTO_BYTES) {
          oversizedCount += 1;
          continue;
        }
        const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
        accepted.push({
          uri: asset.uri,
          name: asset.fileName ?? `service_photo_${Date.now()}_${index}.${extension}`,
          type: mimeType,
        });
      }

      if (accepted.length > 0) {
        setNewPhotos((current) => [...current, ...accepted].slice(0, availablePhotoSlots));
        clearError('photos');
      }
      if (oversizedCount > 0) {
        Alert.alert('Ukuran foto terlalu besar', 'Foto melebihi 5MB. Silakan pilih foto dengan resolusi lebih ringan.');
      } else if (unsupportedCount > 0) {
        Alert.alert('Format foto tidak didukung', 'Gunakan foto JPG, PNG, atau WebP.');
      } else if (result.assets.length > availablePhotoSlots) {
        Alert.alert('Batas foto tercapai', 'Maksimal 10 foto telah tercapai.');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Gagal membuka galeri',
        text2: error instanceof Error ? error.message : 'Coba lagi.',
        position: 'top',
      });
    }
  };

  const removeExistingPhoto = (photo: ExistingPhoto) => {
    setExistingPhotos((current) => current.filter((item) => item.url !== photo.url));
    setRemovedPhotoUrls((current) => current.includes(photo.url) ? current : [...current, photo.url]);
  };

  const removeNewPhoto = (uri: string) => {
    setNewPhotos((current) => current.filter((photo) => photo.uri !== uri));
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!name.trim()) errors.name = 'Nama layanan wajib diisi.';
    else if (name.trim().length > MAX_SERVICE_NAME_LENGTH) errors.name = 'Nama layanan maksimal 255 karakter.';
    if (!selectedSubcategoryId) errors.category = 'Pilih kategori dan sub-kategori layanan.';
    const priceValue = Number(rawPrice);
    if (!rawPrice || !Number.isSafeInteger(priceValue) || priceValue <= 0) {
      errors.price = 'Harga layanan harus berupa angka lebih dari 0.';
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `Deskripsi maksimal ${MAX_DESCRIPTION_LENGTH} karakter.`;
    }
    if (photoCount > MAX_PHOTOS) errors.photos = 'Maksimal 10 foto.';
    return errors;
  };

  const appendPhoto = (formData: FormData, photo: PickedPhoto) => {
    // React Native FormData accepts a { uri, name, type } file descriptor.
    // @ts-expect-error React Native extends the browser FormData file contract.
    formData.append('photos[]', { uri: photo.uri, name: photo.name, type: photo.type });
  };

  const handleSave = async () => {
    if (saving) return;
    Keyboard.dismiss();
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || selectedSubcategoryId === null) {
      focusFirstError(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        subcategory_id: selectedSubcategoryId,
        price: Number(rawPrice),
        description: description.trim(),
      };
      const hasPhotoChanges = newPhotos.length > 0 || removedPhotoUrls.length > 0;
      if (hasPhotoChanges) {
        const formData = new FormData();
        formData.append('name', payload.name);
        formData.append('subcategory_id', String(payload.subcategory_id));
        formData.append('price', String(payload.price));
        formData.append('description', payload.description);
        newPhotos.forEach((photo) => appendPhoto(formData, photo));
        if (isEdit) {
          removedPhotoUrls.forEach((path) => formData.append('remove_photos[]', path));
          if (!existingService) throw new Error('Data layanan untuk diperbarui tidak tersedia.');
          await vendorApi.updateService(existingService.id, formData);
        } else {
          await vendorApi.createService(formData);
        }
      } else if (isEdit) {
        if (!existingService) throw new Error('Data layanan untuk diperbarui tidak tersedia.');
        await vendorApi.updateService(existingService.id, payload);
      } else {
        await vendorApi.createService(payload);
      }

      Toast.show({
        type: 'success',
        text1: isEdit ? 'Layanan diperbarui' : 'Layanan ditambahkan',
        position: 'top',
      });
      navigation.goBack();
    } catch (error) {
      const data = getApiErrorData(error);
      const errorsFromApi = data?.errors;
      if (errorsFromApi) {
        const mapped: FormErrors = {};
        if (errorsFromApi.name) mapped.name = Array.isArray(errorsFromApi.name) ? errorsFromApi.name[0] : errorsFromApi.name;
        const categoryMessage = errorsFromApi.subcategory_id;
        if (categoryMessage) mapped.category = Array.isArray(categoryMessage) ? categoryMessage[0] : categoryMessage;
        if (errorsFromApi.price) mapped.price = Array.isArray(errorsFromApi.price) ? errorsFromApi.price[0] : errorsFromApi.price;
        if (errorsFromApi.description) mapped.description = Array.isArray(errorsFromApi.description) ? errorsFromApi.description[0] : errorsFromApi.description;
        if (errorsFromApi.photos || errorsFromApi['photos.0']) {
          const photoError = errorsFromApi.photos ?? errorsFromApi['photos.0'];
          mapped.photos = Array.isArray(photoError) ? photoError[0] : photoError;
        }
        setFieldErrors(mapped);
        focusFirstError(mapped);
      }
      Toast.show({
        type: 'error',
        text1: 'Gagal menyimpan layanan',
        text2: data?.message ?? 'Periksa data dan coba lagi.',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (value: string) => {
    setRawPrice(value.replace(/\D/g, ''));
    clearError('price');
  };

  const changePriceBy = (amount: number) => {
    const current = Number(rawPrice) || 0;
    setRawPrice(String(current + amount));
    clearError('price');
  };

  const selectSubcategory = (categoryId: number, subcategoryId: number) => {
    setSelectedSubcategoryId(subcategoryId);
    setCategorySheetOpen(false);
    clearError('category');
    if (selectedCategory?.id !== categoryId) setFieldErrors((current) => ({ ...current, category: undefined }));
  };

  const visiblePhotos = [
    ...existingPhotos.map((photo) => ({ key: `existing-${photo.url}`, uri: getPhotoUrl(photo), existing: photo, picked: null as PickedPhoto | null })),
    ...newPhotos.map((photo) => ({ key: `new-${photo.uri}`, uri: photo.uri, existing: null as ExistingPhoto | null, picked: photo })),
  ];
  const coverPhoto = visiblePhotos[0];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.stackSm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke daftar layanan"
        >
          <ChevronLeft size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Layanan' : 'Tambah Layanan Baru'}</Text>
          <Text style={styles.headerSubtitle}>Lengkapi informasi layananmu</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View onLayout={recordLayout('photos')}>
          <SectionCard
            icon={<Camera size={19} color={colors.primary} />}
            title="Foto & media layanan"
            description={`${photoCount} dari ${MAX_PHOTOS} foto`}
          >
            <Text style={styles.coverLabel}>FOTO UTAMA / SAMPUL</Text>
            {coverPhoto ? (
              <View style={styles.coverImageWrap}>
                <Image source={{ uri: coverPhoto.uri }} style={styles.coverImage} />
                <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>★ Foto Utama</Text></View>
                <Pressable
                  onPress={() => coverPhoto.existing ? removeExistingPhoto(coverPhoto.existing) : coverPhoto.picked && removeNewPhoto(coverPhoto.picked.uri)}
                  style={styles.coverRemove}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus foto utama"
                >
                  <X size={18} color={colors.onPrimary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => void handlePickPhotos()}
                style={({ pressed }) => [styles.coverEmpty, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Unggah foto utama layanan"
              >
                <View style={styles.uploadIcon}><ImagePlus size={25} color={colors.primary} /></View>
                <Text style={styles.uploadTitle}>Unggah foto sampul</Text>
                <Text style={styles.uploadHint}>JPG, PNG, WebP · Maks. 5 MB</Text>
              </Pressable>
            )}

            <View style={styles.galleryHeading}>
              <Text style={styles.galleryTitle}>Foto pendukung</Text>
              <Text style={styles.galleryHint}>Tambahkan hingga 9 foto</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryList}>
              {visiblePhotos.slice(1).map((photo, index) => (
                <View key={photo.key} style={styles.photoThumbWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                  <Text style={styles.photoIndex}>Foto {index + 2}</Text>
                  <Pressable
                    onPress={() => photo.existing ? removeExistingPhoto(photo.existing) : photo.picked && removeNewPhoto(photo.picked.uri)}
                    style={styles.removePhotoButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Hapus foto ${index + 2}`}
                  >
                    <Trash2 size={14} color={colors.onPrimary} />
                  </Pressable>
                </View>
              ))}
              {availablePhotoSlots > 0 && (
                <Pressable
                  onPress={() => void handlePickPhotos()}
                  style={({ pressed }) => [styles.addPhotoTile, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Tambahkan foto pendukung"
                >
                  <ImagePlus size={21} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Tambah</Text>
                </Pressable>
              )}
            </ScrollView>
            <Text style={styles.photoRules}>Format JPG, PNG, atau WebP. Maksimal 5 MB per foto.</Text>
            <InlineError>{fieldErrors.photos}</InlineError>
          </SectionCard>
        </View>

        <View onLayout={recordLayout('name')}>
          <SectionCard
            icon={<Package size={19} color={colors.primary} />}
            title="Informasi dasar"
            description="Nama layanan dan kategorinya"
          >
            <Text style={styles.fieldLabel}>Nama layanan <Text style={styles.required}>*</Text></Text>
            <TextInput
              ref={nameInputRef}
              value={name}
              onChangeText={(value) => { setName(value); clearError('name'); }}
              onBlur={() => {
                if (!name.trim()) setFieldErrors((current) => ({ ...current, name: 'Nama layanan wajib diisi.' }));
              }}
              placeholder="Contoh: Rias Wisuda Natural + Hijab Do"
              placeholderTextColor={colors.outline}
              style={[styles.input, fieldErrors.name && styles.inputError]}
              maxLength={MAX_SERVICE_NAME_LENGTH}
              returnKeyType="next"
              accessibilityLabel="Nama layanan"
            />
            <InlineError>{fieldErrors.name}</InlineError>

            <Text style={[styles.fieldLabel, styles.spacedLabel]}>Kategori & sub-kategori <Text style={styles.required}>*</Text></Text>
            <Pressable
              onPress={() => setCategorySheetOpen(true)}
              disabled={loadingCategories || Boolean(categoryError)}
              style={({ pressed }) => [
                styles.selectField,
                fieldErrors.category && styles.inputError,
                (loadingCategories || categoryError) && styles.disabledField,
                pressed && !loadingCategories && !categoryError && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={selectedCategory && selectedSubcategory
                ? `Kategori ${selectedCategory.name}, sub-kategori ${selectedSubcategory.name}`
                : 'Pilih kategori dan sub-kategori'}
              accessibilityState={{ disabled: loadingCategories || Boolean(categoryError), expanded: categorySheetOpen }}
            >
              <View style={styles.selectFieldText}>
                <Text style={selectedSubcategory ? styles.selectValue : styles.selectPlaceholder}>
                  {loadingCategories
                    ? 'Memuat kategori...'
                    : selectedCategory && selectedSubcategory
                      ? `${selectedCategory.name} → ${selectedSubcategory.name}`
                      : 'Pilih kategori & sub-kategori'}
                </Text>
              </View>
              {loadingCategories
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <ChevronDown size={19} color={colors.onSurfaceVariant} />}
            </Pressable>
            {categoryError ? (
              <View style={styles.categoryErrorRow}>
                <Text style={styles.inlineError}>{categoryError}</Text>
                <Pressable onPress={() => {
                  setCategories([]);
                  setCategoryError(null);
                  setLoadingCategories(true);
                  void categoryApi.getCategories().then((response) => {
                    setCategories(parseCategories(response.data));
                  }).catch((error: unknown) => {
                    setCategoryError(isAxiosError(error)
                      ? error.response?.data?.message ?? 'Gagal memuat kategori.'
                      : error instanceof Error ? error.message : 'Gagal memuat kategori.');
                  }).finally(() => setLoadingCategories(false));
                }} accessibilityRole="button" style={styles.retryButton}>
                  <Text style={styles.retryText}>Coba lagi</Text>
                </Pressable>
              </View>
            ) : null}
            <InlineError>{fieldErrors.category}</InlineError>
          </SectionCard>
        </View>

        <View onLayout={recordLayout('price')}>
          <SectionCard
            icon={<Tag size={19} color={colors.primary} />}
            title="Harga layanan"
            description="Tentukan tarif jasa"
          >
            <Text style={styles.fieldLabel}>Biaya jasa / tarif <Text style={styles.required}>*</Text></Text>
            <View style={[styles.priceInputWrap, fieldErrors.price && styles.inputError]}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                ref={priceInputRef}
                value={formattedPrice}
                onChangeText={handlePriceChange}
                placeholder="150.000"
                placeholderTextColor={colors.outline}
                style={styles.priceInput}
                keyboardType="number-pad"
                maxLength={15}
                accessibilityLabel="Harga layanan dalam Rupiah"
              />
            </View>
            <InlineError>{fieldErrors.price}</InlineError>
            {priceWords ? <Text style={styles.priceWords}>Terbilang: {priceWords}</Text> : null}
            <View style={styles.suggestionRow}>
              {PRICE_SUGGESTIONS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => changePriceBy(amount)}
                  style={({ pressed }) => [styles.suggestionChip, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Tambah ${amount.toLocaleString('id-ID')} Rupiah ke harga`}
                >
                  <Text style={styles.suggestionText}>+{amount / 1000}rb</Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={recordLayout('description')}>
          <SectionCard
            icon={<Layers3 size={19} color={colors.primary} />}
            title="Deskripsi & ketentuan"
            description="Bantu pelanggan memahami layanan"
          >
            <Text style={styles.fieldLabel}>Deskripsi layanan</Text>
            <TextInput
              value={description}
              onChangeText={(value) => {
                setDescription(value.slice(0, MAX_DESCRIPTION_LENGTH));
                clearError('description');
              }}
              placeholder="Jelaskan apa saja yang didapat pelanggan, durasi pengerjaan, atau ketentuan layanan..."
              placeholderTextColor={colors.outline}
              style={[styles.input, styles.descriptionInput, fieldErrors.description && styles.inputError]}
              multiline
              textAlignVertical="top"
              maxLength={MAX_DESCRIPTION_LENGTH}
              accessibilityLabel="Deskripsi layanan"
            />
            <View style={styles.descriptionFooter}>
              <InlineError>{fieldErrors.description}</InlineError>
              <Text style={styles.characterCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text>
            </View>
          </SectionCard>
        </View>

        <SectionCard
          icon={<Info size={19} color={colors.primary} />}
          title="Status ketersediaan"
          description="Kelola apakah layanan dapat dipesan"
        >
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityCopy}>
              <Text style={styles.availabilityTitle}>Layanan aktif untuk dipesan</Text>
              <Text style={styles.availabilityDescription}>
                Status aktif belum dapat diubah lewat API layanan. Pengaturan ini belum tersedia.
              </Text>
            </View>
            <Switch
              value
              disabled
              accessibilityLabel="Status aktif layanan, belum dapat diubah"
              trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHigh }}
              thumbColor={colors.onPrimary}
            />
          </View>
        </SectionCard>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, spacing.stackMd) }]}>
        <Pressable
          onPress={() => void handleSave()}
          disabled={saving}
          style={({ pressed }) => [styles.saveButton, saving && styles.saveButtonDisabled, pressed && !saving && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? 'Perbarui layanan' : 'Simpan layanan'}
          accessibilityState={{ disabled: saving, busy: saving }}
        >
          {saving ? <ActivityIndicator color={colors.onPrimary} /> : null}
          <Text style={styles.saveButtonText}>
            {saving ? 'Menyimpan layanan...' : isEdit ? 'Perbarui Layanan' : 'Simpan Layanan'}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={categorySheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCategorySheetOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCategorySheetOpen(false)} accessibilityLabel="Tutup pilihan kategori" />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.stackLg) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pilih kategori layanan</Text>
                <Text style={styles.modalSubtitle}>Pilih sub-kategori yang paling sesuai.</Text>
              </View>
              <Pressable onPress={() => setCategorySheetOpen(false)} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Tutup kategori">
                <X size={21} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryGroup}>
                  <Text style={styles.categoryHeading}>{category.name}</Text>
                  {category.subcategories.map((subcategory) => {
                    const selected = selectedSubcategoryId === subcategory.id;
                    return (
                      <Pressable
                        key={subcategory.id}
                        onPress={() => selectSubcategory(category.id, subcategory.id)}
                        style={({ pressed }) => [styles.subcategoryOption, selected && styles.subcategorySelected, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.subcategoryText, selected && styles.subcategoryTextSelected]}>{subcategory.name}</Text>
                        {selected ? <Check size={18} color={colors.primary} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              {categories.length === 0 ? <Text style={styles.emptyCategories}>Belum ada kategori layanan.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  pressed: { opacity: 0.78 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 17, fontWeight: '700', color: colors.onSurface },
  headerSubtitle: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  headerSpacer: { width: 44 },
  content: { padding: spacing.containerMargin, paddingBottom: spacing.stackLg, gap: spacing.stackMd },
  sectionCard: {
    padding: spacing.stackMd,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackSm, marginBottom: spacing.stackMd },
  sectionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primaryFixed },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 15, fontWeight: '600', color: colors.onSurface },
  sectionDescription: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  coverLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 10, letterSpacing: 0.6, color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
  coverEmpty: { minHeight: 174, alignItems: 'center', justifyContent: 'center', padding: spacing.stackMd, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primaryContainer, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  uploadIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.primaryFixed },
  uploadTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: 14, color: colors.primary, marginTop: spacing.stackSm },
  uploadHint: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 },
  coverImageWrap: { height: 190, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverBadge: { position: 'absolute', left: spacing.stackSm, top: spacing.stackSm, paddingHorizontal: spacing.stackSm, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.primaryFixed },
  coverBadgeText: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, fontWeight: '600', color: colors.onPrimaryFixedVariant },
  coverRemove: { position: 'absolute', right: spacing.stackSm, top: spacing.stackSm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.error },
  galleryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.stackMd, marginBottom: spacing.stackSm },
  galleryTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, fontWeight: '600', color: colors.onSurface },
  galleryHint: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant },
  galleryList: { gap: spacing.stackSm, paddingBottom: 2 },
  photoThumbWrap: { width: 76, position: 'relative' },
  photoThumb: { width: 76, height: 76, borderRadius: radius.sm, backgroundColor: colors.surfaceContainerLow },
  photoIndex: { fontFamily: typography.bodySm.fontFamily, fontSize: 10, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
  removePhotoButton: { position: 'absolute', right: 3, top: 3, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.error },
  addPhotoTile: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
  addPhotoText: { fontFamily: typography.labelSm.fontFamily, fontSize: 10, color: colors.primary },
  photoRules: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: spacing.stackSm },
  fieldLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, color: colors.onSurface, marginBottom: spacing.stackSm },
  required: { color: colors.error },
  spacedLabel: { marginTop: spacing.stackMd },
  input: { minHeight: 48, paddingHorizontal: spacing.stackMd, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest, fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  inputError: { borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.errorContainer },
  selectField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.stackSm, paddingHorizontal: spacing.stackMd, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest },
  selectFieldText: { flex: 1 },
  selectValue: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  selectPlaceholder: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurfaceVariant },
  disabledField: { opacity: 0.65 },
  inlineError: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, lineHeight: 17, color: colors.error, marginTop: 5 },
  categoryErrorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.stackSm },
  retryButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.stackSm },
  retryText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.primary, textDecorationLine: 'underline' },
  priceInputWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest },
  currencyPrefix: { paddingLeft: spacing.stackMd, fontFamily: typography.labelLg.fontFamily, fontSize: 15, fontWeight: '600', color: colors.primary },
  priceInput: { flex: 1, minHeight: 50, paddingHorizontal: spacing.stackSm, fontFamily: typography.bodyLg.fontFamily, fontSize: 16, color: colors.onSurface },
  priceWords: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, lineHeight: 18, color: colors.accentGreen, marginTop: spacing.stackSm },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.stackSm, marginTop: spacing.stackMd },
  suggestionChip: { minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.stackMd, borderWidth: 1, borderColor: colors.primaryFixedDim, borderRadius: radius.full, backgroundColor: colors.primaryFixed },
  suggestionText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onPrimaryFixedVariant },
  descriptionInput: { minHeight: 126, paddingTop: spacing.stackMd },
  descriptionFooter: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.stackSm },
  characterCount: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 5 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackMd, padding: spacing.stackMd, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  availabilityCopy: { flex: 1 },
  availabilityTitle: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, color: colors.onSurface },
  availabilityDescription: { fontFamily: typography.bodySm.fontFamily, fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant, marginTop: 4 },
  bottomSpacer: { height: spacing.stackSm },
  stickyBottomBar: { paddingHorizontal: spacing.containerMargin, paddingTop: spacing.stackSm, backgroundColor: colors.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  saveButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.stackSm, borderRadius: radius.full, backgroundColor: colors.primaryContainer },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { fontFamily: typography.button.fontFamily, fontSize: 15, fontWeight: typography.button.fontWeight, color: colors.onPrimary },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalSheet: { maxHeight: '78%', paddingHorizontal: spacing.containerMargin, paddingTop: spacing.stackSm, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest },
  sheetHandle: { width: 40, height: 4, alignSelf: 'center', borderRadius: radius.full, backgroundColor: colors.outlineVariant, marginBottom: spacing.stackMd },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.stackSm },
  modalTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 17, fontWeight: '600', color: colors.onSurface },
  modalSubtitle: { fontFamily: typography.bodySm.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  categoryList: { flexGrow: 0 },
  categoryGroup: { paddingVertical: spacing.stackSm },
  categoryHeading: { fontFamily: typography.labelLg.fontFamily, fontSize: 13, fontWeight: '700', color: colors.primary, paddingVertical: spacing.stackSm },
  subcategoryOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.stackMd, borderRadius: radius.md },
  subcategorySelected: { backgroundColor: colors.primaryFixed },
  subcategoryText: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, color: colors.onSurface },
  subcategoryTextSelected: { color: colors.onPrimaryFixedVariant, fontWeight: '600' },
  emptyCategories: { fontFamily: typography.bodyMd.fontFamily, fontSize: 13, color: colors.onSurfaceVariant, paddingVertical: spacing.stackLg },
});
