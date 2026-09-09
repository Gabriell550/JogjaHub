import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Linking, Alert } from 'react-native';
import {
  ChevronLeft, MoreVertical, CheckCircle2, Pencil, Clock,
  ChevronRight, ChevronDown, ExternalLink, MapPin, MessageSquare,
  Star, Plus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { logout, setTenantProfile } from '../../../../features/auth/store/authSlice';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { vendorApi } from '../../../../api/vendorApi';
import { categoryApi } from '../../../../api/categoryApi';
import type { RootState } from '../../../../store';
import type { TenantProfile } from '../../../../types/vendor';

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
  const insets = useSafeAreaInsets();
  const profile = useSelector((state: RootState) => state.auth.tenantProfile);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const businessName = useSelector(
    (state: RootState) => state.auth?.businessName
  );

  const fetchServices = useCallback(async () => {
    try {
      const res = await vendorApi.listMyServices();
      setServices(res.data?.data?.data ?? []);
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
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await vendorApi.getMyProfile();
      const data = res.data?.data;
      if (data) {
        dispatch(setTenantProfile(data));
      }
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

  const handleEditProfile = () => {
    navigation?.navigate('EditBusinessProfile');
  };

  const handleServicePress = (service: ServiceItem) => {
    navigation?.getParent()?.navigate('Listing');
  };

  const handleSeeAllServices = () => {
    navigation?.getParent()?.navigate('Listing');
  };

  const handleWhatsApp = () => {
    if (!profile?.whatsapp_number) return;
    const number = profile.whatsapp_number.replace(/[^0-9]/g, '');
    if (number.length >= 10) {
      Linking.openURL(`https://wa.me/${number}`);
    }
  };

  const dispatch = useDispatch();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ],
    );
  };

  const handleOpenMaps = useCallback(() => {
    if (!profile?.latitude || !profile?.longitude) return;
    const url = `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`;
    Linking.openURL(url);
  }, [profile]);

  const handleOpenGoogleMaps = useCallback(() => {
    handleOpenMaps();
  }, [handleOpenMaps]);

  const handleUbah = () => {
    handleEditProfile();
  };

  const handleReadMore = () => {
    handleEditProfile();
  };

  const getStatusConfig = (): {
    Icon: any;
    iconColor: string;
    title: string;
    badgeText: string;
    badgeColor: string;
    description: string;
    actionText: string;
    bgColor: string;
    borderColor: string;
    iconBgColor: string;
    textColor: string;
    descColor: string;
  } | null => {
    if (!profile) return null;
    switch (profile.status) {
      case 'approved':
        return {
          Icon: CheckCircle2,
          iconColor: colors.accentGreen,
          title: 'Profil Disetujui',
          badgeText: 'APPROVED',
          badgeColor: colors.accentGreen,
          description: 'Profil bisnis Anda telah disetujui. Pelanggan dapat menemukan dan memesan layanan Anda.',
          actionText: 'Lihat Detail Peninjauan',
          bgColor: colors.accentGreenContainer,
          borderColor: colors.accentGreenContainer,
          iconBgColor: colors.accentGreenContainer,
          textColor: colors.accentGreen,
          descColor: colors.accentGreen,
        };
      case 'rejected':
        return {
          Icon: Clock,
          iconColor: colors.error,
          title: 'Profil Ditolak',
          badgeText: 'REJECTED',
          badgeColor: colors.error,
          description: 'Profil bisnis Anda tidak memenuhi persyaratan. Silakan perbaiki dan ajukan kembali.',
          actionText: 'Lihat Detail Peninjauan',
          bgColor: colors.errorContainer,
          borderColor: colors.errorContainer,
          iconBgColor: colors.errorContainer,
          textColor: colors.error,
          descColor: colors.error,
        };
      default:
        return {
          Icon: Clock,
          iconColor: colors.primary,
          title: 'Profil Sedang Ditinjau',
          badgeText: 'PENDING',
          badgeColor: colors.primary,
          description: 'Admin sedang memeriksa informasi bisnis Anda. Proses verifikasi biasanya memakan waktu 1x24 jam kerja.',
          actionText: 'Lihat Detail Peninjauan',
          bgColor: colors.surfaceContainerLow,
          borderColor: colors.outline,
          iconBgColor: colors.primaryContainer,
          textColor: colors.onSurface,
          descColor: colors.onSurfaceVariant,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const address = profile?.address;
  const street = address?.street ?? '';
  const city = address?.city ?? '';
  const province = address?.province ?? '';
  const postalCode = address?.postal_code ?? '';
  const fullAddress = [street, city, province].filter(Boolean).join(', ');
  const addressSub = postalCode ? `${city}, ${province} ${postalCode}` : `${city}, ${province}`;

  const categoryIds = profile?.categories?.map((c) => c.id) ?? [];
  const categoryNames = profile?.categories?.map((c) => c.name) ?? [];
  const selectedCategoryCount = categoryIds.length;

  const displayServices = services.slice(0, 2);
  const formatRupiah = (n: number) => `Rp${Number(n).toLocaleString('id-ID')}`;

  const renderServicesCarousel = () => {
    if (servicesLoading) {
      return (
        <View style={[styles.serviceCard, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.serviceImageContainer}>
            <View style={[styles.statusChip, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
              <Text style={styles.statusChipText}>Loading...</Text>
            </View>
          </View>
          <View style={styles.serviceContent}>
            <View style={{ height: 12 }} />
            <View style={{ height: 28 }} />
            <View style={{ height: 14 }} />
          </View>
        </View>
      );
    }

    if (services.length === 0) {
      return (
        <View style={[styles.serviceCard, { backgroundColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Belum ada layanan</Text>
        </View>
      );
    }

    return displayServices.map((service) => {
      const photo = service.photos?.[0];
      const imageUri = photo?.url
        ? `http://192.168.100.30:8000/storage/${photo.url}`
        : 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400';
      const isFavorite = service.subcategory?.name === 'Wisuda';

      return (
        <TouchableOpacity
          key={service.id}
          style={styles.serviceCard}
          activeOpacity={0.8}
          onPress={() => handleServicePress(service)}
        >
          <View style={styles.serviceImageContainer}>
            <Image source={{ uri: imageUri }} style={styles.serviceImage} />
            {isFavorite ? (
              <View style={[styles.statusChip, styles.favoriteChip]}>
                <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={[styles.statusChipText, { color: '#FFFFFF' }]}>Favorit</Text>
              </View>
            ) : (
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>Tersedia</Text>
              </View>
            )}
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle} numberOfLines={1}>{service.name}</Text>
            <Text style={styles.serviceDesc} numberOfLines={2}>
              {service.description || 'Tidak ada deskripsi.'}
            </Text>
            <Text style={styles.priceLabel}>Mulai dari</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{formatRupiah(service.price)}</Text>
              <ChevronRight size={16} color={colors.onSurfaceVariant} />
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Profil Bisnis</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => {}}>
          <MoreVertical size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>💄</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Pencil size={10} color={colors.primary} />
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.businessName}>{businessName ?? 'Vendor'}</Text>
          </View>

          <Text style={styles.businessCategory}>
            {categoryNames.length > 0
              ? `${categoryNames.join(' • ')} • ${city || 'Yogyakarta'}`
              : `${city || 'Yogyakarta'}`}
          </Text>

          <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
            <Pencil size={14} color={colors.primary} />
            <Text style={styles.editProfileText}>Edit Profil</Text>
          </TouchableOpacity>
        </View>

        {statusConfig && (
          <View style={[styles.pendingCard, {
            backgroundColor: statusConfig.bgColor,
            borderColor: statusConfig.borderColor,
          }]}>
            <View style={styles.pendingHeader}>
              <View style={styles.pendingTitleGroup}>
                <View style={[styles.pendingIconBox, { backgroundColor: statusConfig.iconBgColor }]}>
                  <statusConfig.Icon size={16} color={statusConfig.iconColor} />
                </View>
                <Text style={[styles.pendingTitle, { color: statusConfig.textColor }]}>
                  {statusConfig.title}
                </Text>
              </View>
              <View style={[styles.pendingBadge, { backgroundColor: statusConfig.badgeColor }]}>
                <Text style={styles.pendingBadgeText}>{statusConfig.badgeText}</Text>
              </View>
            </View>

            <Text style={[styles.pendingDesc, { color: statusConfig.descColor }]}>
              {statusConfig.description}
            </Text>

            <TouchableOpacity style={styles.pendingAction} onPress={handleEditProfile}>
              <Text style={styles.pendingActionText}>{statusConfig.actionText}</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tentang Bisnis</Text>
            <TouchableOpacity onPress={handleUbah}>
              <Text style={styles.actionLink}>Ubah</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              {profile?.description ||
                'Belum ada deskripsi bisnis. Lengkapi profil Anda untuk memberikan informasi lebih lanjut kepada pelanggan.'}
            </Text>
            <TouchableOpacity style={styles.readMoreBtn} onPress={handleReadMore}>
              <Text style={styles.readMoreText}>Lihat selengkapnya</Text>
              <ChevronDown size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionTitle}>Layanan yang Tersedia</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{services.length} Layanan</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.seeAllBtn} onPress={handleSeeAllServices}>
              <Text style={styles.actionLink}>Lihat semua</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {renderServicesCarousel()}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategori</Text>
            <Text style={styles.subtext}>{selectedCategoryCount} Terpilih</Text>
          </View>
          <View style={styles.chipRow}>
            {profile?.categories?.map((cat, idx) => (
              <View key={cat.id} style={styles.categoryChip}>
                <View style={[styles.dot, { backgroundColor: idx === 0 ? colors.primary : idx === 1 ? colors.tertiary : colors.secondary }]} />
                <Text style={styles.categoryChipText}>{cat.name}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addChipBtn} onPress={handleEditProfile}>
              <Plus size={14} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kontak Bisnis</Text>
            <View style={styles.connectedStatus}>
              <View style={[styles.dot, { backgroundColor: colors.accentGreen }]} />
              <Text style={styles.connectedText}>Terhubung</Text>
            </View>
          </View>
          <View style={styles.contactCard}>
            <View style={styles.contactIconBox}>
              <MessageSquare size={20} color={colors.accentGreen} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>WhatsApp Resmi</Text>
              <Text style={styles.contactNumber}>{profile?.whatsapp_number ?? '0812-3456-7890'}</Text>
            </View>
            <TouchableOpacity style={styles.contactAction} onPress={handleWhatsApp}>
              <Text style={styles.contactActionText}>Hubungi</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lokasi Bisnis</Text>
            <TouchableOpacity style={styles.externalLinkBtn} onPress={handleOpenMaps}>
              <Text style={styles.actionLink}>Buka Maps</Text>
              <ExternalLink size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.mapContainer}>
              <View style={styles.mapBackground}>
                <View style={styles.mapRoadHorizontal} />
                <View style={styles.mapRoadVertical} />
                <View style={styles.mapPinContainer}>
                  <View style={styles.mapPinCallout}>
                    <Text style={styles.mapPinCalloutText}>{profile?.business_name ?? 'Nama Bisnis'}</Text>
                  </View>
                  <View style={styles.mapPinIcon}>
                    <MapPin size={18} color="#FFFFFF" />
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.mapTargetBtn} onPress={handleOpenMaps}>
                <Text style={{ fontSize: 10 }}>🎯</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addressContainer}>
              <MapPin size={16} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>{fullAddress || 'Jl. Malioboro No. 123, Umbulharjo'}</Text>
                <Text style={styles.addressSub}>
                  {addressSub || 'Kota Yogyakarta, Daerah Istimewa Yogyakarta 55161'}
                </Text>
              </View>
            </View>

            <View style={styles.addressFooter}>
              <Text style={styles.verifiedText}>Alamat terverifikasi</Text>
              <TouchableOpacity style={styles.openMapsBtn} onPress={handleOpenGoogleMaps}>
                <Text style={styles.openMapsText}>Buka Google Maps</Text>
                <ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.stackSm,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  countBadgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.onPrimary,
  },
  headerTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.stackMd,
    gap: spacing.stackMd,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.containerMargin,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.stackSm,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessName: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
  },
  businessCategory: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.stackSm,
    marginBottom: spacing.stackMd,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.stackSm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  editProfileText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.primary,
  },

  /* Pending Review Card */
  pendingCard: {
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    borderWidth: 1,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  pendingIconBox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
  },
  pendingBadge: {
    paddingHorizontal: spacing.stackSm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pendingBadgeText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.onPrimary,
  },
  pendingDesc: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    marginTop: spacing.stackSm,
    lineHeight: typography.bodyMd.lineHeight,
  },
  pendingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.stackSm,
  },
  pendingActionText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.primary,
  },

  /* Generic Section */
  section: {
    gap: spacing.stackSm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  sectionTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  actionLink: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.primary,
  },
  subtext: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurfaceVariant,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  /* About Section */
  aboutCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  aboutText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    lineHeight: typography.bodyMd.lineHeight,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.stackSm,
  },
  readMoreText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.primary,
  },

  /* Service Cards */
  horizontalScroll: {
    marginHorizontal: -spacing.containerMargin,
    paddingHorizontal: spacing.containerMargin,
  },

  serviceCard: {
    width: 170,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    marginRight: spacing.stackSm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  serviceImageContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  statusChip: {
    position: 'absolute',
    top: spacing.stackSm,
    left: spacing.stackSm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.stackSm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  favoriteChip: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusChipText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.onSurface,
  },
  serviceContent: {
    padding: spacing.stackSm,
  },
  serviceTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  serviceDesc: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.stackSm,
    height: typography.bodyMd.lineHeight,
  },
  priceLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.stackSm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.stackSm,
  },
  priceValue: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.primary,
  },

  /* Category Chips */
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.stackSm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: spacing.stackSm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryChipText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.onSurface,
  },
  addChipBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Contact Section */
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectedText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.accentGreen,
    fontWeight: typography.labelMd.fontWeight,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: spacing.stackMd,
  },
  contactIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentGreenContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurfaceVariant,
  },
  contactNumber: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  contactActionText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.primary,
    fontWeight: typography.labelMd.fontWeight,
  },

  /* Location Section */
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  mapContainer: {
    height: 120,
    backgroundColor: colors.secondaryContainer,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapRoadHorizontal: {
    position: 'absolute',
    height: 12,
    width: '100%',
    backgroundColor: colors.onPrimary,
  },
  mapRoadVertical: {
    position: 'absolute',
    width: 12,
    height: '100%',
    backgroundColor: colors.onPrimary,
  },
  mapPinContainer: {
    alignItems: 'center',
  },
  mapPinCallout: {
    backgroundColor: colors.onSurface,
    paddingHorizontal: spacing.stackSm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.stackSm,
  },
  mapPinCalloutText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onPrimary,
    fontWeight: typography.labelMd.fontWeight,
  },
  mapPinIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTargetBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.stackSm,
    borderRadius: radius.sm,
    elevation: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.onSurface,
  },
  addressSub: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: spacing.stackSm,
  },
  addressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.stackMd,
    paddingBottom: spacing.stackMd,
  },
  verifiedText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    color: colors.onSurfaceVariant,
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openMapsText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.primary,
  },
  logoutSection: {
    marginTop: spacing.stackLg,
    marginBottom: spacing.stackLg,
    paddingHorizontal: spacing.containerMargin,
  },
  logoutButton: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    fontWeight: typography.labelMd.fontWeight,
    color: colors.error,
  },
});