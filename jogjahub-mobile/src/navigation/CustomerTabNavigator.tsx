import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../features/customer/home/screens/HomeScreen';
import MyBookingsScreen from '../features/customer/my-bookings/screens/MyBookingsScreen';
import CustomerProfileScreen from '../features/customer/profile/screens/CustomerProfileScreen';
import { CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} />
      <Tab.Screen name="Profile" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
}
