import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import {
  colors,
  typography,
  spacing,
  radius,
} from "../../../../constants/theme";
import { Button } from "../../../../components/Button/Button";
import type { AuthStackParamList } from "../../../../navigation/types";
import type { RootState } from "../../../../store";
import { useLogout } from "../../../auth/hooks/useLogout";

type Route = RouteProp<AuthStackParamList, "PendingApproval">;
type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function PendingApprovalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<Route>();
  const user = useSelector((state: RootState) => state.auth?.user);
  const rejectionReason = useSelector((state: RootState) => state.auth?.rejectionReason);
  const { handleLogout } = useLogout();

  const isRejected = params?.rejected ?? false;

  const handleBackToLogin = () => {
    if (user) {
      handleLogout();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Login",
        },
      ],
    });
  };

  const handleGoToRevision = () => {
    navigation.navigate("VendorOnboarding");
  };

  return (
    <View style={styles.screen}>
      {/* ICON */}
      <View style={[styles.iconCircle, isRejected && styles.iconCircleError]}>
        <Text style={styles.icon}>{isRejected ? "⚠️" : "⏳"}</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>
        {isRejected ? "Pendaftaran Perlu Diperbaiki" : "Menunggu Persetujuan Admin"}
      </Text>

      {/* BODY */}
      <Text style={styles.body}>
        {isRejected
          ? `Pendaftaran ${
              params?.businessName ?? "usaha Anda"
            } belum dapat disetujui oleh admin JogjaHub.`
          : `${
              params?.businessName
                ? `Pendaftaran ${params.businessName} `
                : "Pendaftaran Anda "
            }berhasil dikirim. Admin JogjaHub akan meninjau KTP dan Surat Badan Usaha yang kamu upload — proses ini biasanya memakan waktu 1–2 hari kerja.`}
      </Text>

      {/* REJECTION REASON CARD */}
      {isRejected && (
        <View style={styles.rejectionCard}>
          <Text style={styles.rejectionHeader}>Catatan dari Admin:</Text>
          <Text style={styles.rejectionText}>
            {rejectionReason || "Admin belum menyertakan catatan khusus. Silakan periksa kembali data profil dan kelengkapan dokumen Anda."}
          </Text>
        </View>
      )}

      {/* SECONDARY BODY */}
      <Text style={styles.bodySecondary}>
        {isRejected
          ? "Data pendaftaran Anda tersimpan. Silakan periksa catatan admin di atas dan perbaiki data Anda tanpa perlu mengulang dari awal."
          : "Kamu akan bisa login penuh sebagai vendor setelah status akun disetujui. Silakan cek lagi nanti."}
      </Text>

      {/* ACTION BUTTONS */}
      <View style={styles.actionContainer}>
        {isRejected && (
          <>
            <Button
              label="Perbaiki Data Pendaftaran"
              onPress={handleGoToRevision}
            />
            <View style={{ height: 12 }} />
          </>
        )}
        <Button
          label={isRejected ? "Keluar / Ganti Akun" : "Kembali ke Login"}
          style={isRejected ? styles.secondaryBtn : undefined}
          onPress={handleBackToLogin}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.containerMargin,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.stackLg,
  },

  iconCircleError: {
    backgroundColor: "#FEE2E2",
  },

  icon: {
    fontSize: 40,
  },

  title: {
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: typography.headlineLg.fontWeight,
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: spacing.stackMd,
  },

  body: {
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: spacing.stackMd,
    lineHeight: typography.bodyLg.lineHeight,
  },

  rejectionCard: {
    width: "100%",
    backgroundColor: "#FFF1F2",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 16,
    marginBottom: spacing.stackLg,
  },

  rejectionHeader: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    color: "#BE123C",
    marginBottom: 4,
  },

  rejectionText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    color: "#881337",
    lineHeight: 18,
  },

  bodySecondary: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
    lineHeight: typography.bodyMd.lineHeight,
  },

  actionContainer: {
    width: "100%",
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceContainerHigh,
  },
});


