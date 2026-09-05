import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, Store, ClipboardList, User, Calendar } from "lucide-react-native";
import { VendorDashboardStackNavigator } from "./VendorDashboardStackNavigator";
import { VendorServicesStackNavigator } from "./VendorServicesStackNavigator";
import ManageCalendarScreen from "../features/vendor/calendar/screens/ManageCalendarScreen";
import { VendorOrdersStackNavigator } from "./VendorOrdersStackNavigator";
import VendorProfileScreen from "../features/vendor/profile/screens/VendorProfileScreen";
import { colors } from "../constants/theme";
import { VendorTabParamList } from "./types";

const Tab = createBottomTabNavigator<VendorTabParamList>();

const ICONS: Record<keyof VendorTabParamList, any> = {
  Dashboard: LayoutDashboard,
  Listing: Store,
  Calendar: Calendar,
  Orders: ClipboardList,
  Profile: User,
};

export function VendorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarIcon: ({ color, size }) => {
          const Icon = ICONS[route.name as keyof VendorTabParamList];
          return <Icon color={color} size={size ?? 22} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboardStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Listing" component={VendorServicesStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Calendar" component={ManageCalendarScreen} />
      <Tab.Screen name="Orders" component={VendorOrdersStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}