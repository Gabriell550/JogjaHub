import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListingScreen from '../features/vendor/listing/screens/ListingScreen';
import ServiceFormScreen from '../features/vendor/listing/screens/ServiceFormScreen';
import ServiceDetailScreen from '../features/vendor/listing/screens/ServiceDetailScreen';
import ServiceOrdersScreen from '../features/vendor/listing/screens/ServiceOrdersScreen';
import ServiceReviewsScreen from '../features/vendor/listing/screens/ServiceReviewsScreen';
import { VendorServicesStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorServicesStackParamList>();

export function VendorServicesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesList" component={ListingScreen} />
      <Stack.Screen name="ServiceForm" component={ServiceFormScreen} />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ headerShown: true, title: 'Detail Layanan' }}
      />
      <Stack.Screen
        name="ServiceOrders"
        component={ServiceOrdersScreen}
        options={{ headerShown: true, title: 'Pesanan Layanan' }}
      />
      <Stack.Screen
        name="ServiceReviews"
        component={ServiceReviewsScreen}
        options={{ headerShown: true, title: 'Ulasan Layanan' }}
      />
    </Stack.Navigator>
  );
}