import React, { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Booking'>;

export default function BookingScreen({ navigation, route }: Props) {
  const { serviceId } = route.params;
  useEffect(() => {
    navigation.replace('ServiceDetail', { serviceId });
  }, [navigation, serviceId]);
  return null;
}