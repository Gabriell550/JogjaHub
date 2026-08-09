// Helper bikin FormData dari file lokal (foto layanan, dokumen verifikasi, bukti bayar).
export function buildFileFormData(fieldName: string, uri: string, name: string, type: string) {
  const formData = new FormData();
  // @ts-ignore - RN FormData file object
  formData.append(fieldName, { uri, name, type });
  return formData;
}
