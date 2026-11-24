import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Bell, Home, CalendarCheck, Compass, MessageCircle, User } from 'lucide-react-native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/theme';
import HomeScreen from '../features/customer/home/screens/HomeScreen';
import MyBookingsScreen from '../features/customer/my-bookings/screens/MyBookingsScreen';
import CustomerProfileScreen from '../features/customer/profile/screens/CustomerProfileScreen';
import ExploreScreen from '../features/customer/catalog/screens/ExploreScreen';
import ChatInbox from '../features/shared/chat/ChatInbox';
import { chatApi } from '../api/chatApi';
import { RubberDockTabBar, type RubberDockPanel } from './RubberDockTabBar';
import type { CustomerStackParamList, CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
type CustomerStackNavigation = NativeStackNavigationProp<CustomerStackParamList>;

const panels = {
  Home: {
    description: 'Temukan penginapan dan layanan lokal di Jogja.',
    actions: [
      { label: 'Cari penginapan', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('HotelBooking') },
      { label: 'Pesan', run: navigation => navigation.navigate('Messages') },
      { label: 'Aktivitas pesanan', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('Notifications') },
    ],
  },
  MyBookings: {
    description: 'Cek status dan riwayat pemesanan Anda.',
    actions: [
      { label: 'Jelajahi layanan', run: navigation => navigation.navigate('Explore') },
    ],
  },
  Profile: {
    description: 'Kelola informasi akun JogjaHub Anda.',
    actions: [
      { label: 'Edit profil', run: navigation => navigation.getParent<CustomerStackNavigation>()?.navigate('EditCustomerProfile') },
    ],
  },
} satisfies Partial<Record<keyof CustomerTabParamList, RubberDockPanel>>;

export function CustomerTabNavigator() {
  const { height } = useWindowDimensions();
  const [hostHeight, setHostHeight] = React.useState<number>();
  const usesFloatingDock = Platform.OS === 'ios' || Platform.OS === 'android';
  const [unread, setUnread] = React.useState<number>();
  useFocusEffect(React.useCallback(() => {
    let active = true;
    let loading = false;
    async function refresh() {
      if (loading) return;
      loading = true;
      try {
        const { data } = await chatApi.list('customer');
        if (active) setUnread(data.data.reduce((total, item) => total + (item.unread_count ?? 0), 0));
      } catch {
        if (active) setUnread(undefined);
      } finally {
        loading = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []));

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
          name="Explore"
          component={ExploreScreen}
          options={{ title: 'Jelajah', tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }}
        />
        <Tab.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          options={{ tabBarLabel: 'Pesanan', tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size} /> }}
        />
        <Tab.Screen
          name="Messages"
          options={{
            title: 'Pesan',
            tabBarBadge: unread ? (unread > 99 ? '99+' : unread) : undefined,
            tabBarAccessibilityLabel: unread ? 'Pesan, ' + unread + ' belum dibaca' : 'Pesan',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        >
          {({ navigation }: BottomTabScreenProps<CustomerTabParamList, 'Messages'>) => <ChatInbox role="customer" onUnread={setUnread} open={(id, name) =>
            navigation.getParent<CustomerStackNavigation>()?.navigate('CustomerChatRoom', { id, name })} />}
        </Tab.Screen>
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
