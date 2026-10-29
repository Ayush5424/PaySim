import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { PaymentSendPayload, PaymentSendResult, PaymentReceipt, QrPayloadResponse } from '../types/payment';

export const paymentApi = {
  async sendMoney(payload: PaymentSendPayload, idempotencyKey?: string): Promise<PaymentSendResult> {
    return apiClient<PaymentSendResult>(ENDPOINTS.payment.send, {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey,
    });
  },

  async getReceipt(transactionId: string): Promise<PaymentReceipt> {
    return apiClient<PaymentReceipt>(ENDPOINTS.payment.receipt(transactionId));
  },

  getQrImageUrl(upiId: string): string {
    return `${ENDPOINTS.payment.qr(upiId)}?t=${Date.now()}`;
  },

  async getQrPayload(upiId: string): Promise<QrPayloadResponse> {
    return apiClient<QrPayloadResponse>(ENDPOINTS.payment.qrPayload(upiId));
  },
};
