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
  doubled?: boolean;
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
  date: string;
  type: TransactionType;
  description: string;
  stake: number;
  odds: number;
  result: BetResult;
  returnAmount: number;
  sport?: string;
  market?: string;
}

export interface Bankroll {
  id: string;
  name: string;
  initialBankroll: number;
  transactions: Transaction[];
  challenges: Challenge[];
}

export interface AppState {
  activeBankrollId: string;
  bankrolls: Bankroll[];
  theme: 'dark' | 'light';
  colorScheme: 'indigo' | 'emerald' | 'rose' | 'blue' | 'violet' | 'amber' | 'cyan' | 'fuchsia' | 'orange';
  dashboardLayout: string[];
}

interface BankrollContextType {
  state: AppState;
  activeBankroll: Bankroll;
  currentBankroll: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  
  // App Settings
  setTheme: (theme: 'dark' | 'light') => void;
  setColorScheme: (color: 'indigo' | 'emerald' | 'rose' | 'blue' | 'violet' | 'amber' | 'cyan' | 'fuchsia' | 'orange') => void;
  setDashboardLayout: (layout: string[]) => void;
  
  // Bankroll Management
  switchBankroll: (id: string) => void;
  createBankroll: (name: string, initial: number) => void;
  updateBankrollName: (id: string, name: string) => void;
  deleteBankroll: (id: string) => void;
  setInitialBankroll: (amount: number) => void;
  
