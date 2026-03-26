import React, { useMemo } from 'react';
import { Asset, AssetState } from '../types';
import { Edit, Trash2, ArrowRightLeft, Eye, Monitor, Smartphone, Box } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  onViewDetail: (id: string) => void;
  onInitiateMove: (assets: Asset[]) => void;
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  searchQuery: string;
}

export const AssetList: React.FC<AssetListProps> = ({ assets, onViewDetail, onInitiateMove, onDelete, searchQuery }) => {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // --- CORREÇÃO AQUI: O filtro agora busca em TODOS os campos relevantes ---
  const filteredAssets = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return assets.filter(asset => 
      (asset.brand || '').toLowerCase().includes(lowerQuery) || 
      (asset.assetTag || '').toLowerCase().includes(lowerQuery) ||
      (asset.type || '').toLowerCase().includes(lowerQuery) ||
      (asset.primaryId || '').toLowerCase().includes(lowerQuery) ||
      // Novos campos adicionados na busca:
      (asset.state || '').toLowerCase().includes(lowerQuery) ||       // Busca por "Quebrado", "Novo", etc
      (asset.currentOwnerName || '').toLowerCase().includes(lowerQuery) // Busca por "Matheus", "João", etc
    );
  }, [assets, searchQuery]);
  // -------------------------------------------------------------------------

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const getIcon = (type: string) => {
    if (type === 'NOTEBOOK') return <Monitor size={20} />;
    if (type === 'DESKTOP') return <Box size={20} />;
    if (type === 'CELULAR') return <Smartphone size={20} />;
    return <Box size={20} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800">Inventário Geral</h2>
          <p className="text-sm text-slate-500">
            {filteredAssets.length} ativos encontrados 
            {searchQuery && <span className="text-xs ml-1">(filtrado de {assets.length})</span>}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button onClick={() => onInitiateMove(assets.filter(a => selectedIds.has(a.id)))} className="bg-gsa-blue text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-blue-700 transition-all">
            <ArrowRightLeft className="mr-2" size={18} /> Movimentar ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredAssets.map(a => a.id)) : new Set())} /></th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Ativo</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Identificação</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Estado Físico</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Responsável</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAssets.map(asset => (
              <tr key={asset.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(asset.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => toggleSelect(asset.id)} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mr-3">{getIcon(asset.type)}</div>
                    <div>
                      <div className="font-bold text-slate-700">{asset.type} {asset.brand}</div>
                      <div className="text-xs text-slate-400">{asset.details}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="font-black text-slate-800 text-base">{asset.assetTag || '-'}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {asset.primaryId ? `S/N: ${asset.primaryId}` : 'S/ Serial'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{asset.color}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${asset.state === 'NOVO' ? 'bg-green-100 text-green-700' : asset.state === 'QUEBRADO' || asset.state === 'COM DEFEITO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {asset.state}
                  </span>
                  <div className="text-[10px] uppercase mt-1 text-slate-400">{asset.status}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="font-medium text-gsa-blue">{asset.currentOwnerName}</div>
                  <div className="text-xs text-slate-400">{asset.currentOwnerType}</div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => onViewDetail(asset.id)} className="text-slate-400 hover:text-gsa-blue"><Eye size={18} /></button>
                  <button onClick={() => onDelete(asset.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};