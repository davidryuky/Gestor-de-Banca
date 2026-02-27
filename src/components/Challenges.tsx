import React, { useState } from "react";
import { useBankroll, Challenge, ChallengeDayResult } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, ArrowLeft, TrendingUp, RotateCcw, ShieldAlert, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Challenges() {
  const { activeBankroll, addChallenge, deleteChallenge, updateChallengeDay, restartChallenge } = useBankroll();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const challenges = activeBankroll.challenges || [];
  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);

  if (isCreating) {
    return <CreateChallengeForm onCancel={() => setIsCreating(false)} onSubmit={(data) => {
      addChallenge(data);
      setIsCreating(false);
      toast.success("Desafio criado com sucesso!");
    }} />;
  }

  if (selectedChallenge) {
    return <ChallengeDetail 
      challenge={selectedChallenge} 
      onBack={() => setSelectedChallengeId(null)} 
      onUpdateDay={(day, result, double) => updateChallengeDay(selectedChallenge.id, day, result, double)}
      onRestart={() => restartChallenge(selectedChallenge.id)}
    />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Desafios Diários</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Desafio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map(challenge => {
          const completedDays = challenge.days.filter(d => d.result !== 'pending').length;
          const progress = (completedDays / challenge.totalDays) * 100;
          
          return (
            <div 
              key={challenge.id} 
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 cursor-pointer hover:border-indigo-500/50 transition-colors relative group"
              onClick={() => setSelectedChallengeId(challenge.id)}
            >
              <button 
                className="absolute top-4 right-4 text-zinc-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Excluir desafio?')) {
                    deleteChallenge(challenge.id);
                    toast.success("Desafio excluído!");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-zinc-100">{challenge.name}</h3>
                {challenge.status === 'completed' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Concluído</span>}
                {challenge.status === 'failed' && <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Falhou</span>}
                {challenge.status === 'active' && <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Ativo</span>}
              </div>
              
              <div className="space-y-1 text-sm text-zinc-400 mb-4">
                <p>Dias: {challenge.totalDays} | Odd: {challenge.targetOdds.toFixed(2)}</p>
                <p>Aposta Inicial: {formatCurrency(challenge.initialStake)}</p>
                <p>Meta Final: {formatCurrency(challenge.days[challenge.days.length - 1].stake * challenge.targetOdds)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Progresso</span>
                  <span>{completedDays} / {challenge.totalDays} dias</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      challenge.status === 'failed' ? "bg-rose-500" : challenge.status === 'completed' ? "bg-emerald-500" : "bg-indigo-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        
        {challenges.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum desafio criado.</p>
            <p className="text-sm mt-1">Crie um desafio para começar a multiplicar sua banca.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateChallengeForm({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (data: any) => void }) {
  const [name, setName] = useState("");
  const [initialStake, setInitialStake] = useState("");
  const [targetOdds, setTargetOdds] = useState("");
  const [totalDays, setTotalDays] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      initialStake: parseFloat(initialStake),
      targetOdds: parseFloat(targetOdds),
      totalDays: parseInt(totalDays, 10),
      startDate: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-100">Criar Novo Desafio</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <Input
          label="Nome do Desafio"
          placeholder="Ex: Alavancagem 1.10 ao dia"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Aposta Inicial (R$)"
            type="number"
            step="0.01"
            min="1"
            placeholder="10.00"
            value={initialStake}
            onChange={(e) => setInitialStake(e.target.value)}
            required
          />
          <Input
            label="Odd Alvo Diária"
            type="number"
            step="0.01"
            min="1.01"
            placeholder="1.10"
            value={targetOdds}
            onChange={(e) => setTargetOdds(e.target.value)}
            required
          />
        </div>
        <Input
          label="Duração (Dias)"
          type="number"
          min="1"
          max="365"
          placeholder="30"
          value={totalDays}
          onChange={(e) => setTotalDays(e.target.value)}
          required
        />
        
        {initialStake && targetOdds && totalDays && (
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
            <p><strong>Projeção:</strong> Se você acertar todos os {totalDays} dias com odd {targetOdds}, seus {formatCurrency(parseFloat(initialStake))} se transformarão em <strong>{formatCurrency(parseFloat(initialStake) * Math.pow(parseFloat(targetOdds), parseInt(totalDays, 10)))}</strong>.</p>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Criar Desafio</Button>
        </div>
      </form>
    </div>
  );
}

function ChallengeDetail({ 
  challenge, 
  onBack, 
  onUpdateDay,
  onRestart
}: { 
  challenge: Challenge, 
  onBack: () => void, 
  onUpdateDay: (day: number, result: ChallengeDayResult, double: boolean) => void,
  onRestart: () => void
}) {
  const [lossModalDay, setLossModalDay] = useState<number | null>(null);

  const handleResult = (dayNumber: number, result: ChallengeDayResult) => {
    if (result === 'loss') {
      setLossModalDay(dayNumber);
    } else {
      onUpdateDay(dayNumber, result, false);
      toast.success(`Resultado do dia ${dayNumber} atualizado!`);
    }
  };

  const handleLossChoice = (double: boolean) => {
    if (lossModalDay !== null) {
      onUpdateDay(lossModalDay, 'loss', double);
      setLossModalDay(null);
      toast.success(`Resultado atualizado. ${double ? 'Aposta do próximo dia dobrada.' : ''}`);
    }
  };

  // Chart Data
  const chartData = challenge.days.map(d => {
    // Expected is initial * odds^day
    const expected = challenge.initialStake * Math.pow(challenge.targetOdds, d.day);
    // Actual is the stake of the NEXT day if win, or current stake if pending
    // Wait, actual is the accumulated value.
    // If pending, it's null to not draw the line, or just current stake.
    let actual = null;
    if (d.result === 'win') actual = d.stake * d.targetOdds;
    else if (d.result === 'void') actual = d.stake;
    else if (d.result === 'loss') actual = 0; // or negative?
    
    return {
      day: `Dia ${d.day}`,
      Esperado: expected,
      Atual: actual !== null ? actual : undefined,
    };
  });

  // Add Day 0
  chartData.unshift({
    day: 'Início',
    Esperado: challenge.initialStake,
    Atual: challenge.initialStake,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-zinc-100">{challenge.name}</h1>
          {challenge.status === 'completed' && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full uppercase font-bold">Concluído</span>}
          {challenge.status === 'failed' && <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded-full uppercase font-bold">Falhou</span>}
        </div>
        
        <Button variant="outline" onClick={() => {
          if (confirm('Deseja reiniciar este desafio do zero?')) {
            onRestart();
            toast.success("Desafio reiniciado!");
          }
        }}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar Desafio
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-medium text-zinc-100">Projeção vs Realidade</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="Esperado" stroke="#71717a" strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="Atual" stroke="#6366f1" fillOpacity={0.2} fill="#6366f1" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Meta Final ({challenge.totalDays} dias)</p>
            <p className="text-3xl font-bold text-emerald-400">
              {formatCurrency(challenge.initialStake * Math.pow(challenge.targetOdds, challenge.totalDays))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Aposta Inicial</p>
              <p className="font-medium text-zinc-200">{formatCurrency(challenge.initialStake)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Odd Alvo</p>
              <p className="font-medium text-zinc-200">{challenge.targetOdds.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Days List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h3 className="font-medium text-zinc-100">Dias do Desafio</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {challenge.days.map((day, index) => {
            const isCurrent = day.result === 'pending' && (index === 0 || challenge.days[index - 1].result !== 'pending');
            const isPast = day.result !== 'pending';
            const isFuture = day.result === 'pending' && !isCurrent;

            return (
              <div key={day.day} className={cn(
                "p-4 flex items-center justify-between transition-colors",
                isCurrent ? "bg-indigo-500/5" : isPast ? "opacity-70" : "opacity-40"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs",
                    isCurrent ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {day.day}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">Apostar: {formatCurrency(day.stake)}</p>
                    <p className="text-xs text-zinc-500">Retorno esperado: {formatCurrency(day.stake * day.targetOdds)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPast ? (
                    <select
                      value={day.result}
                      onChange={(e) => handleResult(day.day, e.target.value as ChallengeDayResult)}
                      className={cn(
                        "bg-transparent border rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 cursor-pointer",
                        day.result === 'win' ? "text-emerald-500 border-emerald-500/30 focus:ring-emerald-500" : 
                        day.result === 'loss' ? "text-rose-500 border-rose-500/30 focus:ring-rose-500" : 
                        "text-zinc-400 border-zinc-600 focus:ring-zinc-500"
                      )}
                    >
                      <option value="win" className="bg-zinc-900 text-emerald-500">Green</option>
                      <option value="loss" className="bg-zinc-900 text-rose-500">Red</option>
                      <option value="void" className="bg-zinc-900 text-zinc-400">Anulada</option>
                      <option value="pending" className="bg-zinc-900 text-yellow-500">Pendente</option>
                    </select>
                  ) : isCurrent && challenge.status === 'active' ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleResult(day.day, 'win')}>
                        Green
                      </Button>
                      <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800" onClick={() => handleResult(day.day, 'void')}>
                        Anulada
                      </Button>
                      <Button size="sm" variant="outline" className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10" onClick={() => handleResult(day.day, 'loss')}>
                        Red
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600 uppercase font-medium">Aguardando</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loss Modal */}
      {lossModalDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-rose-900/50 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <ShieldAlert className="h-6 w-6" />
              <h2 className="text-lg font-semibold text-zinc-100">Derrota Registrada</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Você marcou um Red neste dia. O que deseja fazer para continuar o desafio?
            </p>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => handleLossChoice(true)}>
                <div className="text-left">
                  <p className="font-medium text-zinc-200">Dobrar a Aposta (Martingale)</p>
                  <p className="text-xs text-zinc-500">A aposta do próximo dia será dobrada para tentar recuperar.</p>
                </div>
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => {
                setLossModalDay(null);
                onRestart();
              }}>
                <div className="text-left">
                  <p className="font-medium text-zinc-200">Reiniciar Desafio</p>
                  <p className="text-xs text-zinc-500">Volta para o Dia 1 com a aposta inicial.</p>
                </div>
              </Button>
              <Button className="w-full justify-start border-rose-900/50 text-rose-500 hover:bg-rose-950/30" variant="outline" onClick={() => handleLossChoice(false)}>
                <div className="text-left">
                  <p className="font-medium">Aceitar a Derrota</p>
                  <p className="text-xs opacity-70">Encerra o desafio como falho.</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
