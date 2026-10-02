import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import NotificationsScreen from '../features/shared/notifications/NotificationsScreen';
import BookingScreen from '../features/customer/booking/screens/BookingScreen';
import BookingConfirmationScreen from '../features/customer/booking/screens/BookingConfirmationScreen';
import CatalogScreen from '../features/customer/catalog/screens/CatalogScreen';
import VendorDetailScreen from '../features/customer/vendor-detail/screens/VendorDetailScreen';
import { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifikasi' }}
      />
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
    </Stack.Navigator>
  );
}