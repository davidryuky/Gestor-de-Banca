import { useBankroll, Transaction } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Trash2, Edit2, Filter } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TransactionList() {
  const { state, deleteTransaction } = useBankroll();
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'pending'>('all');

  const filteredTransactions = state.transactions.filter(tx => {
    if (filter === 'all') return true;
    if (tx.type !== 'bet') return false;
    return tx.result === filter;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Histórico de Transações</h1>
        <div className="flex gap-2">
          {(['all', 'win', 'loss', 'pending'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'all' ? 'Todos' : f === 'win' ? 'Green' : f === 'loss' ? 'Red' : 'Pendente'}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Stake</th>
                <th className="px-6 py-3">Odds</th>
                <th className="px-6 py-3">Retorno</th>
                <th className="px-6 py-3">Resultado</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-200">{tx.description}</td>
                  <td className="px-6 py-4 capitalize">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      tx.type === 'bet' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {tx.type === 'bet' ? 'Aposta' : tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatCurrency(tx.stake)}</td>
                  <td className="px-6 py-4">{tx.odds ? tx.odds.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4">
                    {tx.type === 'bet' ? (
                      <span className={cn(
                        tx.result === 'win' ? "text-emerald-500" : tx.result === 'loss' ? "text-rose-500" : "text-zinc-400"
                      )}>
                        {tx.result === 'win' ? formatCurrency(tx.returnAmount - tx.stake) : (tx.result === 'loss' ? `-${formatCurrency(tx.stake)}` : '-')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {tx.type === 'bet' && (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        tx.result === 'win' ? "bg-emerald-500/10 text-emerald-500" : 
                        tx.result === 'loss' ? "bg-rose-500/10 text-rose-500" : 
                        tx.result === 'void' ? "bg-zinc-500/10 text-zinc-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {tx.result === 'win' ? 'Green' : tx.result === 'loss' ? 'Red' : tx.result === 'void' ? 'Anulada' : 'Pendente'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteTransaction(tx.id)}
                      className="text-zinc-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
