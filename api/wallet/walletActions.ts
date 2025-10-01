// Wallet API Actions
import { CONFIG } from '@/Constants/config';

const API_BASE_URL = CONFIG.API_BASE_URL;
console.log('Wallet API Base URL:', API_BASE_URL);

// Types
export interface WalletBalance {
  id: string;
  balance: number;
  currency: string;
  type: string;
  status: string;
  totalLoaded: number;
  totalSpent: number;
  totalReceived: number;
  lastTransactionAt: string;
  recentTransfers: any[];
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
  status: string;
}

export interface BankAccount {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

// Wallet Load APIs
export const getWalletDetails = async (token: string) => {
  try {
    console.log('Fetching wallet details with token:', token?.substring(0, 10) + '...');
    const res = await fetch(`${API_BASE_URL}/wallet/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const responseText = await res.text();
    console.log('Wallet details raw response:', responseText);

    if (!res.ok) {
      let errorMessage = "Failed to get wallet details";
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.message || errorMessage;
      } catch (parseError) {
        errorMessage = `HTTP ${res.status}: ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (error) {
    console.error('getWalletDetails error:', error);
    throw error;
  }
};

export const createWalletLoadOrder = async (token: string, amount: number) => {
  const res = await fetch(`${API_BASE_URL}/wallet/load/create-order`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create load order");
  }
  // console.log('Wallet load order created:', await res);
  return await res.json();
};

export const verifyWalletLoad = async (
  token: string, 
  // orderIdOrTransactionId: string, 
  productId: string,
  receiptOrToken: string,
  amount: number,
  platform: string
) => {
  console.log('Verifying wallet load with:', { productId, receiptOrToken, amount, platform });
  const res = await fetch(`${API_BASE_URL}/wallet/load/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      google_purchase_token: receiptOrToken,
      google_product_id: productId,
      // google_order_id: orderIdOrTransactionId,
      amount,
      platform
    })
  });

  console.log('Verify wallet load response status:', res);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Google Play Billing verification failed");
  }

  return await res.json();
};

// Transfer APIs
export const transferForSeries = async (token: string, seriesId: string, amount: number) => {
  const res = await fetch(`${API_BASE_URL}/wallet/transfer-series`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ seriesId, amount })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Transfer failed");
  }

  return await res.json();
};

export const transferCommunityFee = async (token: string, communityId: string, amount: number) => {
  const res = await fetch(`${API_BASE_URL}/wallet/transfer/community-fee`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ communityId, amount })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Transfer failed");
  }

  return await res.json();
};

// Transaction History APIs
export const getTransactionHistory = async (
  token: string, 
  page: number = 1, 
  limit: number = 10
) => {
  const url = `${API_BASE_URL}/wallet/transactions?page=${page}&limit=${limit}`;
  console.log('📊 Fetching transaction history from:', url);
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  console.log('📊 Transaction history response status:', res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Transaction history error response:', errorText);
    throw new Error(`Failed to get transaction history: ${res.status}`);
  }

  return await res.json();
};

export const getGiftHistory = async (
  token: string, 
  page: number = 1, 
  limit: number = 10
) => {
  const url = `${API_BASE_URL}/wallet/gifts?page=${page}&limit=${limit}`;
  console.log('🎁 Fetching gift history from:', url);
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  console.log('🎁 Gift history response status:', res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Gift history error response:', errorText);
    throw new Error(`Failed to get gift history: ${res.status}`);
  }

  return await res.json();
};

// Withdrawal APIs
export const setupBankAccount = async (
  token: string, 
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  }
) => {
  const res = await fetch(`${API_BASE_URL}/withdrawal/setup-bank`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bankDetails)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Invalid bank details");
  }

  return await res.json();
};

export const createWithdrawalRequest = async (token: string, amount: number) => {
  console.log('withdrawing', amount)
  const res = await fetch(`${API_BASE_URL}/withdrawal/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create withdrawal request");
  }

  return await res.json();
};

export const getWithdrawalHistory = async (
  token: string, 
  page: number = 1, 
  limit: number = 10
) => {
  const res = await fetch(`${API_BASE_URL}/withdrawal/history?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to get withdrawal history");
  }

  return await res.json();
};

export const getWithdrawalStatus = async (token: string, withdrawalId: string) => {
  const res = await fetch(`${API_BASE_URL}/withdrawal/status/${withdrawalId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Withdrawal not found");
  }

  return await res.json();
};