import { useBankroll } from "@/lib/store";
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wallet, TrendingUp, Target, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TransactionForm } from "@/components/TransactionForm";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { currentBankroll, totalProfit, roi, winRate, state } = useBankroll();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Prepare chart data
  // We need a running balance over time.
  // Sort transactions by date.
  const chartData = state.transactions
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, tx) => {
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : state.initialBankroll;
      let newBalance = lastBalance;

      if (tx.type === 'deposit') newBalance += tx.stake;
      else if (tx.type === 'withdrawal') newBalance -= tx.stake;
      else if (tx.type === 'bet') {
        if (tx.result === 'win') newBalance += (tx.returnAmount - tx.stake);
        else if (tx.result === 'loss') newBalance -= tx.stake;
        // pending bets don't affect "realized" chart usually, but for "available" they do.
        // Let's show realized balance for the chart to avoid dips for pending bets?
        // Or show available. Let's show available.
        else if (tx.result === 'pending') newBalance -= tx.stake;
      }

      acc.push({
        date: new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        balance: newBalance,
      });
      return acc;
    }, [] as { date: string; balance: number }[]);

  // Add initial point
  const finalChartData = [{ date: 'Início', balance: state.initialBankroll }, ...chartData];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Banca Atual"
          value={formatCurrency(currentBankroll)}
          icon={Wallet}
          className="border-l-4 border-l-indigo-500"
        />
        <StatCard
          title="Lucro Total"
          value={formatCurrency(totalProfit)}
          icon={TrendingUp}
          trend={totalProfit >= 0 ? "+Lucro" : "-Prejuízo"}
          trendUp={totalProfit >= 0}
        />
        <StatCard
          title="ROI"
          value={formatPercentage(roi)}
          icon={Target}
          trend={roi >= 0 ? "Positivo" : "Negativo"}
          trendUp={roi >= 0}
        />
        <StatCard
          title="Win Rate"
          value={formatPercentage(winRate)}
          icon={Target}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-medium text-zinc-100">Crescimento da Banca</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finalChartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: number) => [formatCurrency(value), "Banca"]}
                />
                <Area type="monotone" dataKey="balance" stroke="#6366f1" fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 text-lg font-medium text-zinc-100">Últimas Atividades</h3>
          <div className="space-y-4">
            {state.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    tx.type === 'bet' 
                      ? (tx.result === 'win' ? "bg-emerald-500/10 text-emerald-500" : tx.result === 'loss' ? "bg-rose-500/10 text-rose-500" : "bg-zinc-800 text-zinc-400")
                      : "bg-indigo-500/10 text-indigo-500"
                  )}>
                    {tx.type === 'bet' ? (
                      tx.result === 'win' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <Wallet className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{tx.description}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-medium",
                    tx.result === 'win' ? "text-emerald-500" : tx.result === 'loss' ? "text-rose-500" : "text-zinc-100"
                  )}>
                    {tx.type === 'withdrawal' ? '-' : (tx.result === 'loss' ? '-' : '+')}
                    {formatCurrency(tx.result === 'win' ? (tx.returnAmount - tx.stake) : tx.stake)}
                  </p>
                  {tx.type === 'bet' && (
                    <p className="text-xs text-zinc-500">@{tx.odds}</p>
                  )}
                </div>
              </div>
            ))}
            {state.transactions.length === 0 && (
              <p className="text-center text-sm text-zinc-500">Nenhuma transação registrada.</p>
            )}
          </div>
        </div>
      </div>

      {isFormOpen && <TransactionForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
