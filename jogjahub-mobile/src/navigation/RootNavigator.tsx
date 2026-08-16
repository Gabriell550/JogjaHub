import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AuthStack } from './AuthStack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { VendorTabNavigator } from './VendorTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';
import PendingApprovalScreen from '../features/vendor/onboarding/screens/PendingApprovalScreen';
import SplashScreen from '../features/shared/onboarding-splash/SplashScreen';

const Stack = createNativeStackNavigator<{ PendingApproval: { businessName?: string; rejected?: boolean } }>();

// Pilih stack berdasarkan role user yang login: customer | vendor | admin.
// Vendor dengan status pending akan diarahkan ke PendingApprovalScreen.
export function RootNavigator() {
  const user = useSelector((state: RootState) => state.auth?.user);
  const tenantStatus = useSelector((state: RootState) => state.auth?.tenantStatus);
  const businessName = useSelector((state: RootState) => state.auth?.businessName);
  const normalizedRole = user?.role === 'tenant' ? 'vendor' : user?.role;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // TODO: cek token tersimpan (mis. AsyncStorage) di sini sebelum isReady jadi true
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  console.log('=== ROOT NAVIGATOR CHECK ===');
  console.log('user?.role:', user?.role);
  console.log('normalizedRole:', normalizedRole);
  console.log('tenantStatus:', tenantStatus);
  console.log('businessName:', businessName);

  // Jika vendor pending approval, tampilkan pending screen dalam navigator khusus
  if (normalizedRole === 'vendor' && tenantStatus === 'pending') {
    console.log('→ ROUTE: PendingApprovalScreen (pending)');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="PendingApproval" 
            component={PendingApprovalScreen}
            initialParams={{ businessName: businessName ?? undefined }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Jika vendor rejected, tampilkan rejection screen
  if (normalizedRole === 'vendor' && tenantStatus === 'rejected') {
    console.log('→ ROUTE: PendingApprovalScreen (rejected)');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="PendingApproval" 
            component={PendingApprovalScreen}
            initialParams={{ businessName: businessName ?? undefined, rejected: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Jika vendor belum punya status (undefined/null), arahkan ke pending
  if (normalizedRole === 'vendor' && !tenantStatus) {
    console.log('→ ROUTE: PendingApprovalScreen (no status - fallback)');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="PendingApproval" 
            component={PendingApprovalScreen}
            initialParams={{ businessName: businessName ?? undefined }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  console.log('→ ROUTE: Standard navigators');
  return (
    <NavigationContainer>
      {!user && <AuthStack />}
      {user?.role === 'customer' && <CustomerTabNavigator />}
      {(normalizedRole === 'vendor' || user?.role === 'tenant') && tenantStatus === 'approved' && <VendorTabNavigator />}
      {user?.role === 'admin' && <AdminTabNavigator />}
    </NavigationContainer>
  );
}