import React from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { RootState } from '../store';
import { AuthStack } from './AuthStack';
import { CustomerStackNavigator } from './CustomerStackNavigator';
import { VendorTabNavigator } from './VendorTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';

import PendingApprovalScreen from '../features/vendor/onboarding/screens/PendingApprovalScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const user = useSelector(
    (state: RootState) => state.auth?.user
  );

  const tenantStatus = useSelector(
    (state: RootState) => state.auth?.tenantStatus
  );

  const businessName = useSelector(
    (state: RootState) => state.auth?.businessName
  );

  const normalizedRole =
    user?.role === 'tenant'
      ? 'vendor'
      : user?.role;

  console.log('=== ROOT NAVIGATOR CHECK ===');
  console.log('user:', user);
  console.log('role:', user?.role);
  console.log('normalizedRole:', normalizedRole);
  console.log('tenantStatus:', tenantStatus);
  console.log('businessName:', businessName);

  /*
   * KEY INI PENTING
   *
   * Ketika user logout:
   *
   * user = null
   *
   * key berubah dari:
   * authenticated
   *
   * menjadi:
   * unauthenticated
   *
   * sehingga NavigationContainer dibuat ulang
   * dan AuthStack dimulai dari Login.
   */
  const navigationKey = user
    ? 'authenticated'
    : 'unauthenticated';

  return (
    <NavigationContainer key={navigationKey}>

      {/* =========================
          BELUM LOGIN
      ========================== */}

      {!user && (
        <>
          {console.log('→ ROUTE: AuthStack')}

          <AuthStack key="auth-stack" />
        </>
      )}

      {/* =========================
          VENDOR PENDING / REJECTED
      ========================== */}

      {user &&
        normalizedRole === 'vendor' &&
        (tenantStatus === 'pending' ||
          tenantStatus === 'rejected') && (

          <>
            {console.log('→ ROUTE: PendingApproval')}

            <Stack.Navigator
              key="pending-stack"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen
                name="PendingApproval"
                component={PendingApprovalScreen}
                initialParams={{
                  businessName:
                    businessName ?? undefined,

                  rejected:
                    tenantStatus === 'rejected',
                }}
              />
            </Stack.Navigator>
          </>
        )}

      {/* =========================
          CUSTOMER
      ========================== */}

      {user &&
        user.role === 'customer' && (

          <>
            {console.log('→ ROUTE: Customer')}

            <CustomerStackNavigator />
          </>
        )}

      {/* =========================
          VENDOR APPROVED
      ========================== */}

      {user &&
        normalizedRole === 'vendor' &&
        tenantStatus === 'approved' && (

          <>
            {console.log('→ ROUTE: Vendor')}

            <VendorTabNavigator />
          </>
        )}

      {/* =========================
          ADMIN
      ========================== */}

      {user &&
        user.role === 'admin' && (

          <>
            {console.log('→ ROUTE: Admin')}

            <AdminTabNavigator />
          </>
        )}

    </NavigationContainer>
  );
}