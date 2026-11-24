import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../../../../constants/theme';
import { customerColors } from '../../../../constants/theme/customer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../../navigation/types';
import { chatApi } from '../../../../api/chatApi';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { vendorApi } from '../../../../api/vendorApi';

type Category = { id: number; name: string };
type ServiceItem = { id: number; name: string; price: number; photos?: { url: string; is_primary: boolean }[]; subcategory?: { id: number; name: string }; reviews_count?: number; reviews_average_rating?: number | null; };
type TenantProfile = { id: number; uuid: string; business_name: string; description?: string; address?: { street?: string; city?: string; province?: string; }; location?: { latitude: number; longitude: number }; whatsapp_number?: string; logo_url?: string; categories?: Category[]; services?: ServiceItem[]; };

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
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [tenantUuid]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const [openingChat, setOpeningChat] = useState(false);
  const handleChat = async () => {
    setOpeningChat(true);
    try {
      const { data } = await chatApi.start(tenantUuid);
      navigation.navigate('CustomerChatRoom', { id: data.data.id, name: profile?.business_name ?? data.data.tenant.name });
    } catch (error) {
      Alert.alert('Chat gagal dibuka', apiErrorMessage(error, 'Coba lagi nanti.'));
    } finally {
      setOpeningChat(false);
    }
  };

  const handleWhatsApp = () => {
    const number = profile?.whatsapp_number?.replace(/\D/g, '');
    if (number) Linking.openURL(`https://wa.me/${number.startsWith('0') ? '62' + number.slice(1) : number}`);
  };

  const handleBook = (svc: ServiceItem) => {
    navigation.navigate('Booking', {
      serviceId: svc.id,
    });
  };

  const heroUrl = profile?.logo_url || imageUrl;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !profile ? (
        <Text style={styles.content} onPress={loadProfile}>Profil gagal dimuat. Coba lagi.</Text>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{profile?.business_name || businessName}</Text>
            {heroUrl && <Image source={{ uri: heroUrl }} style={styles.image} />}
            {!!profile.description && <Text>{profile.description}</Text>}

            <Text style={styles.sectionTitle}>Layanan Tersedia</Text>
            {!profile.services?.length && <Text>Belum ada layanan tersedia.</Text>}
            {profile.services?.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                accessibilityRole="button"
                onPress={() => handleBook(svc)}
                style={styles.service}
              >
                <View style={styles.serviceCopy}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.servicePrice}>Rp {svc.price}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleChat} disabled={openingChat} accessibilityRole="button" style={styles.contact}>
              <Text style={styles.contactLabel}>{openingChat ? 'Membuka chat...' : 'Chat di JogjaHub'}</Text>
            </TouchableOpacity>
            {!!profile.whatsapp_number && (
              <TouchableOpacity onPress={handleWhatsApp} accessibilityRole="button" style={styles.contact}>
                <Ionicons name="logo-whatsapp" size={20} color={colors.onNavy} />
                <Text style={styles.contactLabel}>Hubungi via WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: customerColors.canvas },
  header: { paddingHorizontal: 20, paddingVertical: 8 },
  backButton: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.lg, borderWidth: 1, borderColor: customerColors.border,
    backgroundColor: colors.surfaceContainerLowest,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  title: { ...typography.headlineLg, color: colors.navy },
  image: { width: '100%', height: 228, borderRadius: radius.xl, backgroundColor: colors.accentGreenContainer },
  sectionTitle: { ...typography.titleMd, color: colors.navy, marginTop: 8 },
  service: {
    flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg,
    borderWidth: 1, borderColor: customerColors.border,
  },
  serviceCopy: { flex: 1, gap: 4 },
  serviceName: { ...typography.headlineSm, color: colors.navy },
  servicePrice: { ...typography.labelLg, color: customerColors.hero },
  footer: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  contact: {
    minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: customerColors.hero,
  },
  contactLabel: { ...typography.labelLg, color: colors.onNavy, flexShrink: 1, textAlign: 'center' },
});
