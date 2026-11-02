import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Compass,
  MapPin,
  Store,
  Tag,
  UserRound,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';
import { Button } from '../../../../components/Button/Button';
import { Input } from '../../../../components/Input/Input';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import {
  setTenantProfile,
  setTenantStatusPending,
} from '../../../../features/auth/store/authSlice';
import type { RootState } from '../../../../store';
import type { TenantProfile, TenantProfileUpdatePayload } from '../../../../types/vendor';

type CategoryOption = { id: number; name: string };
type FormErrors = Record<string, string>;
type ApiErrorResponse = {
  response?: {
    data?: {
      message?: unknown;
      errors?: unknown;
    };
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function isTenantProfile(value: unknown): value is TenantProfile {
  if (!isRecord(value) || !isRecord(value.address)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.business_name === 'string' &&
    (typeof value.description === 'string' || value.description === null) &&
    typeof value.whatsapp_number === 'string' &&
    typeof value.address.street === 'string' &&
    typeof value.address.city === 'string' &&
    typeof value.address.province === 'string' &&
    (typeof value.address.postal_code === 'string' || value.address.postal_code === null) &&
    ['pending', 'approved', 'rejected'].includes(String(value.status)) &&
    Array.isArray(value.categories) &&
    value.categories.every(
      (item) =>
        isRecord(item) && typeof item.id === 'number' && typeof item.name === 'string',
    ) &&
    (value.location == null ||
      (isRecord(value.location) &&
        typeof value.location.latitude === 'number' &&
        typeof value.location.longitude === 'number'))
  );
}

function getApiError(error: unknown): { message: string; fields: FormErrors } {
  const response = (error as ApiErrorResponse)?.response;
  const data = response?.data;
  const rawErrors = data?.errors;
  const fields: FormErrors = {};

  if (isRecord(rawErrors)) {
    Object.entries(rawErrors).forEach(([key, value]) => {
      const message = Array.isArray(value)
        ? value.find((item): item is string => typeof item === 'string')
        : typeof value === 'string'
          ? value
          : undefined;
      if (!message) return;

      if (key === 'address.street') fields.street = message;
      else if (key === 'address.city') fields.city = message;
      else if (key === 'address.province') fields.province = message;
      else if (key === 'address.postal_code') fields.postal_code = message;
      else if (key === 'latitude' || key === 'longitude') fields.coordinates = message;
      else if (key.startsWith('category_ids')) fields.category_ids = message;
      else if (key in { business_name: true, description: true, whatsapp_number: true }) {
        fields[key] = message;
      }
    });
  }

  const message =
    typeof data?.message === 'string'
      ? data.message
      : Object.values(fields)[0] ??
        (error instanceof Error ? error.message : 'Gagal menyimpan perubahan profil.');
  return { message, fields };
}

function getProfileCoordinates(profile: TenantProfile) {
  return {
    latitude: profile.location?.latitude ?? profile.latitude,
    longitude: profile.location?.longitude ?? profile.longitude,
  };
}

export default function EditTenantProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);

  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [locating, setLocating] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const loadFormData = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [profileResponse, categoriesResponse] = await Promise.all([
        vendorApi.getMyProfile(),
        categoryApi.getCategories(),
      ]);
      const fetchedProfile: unknown = profileResponse.data?.data;

      if (!isTenantProfile(fetchedProfile)) {
        throw new Error('Data profil dari server tidak lengkap.');
      }

      const rawCategories: unknown = categoriesResponse.data?.data;
      const fetchedCategories = Array.isArray(rawCategories)
        ? rawCategories.filter(
            (item): item is CategoryOption =>
              isRecord(item) &&
              typeof item.id === 'number' &&
              typeof item.name === 'string',
          )
        : [];
      const profileCategories = fetchedProfile.categories.filter(
        (item): item is CategoryOption =>
          isRecord(item) &&
          typeof item.id === 'number' &&
          typeof item.name === 'string',
      );
      const availableIds = new Set(fetchedCategories.map((item) => item.id));
      const categoryOptions = [
        ...fetchedCategories,
        ...profileCategories.filter((item) => !availableIds.has(item.id)),
      ];
      const coordinates = getProfileCoordinates(fetchedProfile);

      setProfile(fetchedProfile);
      setCategories(categoryOptions);
      setBusinessName(fetchedProfile.business_name);
      setDescription(fetchedProfile.description ?? '');
      setWhatsappNumber(fetchedProfile.whatsapp_number);
      setStreet(fetchedProfile.address.street);
      setCity(fetchedProfile.address.city);
      setProvince(fetchedProfile.address.province);
      setPostalCode(fetchedProfile.address.postal_code ?? '');
      setLatitude(coordinates.latitude == null ? '' : String(coordinates.latitude));
      setLongitude(coordinates.longitude == null ? '' : String(coordinates.longitude));
      setSelectedCategoryIds(profileCategories.map((item) => item.id));
      dispatch(setTenantProfile(fetchedProfile));
    } catch (error) {
      const details = getApiError(error);
      setLoadError(details.message);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void loadFormData();
  }, [loadFormData]);

  const clearError = (key: string) => {
    setFieldErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const updateCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Izin lokasi ditolak',
          text2: 'Izinkan akses lokasi untuk memperbarui titik usaha.',
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
      clearError('coordinates');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lokasi tidak dapat diperbarui',
        text2: 'Coba lagi atau gunakan koordinat usaha yang tersimpan.',
      });
    } finally {
      setLocating(false);
    }
  };

  const validate = (): FormErrors => {
    const errors: FormErrors = {};
    if (!businessName.trim()) errors.business_name = 'Nama bisnis wajib diisi.';
    else if (businessName.trim().length > 255) {
      errors.business_name = 'Nama bisnis maksimal 255 karakter.';
    }
    if (!whatsappNumber.trim()) errors.whatsapp_number = 'Nomor WhatsApp wajib diisi.';
    else if (whatsappNumber.trim().length > 20) {
      errors.whatsapp_number = 'Nomor WhatsApp maksimal 20 karakter.';
    }
    if (!street.trim()) errors.street = 'Alamat jalan wajib diisi.';
    if (!city.trim()) errors.city = 'Kota/kabupaten wajib diisi.';
    if (!province.trim()) errors.province = 'Provinsi wajib diisi.';
    else if (!['DI Yogyakarta', 'Daerah Istimewa Yogyakarta'].includes(province.trim())) {
      errors.province = 'Gunakan “DI Yogyakarta” atau “Daerah Istimewa Yogyakarta”.';
    }
    if (selectedCategoryIds.length === 0) {
      errors.category_ids = 'Pilih minimal satu kategori.';
    }

    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(numericLatitude) ||
      !Number.isFinite(numericLongitude) ||
      numericLatitude < -8.5 ||
      numericLatitude > -7.5 ||
      numericLongitude < 110 ||
      numericLongitude > 110.8
    ) {
      errors.coordinates = 'Koordinat usaha tidak valid. Perbarui titik lokasi melalui GPS.';
    }
    return errors;
  };

  const handleSave = async () => {
    if (savingRef.current || !profile) return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Periksa kembali formulir',
        text2: 'Lengkapi data wajib yang ditandai.',
      });
      return;
    }

    const payload: TenantProfileUpdatePayload = {
      business_name: businessName.trim(),
      description: description.trim() || undefined,
      address: {
        street: street.trim(),
        city: city.trim(),
        province: province.trim(),
        postal_code: postalCode.trim() || undefined,
      },
      latitude: Number(latitude),
      longitude: Number(longitude),
      whatsapp_number: whatsappNumber.trim(),
      category_ids: selectedCategoryIds,
    };

    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();

    try {
      const response = await vendorApi.updateMyProfile(payload);
      const updatedProfile: unknown = response.data?.data;
      if (!isTenantProfile(updatedProfile)) {
        throw new Error('Server tidak mengembalikan data profil terbaru.');
      }

      setProfile(updatedProfile);
      dispatch(setTenantProfile(updatedProfile));
      if (updatedProfile.status === 'pending') {
        dispatch(setTenantStatusPending());
      }
      Toast.show({
        type: 'success',
        text1: 'Profil berhasil diperbarui',
        text2:
          updatedProfile.status === 'pending'
            ? 'Perubahan menunggu persetujuan admin.'
            : 'Informasi profil bisnis Anda telah disimpan.',
      });

      if (updatedProfile.status !== 'pending') {
        navigation.goBack();
      }
    } catch (error) {
      const details = getApiError(error);
      const fields = details.fields;
      setFieldErrors((previous) => ({ ...previous, ...fields }));
      Toast.show({
        type: 'error',
        text1: 'Gagal menyimpan perubahan',
        text2: details.message,
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const coordinatesLabel =
    latitude && longitude ? `${latitude}, ${longitude}` : 'Belum tersedia';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.stackSm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          disabled={saving}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, saving && styles.disabled]}
        >
          <ChevronLeft size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Edit Profil</Text>
          <Text style={styles.headerSubtitle}>Perbarui informasi bisnis Anda</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primaryContainer} />
          <Text style={styles.stateText}>Memuat data profil...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <AlertCircle size={24} color={colors.error} />
          </View>
          <Text style={styles.stateTitle}>Profil belum dapat dimuat</Text>
          <Text style={styles.stateText}>{loadError}</Text>
          <Button label="Coba Lagi" onPress={() => void loadFormData()} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              Data akun bersifat tetap. Anda dapat memperbarui informasi yang ditampilkan pada
              profil bisnis.
            </Text>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconBox}>
                  <UserRound size={18} color={colors.primary} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Informasi Akun</Text>
                  <Text style={styles.sectionDescription}>Tidak dapat diubah dari halaman ini</Text>
                </View>
              </View>
              <View style={styles.readOnlyField}>
                <Text style={styles.fieldLabel}>Nama pemilik</Text>
                <Text style={styles.readOnlyValue}>{user?.name || 'Tidak tersedia'}</Text>
              </View>
              <View style={styles.readOnlyField}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.readOnlyValue}>{user?.email || 'Tidak tersedia'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconBox}>
                  <Store size={18} color={colors.primary} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Informasi Bisnis</Text>
                  <Text style={styles.sectionDescription}>Data utama usaha Anda</Text>
                </View>
              </View>
              <Input
                label="Nama bisnis *"
                placeholder="Masukkan nama bisnis"
                value={businessName}
                onChangeText={(value) => {
                  setBusinessName(value);
                  clearError('business_name');
                }}
                error={fieldErrors.business_name}
                maxLength={255}
                returnKeyType="next"
              />
              <Input
                label="Deskripsi (opsional)"
                placeholder="Ceritakan bisnis dan layanan Anda"
                value={description}
                onChangeText={(value) => {
                  setDescription(value);
                  clearError('description');
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
                error={fieldErrors.description}
              />
              <Input
                label="Nomor WhatsApp *"
                placeholder="Contoh: 08123456789"
                value={whatsappNumber}
                onChangeText={(value) => {
                  setWhatsappNumber(value);
                  clearError('whatsapp_number');
                }}
                keyboardType="phone-pad"
                maxLength={20}
                error={fieldErrors.whatsapp_number}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconBox}>
                  <Tag size={18} color={colors.primary} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Kategori Bisnis</Text>
                  <Text style={styles.sectionDescription}>Pilih satu atau beberapa kategori</Text>
                </View>
              </View>
              <View style={styles.categoryWrap}>
                {categories.map((category) => {
                  const selected = selectedCategoryIds.includes(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={category.name}
                      onPress={() => {
                        setSelectedCategoryIds((previous) =>
                          selected
                            ? previous.filter((id) => id !== category.id)
                            : [...previous, category.id],
                        );
                        clearError('category_ids');
                      }}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                    >
                      {selected ? <Check size={15} color={colors.onPrimary} /> : null}
                      <Text
                        style={[
                          styles.categoryText,
                          selected && styles.categoryTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {categories.length === 0 ? (
                <Text style={styles.helperText}>Kategori belum tersedia dari server.</Text>
              ) : null}
              {fieldErrors.category_ids ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {fieldErrors.category_ids}
                </Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconBox}>
                  <MapPin size={18} color={colors.primary} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Alamat & Lokasi</Text>
                  <Text style={styles.sectionDescription}>Lokasi bisnis pada profil Anda</Text>
                </View>
              </View>
              <Input
                label="Alamat jalan *"
                placeholder="Nama jalan, gedung, atau detail alamat"
                value={street}
                onChangeText={(value) => {
                  setStreet(value);
                  clearError('street');
                }}
                error={fieldErrors.street}
              />
              <Input
                label="Kota/kabupaten *"
                placeholder="Masukkan kota/kabupaten"
                value={city}
                onChangeText={(value) => {
                  setCity(value);
                  clearError('city');
                }}
                error={fieldErrors.city}
              />
              <Input
                label="Provinsi *"
                placeholder="DI Yogyakarta"
                value={province}
                onChangeText={(value) => {
                  setProvince(value);
                  clearError('province');
                }}
                error={fieldErrors.province}
              />
              <Input
                label="Kode pos (opsional)"
                placeholder="Masukkan kode pos"
                value={postalCode}
                onChangeText={(value) => {
                  setPostalCode(value);
                  clearError('postal_code');
                }}
                keyboardType="number-pad"
                error={fieldErrors.postal_code}
              />

              <View style={styles.locationRow}>
                <View style={styles.locationCopy}>
                  <Text style={styles.fieldLabel}>Koordinat usaha</Text>
                  <Text style={styles.coordinateValue}>{coordinatesLabel}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Perbarui titik lokasi dengan GPS"
                  disabled={locating}
                  onPress={() => void updateCurrentLocation()}
                  style={({ pressed }) => [
                    styles.locationButton,
                    pressed && !locating && styles.pressed,
                    locating && styles.disabled,
                  ]}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Compass size={17} color={colors.primary} />
                  )}
                  <Text style={styles.locationButtonText}>
                    {locating ? 'Mencari' : 'Perbarui GPS'}
                  </Text>
                </Pressable>
              </View>
              {fieldErrors.coordinates ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {fieldErrors.coordinates}
                </Text>
              ) : null}
              <Text style={styles.helperText}>
                Koordinat tersimpan tetap digunakan kecuali Anda memperbaruinya dengan GPS.
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.gutter) }]}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <Text style={styles.cancelText}>Batalkan</Text>
            </Pressable>
            <View style={styles.saveButton}>
              <Button
                label="Simpan Perubahan"
                onPress={handleSave}
                loading={saving}
                disabled={saving || categories.length === 0}
              />
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.stackSm,
  },
  headerCopy: { flex: 1, marginLeft: spacing.stackSm },
  headerTitle: {
    color: colors.onSurface,
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    marginTop: 2,
  },
  headerSpacer: { width: spacing.stackLg },
  scroll: { flex: 1 },
  content: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.stackLg,
    gap: spacing.gutter,
  },
  intro: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    padding: spacing.gutter,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    marginBottom: spacing.gutter,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
  },
  sectionCopy: { flex: 1 },
  sectionTitle: {
    color: colors.onSurface,
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionDescription: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    marginTop: 2,
  },
  readOnlyField: {
    paddingVertical: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainer,
  },
  fieldLabel: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    marginBottom: 4,
  },
  readOnlyValue: {
    color: colors.onSurface,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
  },
  textArea: { minHeight: 96, paddingTop: spacing.stackSm },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.stackSm },
  categoryChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
  },
  categoryChipSelected: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.primaryContainer,
  },
  categoryText: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
  },
  categoryTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  helperText: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.stackSm,
  },
  fieldError: {
    color: colors.error,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    padding: spacing.stackSm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  locationCopy: { flex: 1 },
  coordinateValue: {
    color: colors.onSurface,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
  },
  locationButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.stackSm,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerLowest,
  },
  locationButtonText: {
    color: colors.primary,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  cancelButton: {
    minHeight: 48,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter,
    borderRadius: radius.DEFAULT,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cancelText: {
    color: colors.onSurface,
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: { flex: 1 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.containerMargin,
    gap: spacing.stackSm,
  },
  errorIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.errorContainer,
  },
  stateTitle: {
    color: colors.onSurface,
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.stackSm,
  },
});
