// services/googlePlayBilling.ts
// Google Play / App Store Billing Service (singleton)
import {
  endConnection,
  getProducts,
  initConnection,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Product,
  ProductPurchase,
  Purchase,
  PurchaseError,
} from "react-native-iap";

export interface BillingProduct {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
}

// Match your Play Console / App Store product ids here
export const WALLET_PRODUCTS = [
  { productId: "add_money_to_wallet_10", amount: 10, price: "₹10" },
  { productId: "add_money_to_wallet_50", amount: 50, price: "₹50" },
  { productId: "add_money_to_wallet_100", amount: 100, price: "₹100" },
  { productId: "add_money_to_wallet_200", amount: 200, price: "₹200" },
  { productId: "add_money_to_wallet_500", amount: 500, price: "₹500" },
];

class GooglePlayBillingService {
  private isInitialized = false;
  private purchaseUpdateSub: any = null;
  private purchaseErrorSub: any = null;

  // if a purchase update arrives, we store it here so callers can pick it up
  private lastPurchase: ProductPurchase | null = null;

  // Initialize billing and set up one-time listeners
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await initConnection();

      // purchase updated listener (only registered once)
      if (!this.purchaseUpdateSub) {
        this.purchaseUpdateSub = purchaseUpdatedListener(
          (purchase: ProductPurchase) => {
            console.log("[Billing] purchaseUpdatedListener fired:", purchase);
            // store latest purchase so purchaseProduct() can resolve
            this.lastPurchase = purchase;
            // DO NOT finishTransaction here; leave finishing to the app's backend verification result.
          }
        );
      }

      if (!this.purchaseErrorSub) {
        this.purchaseErrorSub = purchaseErrorListener((err: PurchaseError) => {
          console.error("[Billing] purchaseErrorListener:", err);
        });
      }

      this.isInitialized = true;
      console.log("[Billing] initialize success");
    } catch (err) {
      console.error("[Billing] initialize failed:", err);
      throw err;
    }
  }

  // Fetch product metadata
  async getProducts(): Promise<BillingProduct[]> {
    if (!this.isInitialized) await this.initialize();

    const skus = WALLET_PRODUCTS.map((p) => p.productId);
    const products: Product[] = await getProducts({ skus });

    return products.map((p) => ({
      productId: p.productId,
      price: p.localizedPrice ?? p.price ?? "",
      currency: p.currency ?? "",
      title: p.title,
      description: p.description,
    }));
  }

  // Start purchase flow for a productId.
  // Resolves with the ProductPurchase (raw) once the listener receives it.
  async purchaseProduct(productId: string): Promise<ProductPurchase> {
    if (!this.isInitialized) await this.initialize();

    // ensure product exists in catalog (helps with "sku not found" errors)
    const products = await getProducts({ skus: [productId] });
    if (!products || products.length === 0) {
      throw new Error(`Product ${productId} not found in store`);
    }

    // clear any previous lastPurchase for safety
    this.lastPurchase = null;

    // Request purchase (react-native-iap will open native UI)
    try {
      await requestPurchase({ skus: [productId] });
    } catch (err) {
      // requestPurchase can throw or return void — bubble up
      console.error("[Billing] requestPurchase error:", err);
      throw err;
    }

    // Wait for the purchaseUpdatedListener to populate lastPurchase
    return await new Promise<ProductPurchase>((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.lastPurchase) {
          clearInterval(interval);
          const p = this.lastPurchase;
          this.lastPurchase = null;
          resolve(p);
        }
      }, 400);

      // Timeout if no listener event
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Purchase timed out or listener did not fire"));
      }, 30000); // 30s timeout
    });
  }

  getProductIdForAmount(amount: number): string {
    const p = WALLET_PRODUCTS.find((x) => x.amount === amount);
    return p ? p.productId : `add_money_to_wallet_${amount}`;
  }

  // For cleanup on app exit
  async cleanup(): Promise<void> {
    try {
      await endConnection();
      this.purchaseUpdateSub?.remove();
      this.purchaseErrorSub?.remove();
      this.purchaseUpdateSub = null;
      this.purchaseErrorSub = null;
      this.isInitialized = false;
      console.log("[Billing] cleaned up");
    } catch (err) {
      console.error("[Billing] cleanup error:", err);
    }
  }
}

export const googlePlayBillingService = new GooglePlayBillingService();
