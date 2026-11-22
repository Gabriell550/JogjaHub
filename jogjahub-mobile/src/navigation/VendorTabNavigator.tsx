import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, ClipboardList, LayoutDashboard, Store, User } from 'lucide-react-native';
import ManageCalendarScreen from '../features/vendor/calendar/screens/ManageCalendarScreen';
import { RubberDockTabBar, type RubberDockPanel } from './RubberDockTabBar';
import { VendorDashboardStackNavigator } from './VendorDashboardStackNavigator';
import { VendorOrdersStackNavigator } from './VendorOrdersStackNavigator';
import { VendorProfileStackNavigator } from './VendorProfileStackNavigator';
import { VendorServicesStackNavigator } from './VendorServicesStackNavigator';
import type { VendorTabParamList } from './types';

const Tab = createBottomTabNavigator<VendorTabParamList>();

const panels = {
  Dashboard: {
    description: 'Pantau aktivitas dan kinerja bisnis Anda.',
    actions: [
      { label: 'Aktivitas terbaru', run: navigation => navigation.navigate('Dashboard', { screen: 'RecentActivity' }) },
      { label: 'Statistik bisnis', run: navigation => navigation.navigate('Dashboard', { screen: 'Statistics' }) },
    ],
  },
  Listing: {
    description: 'Kelola layanan yang tersedia untuk pelanggan.',
    actions: [
      { label: 'Tambah layanan', run: navigation => navigation.navigate('Listing', { screen: 'ServiceForm', params: { mode: 'create' } }) },
    ],
  },
  Calendar: {
    description: 'Atur tanggal, jam, dan kuota pemesanan untuk tiap layanan.',
    actions: [
      { label: 'Kelola layanan', run: navigation => navigation.navigate('Listing', { screen: 'ServicesList' }) },
    ],
  },
  Orders: {
    description: 'Tinjau pesanan masuk dan perbarui statusnya.',
    actions: [
      { label: 'Buka kalender', run: navigation => navigation.navigate('Calendar') },
    ],
  },
  Profile: {
    description: 'Perbarui profil bisnis dan balas pesan pelanggan.',
    actions: [
      { label: 'Edit profil bisnis', run: navigation => navigation.navigate('Profile', { screen: 'EditBusinessProfile' }) },
      { label: 'Pesan pelanggan', run: navigation => navigation.navigate('Profile', { screen: 'VendorChatInbox' }) },
    ],
  },
} satisfies Record<keyof VendorTabParamList, RubberDockPanel>;

export function VendorTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <RubberDockTabBar {...props} panels={panels} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Dashboard"
        component={VendorDashboardStackNavigator}
        options={{ tabBarLabel: 'Dasbor', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Listing"
        component={VendorServicesStackNavigator}
        options={{ tabBarLabel: 'Layanan', tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Calendar"
        component={ManageCalendarScreen}
        options={{ tabBarLabel: 'Kalender', tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={VendorOrdersStackNavigator}
        options={{ tabBarLabel: 'Pesanan', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={VendorProfileStackNavigator}
        options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
