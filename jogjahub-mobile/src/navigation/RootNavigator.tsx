import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AuthStack } from './AuthStack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { VendorTabNavigator } from './VendorTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';
import SplashScreen from '../features/shared/onboarding-splash/SplashScreen';

// Pilih stack berdasarkan role user yang login: customer | vendor | admin.
export function RootNavigator() {
  const user = useSelector((state: RootState) => state.auth?.user);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // TODO: cek token tersimpan (mis. AsyncStorage) di sini sebelum isReady jadi true
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {!user && <AuthStack />}
      {user?.role === 'customer' && <CustomerTabNavigator />}
      {user?.role === 'vendor' && <VendorTabNavigator />}
      {user?.role === 'admin' && <AdminTabNavigator />}
    </NavigationContainer>
  );
}