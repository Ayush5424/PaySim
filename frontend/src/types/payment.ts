export interface PaymentSendPayload {
  fromUpi: string;
  toUpi: string;
  amount: number;
  pin: string;
}

export interface PaymentSendResult {
  transactionId: string;
  referenceId?: string;
  fromUpi: string;
  toUpi: string;
  amount: number;
  currency?: string;
  status: string;
  timestamp?: string;
  message?: string;
}

export interface PaymentReceipt {
  transactionId: string;
  referenceId: string;
  senderUpi: string;
  senderName: string;
  receiverUpi: string;
  receiverName: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  timestamp: string;
  failureReason?: string | null;
}

export interface QrPayloadResponse {
  upiId: string;
  name: string;
  payload: string;
}
