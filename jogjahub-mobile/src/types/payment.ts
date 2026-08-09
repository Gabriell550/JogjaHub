export interface PaymentProof {
  id: string;
  bookingId: string;
  fileUrl: string;
  status: 'submitted' | 'verified' | 'rejected';
}
