import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VendorProfileScreen from '../features/vendor/profile/screens/VendorProfileScreen';
import VendorOnboardingScreen from '../features/vendor/onboarding/screens/VendorOnboardingScreen';
import VendorChatInboxScreen from '../features/vendor/profile/screens/VendorChatInboxScreen';
import VendorChatRoomScreen from '../features/vendor/profile/screens/VendorChatRoomScreen';
import type { VendorProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorProfileStackParamList>();

export function VendorProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={VendorProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditBusinessProfile" component={VendorOnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VendorChatInbox" component={VendorChatInboxScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VendorChatRoom" component={VendorChatRoomScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}