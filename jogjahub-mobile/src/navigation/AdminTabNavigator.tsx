import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminDashboardScreen from '../features/admin/dashboard/screens/AdminDashboardScreen';
import PendingVendorListScreen from '../features/admin/vendor-verification/screens/PendingVendorListScreen';
import TransactionMonitoringScreen from '../features/admin/monitoring/screens/TransactionMonitoringScreen';
import AdminProfileScreen from '../features/admin/profile/screens/AdminProfileScreen';
import { AdminStackParamList } from './types';

const Tab = createBottomTabNavigator<AdminStackParamList>();

// Admin sekarang pakai app mobile juga (bukan dashboard web), jadi punya tab navigator sendiri
// setara CustomerTabNavigator & VendorTabNavigator.
export function AdminTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="PendingVendors" component={PendingVendorListScreen} />
      <Tab.Screen name="Monitoring" component={TransactionMonitoringScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}
