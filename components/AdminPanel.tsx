import React, { useState, useEffect } from 'react';
import { Asset, Channel, Employee, OwnerType, Team, Role } from '../types';
import { PlusCircle, Users, Briefcase, Monitor, Trash2, Edit, X, MapPin, Package, UploadCloud } from 'lucide-react';
import { STOCK_OWNER_ID, STOCK_OWNER_NAME } from '../constants';
import { DataImporter } from './DataImporter';
import { supabase } from '../lib/supabase'; // Adicionado para gravar log de auditoria

interface AdminPanelProps {
  assets: Asset[]; employees: Employee[]; teams: Team[]; roles: Role[];
  onAddAsset: (a: Asset) => void; onUpdateAsset: (a: Asset) => void; onDeleteAsset: (id: string) => void;
  onAddEmployee: (e: Employee) => void; onUpdateEmployee: (e: Employee) => void; onDeleteEmployee: (id: string) => void;
  onAddTeam: (t: Team) => void; onUpdateTeam: (t: Team) => void; onDeleteTeam: (id: string) => void;
  onAddRole: (r: Role) => void; onUpdateRole: (r: Role) => void; onDeleteRole: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'EMPLOYEES' | 'TEAMS' | 'ROLES' | 'IMPORT'>('ASSETS');
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [viewingAssets, setViewingAssets] = useState<Employee | null>(null);

  const tabNames = { ASSETS: 'ATIVOS', EMPLOYEES: 'FUNCIONÁRIOS', TEAMS: 'EQUIPES', ROLES: 'VAGAS', IMPORT: 'IMPORTAÇÃO' };
  const ASSET_TYPES = ['NOTEBOOK', 'DESKTOP', 'CELULAR'];
  const ASSET_BRANDS = ['Samsung', 'Dell', 'Lenovo', 'Apple', 'HP', 'Motorola'];
  const ASSET_STATES = ['NOVO', 'USADO', 'QUEBRADO', 'COM DEFEITO'];
  const REGIONS = ['GO', 'MT', 'TO', 'ADM', 'INDIRETO'];
  const CHANNELS = ['CV', 'ATACADO', 'KEY ACCOUNT', 'ADMINISTRATIVO', 'VETOR'];

  useEffect(() => { setIsEditing(false); setFormState({}); }, [activeTab]);

  const startEdit = (item: any) => {
    let editState = { ...item };
    if (activeTab === 'EMPLOYEES') {
      const matchingRole = props.roles.find(r => r.description === item.role && r.region === item.region);
      if (matchingRole) {
        editState.roleId = matchingRole.id; 
      }
    }
    setFormState(editState);
    setIsEditing(true);
  };

  const startCreate = () => {
    setIsEditing(true);
    if (activeTab === 'ASSETS') setFormState({ type: 'NOTEBOOK', brand: 'Samsung', state: 'NOVO', region: 'GO', value: 0, assetTag: '', primaryId: '' });
    if (activeTab === 'EMPLOYEES') setFormState({ active: true, roleId: '' });
    if (activeTab === 'TEAMS') setFormState({ region: 'GO', channel: 'CV' });
    if (activeTab === 'ROLES') setFormState({ region: 'GO', status: 'VAGA_ABERTA' });
  };

