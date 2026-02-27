import React, { useState } from "react";
import { useBankroll, TransactionType, BetResult, Transaction } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";

interface TransactionFormProps {
  onClose: () => void;
  initialData?: Transaction;
}

export function TransactionForm({ onClose, initialData }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useBankroll();
  const [type, setType] = useState<TransactionType>(initialData?.type || "bet");
  const [description, setDescription] = useState(initialData?.description || "");
  const [stake, setStake] = useState(initialData?.stake.toString() || "");
  const [odds, setOdds] = useState(initialData?.odds?.toString() || "");
  const [result, setResult] = useState<BetResult>(initialData?.result || "pending");
  const [date, setDate] = useState(initialData ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const txData = {
      type,
      description,
      stake: parseFloat(stake),
      odds: type === "bet" ? parseFloat(odds) : 1,
      result: type === "bet" ? result : "void",
      date,
    };

    if (initialData) {
      updateTransaction(initialData.id, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">
            {initialData ? "Editar Transação" : "Nova Transação"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["bet", "deposit", "withdrawal"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                disabled={!!initialData} // Prevent changing type when editing
                className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {t === "bet" ? "Aposta" : t === "deposit" ? "Depósito" : "Saque"}
              </button>
            ))}
          </div>

          <Input
            label="Descrição"
            placeholder={type === "bet" ? "Ex: Flamengo vs Vasco" : "Descrição"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              required
            />
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {type === "bet" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Odds"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  required
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Resultado</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={result}
                    onChange={(e) => setResult(e.target.value as BetResult)}
                  >
                    <option value="pending">Pendente</option>
                    <option value="win">Green (Vitória)</option>
                    <option value="loss">Red (Derrota)</option>
                    <option value="void">Anulada</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
