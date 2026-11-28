import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ImageBackground, Linking, Modal, Pressable, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { colors, typography } from '../../../../constants/theme';
import type { CustomerStackParamList, CustomerTabParamList } from '../../../../navigation/types';
import type { RootState } from '../../../../store';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';
import { useCatalog, type CatalogCard, type CatalogCoordinates, type CatalogSort } from '../../catalog/useCatalog';
import CustomerPhoto from '../../catalog/components/CustomerPhoto';
import CategoryGrid from '../components/CategoryGrid';

const mapImage = require('../../../../assets/images/yogyakarta-map.png');
const filters: { label: string; sort?: CatalogSort }[] = [
  { label: 'Semua' },
  { label: 'Dekat Sini', sort: 'nearby' },
  { label: 'Paling Banyak Dipesan', sort: 'popular' },
  { label: 'Rating 4.8+', sort: 'rating' },
];
type Props = BottomTabScreenProps<CustomerTabParamList, 'Home'>;
type Icon = keyof typeof Ionicons.glyphMap;
type MapVendor = { uuid: string; business_name: string; latitude: number | string; longitude: number | string };

export default function HomeScreen({ navigation }: Props) {
  const stack = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { width, fontScale } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CatalogSort>();
  const [coordinates, setCoordinates] = useState<CatalogCoordinates>();
  const [locating, setLocating] = useState(false);
  const { cards, loading, error, retry } = useCatalog(undefined, '', false, sort, sort === 'nearby' ? coordinates : undefined);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<MapVendor[]>();
  const [mapVisible, setMapVisible] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [cart, setCart] = useState<CatalogCard[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const cartKey = 'customer-service-cart:' + user?.id;
  const gridWidth = Math.min(width, 640) - 32;
  const cardWidth = width >= 350 && fontScale <= 1.3 ? (gridWidth - 10) / 2 : gridWidth;

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

  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    setCartReady(false);
    AsyncStorage.getItem(cartKey).then(value => {
      if (!active) return;
      const parsed = value ? JSON.parse(value) : [];
      setCart(Array.isArray(parsed) ? parsed : []);
      setCartReady(true);
    }).catch(() => {
      if (active) Alert.alert('Keranjang gagal dimuat', 'Buka kembali Beranda untuk mencoba lagi.');
    });
    return () => { active = false; };
  }, [cartKey, user?.id]);

  async function toggleCart(service: CatalogCard) {
    if (!cartReady || cartBusy) return;
    const next = cart.some(item => item.id === service.id)
      ? cart.filter(item => item.id !== service.id) : [...cart, service];
    setCartBusy(true);
    try {
      await AsyncStorage.setItem(cartKey, JSON.stringify(next));
      setCart(next);
    } catch {
      Alert.alert('Keranjang gagal diperbarui', 'Coba lagi.');
    } finally {
      setCartBusy(false);
    }
  }

  function explore(search = '', keepFilter = false) {
    navigation.navigate('Explore', {
      query: search, categoryId: undefined, requestId: Date.now(), servicesOnly: keepFilter,
      sort: keepFilter ? sort : undefined,
      coordinates: keepFilter && sort === 'nearby' ? coordinates : undefined,
    });
  }

  async function selectFilter(next?: CatalogSort) {
    if (locating) return;
    if (next !== 'nearby' || coordinates) {
      setSort(next);
      return;
    }
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin lokasi diperlukan', 'Izinkan akses lokasi perangkat untuk mengurutkan layanan terdekat.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setSort('nearby');
    } catch {
      Alert.alert('Lokasi belum tersedia', 'Aktifkan lokasi perangkat dan coba lagi.');
    } finally {
      setLocating(false);
    }
  }

  async function openMap() {
    setMapVisible(true);
    if (locations || loadingLocations) return;
    setLocationsError(false);
    setLoadingLocations(true);
    try {
      const { data } = await vendorApi.listTenantsOnMap();
      setLocations(data.data);
    } catch {
      setLocationsError(true);
    } finally {
      setLoadingLocations(false);
    }
  }

  function openService(service: CatalogCard) {
    setCartVisible(false);
    stack?.navigate('ServiceDetail', { serviceId: service.id });
  }

  function mapDirections(vendor: MapVendor) {
    const point = encodeURIComponent(vendor.latitude + ',' + vendor.longitude);
    Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + point)
      .catch(() => Alert.alert('Petunjuk arah gagal dibuka'));
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Lokasi vendor di Yogyakarta" onPress={openMap} style={styles.locationButton}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text numberOfLines={1} style={styles.accent}>Yogyakarta (DIY)</Text>
          <Ionicons name="chevron-down" size={13} color={colors.primary} />
        </Pressable>
        <View style={styles.headerActions}>
          <IconButton icon="chatbubble-outline" label="Pesan" onPress={() => navigation.navigate('Messages')} />
          <IconButton icon="notifications-outline" label="Notifikasi" onPress={() => stack?.navigate('Notifications')} />
          <IconButton icon="cart-outline" label={cart.length ? 'Keranjang, ' + cart.length + ' layanan' : 'Keranjang'}
            count={cart.length} onPress={() => setCartVisible(true)} />
          <IconButton icon="person-circle" label="Profil" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          retry();
          setCategoryAttempt(value => value + 1);
        }} tintColor={colors.primary} />}>
        <View style={styles.searchSection}>
          <Text accessibilityRole="header" style={styles.heading}>Halo, {user?.name?.trim().split(/\s+/)[0] || 'Sobat JogjaHub'}!</Text>
          <Text style={styles.subtle}>Mau cari layanan apa di Jogja hari ini?</Text>
          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Ionicons name="search-outline" size={19} color={colors.primary} />
              <TextInput value={query} onChangeText={setQuery} maxLength={120} accessibilityLabel="Cari toko atau layanan"
                placeholder="Cari toko atau layanan" placeholderTextColor="#64748B" style={styles.input}
                returnKeyType="search" onSubmitEditing={() => explore(query.trim())} />
            </View>
            <Pressable style={styles.filterButton} accessibilityRole="button" accessibilityLabel="Buka pencarian dan filter"
              onPress={() => explore(query.trim())}>
              <Ionicons name="options-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.promo} accessibilityRole="button" onPress={() => explore('wisuda')}>
          <View style={styles.promoIcon}><Ionicons name="school-outline" size={24} color="#FFFFFF" /></View>
          <View style={styles.grow}>
            <Text style={styles.promoTitle}>Bentar lagi wisuda?</Text>
            <Text style={styles.promoText}>Temukan vendor untuk hari spesialmu</Text>
          </View>
          <View style={styles.promoAction}><Text style={styles.accent}>Lihat Vendor</Text><Ionicons name="arrow-forward" size={14} color={colors.primary} /></View>
        </Pressable>

        <View>
          <Text accessibilityRole="header" style={[styles.sectionTitle, styles.sectionInset]}>Layanan JogjaHub</Text>
          <CategoryGrid categories={categories} onSelectCategory={(categoryId, title) => stack?.navigate('Catalog', { categoryId, title })} />
          {categoryError && <Text accessibilityRole="button" style={[styles.accent, styles.sectionInset]}
            onPress={() => setCategoryAttempt(value => value + 1)}>Kategori gagal dimuat. Coba lagi.</Text>}
        </View>

        <Pressable style={styles.map} accessibilityRole="button" onPress={openMap}>
          <ImageBackground source={mapImage} style={styles.mapImage}>
            <View style={styles.mapLabel}>
              <View style={styles.grow}>
                <Text style={styles.sectionTitle}>Peta Vendor Terdekat</Text>
                <Text style={styles.subtle}>Temukan UMKM lokal di Yogyakarta</Text>
              </View>
              <View style={styles.mapAction}><Text style={styles.whiteLabel}>Buka Peta</Text></View>
            </View>
          </ImageBackground>
        </Pressable>

        <View style={styles.services}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {filters.map(filter => <Pressable key={filter.label} accessibilityRole="button"
              accessibilityState={{ selected: filter.sort === sort, disabled: locating }}
              disabled={locating} onPress={() => void selectFilter(filter.sort)}
              style={[styles.chip, filter.sort === sort && styles.chipSelected]}>
              <Text style={filter.sort === sort ? styles.whiteLabel : styles.accent}>
                {locating && filter.sort === 'nearby' ? 'Mencari lokasi…' : filter.label}
              </Text>
            </Pressable>)}
          </ScrollView>
          <View style={styles.sectionHeader}>
            <View style={styles.grow}>
              <Text accessibilityRole="header" style={styles.heading}>{sort === 'popular' ? 'Layanan Populer Terverifikasi' : 'Layanan Terverifikasi'}</Text>
              <Text style={styles.subtle}>Pilihan layanan dari vendor terverifikasi</Text>
            </View>
            <Pressable accessibilityRole="button" style={styles.link} onPress={() => explore('', true)}>
              <Text style={styles.accent}>Lihat semua</Text>
            </Pressable>
          </View>
          {loading && <ActivityIndicator accessibilityLabel="Memuat layanan" color={colors.primary} />}
          {error && <Text accessibilityRole="button" style={styles.accent} onPress={retry}>Layanan gagal dimuat. Coba lagi.</Text>}
          {!loading && !error && cards.length === 0 && <Text style={styles.subtle}>Belum ada layanan untuk filter ini.</Text>}
          <View style={styles.grid}>
            {cards.slice(0, 8).map(card => {
              const saved = cart.some(item => item.id === card.id);
              return <View key={card.id} style={[styles.card, { width: cardWidth }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={'Detail ' + card.serviceName} onPress={() => openService(card)}>
                  <CustomerPhoto urls={card.imageUrls} style={styles.photo} />
                </Pressable>
                <View style={styles.cardBody}>
                  <Text style={styles.subtleSmall} numberOfLines={1}>{card.category}</Text>
                  <Text style={styles.serviceName} numberOfLines={2}>{card.serviceName}</Text>
                  <Text style={styles.subtleSmall} numberOfLines={1}>{card.name}{card.location ? ' · ' + card.location : ''}</Text>
                  {card.rating !== undefined && <Text style={styles.accent}>★ {card.rating.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</Text>}
                  <Text style={styles.price}>Rp{card.priceFrom.toLocaleString('id-ID')}{card.perNight ? ' / malam' : ''}</Text>
                  <View style={styles.cardActions}>
                    <Pressable style={styles.detailButton} accessibilityRole="button" onPress={() => openService(card)}>
                      <Text style={styles.whiteLabel}>Lihat Detail</Text>
                    </Pressable>
                    <Pressable style={styles.saveButton} accessibilityRole="button" disabled={!cartReady || cartBusy}
                      accessibilityLabel={(saved ? 'Hapus dari keranjang: ' : 'Tambah ke keranjang: ') + card.serviceName}
                      accessibilityState={{ selected: saved }} onPress={() => void toggleCart(card)}>
                      <Ionicons name={saved ? 'checkmark' : 'cart-outline'} size={19} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              </View>;
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.heading}>Lokasi Vendor</Text>
            <IconButton icon="close" label="Tutup peta" onPress={() => setMapVisible(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.locations}>
            <ImageBackground source={mapImage} style={styles.mapImage} imageStyle={styles.mapPreview} />
            {loadingLocations && <ActivityIndicator accessibilityLabel="Memuat lokasi vendor" color={colors.primary} />}
            {locationsError && <Text accessibilityRole="button" style={styles.accent} onPress={openMap}>Lokasi vendor gagal dimuat. Coba lagi.</Text>}
            {locations?.length === 0 && <Text style={styles.subtle}>Belum ada lokasi vendor.</Text>}
            {locations?.map(vendor => <View key={vendor.uuid} style={styles.locationRow}>
              <Pressable style={styles.grow} accessibilityRole="button" onPress={() => {
                setMapVisible(false);
                stack?.navigate('VendorDetail', { tenantUuid: vendor.uuid, businessName: vendor.business_name });
              }}>
                <Text style={styles.sectionTitle}>{vendor.business_name}</Text>
              </Pressable>
              <IconButton icon="navigate-outline" label={'Petunjuk arah ke ' + vendor.business_name} onPress={() => mapDirections(vendor)} />
            </View>)}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={cartVisible} animationType="slide" onRequestClose={() => setCartVisible(false)}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.heading}>Keranjang Layanan</Text>
            <IconButton icon="close" label="Tutup keranjang" onPress={() => setCartVisible(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.locations}>
            {!cart.length && <Text style={styles.subtle}>Keranjang masih kosong. Tambahkan layanan dari Beranda.</Text>}
            {cart.map(card => <View key={card.id} style={styles.locationRow}>
              <Pressable style={styles.grow} accessibilityRole="button" onPress={() => openService(card)}>
                <Text style={styles.sectionTitle}>{card.serviceName}</Text>
                <Text style={styles.subtle}>{card.name} · Buka detail untuk memesan</Text>
              </Pressable>
              <IconButton icon="trash-outline" label={'Hapus ' + card.serviceName} onPress={() => void toggleCart(card)} />
            </View>)}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function IconButton({ icon, label, count, onPress }: { icon: Icon; label: string; count?: number; onPress: () => void }) {
  return <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
    <Ionicons name={icon} size={22} color={icon === 'person-circle' ? colors.primary : colors.onSurface} />
    {!!count && <Text style={styles.badge}>{count > 99 ? '99+' : count}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 12, gap: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 2, right: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.primary, color: '#FFF', paddingHorizontal: 4, fontSize: 10, fontWeight: '700' },
  locationButton: { flexShrink: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, backgroundColor: '#FFF0E7', borderRadius: 24 },
  content: { alignSelf: 'center', width: '100%', maxWidth: 640, gap: 16, paddingVertical: 12, paddingBottom: 108 },
  grow: { flex: 1 },
  searchSection: { paddingHorizontal: 16, gap: 5 },
  heading: { ...typography.headlineSm, color: colors.onSurface },
  subtle: { fontSize: 13, color: '#554842', lineHeight: 19 },
  subtleSmall: { fontSize: 11, color: '#554842' },
  accent: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 5 },
  search: { flex: 1, minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9DCD5' },
  input: { flex: 1, color: colors.onSurface, fontSize: 14, paddingVertical: 8 },
  filterButton: { width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#EFF4FF' },
  promo: { marginHorizontal: 16, borderRadius: 14, backgroundColor: colors.primary, minHeight: 79, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  promoIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center' },
  promoTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  promoText: { color: '#FFF0E7', fontSize: 11, lineHeight: 15 },
  promoAction: { paddingHorizontal: 7, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionTitle: { color: colors.onSurface, fontSize: 14, fontWeight: '800' },
  sectionInset: { marginHorizontal: 20 },
  map: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#EFF4FF' },
  mapImage: { minHeight: 138, justifyContent: 'flex-end', padding: 8 },
  mapPreview: { borderRadius: 12 },
  mapLabel: { backgroundColor: '#FFFFFFF5', padding: 9, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapAction: { backgroundColor: '#C2410C', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 8 },
  whiteLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  locations: { paddingHorizontal: 16, gap: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingLeft: 12, minHeight: 52 },
  services: { paddingHorizontal: 16, gap: 11 },
  chips: { gap: 7, alignItems: 'center' },
  chip: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 24, backgroundColor: '#EFF4FF' },
  chipSelected: { backgroundColor: '#C2410C' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { minHeight: 44, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 10 },
  card: { overflow: 'hidden', borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF5' },
  photo: { width: '100%', height: 105 },
  cardBody: { flex: 1, padding: 8, gap: 4 },
  serviceName: { color: colors.onSurface, fontSize: 13, fontWeight: '800' },
  price: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 'auto' },
  cardActions: { flexDirection: 'row', gap: 4, marginTop: 3 },
  detailButton: { backgroundColor: colors.primary, flex: 1, minHeight: 44, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 3 },
  saveButton: { width: 42, height: 44, borderRadius: 9, backgroundColor: '#FFF0E7', alignItems: 'center', justifyContent: 'center' },
});
