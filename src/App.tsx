import { useState } from "react";
import { BankrollProvider, useBankroll } from "@/lib/store";
import { Dashboard } from "@/components/Dashboard";
import { TransactionList } from "@/components/TransactionList";
import { Settings } from "@/components/Settings";
import { Challenges } from "@/components/Challenges";
import { LayoutDashboard, History, Settings as SettingsIcon, Menu, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function AppContent() {
  const { state, activeBankroll, switchBankroll } = useBankroll();
  const [view, setView] = useState<'dashboard' | 'history' | 'challenges' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: typeof view, icon: any, label: string }) => (
    <button
      onClick={() => {
        setView(id);
        setIsMobileMenuOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        view === id
          ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary-500/30 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <span className="font-bold text-lg tracking-tight">GestãoPro</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-500 dark:text-zinc-400">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-16 items-center px-6 border-b border-zinc-200 dark:border-zinc-800/50">
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">GestãoPro</span>
          </div>
          
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/50">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Banca Ativa</label>
            <div className="relative">
              <select 
                className="w-full appearance-none rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={state.activeBankrollId}
                onChange={(e) => switchBankroll(e.target.value)}
              >
                {state.bankrolls.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <Wallet className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="history" icon={History} label="Histórico" />
            <NavItem id="challenges" icon={Target} label="Desafios" />
            <NavItem id="settings" icon={SettingsIcon} label="Configurações" />
          </nav>
          
          <div className="p-4">
            <div className="rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-900/10 border border-primary-500/20 p-4">
              <p className="text-xs text-primary-600 dark:text-primary-300 font-medium">Dica Pro</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Mantenha o registro de todas as suas apostas para uma análise precisa do ROI.</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto h-screen">
          <div className="mx-auto max-w-7xl">
            {view === 'dashboard' && <Dashboard />}
            {view === 'history' && <TransactionList />}
            {view === 'challenges' && <Challenges />}
            {view === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BankrollProvider>
      <AppContent />
    </BankrollProvider>
  );
}
