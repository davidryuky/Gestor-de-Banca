import { useBankroll } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useRef } from "react";
import { AlertTriangle, Download, Upload, Plus, Trash2 } from "lucide-react";

export function Settings() {
  const { 
    state, 
    activeBankroll,
    setInitialBankroll, 
    resetData, 
    importData,
    setTheme,
    setColorScheme,
    createBankroll,
    updateBankrollName,
    deleteBankroll
  } = useBankroll();
  
  const [initial, setInitial] = useState(activeBankroll.initialBankroll.toString());
  const [newBankrollName, setNewBankrollName] = useState("");
  const [newBankrollInitial, setNewBankrollInitial] = useState("1000");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveInitial = () => {
    const val = parseFloat(initial);
    if (!isNaN(val)) {
      setInitialBankroll(val);
      alert("Banca inicial atualizada!");
    }
  };

  const handleCreateBankroll = () => {
    if (newBankrollName.trim() && !isNaN(parseFloat(newBankrollInitial))) {
      createBankroll(newBankrollName, parseFloat(newBankrollInitial));
      setNewBankrollName("");
      setNewBankrollInitial("1000");
    }
  };

  const handleReset = () => {
    if (confirm("Tem certeza? Isso apagará TODOS os dados de TODAS as bancas.")) {
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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Configurações</h1>

      {/* Theme Settings */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Aparência</h3>
        
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Modo</label>
          <div className="flex gap-2">
            <Button variant={state.theme === 'dark' ? 'primary' : 'outline'} onClick={() => setTheme('dark')}>Escuro</Button>
            <Button variant={state.theme === 'light' ? 'primary' : 'outline'} onClick={() => setTheme('light')}>Claro</Button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cor Principal</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setColorScheme('indigo')}
              className={`w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center ${state.colorScheme === 'indigo' ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : ''}`}
            />
            <button 
              onClick={() => setColorScheme('emerald')}
              className={`w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center ${state.colorScheme === 'emerald' ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-zinc-900' : ''}`}
            />
            <button 
              onClick={() => setColorScheme('rose')}
              className={`w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center ${state.colorScheme === 'rose' ? 'ring-2 ring-offset-2 ring-rose-500 dark:ring-offset-zinc-900' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Current Bankroll Settings */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Banca Atual: {activeBankroll.name}</h3>
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

      {/* Multiple Bankrolls */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Gerenciar Bancas</h3>
        
        <div className="space-y-2">
          {state.bankrolls.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{b.name}</p>
                <p className="text-xs text-zinc-500">Inicial: R$ {b.initialBankroll}</p>
              </div>
              {state.bankrolls.length > 1 && (
                <button 
                  onClick={() => {
                    if (confirm(`Excluir a banca "${b.name}"?`)) deleteBankroll(b.id);
                  }}
                  className="text-zinc-400 hover:text-rose-500 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Criar Nova Banca</h4>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input
                label="Nome"
                placeholder="Ex: Bet365"
                value={newBankrollName}
                onChange={(e) => setNewBankrollName(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Input
                label="Inicial"
                type="number"
                value={newBankrollInitial}
                onChange={(e) => setNewBankrollInitial(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateBankroll}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Backup e Restauração</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Exporte seus dados para um arquivo JSON para ter um backup seguro ou importe um backup anterior.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleExport} className="flex-1 border-primary-500/30 text-primary-600 dark:text-primary-400 hover:bg-primary-500/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
          <Button variant="outline" onClick={handleImportClick} className="flex-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
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

      <div className="rounded-xl border border-rose-200 dark:border-rose-900/20 bg-rose-50 dark:bg-rose-950/10 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-lg font-medium">Zona de Perigo</h3>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ações irreversíveis. Cuidado ao clicar.
        </p>
        <Button variant="danger" onClick={handleReset}>
          Resetar Todos os Dados
        </Button>
      </div>
    </div>
  );
}
