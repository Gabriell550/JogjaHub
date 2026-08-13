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
  idCardFile: SelectedDocument;
  businessLicenseFile: SelectedDocument;
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

// Dipakai bareng oleh RegisterCustomerScreen & RegisterVendorScreen — dua fungsi terpisah
// karena bentuk payload-nya beda (vendor multipart dengan file, customer JSON biasa).
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
      formData.append('address', payload.address);
      formData.append('phone', payload.phone);
      formData.append('email', payload.email);
      formData.append('password', payload.password);
      formData.append('password_confirmation', payload.passwordConfirmation);

      payload.categories.forEach((categoryId) => formData.append('categories[]', categoryId));

      // @ts-ignore - format file React Native (uri/name/type), bukan File API browser biasa
      formData.append('id_card', {
        uri: payload.idCardFile.uri,
        name: payload.idCardFile.name ?? 'id_card.pdf',
        type: payload.idCardFile.type ?? 'application/octet-stream',
      });
      // @ts-ignore
      formData.append('business_license', {
        uri: payload.businessLicenseFile.uri,
        name: payload.businessLicenseFile.name ?? 'business_license.pdf',
        type: payload.businessLicenseFile.type ?? 'application/octet-stream',
      });

      await authApi.registerVendor(formData);
      return { success: true as const };
    } catch (err: any) {
      const message = getErrorMessage(err, 'Registrasi gagal. Coba lagi.');
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  };

  return { registerCustomer, registerVendor, loading, error };
}
