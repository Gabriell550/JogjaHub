import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VendorProfileScreen from '../features/vendor/profile/screens/VendorProfileScreen';
import VendorOnboardingScreen from '../features/vendor/onboarding/screens/VendorOnboardingScreen';
import type { VendorProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorProfileStackParamList>();

export function VendorProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={VendorProfileScreen} />
      <Stack.Screen name="EditBusinessProfile" component={VendorOnboardingScreen} />
    </Stack.Navigator>
  );
}
