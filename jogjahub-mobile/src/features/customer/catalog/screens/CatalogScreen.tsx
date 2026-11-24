import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../../navigation/types';
import VendorCard from '../../home/components/VendorCard';
import { useCatalog } from '../useCatalog';

type NavProp = NativeStackNavigationProp<CustomerStackParamList, 'Catalog'>;
type RoutePropType = RouteProp<CustomerStackParamList, 'Catalog'>;

export default function CatalogScreen({ hotelCatalog = false }: { hotelCatalog?: boolean } = {}) {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { categoryId, title, query } = route.params ?? {};
  const [searchQuery, setSearchQuery] = useState(query ?? '');
  const { cards, loading, error, retry, loadMore } = useCatalog(categoryId, searchQuery, hotelCatalog);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || (hotelCatalog ? 'Penginapan' : 'Katalog')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
          <TextInput style={styles.searchInput} placeholder={`Cari di ${title || 'katalog'}...`} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>
      <FlatList
        data={cards}
        ListEmptyComponent={!loading && !error ? <Text>Tidak ada layanan yang cocok.</Text> : undefined}
        ListFooterComponent={error ? <Text onPress={retry}>Layanan gagal dimuat. Coba lagi.</Text> : loading ? <Text>Memuat layanan...</Text> : loadMore ? <Text onPress={loadMore}>Muat layanan lainnya</Text> : undefined}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VendorCard
              vendor={item}
              onPressCard={() => navigation.navigate('VendorDetail', { tenantUuid: item.uuid, businessName: item.name, imageUrl: item.imageUrl })}
              onPressBook={() => navigation.navigate('Booking', { serviceId: item.id })}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: customerColors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, gap: 8 },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 48 },
  headerTitle: { ...typography.titleMd, color: colors.navy, flexShrink: 1, textAlign: 'center' },
  searchContainer: { paddingHorizontal: 20, paddingTop: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg,
    borderWidth: 1, borderColor: customerColors.border,
  },
  searchInput: { ...typography.bodyMd, flex: 1, paddingVertical: 10, color: colors.navy },
  listContent: { padding: 20, alignItems: 'center' },
  cardWrapper: { marginBottom: 16, width: '100%', alignItems: 'center' },
});
