import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../../navigation/types';
import { vendorApi } from '../../../../api/vendorApi';

type Category = { id: number; name: string };
type ServiceItem = { id: number; name: string; price: number; photos?: { url: string; is_primary: boolean }[]; subcategory?: { id: number; name: string }; reviews_count?: number; reviews_average_rating?: number | null; };
type TenantProfile = { id: number; uuid: string; business_name: string; description?: string; address?: { street?: string; city?: string; province?: string; }; location?: { latitude: number; longitude: number }; whatsapp_number?: string; portfolio_url?: string; categories?: Category[]; services?: ServiceItem[]; };

export default function VendorDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList, 'VendorDetail'>>();
  const route = useRoute<RouteProp<CustomerStackParamList, 'VendorDetail'>>();
  const { tenantUuid, businessName, imageUrl } = route.params;

  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getTenantProfile(tenantUuid);
      setProfile(res.data?.data ?? res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tenantUuid]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleWhatsApp = () => {
    const number = profile?.whatsapp_number?.replace(/\D/g, '');
    if (number) Linking.openURL(`https://wa.me/${number.startsWith('0') ? '62' + number.slice(1) : number}`);
  };

  const handleBook = (svc: ServiceItem) => {
    navigation.navigate('Booking', {
      serviceId: svc.id,
      serviceName: svc.name,
      vendorName: profile?.business_name || businessName || 'Vendor',
      price: svc.price,
    });
  };

  const heroUrl = profile?.portfolio_url || imageUrl || 'https://images.unsplash.com/photo-1486308510493-aa64833637bc?w=800';

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#EA580C" /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView>
        <View style={{ height: 280 }}>
          <Image source={{ uri: heroUrl }} style={{ width: '100%', height: '100%' }} />
          <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' }} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 52, left: 20 }}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={{ position: 'absolute', bottom: 20, left: 20, color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>{profile?.business_name || businessName}</Text>
        </View>

        <View style={{ padding: 20, backgroundColor: '#FFF' }}>
          <TouchableOpacity onPress={handleWhatsApp} style={{ backgroundColor: '#25D366', padding: 12, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Hubungi via WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Layanan Tersedia</Text>
          {profile?.services?.map((svc) => (
            <TouchableOpacity key={svc.id} onPress={() => handleBook(svc)} style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{svc.name}</Text>
              <Text style={{ color: '#EA580C', marginTop: 4 }}>Rp {svc.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}