import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../../navigation/types';

import PromoBanner from '../components/PromoBanner';
import CategoryGrid from '../components/CategoryGrid';
import VendorCard from '../components/VendorCard';
import { useCatalog } from '../../catalog/useCatalog';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';

// Asset gambar peta Yogyakarta lokal
const jogjaMapImage = require('../../../../assets/images/yogyakarta-map.png');

type MapVendor = { uuid: string; business_name: string; latitude: number | string; longitude: number | string };

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const { cards: vendors, loading, error, retry } = useCatalog();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [categoryAttempt, setCategoryAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCategoryError(false);
    categoryApi.getCategories().then(({ data }) => {
      if (active) setCategories(data.data);
    }).catch(() => {
      if (active) setCategoryError(true);
    });
    return () => { active = false; };
  }, [categoryAttempt]);

  const [locations, setLocations] = useState<MapVendor[]>();
  const [loadingLocations, setLoadingLocations] = useState(false);
  const loadLocations = async () => {
    if (loadingLocations) return;
    if (locations) {
      setLocations(undefined);
      return;
    }
    setLoadingLocations(true);
    try {
      const { data } = await vendorApi.listTenantsOnMap();
      setLocations(data.data);
    } catch {
      Alert.alert('Lokasi vendor gagal dimuat', 'Coba lagi nanti.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const openLocation = (vendor: MapVendor) => {
    const coordinates = encodeURIComponent(vendor.latitude + ',' + vendor.longitude);
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + coordinates)
      .catch(() => Alert.alert('Peta gagal dibuka'));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandInitials}>JH</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.headerTitle}>JogjaHub</Text>
            <Text style={styles.headerLocation}>Yogyakarta</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notification}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel="Aktivitas pesanan"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.navy} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari vendor di Jogja"
              accessibilityLabel="Cari vendor di Jogja"
              placeholderTextColor={colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => navigation.navigate('Catalog', { query: searchQuery.trim() })}
            />
          </View>
        </View>

        {/* Promo Banner */}
        <PromoBanner
          title="Wisuda Besok?"
          subtitle="Tenang, temukan vendor yang masih tersedia untuk hari spesialmu."
        />

        <CategoryGrid categories={categories} onSelectCategory={(categoryId, title) => navigation.navigate('Catalog', { categoryId, title })} />
        {categoryError && <Text style={styles.sectionHeader} onPress={() => setCategoryAttempt(value => value + 1)}>Kategori gagal dimuat. Coba lagi.</Text>}

        {/* Rekomendasi Terverifikasi */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rekomendasi Terverifikasi</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vendorList}
        >
          {error && <Text onPress={retry}>Layanan gagal dimuat. Coba lagi.</Text>}
          {loading && <Text>Memuat layanan...</Text>}
          {!loading && !error && !vendors.length && <Text>Belum ada layanan tersedia.</Text>}
          {vendors.slice(0, 8).map((vendor) => (
           <VendorCard
            key={vendor.id}
            vendor={vendor}
            onPressCard={() => {
              navigation.navigate('VendorDetail', {
                tenantUuid: vendor.uuid,
                businessName: vendor.name,
                imageUrl: vendor.imageUrl,
              });
            }}
            onPressBook={() => {
              navigation.navigate('Booking', {
                serviceId: vendor.id,
              });
            }}
          />
          ))}
        </ScrollView>

        {/* Lokasi Vendor */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendor di Sekitarmu</Text>
        </View>

        {/* Kartu Peta Interaktif dengan Gambar Peta Yogyakarta */}
        <TouchableOpacity
          style={styles.mapCard}
          activeOpacity={0.9}
          accessibilityRole="button"
          disabled={loadingLocations}
          onPress={loadLocations}
        >
          <ImageBackground
            source={jogjaMapImage}
            style={styles.mapBackground}
            imageStyle={styles.mapBackgroundImage}
          >
            {/* Overlay halus agar pin marker & teks lebih kontras */}
            <View style={styles.mapOverlay} />

            {/* Tag Lokasi */}
            <View style={styles.mapLocationTag}>
              <Ionicons name="location" size={13} color="#2563EB" />
              <Text style={styles.mapLocationText}>Yogyakarta & Sekitarnya</Text>
            </View>

            {/* Tombol Buka Peta */}
            <View style={styles.mapButton}>
              <Ionicons name="map" size={14} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>{loadingLocations ? 'Memuat...' : locations ? 'Tutup daftar' : 'Lihat lokasi'}</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
        {locations && <View style={styles.locations}>
          {locations.length === 0 && <Text>Belum ada lokasi vendor.</Text>}
          {locations.map(vendor => (
            <TouchableOpacity key={vendor.uuid} style={styles.locationLink} accessibilityRole="button" onPress={() => openLocation(vendor)}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.locationName}>{vendor.business_name}</Text>
            </TouchableOpacity>
          ))}
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: customerColors.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, gap: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  brandCopy: { flexShrink: 1 },
  brandMark: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  brandInitials: { ...typography.headlineSm, color: colors.onNavy },
  headerTitle: { ...typography.headlineLgMobile, color: colors.navy },
  headerLocation: { ...typography.bodySm, color: colors.onSurfaceVariant },
  notification: {
    width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: customerColors.border,
  },
  scrollContent: { paddingBottom: 16 },
  searchWrapper: { paddingHorizontal: 20, marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg,
    paddingHorizontal: 14, minHeight: 48, borderWidth: 1, borderColor: customerColors.border,
  },
  searchInput: { ...typography.bodyMd, flex: 1, paddingVertical: 10, color: colors.onSurface },
  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { ...typography.titleMd, color: colors.navy },
  vendorList: {
    paddingLeft: 20,
    paddingRight: 6,
  },
  mapCard: {
    marginHorizontal: 20,
    height: 192,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.secondaryContainer,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapBackgroundImage: {
    borderRadius: radius.xl,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  mapLocationTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  locations: { paddingHorizontal: 20, paddingTop: 8 },
  locationLink: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  locationName: { ...typography.bodyMd, color: colors.navy },
  mapButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});