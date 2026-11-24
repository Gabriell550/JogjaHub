import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../../../constants/theme';
import { bookingLabel, paymentLabel } from '../../../../types/bookingRecord';
import { useTenantBookings } from '../useTenantBookings';

export default function RecentActivityScreen() {
  const { records, error, reload } = useTenantBookings();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Aktivitas terbaru</Text>
      {error && <Text onPress={reload}>Aktivitas gagal dimuat. Coba lagi.</Text>}
      {!records && !error && <ActivityIndicator />}
      {records?.length === 0 && <Text>Belum ada aktivitas pesanan.</Text>}
      {records?.slice(0, 20).map(booking => (
        <View key={booking.uuid} style={styles.card}>
          <Text style={styles.name}>{booking.service?.name ?? 'Pesanan'} · {bookingLabel(booking)}</Text>
          <Text>{booking.customer?.name ?? 'Pelanggan'} · {paymentLabel(booking)}</Text>
          {booking.review && <Text>Ulasan {booking.review.rating}/5 {booking.review.comment}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { ...typography.headlineLg, color: colors.navy },
  card: { padding: 14, gap: 6, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest },
  name: { ...typography.titleMd, color: colors.navy },
});
