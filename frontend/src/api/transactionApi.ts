import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { Transaction, PagedTransactions } from '../types/transaction';

export interface TransactionFilterParams {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const transactionApi = {
  async getMyTransactions(upiId: string): Promise<Transaction[]> {
    const res = await apiClient<Transaction[] | { data: Transaction[] }>(
      ENDPOINTS.user.transactions(upiId)
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as { data: Transaction[] }).data)) {
      return (res as { data: Transaction[] }).data;
    }
    return [];
  },

  async getPagedTransactions(params: TransactionFilterParams = {}): Promise<PagedTransactions> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.status) searchParams.set('status', params.status);
    if (params.minAmount !== undefined) searchParams.set('minAmount', params.minAmount.toString());
    if (params.maxAmount !== undefined) searchParams.set('maxAmount', params.maxAmount.toString());

    const qs = searchParams.toString();
    const url = `${ENDPOINTS.transaction.paged}${qs ? `?${qs}` : ''}`;
    return apiClient<PagedTransactions>(url);
  },
};
