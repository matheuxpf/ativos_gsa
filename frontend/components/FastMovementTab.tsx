import React, { useState, useMemo } from 'react';
import { Asset, Employee, Movement, AssetStatus, OwnerType } from '../types';
import { ArrowRightLeft, Monitor, Smartphone, Search, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { STOCK_OWNER_ID, STOCK_OWNER_NAME } from '../constants';

interface FastMovementTabProps {
  assets: Asset[];
  employees: Employee[];
  onConfirmMove: (movements: Partial<Movement>[], newStatus: AssetStatus, newOwner: { type: OwnerType, id: string, name: string }) => void;
}

export const FastMovementTab: React.FC<FastMovementTabProps> = ({ assets, employees, onConfirmMove }) => {
  const [assetQuery, setAssetQuery] = useState('');
  const [empQuery, setEmpQuery] = useState('');
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | { id: string, name: string } | null>(null);
  const [reason, setReason] = useState('');

  // Asset search
  const filteredAssets = useMemo(() => {
    if (!assetQuery || selectedAsset) return [];
    const lower = assetQuery.toLowerCase();
    return assets.filter(a => 
      (a.assetTag || '').toLowerCase().includes(lower) || 
      (a.primaryId || '').toLowerCase().includes(lower) ||
      (a.type || '').toLowerCase().includes(lower) ||
      (a.brand || '').toLowerCase().includes(lower)
    ).slice(0, 5);
  }, [assetQuery, assets, selectedAsset]);

  // Employee search
  const filteredEmployees = useMemo(() => {
    if (!empQuery || selectedEmp) return [];
    const lower = empQuery.toLowerCase();
    
    const matched = employees.filter(e => 
      (e.name || '').toLowerCase().includes(lower) || 
      (e.role || '').toLowerCase().includes(lower)
    ).slice(0, 5);
    
    // Allow explicitly moving to stock if user types "estoque"
    if ('estoque'.includes(lower)) {
      matched.unshift({ id: STOCK_OWNER_ID, name: STOCK_OWNER_NAME } as any);
    }
    
    return matched;
  }, [empQuery, employees, selectedEmp]);

  const empHasAssets = useMemo(() => {
    if (!selectedEmp || selectedEmp.id === STOCK_OWNER_ID) return false;
    return assets.some(a => a.currentOwnerId === selectedEmp.id && a.id !== selectedAsset?.id);
  }, [selectedEmp, assets, selectedAsset]);

  const handleConfirm = () => {
    if (!selectedAsset || !selectedEmp) return;
    
    let ownerType = OwnerType.FUNCIONARIO;
    if (selectedEmp.id === STOCK_OWNER_ID) {
      ownerType = OwnerType.ESTOQUE;
    }

    const move: Partial<Movement> = {
      assetId: selectedAsset.id,
      fromOwnerId: selectedAsset.currentOwnerId,
      fromOwnerType: selectedAsset.currentOwnerType as OwnerType,
      fromOwnerName: selectedAsset.currentOwnerName,
      toOwnerId: selectedEmp.id,
      toOwnerType: ownerType,
      toOwnerName: selectedEmp.name,
      reason: reason || 'Movimentação Rápida',
      date: new Date().toISOString()
    };

    onConfirmMove([move], AssetStatus.EM_USO, { type: ownerType, id: selectedEmp.id, name: selectedEmp.name });
    
    // Reset
    setSelectedAsset(null);
    setSelectedEmp(null);
    setAssetQuery('');
    setEmpQuery('');
    setReason('');
    alert('Movimentação realizada com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="p-3 bg-gsa-green text-white rounded-xl shadow-lg shadow-gsa-green/30">
            <ArrowRightLeft size={28} />
          </div>
          Movimentação Rápida
        </h2>
        <p className="text-slate-500 mt-2">Transfira equipamentos em poucos cliques. Pesquise o ativo, selecione o destino e confirme.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 relative">
          
          {/* Seta no meio (desktop) */}
          <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
              <ArrowRightLeft size={24} />
            </div>
          </div>

          {/* COLUNA 1: ATIVO */}
          <div className="space-y-6">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">1</span>
              Selecionar Ativo
            </h3>
            
            {!selectedAsset ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ex: GSA050, IMEI..." 
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-gsa-blue focus:ring-4 focus:ring-gsa-blue/10 outline-none text-lg transition-all"
                  value={assetQuery}
                  onChange={e => setAssetQuery(e.target.value)}
                />
                
                {filteredAssets.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
                    {filteredAssets.map(asset => (
                      <button 
                        key={asset.id} 
                        className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div>
                          <div className="font-bold text-slate-800">{asset.assetTag || asset.primaryId}</div>
                          <div className="text-xs text-slate-500">{asset.type} {(asset.brand as string) !== 'Sem Marca' && (asset.brand as string) !== 'Genérica' ? asset.brand : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Dono Atual</div>
                          <div className="text-sm font-medium text-gsa-blue">{asset.currentOwnerName || 'Estoque'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-gsa-blue/20 rounded-xl p-5 relative group transition-all">
                <button 
                  onClick={() => setSelectedAsset(null)} 
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover seleção"
                >
                  <X size={16} />
                </button>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm text-gsa-blue">
                    {selectedAsset.type === 'CELULAR' ? <Smartphone size={32} /> : <Monitor size={32} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">{selectedAsset.assetTag || selectedAsset.primaryId}</h4>
                    <p className="text-slate-500 text-sm">{selectedAsset.type} {(selectedAsset.brand as string) !== 'Sem Marca' && (selectedAsset.brand as string) !== 'Genérica' ? selectedAsset.brand : ''}</p>
                    <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm">
                      <span className="text-slate-400 text-xs font-bold uppercase">Com:</span>
                      <span className="font-bold text-slate-700">{selectedAsset.currentOwnerName || 'Estoque'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA 2: DESTINO */}
          <div className={`space-y-6 transition-opacity duration-300 ${!selectedAsset ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${selectedAsset ? 'bg-gsa-green text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>2</span>
              Novo Destino
            </h3>

            {!selectedEmp ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Nome do funcionário ou 'Estoque'..." 
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-gsa-green focus:ring-4 focus:ring-gsa-green/10 outline-none text-lg transition-all"
                  value={empQuery}
                  onChange={e => setEmpQuery(e.target.value)}
                />
                
                {filteredEmployees.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
                    {filteredEmployees.map(emp => (
                      <button 
                        key={emp.id} 
                        className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex flex-col"
                        onClick={() => setSelectedEmp(emp)}
                      >
                        <span className="font-bold text-slate-800">{emp.name}</span>
                        {(emp as Employee).role && <span className="text-xs text-slate-500">{(emp as Employee).role}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 border-2 border-gsa-green/20 rounded-xl p-5 relative group transition-all">
                  <button 
                    onClick={() => setSelectedEmp(null)} 
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover seleção"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gsa-green font-bold text-xl shadow-sm border border-slate-100">
                      {selectedEmp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">{selectedEmp.name}</h4>
                      <p className="text-slate-500 text-sm">{(selectedEmp as Employee).role || 'Estoque'}</p>
                    </div>
                  </div>
                </div>

                {/* ALERTA INTELIGENTE (COMO PEDIDO PELO USER) */}
                {empHasAssets && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 text-yellow-800 animate-in slide-in-from-top-2">
                    <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h5 className="font-bold text-sm">Atenção: Já possui ativo</h5>
                      <p className="text-xs mt-1 opacity-90">Este funcionário já tem um equipamento registrado no nome dele. A transferência continuará permitida (útil para 2ª máquina ou empréstimo), mas certifique-se de que está correto.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 3: CONFIRMAÇÃO E MOTIVO */}
        {selectedAsset && selectedEmp && (
          <div className="p-8 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-bottom-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo da Movimentação (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Troca de máquina, empréstimo, nova contratação..." 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-gsa-green focus:ring-2 focus:ring-gsa-green/20 outline-none transition-all bg-white"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-gsa-green to-gsa-lightGreen text-white text-lg font-black py-4 rounded-xl shadow-lg shadow-gsa-green/30 hover:shadow-xl hover:shadow-gsa-green/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} />
                Confirmar Movimentação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
