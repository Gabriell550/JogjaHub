import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
      { label: 'Pesan', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('CustomerChats') },
      { label: 'Aktivitas pesanan', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('Notifications') },
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
  const { height } = useWindowDimensions();
  const [hostHeight, setHostHeight] = React.useState<number>();
  const usesFloatingDock = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View style={styles.host} onLayout={event => setHostHeight(event.nativeEvent.layout.height)}>
      <Tab.Navigator
        tabBar={props => (
          <RubberDockTabBar
            {...props}
            panels={panels}
            tenantLayout={usesFloatingDock ? { usableHeight: hostHeight ?? height } : undefined}
          />
        )}
        screenOptions={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Notifications')}
              accessibilityRole='button'
              accessibilityLabel='Notifikasi'
              style={styles.notification}
            >
              <Bell size={22} color={colors.navy} />
            </TouchableOpacity>
          ),
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false, tabBarLabel: 'Beranda', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
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
    </View>
  );
}
const styles = StyleSheet.create({
  host: { flex: 1 },
  notification: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
});
