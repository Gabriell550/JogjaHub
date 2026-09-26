import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Bell, Home, CalendarCheck, User } from 'lucide-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../features/customer/home/screens/HomeScreen';
import MyBookingsScreen from '../features/customer/my-bookings/screens/MyBookingsScreen';
import CustomerProfileScreen from '../features/customer/profile/screens/CustomerProfileScreen';
import { CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ navigation, route }) => ({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Notifications')}
            style={{ marginRight: 16 }}
          >
            <Bell size={22} color="#1E293B" />
          </TouchableOpacity>
        ),
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Home size={size} color={color} />;
          } else if (route.name === 'MyBookings') {
            return <CalendarCheck size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <User size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ tabBarLabel: 'My Bookings' }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}