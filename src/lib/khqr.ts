import { BakongKHQR, MerchantInfo, khqrData } from 'bakong-khqr';
import QRCode from 'qrcode';

export interface KHQRGenerateResult {
  qrString: string;
  qrDataUrl: string;
  md5: string;
}

export async function generateKHQR(
  orderId: string,
  amount: number,
  currency: 'USD' | 'KHR' = 'USD'
): Promise<KHQRGenerateResult> {
  const currencyCode = currency === 'USD' ? khqrData.currency.usd : khqrData.currency.khr;

  // KHQR merchantID has a max length limit — strip dashes and truncate UUID
  const shortId = orderId.replace(/-/g, '').substring(0, 25);

  const bakongAccount = process.env.NEXT_PUBLIC_BAKONG_ACCOUNT_ID || 'rithstore@acleda';
  const merchantName = process.env.NEXT_PUBLIC_BAKONG_MERCHANT_NAME || 'RITH STORE';
  const merchantCity = process.env.NEXT_PUBLIC_BAKONG_CITY || 'Phnom Penh';

  // Create MerchantInfo — constructor sets merchantID and acquiringBank
  // but doesn't properly set currency/amount, we must set them explicitly
  const merchantInfo = new MerchantInfo(
    bakongAccount,
    merchantName,
    merchantCity,
    shortId,
    currencyCode,
    amount
  );

  // Explicitly set currency and amount (constructor swaps currency/acquiringBank)
  merchantInfo.currency = currencyCode;
  merchantInfo.amount = amount;

  // Set bill number and labels for transaction tracking
  merchantInfo.billNumber = shortId;
  merchantInfo.storeLabel = merchantName;
  merchantInfo.terminalLabel = 'WEB';

  // Dynamic QR requires expiration timestamp (milliseconds since epoch)
  merchantInfo.expirationTimestamp = String(Date.now() + 10 * 60 * 1000); // 10 minutes

  const khqr = new BakongKHQR();
  const result = khqr.generateMerchant(merchantInfo);

  if (result.status.code !== 0) {
    throw new Error(`KHQR generation failed: ${result.status.message || 'Unknown error'} (code: ${result.status.errorCode})`);
  }

  const qrString = result.data.qr;
  const md5 = result.data.md5;

  // Generate QR image as data URL
  const qrDataUrl = await QRCode.toDataURL(qrString, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  return { qrString, qrDataUrl, md5 };
}
