import React, { useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { apiErrorMessage } from '../../../../api/apiErrorMessage';
import { demoEscrowApi } from '../../../../api/demoEscrowApi';
import { bookingLabel, fundStatusLabel, type BookingRecord } from '../../../../types/bookingRecord';
import DemoEscrowList, { EscrowButton, escrowStyles } from '../../../shared/payments/DemoEscrowList';

export default function TransactionMonitoringScreen() {
  return (
    <DemoEscrowList load={demoEscrowApi.cases} emptyMessage="Tidak ada komplain terbuka atau pencairan yang perlu ditangani."
      renderOrder={(order, reload) => <EscrowCase order={order} reload={reload} />} />
  );
}

function EscrowCase({ order, reload }: { order: BookingRecord; reload: () => void }) {
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const open = !!order.issue_reported_at && !order.issue_resolved_at;
  const payment = order.payment;

  async function submit() {
    if (busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setError('');
    try {
      if (open) await demoEscrowApi.resolve(order.uuid, resolution.trim());
      else await demoEscrowApi.retry(order.uuid);
      reload();
    } catch (error) {
      setError(apiErrorMessage(error, 'Status gagal diperbarui.'));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <Text style={escrowStyles.heading}>{bookingLabel(order)} · {order.service?.name ?? 'Pesanan'}</Text>
      <Text>{order.customer?.name ?? 'Customer'} · {order.service?.tenant?.business_name ?? 'Tenant'}</Text>
      <Text>Rp {Number(order.total_amount ?? 0).toLocaleString('id-ID')}</Text>
      {payment?.fund_status && <Text>{fundStatusLabel[payment.fund_status]}</Text>}
      {!!payment?.payout_destination && <Text>Tujuan {payment.payout_destination}</Text>}
      {payment?.payout_waiting_for_destination && <Text>Tenant perlu menyimpan tujuan pencairan di Pengaturan Toko.</Text>}
      {open && (
        <>
          <Text style={escrowStyles.heading}>Komplain customer</Text>
          <Text>{order.completion_issue}</Text>
          <TextInput accessibilityLabel="Catatan penyelesaian" placeholder="Tulis catatan penyelesaian"
            style={escrowStyles.input} value={resolution} onChangeText={setResolution} editable={!submitting}
            maxLength={1000} multiline />
          <EscrowButton label={submitting ? 'Menyimpan…' : 'Selesaikan komplain'}
            disabled={submitting || !resolution.trim()} onPress={() => void submit()} />
        </>
      )}
      {!open && payment?.fund_status === 'failed' && (
        <EscrowButton label={submitting ? 'Memproses…' : 'Coba lagi pencairan'} disabled={submitting} onPress={() => void submit()} />
      )}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </>
  );
}
