// utils/paymentUtils.ts
import { googlePlayBillingService } from "@/services/googlePlayBilling";
import { Platform } from "react-native";
import { ProductPurchase } from "react-native-iap";

export interface PaymentOrder {
  amount: number;
  currency?: string;
}

export interface BillingResult {
  productId: string;
  platform: "android" | "ios";
  purchaseToken?: string; // Android
  transactionReceipt?: string; // iOS
  transactionId?: string; // iOS
  signatureAndroid?: string | undefined; // Android optional
  orderIdAndroid?: string | undefined; // some Android clients include an order id field, optional
  rawPurchase: ProductPurchase; // the raw purchase object to pass to finishTransaction
}

// Initiates the native purchase flow and returns both normalized fields and the raw purchase
export const initiateGooglePlayBilling = async (
  order: PaymentOrder
): Promise<BillingResult> => {
  // get product id for the requested amount
  const productId = googlePlayBillingService.getProductIdForAmount(order.amount);
  console.log("[PaymentUtils] mapped amount -> productId:", productId);

  // start purchase and wait for listener to deliver the ProductPurchase
  const purchase: ProductPurchase = await googlePlayBillingService.purchaseProduct(productId);
  console.log("[PaymentUtils] raw purchase object:", purchase);

  if (!purchase || !purchase.productId) {
    throw new Error("Invalid purchase returned by store");
  }

  const platform = Platform.OS === "android" ? "android" : "ios";

  const result: BillingResult = {
    productId: purchase.productId,
    platform,
    rawPurchase: purchase,
  };

  if (platform === "android") {
    if (!purchase.purchaseToken) {
      // Android must provide purchaseToken for server verification
      throw new Error("Android purchase missing purchaseToken");
    }
    result.purchaseToken = purchase.purchaseToken;
    // optional/android-specific fields
    result.signatureAndroid = (purchase as any).signatureAndroid ?? (purchase as any).signature ?? undefined;
    result.orderIdAndroid = (purchase as any).orderId ?? undefined;
  } else {
    // iOS
    if (!purchase.transactionReceipt && !purchase.purchaseToken) {
      // iOS uses transactionReceipt or transactionId for server verification
      throw new Error("iOS purchase missing transactionReceipt");
    }
    result.purchaseToken = purchase.jwsRepresentationIos ?? undefined;
    result.transactionReceipt = purchase.transactionReceipt;
    result.transactionId = (purchase as any).transactionId ?? undefined;
  }

  return result;
};

// Format currency for display
export const formatCurrency = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Validate payment amount (same as before)
export const validateAmount = (amount: string): { isValid: boolean; error?: string } => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return { isValid: false, error: "Please enter a valid amount" };
  if (numAmount <= 0) return { isValid: false, error: "Amount must be greater than 0" };
  if (numAmount < 10) return { isValid: false, error: "Minimum amount is ₹10" };
  if (numAmount > 500) return { isValid: false, error: "Maximum amount is ₹500" };
  return { isValid: true };
};