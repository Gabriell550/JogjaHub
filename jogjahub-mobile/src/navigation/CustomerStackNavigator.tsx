
import React from 'react';
import ChatInbox from '../features/shared/chat/ChatInbox';
import ChatRoom from '../features/shared/chat/ChatRoom';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import NotificationsScreen from '../features/shared/notifications/NotificationsScreen';
import BookingScreen from '../features/customer/booking/screens/BookingScreen';
import BookingDetailScreen from '../features/customer/my-bookings/screens/BookingDetailScreen';
import BookingConfirmationScreen from '../features/customer/booking/screens/BookingConfirmationScreen';
import HotelBookingScreen from '../features/customer/hotel/screens/HotelBookingScreen';
import CatalogScreen from '../features/customer/catalog/screens/CatalogScreen';
import CustomerServiceDetailScreen from '../features/customer/service-detail/screens/CustomerServiceDetailScreen';
import VendorDetailScreen from '../features/customer/vendor-detail/screens/VendorDetailScreen';
import EditCustomerProfileScreen from '../features/customer/profile/screens/EditCustomerProfileScreen';
import { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CustomerTabs"
        component={CustomerTabNavigator}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Aktivitas Pesanan' }}
      />
      <Stack.Screen name="CustomerChats" options={{ headerShown: true, title: 'Pesan' }}>
        {({ navigation }) => <ChatInbox role="customer" open={(id, name) => navigation.navigate('CustomerChatRoom', { id, name })} />}
      </Stack.Screen>
      <Stack.Screen name="CustomerChatRoom" options={({ route }) => ({ headerShown: true, title: route.params.name })}>
        {({ route }) => <ChatRoom key={route.params.id} role="customer" id={route.params.id} initialDraft={route.params.draft} />}
      </Stack.Screen>
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="HotelBooking" component={HotelBookingScreen} />
      <Stack.Screen name="ServiceDetail" component={CustomerServiceDetailScreen} />
      <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: true, title: 'Detail Pesanan' }} />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
      />
      <Stack.Screen
        name="EditCustomerProfile"
        component={EditCustomerProfileScreen}
      />
    </Stack.Navigator>
  );
}
