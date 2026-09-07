import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, Store, ClipboardList, User, Calendar } from "lucide-react-native";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography } from "../constants/theme";
import { VendorDashboardStackNavigator } from "./VendorDashboardStackNavigator";
import { VendorServicesStackNavigator } from "./VendorServicesStackNavigator";
import ManageCalendarScreen from "../features/vendor/calendar/screens/ManageCalendarScreen";
import { VendorOrdersStackNavigator } from "./VendorOrdersStackNavigator";
import VendorProfileScreen from "../features/vendor/profile/screens/VendorProfileScreen";
import { VendorTabParamList } from "./types";

const Tab = createBottomTabNavigator<VendorTabParamList>();

const ICONS: Record<keyof VendorTabParamList, any> = {
  Dashboard: LayoutDashboard,
  Listing: Store,
  Calendar: Calendar,
  Orders: ClipboardList,
  Profile: User,
};

const TAB_LABELS: Record<keyof VendorTabParamList, string> = {
  Dashboard: "Dashboard",
  Listing: "Listing",
  Calendar: "Kalender",
  Orders: "Pesanan",
  Profile: "Profil",
};

function TabIcon({ icon: Icon, focused, label }: { icon: any; focused: boolean; label: string }) {
  return (
    <View style={styles.tabButton}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Icon size={18} color={focused ? colors.onPrimary : colors.onSurfaceVariant} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export function VendorTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 68 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ],
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={VendorDashboardStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.Dashboard} focused={focused} label="Dashboard" />,
        }}
      />
      <Tab.Screen
        name="Listing"
        component={VendorServicesStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.Listing} focused={focused} label="Listing" />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={ManageCalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.Calendar} focused={focused} label="Kalender" />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={VendorOrdersStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.ordersTab}>
              <TabIcon icon={ICONS.Orders} focused={focused} label="Pesanan" />
              {focused && <View style={styles.notifDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={VendorProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.Profile} focused={focused} label="Profil" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: colors.outlineVariant,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabButton: {
    alignItems: "center",
    justify: "center",
    flex: 1,
    gap: 4,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  ordersTab: {
    alignItems: "center",
    justify: "center",
    flex: 1,
    gap: 4,
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 4,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.notificationRed,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
});