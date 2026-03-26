import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLog } from '../types';
import { 
  PlusCircle, Edit, Trash2, ArrowRightLeft, UploadCloud, 
  Monitor, User, Users, Briefcase, Activity, Filter, Clock 
} from 'lucide-react';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Traz os últimos 100 para não pesar
    
    if (!error && data) setLogs(data as AuditLog[]);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchAction = filterAction === 'ALL' || log.action_type === filterAction;
    const matchEntity = filterEntity === 'ALL' || log.entity_type === filterEntity;
    return matchAction && matchEntity;
  });

  // --- DESIGN SYSTEM DO LOG ---
  const getActionConfig = (action: string) => {
    switch(action) {
      case 'CREATE': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: PlusCircle, label: 'Criação' };
      case 'UPDATE': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Edit, label: 'Edição' };
      case 'DELETE': return { color: 'bg-red-100 text-red-700 border-red-200', icon: Trash2, label: 'Exclusão' };
      case 'MOVE':   return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: ArrowRightLeft, label: 'Movimentação' };
      case 'IMPORT': return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: UploadCloud, label: 'Importação' };
      default:       return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Activity, label: 'Sistema' };
    }
  };

  const getEntityIcon = (entity: string) => {
    switch(entity) {
      case 'ASSET': return <Monitor size={16} />;
      case 'EMPLOYEE': return <User size={16} />;
      case 'TEAM': return <Users size={16} />;
      case 'ROLE': return <Briefcase size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Trilha de Auditoria</h2>
          <p className="text-sm text-slate-500">Histórico completo de ações no sistema</p>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 md:flex-none">
            <Filter size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="ALL">Todas as Ações</option>
              <option value="CREATE">Criações</option>
              <option value="UPDATE">Edições</option>
              <option value="DELETE">Exclusões</option>
              <option value="MOVE">Movimentações</option>
              <option value="IMPORT">Importações</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 md:flex-none">
            <Filter size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="ALL">Todos os Tipos</option>
              <option value="ASSET">Ativos</option>
              <option value="EMPLOYEE">Funcionários</option>
              <option value="TEAM">Equipes</option>
            </select>
          </div>
          <button onClick={fetchLogs} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-slate-600 transition-colors" title="Atualizar">
            <Clock size={20} />
          </button>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Carregando auditoria...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Nenhum registro encontrado com estes filtros.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const ActionStyle = getActionConfig(log.action_type);
              const ActionIcon = ActionStyle.icon;
              
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                  {/* Ícone da Ação (Bolota colorida) */}
                  <div className={`p-3 rounded-full border shadow-sm ${ActionStyle.color} flex-shrink-0 mt-1`}>
                    <ActionIcon size={20} />
                  </div>
                  
                  {/* Conteúdo do Log */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${ActionStyle.color}`}>
                        {ActionStyle.label}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                        {getEntityIcon(log.entity_type)} {log.entity_type}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 break-words leading-relaxed">
                      {log.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <User size={12}/> Usuário: <span className="font-bold text-slate-600">{log.actor_name}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};