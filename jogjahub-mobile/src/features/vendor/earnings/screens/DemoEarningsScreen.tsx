import React from 'react';
import { Text } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { demoEscrowApi } from '../../../../api/demoEscrowApi';
import type { VendorDashboardStackParamList, VendorTabParamList } from '../../../../navigation/types';
import { bookingLabel, fundStatusLabel } from '../../../../types/bookingRecord';
import DemoEscrowList, { EscrowButton, escrowStyles } from '../../../shared/payments/DemoEscrowList';

type Props = NativeStackScreenProps<VendorDashboardStackParamList, 'DemoEarnings'>;

export default function DemoEarningsScreen({ navigation }: Props) {
  const tabs = navigation.getParent<BottomTabNavigationProp<VendorTabParamList>>();
  const openDestination = () => tabs?.navigate('Profile', { screen: 'DemoPayoutDestination', initial: false });

  return (
    <DemoEscrowList load={demoEscrowApi.earnings} emptyMessage="Belum ada pembayaran demo."
      header={<EscrowButton label="Pengaturan Tujuan Pencairan" onPress={openDestination} />}
      renderOrder={order => (
        <>
          <Text style={escrowStyles.heading}>{bookingLabel(order)} · {order.service?.name ?? 'Pesanan'}</Text>
          <Text>Rp {Number(order.total_amount ?? 0).toLocaleString('id-ID')}</Text>
          {order.payment?.fund_status && <Text>{fundStatusLabel[order.payment.fund_status]}</Text>}
          {!!order.payment?.payout_destination && <Text>Tujuan {order.payment.payout_destination}</Text>}
          {order.payment?.payout_waiting_for_destination && <Text>Tambahkan tujuan pencairan melalui Profil untuk melanjutkan.</Text>}
          {!!order.issue_reported_at && !order.issue_resolved_at && <Text>Komplain sedang ditangani admin.</Text>}
          <EscrowButton label="Detail pesanan"
            onPress={() => tabs?.navigate('Orders', { screen: 'OrderDetail', params: { id: order.uuid }, initial: false })} />
        </>
      )}
    />
  );
}
