import React, { useState } from 'react';
import { Asset, Employee, Movement, AssetStatus, OwnerType } from '../types';
import { X, ArrowRightLeft, Monitor, Smartphone, Box, Server, Package } from 'lucide-react';
import { STOCK_OWNER_ID, STOCK_OWNER_NAME } from '../constants';

interface MovementFormProps {
  selectedAssets: Asset[];
  employees: Employee[];
  onClose: () => void;
  onSubmit: (movements: Partial<Movement>[], newStatus: AssetStatus, newOwner: { type: OwnerType, id: string, name: string }) => void;
}

export const MovementForm: React.FC<MovementFormProps> = ({ selectedAssets, employees, onClose, onSubmit }) => {
  const [targetOwnerId, setTargetOwnerId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<AssetStatus>(AssetStatus.EM_USO);
  const [reason, setReason] = useState('');

  // Define o ícone correto baseado no tipo do ativo
  const getIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'NOTEBOOK') return <Monitor size={16} className="text-slate-500" />;
    if (t === 'DESKTOP') return <Box size={16} className="text-slate-500" />;
    if (t === 'CELULAR' || t === 'MOBILE') return <Smartphone size={16} className="text-slate-500" />;
    if (t === 'SERVIDOR' || t === 'SERVER') return <Server size={16} className="text-slate-500" />;
    return <Package size={16} className="text-slate-500" />;
  };

  // 🕵️‍♂️ A MÁGICA DA EXIBIÇÃO PARA O GESTOR
  const getDisplayName = (asset: Asset) => {
    const type = (asset.type || '').toUpperCase();
    if (['CELULAR', 'MOBILE', 'SMARTPHONE'].includes(type)) {
      return `${type} (${asset.primaryId || 'Sem IMEI'})`;
    }
    // Prioriza absolutamente a Tag. Só mostra o MAC se o equipamento não tiver sido etiquetado.
    return `${type} (${asset.assetTag || asset.primaryId || 'S/ IDENTIFICAÇÃO'})`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOwnerId) return alert('Selecione um destino válido!');

    let ownerType = OwnerType.FUNCIONARIO;
    let ownerName = '';

    if (targetOwnerId === STOCK_OWNER_ID) {
      ownerType = OwnerType.ESTOQUE;
      ownerName = STOCK_OWNER_NAME;
    } else {
      const emp = employees.find(e => e.id === targetOwnerId);
      if (emp) ownerName = emp.name;
    }

    const movements: Partial<Movement>[] = selectedAssets.map(asset => ({
      assetId: asset.id,
      fromOwnerId: asset.currentOwnerId,
      fromOwnerType: asset.currentOwnerType as OwnerType,
      fromOwnerName: asset.currentOwnerName,
      toOwnerId: targetOwnerId,
      toOwnerType: ownerType,
      toOwnerName: ownerName,
      reason: reason,
      date: new Date().toISOString()
    }));

    onSubmit(movements, newStatus, { type: ownerType, id: targetOwnerId, name: ownerName });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-gsa-blue" /> 
            Movimentar Lote ({selectedAssets.length} ativos)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Lista de Ativos Inteligente */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ativos Selecionados</label>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {selectedAssets.map(asset => (
                <div key={asset.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
                    {getIcon(asset.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-700 text-sm truncate">
                      {getDisplayName(asset)}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      Atual: <span className="font-bold">{asset.currentOwnerName || 'Estoque'}</span> | Status: {asset.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Novo Destino</label>
            <select required className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-gsa-blue focus:outline-none" value={targetOwnerId} onChange={e => setTargetOwnerId(e.target.value)}>
              <option value="">Selecione o novo responsável...</option>
              <optgroup label="Estoque">
                <option value={STOCK_OWNER_ID}>{STOCK_OWNER_NAME}</option>
              </optgroup>
              <optgroup label="Funcionários">
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Novo Status do Ativo</label>
            <select required className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-gsa-blue focus:outline-none" value={newStatus} onChange={e => setNewStatus(e.target.value as AssetStatus)}>
              {Object.values(AssetStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo da Movimentação (Opcional)</label>
            <textarea rows={2} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-gsa-blue focus:outline-none resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Entrega de equipamento novo, manutenção..." />
          </div>

        </form>
        
        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" onClick={handleSubmit} className="px-5 py-2.5 bg-green-600 text-white font-black rounded-lg shadow-md hover:bg-green-700 transition-colors">Confirmar</button>
        </div>

      </div>
    </div>
  );
};