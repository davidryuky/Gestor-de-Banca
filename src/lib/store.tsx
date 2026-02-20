import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type TransactionType = 'bet' | 'deposit' | 'withdrawal';
export type BetResult = 'win' | 'loss' | 'void' | 'pending';

export type ChallengeDayResult = 'pending' | 'win' | 'loss' | 'void';

export interface ChallengeDay {
  day: number;
  stake: number;
  targetOdds: number;
  result: ChallengeDayResult;
}

export interface Challenge {
  id: string;
  name: string;
  initialStake: number;
  targetOdds: number;
  totalDays: number;
  startDate: string;
  status: 'active' | 'completed' | 'failed';
  days: ChallengeDay[];
}

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
  challenges: Challenge[];
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
  addChallenge: (challenge: Omit<Challenge, 'id' | 'status' | 'days'>) => void;
  updateChallengeDay: (challengeId: string, day: number, result: ChallengeDayResult, doubleNextStake?: boolean) => void;
  restartChallenge: (challengeId: string) => void;
  deleteChallenge: (challengeId: string) => void;
}

const BankrollContext = createContext<BankrollContextType | undefined>(undefined);

const STORAGE_KEY = 'bankroll_manager_v2';

const DEFAULT_STATE: BankrollState = {
  initialBankroll: 1000,
  transactions: [],
  challenges: [],
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

  const addChallenge = (challengeData: Omit<Challenge, 'id' | 'status' | 'days'>) => {
    const newChallenge: Challenge = {
      ...challengeData,
      id: uuidv4(),
      status: 'active',
      days: Array.from({ length: challengeData.totalDays }).map((_, i) => ({
        day: i + 1,
        stake: 0,
        targetOdds: challengeData.targetOdds,
        result: 'pending'
      }))
    };
    
    let currentStake = challengeData.initialStake;
    for (let i = 0; i < newChallenge.days.length; i++) {
      newChallenge.days[i].stake = currentStake;
      currentStake = currentStake * challengeData.targetOdds;
    }

    setState(prev => ({ ...prev, challenges: [newChallenge, ...(prev.challenges || [])] }));
  };

  const updateChallengeDay = (challengeId: string, dayNumber: number, result: ChallengeDayResult, doubleNextStake?: boolean) => {
    setState(prev => {
      const challenges = prev.challenges || [];
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);
      if (challengeIndex === -1) return prev;

      const challenge = { ...challenges[challengeIndex] };
      const days = [...challenge.days];
      const dayIndex = days.findIndex(d => d.day === dayNumber);
      
      if (dayIndex === -1) return prev;

      days[dayIndex] = { ...days[dayIndex], result };

      if (result === 'win' || result === 'void') {
        let currentStake = result === 'win' ? days[dayIndex].stake * days[dayIndex].targetOdds : days[dayIndex].stake;
        for (let i = dayIndex + 1; i < days.length; i++) {
          days[i] = { ...days[i], stake: currentStake };
          currentStake = currentStake * days[i].targetOdds;
        }
      } else if (result === 'loss') {
        if (doubleNextStake && dayIndex + 1 < days.length) {
          let currentStake = days[dayIndex].stake * 2;
          for (let i = dayIndex + 1; i < days.length; i++) {
            days[i] = { ...days[i], stake: currentStake };
            currentStake = currentStake * days[i].targetOdds;
          }
          challenge.status = 'active';
        } else {
          challenge.status = 'failed';
        }
      }

      const allSettled = days.every(d => d.result !== 'pending');
      const anyLoss = days.some(d => d.result === 'loss');
      
      if (allSettled && !anyLoss) {
        challenge.status = 'completed';
      }

      challenge.days = days;
      const newChallenges = [...challenges];
      newChallenges[challengeIndex] = challenge;

      return { ...prev, challenges: newChallenges };
    });
  };

  const restartChallenge = (challengeId: string) => {
    setState(prev => {
      const challenges = prev.challenges || [];
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);
      if (challengeIndex === -1) return prev;

      const challenge = { ...challenges[challengeIndex] };
      challenge.status = 'active';
      
      let currentStake = challenge.initialStake;
      challenge.days = challenge.days.map(d => {
        const newDay = { ...d, result: 'pending' as ChallengeDayResult, stake: currentStake };
        currentStake = currentStake * d.targetOdds;
        return newDay;
      });

      const newChallenges = [...challenges];
      newChallenges[challengeIndex] = challenge;

      return { ...prev, challenges: newChallenges };
    });
  };

  const deleteChallenge = (challengeId: string) => {
    setState(prev => ({
      ...prev,
      challenges: (prev.challenges || []).filter(c => c.id !== challengeId),
    }));
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
        addChallenge,
        updateChallengeDay,
        restartChallenge,
        deleteChallenge,
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
