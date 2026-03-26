import React, { useState } from 'react';
import { Asset, OwnerType, Movement, AssetStatus, Employee } from '../types';
import { STOCK_OWNER_ID, STOCK_OWNER_NAME } from '../constants';
import { X, Save, AlertCircle } from 'lucide-react';

interface MovementFormProps {
  selectedAssets: Asset[];
  employees: Employee[];
  onClose: () => void;
  onSubmit: (movements: Partial<Movement>[], newStatus: AssetStatus, newOwner: { type: OwnerType, id: string, name: string }) => void;
}

export const MovementForm: React.FC<MovementFormProps> = ({ selectedAssets, employees, onClose, onSubmit }) => {
  const [targetType, setTargetType] = useState<OwnerType>(OwnerType.FUNCIONARIO);
  const [targetId, setTargetId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  // Padrão: Em Uso. Mas se for para manutenção, usuário muda.
  const [newStatus, setNewStatus] = useState<AssetStatus>(AssetStatus.EM_USO);

  const canSubmit = targetId && reason && selectedAssets.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let targetName = '';
    if (targetType === OwnerType.FUNCIONARIO) {
      const emp = employees.find(e => e.id === targetId);
      targetName = emp ? emp.name : 'Desconhecido';
    } else if (targetType === OwnerType.ESTOQUE) {
      targetName = STOCK_OWNER_NAME;
    } else {
      targetName = targetId; 
    }

    const movementTemplate: Partial<Movement> = {
      toOwnerType: targetType, toOwnerId: targetId, toOwnerName: targetName,
      reason, observations, registeredBy: 'Admin', date: new Date().toISOString()
    };

    const movementsPayload = selectedAssets.map(asset => ({
      ...movementTemplate,
      assetId: asset.id,
      fromOwnerType: asset.currentOwnerType,
      fromOwnerId: asset.currentOwnerId,
      fromOwnerName: asset.currentOwnerName,
    }));

    onSubmit(movementsPayload, newStatus, { type: targetType, id: targetId, name: targetName });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gsa-blue text-white p-4 flex justify-between items-center">
          <div><h2 className="text-xl font-bold">Nova Movimentação</h2><p className="text-sm text-blue-200">Transferindo {selectedAssets.length} item(ns)</p></div>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Itens Selecionados</h4>
            <div className="flex flex-wrap gap-2">{selectedAssets.map(asset => (<span key={asset.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm">{asset.type} {asset.brand} <span className="text-slate-400 ml-1 font-normal">({asset.primaryId})</span></span>))}</div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Destino</label>
                <select className="w-full border-slate-300 rounded-lg p-2 border" value={targetType} onChange={(e) => {
                    setTargetType(e.target.value as OwnerType); setTargetId('');
                    // Auto-sugestão de status baseada no destino
                    if(e.target.value === OwnerType.ESTOQUE) setNewStatus(AssetStatus.EM_ESTOQUE);
                    else if(e.target.value === OwnerType.MANUTENCAO) setNewStatus(AssetStatus.EM_MANUTENCAO);
                    else setNewStatus(AssetStatus.EM_USO);
                  }}>
                  {Object.values(OwnerType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Destinatário</label>
                {targetType === OwnerType.FUNCIONARIO ? (
                  <select className="w-full border-slate-300 rounded-lg p-2 border" value={targetId} onChange={(e) => setTargetId(e.target.value)} required><option value="">Selecione...</option>{employees.filter(e => e.status === 'Ativo').map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}</select>
                ) : targetType === OwnerType.ESTOQUE ? (
                  <select className="w-full border-slate-300 rounded-lg p-2 border" value={targetId} onChange={(e) => setTargetId(e.target.value)} required><option value="">Confirme...</option><option value={STOCK_OWNER_ID}>{STOCK_OWNER_NAME}</option></select>
                ) : (
                  <input type="text" className="w-full border-slate-300 rounded-lg p-2 border" placeholder="Nome ou ID externo" value={targetId} onChange={(e) => setTargetId(e.target.value)} required />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Novo Status Operacional</label>
                 <select className="w-full border-slate-300 rounded-lg p-2 border" value={newStatus} onChange={(e) => setNewStatus(e.target.value as AssetStatus)}>
                   {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo</label>
                <select className="w-full border-slate-300 rounded-lg p-2 border" value={reason} onChange={(e) => setReason(e.target.value)} required><option value="">Selecione...</option><option value="Admissão">Admissão</option><option value="Demissão">Demissão</option><option value="Troca/Upgrade">Troca/Upgrade</option><option value="Manutenção">Envio Manutenção</option><option value="Retorno">Retorno Manutenção</option><option value="Empréstimo">Empréstimo</option><option value="Outro">Outro</option></select>
              </div>
            </div>

            <div><label className="block text-sm font-bold text-slate-700 mb-1">Observações</label><textarea className="w-full border-slate-300 rounded-lg p-2 border" rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} /></div>
            <div className="bg-blue-50 p-3 rounded-md flex items-start text-sm text-blue-700"><AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} /><p>O status operacional será atualizado, mas o estado físico (Novo/Usado) do bem será mantido.</p></div>
          </form>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-800">Cancelar</button><button onClick={handleSubmit} disabled={!canSubmit} className={`px-4 py-2 rounded-lg text-white font-bold flex items-center ${canSubmit ? 'bg-gsa-green hover:bg-green-600 shadow-md' : 'bg-slate-300 cursor-not-allowed'}`}><Save size={18} className="mr-2" /> Confirmar</button></div>
      </div>
    </div>
  );
};