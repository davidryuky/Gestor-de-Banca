import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type TransactionType = 'bet' | 'deposit' | 'withdrawal';
export type BetResult = 'win' | 'loss' | 'void' | 'pending';

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  description: string;
  stake: number;
  odds: number;
  result: BetResult;
  returnAmount: number;
  sport?: string;
  market?: string;
}

export interface BankrollState {
  initialBankroll: number;
  transactions: Transaction[];
}

interface BankrollContextType {
  state: BankrollState;
  currentBankroll: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  addTransaction: (tx: Omit<Transaction, 'id' | 'returnAmount'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setInitialBankroll: (amount: number) => void;
  resetData: () => void;
}

const BankrollContext = createContext<BankrollContextType | undefined>(undefined);

const STORAGE_KEY = 'bankroll_manager_v2';

const DEFAULT_STATE: BankrollState = {
  initialBankroll: 1000,
  transactions: [],
};

export function BankrollProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BankrollState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const calculateReturn = (stake: number, odds: number, result: BetResult): number => {
    if (result === 'win') return stake * odds;
    if (result === 'void') return stake;
    return 0;
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'returnAmount'>) => {
    const newTx: Transaction = {
      ...tx,
      id: uuidv4(),
      returnAmount: calculateReturn(tx.stake, tx.odds, tx.result),
    };
    setState(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        // Recalculate return if needed
        if (updates.stake !== undefined || updates.odds !== undefined || updates.result !== undefined) {
          updated.returnAmount = calculateReturn(updated.stake, updated.odds, updated.result);
        }
        return updated;
      }),
    }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  };

  const setInitialBankroll = (amount: number) => {
    setState(prev => ({ ...prev, initialBankroll: amount }));
  };

  const resetData = () => {
    setState(DEFAULT_STATE);
  };

  // Derived State
  const sortedTransactions = [...state.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentBankroll = state.initialBankroll;
  let totalProfit = 0;
  let wins = 0;
  let settledBets = 0;

  sortedTransactions.forEach(tx => {
    if (tx.type === 'deposit') {
      currentBankroll += tx.stake;
    } else if (tx.type === 'withdrawal') {
      currentBankroll -= tx.stake;
    } else if (tx.type === 'bet') {
      if (tx.result === 'pending') {
        currentBankroll -= tx.stake;
      } else if (tx.result === 'win') {
        const profit = tx.returnAmount - tx.stake;
        currentBankroll += profit;
        totalProfit += profit;
        wins++;
        settledBets++;
      } else if (tx.result === 'loss') {
        currentBankroll -= tx.stake;
        totalProfit -= tx.stake;
        settledBets++;
      } else if (tx.result === 'void') {
        // No change to bankroll (stake returned)
        settledBets++;
      }
    }
  });

  const roi = settledBets > 0 ? (totalProfit / state.initialBankroll) * 100 : 0; // Simple ROI on starting bank
  // Alternatively ROI on turnover: (Total Return / Total Staked) - 1
  
  const winRate = settledBets > 0 ? (wins / settledBets) * 100 : 0;

  return (
    <BankrollContext.Provider
      value={{
        state,
        currentBankroll,
        totalProfit,
        roi,
        winRate,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setInitialBankroll,
        resetData,
      }}
    >
      {children}
    </BankrollContext.Provider>
  );
}

export function useBankroll() {
  const context = useContext(BankrollContext);
  if (!context) throw new Error('useBankroll must be used within a BankrollProvider');
  return context;
}
