import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VendorServicesStackParamList } from '../../../../navigation/types';
import { bookingLabel, paymentLabel } from '../../../../types/bookingRecord';
import { useTenantBookings } from '../../dashboard/useTenantBookings';

type Props = NativeStackScreenProps<VendorServicesStackParamList, 'ServiceOrders'>;

export default function ServiceOrdersScreen({ route }: Props) {
  const { serviceId, serviceName } = route.params;
  const { records, error, reload } = useTenantBookings();
  const orders = records?.filter(booking => booking.service?.id === serviceId);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text accessibilityRole="header">Pesanan untuk {serviceName}</Text>
      {error && <Text onPress={reload}>Pesanan gagal dimuat. Coba lagi.</Text>}
      {!records && !error && <ActivityIndicator />}
      {orders?.length === 0 && <Text>Belum ada pesanan.</Text>}
      {orders?.map(booking => (
        <View key={booking.uuid}>
          <Text>{bookingLabel(booking)} · {booking.customer?.name ?? 'Pelanggan'}</Text>
          <Text>{paymentLabel(booking)} · Rp {Number(booking.total_amount ?? 0).toLocaleString('id-ID')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
