import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Bell, Home, CalendarCheck, User } from 'lucide-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/theme';
import HomeScreen from '../features/customer/home/screens/HomeScreen';
import MyBookingsScreen from '../features/customer/my-bookings/screens/MyBookingsScreen';
import CustomerProfileScreen from '../features/customer/profile/screens/CustomerProfileScreen';
import { RubberDockTabBar, type RubberDockPanel } from './RubberDockTabBar';
import type { CustomerStackParamList, CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
type CustomerStackNavigation = NativeStackNavigationProp<CustomerStackParamList>;

const panels = {
  Home: {
    description: 'Temukan penginapan dan layanan lokal di Jogja.',
    actions: [
      { label: 'Cari penginapan', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('HotelBooking') },
      { label: 'Lihat notifikasi', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('Notifications') },
    ],
  },
  MyBookings: {
    description: 'Cek status dan riwayat pemesanan Anda.',
    actions: [
      { label: 'Jelajahi layanan', run: navigation => navigation.navigate('Home') },
    ],
  },
  Profile: {
    description: 'Kelola informasi akun JogjaHub Anda.',
    actions: [
      { label: 'Edit profil', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('EditCustomerProfile') },
    ],
  },
} satisfies Record<Exclude<keyof CustomerTabParamList, 'Catalog'>, RubberDockPanel>;

export function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <RubberDockTabBar {...props} panels={panels} />}
      screenOptions={({ navigation }) => ({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Notifications')}
            style={{ marginRight: 16 }}
          >
            <Bell size={22} color={colors.navy} />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Beranda', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ tabBarLabel: 'Pesanan', tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
