// Bakong API transaction verification
// Uses your Bakong API token to check if a payment has been received

const BAKONG_API_URL = process.env.BAKONG_API_URL ||
  (process.env.BAKONG_USE_SANDBOX === 'true'
    ? 'https://sit-api-bakong.nbc.gov.kh'
    : 'https://api-bakong.nbc.gov.kh');

export interface BakongTransaction {
  hash: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description: string;
  createdDate: string;
}

/**
 * Check transaction status by MD5 hash of the KHQR string
 * This uses the Bakong Open API to verify if a payment was received
 */
export async function checkTransactionByMD5(
  md5: string
): Promise<{ paid: boolean; transaction?: BakongTransaction }> {
  const token = process.env.BAKONG_API_TOKEN;

  if (!token) {
    console.log('[Bakong] API token not configured');
    return { paid: false };
  }

  try {
    const response = await fetch(
      `${BAKONG_API_URL}/v1/check_transaction_by_md5`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ md5 }),
      }
    );

    if (!response.ok) {
      console.error('[Bakong] API error:', response.status, await response.text());
      return { paid: false };
    }

    const data = await response.json();

    // Bakong API returns responseCode 0 for success
    if (data.responseCode === 0 && data.data) {
      return {
        paid: true,
        transaction: data.data as BakongTransaction,
      };
    }

    return { paid: false };
  } catch (error) {
    console.error('[Bakong] API request failed:', error);
    return { paid: false };
  }
}

/**
 * Alternative: Check transaction by hash
 */
export async function checkTransactionByHash(
  hash: string
): Promise<{ paid: boolean; transaction?: BakongTransaction }> {
  const token = process.env.BAKONG_API_TOKEN;

  if (!token) {
    return { paid: false };
  }

  try {
    const response = await fetch(
      `${BAKONG_API_URL}/v1/check_transaction_by_hash`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hash }),
      }
    );

    if (!response.ok) {
      return { paid: false };
    }

    const data = await response.json();

    if (data.responseCode === 0 && data.data) {
      return {
        paid: true,
        transaction: data.data as BakongTransaction,
      };
    }

    return { paid: false };
  } catch (error) {
    console.error('[Bakong] Hash check failed:', error);
    return { paid: false };
  }
}
