import { useBankroll } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useRef } from "react";
import { AlertTriangle, Download, Upload } from "lucide-react";

export function Settings() {
  const { state, setInitialBankroll, resetData, importData } = useBankroll();
  const [initial, setInitial] = useState(state.initialBankroll.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestao-banca-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importData(json);
        alert("Dados importados com sucesso!");
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("Erro ao importar dados:", error);
        alert("Erro ao importar arquivo. Certifique-se de que é um arquivo JSON válido do Gestão de Banca.");
      }
    };
    reader.readAsText(file);
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

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-100">Backup e Restauração</h3>
        <p className="text-sm text-zinc-400">
          Exporte seus dados para um arquivo JSON para ter um backup seguro ou importe um backup anterior.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleExport} className="flex-1 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
          <Button variant="outline" onClick={handleImportClick} className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
            <Upload className="mr-2 h-4 w-4" />
            Importar Dados
          </Button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>
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
