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
  Linking,
  Platform,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import PromoBanner from '../components/PromoBanner';
import CategoryGrid from '../components/CategoryGrid';
import VendorCard from '../components/VendorCard';
import { verifiedVendors } from '../data/mockData';

// Asset gambar peta Yogyakarta lokal
const jogjaMapImage = require('../../../../assets/images/yogyakarta-map.png');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState(verifiedVendors);

  const toggleFavorite = (id: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isFavorite: !v.isFavorite } : v))
    );
  };

  // Fungsi untuk membuka peta Yogyakarta di Google Maps / Apple Maps
  const handleOpenMap = (latitude = -7.7956, longitude = 110.3695, query = 'Vendor Wisuda Yogyakarta') => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(query)}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${encodeURIComponent(query)}`,
    }) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
      });
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
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
            // Arahkan ke kategori atau vendor tersedia
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
              onPressBook={() => {
                navigation.navigate('Booking', {
                  serviceId: vendor.id,
                  serviceName: vendor.name,
                  vendorName: vendor.name,
                  price: vendor.priceFrom,
                });
              }}
              onToggleFavorite={() => toggleFavorite(vendor.id)}
            />
          ))}
        </ScrollView>

        {/* Vendor di Sekitarmu */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendor di Sekitarmu</Text>
        </View>

        {/* Kartu Peta Interaktif dengan Gambar Peta Yogyakarta */}
        <TouchableOpacity
          style={styles.mapCard}
          activeOpacity={0.9}
          onPress={() => handleOpenMap()}
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

            {/* Pin Marker 1: GlowUp MUA Jogja */}
            <View style={[styles.markerContainer, { top: '22%', left: '20%' }]}>
              <View style={styles.markerBadge}>
                <Ionicons name="sparkles" size={11} color="#EA580C" />
                <Text style={styles.markerText}>GlowUp MUA</Text>
              </View>
              <View style={styles.markerDot} />
            </View>

            {/* Pin Marker 2: Grand Aston Hotel */}
            <View style={[styles.markerContainer, { top: '35%', right: '22%' }]}>
              <View style={styles.markerBadge}>
                <Ionicons name="bed" size={11} color="#0284C7" />
                <Text style={styles.markerText}>Grand Aston</Text>
              </View>
              <View style={styles.markerDot} />
            </View>

            {/* Pin Marker 3: Kado Wisuda Studio */}
            <View style={[styles.markerContainer, { bottom: '26%', left: '40%' }]}>
              <View style={styles.markerBadge}>
                <Ionicons name="gift" size={11} color="#16A34A" />
                <Text style={styles.markerText}>Kado Wisuda</Text>
              </View>
              <View style={styles.markerDot} />
            </View>

            {/* Tombol Buka Peta */}
            <View style={styles.mapButton}>
              <Ionicons name="map" size={14} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>Buka Peta</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
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
  mapCard: {
    marginHorizontal: 20,
    height: 175,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
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
    borderRadius: 16,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 4,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 2,
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