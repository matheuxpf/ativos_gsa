import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  ClipboardList,
  Menu, 
  Search,
  Box,
  LogOut,
  Settings,
  Users
} from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
  onSearch: (query: string) => void;
  searchValue: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onNavigate, 
  children,
  onSearch,
  searchValue
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${
        currentView === view 
          ? 'bg-gsa-green text-white shadow-md font-semibold' 
          : 'text-blue-100 hover:bg-gsa-darkBlue hover:text-white'
      }`}
    >
      <Icon size={20} className="mr-3" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gsa-blue text-white shadow-xl z-20">
        <div className="p-6 flex items-center justify-center border-b border-blue-800">
           {/* Placeholder for GSA Logo */}
           <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gsa-blue font-bold text-xl border-2 border-gsa-green">
              GSA
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">GSA Alimentos</span>
              <span className="text-xs text-blue-200">Asset Manager</span>
            </div>
           </div>
        </div>

        <nav className="flex-1 p-4 mt-4">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="ASSETS" icon={Package} label="Ativos" />
          <NavItem view="MOVEMENTS" icon={ClipboardList} label="Auditoria & Logs" />
          <NavItem view="TEAMS" icon={Users} label="Equipes" />
          <NavItem view="ADMIN" icon={Settings} label="Administração" />
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center text-sm text-blue-200 mb-2">
            <Box size={16} className="mr-2" />
            <span>Versão 1.0.0</span>
          </div>
          <button className="flex items-center text-sm text-red-300 hover:text-red-100 transition-colors">
            <LogOut size={16} className="mr-2" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-gsa-blue text-white transform transition-transform duration-300 z-40 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-blue-800">
           <span className="font-bold text-lg">Menu</span>
           <button onClick={() => setIsSidebarOpen(false)} className="text-white">X</button>
        </div>
        <nav className="p-4 mt-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="ASSETS" icon={Package} label="Ativos" />
          <NavItem view="MOVEMENTS" icon={ClipboardList} label="Auditoria & Logs" />
          <NavItem view="TEAMS" icon={Users} label="Equipes" />
          <NavItem view="ADMIN" icon={Settings} label="Administração" />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 text-slate-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
              {currentView === 'DASHBOARD' && 'Visão Geral'}
              {currentView === 'ASSETS' && 'Controle de Ativos'}
              {currentView === 'MOVEMENTS' && 'Auditoria & Logs'}
              {currentView === 'TEAMS' && 'Equipes Regionais'}
              {currentView === 'DETAILS' && 'Detalhes do Ativo'}
              {currentView === 'ADMIN' && 'Administração'}
            </h1>
          </div>

          <div className="flex items-center w-full max-w-md ml-4">
             <div className="relative w-full">
               <input 
                  type="text"
                  placeholder="Buscar por IMEI, Serial, Tag ou Responsável..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-gsa-green focus:border-transparent text-sm"
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
               />
               <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};