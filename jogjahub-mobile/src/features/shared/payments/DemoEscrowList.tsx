import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { apiErrorMessage } from '../../../api/apiErrorMessage';
import { demoModeLabel, type EscrowPage } from '../../../api/demoEscrowApi';
import { colors, radius, typography } from '../../../constants/theme';
import type { BookingRecord } from '../../../types/bookingRecord';

type Props = {
  load: (page: number) => Promise<{ data: EscrowPage }>;
  emptyMessage: string;
  header?: ReactNode;
  renderOrder: (order: BookingRecord, reload: () => void) => ReactNode;
};

export default function DemoEscrowList({ load, emptyMessage, header, renderOrder }: Props) {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<EscrowPage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const focused = useIsFocused();
  const reload = useCallback(() => setAttempt(value => value + 1), []);

  useFocusEffect(useCallback(() => {
    let active = true;
    setError('');
    setLoading(true);
    load(page).then(({ data }) => {
      if (!active) return;
      if (page > data.meta.last_page) setPage(data.meta.last_page);
      else setResult(data);
    }).catch(error => {
      if (active) setError(apiErrorMessage(error, 'Daftar gagal dimuat.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, load, page]));

  useEffect(() => {
    if (!focused || loading || error || !result?.data.some(order => order.payment?.fund_status === 'processing')) return;
    const timer = setTimeout(reload, 3500);
    return () => clearTimeout(timer);
  }, [error, focused, loading, reload, result]);

  const visible = result?.meta.current_page === page ? result : undefined;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={escrowStyles.content}>
      <Text style={escrowStyles.notice}>{demoModeLabel}</Text>
      {header}
      {loading && <ActivityIndicator accessibilityLabel="Memuat transaksi demo" />}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      {visible?.data.map(order => <View key={order.uuid} style={escrowStyles.card}>{renderOrder(order, reload)}</View>)}
      {!loading && !error && visible?.data.length === 0 && <Text>{emptyMessage}</Text>}
      <View style={escrowStyles.actions}>
        {page > 1 && <EscrowButton label="Sebelumnya" disabled={loading} onPress={() => setPage(page - 1)} />}
        {visible && page < visible.meta.last_page && <EscrowButton label="Berikutnya" disabled={loading} onPress={() => setPage(page + 1)} />}
        <EscrowButton label="Muat ulang" disabled={loading} onPress={reload} />
      </View>
    </ScrollView>
  );
}

export function EscrowButton({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress} style={[escrowStyles.button, disabled && escrowStyles.disabled]}>
      <Text style={escrowStyles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export const escrowStyles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32, gap: 12, flexGrow: 1, backgroundColor: colors.surface },
  card: { gap: 8, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLowest },
  heading: { ...typography.titleMd, color: colors.navy },
  notice: { color: colors.onPrimaryFixed, backgroundColor: colors.primaryFixed, borderRadius: radius.md, padding: 12 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: colors.navy, borderRadius: radius.md },
  buttonLabel: { ...typography.labelLg, color: colors.onNavy, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 48, color: colors.onSurface, padding: 12, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md },
  option: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md },
  selected: { backgroundColor: colors.primaryFixed, borderColor: colors.primary },
});
