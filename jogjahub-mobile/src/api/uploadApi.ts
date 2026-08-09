// Upload generik: dokumen verifikasi vendor, foto layanan, dsb.
import { apiClient } from './client';

export const uploadApi = {
  uploadFile: (formData: FormData) =>
    apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