  // Data
  addTransaction: (tx: Omit<Transaction, 'id' | 'returnAmount'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addChallenge: (challenge: Omit<Challenge, 'id' | 'status' | 'days'>) => void;
  updateChallengeDay: (challengeId: string, day: number, result: ChallengeDayResult, doubleNextStake?: boolean) => void;
  restartChallenge: (challengeId: string) => void;
  deleteChallenge: (challengeId: string) => void;
  
  resetData: () => void;
  importData: (data: any) => void;
}

const BankrollContext = createContext<BankrollContextType | undefined>(undefined);

const STORAGE_KEY = 'bankroll_manager_v3';

const DEFAULT_BANKROLL: Bankroll = {
  id: 'default',
  name: 'Banca Principal',
  initialBankroll: 1000,
  transactions: [],
  challenges: [],
};

const DEFAULT_STATE: AppState = {
  activeBankrollId: 'default',
  bankrolls: [DEFAULT_BANKROLL],
  theme: 'dark',
  colorScheme: 'indigo',
  dashboardLayout: ['stats', 'chart', 'recent'],
};

export function BankrollProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration from v2
        if (parsed.initialBankroll !== undefined && !parsed.bankrolls) {
          return {
            ...DEFAULT_STATE,
            bankrolls: [{
              ...DEFAULT_BANKROLL,
              initialBankroll: parsed.initialBankroll || 1000,
              transactions: parsed.transactions || [],
              challenges: parsed.challenges || [],
            }]
          };
        }
        return { ...DEFAULT_STATE, ...parsed };
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    
    // Try to migrate from v2 key if v3 doesn't exist
    const oldStored = localStorage.getItem('bankroll_manager_v2');
    if (oldStored) {
      try {
        const parsed = JSON.parse(oldStored);
        return {
          ...DEFAULT_STATE,
          bankrolls: [{
            ...DEFAULT_BANKROLL,
            initialBankroll: parsed.initialBankroll || 1000,
            transactions: parsed.transactions || [],
            challenges: parsed.challenges || [],
          }]
        };
      } catch (e) {}
    }
    
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Apply theme to document
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply color scheme
    document.documentElement.classList.remove('theme-indigo', 'theme-emerald', 'theme-rose', 'theme-blue', 'theme-violet', 'theme-amber', 'theme-cyan', 'theme-fuchsia', 'theme-orange');
    document.documentElement.classList.add(`theme-${state.colorScheme}`);
    
  }, [state]);

  const activeBankroll = state.bankrolls.find(b => b.id === state.activeBankrollId) || state.bankrolls[0];

  // --- Settings ---
  const setTheme = (theme: 'dark' | 'light') => setState(s => ({ ...s, theme }));
  const setColorScheme = (colorScheme: AppState['colorScheme']) => setState(s => ({ ...s, colorScheme }));
  const setDashboardLayout = (dashboardLayout: string[]) => setState(s => ({ ...s, dashboardLayout }));

  // --- Bankroll Management ---
  const switchBankroll = (id: string) => setState(s => ({ ...s, activeBankrollId: id }));
  
  const createBankroll = (name: string, initial: number) => {
    const newBankroll: Bankroll = {
      id: uuidv4(),
      name,
      initialBankroll: initial,
      transactions: [],
      challenges: [],
    };
    setState(s => ({
      ...s,
      bankrolls: [...s.bankrolls, newBankroll],
      activeBankrollId: newBankroll.id
    }));
  };
  
  const updateBankrollName = (id: string, name: string) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => b.id === id ? { ...b, name } : b)
    }));
  };
  
  const deleteBankroll = (id: string) => {
    setState(s => {
      const newBankrolls = s.bankrolls.filter(b => b.id !== id);
      if (newBankrolls.length === 0) return s; // Don't delete last one
      return {
        ...s,
        bankrolls: newBankrolls,
        activeBankrollId: s.activeBankrollId === id ? newBankrolls[0].id : s.activeBankrollId
      };
    });
  };

  const setInitialBankroll = (amount: number) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => b.id === s.activeBankrollId ? { ...b, initialBankroll: amount } : b)
    }));
  };

  // --- Transactions ---
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
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => b.id === s.activeBankrollId ? {
        ...b,
        transactions: [newTx, ...b.transactions]
      } : b)
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => {
        if (b.id !== s.activeBankrollId) return b;
        return {
          ...b,
          transactions: b.transactions.map(t => {
            if (t.id !== id) return t;
            const updated = { ...t, ...updates };
            if (updates.stake !== undefined || updates.odds !== undefined || updates.result !== undefined) {
              updated.returnAmount = calculateReturn(updated.stake, updated.odds, updated.result);
            }
            return updated;
          })
        };
      })
    }));
  };

  const deleteTransaction = (id: string) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => b.id === s.activeBankrollId ? {
        ...b,
        transactions: b.transactions.filter(t => t.id !== id)
      } : b)
    }));
  };

  // --- Challenges ---
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

    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => b.id === s.activeBankrollId ? {
        ...b,
        challenges: [newChallenge, ...(b.challenges || [])]
      } : b)
    }));
  };

  const updateChallengeDay = (challengeId: string, dayNumber: number, result: ChallengeDayResult, doubleNextStake?: boolean) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => {
        if (b.id !== s.activeBankrollId) return b;
        
        const challenges = b.challenges || [];
        const challengeIndex = challenges.findIndex(c => c.id === challengeId);
        if (challengeIndex === -1) return b;

        const challenge = { ...challenges[challengeIndex] };
        const days = [...challenge.days];
        const dayIndex = days.findIndex(d => d.day === dayNumber);
        
        if (dayIndex === -1) return b;

        days[dayIndex] = { 
          ...days[dayIndex], 
          result,
          doubled: result === 'loss' ? doubleNextStake : undefined
        };

        // Recalculate all stakes and status from day 0
        let currentStake = challenge.initialStake;
        let newStatus: 'active' | 'completed' | 'failed' = 'active';

        for (let i = 0; i < days.length; i++) {
          days[i] = { ...days[i], stake: currentStake };
          
          if (days[i].result === 'win') {
            currentStake = currentStake * days[i].targetOdds;
          } else if (days[i].result === 'void') {
            // stake stays same
          } else if (days[i].result === 'loss') {
            if (days[i].doubled) {
              currentStake = currentStake * 2;
            } else {
              newStatus = 'failed';
              currentStake = currentStake * days[i].targetOdds; // projected for UI
            }
          } else if (days[i].result === 'pending') {
            currentStake = currentStake * days[i].targetOdds;
          }
        }

        if (newStatus !== 'failed') {
          const allSettled = days.every(d => d.result !== 'pending');
          if (allSettled) {
            newStatus = 'completed';
          }
        }

        challenge.days = days;
        challenge.status = newStatus;
        
        const newChallenges = [...challenges];
        newChallenges[challengeIndex] = challenge;

        return { ...b, challenges: newChallenges };
      })
    }));
  };

  const restartChallenge = (challengeId: string) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => {
        if (b.id !== s.activeBankrollId) return b;
        
        const challenges = b.challenges || [];
        const challengeIndex = challenges.findIndex(c => c.id === challengeId);
        if (challengeIndex === -1) return b;

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

        return { ...b, challenges: newChallenges };
      })
    }));
  };

  const deleteChallenge = (challengeId: string) => {
    setState(s => ({
      ...s,
      bankrolls: s.bankrolls.map(b => b.id === s.activeBankrollId ? {
        ...b,
        challenges: (b.challenges || []).filter(c => c.id !== challengeId)
      } : b)
    }));
  };

  // --- Utils ---
  const resetData = () => {
    setState(DEFAULT_STATE);
  };

  const importData = (data: any) => {
    if (data && data.bankrolls && Array.isArray(data.bankrolls)) {
      setState(data);
    } else if (data && typeof data.initialBankroll === 'number') {
      // Import from v2
      setState({
        ...DEFAULT_STATE,
        bankrolls: [{
          ...DEFAULT_BANKROLL,
          initialBankroll: data.initialBankroll,
          transactions: data.transactions || [],
          challenges: data.challenges || [],
        }]
      });
    } else {
      throw new Error("Formato de dados inválido");
    }
  };

  // --- Derived State for Active Bankroll ---
  const sortedTransactions = [...activeBankroll.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentBankroll = activeBankroll.initialBankroll;
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
        settledBets++;
      }
    }
  });

  const roi = settledBets > 0 ? (totalProfit / activeBankroll.initialBankroll) * 100 : 0;
  const winRate = settledBets > 0 ? (wins / settledBets) * 100 : 0;

  return (
    <BankrollContext.Provider
      value={{
        state,
        activeBankroll,
        currentBankroll,
        totalProfit,
        roi,
        winRate,
        setTheme,
        setColorScheme,
        setDashboardLayout,
        switchBankroll,
        createBankroll,
        updateBankrollName,
        deleteBankroll,
        setInitialBankroll,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addChallenge,
        updateChallengeDay,
        restartChallenge,
        deleteChallenge,
        resetData,
        importData,
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
