import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import {
  CheckCircle2,
  Pencil,
  Clock,
  ChevronRight,
  ExternalLink,
  MapPin,
  MessageSquare,
  Star,
  Plus,
  LayoutGrid,
  ClipboardList,
  Share2,
  Camera,
  LogOut,
  ShoppingBag,
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout, setTenantProfile } from '../../../../features/auth/store/authSlice';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { categoryApi } from '../../../../api/categoryApi';
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
  const profile      = useSelector((state: RootState) => state.auth.tenantProfile);
  const businessName = useSelector((state: RootState) => state.auth?.businessName);
  const dispatch     = useDispatch();

  const [services, setServices]               = useState<ServiceItem[]>([]);
  const [categories, setCategories]           = useState<CategoryItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [refreshing, setRefreshing]           = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const res     = await vendorApi.listMyServices();
      const rawData = res.data?.data;
      const items   = Array.isArray(rawData)
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
      const res  = await categoryApi.getCategories();
      const list = (res.data?.data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
      setCategories(list);
    } catch (err) {
      console.log('Gagal ambil kategori:', err);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res  = await vendorApi.getMyProfile();
      const data = res.data?.data;
      if (data) dispatch(setTenantProfile(data));
    } catch (err) {
      console.log('Gagal ambil profil:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchProfile();
  }, [fetchServices, fetchCategories, fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchServices(), fetchCategories(), fetchProfile()]);
    setRefreshing(false);
  }, [fetchServices, fetchCategories, fetchProfile]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleEditProfile = () => navigation?.navigate('EditBusinessProfile');
  const handleServicePress = () => navigation?.getParent()?.navigate('Listing');
  const handleGoToOrders   = () => navigation?.getParent()?.navigate('Orders');
  const handleGoToListing  = () => navigation?.getParent()?.navigate('Listing');

  const handleWhatsApp = () => {
    if (!profile?.whatsapp_number) return;
    const number = profile.whatsapp_number.replace(/[^0-9]/g, '');
    if (number.length >= 10) Linking.openURL(`https://wa.me/${number}`);
  };

  const handleOpenMaps = () => {
    if (!profile?.latitude || !profile?.longitude) return;
    Linking.openURL(`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
      ]
    );
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Temukan layanan dari ${businessName ?? 'kami'} di JogjaHub! 🎉`,
        title: businessName ?? 'JogjaHub Vendor',
      });
    } catch {}
  };

  // ── Status config ─────────────────────────────────────────────────────────────
  const getStatusConfig = () => {
    if (!profile) return null;
    switch (profile.status) {
      case 'approved':
        return {
          Icon: CheckCircle2, iconColor: colors.accentGreen,
          title: 'Profil Disetujui', badgeText: 'APPROVED', badgeColor: colors.accentGreen,
          description: 'Profil bisnis Anda telah disetujui. Pelanggan dapat menemukan dan memesan layanan Anda.',
          bgColor: colors.accentGreenContainer, borderColor: colors.accentGreenContainer,
          iconBgColor: colors.accentGreenContainer, textColor: colors.accentGreen, descColor: colors.accentGreen,
        };
      case 'rejected':
        return {
          Icon: Clock, iconColor: colors.error,
          title: 'Profil Ditolak', badgeText: 'REJECTED', badgeColor: colors.error,
          description: 'Profil bisnis Anda tidak memenuhi persyaratan. Silakan perbaiki dan ajukan kembali.',
          bgColor: colors.errorContainer, borderColor: colors.errorContainer,
          iconBgColor: colors.errorContainer, textColor: colors.error, descColor: colors.error,
        };
      default:
        return {
          Icon: Clock, iconColor: colors.primary,
          title: 'Profil Sedang Ditinjau', badgeText: 'PENDING', badgeColor: colors.primary,
          description: 'Admin sedang memeriksa informasi bisnis Anda. Proses verifikasi biasanya 1×24 jam kerja.',
          bgColor: colors.surfaceContainerLow, borderColor: colors.outline,
          iconBgColor: colors.primaryContainer, textColor: colors.onSurface, descColor: colors.onSurfaceVariant,
        };
    }
  };

  const statusConfig = getStatusConfig();

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const addr        = profile?.address;
  const fullAddress = [addr?.street, addr?.city, addr?.province].filter(Boolean).join(', ');
  const addressSub  = addr?.postal_code
    ? `${addr.city}, ${addr.province} ${addr.postal_code}`
    : `${addr?.city ?? ''}, ${addr?.province ?? ''}`;
  const city        = addr?.city ?? 'Yogyakarta';

  const categoryNames = profile?.categories?.map((c) => c.name) ?? [];
  const formatRupiah  = (n: number) => `Rp${Number(n).toLocaleString('id-ID')}`;

  const initials = (businessName ?? 'V')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Header Banner ── */}
      <View style={styles.headerBanner}>
        {/* Dekorasi lingkaran */}
        <View style={styles.bannerDecorA} />
        <View style={styles.bannerDecorB} />
        <View style={styles.bannerDecorC} />

        {/* Baris atas: label + share */}
        <View style={styles.bannerTopRow}>
          <View>
            <Text style={styles.bannerLabel}>JogjaHub Vendor</Text>
            <Text style={styles.bannerTitle}>Profil Bisnis</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareProfile}>
            <Share2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Divider tipis */}
        <View style={styles.bannerDivider} />

        {/* Avatar + info bisnis */}
        <View style={styles.avatarRow}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleEditProfile}>
              <Camera size={11} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.businessName} numberOfLines={1}>
              {businessName ?? 'Nama Bisnis'}
            </Text>
            {categoryNames.length > 0 && (
              <Text style={styles.businessCategory} numberOfLines={1}>
                {categoryNames.join(' • ')}
              </Text>
            )}
            <Text style={styles.businessCity}>📍 {city}</Text>

            {/* Badge status */}
            {profile?.status === 'approved' && (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={10} color="#fff" />
                <Text style={styles.verifiedText}>Terverifikasi</Text>
              </View>
            )}
            {profile?.status === 'pending' && (
              <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Clock size={10} color="#fff" />
                <Text style={styles.verifiedText}>Menunggu Verifikasi</Text>
              </View>
            )}
            {profile?.status === 'rejected' && (
              <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(220,38,38,0.7)' }]}>
                <Text style={styles.verifiedText}>Ditolak</Text>
              </View>
            )}
          </View>

          {/* Edit button */}
          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
            <Pencil size={13} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Stat cards ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ShoppingBag size={18} color={colors.primary} />
            <Text style={styles.statValue}>{services.length}</Text>
            <Text style={styles.statLabel}>Layanan</Text>
          </View>
          <View style={styles.statCardDivider} />
          <View style={styles.statCard}>
            <ClipboardList size={18} color="#2563EB" />
            <Text style={[styles.statValue, { color: '#2563EB' }]}>--</Text>
            <Text style={styles.statLabel}>Pesanan</Text>
          </View>
          <View style={styles.statCardDivider} />
          <View style={styles.statCard}>
            <Star size={18} color="#F59E0B" />
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>--</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={handleGoToListing}>
            <View style={[styles.quickIconBox, { backgroundColor: '#EFF6FF' }]}>
              <LayoutGrid size={20} color="#2563EB" />
            </View>
            <Text style={styles.quickLabel}>Layanan Saya</Text>
            <Text style={styles.quickSub}>Kelola listing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={handleGoToOrders}>
            <View style={[styles.quickIconBox, { backgroundColor: '#FEF3C7' }]}>
              <ClipboardList size={20} color="#D97706" />
            </View>
            <Text style={styles.quickLabel}>Pesanan</Text>
            <Text style={styles.quickSub}>Kelola booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={handleShareProfile}>
            <View style={[styles.quickIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Share2 size={20} color="#16A34A" />
            </View>
            <Text style={styles.quickLabel}>Bagikan</Text>
            <Text style={styles.quickSub}>Share profil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Status verifikasi ── */}
        {statusConfig && (
          <View style={[styles.statusCard, {
            backgroundColor: statusConfig.bgColor,
            borderColor: statusConfig.borderColor,
          }]}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusTitleGroup}>
                <View style={[styles.statusIconBox, { backgroundColor: statusConfig.iconBgColor }]}>
                  <statusConfig.Icon size={16} color={statusConfig.iconColor} />
                </View>
                <Text style={[styles.statusTitle, { color: statusConfig.textColor }]}>
                  {statusConfig.title}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.badgeColor }]}>
                <Text style={styles.statusBadgeText}>{statusConfig.badgeText}</Text>
              </View>
            </View>
            <Text style={[styles.statusDesc, { color: statusConfig.descColor }]}>
              {statusConfig.description}
            </Text>
            <TouchableOpacity style={styles.statusAction} onPress={handleEditProfile}>
              <Text style={styles.statusActionText}>Lihat Detail Peninjauan</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tentang Bisnis ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tentang Bisnis</Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={styles.actionLink}>Ubah</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              {profile?.description ||
                'Belum ada deskripsi bisnis. Lengkapi profil Anda untuk memberikan informasi lebih lanjut kepada pelanggan.'}
            </Text>
            <TouchableOpacity style={styles.readMoreBtn} onPress={handleEditProfile}>
              <Text style={styles.readMoreText}>Edit deskripsi</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Layanan ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionTitle}>Layanan Tersedia</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{services.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.seeAllBtn} onPress={handleServicePress}>
              <Text style={styles.actionLink}>Lihat semua</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {servicesLoading ? (
            <View style={styles.serviceLoadingCard}>
              <Text style={{ color: colors.secondary, fontSize: 13 }}>Memuat layanan...</Text>
            </View>
          ) : services.length === 0 ? (
            <TouchableOpacity style={styles.addServiceCard} onPress={handleGoToListing}>
              <Plus size={24} color={colors.primary} />
              <Text style={styles.addServiceText}>Tambah Layanan Pertama</Text>
              <Text style={styles.addServiceSub}>Tampilkan jasa Anda kepada pelanggan</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {services.slice(0, 4).map((service) => {
                const photo    = service.photos?.[0];
                const imageUri = photo?.url
                  ? `http://192.168.100.30:8000/storage/${photo.url}`
                  : 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400';
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    activeOpacity={0.8}
                    onPress={handleServicePress}
                  >
                    <Image source={{ uri: imageUri }} style={styles.serviceImage} />
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceTitle} numberOfLines={1}>{service.name}</Text>
                      <Text style={styles.serviceDesc} numberOfLines={2}>
                        {service.description || 'Tidak ada deskripsi.'}
                      </Text>
                      <Text style={styles.servicePrice}>{formatRupiah(service.price)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.addMoreCard} onPress={handleGoToListing}>
                <Plus size={22} color={colors.primary} />
                <Text style={styles.addMoreText}>Tambah{'\n'}Layanan</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ── Kategori ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategori</Text>
            <Text style={styles.subtext}>{profile?.categories?.length ?? 0} Terpilih</Text>
          </View>
          <View style={styles.card}>
            {profile?.categories && profile.categories.length > 0 ? (
              <View style={styles.chipRow}>
                {profile.categories.map((cat, idx) => (
                  <View key={cat.id} style={styles.categoryChip}>
                    <View style={[styles.dot, {
                      backgroundColor:
                        idx === 0 ? colors.primary :
                        idx === 1 ? colors.tertiary :
                        colors.secondary,
                    }]} />
                    <Text style={styles.categoryChipText}>{cat.name}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.addChipBtn} onPress={handleEditProfile}>
                  <Plus size={14} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.emptyChipRow} onPress={handleEditProfile}>
                <Plus size={16} color={colors.primary} />
                <Text style={styles.emptyChipText}>Tambah kategori bisnis</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Kontak ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kontak Bisnis</Text>
            {profile?.whatsapp_number && (
              <View style={styles.connectedStatus}>
                <View style={[styles.dot, { backgroundColor: colors.accentGreen }]} />
                <Text style={styles.connectedText}>Terhubung</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.card, styles.contactCard]} onPress={handleWhatsApp}>
            <View style={styles.contactIconBox}>
              <MessageSquare size={20} color={colors.accentGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>WhatsApp Resmi</Text>
              <Text style={styles.contactNumber}>
                {profile?.whatsapp_number ?? 'Belum diisi'}
              </Text>
            </View>
            <View style={styles.contactAction}>
              <Text style={styles.contactActionText}>Hubungi</Text>
              <ChevronRight size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Lokasi ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lokasi Bisnis</Text>
            <TouchableOpacity style={styles.externalLinkBtn} onPress={handleOpenMaps}>
              <Text style={styles.actionLink}>Buka Maps</Text>
              <ExternalLink size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.mapContainer}>
              <View style={styles.mapBackground}>
                <View style={styles.mapRoadHorizontal} />
                <View style={styles.mapRoadVertical} />
                <View style={styles.mapPinContainer}>
                  <View style={styles.mapPinCallout}>
                    <Text style={styles.mapPinCalloutText}>
                      {profile?.business_name ?? 'Lokasi Bisnis'}
                    </Text>
                  </View>
                  <View style={styles.mapPinIcon}>
                    <MapPin size={18} color="#fff" />
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.mapOpenBtn} onPress={handleOpenMaps}>
                <ExternalLink size={13} color={colors.primary} />
                <Text style={styles.mapOpenBtnText}>Buka Google Maps</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.addressIconBox}>
                <MapPin size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitle}>
                  {fullAddress || 'Jl. Malioboro No. 123, Umbulharjo'}
                </Text>
                <Text style={styles.addressSub}>
                  {addressSub || 'Kota Yogyakarta, DI Yogyakarta 55161'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: colors.primary,   // oranye solid — bukan primaryContainer
    paddingTop: 52,
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerDecorA: {
    position: 'absolute', top: -50, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#fff', opacity: 0.08,
  },
  bannerDecorB: {
    position: 'absolute', bottom: -40, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#fff', opacity: 0.06,
  },
  bannerDecorC: {
    position: 'absolute', top: 10, left: 60,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff', opacity: 0.05,
  },

  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bannerLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bannerTitle: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },

  // Avatar row
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 22, fontWeight: '800',
    color: colors.primary,
  },
  cameraBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.outlineVariant,
  },

  // Teks info bisnis — semua putih
  businessName: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: 16, fontWeight: '700',
    color: '#fff',                   // ← putih
  },
  businessCategory: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)', // ← putih transparan
  },
  businessCity: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },

  // Badge status di dalam header
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,163,74,0.75)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: 2,
  },
  verifiedText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10, fontWeight: '700',
    color: '#fff',
  },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  editBtnText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, fontWeight: '700',
    color: colors.primary,
  },

  // ── Scroll content ──────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 16,
    gap: 16,
    paddingBottom: 16,
  },

  // ── Stat cards ──────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingVertical: 16, paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
    elevation: 2,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statCardDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
  statValue: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: 20, fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 11, color: colors.secondary,
  },

  // ── Quick actions ───────────────────────────────────────────────────────────
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: radius.lg, padding: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3,
    elevation: 1,
  },
  quickIconBox: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, fontWeight: '700', color: colors.onSurface,
  },
  quickSub: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 10, color: colors.secondary, textAlign: 'center',
  },

  // ── Status card ─────────────────────────────────────────────────────────────
  statusCard: { borderRadius: radius.lg, padding: 14, borderWidth: 1 },
  statusCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statusTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusIconBox: {
    width: 28, height: 28, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  statusTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm,
  },
  statusBadgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10, fontWeight: '700', color: '#fff',
  },
  statusDesc: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13, marginTop: 8, lineHeight: 19,
  },
  statusAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
  },
  statusActionText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '600', color: colors.primary,
  },

  // ── Generic section / card ──────────────────────────────────────────────────
  section: { gap: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: '700', color: colors.onSurface,
  },
  actionLink: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '600', color: colors.primary,
  },
  subtext: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, color: colors.secondary,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countBadge: {
    minWidth: 22, height: 22, paddingHorizontal: 6,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  countBadgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11, fontWeight: '700', color: '#fff',
  },
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3,
    elevation: 1,
  },

  // About
  aboutText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13, color: colors.secondary, lineHeight: 20,
  },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  readMoreText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '600', color: colors.primary,
  },

  // Services horizontal scroll
  horizontalScroll: {
    marginHorizontal: -spacing.containerMargin,
    paddingLeft: spacing.containerMargin,
  },
  serviceCard: {
    width: 160, backgroundColor: '#fff', borderRadius: radius.lg,
    marginRight: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  serviceImage: { width: '100%', height: 95 },
  serviceContent: { padding: 10 },
  serviceTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 13, fontWeight: '700', color: colors.onSurface,
  },
  serviceDesc: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 11, color: colors.secondary, marginTop: 3, lineHeight: 16,
  },
  servicePrice: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 6,
  },
  addMoreCard: {
    width: 90, minHeight: 140,
    backgroundColor: '#F8FAFC', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.outline, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    gap: 6, marginRight: 16,
  },
  addMoreText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11, fontWeight: '600', color: colors.primary, textAlign: 'center',
  },
  serviceLoadingCard: {
    height: 120, backgroundColor: '#fff', borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  addServiceCard: {
    height: 120, backgroundColor: '#fff', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.outline, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addServiceText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '700', color: colors.primary,
  },
  addServiceSub: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12, color: colors.secondary,
  },

  // Category chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  categoryChipText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, fontWeight: '600', color: colors.onSurface,
  },
  addChipBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: colors.outlineVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyChipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  emptyChipText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '600', color: colors.primary,
  },

  // Contact
  connectedStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  connectedText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12, color: colors.accentGreen, fontWeight: '600',
  },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactIconBox: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.accentGreenContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11, color: colors.secondary,
  },
  contactNumber: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14, fontWeight: '700', color: colors.onSurface, marginTop: 2,
  },
  contactAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  contactActionText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13, fontWeight: '600', color: colors.primary,
  },

  // Location
  externalLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapContainer: {
    height: 130, backgroundColor: '#CBD5E1',
    position: 'relative', justifyContent: 'center', alignItems: 'center',
  },
  mapBackground: {
  ...StyleSheet.absoluteFill,
  backgroundColor: '#CBD5E1',
  justifyContent: 'center',
  alignItems: 'center',
},
  mapRoadHorizontal: {
    position: 'absolute', height: 12, width: '100%', backgroundColor: '#fff',
  },
  mapRoadVertical: {
    position: 'absolute', width: 12, height: '100%', backgroundColor: '#fff',
  },
  mapPinContainer: { alignItems: 'center' },
  mapPinCallout: {
    backgroundColor: colors.onSurface,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.sm, marginBottom: 4,
  },
  mapPinCalloutText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11, color: '#fff', fontWeight: '600',
  },
  mapPinIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  mapOpenBtn: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  mapOpenBtnText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11, fontWeight: '600', color: colors.primary,
  },
  addressContainer: {
    flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start',
  },
  addressIconBox: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  addressTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 13, fontWeight: '600', color: colors.onSurface, lineHeight: 18,
  },
  addressSub: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12, color: colors.secondary, marginTop: 3,
  },

  // ── Logout ──────────────────────────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.error,  // solid merah, bukan outline
  },
  logoutText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 14, fontWeight: '700',
    color: '#fff',                   // teks putih
  },
});