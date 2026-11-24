import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingApi } from '../../../api/bookingApi';
import { bookingLabel, paymentLabel, type BookingRecord } from '../../../types/bookingRecord';

export default function NotificationsScreen() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reload = () => setAttempt(value => value + 1);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    bookingApi.listMyBookings().then(({ data }) => {
      if (active) setBookings(data.data);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]));

  return <FlatList data={bookings} keyExtractor={booking => booking.uuid} refreshing={loading} onRefresh={reload}
    contentContainerStyle={{ padding: 16, gap: 12 }}
    ListHeaderComponent={error ? <Text onPress={reload}>Aktivitas gagal dimuat. Coba lagi.</Text> : undefined}
    ListEmptyComponent={!loading && !error ? <Text>Belum ada aktivitas pesanan.</Text> : undefined}
    renderItem={({ item }) => <View style={{ padding: 14, backgroundColor: 'white', gap: 4 }}>
      <Text style={{ fontWeight: '600' }}>{item.service?.name ?? 'Layanan'} · {bookingLabel(item)}</Text>
      <Text>{paymentLabel(item)}</Text>
    </View>} />;
}
