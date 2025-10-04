import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getWalletDetails,
  createWalletLoadOrder,
  verifyWalletLoad,
  transferForSeries,
  transferCommunityFee,
  getTransactionHistory,
  getGiftHistory,
  setupBankAccount,
  createWithdrawalRequest,
  getWithdrawalHistory,
  getWithdrawalStatus,
  WalletBalance,
  Transaction,
  BankAccount,
  WithdrawalRequest
} from '@/api/wallet/walletActions';

export const useWallet = (token: string) => {
  const [walletData, setWalletData] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const lastFetchedToken = useRef<string>('');
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  // Fetch wallet details
  const fetchWalletDetails = useCallback(async (force: boolean = false) => {
    if (!token) return;
    
    // Prevent rapid successive calls unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < FETCH_COOLDOWN) {
      console.log('Skipping wallet fetch due to cooldown');
      return;
    }
    lastFetchTime.current = now;
    
    try {
      console.log('Fetching wallet details for token:', token.substring(0, 10) + '...');
      setIsLoading(true);
      setError(null);
      const response = await getWalletDetails(token);
      console.log('Wallet details fetched successfully');
      setWalletData(response.wallet);
    } catch (err: any) {
      console.error('Error fetching wallet details:', err);
      setError(`Wallet Details Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Create load order
  const createLoadOrder = async (amount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await createWalletLoadOrder(token, amount);
      console.log('Wallet load order response:', response);
      return response.success;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

   // Verify Google Play Billing payment
  const verifyPayment = async (productId: string, receiptOrToken: string, amount: number, platform: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await verifyWalletLoad(token, productId, receiptOrToken, amount, platform);
      await fetchWalletDetails(); // Refresh wallet data
      return response.transaction;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer for series
  const transferSeries = async (seriesId: string, amount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transferForSeries(token, seriesId, amount);
      await fetchWalletDetails(); // Refresh wallet data
      return response.transaction;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer community fee
  const transferCommunity = async (communityId: string, amount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transferCommunityFee(token, communityId, amount);
      await fetchWalletDetails(); // Refresh wallet data
      return response.transaction;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch transaction history
  const fetchTransactions = async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getTransactionHistory(token, page, limit);
      setTransactions(response.transactions);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch gift history
  const fetchGifts = async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getGiftHistory(token, page, limit);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Setup bank account
  const setupBank = async (bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await setupBankAccount(token, bankDetails);
      return response.bankAccount;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create withdrawal request
  const requestWithdrawal = async (amount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await createWithdrawalRequest(token, amount);
      await fetchWithdrawals(); // Refresh withdrawal data
      return response.withdrawalRequest;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch withdrawal history
  const fetchWithdrawals = async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching withdrawal history with token:', token?.substring(0, 10) + '...');
      const response = await getWithdrawalHistory(token, page, limit);
      console.log('Withdrawal history response:', response);
      setWithdrawals(response.withdrawals || []);
      return response;
    } catch (err: any) {
      console.error('Error fetching withdrawal history:', err);
      setError(`Withdrawal History Error: ${err.message}`);
      // Don't throw error for withdrawal history as it's not critical
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check withdrawal status
  const checkWithdrawalStatus = async (withdrawalId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getWithdrawalStatus(token, withdrawalId);
      return response.withdrawal;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize wallet data on mount
  useEffect(() => {
    if (token && token !== lastFetchedToken.current) {
      lastFetchedToken.current = token;
      fetchWalletDetails();
      // Skip withdrawal history as endpoint doesn't exist
      // fetchWithdrawals();
    }
  }, [token, fetchWalletDetails]);

  return {
    // State
    walletData,
    transactions,
    withdrawals,
    isLoading,
    error,

    // Actions
    fetchWalletDetails,
    createLoadOrder,
    verifyPayment,
    transferSeries,
    transferCommunity,
    fetchTransactions,
    fetchGifts,
    setupBank,
    requestWithdrawal,
    fetchWithdrawals,
    checkWithdrawalStatus,

    // Utilities
    clearError: () => setError(null)
  };
};