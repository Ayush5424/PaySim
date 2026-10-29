export interface ParsedUpiData {
  upiId: string;
  name?: string;
  amount?: number;
  note?: string;
  transactionRef?: string;
}

export function buildUpiUri(upiId: string, name?: string, amount?: number, note?: string): string {
  const params = new URLSearchParams();
  params.set('pa', upiId.trim());
  if (name) params.set('pn', name.trim());
  if (amount && amount > 0) params.set('am', amount.toFixed(2));
  params.set('cu', 'INR');
  if (note) params.set('tn', note.trim());
  return `upi://pay?${params.toString()}`;
}

export function parseUpiUri(text: string): ParsedUpiData | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('upi://pay?') || trimmed.startsWith('upi://pay/')) {
    const queryString = trimmed.includes('?') ? trimmed.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    const pa = params.get('pa');
    if (!pa) return null;
    const am = params.get('am');
    return {
      upiId: pa.trim(),
      name: params.get('pn') || pa.split('@')[0],
      amount: am ? parseFloat(am) : undefined,
      note: params.get('tn') || undefined,
      transactionRef: params.get('tr') || undefined,
    };
  }

  // Fallback: If raw text is just a UPI ID
  if (/^[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9.-]+$/.test(trimmed)) {
    return {
      upiId: trimmed,
      name: trimmed.split('@')[0],
    };
  }

  return null;
}
