import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import VendorDashboardScreen from "../features/vendor/dashboard/screens/VendorDashboardScreen";
import ListingScreen from "../features/vendor/listing/screens/ListingScreen";
import ManageCalendarScreen from "../features/vendor/calendar/screens/ManageCalendarScreen";
import IncomingOrdersScreen from "../features/vendor/orders/screens/IncomingOrdersScreen";
import VendorProfileScreen from "../features/vendor/profile/screens/VendorProfileScreen";
import { colors } from "../constants/theme";
import { VendorTabParamList } from "./types";

const Tab = createBottomTabNavigator<VendorTabParamList>();

// 5 tab sesuai referensi desain vendor: Dashboard, Listing, Calendar, Orders, Profile.
const ICONS: Record<keyof VendorTabParamList, string> = {
  Dashboard: "??",
  Listing: "??",
  Calendar: "??",
  Orders: "??",
  Profile: "??",
};

export function VendorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name as keyof VendorTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Listing" component={ListingScreen} />
      <Tab.Screen name="Calendar" component={ManageCalendarScreen} />
      <Tab.Screen name="Orders" component={IncomingOrdersScreen} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}
