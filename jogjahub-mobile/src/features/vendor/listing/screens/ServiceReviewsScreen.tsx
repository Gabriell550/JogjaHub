import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VendorServicesStackParamList } from '../../../../navigation/types';
import { useTenantBookings } from '../../dashboard/useTenantBookings';

type Props = NativeStackScreenProps<VendorServicesStackParamList, 'ServiceReviews'>;

export default function ServiceReviewsScreen({ route }: Props) {
  const { serviceId, serviceName } = route.params;
  const { records, error, reload } = useTenantBookings();
  const reviews = records?.flatMap(booking => booking.service?.id === serviceId && booking.review ? [{
    id: booking.uuid,
    customer: booking.customer?.name,
    ...booking.review,
  }] : []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text accessibilityRole="header">Ulasan untuk {serviceName}</Text>
      {error && <Text onPress={reload}>Ulasan gagal dimuat. Coba lagi.</Text>}
      {!reviews && !error && <ActivityIndicator />}
      {reviews?.length === 0 && <Text>Belum ada ulasan.</Text>}
      {reviews?.map(review => (
        <View key={review.id}>
          <Text>{review.customer ?? 'Pelanggan'} · {review.rating}/5</Text>
          {!!review.comment && <Text>{review.comment}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
