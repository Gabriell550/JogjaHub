import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { bookingApi } from '../../../api/bookingApi';
import type { BookingRecord } from '../../../types/bookingRecord';

export function useTenantBookings() {
  const [records, setRecords] = useState<BookingRecord[]>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setError(false);
    bookingApi.listAllBookings('tenant').then(data => {
      if (active) setRecords(data);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [attempt]));

  return { records, error, reload: () => setAttempt(value => value + 1) };
}
