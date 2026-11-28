import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoryApi } from '../../../../api/categoryApi';
import { colors, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import type { CustomerStackParamList } from '../../../../navigation/types';
import CustomerPhoto from '../components/CustomerPhoto';
import { useCatalog, type CatalogCard, type CatalogSort } from '../useCatalog';

type Category = { id: number; name: string; subcategories?: { id: number; name: string }[] };
type Icon = keyof typeof Ionicons.glyphMap;
type CategoryStyle = { ink: string; surface: string; icon: Icon; description: string; searchHint: string };

const categoryStyles: Record<string, CategoryStyle> = {
  penginapan: { ink: '#24534D', surface: '#E3F2EB', icon: 'bed-outline', description: 'Temukan kamar dan tempat menginap di Jogja.', searchHint: 'Cari penginapan atau nama tempat' },
  'beauty & style': { ink: '#832A53', surface: '#FBE8F1', icon: 'sparkles-outline', description: 'Jelajahi salon dan butik untuk gaya yang kamu cari.', searchHint: 'Cari salon, butik, atau layanan' },
  gifting: { ink: '#8C420F', surface: '#FFF0DF', icon: 'gift-outline', description: 'Pilih hadiah untuk wisuda dan momen spesial.', searchHint: 'Cari buket, selempang, atau hadiah' },
  dokumentasi: { ink: '#3A4087', surface: '#ECECFF', icon: 'camera-outline', description: 'Temukan fotografer dan videografer untuk acaramu.', searchHint: 'Cari fotografer, videografer, atau paket' },
};
const defaultStyle: CategoryStyle = { ink: '#A04100', surface: '#FFF0E7', icon: 'grid-outline', description: 'Jelajahi layanan dari vendor terverifikasi di Jogja.', searchHint: 'Cari toko atau layanan' };
const sortOptions: { label: string; value?: CatalogSort }[] = [
  { label: 'Semua' }, { label: 'Terpopuler', value: 'popular' }, { label: 'Rating 4.8+', value: 'rating' },
];

export default function CatalogScreen({ hotelCatalog = false }: { hotelCatalog?: boolean } = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const route = useRoute<RouteProp<CustomerStackParamList, 'Catalog'>>();
  const { categoryId, title, query } = route.params ?? {};
  const { width, fontScale } = useWindowDimensions();
  const contentWidth = Math.min(width, 760);
  const columns = width >= 360 && fontScale <= 1.3 ? 2 : 1;
  const itemWidth = (contentWidth - 32 - (columns - 1) * 12) / columns;
  const [searchQuery, setSearchQuery] = useState(query ?? '');
  const [subcategoryId, setSubcategoryId] = useState<number>();
  const [sort, setSort] = useState<CatalogSort>();
  const [category, setCategory] = useState<Category>();
  const [categoryLoadFailed, setCategoryLoadFailed] = useState(false);
  const [categoryAttempt, setCategoryAttempt] = useState(0);

  useEffect(() => {
    if (categoryId === undefined && !hotelCatalog) return;
    let active = true;
    setCategoryLoadFailed(false);
    categoryApi.getCategories().then(({ data }) => {
      if (!active) return;
      setCategory((data.data as Category[]).find(item => categoryId !== undefined
        ? item.id === categoryId : item.name.trim().toLowerCase() === 'penginapan'));
    }).catch(() => { if (active) setCategoryLoadFailed(true); });
    return () => { active = false; };
  }, [categoryAttempt, categoryId, hotelCatalog]);

  const name = category?.name ?? title ?? (hotelCatalog ? 'Penginapan' : 'Katalog Layanan');
  const theme = categoryStyles[name.trim().toLowerCase()] ?? defaultStyle;
  const subcategories = category?.subcategories ?? [];
  const { cards, loading, error, retry, loadMore } = useCatalog(categoryId, searchQuery, hotelCatalog, sort, undefined, subcategoryId);
  const hasFilters = !!searchQuery.trim() || subcategoryId !== undefined || sort !== undefined;
  const clearFilters = () => {
    setSearchQuery('');
    setSubcategoryId(undefined);
    setSort(undefined);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.nav}>
        <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Kembali"
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('CustomerTabs', { screen: 'Home' })}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </Pressable>
        <Text style={styles.navTitle}>Jelajah Layanan</Text>
        <View style={styles.iconButton} />
      </View>

      <FlatList
        key={columns}
        data={cards}
        numColumns={columns}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { width: contentWidth }]}
        columnWrapperStyle={columns > 1 ? styles.columns : undefined}
        ListHeaderComponent={
          <View style={styles.top}>
            <View style={[styles.hero, { backgroundColor: theme.surface }]}>
              <View style={styles.heroCopy}>
                <Text accessibilityRole="header" style={[styles.heroTitle, { color: theme.ink }]}>{name}</Text>
                <Text style={[styles.heroDescription, { color: theme.ink }]}>{theme.description}</Text>
              </View>
              <View style={styles.heroIcon}><Ionicons name={theme.icon} size={32} color={theme.ink} /></View>
            </View>

            <View style={styles.search}>
              <Ionicons name="search-outline" size={20} color={theme.ink} />
              <TextInput accessibilityLabel={theme.searchHint} placeholder={theme.searchHint}
                placeholderTextColor="#64748B" style={styles.input} value={searchQuery}
                maxLength={120} returnKeyType="search" onChangeText={setSearchQuery} />
              {!!searchQuery && <Pressable style={styles.iconButton} accessibilityRole="button"
                accessibilityLabel="Hapus pencarian" onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle-outline" size={20} color={colors.onSurfaceVariant} />
              </Pressable>}
            </View>

            {subcategories.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Semua jenis" selected={subcategoryId === undefined} theme={theme} onPress={() => setSubcategoryId(undefined)} />
              {subcategories.map(item => <Chip key={item.id} label={item.name} selected={item.id === subcategoryId}
                theme={theme} onPress={() => setSubcategoryId(item.id)} />)}
            </ScrollView>}
            {categoryLoadFailed && <Pressable accessibilityRole="button" onPress={() => setCategoryAttempt(value => value + 1)}>
              <Text style={styles.action}>Jenis layanan gagal dimuat. Coba lagi.</Text>
            </Pressable>}

            <View style={styles.resultsHeading}>
              <Text accessibilityRole="header" style={styles.resultsTitle}>{searchQuery.trim() ? 'Hasil Pencarian' : 'Daftar Layanan'}</Text>
              {hasFilters && <Pressable accessibilityRole="button" onPress={clearFilters}>
                <Text style={styles.action}>Reset filter</Text>
              </Pressable>}
            </View>
            <View style={styles.chips}>
              {sortOptions.map(option => <Chip key={option.label} label={option.label} selected={sort === option.value}
                theme={theme} onPress={() => setSort(option.value)} />)}
            </View>
          </View>
        }
        ListEmptyComponent={!loading && !error ? <View style={styles.empty}>
          <Ionicons name={theme.icon} size={28} color={theme.ink} />
          <Text style={styles.resultsTitle}>{hasFilters ? 'Tidak ada hasil yang cocok' : 'Belum ada layanan tersedia'}</Text>
          {hasFilters && <Text style={styles.muted}>Coba kata kunci atau pilihan filter lain.</Text>}
        </View> : undefined}
        ListFooterComponent={
          error ? <Pressable style={styles.footerButton} accessibilityRole="button" onPress={retry}>
            <Text style={styles.action}>Layanan gagal dimuat. Coba lagi</Text>
          </Pressable> : loading ? <ActivityIndicator style={styles.loading} accessibilityLabel="Memuat layanan" color={theme.ink} />
          : loadMore ? <Pressable style={styles.footerButton} accessibilityRole="button" onPress={loadMore}>
            <Text style={styles.action}>Muat layanan lainnya</Text>
          </Pressable> : undefined
        }
        renderItem={({ item }) => (
          <CatalogTile card={item} width={itemWidth} theme={theme}
            open={() => navigation.navigate('ServiceDetail', { serviceId: item.id })} />
        )}
      />
    </SafeAreaView>
  );
}

