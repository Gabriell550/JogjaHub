import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Search,
  MoreVertical,
  User,
  Camera,
  Calendar,
  ChevronDown,
  Mail,
  Phone,
  Check,
  Info,
  BadgePercent,
  ShieldCheck,
} from 'lucide-react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { setSession } from '../../../auth/store/authSlice';
import { typography } from '../../../../constants/theme';
import type { RootState } from '../../../../store';

export default function EditCustomerProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const user = authState.user;

  // State Form
  const [fullName, setFullName] = useState(user?.name || 'Sinchan');
  const [bio, setBio] = useState((user as any)?.bio || 'Pecinta kuliner & gadget traveler');
  const [birthDate, setBirthDate] = useState((user as any)?.birth_date || '15 Agustus 1998');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan' | 'Lainnya'>(
    (user as any)?.gender || 'Laki-laki'
  );
  const [email, setEmail] = useState(user?.email || 'sinchan@gmail.com');
  const [phoneNumber, setPhoneNumber] = useState(
    (user as any)?.phone || (user as any)?.phone_number || '+62 812-3456-7890'
  );
  const [avatarUri, setAvatarUri] = useState<string | null>((user as any)?.avatar || null);
  const [saving, setSaving] = useState(false);

  // Modal State untuk Ubah Email / Telepon / Tanggal
  const [editModalType, setEditModalType] = useState<'email' | 'phone' | 'date' | null>(null);
  const [tempInputValue, setTempInputValue] = useState('');

  // ── Ambil Foto dari Galeri ──
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Beri akses galeri untuk mengganti foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        Toast.show({ type: 'success', text1: 'Foto profil dipilih' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal memilih foto' });
    }
  };

  // ── Simpan Perubahan ──
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      const updatedUser = {
        ...user,
        id: user?.id || '1',
        name: fullName.trim(),
        email: email.trim(),
        role: user?.role || ('customer' as const),
        bio: bio.trim(),
        birth_date: birthDate,
        gender,
        phone: phoneNumber,
        avatar: avatarUri,
      };

      // Simpan ke Redux & tersinkron otomatis ke AsyncStorage (Bebas error type null)
      dispatch(
        setSession({
          user: updatedUser as any,
          token: authState.token || '',
          tenantStatus: authState.tenantStatus || undefined,
          businessName: authState.businessName || undefined,
          tenantProfile: authState.tenantProfile || undefined,
        })
      );

      Toast.show({
        type: 'success',
        text1: 'Berhasil!',
        text2: 'Profil Anda berhasil diperbarui.',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Gagal Menyimpan',
        text2: 'Terjadi kesalahan saat menyimpan data.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Modal Helper ──
  const openEditModal = (type: 'email' | 'phone' | 'date') => {
    setEditModalType(type);
    if (type === 'email') setTempInputValue(email);
    else if (type === 'phone') setTempInputValue(phoneNumber);
    else if (type === 'date') setTempInputValue(birthDate);
  };

  const handleModalSave = () => {
    if (editModalType === 'email') {
      if (tempInputValue.trim()) setEmail(tempInputValue.trim());
    } else if (editModalType === 'phone') {
      if (tempInputValue.trim()) setPhoneNumber(tempInputValue.trim());
    } else if (editModalType === 'date') {
      if (tempInputValue.trim()) setBirthDate(tempInputValue.trim());
    }
    setEditModalType(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#121C2A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pengaturan Akun</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Pencarian', 'Cari riwayat dan info profil')}
          >
            <Search size={21} color="#5A4136" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Opsi', 'Pengaturan keamanan dan privasi')}
          >
            <MoreVertical size={21} color="#5A4136" />
          </TouchableOpacity>
          <View style={styles.headerAvatarBadge}>
            <User size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── SUB-BAR AKSI CEPAT ── */}
        <View style={styles.subBar}>
          <View style={styles.subBarLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.subBarText}>Lengkapi data untuk keamanan akun</Text>
          </View>
          <TouchableOpacity
            style={styles.quickSaveBtn}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.quickSaveText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 1: FOTO PROFIL ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={54} color="#EA580C" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraButton}
              activeOpacity={0.8}
              onPress={handlePickAvatar}
            >
              <Camera size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
            <Text style={styles.changePhotoText}>Ubah Foto Profil</Text>
          </TouchableOpacity>
          <Text style={styles.changePhotoHelper}>
            Format JPG, JPEG, PNG (Maksimal 5MB)
          </Text>
        </View>

        {/* ── SECTION 2: DATA PRIBADI ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              <BadgePercent size={20} color="#FF6B00" />
              <Text style={styles.cardTitle}>Data Pribadi</Text>
            </View>
            <Text style={styles.requiredBadge}>Wajib diisi</Text>
          </View>

          {/* Nama Lengkap */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <View style={styles.inputContainer}>
              <User size={19} color="#8E7164" style={styles.inputLeadingIcon} />
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>

          {/* Biodata / Bio Singkat */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Biodata / Bio Singkat</Text>
              <Text style={styles.bioCounter}>{bio.length}/100</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={(text) => {
                if (text.length <= 100) setBio(text);
              }}
              placeholder="Ceritakan sedikit tentang dirimu..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={3}
              maxLength={100}
            />
          </View>

          {/* Tanggal Lahir */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tanggal Lahir</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => openEditModal('date')}
              activeOpacity={0.7}
            >
              <Calendar size={19} color="#8E7164" style={styles.inputLeadingIcon} />
              <Text style={styles.dateValueText}>{birthDate}</Text>
              <ChevronDown size={18} color="#8E7164" style={styles.inputTrailingIcon} />
            </TouchableOpacity>
          </View>

          {/* Jenis Kelamin Chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Jenis Kelamin</Text>
            <View style={styles.genderChipsRow}>
              {/* Laki-laki */}
              <TouchableOpacity
                style={[styles.genderChip, gender === 'Laki-laki' && styles.genderChipActive]}
                onPress={() => setGender('Laki-laki')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="male"
                  size={16}
                  color={gender === 'Laki-laki' ? '#FFFFFF' : '#5A4136'}
                />
                <Text
                  style={[
                    styles.genderChipText,
                    gender === 'Laki-laki' && styles.genderChipTextActive,
                  ]}
                >
                  Laki-laki
                </Text>
              </TouchableOpacity>

              {/* Perempuan */}
              <TouchableOpacity
                style={[styles.genderChip, gender === 'Perempuan' && styles.genderChipActive]}
                onPress={() => setGender('Perempuan')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="female"
                  size={16}
                  color={gender === 'Perempuan' ? '#FFFFFF' : '#5A4136'}
                />
                <Text
                  style={[
                    styles.genderChipText,
                    gender === 'Perempuan' && styles.genderChipTextActive,
                  ]}
                >
                  Perempuan
                </Text>
              </TouchableOpacity>

              {/* Lainnya */}
              <TouchableOpacity
                style={[styles.genderChip, gender === 'Lainnya' && styles.genderChipActive]}
                onPress={() => setGender('Lainnya')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="transgender"
                  size={16}
                  color={gender === 'Lainnya' ? '#FFFFFF' : '#5A4136'}
                />
                <Text
                  style={[
                    styles.genderChipText,
                    gender === 'Lainnya' && styles.genderChipTextActive,
                  ]}
                >
                  Lainnya
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── SECTION 3: KONTAK & KEAMANAN ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              <ShieldCheck size={20} color="#FF6B00" />
              <Text style={styles.cardTitle}>Kontak &amp; Keamanan</Text>
            </View>
            <Text style={styles.securityScore}>Tingkat Aman: 100%</Text>
          </View>

          {/* Email Terdaftar */}
          <View style={styles.contactItemBox}>
            <View style={styles.contactItemHeader}>
              <Text style={styles.contactItemLabel}>Email Terdaftar</Text>
              <View style={styles.verifiedTag}>
                <MaterialIcons name="verified" size={13} color="#FF6B00" />
                <Text style={styles.verifiedText}>Terverifikasi</Text>
              </View>
            </View>
            <View style={styles.contactItemBody}>
              <View style={styles.contactItemLeft}>
                <View style={styles.contactIconBox}>
                  <Mail size={16} color="#FF6B00" />
                </View>
                <Text style={styles.contactValueText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openEditModal('email')}
                activeOpacity={0.7}
              >
                <Text style={styles.changeActionText}>Ubah</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nomor HP */}
          <View style={styles.contactItemBox}>
            <View style={styles.contactItemHeader}>
              <Text style={styles.contactItemLabel}>No. Handphone / WhatsApp</Text>
              <View style={styles.verifiedTag}>
                <MaterialIcons name="verified" size={13} color="#FF6B00" />
                <Text style={styles.verifiedText}>Terverifikasi</Text>
              </View>
            </View>
            <View style={styles.contactItemBody}>
              <View style={styles.contactItemLeft}>
                <View style={styles.contactIconBox}>
                  <Phone size={16} color="#FF6B00" />
                </View>
                <Text style={styles.contactValueText} numberOfLines={1}>
                  {phoneNumber}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openEditModal('phone')}
                activeOpacity={0.7}
              >
                <Text style={styles.changeActionText}>Ubah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── SECTION 4: TIPS CARD ── */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIconBox}>
            <Info size={17} color="#FF6B00" />
          </View>
          <Text style={styles.tipsText}>
            Nama lengkap dan tanggal lahir digunakan untuk pencocokan data rekening saat penarikan saldo dompet digital dan klaim garansi produk.
          </Text>
        </View>

        {/* ── TOMBOL SIMPAN UTAMA ── */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.submitButtonText}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── MODAL UBAH NILAI CEPAT ── */}
      <Modal
        visible={editModalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editModalType === 'email'
                ? 'Ubah Email Terdaftar'
                : editModalType === 'phone'
                ? 'Ubah Nomor Handphone'
                : 'Ubah Tanggal Lahir'}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempInputValue}
              onChangeText={setTempInputValue}
              placeholder={
                editModalType === 'email'
                  ? 'nama@domain.com'
                  : editModalType === 'phone'
                  ? '+62 812-xxxx-xxxx'
                  : 'Contoh: 15 Agustus 1998'
              }
              keyboardType={
                editModalType === 'email'
                  ? 'email-address'
                  : editModalType === 'phone'
                  ? 'phone-pad'
                  : 'default'
              }
              autoCapitalize="none"
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalType(null)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleModalSave}
              >
                <Text style={styles.modalSaveText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#121C2A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Sub-bar
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
  },
  subBarText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 13,
    color: '#5A4136',
  },
  quickSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  quickSaveText: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
  },

  // Avatar Section
  avatarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFF4ED',
    borderWidth: 4,
    borderColor: '#FED7AA',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  changePhotoText: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
  },
  changePhotoHelper: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    color: '#8E7164',
    marginTop: 4,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#121C2A',
  },
  requiredBadge: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B00',
  },
  securityScore: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B00',
  },

  // Inputs
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#5A4136',
  },
  bioCounter: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    color: '#8E7164',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2BFB0',
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  inputTrailingIcon: {
    marginLeft: 'auto',
  },
  textInput: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: '#121C2A',
  },
  textArea: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2BFB0',
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateValueText: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: '#121C2A',
  },

  // Chips Jenis Kelamin
  genderChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderChipActive: {
    backgroundColor: '#FF6B00',
    ...Platform.select({
      ios: { shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  genderChipText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#5A4136',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
  },

  // Contact Items
  contactItemBox: {
    backgroundColor: '#F8F9FF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFF4FF',
  },
  contactItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItemLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    color: '#5A4136',
    fontWeight: '500',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    color: '#FF6B00',
    fontWeight: '700',
  },
  contactItemBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  contactIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF4ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactValueText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#121C2A',
    flex: 1,
  },
  changeActionText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B00',
    paddingHorizontal: 4,
  },

  // Tips Card
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9F5',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 20,
  },
  tipsIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEAD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipsText: {
    flex: 1,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    color: '#5A4136',
    lineHeight: 18,
  },

  // Tombol Simpan
  submitButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  submitButtonText: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#121C2A',
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2BFB0',
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    color: '#121C2A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});