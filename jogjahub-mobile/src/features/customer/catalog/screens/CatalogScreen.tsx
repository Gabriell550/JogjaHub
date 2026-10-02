import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../../navigation/types';
import VendorCard from '../../home/components/VendorCard';
import { verifiedVendors } from '../../home/data/mockData';

type NavProp = NativeStackNavigationProp<CustomerStackParamList, 'Catalog'>;
type RoutePropType = RouteProp<CustomerStackParamList, 'Catalog'>;

export default function CatalogScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { categoryId, title } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState(verifiedVendors);

  const displayedVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (categoryId === 'all' || v.category.toLowerCase().includes(categoryId.toLowerCase()) || 
       (categoryId === 'hotel' && v.category === 'ACCOMMODATION') ||
       (categoryId === 'beauty' && v.category === 'BEAUTY & STYLE') ||
       (categoryId === 'gifting' && v.category === 'GIFTING'))
  );

  const toggleFavorite = (id: string) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, isFavorite: !v.isFavorite } : v)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Katalog'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput style={styles.searchInput} placeholder={`Cari di ${title || 'katalog'}...`} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>
      <FlatList
        data={displayedVendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VendorCard
              vendor={item}
              onPressCard={() => navigation.navigate('VendorDetail', { tenantUuid: item.uuid, businessName: item.name, imageUrl: item.imageUrl })}
              onPressBook={() => navigation.navigate('Booking', { serviceId: item.id, serviceName: item.name, vendorName: item.name, price: item.priceFrom })}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  searchContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  listContent: { padding: 20, alignItems: 'center' },
  cardWrapper: { marginBottom: 20, width: '100%', alignItems: 'center' },
});