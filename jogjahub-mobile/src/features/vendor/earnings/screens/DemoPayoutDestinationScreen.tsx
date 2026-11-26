import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { demoEscrowApi, demoModeLabel, type DemoDestination } from '../../../../api/demoEscrowApi';
import { EscrowButton, escrowStyles } from '../../../shared/payments/DemoEscrowList';

const empty: DemoDestination = { type: 'bank', provider: '', number: '', holder: '' };
const options = [
  { type: 'bank', label: 'Bank' },
  { type: 'gopay', label: 'GoPay' },
  { type: 'dana', label: 'DANA' },
] as const;

export default function DemoPayoutDestinationScreen() {
  const [form, setForm] = useState<DemoDestination>(empty);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const busy = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    demoEscrowApi.destination().then(({ data }) => {
      if (active) {
        setForm(data.data ?? empty);
        setSaveError('');
      }
    }).catch(error => {
      if (active) setLoadError(apiErrorMessage(error, 'Tujuan pencairan gagal dimuat.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]));

  const bank = form.type === 'bank';
  const numberLabel = bank ? 'Nomor rekening contoh' : 'Nomor HP contoh';
  const change = (value: Partial<DemoDestination>) => setForm(current => ({ ...current, ...value }));

  async function save() {
    if (busy.current) return;
    if (!form.holder.trim() || (bank && !form.provider.trim()) || !/^\d{6,24}$/.test(form.number)) {
      setSaveError('Isi nama pemilik, nama bank jika dipilih, dan nomor contoh dengan 6–24 digit.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await demoEscrowApi.saveDestination(form);
      setForm(data.data);
      Alert.alert('Tujuan pencairan disimpan', 'Dana demo yang memenuhi syarat akan diproses otomatis.');
    } catch (error) {
      setSaveError(apiErrorMessage(error, 'Tujuan pencairan gagal disimpan.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={escrowStyles.content}>
      <Text style={escrowStyles.notice}>{demoModeLabel}</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Memuat tujuan pencairan" /> : loadError ? (
        <>
          <Text accessibilityRole="alert">{loadError}</Text>
          <EscrowButton label="Coba lagi" onPress={() => setAttempt(value => value + 1)} />
        </>
      ) : (
        <>
          <Text>Gunakan data contoh untuk tujuan pencairan.</Text>
          <Text style={escrowStyles.heading}>Jenis tujuan</Text>
          <View style={escrowStyles.actions}>
            {options.map(option => (
              <Pressable key={option.type} accessibilityRole="radio"
                accessibilityState={{ checked: form.type === option.type, disabled: saving }}
                disabled={saving} onPress={() => { if (form.type !== option.type) change({ type: option.type, provider: '', number: '' }); }}
                style={[escrowStyles.option, form.type === option.type && escrowStyles.selected]}>
                <Text>{form.type === option.type ? '✓ ' : ''}{option.label}</Text>
              </Pressable>
            ))}
          </View>
          {bank && <>
            <Text>Nama bank</Text>
            <TextInput accessibilityLabel="Nama bank" placeholder="BCA" style={escrowStyles.input}
              maxLength={50} editable={!saving} value={form.provider} onChangeText={provider => change({ provider })} />
          </>}
          <Text>{numberLabel}</Text>
          <TextInput accessibilityLabel={numberLabel} placeholder={bank ? '0000001234' : '080000001234'}
            style={escrowStyles.input} keyboardType="number-pad" maxLength={24} editable={!saving}
            value={form.number} onChangeText={number => change({ number })} />
          <Text>Nama pemilik</Text>
          <TextInput accessibilityLabel="Nama pemilik" placeholder="Pemilik Demo" style={escrowStyles.input}
            maxLength={100} editable={!saving} value={form.holder} onChangeText={holder => change({ holder })} />
          {saveError ? <Text accessibilityRole="alert">{saveError}</Text> : null}
          <EscrowButton label={saving ? 'Menyimpan…' : 'Simpan tujuan'} disabled={saving} onPress={() => void save()} />
        </>
      )}
    </ScrollView>
  );
}