function Chip({ label, selected, theme, onPress }: { label: string; selected: boolean; theme: CategoryStyle; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [styles.chip, selected && { backgroundColor: theme.ink, borderColor: theme.ink }, pressed && styles.pressed]}>
    <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.ink }]}>{label}</Text>
  </Pressable>;
}

function CatalogTile({ card, width, theme, open }: { card: CatalogCard; width: number; theme: CategoryStyle; open: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityHint="Buka detail layanan" onPress={open}
    style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
    <CustomerPhoto urls={card.imageUrls} style={[styles.photo, { backgroundColor: theme.surface }]} />
    <View style={styles.cardBody}>
      <View style={styles.cardMeta}>
        {!!card.category && <Text numberOfLines={1} style={[styles.category, { color: theme.ink }]}>{card.category}</Text>}
        {card.rating !== undefined && <View style={styles.rating}>
          <Ionicons name="star" size={12} color="#9A5200" />
          <Text style={styles.ratingText}>{card.rating.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</Text>
        </View>}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{card.serviceName}</Text>
      <Text style={styles.muted} numberOfLines={1}>{card.name}</Text>
      {!!card.location && <View style={styles.location}>
        <Ionicons name="location-outline" size={13} color="#64748B" />
        <Text style={styles.locationText} numberOfLines={1}>{card.location}</Text>
      </View>}
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: theme.ink }]}>Rp{card.priceFrom.toLocaleString('id-ID')}{card.perNight && <Text style={styles.muted}> / malam</Text>}</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.ink} />
      </View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: customerColors.canvas },
  nav: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: customerColors.border, backgroundColor: '#FFFFFF' },
  navTitle: { ...typography.labelLg, color: colors.navy },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { alignSelf: 'center', padding: 16, paddingBottom: 24 },
  top: { gap: 12, marginBottom: 14 },
  hero: { minHeight: 116, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { ...typography.headlineLgMobile },
  heroDescription: { ...typography.bodySm },
  heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FFFFFFAA', alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: customerColors.border, backgroundColor: '#FFFFFF', paddingLeft: 12, gap: 9 },
  input: { flex: 1, paddingVertical: 10, paddingRight: 8, color: colors.navy, fontSize: 14 },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  resultsTitle: { ...typography.titleMd, color: colors.navy, flexShrink: 1 },
  action: { ...typography.labelMd, color: colors.primary, paddingVertical: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: customerColors.border, backgroundColor: '#FFFFFF', borderRadius: 22 },
  chipText: { ...typography.labelSm, fontWeight: '700' },
  columns: { gap: 12, alignItems: 'stretch' },
  card: { marginBottom: 12, borderRadius: 17, borderWidth: 1, borderColor: customerColors.border, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1.6 },
  cardBody: { flex: 1, padding: 10, gap: 3 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  category: { ...typography.labelSm, flexShrink: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#7A4200' },
  cardTitle: { ...typography.labelLg, color: colors.navy },
  muted: { ...typography.bodySm, color: '#475569' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { flexShrink: 1, fontSize: 11, color: '#475569' },
  priceRow: { marginTop: 'auto', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 5 },
  price: { flexShrink: 1, fontWeight: '800', fontSize: 13 },
  footerButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: customerColors.border },
  empty: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 16, backgroundColor: '#FFFFFF' },
  loading: { margin: 16 },
  pressed: { opacity: 0.78 },
});
