import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { Trash2, ArrowRightLeft, Eye, Monitor, Smartphone, Box, Server, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Adicionado para gravar a auditoria direto daqui

interface AssetListProps {
  assets: Asset[];
  onViewDetail: (id: string) => void;
  onInitiateMove: (assets: Asset[]) => void;
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  searchQuery: string;
}

// Helper para traduzir o ativo para a Auditoria
const formatAssetForAudit = (asset: Asset) => {
  const type = (asset.type || '').toUpperCase();
  const tag = asset.assetTag || 'Sem Tag';
  const serial = asset.primaryId || 'Sem Serial';

  if (type.includes('CELULAR') || type.includes('MOBILE') || type.includes('SMARTPHONE')) {
    return `${asset.type} ${asset.brand} (IMEI/Serial: ${serial})`;
  } else {
    return `${asset.type} ${asset.brand} (Patrimônio: ${tag})`;
  }
};

export const AssetList: React.FC<AssetListProps> = ({ assets, onViewDetail, onInitiateMove, onDelete, searchQuery }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // --- MOTOR DE BUSCA E FILTRO COMBINADO (BLINDADO) ---
  const filteredAssets = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    
    return assets.filter(asset => {
      const matchesSearch = !lowerQuery || (
        (asset.brand || '').toLowerCase().includes(lowerQuery) || 
        (asset.assetTag || '').toLowerCase().includes(lowerQuery) ||
        (asset.primaryId || '').toLowerCase().includes(lowerQuery) ||
        (asset.state || '').toLowerCase().includes(lowerQuery) || 
        (asset.currentOwnerName || '').toLowerCase().includes(lowerQuery) ||
        (asset.type || '').toLowerCase().includes(lowerQuery)
      );

      const assetType = (asset.type || '').toUpperCase().trim();
      let matchesType = false;

      if (typeFilter === 'ALL') {
        matchesType = true;
      } else if (typeFilter === 'CELULAR') {
        matchesType = ['CELULAR', 'MOBILE', 'SMARTPHONE'].includes(assetType);
      } else if (typeFilter === 'SERVIDOR') {
        matchesType = ['SERVIDOR', 'SERVER'].includes(assetType);
      } else {
        matchesType = assetType === typeFilter;
      }

      return matchesSearch && matchesType;
    });
  }, [assets, searchQuery, typeFilter]);
  // -------------------------------------------------------------------------

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const getIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'NOTEBOOK') return <Monitor size={20} />;
    if (t === 'DESKTOP') return <Box size={20} />;
    if (t === 'CELULAR' || t === 'MOBILE') return <Smartphone size={20} />;
    if (t === 'SERVIDOR' || t === 'SERVER') return <Server size={20} />;
    return <Box size={20} />;
  };

  const quickFilters = [
    { id: 'ALL', label: 'Todos', icon: Filter },
    { id: 'NOTEBOOK', label: 'Notebooks', icon: Monitor },
    { id: 'DESKTOP', label: 'Desktops', icon: Box },
    { id: 'CELULAR', label: 'Celulares', icon: Smartphone },
    { id: 'SERVIDOR', label: 'Servidores', icon: Server },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800">Inventário Geral</h2>
          <p className="text-sm text-slate-500">
            {filteredAssets.length} ativos encontrados 
            {(searchQuery || typeFilter !== 'ALL') && <span className="text-xs ml-1 font-bold text-gsa-blue">(filtrado)</span>}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button onClick={() => onInitiateMove(assets.filter(a => selectedIds.has(a.id)))} className="bg-gsa-blue text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-blue-700 transition-all animate-in fade-in slide-in-from-bottom-2">
            <ArrowRightLeft className="mr-2" size={18} /> Movimentar ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {quickFilters.map(filter => {
          const Icon = filter.icon;
          const isActive = typeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setTypeFilter(filter.id)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                isActive ? 'bg-gsa-blue text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left w-12"><input type="checkbox" checked={filteredAssets.length > 0 && selectedIds.size === filteredAssets.length} onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredAssets.map(a => a.id)) : new Set())} className="rounded border-slate-300 text-gsa-blue focus:ring-gsa-blue"/></th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ativo</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Identificação</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Físico</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Responsável</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAssets.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhum ativo encontrado com os filtros atuais.</td></tr>
            ) : (
              filteredAssets.map(asset => (
                <tr key={asset.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(asset.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => toggleSelect(asset.id)} className="rounded border-slate-300 text-gsa-blue focus:ring-gsa-blue"/></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mr-3 shadow-sm">{getIcon(asset.type)}</div>
                      <div>
                        <div className="font-bold text-slate-700 uppercase">{asset.type} <span className="text-gsa-blue">{asset.brand}</span></div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{asset.details || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="font-black text-slate-800 text-base">{asset.assetTag || 'S/ TAG'}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 bg-slate-100 w-fit px-1 rounded">{asset.primaryId ? `S/N: ${asset.primaryId}` : 'S/ Serial'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${asset.state === 'NOVO' ? 'bg-green-100 text-green-700 border border-green-200' : asset.state === 'QUEBRADO' || asset.state === 'COM DEFEITO' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{asset.state || 'N/A'}</span>
                    <div className="text-[10px] uppercase mt-1.5 text-slate-400 font-bold tracking-wider">{asset.status}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-slate-700">{asset.currentOwnerName || 'Estoque TI'}</div>
                    <div className="text-[10px] uppercase text-slate-400 mt-0.5">{asset.currentOwnerType || 'ESTOQUE'}</div>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => onViewDetail(asset.id)} className="p-2 text-slate-400 hover:text-gsa-blue hover:bg-blue-50 rounded-lg transition-colors"><Eye size={18} /></button>
                    {/* AQUI ESTÁ A AUDITORIA EMBUTIDA NO BOTÃO DE DELETAR */}
                    <button 
                      onClick={() => { 
                        if(confirm('Tem certeza que deseja excluir este ativo?')) {
                          onDelete(asset.id);
                        } 
                      }} 
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};