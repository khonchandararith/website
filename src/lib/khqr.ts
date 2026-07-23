import { BakongKHQR, MerchantInfo, IndividualInfo, khqrData } from 'bakong-khqr';
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

  // KHQR billNumber has a max length limit — strip dashes and truncate UUID
  const shortId = orderId.replace(/-/g, '').substring(0, 25);

  const bakongAccount = process.env.NEXT_PUBLIC_BAKONG_ACCOUNT_ID || 'rithstore@acleda';
  const merchantName = process.env.NEXT_PUBLIC_BAKONG_MERCHANT_NAME || 'RITH STORE';
  const merchantCity = process.env.NEXT_PUBLIC_BAKONG_CITY || 'Phnom Penh';

  const khqr = new BakongKHQR();
  let result;

  // Personal Bakong Account IDs (e.g. user@aclb, 012345678@abaa) require Tag 29 (generateIndividual)
  // for full cross-bank compatibility with ABA Mobile, ACLEDA, Wing, and all Bakong apps.
  if (bakongAccount.includes('@')) {
    const individualInfo = new IndividualInfo(
      bakongAccount,
      merchantName,
      merchantCity,
      currencyCode,
      amount
    );
    individualInfo.currency = currencyCode;
    individualInfo.amount = amount;
    individualInfo.billNumber = shortId;
    individualInfo.storeLabel = merchantName;
    individualInfo.terminalLabel = 'WEB';
    individualInfo.expirationTimestamp = String(Date.now() + 10 * 60 * 1000); // 10 minutes

    result = khqr.generateIndividual(individualInfo);
  } else {
    // Registered Corporate KHQR Merchant Accounts use Tag 30 (generateMerchant)
    const merchantInfo = new MerchantInfo(
      bakongAccount,
      merchantName,
      merchantCity,
      shortId,
      currencyCode,
      amount
    );
    merchantInfo.currency = currencyCode;
    merchantInfo.amount = amount;
    merchantInfo.billNumber = shortId;
    merchantInfo.storeLabel = merchantName;
    merchantInfo.terminalLabel = 'WEB';
    merchantInfo.expirationTimestamp = String(Date.now() + 10 * 60 * 1000); // 10 minutes

    result = khqr.generateMerchant(merchantInfo);
  }

  if (result.status.code !== 0 || !result.data) {
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
