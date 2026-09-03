import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IncomingOrdersScreen from '../features/vendor/orders/screens/IncomingOrdersScreen';
import OrderDetailScreen from '../features/vendor/orders/screens/OrderDetailScreen';
import { VendorOrdersStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorOrdersStackParamList>();

export function VendorOrdersStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={IncomingOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}