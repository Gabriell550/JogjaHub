import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vendor } from '../data/mockData';

interface VendorCardProps {
  vendor: Vendor;
  onPressBook?: () => void;
  onToggleFavorite?: () => void;
}

function formatPrice(value: number) {
  if (value >= 1000000) {
    return `Rp${(value / 1000000).toFixed(1)}jt`;
  }
  return `Rp${Math.round(value / 1000)}k`;
}

export default function VendorCard({ vendor, onPressBook, onToggleFavorite }: VendorCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Image source={{ uri: vendor.imageUrl }} style={styles.image} />

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
        </View>

        <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite} activeOpacity={0.8}>
          <Ionicons
            name={vendor.isFavorite ? 'heart' : 'heart-outline'}
            size={16}
            color={vendor.isFavorite ? '#EF4444' : '#374151'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{vendor.category}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {vendor.name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#6B7280" />
          <Text style={styles.location} numberOfLines={1}>
            {vendor.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Mulai dari</Text>
            <Text style={styles.price}>{formatPrice(vendor.priceFrom)}</Text>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={onPressBook} activeOpacity={0.85}>
            <Text style={styles.bookButtonText}>Pesan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = 210;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  bookButton: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
