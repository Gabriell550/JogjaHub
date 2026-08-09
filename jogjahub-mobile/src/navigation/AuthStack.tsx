import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterCustomerScreen from '../features/auth/screens/RegisterCustomerScreen';
import RegisterVendorScreen from '../features/auth/screens/RegisterVendorScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterCustomer" component={RegisterCustomerScreen} />
      <Stack.Screen name="RegisterVendor" component={RegisterVendorScreen} />
    </Stack.Navigator>
  );
}
