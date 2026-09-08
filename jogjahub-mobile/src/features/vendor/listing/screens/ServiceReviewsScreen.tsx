import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VendorServicesStackParamList } from '../../../../navigation/types';

type Props = NativeStackScreenProps<VendorServicesStackParamList, 'ServiceReviews'>;

export default function ServiceReviewsScreen({ route }: Props) {
  const { serviceId, serviceName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ulasan untuk {serviceName}</Text>
      <Text style={styles.subtitle}>Service ID: {serviceId}</Text>

      {/* TODO: fetch & tampilkan daftar ulasan berdasarkan serviceId */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
});