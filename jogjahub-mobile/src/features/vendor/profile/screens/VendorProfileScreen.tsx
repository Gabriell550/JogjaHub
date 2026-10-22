import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
  Alert,
  Share,
  Switch,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Share2,
  Settings,
  Camera,
  Pencil,
  Star,
  MapPin,
  Store,
  ClipboardList,
  FolderKanban,
  CalendarCheck,
  MessageSquare,
  Bot,
  Plus,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
  LogOut,
  Navigation,
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout, setTenantProfile } from '../../../../features/auth/store/authSlice';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { categoryApi } from '../../../../api/categoryApi';
import { getPrimaryPhotoUrl } from '../../../../utils/serviceImage';
import type { RootState } from '../../../../store';

type ServiceItem = {
  id: number;
  name: string;
  price: number;
  description?: string;
  subcategory?: { id: number; name: string; category?: { id: number; name: string } };
  photos?: Array<{ url: string; is_primary?: boolean; sort_order?: number }>;
};

type CategoryItem = {
  id: number;
  name: string;
};

export default function VendorProfileScreen({ navigation }: { navigation: any }) {
  const profile = useSelector((state: RootState) => state.auth.tenantProfile);
  const businessName = useSelector((state: RootState) => state.auth?.businessName) || profile?.business_name || 'Nama Bisnis';
  const dispatch = useDispatch();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Status toggle tampilan listing secara lokal
  const [serviceVisibility, setServiceVisibility] = useState<Record<number, boolean>>({});

  const fetchServices = useCallback(async () => {
    try {
      const res = await vendorApi.listMyServices();
      const rawData = res.data?.data;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
      setServices(items);
    } catch (err) {
      console.log('Gagal ambil layanan:', err);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryApi.getCategories();
      const list = (res.data?.data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
      setCategories(list);
    } catch (err) {
      console.log('Gagal ambil kategori:', err);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await vendorApi.getMyProfile();
      const data = res.data?.data;
      if (data) dispatch(setTenantProfile(data));
    } catch (err) {
      console.log('Gagal ambil profil:', err);
    }
  }, [dispatch]);

  // Otomatis refresh saat layar aktif / difokuskan
  useFocusEffect(
    useCallback(() => {
      fetchServices();
      fetchCategories();
      fetchProfile();
    }, [fetchServices, fetchCategories, fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchServices(), fetchCategories(), fetchProfile()]);
    setRefreshing(false);
  }, [fetchServices, fetchCategories, fetchProfile]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleEditProfile = () => navigation?.navigate('EditBusinessProfile');
  const handleGoToListing = () => navigation?.getParent()?.navigate('Listing');
  const handleGoToOrders = () => navigation?.getParent()?.navigate('Orders');
  const handleGoToCalendar = () => navigation?.getParent()?.navigate('Calendar');

  const handleOpenMaps = () => {
    if (!profile?.latitude || !profile?.longitude) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || 'Yogyakarta')}`);
      return;
    }
    Linking.openURL(`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Akun Bisnis',
      'Apakah Anda yakin ingin keluar dari akun bisnis ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: () => dispatch(logout()) },
      ]
    );
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Temukan dan pesan layanan terbaik dari ${businessName} di JogjaHub! ✨`,
        title: businessName,
      });
    } catch {}
  };

  const toggleServiceVisibility = (id: number) => {
    setServiceVisibility((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false,
    }));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const addr = profile?.address;
  const fullAddress = [addr?.street, addr?.city, addr?.province].filter(Boolean).join(', ');
  const addressSub = addr?.postal_code
    ? `${addr.city}, ${addr.province} ${addr.postal_code}`
    : `${addr?.city ?? 'Kota Yogyakarta'}, ${addr?.province ?? 'DIY'}`;
  const city = addr?.city ?? 'Malioboro, DIY';

  const categoryNames = profile?.categories?.map((c) => c.name) ?? [];
  const formatRupiah = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  const initials = (businessName ?? 'CS')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* ── HEADER BANNER UTAMA DENGAN POLA ORANYE JOGJAHUB ── */}
        <View style={styles.headerBanner}>
          <View style={styles.decorCircleA} />
          <View style={styles.decorCircleB} />

          {/* Baris Navigasi Atas */}
          <View style={styles.navTopRow}>
            <View style={styles.logoAndTitle}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../../assets/images/logo.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.bannerHeaderTitle}>Profil Bisnis</Text>
            </View>

            <View style={styles.headerActionBtns}>
              <TouchableOpacity style={styles.roundActionBtn} onPress={handleShareProfile} activeOpacity={0.8}>
                <Share2 size={17} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundActionBtn} onPress={handleEditProfile} activeOpacity={0.8}>
                <Settings size={17} color="#fff" />
                <View style={styles.settingBadgeDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profil Bisnis Identitas */}
          <View style={styles.vendorIdentityRow}>
            {/* Avatar Toko */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarInitialsText}>{initials || 'CS'}</Text>
              </View>
              <TouchableOpacity style={styles.avatarCameraBadge} onPress={handleEditProfile} activeOpacity={0.8}>
                <Camera size={12} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Info Bisnis */}
            <View style={styles.vendorInfoWrap}>
              <Text style={styles.businessTitleText} numberOfLines={1}>
                {businessName}
              </Text>

              <Text style={styles.categorySubText} numberOfLines={1}>
                {categoryNames.length > 0 ? categoryNames.join(' • ') : 'Penginapan • Beauty & Style'}
              </Text>

              <View style={styles.ratingAndLocationRow}>
                <View style={styles.ratingGroup}>
                  <Star size={13} color="#FDE047" fill="#FDE047" />
                  <Text style={styles.ratingValueText}>4.9</Text>
                  <Text style={styles.reviewsCountText}>(42 ulasan)</Text>
                </View>
                <Text style={styles.dotDivider}>•</Text>
                <View style={styles.locationGroup}>
                  <MapPin size={12} color="#FDE047" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {city}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tombol Edit */}
            <TouchableOpacity style={styles.headerEditBtn} onPress={handleEditProfile} activeOpacity={0.8}>
              <Pencil size={12} color="#fff" />
              <Text style={styles.headerEditBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Saklar Operasional Toko (Buka / Tutup) */}
          <View style={styles.storeStatusCard}>
            <View style={styles.storeStatusLeft}>
              <View style={styles.pulseContainer}>
                <View style={[styles.pulseOuter, !isOpen && { backgroundColor: '#EF4444' }]} />
                <View style={[styles.pulseInner, !isOpen && { backgroundColor: '#EF4444' }]} />
              </View>
              <View>
                <Text style={styles.storeStatusTitle}>
                  {isOpen ? 'Toko Sedang Buka' : 'Toko Sedang Tutup'}
                </Text>
                <Text style={styles.storeStatusSubtitle}>
                  {isOpen ? 'Menerima pesanan & booking online' : 'Tidak menerima reservasi baru saat ini'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#10B981' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── CARD METRIK UTAMA (4 KOLOM) ── */}
        <View style={styles.metricsWrapper}>
          <View style={styles.metricsCard}>
            {/* 1. Layanan */}
            <TouchableOpacity style={styles.metricItem} onPress={handleGoToListing} activeOpacity={0.7}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <Store size={19} color="#FF6B00" />
              </View>
              <Text style={styles.metricValueText}>{services.length} Layanan</Text>
              <View style={styles.activeTag}>
                <View style={styles.tinyGreenDot} />
                <Text style={styles.activeTagText}>Aktif</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Pesanan */}
            <TouchableOpacity style={styles.metricItem} onPress={handleGoToOrders} activeOpacity={0.7}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#F0F9FF' }]}>
                <ClipboardList size={19} color="#0EA5E9" />
              </View>
              <Text style={styles.metricValueText}>128 Order</Text>
              <Text style={styles.metricSubText}>+12% bln ini</Text>
            </TouchableOpacity>

            {/* 3. Katalog */}
            <TouchableOpacity style={styles.metricItem} onPress={handleGoToListing} activeOpacity={0.7}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#F8FAFC' }]}>
                <FolderKanban size={19} color="#475569" />
              </View>
              <Text style={styles.metricValueText}>Katalog</Text>
              <Text style={styles.metricSubText}>Atur Produk</Text>
            </TouchableOpacity>

            {/* 4. Jadwal */}
            <TouchableOpacity style={styles.metricItem} onPress={handleGoToCalendar} activeOpacity={0.7}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#F0F9FF' }]}>
                <CalendarCheck size={19} color="#0EA5E9" />
              </View>
              <Text style={styles.metricValueText}>Jadwal</Text>
              <Text style={styles.metricSubText}>Reservasi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CARD REALTIME LIVE CHAT ── */}
        <View style={styles.chatSection}>
          <View style={styles.chatCard}>
            <View style={styles.chatGlowA} />
            <View style={styles.chatGlowB} />

            {/* Header Chat */}
            <View style={styles.chatHeaderRow}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatIconBox}>
                  <MessageSquare size={17} color="#fff" />
                  <View style={styles.chatOnlinePulse} />
                </View>
                <View>
                  <View style={styles.chatTitleGroup}>
                    <Text style={styles.chatCardTitle}>JogjaHub Live Chat</Text>
                    <View style={styles.newChatBadge}>
                      <Text style={styles.newChatBadgeText}>3 Pesan Baru</Text>
                    </View>
                  </View>
                  <Text style={styles.chatCardSubtitle}>Komunikasi resmi & aman antar vendor-klien</Text>
                </View>
              </View>
            </View>

            {/* Preview Bubble Chat Aktif */}
            <TouchableOpacity
              style={styles.chatBubblePreview}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Live Chat', 'Membuka riwayat pesan terbaru dengan pelanggan...')}
            >
              <View style={styles.chatBubbleLeft}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>AD</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.clientInfoRow}>
                    <Text style={styles.clientNameText}>Annisa Dwi</Text>
                    <Text style={styles.chatTimeText}>3 mnt lalu</Text>
                  </View>
                  <Text style={styles.chatPreviewMessage} numberOfLines={1}>
                    "Halo kak, jadwal besok jam 14.00 ada slot kosong?"
                  </Text>
                </View>
              </View>
              <View style={styles.unreadOrangeDot} />
            </TouchableOpacity>

            {/* Action Buttons Chat */}
            <View style={styles.chatActionBtnRow}>
              <TouchableOpacity
                style={styles.openChatBtn}
                onPress={() => Alert.alert('Chatroom', 'Membuka ruang live chat JogjaHub...')}
                activeOpacity={0.8}
              >
                <MessageSquare size={14} color="#fff" />
                <Text style={styles.openChatBtnText}>Buka Chatroom</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.autoReplyBtn}
                onPress={() => Alert.alert('Auto-Reply', 'Pengaturan template balasan otomatis untuk pelanggan.')}
                activeOpacity={0.8}
              >
                <Bot size={15} color="#38BDF8" />
                <Text style={styles.autoReplyBtnText}>Auto-Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── SECTION: LAYANAN & LISTING AKTIF ── */}
        <View style={styles.listingSection}>
          <View style={styles.listingSectionHeader}>
            <View>
              <View style={styles.listingTitleWrap}>
                <Text style={styles.sectionHeadingText}>Layanan & Listing</Text>
                <View style={styles.listingCountBadge}>
                  <Text style={styles.listingCountBadgeText}>{services.length} Listing</Text>
                </View>
              </View>
              <Text style={styles.sectionSubHeadingText}>Katalog aktif yang dapat dipesan pelanggan</Text>
            </View>

            <TouchableOpacity style={styles.addServiceTopBtn} onPress={handleGoToListing} activeOpacity={0.8}>
              <Plus size={14} color="#fff" />
              <Text style={styles.addServiceTopBtnText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll Katalog */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingScrollRow}>
            {services.length === 0 ? (
              <TouchableOpacity style={styles.emptyListingBox} onPress={handleGoToListing} activeOpacity={0.8}>
                <View style={styles.emptyListingIconWrap}>
                  <Store size={24} color="#FF6B00" />
                </View>
                <Text style={styles.emptyListingTitle}>Belum ada layanan</Text>
                <Text style={styles.emptyListingSub}>Tekan untuk menambah layanan pertama Anda</Text>
              </TouchableOpacity>
            ) : (
              services.map((item) => {
                const photoUri = getPrimaryPhotoUrl(item);
                const imageUri = photoUri || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400';
                const isVisible = serviceVisibility[item.id] !== false;

                return (
                  <View key={item.id} style={styles.productCard}>
                    <View>
                      {/* Thumbnail Image */}
                      <View style={styles.productImageWrap}>
                        <Image source={{ uri: imageUri }} style={styles.productImage} />
                        <View style={styles.badgePopuler}>
                          <Text style={styles.badgePopulerText}>Populer</Text>
                        </View>
                        <View style={styles.badgeStatusAktif}>
                          <View style={styles.tinyGreenDot} />
                          <Text style={styles.badgeStatusAktifText}>Aktif</Text>
                        </View>
                      </View>

                      {/* Detail Produk */}
                      <View style={styles.productInfoWrap}>
                        <Text style={styles.productTitleText} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.productDescText} numberOfLines={1}>
                          {item.description || 'Layanan unggulan berkualitas'}
                        </Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.productPriceText}>{formatRupiah(item.price)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Kontrol Saklar & Kelola */}
                    <View style={styles.productControlRow}>
                      <View style={styles.visibilityToggleGroup}>
                        <Switch
                          value={isVisible}
                          onValueChange={() => toggleServiceVisibility(item.id)}
                          trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                          thumbColor="#ffffff"
                          style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                        />
                        <Text style={styles.toggleLabelText}>Tampil</Text>
                      </View>

                      <TouchableOpacity style={styles.kelolaBtn} onPress={handleGoToListing} activeOpacity={0.7}>
                        <Pencil size={11} color="#FF6B00" />
                        <Text style={styles.kelolaBtnText}>Kelola</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Card Tambah Layanan Baru */}
            <TouchableOpacity style={styles.addNewCardDashed} onPress={handleGoToListing} activeOpacity={0.8}>
              <View style={styles.addNewCircleIcon}>
                <Plus size={20} color="#fff" />
              </View>
              <Text style={styles.addNewCardTitle}>+ Tambah Layanan</Text>
              <Text style={styles.addNewCardSubtitle}>Jasa/kamar baru</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── SECTION: PROFIL & OPERASIONAL BISNIS ── */}
        <View style={styles.standardSection}>
          <View style={styles.whiteCardBox}>
            <View style={styles.whiteCardHeader}>
              <View style={styles.cardHeaderTitleRow}>
                <Store size={18} color="#FF6B00" />
                <Text style={styles.cardHeaderTitle}>PROFIL & OPERASIONAL</Text>
              </View>
              <TouchableOpacity onPress={handleEditProfile}>
                <Text style={styles.cardHeaderActionText}>Ubah</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.businessDescriptionText}>
              {profile?.description ||
                'Salon kecantikan & studio perawatan profesional di pusat Kota Jogja. Mengutamakan kenyamanan pelanggan, higienitas tinggi, dengan staf berpengalaman.'}
            </Text>

            {/* Tag Spesialisasi */}
            <View style={styles.specialtyTagsRow}>
              <View style={[styles.specialtyTag, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                <Text style={[styles.specialtyTagText, { color: '#FF6B00' }]}># Salon Rambut</Text>
              </View>
              <View style={[styles.specialtyTag, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' }]}>
                <Text style={[styles.specialtyTagText, { color: '#0EA5E9' }]}># Eyelash Ext.</Text>
              </View>
              <View style={[styles.specialtyTag, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
                <Text style={[styles.specialtyTagText, { color: '#059669' }]}># Facial Estetika</Text>
              </View>
            </View>

            {/* Jam Operasional */}
            <View style={styles.operatingHoursRow}>
              <View style={styles.clockIconAndHours}>
                <View style={styles.clockIconBox}>
                  <Clock size={14} color="#64748B" />
                </View>
                <View>
                  <Text style={styles.operatingDaysText}>Setiap Hari</Text>
                  <Text style={styles.operatingTimeText}>09:00 - 20:30 WIB</Text>
                </View>
              </View>
              <View style={styles.openNowBadge}>
                <Text style={styles.openNowBadgeText}>Sedang Buka</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION: LOKASI & TITIK ALAMAT ── */}
        <View style={styles.standardSection}>
          <View style={styles.whiteCardBox}>
            <View style={styles.whiteCardHeader}>
              <View style={styles.cardHeaderTitleRow}>
                <MapPin size={18} color="#FF6B00" />
                <Text style={styles.cardHeaderTitleBold}>Lokasi & Titik Alamat</Text>
              </View>
              <TouchableOpacity style={styles.mapLinkBtn} onPress={handleOpenMaps} activeOpacity={0.7}>
                <Text style={styles.mapLinkBtnText}>Buka Peta & Navigasi</Text>
                <ExternalLink size={12} color="#0EA5E9" />
              </TouchableOpacity>
            </View>

            {/* Minimalist Map View */}
            <View style={styles.stylizedMapBox}>
              <View style={styles.mapRoadH} />
              <View style={styles.mapRoadV} />

              {/* Pin Marker */}
              <View style={styles.mapPinWrap}>
                <View style={styles.mapPinCallout}>
                  <Text style={styles.mapPinCalloutText}>{businessName}</Text>
                </View>
                <View style={styles.mapPinDotCircle}>
                  <Store size={12} color="#fff" />
                </View>
              </View>

              {/* Tombol Rute Maps */}
              <TouchableOpacity style={styles.mapFloatRuteBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
                <Navigation size={11} color="#FF6B00" />
                <Text style={styles.mapFloatRuteBtnText}>Rute Google Maps</Text>
              </TouchableOpacity>
            </View>

            {/* Alamat Fisik */}
            <View style={styles.addressDetailRow}>
              <View style={styles.addressPinIconBox}>
                <MapPin size={16} color="#FF6B00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressPrimaryText}>
                  {fullAddress || 'Jl. Malioboro No. 42, Danurejan'}
                </Text>
                <Text style={styles.addressSecondaryText}>
                  {addressSub || 'Kota Yogyakarta, Daerah Istimewa Yogyakarta 55213'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION: PENGATURAN TOKO & KEAMANAN ── */}
        <View style={[styles.standardSection, { gap: 10 }]}>
          <TouchableOpacity
            style={styles.menuSettingRow}
            onPress={() => Alert.alert('Pengaturan Akun', 'Fitur pengaturan akun dan verifikasi dokumen bisnis.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuSettingLeft}>
              <ShieldCheck size={18} color="#64748B" />
              <Text style={styles.menuSettingLabel}>Pengaturan Akun & Keamanan</Text>
            </View>
            <Text style={styles.menuSettingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuSettingRow}
            onPress={() => Alert.alert('Kebijakan', 'Kebijakan pembatalan pesanan dan aturan pengembalian dana JogjaHub.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuSettingLeft}>
              <FileText size={18} color="#64748B" />
              <Text style={styles.menuSettingLabel}>Kebijakan Pembatalan & Pengembalian</Text>
            </View>
            <Text style={styles.menuSettingArrow}>›</Text>
          </TouchableOpacity>

          {/* Tombol Logout Merah */}
          <TouchableOpacity style={styles.logoutVendorBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={16} color="#E11D48" />
            <Text style={styles.logoutVendorText}>Keluar dari Akun Bisnis</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── Header Banner ──
  headerBanner: {
    backgroundColor: '#FF6B00',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircleA: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  decorCircleB: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  navTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  bannerHeaderTitle: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  settingBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#FF6B00',
  },

  // Identitas Vendor
  vendorIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarInitialsText: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 22,
    fontWeight: '900',
    color: '#FF6B00',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  vendorInfoWrap: {
    flex: 1,
    paddingTop: 2,
  },
  businessTitleText: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 22,
  },
  categorySubText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#FFEDD5',
    fontWeight: '600',
    marginTop: 2,
  },
  ratingAndLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValueText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
  },
  reviewsCountText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  dotDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#fff',
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  headerEditBtnText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Toko Sedang Buka Card
  storeStatusCard: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  storeStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulseContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34D399',
    opacity: 0.4,
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  storeStatusTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  storeStatusSubtitle: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 1,
  },

  // ── 4 Metrics Card Strip ──
  metricsWrapper: {
    paddingHorizontal: 20,
    marginTop: -22,
    zIndex: 10,
  },
  metricsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValueText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  tinyGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeTagText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  metricSubText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },

  // ── Section Live Chat Dark Card ──
  chatSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  chatCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  chatGlowA: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
  },
  chatGlowB: {
    position: 'absolute',
    top: -10,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chatIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatOnlinePulse: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  chatTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatCardTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  newChatBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  newChatBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  chatCardSubtitle: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  responseSpeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  responseSpeedText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  chatBubblePreview: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  chatBubbleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientNameText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  chatTimeText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  chatPreviewMessage: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  unreadOrangeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF6B00',
    marginLeft: 6,
  },
  chatActionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  openChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF6B00',
    paddingVertical: 9,
    borderRadius: 12,
  },
  openChatBtnText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  autoReplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  autoReplyBtnText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },

  // ── Section Layanan & Listing ──
  listingSection: {
    marginTop: 22,
  },
  listingSectionHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listingTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadingText: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  listingCountBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  listingCountBadgeText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B00',
  },
  sectionSubHeadingText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  addServiceTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addServiceTopBtnText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  listingScrollRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  emptyListingBox: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyListingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyListingTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyListingSub: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  productCard: {
    width: 175,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  productImageWrap: {
    height: 110,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgePopuler: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePopulerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  badgeStatusAktif: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeStatusAktifText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  productInfoWrap: {
    padding: 10,
  },
  productTitleText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  productDescText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  priceRow: {
    marginTop: 6,
  },
  productPriceText: {
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: '#FF6B00',
  },
  productControlRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  toggleLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  kelolaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  kelolaBtnText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B00',
  },
  addNewCardDashed: {
    width: 135,
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addNewCircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addNewCardTitle: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  addNewCardSubtitle: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#FF6B00',
    marginTop: 2,
  },

  // ── Standard Section Containers ──
  standardSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  whiteCardBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  whiteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardHeaderTitleBold: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardHeaderActionText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
  },
  businessDescriptionText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  specialtyTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  specialtyTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  specialtyTagText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  },
  operatingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clockIconAndHours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clockIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatingDaysText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  operatingTimeText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 10,
    color: '#64748B',
  },
  openNowBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  openNowBadgeText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  // ── Lokasi Map Minimalis ──
  mapLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mapLinkBtnText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  stylizedMapBox: {
    width: '100%',
    height: 125,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  mapRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    left: '35%',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapPinWrap: {
    alignItems: 'center',
    zIndex: 10,
  },
  mapPinCallout: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
    elevation: 3,
  },
  mapPinCalloutText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  mapPinDotCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapFloatRuteBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 2,
  },
  mapFloatRuteBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  addressDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
  },
  addressPinIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressPrimaryText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressSecondaryText: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Menu Pengaturan & Logout ──
  menuSettingRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuSettingLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  menuSettingArrow: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  logoutVendorBtn: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginTop: 4,
  },
  logoutVendorText: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
});