import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categoryApi } from '../../../../api/categoryApi';
import { vendorApi } from '../../../../api/vendorApi';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import type { CustomerStackParamList, CustomerTabParamList } from '../../../../navigation/types';
import { customerPhotoUrls } from '../../../../utils/serviceImage';
import CategoryGrid from '../../home/components/CategoryGrid';
import VendorCard from '../../home/components/VendorCard';
import CustomerPhoto from '../components/CustomerPhoto';
import { useCatalog } from '../useCatalog';

type Filter = 'Semua' | 'Toko' | 'Layanan';
type Category = { id: number; name: string };
type Shop = { uuid: string; business_name: string; logo_url?: string; address?: { city?: string }; categories?: Category[] };
const filters: Filter[] = ['Semua', 'Toko', 'Layanan'];
const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export default function ExploreScreen({ route, navigation }: BottomTabScreenProps<CustomerTabParamList, 'Explore'>) {
  const initial = route.params;
  const stack = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  return <ExploreResults key={initial?.requestId ?? 'default'} initial={initial} stack={stack} />;
}

function ExploreResults({ initial, stack }: {
  initial: CustomerTabParamList['Explore'];
  stack: NativeStackNavigationProp<CustomerStackParamList> | undefined;
}) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState(initial?.query ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId);
  const [filter, setFilter] = useState<Filter>('Semua');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const services = useCatalog(categoryId, query);
  const shops = useShops(categoryId, query);
  const all = filter === 'Semua';
  const results = normalize(query) && shops.rows.some(shop => normalize(shop.business_name) === normalize(query))
    ? (['Toko', 'Layanan'] as const) : (['Layanan', 'Toko'] as const);
  const empty = !services.loading && !shops.loading && !services.error && !shops.error && !shops.rows.length && !services.cards.length;

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

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <TextInput accessibilityLabel="Cari toko atau layanan" placeholder="Cari toko atau layanan" value={query}
        onChangeText={setQuery} maxLength={120} returnKeyType="search" style={styles.input} />
      {!query.trim() && <CategoryGrid categories={categories} onSelectCategory={setCategoryId} />}
      {categoryError && <Text style={styles.action} onPress={() => setCategoryAttempt(value => value + 1)}>Kategori gagal dimuat. Coba lagi.</Text>}
      {(!!query.trim() || categoryId !== undefined) && <ScrollView horizontal contentContainerStyle={styles.filters}>
        {[{ id: undefined, name: 'Semua kategori' }, ...categories].map(category => (
          <TouchableOpacity key={category.id ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: category.id === categoryId }}
            onPress={() => setCategoryId(category.id)} style={[styles.pill, category.id === categoryId && styles.selected]}>
            <Text style={styles.body}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>}
      <View style={styles.filters}>
        {filters.map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: value === filter }}
          style={[styles.pill, filter === value && styles.selected]} onPress={() => setFilter(value)}>
          <Text style={styles.body}>{value}</Text>
        </TouchableOpacity>)}
      </View>
      {all && empty && <Text style={styles.notice}>Tidak ada toko atau layanan yang cocok.</Text>}
      {results.filter(kind => all || filter === kind).map(kind => {
        const isShop = kind === 'Toko';
        const state = isShop ? shops : services;
        const count = isShop ? shops.rows.length : services.cards.length;
        if (all && !count && !state.loading && !state.error) return null;
        const cards = isShop ? shops.rows.map(shop => (
          <TouchableOpacity key={shop.uuid} accessibilityRole="button" style={[styles.shop, all && { width: Math.min(224, width * 0.73) }]}
            onPress={() => stack?.navigate('VendorDetail', { tenantUuid: shop.uuid, businessName: shop.business_name })}>
            <CustomerPhoto urls={customerPhotoUrls([], shop.logo_url)} style={styles.logo} />
            <Text style={styles.heading}>{shop.business_name}</Text>
            {!!shop.address?.city && <Text style={styles.body}>{shop.address.city}</Text>}
            {!!shop.categories?.length && <Text style={styles.body}>{shop.categories.map(category => category.name).join(' · ')}</Text>}
          </TouchableOpacity>
        )) : services.cards.map(card => (
          <View key={card.id} style={all ? { width: Math.min(245, width * 0.76) } : undefined}>
            <VendorCard vendor={card} fullWidth onPressCard={() => stack?.navigate('ServiceDetail', { serviceId: card.id })} />
          </View>
        ));
        return <View key={kind} style={styles.section}>
          {all && <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.heading}>{kind} yang cocok</Text>
            {count > 0 && <Text accessibilityRole="button" style={styles.action} onPress={() => setFilter(kind)}>Lihat semua</Text>}
          </View>}
          {all ? <ScrollView horizontal contentContainerStyle={styles.row}>{cards}</ScrollView> : <View style={styles.list}>{cards}</View>}
          {state.loading && <ActivityIndicator accessibilityLabel={'Memuat ' + kind.toLowerCase()} color={colors.primary} />}
          {state.error && <Text style={styles.notice} onPress={state.retry}>{kind} gagal dimuat. Coba lagi.</Text>}
          {!all && !count && !state.loading && !state.error && <Text style={styles.notice}>Tidak ada {kind.toLowerCase()} yang cocok.</Text>}
          {!all && state.loadMore && <Text accessibilityRole="button" style={styles.notice} onPress={state.loadMore}>Muat lagi</Text>}
        </View>;
      })}
    </ScrollView>
  );
}

