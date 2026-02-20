import { useBankroll } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function Settings() {
  const { state, setInitialBankroll, resetData } = useBankroll();
  const [initial, setInitial] = useState(state.initialBankroll.toString());

  const handleSaveInitial = () => {
    const val = parseFloat(initial);
    if (!isNaN(val)) {
      setInitialBankroll(val);
      alert("Banca inicial atualizada!");
    }
  };

  const handleReset = () => {
    if (confirm("Tem certeza? Isso apagará todos os dados.")) {
      resetData();
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100">Configurações</h1>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-100">Geral</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input
              label="Banca Inicial (R$)"
              type="number"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveInitial}>Salvar</Button>
        </div>
        <p className="text-xs text-zinc-500">
          Isso define o valor inicial da sua banca para cálculos de ROI e crescimento.
        </p>
      </div>

      <div className="rounded-xl border border-rose-900/20 bg-rose-950/10 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-500">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-lg font-medium">Zona de Perigo</h3>
        </div>
        <p className="text-sm text-zinc-400">
          Ações irreversíveis. Cuidado ao clicar.
        </p>
        <Button variant="danger" onClick={handleReset}>
          Resetar Todos os Dados
        </Button>
      </div>
    </div>
  );
}
