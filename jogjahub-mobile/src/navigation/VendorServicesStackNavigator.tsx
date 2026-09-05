import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListingScreen from '../features/vendor/listing/screens/ListingScreen';
import ServiceForm from '../features/vendor/listing/screens/ServiceFormScreen';
import { VendorServicesStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorServicesStackParamList>();

export function VendorServicesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesList" component={ListingScreen} />
      <Stack.Screen name="ServiceForm" component={ServiceForm} />
    </Stack.Navigator>
  );
}