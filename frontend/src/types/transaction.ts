export type TransactionStatus = 'SUCCESS' | 'PROCESSING' | 'INITIATED' | 'FAILED' | 'PENDING';

export interface Transaction {
  id: number;
  transactionId: string;
  referenceId: string;
  senderUpi: string;
  receiverUpi: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: string;
  idempotencyKey?: string;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedTransactions {
  content: Transaction[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
