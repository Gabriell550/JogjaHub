import { useState } from 'react';
import { vendorApi } from '../../../api/vendorApi';

type ResubmitDocument = {
  uri: string;
  name?: string;
  type?: string;
};

type ResubmitPayload = {
  ktpFile?: ResubmitDocument | null;
  nibFile?: ResubmitDocument | null;
  portfolioFile?: ResubmitDocument | null;
};

const getErrorMessage = (err: any, fallback: string) => {
  const errors = err?.response?.data?.errors;
  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => typeof value === 'string');

    if (firstError) return firstError;
  }

  return err?.response?.data?.message ?? fallback;
};

// Pengajuan ulang pendaftaran tenant rejected (issue #59).
// Payload HANYA berisi file dokumen — data profil lama dipertahankan backend.
export function useResubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resubmit = async (payload: ResubmitPayload) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (payload.ktpFile?.uri) {
        // @ts-ignore — object multipart khas React Native/Expo (bukan File browser).
        formData.append('ktp', {
          uri: payload.ktpFile.uri,
          name: payload.ktpFile.name ?? 'ktp.jpg',
          type: payload.ktpFile.type ?? 'image/jpeg',
        });
      }

      if (payload.nibFile?.uri) {
        // @ts-ignore
        formData.append('nib', {
          uri: payload.nibFile.uri,
          name: payload.nibFile.name ?? 'nib.jpg',
          type: payload.nibFile.type ?? 'image/jpeg',
        });
      }

      if (payload.portfolioFile?.uri) {
        // @ts-ignore
        formData.append('portfolio', {
          uri: payload.portfolioFile.uri,
          name: payload.portfolioFile.name ?? 'portfolio.pdf',
          type: payload.portfolioFile.type ?? 'application/pdf',
        });
      }

      await vendorApi.resubmitProfile(formData);

      return { success: true as const };
    } catch (err: any) {
      console.log('RESUBMIT ERROR:', err?.response?.status, JSON.stringify(err?.response?.data));
      const message = getErrorMessage(err, 'Gagal mengirim dokumen. Status pendaftaran tetap ditolak.');
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  };

  return { resubmit, loading, error };
}
