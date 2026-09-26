import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LogOut, UserRound } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { useLogout } from '../../../auth/hooks/useLogout';
import type { RootState } from '../../../../store';

export default function CustomerProfileScreen() {
	const user = useSelector((state: RootState) => state.auth.user);
	const { handleLogout } = useLogout();

	const confirmLogout = () => {
		Alert.alert('Keluar akun?', 'Anda perlu masuk kembali untuk menggunakan akun ini.', [
			{ text: 'Batal', style: 'cancel' },
			{ text: 'Keluar', style: 'destructive', onPress: () => void handleLogout() },
		]);
	};

	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.content}>
				<Text style={styles.title}>Profil</Text>

				<View style={styles.profile}>
					<View style={styles.avatar}>
						<UserRound size={28} color={colors.primary} />
					</View>
					<Text style={styles.name}>{user?.name ?? 'Customer'}</Text>
					<Text style={styles.email}>{user?.email ?? ''}</Text>
				</View>

				<TouchableOpacity
					accessibilityRole="button"
					onPress={confirmLogout}
					style={styles.logoutButton}
					activeOpacity={0.75}
				>
					<LogOut size={20} color={colors.error} />
					<Text style={styles.logoutLabel}>Keluar</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.surface,
	},
	content: {
		flex: 1,
		padding: spacing.containerMargin,
	},
	title: {
		...typography.headlineLg,
		color: colors.onSurface,
		marginBottom: spacing.stackLg,
	},
	profile: {
		alignItems: 'center',
		backgroundColor: colors.surfaceContainerLowest,
		borderRadius: radius.md,
		padding: spacing.stackXl,
	},
	avatar: {
		width: 64,
		height: 64,
		borderRadius: radius.full,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.primaryFixed,
		marginBottom: spacing.stackMd,
	},
	name: {
		...typography.titleMd,
		color: colors.onSurface,
	},
	email: {
		...typography.bodyMd,
		color: colors.onSurfaceVariant,
		marginTop: spacing.stackSm,
	},
	logoutButton: {
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.stackMd,
		marginTop: spacing.stackLg,
		paddingHorizontal: spacing.stackLg,
		borderRadius: radius.md,
		backgroundColor: colors.surfaceContainerLowest,
		borderWidth: 1,
		borderColor: colors.errorContainer,
	},
	logoutLabel: {
		...typography.labelLg,
		color: colors.error,
	},
});
