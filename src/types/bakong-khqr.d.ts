declare module 'bakong-khqr' {
  export class MerchantInfo {
    bakongAccountID: string;
    accountInformation: string;
    acquiringBank: number;
    currency: number;
    amount: number;
    merchantName: string;
    merchantCity: string;
    billNumber: string;
    storeLabel: string;
    terminalLabel: string;
    mobileNumber: string;
    purposeOfTransaction: string;
    languagePreference: string;
    merchantNameAlternateLanguage: string;
    merchantCityAlternateLanguage: string;
    upiMerchantAccount: string;
    expirationTimestamp: string;
    merchantCategoryCode: string;
    merchantID: string;

    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      billNumber: string,
      currency: number,
      amount: number
    );
  }

  export class IndividualInfo {
    bakongAccountID: string;
    accountInformation: string;
    acquiringBank: number;
    currency: number;
    amount: number;
    merchantName: string;
    merchantCity: string;
    billNumber: string;
    storeLabel: string;
    terminalLabel: string;
    mobileNumber: string;
    purposeOfTransaction: string;
    languagePreference: string;
    merchantNameAlternateLanguage: string;
    merchantCityAlternateLanguage: string;
    upiMerchantAccount: string;
    expirationTimestamp: string;
    merchantCategoryCode: string;

    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      currency: number,
      amount: number
    );
  }

  export interface KHQRStatus {
    code: number;
    errorCode: string | null;
    message: string | null;
  }

  export interface KHQRResult {
    status: KHQRStatus;
    data: {
      qr: string;
      md5: string;
    };
  }

  export class BakongKHQR {
    generateIndividual(info: IndividualInfo): KHQRResult;
    generateMerchant(info: MerchantInfo): KHQRResult;

    static decode(qrString: string): any;
    static decodeNonKhqr(qrString: string): any;
    static verify(qrString: string): any;
    static generateDeepLink(
      url: string,
      qrString: string,
      sourceInfo: any
    ): any;
    static checkBakongAccount(
      token: string,
      accountID: string
    ): Promise<any>;
  }

  export const khqrData: {
    currency: {
      usd: number;
      khr: number;
    };
    merchantType: {
      merchant: string;
      individual: string;
    };
  };

  export class SourceInfo {
    constructor(
      appName: string,
      appIconUrl: string,
      appDeepLinkCallback: string
    );
  }
}
