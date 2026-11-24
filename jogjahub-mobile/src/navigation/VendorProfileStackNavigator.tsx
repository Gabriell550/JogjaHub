import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VendorProfileScreen from '../features/vendor/profile/screens/VendorProfileScreen';
import EditTenantProfileScreen from '../features/vendor/profile/screens/EditTenantProfileScreen';
import VendorChatInboxScreen from '../features/vendor/profile/screens/VendorChatInboxScreen';
import VendorChatRoomScreen from '../features/vendor/profile/screens/VendorChatRoomScreen';
import type { VendorProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorProfileStackParamList>();

export function VendorProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={VendorProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditBusinessProfile" component={EditTenantProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VendorChatInbox" component={VendorChatInboxScreen}
        options={{ headerShown: true, title: 'Chat Pelanggan' }} />
      <Stack.Screen name="VendorChatRoom" component={VendorChatRoomScreen}
        options={({ route }) => ({ headerShown: true, title: route.params.customerName })} />
    </Stack.Navigator>
  );
}