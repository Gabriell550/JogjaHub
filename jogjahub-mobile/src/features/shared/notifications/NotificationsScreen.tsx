import React, { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../navigation/types';
import { bookingApi } from '../../../api/bookingApi';
import { bookingLabel, paymentLabel, type BookingRecord } from '../../../types/bookingRecord';

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reload = () => setAttempt(value => value + 1);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    bookingApi.listAllBookings('customer').then(records => {
      if (active) setBookings(records);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]));

  const activity = bookings.flatMap(booking => {
    const events = [
      { key: 'booking', title: paymentLabel(booking), at: booking.created_at },
      { key: 'fulfilled', title: 'Toko menandai pesanan selesai', at: booking.fulfilled_at },
      { key: 'reminder', title: 'Pengingat konfirmasi selesai', at: booking.completion_reminded_at },
      { key: 'issue', title: 'Kendala dilaporkan', at: booking.issue_reported_at },
      { key: 'completed', title: 'Pesanan selesai', at: booking.completed_at },
    ];
    return events.filter(event => event.at || event.key === 'booking').map(event => ({ ...event, booking }));
  }).sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));

  return <FlatList data={activity} keyExtractor={item => item.booking.uuid + ':' + item.key} refreshing={loading} onRefresh={reload}
    contentContainerStyle={{ padding: 16, gap: 12 }}
    ListHeaderComponent={error ? <Text onPress={reload}>Aktivitas gagal dimuat. Coba lagi.</Text> : undefined}
    ListEmptyComponent={!loading && !error ? <Text>Belum ada aktivitas pesanan.</Text> : undefined}
    renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" style={{ padding: 14, backgroundColor: 'white', gap: 4 }}
      onPress={() => navigation.navigate('BookingDetail', { id: item.booking.uuid })}>
      <Text style={{ fontWeight: '600' }}>{item.booking.service?.name ?? 'Layanan'} · {bookingLabel(item.booking)}</Text>
      <Text>{item.title}</Text>
      {!!item.at && <Text>{new Date(item.at).toLocaleString('id-ID')}</Text>}
    </TouchableOpacity>} />;
}