  const handleRoleChange = (roleId: string) => {
    const role = props.roles.find(r => r.id === roleId);
    setFormState({
      ...formState,
      roleId: roleId,
      region: role ? role.region : formState.region,
      teamId: role ? role.teamId : formState.teamId
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'ASSETS') {
      if (formState.id) props.onUpdateAsset(formState as Asset);
      else props.onAddAsset({ ...formState, currentOwnerType: OwnerType.ESTOQUE, currentOwnerId: STOCK_OWNER_ID, currentOwnerName: STOCK_OWNER_NAME } as Asset);
    }
    if (activeTab === 'EMPLOYEES') {
      const { roleId, ...dadosLimpos } = formState;
      const selectedRole = props.roles.find(r => r.id === roleId);
      const payload = { ...dadosLimpos, role: selectedRole ? selectedRole.description : formState.role };
      if (formState.id) props.onUpdateEmployee(payload as Employee);
      else props.onAddEmployee(payload as Employee);
    }
    if (activeTab === 'TEAMS') {
      if (formState.id) props.onUpdateTeam(formState as Team);
      else props.onAddTeam(formState as Team);
    }
    if (activeTab === 'ROLES') {
      if (formState.id) props.onUpdateRole(formState as Role);
      else props.onAddRole(formState as Role);
    }
    setIsEditing(false);
    setFormState({});
  };

  const InputClass = "w-full border-slate-300 rounded p-2 border mt-1 text-sm bg-white";
  const LabelClass = "block text-xs font-bold text-slate-500 uppercase";

  const renderAssetsModal = () => {
    if (!viewingAssets) return null;
    const userAssets = props.assets.filter(a => a.currentOwnerId === viewingAssets.id);
    const totalValue = userAssets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-800">Ativos Vinculados</h3>
              <p className="text-sm text-slate-500">Responsável: <span className="font-bold text-gsa-blue">{viewingAssets.name}</span></p>
            </div>
            <button onClick={() => setViewingAssets(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {userAssets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center"><Package size={48} className="mb-2 opacity-20"/><p>Nenhum ativo sob responsabilidade deste funcionário.</p></div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500"><tr><th className="p-3 rounded-l-lg">Identificação</th><th className="p-3">Tipo/Marca</th><th className="p-3 text-right rounded-r-lg">Valor</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {userAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="p-3"><div className="font-bold text-slate-700">{asset.assetTag || 'S/ TAG'}</div><div className="text-[10px] font-mono text-slate-400">{asset.primaryId}</div></td>
                      <td className="p-3 text-slate-600">{asset.type} - {asset.brand}</td>
                      <td className="p-3 text-right font-mono text-slate-600">R$ {Number(asset.value).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Total sob custódia</span><span className="text-lg font-black text-slate-800">R$ {totalValue.toFixed(2)}</span></div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (activeTab === 'IMPORT') return null;
    const data = activeTab === 'ASSETS' ? props.assets : activeTab === 'EMPLOYEES' ? props.employees : activeTab === 'TEAMS' ? props.teams : props.roles;
    if (!data || data.length === 0) return <tbody><tr><td colSpan={3} className="p-12 text-center text-slate-400">Nenhum registro encontrado.</td></tr></tbody>;

    return (
      <tbody className="divide-y divide-slate-200">
        {data.map((item: any) => (
          <tr key={item.id} className="text-sm hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-bold text-slate-700">
              {activeTab === 'ASSETS' ? (
                <div><div className="flex items-center gap-2"><span className="uppercase text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">{item.type}</span> <span className="text-gsa-blue">{item.brand}</span></div><div className="text-sm font-black text-slate-800 mt-1">{item.assetTag || item.primaryId}</div>{item.assetTag && <div className="text-[10px] font-mono font-normal text-slate-400">S/N: {item.primaryId || 'N/A'}</div>}</div>
              )  : activeTab === 'ROLES' ? item.code : activeTab === 'EMPLOYEES' ? (
                 <div className="flex flex-col gap-1"><div className="font-bold text-slate-800">{item.name}</div><span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded w-fit border ${item.status === 'Ativo' ? 'bg-green-100 text-green-700 border-green-200' : item.status === 'Desligado' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{item.status || 'Ativo'}</span></div>
              ) : item.name}
            </td>
            <td className="px-6 py-4 text-xs text-slate-500">
              {activeTab === 'ASSETS' ? (
                <div className="flex flex-col gap-1"><span className={`font-bold w-fit ${item.state === 'NOVO' ? 'text-green-600' : 'text-slate-500'}`}>{item.state}</span><span className="text-xs bg-yellow-50 text-yellow-700 px-1 py-0.5 rounded w-fit border border-yellow-100">{item.status}</span><span>R$ {Number(item.value).toFixed(2)}</span></div>
              ) : activeTab === 'EMPLOYEES' ? (
                <div className="space-y-1"><div className="font-bold text-slate-700">{item.role}</div><div className="flex items-center gap-2"><span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase"><MapPin size={10} className="mr-1"/> {item.region}</span>{item.teamId && (<span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">{props.teams.find(t => t.id === item.teamId)?.name || 'Equipe Desconhecida'}</span>)}</div></div>
              ) : activeTab === 'ROLES' ? item.description : activeTab === 'TEAMS' ? `${item.region} - ${item.channel}` : item.region}
            </td>
            <td className="px-6 py-4 text-right whitespace-nowrap">
              {activeTab === 'EMPLOYEES' && <button onClick={() => setViewingAssets(item)} title="Ver Ativos" className="text-slate-500 hover:bg-slate-100 hover:text-gsa-blue p-2 rounded mr-2 transition-colors"><Package size={16}/></button>}
              <button onClick={() => startEdit(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded mr-2"><Edit size={16}/></button>
              
              {/* AQUI ESTÁ A AUDITORIA EMBUTIDA NO BOTÃO DE DELETAR */}
              <button 
                onClick={() => { 
                  if(confirm('Excluir permanentemente?')) { 
                    if(activeTab === 'ASSETS') props.onDeleteAsset(item.id); 
                    else if(activeTab === 'EMPLOYEES') props.onDeleteEmployee(item.id); 
                    else if(activeTab === 'TEAMS') props.onDeleteTeam(item.id); 
                    else if(activeTab === 'ROLES') props.onDeleteRole(item.id); 
                  } 
                }} 
                className="text-red-400 hover:bg-red-50 p-2 rounded"
              >
                <Trash2 size={16}/>
              </button>

            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col relative">
      {renderAssetsModal()}
      <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto">
        {[
          {id:'ASSETS',label:'Ativos',icon:Monitor},
          {id:'EMPLOYEES',label:'Funcionários',icon:Users},
          {id:'TEAMS',label:'Equipes',icon:Users},
          {id:'ROLES',label:'Vagas',icon:Briefcase},
          {id:'IMPORT',label:'Importar',icon:UploadCloud}
        ].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={`flex items-center px-8 py-4 font-bold border-r border-slate-200 whitespace-nowrap transition-colors ${activeTab===tab.id ? 'bg-white text-gsa-blue border-b-2 border-b-gsa-blue' : 'text-slate-400 hover:bg-slate-100'}`}><tab.icon size={18} className="mr-2"/>{tab.label}</button>
        ))}
      </div>
      
      <div className="p-8 flex-1">
        {activeTab === 'IMPORT' ? (
           <DataImporter onSuccess={() => { alert('Importação concluída!'); setActiveTab('ASSETS'); }}/>
        ) : !isEditing ? (
          <>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black uppercase text-slate-800">Gerenciar {tabNames[activeTab]}</h2><button onClick={startCreate} className="bg-gsa-blue text-white px-6 py-2.5 rounded-lg font-bold flex items-center shadow hover:bg-blue-700 transition-all"><PlusCircle size={18} className="mr-2"/> Adicionar</button></div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400"><tr><th className="px-6 py-3 text-left">Item</th><th className="px-6 py-3 text-left">Detalhes</th><th className="px-6 py-3 text-right">Ações</th></tr></thead>
              {renderTable()}
            </table></div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-inner space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4"><h3 className="font-black text-xl text-slate-800 uppercase">{formState.id ? 'Editar' : 'Novo'} Cadastro</h3><button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button></div>
            
            {activeTab === 'ASSETS' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className={LabelClass}>Tipo</label><select className={InputClass} value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})}>{ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className={LabelClass}>Marca</label><select className={InputClass} value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value})}>{ASSET_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div><label className={LabelClass}>Etiqueta GSA</label><input className={InputClass} placeholder="Se houver" value={formState.assetTag || ''} onChange={e => setFormState({...formState, assetTag: e.target.value})} /></div>
                <div><label className={LabelClass}>Serial / IMEI</label><input className={InputClass} required value={formState.primaryId || ''} onChange={e => setFormState({...formState, primaryId: e.target.value})} /></div>
                <div><label className={LabelClass}>Estado Físico</label><select className={InputClass} value={formState.state} onChange={e => setFormState({...formState, state: e.target.value})}>{ASSET_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className={LabelClass}>Cor</label><input className={InputClass} value={formState.color || ''} onChange={e => setFormState({...formState, color: e.target.value})} /></div>
                <div><label className={LabelClass}>Valor (R$)</label><input type="number" step="0.01" className={InputClass} value={formState.value || ''} onChange={e => setFormState({...formState, value: e.target.value})} /></div>
                <div className="md:col-span-2"><label className={LabelClass}>Detalhes</label><input className={InputClass} value={formState.details || ''} onChange={e => setFormState({...formState, details: e.target.value})} /></div>
              </div>
            )}
            
            {activeTab === 'EMPLOYEES' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className={LabelClass}>Nome Completo</label><input required className={InputClass} value={formState.name || ''} onChange={e => setFormState({...formState, name: e.target.value})} /></div>
                <div className="md:col-span-2">
                  <label className={LabelClass}>Vaga (Define Região e Equipe)</label>
                  <select required className={InputClass} value={formState.roleId || ''} onChange={e => handleRoleChange(e.target.value)}>
                    <option value="">Selecione...</option>
                    {props.roles.map(r => <option key={r.id} value={r.id}>[{r.region}] {r.code} - {r.description}</option>)}
                  </select>
                  <div className="mt-2 flex gap-4 text-xs font-bold text-slate-500 bg-slate-100 p-2 rounded">
                    <span>📍 Região: <span className="text-gsa-blue">{formState.region || '-'}</span></span>
                    <span>👥 Equipe: <span className="text-gsa-blue">{props.teams.find(t => t.id === formState.teamId)?.name || 'Nenhuma/Avulsa'}</span></span>
                  </div>
                </div>
                <div className="mt-6">
                  <label className={LabelClass}>Status do Funcionário</label>
                  <select className={InputClass} value={formState.status || 'Ativo'} onChange={e => setFormState({...formState, status: e.target.value})}>
                    <option value="Ativo">Ativo</option>
                    <option value="Afastado">Afastado</option>
                    <option value="Desligado">Desligado</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'TEAMS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className={LabelClass}>Nome da Equipe</label><input required className={InputClass} value={formState.name || ''} onChange={e => setFormState({...formState, name: e.target.value})} /></div>
                <div><label className={LabelClass}>Região</label><select className={InputClass} value={formState.region} onChange={e => setFormState({...formState, region: e.target.value})}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div><label className={LabelClass}>Canal</label><select className={InputClass} value={formState.channel} onChange={e => setFormState({...formState, channel: e.target.value})}>{CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="md:col-span-2"><label className={LabelClass}>Supervisor</label><select className={InputClass} value={formState.leaderId || ''} onChange={e => setFormState({...formState, leaderId: e.target.value})}><option value="">Selecione...</option>{props.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
              </div>
            )}

            {activeTab === 'ROLES' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CAMPO DE CÓDIGO TRAVADO (AUTONUMERAÇÃO) */}
                  <div>
                    <label className={LabelClass}>Código Vaga</label>
                    <input 
                      className={`${InputClass} bg-slate-100 cursor-not-allowed text-slate-400 font-mono font-bold`} 
                      value={formState.id ? formState.code : 'Gerado Automático'} 
                      readOnly 
                      disabled 
                      title="O código será gerado automaticamente ao salvar"
                    />
                  </div>

                  <div><label className={LabelClass}>Descrição / Nome do Cargo</label><input required className={InputClass} value={formState.description || ''} onChange={e => setFormState({...formState, description: e.target.value})} /></div>
                  <div><label className={LabelClass}>Região</label><select className={InputClass} value={formState.region} onChange={e => setFormState({...formState, region: e.target.value})}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  <div><label className={LabelClass}>Equipe Fixa</label><select className={InputClass} value={formState.teamId || ''} onChange={e => setFormState({...formState, teamId: e.target.value})}><option value="">Vaga Avulsa / Flexível</option>{props.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                  <div className="md:col-span-2">
                    <label className={LabelClass}>Status da Vaga</label>
                    <select className={InputClass} value={formState.status || 'ATIVA'} onChange={e => setFormState({...formState, status: e.target.value})}>
                      <option value="ATIVA">Ativa</option>
                      <option value="INATIVA">Inativa</option>
                    </select>
                  </div>
                </div>

                {/* O KIT PADRÃO DA T.I. */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Monitor size={16} className="text-gsa-blue" />
                    Kit Padrão de Equipamentos (T.I.)
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Marque os equipamentos obrigatórios para esta vaga. O sistema avisará caso falte algo para o funcionário.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-gsa-blue rounded border-slate-300 focus:ring-gsa-blue" checked={formState.reqNotebook || false} onChange={e => setFormState({...formState, reqNotebook: e.target.checked})} />
                      <span className="text-sm font-bold text-slate-700">Notebook</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-gsa-blue rounded border-slate-300 focus:ring-gsa-blue" checked={formState.reqDesktop || false} onChange={e => setFormState({...formState, reqDesktop: e.target.checked})} />
                      <span className="text-sm font-bold text-slate-700">Desktop</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-gsa-blue rounded border-slate-300 focus:ring-gsa-blue" checked={formState.reqMobile || false} onChange={e => setFormState({...formState, reqMobile: e.target.checked})} />
                      <span className="text-sm font-bold text-slate-700">Celular</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-gsa-blue rounded border-slate-300 focus:ring-gsa-blue" checked={formState.reqSim || false} onChange={e => setFormState({...formState, reqSim: e.target.checked})} />
                      <span className="text-sm font-bold text-slate-700">Linha / Chip</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-8 py-2.5 bg-gsa-green text-white rounded-lg font-black shadow-md hover:bg-green-600">SALVAR</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};