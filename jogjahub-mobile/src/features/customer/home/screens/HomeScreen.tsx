import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import PromoBanner from '../components/PromoBanner';
import CategoryGrid from '../components/CategoryGrid';
import VendorCard from '../components/VendorCard';
import { verifiedVendors } from '../data/mockData';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState(verifiedVendors);

  const toggleFavorite = (id: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isFavorite: !v.isFavorite } : v))
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Renter Dashboard</Text>
        <TouchableOpacity hitSlop={10}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari Vendor Wisatamu"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Promo Banner */}
        <PromoBanner
          title="Wisuda Besok?"
          subtitle="Tenang, temukan vendor yang masih tersedia untuk hari spesialmu."
          ctaLabel="Available Now"
          onPress={() => {
            // TODO: arahkan ke halaman vendor yang tersedia hari ini
          }}
        />

        {/* Kategori */}
        <CategoryGrid onSelectCategory={(id) => console.log('category:', id)} />

        {/* Rekomendasi Terverifikasi */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rekomendasi Terverifikasi</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vendorList}
        >
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPressBook={() => console.log('pesan:', vendor.id)}
              onToggleFavorite={() => toggleFavorite(vendor.id)}
            />
          ))}
        </ScrollView>

        {/* Vendor di Sekitarmu */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendor di Sekitarmu</Text>
        </View>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={32} color="#9CA3AF" />
          <TouchableOpacity style={styles.mapButton} activeOpacity={0.85}>
            <Ionicons name="map" size={14} color="#FFFFFF" />
            <Text style={styles.mapButtonText}>Buka Peta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
  },
  vendorList: {
    paddingLeft: 20,
    paddingRight: 6,
  },
  mapPlaceholder: {
    marginHorizontal: 20,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});
