import React from 'react';
import { Asset, Movement } from '../types';
import { ArrowLeft, Calendar, ArrowDownCircle, FileText } from 'lucide-react';

interface AssetDetailProps {
  asset: Asset;
  movements: Movement[];
  onBack: () => void;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ asset, movements, onBack }) => {
  const history = [...movements].filter(m => m.assetId === asset.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-600 hover:text-gsa-blue font-medium transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar para Lista
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-slate-900">{asset.brand} {asset.type}</h2>
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              ID Principal: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{asset.primaryId}</span>
            </p>
          </div>
          <div className="text-right">
             <div className="text-sm text-slate-500 uppercase font-bold">Valor</div>
             <div className="text-2xl font-black text-gsa-green">R$ {Number(asset.value).toFixed(2)}</div>
             <span className="px-3 py-1 rounded-full text-xs font-bold mt-2 inline-block bg-slate-200 text-slate-700">
               {asset.state}
             </span>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase">Detalhes</label>
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                <p className="text-sm text-slate-700"><b>Cor:</b> {asset.color}</p>
                <p className="text-sm text-slate-700"><b>Obs:</b> {asset.details || 'Sem detalhes.'}</p>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase">Localização</label>
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-700">Responsável: <b className="text-gsa-blue">{asset.currentOwnerName}</b></p>
                <p className="text-xs text-slate-400 mt-1">Status: {asset.status}</p>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Calendar size={20} className="mr-2 text-gsa-green" /> Histórico
        </h3>
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
          {history.length === 0 ? (
            <p className="ml-6 text-slate-400 italic">Sem histórico.</p>
          ) : (
            history.map((move) => (
              <div key={move.id} className="relative ml-6">
                <span className="absolute -left-[31px] top-1 bg-white border-2 border-gsa-blue rounded-full w-4 h-4"></span>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">{new Date(move.date).toLocaleDateString()}</p>
                    <span className="text-[10px] text-slate-400">Reg: {move.registeredBy}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">{move.reason}</h4>
                  <div className="flex items-center gap-3 text-sm">
                     <span className="text-slate-500">{move.fromOwnerName}</span>
                     <ArrowDownCircle size={16} className="text-slate-300 -rotate-90" />
                     <span className="font-bold text-gsa-blue">{move.toOwnerName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};