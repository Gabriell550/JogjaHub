import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VendorDashboardScreen from '../features/vendor/dashboard/screens/VendorDashboardScreen';
import RecentActivityScreen from '../features/vendor/dashboard/screens/RecentActivityScreen';
import VendorStatisticsScreen from '../features/vendor/statistics/screens/VendorStatisticsScreen';
import { VendorDashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorDashboardStackParamList>();

export function VendorDashboardStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={VendorDashboardScreen} />
      <Stack.Screen
        name="RecentActivity"
        component={RecentActivityScreen}
        options={{ headerShown: true, title: 'Recent Activity' }}
      />
      <Stack.Screen name="Statistics" component={VendorStatisticsScreen} />
    </Stack.Navigator>
  );
}