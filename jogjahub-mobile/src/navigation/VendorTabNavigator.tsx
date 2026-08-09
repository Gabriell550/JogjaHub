import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import VendorDashboardScreen from '../features/vendor/dashboard/screens/VendorDashboardScreen';
import ListingScreen from '../features/vendor/listing/screens/ListingScreen';
import ManageCalendarScreen from '../features/vendor/calendar/screens/ManageCalendarScreen';
import IncomingOrdersScreen from '../features/vendor/orders/screens/IncomingOrdersScreen';
import VendorProfileScreen from '../features/vendor/profile/screens/VendorProfileScreen';
import { VendorTabParamList } from './types';

const Tab = createBottomTabNavigator<VendorTabParamList>();

export function VendorTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Listing" component={ListingScreen} />
      <Tab.Screen name="Calendar" component={ManageCalendarScreen} />
      <Tab.Screen name="Orders" component={IncomingOrdersScreen} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}
