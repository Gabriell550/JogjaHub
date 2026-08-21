import React from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { View } from 'react-native';
import { RootState } from '../store';
import { AuthStack } from './AuthStack';
import { CustomerStackNavigator } from './CustomerStackNavigator';
import { VendorTabNavigator } from './VendorTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { colors } from '../constants/theme';

import PendingApprovalScreen from '../features/vendor/onboarding/screens/PendingApprovalScreen';

const Stack = createNativeStackNavigator();

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.primary, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '600', color: colors.onSurface }}
      text2Style={{ fontSize: 13, color: colors.onSurfaceVariant }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.error, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '600', color: colors.onSurface }}
      text2Style={{ fontSize: 13, color: colors.onSurfaceVariant }}
    />
  ),
};

// Wrapper ini bikin <Toast /> cuma nyerap sentuhan di area notifikasinya sendiri —
// area kosong di sekitarnya tembus ke komponen di belakangnya (mis. tombol Sign Up),
// biar Toast tidak diam-diam menutupi seluruh layar dan bikin tombol tidak bisa dipencet.
function ToastOverlay() {
  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="box-none"
    >
      <Toast config={toastConfig} />
    </View>
  );
}

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
    <>
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

      <ToastOverlay />
    </>
  );
}