import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AssetStatus, OwnerType } from '../types';
import { STOCK_OWNER_ID, STOCK_OWNER_NAME } from '../constants';

export const DataImporter: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{type: 'success'|'error'|'info', msg: string}[]>([]);
  
  const [pendingData, setPendingData] = useState<any[] | null>(null);
  const [importStats, setImportStats] = useState<{ new: number; update: number } | null>(null);

  const cleanCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(str) || 0;
  };

  const processExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLogs([]);
    setPendingData(null);
    setImportStats(null);
    setLogs(prev => [...prev, { type: 'info', msg: 'Lendo arquivo...' }]);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        // 1. Processamento e Normalização
        let formattedData = rawData.map((row: any, index) => {
          const r: any = {};
          Object.keys(row).forEach(k => r[k.trim().toUpperCase()] = row[k]);

          const get = (...aliases: string[]) => {
            for (const alias of aliases) {
              if (r[alias] !== undefined) return r[alias];
              const found = Object.keys(r).find(k => k.includes(alias));
              if (found) return r[found];
            }
            return null;
          };

          const serial = get('SERIAL', 'S/N', 'IMEI', 'IDENTIFICADOR');
          
          if (!serial) {
            setLogs(prev => [...prev, { type: 'error', msg: `Linha ${index + 2} ignorada: Falta SERIAL.` }]);
            return null;
          }

          return {
            asset_tag: get('ETIQUETA', 'TAG', 'PLAQUETA', 'GSA', 'PATRIMONIO') || null,
            primary_id: String(serial).trim(),
            type: (get('TIPO', 'CATEGORIA', 'ESPECIE') || 'NOTEBOOK').toUpperCase(),
            brand: (get('MARCA', 'FABRICANTE') || 'GENERICO').toUpperCase(),
            physical_condition: (get('ESTADO', 'CONDICAO') || 'NOVO').toUpperCase(),
            value: cleanCurrency(get('VALOR', 'PRECO', 'CUSTO', 'R$')),
            details: get('DETALHES', 'MODELO', 'OBS') || '',
            status: AssetStatus.EM_ESTOQUE,
            current_owner_type: OwnerType.ESTOQUE,
            current_owner_id: STOCK_OWNER_ID,
            current_owner_name: STOCK_OWNER_NAME,
            color: get('COR') || 'Padrão'
          };
        }).filter(item => item !== null) as any[];

        if (formattedData.length === 0) throw new Error("Nenhum dado válido encontrado.");

        // --- CORREÇÃO AQUI: DEDUPLICAÇÃO LOCAL ---
        // Se a planilha tiver o mesmo serial 2 vezes, pegamos o último (atualizado)
        // Isso evita o erro "ON CONFLICT DO UPDATE command cannot affect row a second time"
        const uniqueMap = new Map();
        formattedData.forEach(item => {
           // O set sobrescreve se a chave já existir, mantendo o último da lista
           uniqueMap.set(item.primary_id, item); 
        });
        // Converte de volta para array
        formattedData = Array.from(uniqueMap.values());
        // -----------------------------------------

        // 2. VERIFICAÇÃO NO BANCO
        const serials = formattedData.map(d => d.primary_id);

        const { data: existingItems, error } = await supabase
          .from('assets')
          .select('primary_id')
          .in('primary_id', serials);

        if (error) throw error;

        const existingSerials = new Set(existingItems?.map(i => i.primary_id));
        
        const updateCount = formattedData.filter(d => existingSerials.has(d.primary_id)).length;
        const newCount = formattedData.length - updateCount;

        setPendingData(formattedData);
        setImportStats({ new: newCount, update: updateCount });
        setLoading(false);

      } catch (error: any) {
        console.error(error);
        setLogs(prev => [...prev, { type: 'error', msg: `ERRO: ${error.message}` }]);
        setLoading(false);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    if (!pendingData) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('assets').upsert(pendingData, { 
        onConflict: 'primary_id',
        ignoreDuplicates: false 
      });

      if (error) throw error;

      setLogs(prev => [...prev, { type: 'success', msg: `SUCESSO! Importação concluída.` }]);
      alert('Importação realizada com sucesso!');
      setPendingData(null);
      setImportStats(null);
      onSuccess();

    } catch (error: any) {
      setLogs(prev => [...prev, { type: 'error', msg: `Erro ao salvar: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      {!importStats && (
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 rounded-lg p-8 bg-slate-50">
          <FileSpreadsheet size={48} className="text-gsa-blue mb-4" />
          <h3 className="font-black text-slate-800 text-lg">Importação em Massa</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Selecione o arquivo Excel. O sistema fará uma análise de duplicatas e limpará repetições na planilha.
          </p>
          
          <label className={`cursor-pointer bg-gsa-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {loading ? <Loader2 className="animate-spin"/> : <Upload size={20}/>}
            {loading ? 'Analisando...' : 'Selecionar Arquivo Excel'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={processExcel} />
          </label>
        </div>
      )}

      {importStats && pendingData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
          <h4 className="font-black text-slate-800 text-lg mb-4 flex items-center">
            <AlertTriangle className="text-orange-500 mr-2" /> Resumo da Análise
          </h4>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold uppercase">Novos Cadastros</div>
              <div className="text-3xl font-black text-green-600">+{importStats.new}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold uppercase">Atualizações</div>
              <div className="text-3xl font-black text-orange-500">~{importStats.update}</div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => { setImportStats(null); setPendingData(null); setLogs([]); }}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg flex items-center"
            >
              <XCircle size={18} className="mr-2"/> Cancelar
            </button>
            <button 
              onClick={confirmImport}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white font-black rounded-lg shadow-lg hover:bg-green-700 flex items-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle size={18} className="mr-2"/>}
              CONFIRMAR
            </button>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6 bg-slate-900 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-300'}`}>
              [{new Date().toLocaleTimeString()}] {log.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};