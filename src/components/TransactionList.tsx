import { useBankroll, Transaction, BetResult } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TransactionForm } from "@/components/TransactionForm";

export function TransactionList() {
  const { activeBankroll, deleteTransaction, updateTransaction } = useBankroll();
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'pending'>('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filteredTransactions = activeBankroll.transactions.filter(tx => {
    if (filter === 'all') return true;
    if (tx.type !== 'bet') return false;
    return tx.result === filter;
  });

  const handleQuickResultChange = (id: string, newResult: BetResult) => {
    updateTransaction(id, { result: newResult });
  };

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
                      <select
                        value={tx.result}
                        onChange={(e) => handleQuickResultChange(tx.id, e.target.value as BetResult)}
                        className={cn(
                          "bg-transparent border border-zinc-700 rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer",
                          tx.result === 'win' ? "text-emerald-500 border-emerald-500/30" : 
                          tx.result === 'loss' ? "text-rose-500 border-rose-500/30" : 
                          tx.result === 'void' ? "text-zinc-400 border-zinc-600" :
                          "text-yellow-500 border-yellow-500/30"
                        )}
                      >
                        <option value="pending" className="bg-zinc-900 text-yellow-500">Pendente</option>
                        <option value="win" className="bg-zinc-900 text-emerald-500">Green</option>
                        <option value="loss" className="bg-zinc-900 text-rose-500">Red</option>
                        <option value="void" className="bg-zinc-900 text-zinc-400">Anulada</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingTx(tx)}
                        className="text-zinc-500 hover:text-indigo-400 transition-colors p-1"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta transação?")) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="text-zinc-500 hover:text-rose-500 transition-colors p-1"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

      {editingTx && (
        <TransactionForm 
          initialData={editingTx} 
          onClose={() => setEditingTx(null)} 
        />
      )}
    </div>
  );
}
