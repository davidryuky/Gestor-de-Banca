import { useState } from "react";
import { BankrollProvider } from "@/lib/store";
import { Dashboard } from "@/components/Dashboard";
import { TransactionList } from "@/components/TransactionList";
import { Settings } from "@/components/Settings";
import { Challenges } from "@/components/Challenges";
import { LayoutDashboard, History, Settings as SettingsIcon, Menu, Target } from "lucide-react";
import { cn } from "@/lib/utils";

function AppContent() {
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
          ? "bg-indigo-500/10 text-indigo-400"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <span className="font-bold text-lg tracking-tight">GestãoPro</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-16 items-center px-6 border-b border-zinc-800/50">
            <span className="font-bold text-xl tracking-tight text-white">GestãoPro</span>
          </div>
          <nav className="space-y-1 p-4">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="history" icon={History} label="Histórico" />
            <NavItem id="challenges" icon={Target} label="Desafios" />
            <NavItem id="settings" icon={SettingsIcon} label="Configurações" />
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/10">
            <p className="text-xs text-indigo-300 font-medium">Dica Pro</p>
            <p className="text-xs text-zinc-400 mt-1">Mantenha o registro de todas as suas apostas para uma análise precisa do ROI.</p>
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
