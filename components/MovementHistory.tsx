import React from 'react';
import { Movement, Asset } from '../types';
import { Calendar, ArrowRight } from 'lucide-react';

interface MovementHistoryProps {
  movements: Movement[];
  assets: Asset[];
}

export const MovementHistory: React.FC<MovementHistoryProps> = ({ movements, assets }) => {
  if (!movements || movements.length === 0) return <div className="p-8 text-center text-slate-400">Sem histórico.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-700 flex gap-2 items-center">
        <Calendar size={18}/> Histórico Geral
      </div>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-white text-xs font-bold text-slate-400 uppercase">
          <tr><th className="px-6 py-3 text-left">Data</th><th className="px-6 py-3 text-left">Ativo</th><th className="px-6 py-3 text-left">Fluxo</th><th className="px-6 py-3 text-left">Motivo</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {movements.map(m => {
            const asset = assets.find(a => a.id === m.assetId);
            return (
              <tr key={m.id} className="text-sm hover:bg-slate-50">
                <td className="px-6 py-4">{new Date(m.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-gsa-blue">
                  {asset ? `${asset.type} ${asset.brand}` : 'Removido'}
                  <div className="text-xs font-normal text-slate-400">{asset?.primaryId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{m.fromOwnerName}</span> <ArrowRight size={14}/> <span className="font-bold">{m.toOwnerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{m.reason}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};