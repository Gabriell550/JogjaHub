import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AuthStack } from './AuthStack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { VendorTabNavigator } from './VendorTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';

// Pilih stack berdasarkan role user yang login: customer | vendor | admin.
export function RootNavigator() {
  const user = useSelector((state: RootState) => state.auth?.user);

  return (
    <NavigationContainer>
      {!user && <AuthStack />}
      {user?.role === 'customer' && <CustomerTabNavigator />}
      {user?.role === 'vendor' && <VendorTabNavigator />}
      {user?.role === 'admin' && <AdminTabNavigator />}
    </NavigationContainer>
  );
}