function useShops(categoryId: number | undefined, query: string) {
  const key = JSON.stringify([categoryId, query.trim()]);
  const [state, setState] = useState({ key, rows: [] as Shop[], page: 1, lastPage: 1, loading: true, error: false, attempt: 0 });
  const current = state.key === key ? state : { key, rows: [], page: 1, lastPage: 1, loading: true, error: false, attempt: 0 };
  if (state.key !== key) setState(current);
  const { page, attempt } = current;
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const { data } = await vendorApi.searchTenants({ category_id: categoryId, q: query.trim() || undefined, page });
        if (!active) return;
        setState(previous => {
          if (previous.key !== key) return previous;
          const rows: Shop[] = page === 1 ? data.data : [...previous.rows, ...data.data];
          return { ...previous, rows: [...new Map(rows.map(shop => [shop.uuid, shop])).values()],
            lastPage: data.meta.last_page, loading: false, error: false };
        });
      } catch {
        if (active) setState(previous => previous.key === key ? { ...previous, loading: false, error: true } : previous);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [attempt, categoryId, key, page, query]);
  return {
    ...current,
    retry: () => setState(previous => ({ ...previous, loading: true, error: false, attempt: previous.attempt + 1 })),
    loadMore: !current.loading && !current.error && page < current.lastPage
      ? () => setState(previous => previous.loading ? previous : { ...previous, page: previous.page + 1, loading: true }) : undefined,
  };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: customerColors.canvas },
  content: { gap: 16, paddingVertical: 16 },
  input: { marginHorizontal: 16, minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.outline,
    borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest, color: colors.navy },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  pill: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.full },
  selected: { backgroundColor: colors.primaryFixed, borderColor: colors.primary },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  row: { gap: 10, paddingHorizontal: 16 },
  list: { gap: 12, paddingHorizontal: 16 },
  shop: { padding: 12, gap: 6, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerLowest },
  logo: { width: 56, height: 56, borderRadius: radius.md },
  heading: { ...typography.titleMd, color: colors.navy },
  body: { ...typography.bodySm, color: colors.navy },
  action: { ...typography.labelLg, color: colors.primary, paddingVertical: 12 },
  notice: { ...typography.bodyMd, color: colors.navy, paddingHorizontal: 16, paddingVertical: 12 },
});
