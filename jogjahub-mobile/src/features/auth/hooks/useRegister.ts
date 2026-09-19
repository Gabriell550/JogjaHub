import { useState } from 'react';
import { authApi } from '../../../api/authApi';

type SelectedDocument = {
  uri: string;
  name?: string;
  type?: string;
};

type RegisterCustomerPayload = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
};

type RegisterVendorPayload = {
  businessName: string;
  categories: string[];
  address: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  // File documents will be uploaded here. Note: currently backend may process these via 
  // ProfileController@update later, but we prepare the payload format.
  ktpFile?: SelectedDocument;
  nibFile?: SelectedDocument;
  portfolioFile?: SelectedDocument;
};

const categoryValueMap: Record<string, string> = {
  salon_mua: 'Beauty & Style',
  butik_wisuda: 'Beauty & Style',
  penginapan: 'Penginapan',
  selempang_plakat: 'Gifting',
  akrilik: 'Gifting',
  florist: 'Gifting',
  beauty_and_style: 'Beauty & Style',
  gifting: 'Gifting',
  hotel: 'Penginapan',
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

// Dipakai bareng oleh RegisterCustomerScreen & RegisterVendorScreen
export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerCustomer = async (payload: RegisterCustomerPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.registerCustomer({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation,
        phone: payload.phone,
      });
      return { success: true as const };
    } catch (err: any) {
      const message = getErrorMessage(err, 'Registrasi gagal. Coba lagi.');
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  };

  const registerVendor = async (payload: RegisterVendorPayload) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', payload.businessName);
      formData.append('business_name', payload.businessName);
      formData.append('address', payload.address);
      formData.append('phone', payload.phone);
      formData.append('email', payload.email);
      formData.append('password', payload.password);
      formData.append('password_confirmation', payload.passwordConfirmation);

      payload.categories.forEach((categoryId) => {
        const normalizedCategory = categoryValueMap[categoryId] ?? categoryId;
        formData.append('categories[]', normalizedCategory);
      });

      if (payload.ktpFile?.uri) {
        // @ts-ignore
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

      await authApi.registerVendor(formData);
      return { success: true as const };
    } catch (err: any) {
      console.log('REGISTER VENDOR ERROR:', JSON.stringify(err?.response?.data), err?.response?.status, err?.message);
      const message = getErrorMessage(err, 'Registrasi gagal. Coba lagi.');
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  };

  return { registerCustomer, registerVendor, loading, error };
}
