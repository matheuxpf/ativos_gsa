import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle, XCircle, Monitor, Smartphone, Users, ChevronLeft } from 'lucide-react';
import { AssetStatus, OwnerType } from '../types';
import { STOCK_OWNER_ID, STOCK_OWNER_NAME } from '../constants';

type ImportMode = 'COMPUTERS' | 'MOBILES' | 'EMPLOYEES' | null;

export const DataImporter: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [mode, setMode] = useState<ImportMode>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{type: 'success'|'error'|'info', msg: string}[]>([]);
  const [pendingData, setPendingData] = useState<any[] | null>(null);
  const [importStats, setImportStats] = useState<{ new: number; update: number } | null>(null);

  const MODULES = {
    COMPUTERS: {
      title: 'Computadores & Servidores',
      icon: Monitor,
      table: 'assets',
      description: 'Importação exclusiva para Máquinas da TI.',
      expectedColumns: ['Nome do Dispositivo (Obrigatório - GSAxxx)', 'Tipo', 'Modelo', 'MAC Address', 'Estado'],
    },
    MOBILES: {
      title: 'Dispositivos Mobile',
      icon: Smartphone,
      table: 'assets',
      description: 'Importação de Celulares e Tablets via MDM.',
      expectedColumns: ['IMEI / Serial (Obrigatório)', 'Nome / Modelo', 'Sistema Operacional', 'Armazenamento', 'Estado'],
    },
    EMPLOYEES: {
      title: 'Equipes & Funcionários',
      icon: Users,
      table: 'employees',
      description: 'Carga inicial de Colaboradores e Cargos.',
      expectedColumns: ['Nome Completo (Obrigatório)', 'Cargo', 'Região (Ex: GO, MT)', 'Equipe', 'Status'],
    }
  };

  // ==========================================
  // MOTOR PRINCIPAL DE LEITURA (BLINDADO)
  // ==========================================
  const processExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mode) return;

    setLoading(true); setLogs([]); setPendingData(null); setImportStats(null);
    setLogs(prev => [...prev, { type: 'info', msg: `Lendo arquivo: ${file.name}...` }]);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const targetSheetName = workbook.SheetNames.find(n => !n.includes('Instruções') && !n.includes('Dashboard')) || workbook.SheetNames[0];
        
        // 1. LER COMO MATRIZ CRUA (Ignora formatações e linhas vazias no topo)
        const rawMatrix = XLSX.utils.sheet_to_json(workbook.Sheets[targetSheetName], { header: 1 }) as any[][];
        
        // 2. RASTREADOR DE CABEÇALHO (Procura a linha que tem as colunas reais)
        const headerIndex = rawMatrix.findIndex(row => 
          row.some(cell => typeof cell === 'string' && (cell.toUpperCase().includes('NOME') || cell.toUpperCase().includes('DISPOSITIVO') || cell.toUpperCase().includes('IMEI') || cell.toUpperCase().includes('FUNCIONARIO') || cell.toUpperCase().includes('MAC')))
        );

        if (headerIndex === -1) throw new Error("Não consegui encontrar a linha de títulos (Cabeçalho) na planilha.");

        const headers = rawMatrix[headerIndex].map(h => h ? String(h).toUpperCase().trim() : `COL_${Math.random()}`);
        const dataRows = rawMatrix.slice(headerIndex + 1);

        // 3. MONTA O JSON LIMPO
        const rawData = dataRows.map(row => {
          const obj: any = {};
          row.forEach((cell, i) => { if (headers[i]) obj[headers[i]] = cell; });
          return obj;
        });

        let formattedData: any[] = [];

        if (mode === 'COMPUTERS') formattedData = parseComputers(rawData);
        if (mode === 'MOBILES') formattedData = parseMobiles(rawData);
        if (mode === 'EMPLOYEES') formattedData = parseEmployees(rawData);

        if (formattedData.length === 0) throw new Error("Nenhum dado válido encontrado. Verifique se escolheu a opção correta no painel e se os campos obrigatórios estão preenchidos.");

        const uniqueMap = new Map();
        const pk = mode === 'EMPLOYEES' ? 'name' : 'asset_tag';
        formattedData.forEach(item => uniqueMap.set(item[pk], item)); 
        formattedData = Array.from(uniqueMap.values());

        const ids = formattedData.map(d => d[pk]);
        const { data: existingItems, error } = await supabase.from(MODULES[mode].table).select(pk).in(pk, ids);
        if (error) throw error;

        const existingSet = new Set(existingItems?.map(i => i[pk]));
        const updateCount = formattedData.filter(d => existingSet.has(d[pk])).length;
        const newCount = formattedData.length - updateCount;

        setPendingData(formattedData);
        setImportStats({ new: newCount, update: updateCount });
        setLogs(prev => [...prev, { type: 'success', msg: `Análise concluída: ${newCount} novos, ${updateCount} atualizações.` }]);
        setLoading(false);

      } catch (error: any) {
        setLogs(prev => [...prev, { type: 'error', msg: `ERRO: ${error.message}` }]);
        setLoading(false);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // ==========================================
  // PARSERS ENXUTOS (Foco na Carga Inicial MVP)
  // ==========================================
  const parseComputers = (rawData: any[]) => {
    return rawData.map((row: any) => {
      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const found = Object.keys(row).find(k => k.includes(alias));
          if (found) return row[found];
        }
        return null;
      };

      // 🔴 OBRIGATÓRIOS
      const tipoFisico = (get('TIPO', 'CATEGORIA') || 'NOTEBOOK').toUpperCase();
      if (tipoFisico.includes('MOBILE') || tipoFisico.includes('CELULAR')) return null;

      const nomeMaquina = get('NOME DO DISPOSITIVO', 'NOME DA MÁQUINA', 'HOSTNAME');
      if (!nomeMaquina) return null; // Trava: Sem nome, não entra.

      const macAddress = get('MAC ADDRESS', 'MAC');
      if (!macAddress) return null; // Trava: Sem identificador único, não entra.

      // 🟢 OPCIONAIS
      const modelo = get('MODELO') || '';
      const os = get('SISTEMA OPERACIONAL') || '';
      const detalhesStr = [modelo, os].filter(Boolean).join(' | ');

      // Retorna APENAS o essencial. O resto o Supabase lida com NULL.
      return {
        type: tipoFisico,
        asset_tag: String(nomeMaquina).trim(),
        primary_id: String(macAddress).trim(),
        status: AssetStatus.EM_ESTOQUE, // Injetado fixo pelo frontend
        details: detalhesStr || null,
        current_owner_name: get('USUÁRIO', 'USUARIO') || null
      };
    }).filter(Boolean);
  };

  const parseMobiles = (rawData: any[]) => {
    return rawData.map((row: any) => {
      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const found = Object.keys(row).find(k => k.includes(alias));
          if (found) return row[found];
        }
        return null;
      };

      // 🔴 OBRIGATÓRIOS
      const tipoFisico = (get('TIPO', 'CATEGORIA') || '').toUpperCase();
      if (tipoFisico && !tipoFisico.includes('MOBILE') && !tipoFisico.includes('CELULAR') && !tipoFisico.includes('TABLET')) return null;

      const imei = get('IMEI', 'SERIAL', 'S/N');
      if (!imei) return null; // Trava: Sem IMEI/Serial, não entra.

      // 🟢 OPCIONAIS
      const armazenamento = get('ARMAZENAMENTO') || '';
      const detalhesStr = armazenamento ? `Armazenamento: ${armazenamento}` : null;

      // Retorna APENAS o essencial.
      return {
        type: 'CELULAR',
        asset_tag: get('ETIQUETA', 'TAG') || String(imei).trim(), // Se não tiver tag, usa o IMEI
        primary_id: String(imei).trim(),
        status: AssetStatus.EM_ESTOQUE, // Injetado fixo
        details: detalhesStr,
        current_owner_name: get('USUÁRIO', 'USUARIO') || null
      };
    }).filter(Boolean);
  };

  const parseEmployees = (rawData: any[]) => {
    return rawData.map((row: any) => {
      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const found = Object.keys(row).find(k => k.includes(alias));
          if (found) return row[found];
        }
        return null;
      };

      const nome = get('NOME', 'FUNCIONARIO', 'COLABORADOR');
      if (!nome) return null;

      return {
        name: String(nome).trim(),
        role: get('CARGO', 'FUNCAO') || 'Não Informado',
        region: get('REGIAO', 'FILIAL') || 'GO',
        status: get('STATUS') || 'Ativo',
        team_id: null 
      };
    }).filter(Boolean);
  };

  // ==========================================
  // CONFIRMAÇÃO DE GRAVAÇÃO
  // ==========================================
  const confirmImport = async () => {
    if (!pendingData || !mode) return;
    setLoading(true);

    try {
      const pk = mode === 'EMPLOYEES' ? 'name' : 'asset_tag';
      const { error } = await supabase.from(MODULES[mode].table).upsert(pendingData, { 
        onConflict: pk, ignoreDuplicates: true 
      });

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action_type: 'IMPORT', entity_type: mode === 'EMPLOYEES' ? 'EMPLOYEE' : 'ASSET',
        description: `Importação em lote de ${pendingData.length} registros no módulo ${MODULES[mode].title}.`,
        actor_name: 'Administrador (TI)'
      });

      setLogs(prev => [...prev, { type: 'success', msg: `SUCESSO! Dados gravados na tabela ${MODULES[mode].table}.` }]);
      alert('Importação realizada com sucesso!');
      setPendingData(null); setImportStats(null); setMode(null);
      onSuccess();
    } catch (error: any) {
      setLogs(prev => [...prev, { type: 'error', msg: `Erro de Banco: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DA UI
  // ==========================================
  if (!mode) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-800 text-lg mb-6 text-center">O que você deseja importar?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(MODULES) as ImportMode[]).map((m) => {
            if(!m) return null;
            const Mod = MODULES[m];
            const Icon = Mod.icon;
            return (
              <button key={m} onClick={() => setMode(m)} className="flex flex-col items-center p-6 bg-slate-50 border-2 border-slate-200 hover:border-gsa-blue hover:bg-blue-50 rounded-xl transition-all group">
                <Icon size={40} className="text-slate-400 group-hover:text-gsa-blue mb-4 transition-colors" />
                <span className="font-bold text-slate-700 group-hover:text-gsa-blue">{Mod.title}</span>
                <span className="text-xs text-slate-500 mt-2 text-center">{Mod.description}</span>
              </button>
            )
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <button onClick={() => { setMode(null); setImportStats(null); setPendingData(null); setLogs([]); }} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            {React.createElement(MODULES[mode].icon, { size: 20, className: "text-gsa-blue" })} {MODULES[mode].title}
          </h3>
          <p className="text-xs text-slate-500">Faça o upload da planilha correspondente.</p>
        </div>
      </div>

      {!importStats && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><FileSpreadsheet size={16}/> Padrão Esperado (Colunas)</h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              {MODULES[mode].expectedColumns.map((col, i) => <li key={i}>{col}</li>)}
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
              💡 Nomes de colunas parecidos (ex: "S/N", "Serial", "Identificador") são reconhecidos automaticamente.
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 bg-slate-50">
            <label className={`cursor-pointer bg-gsa-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow transition-all flex items-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              {loading ? <Loader2 className="animate-spin"/> : <Upload size={20}/>}
              {loading ? 'Processando...' : 'Selecionar Arquivo'}
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={processExcel} />
            </label>
          </div>
        </div>
      )}

      {importStats && pendingData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-black text-slate-800 text-lg mb-4 flex items-center"><AlertTriangle className="text-orange-500 mr-2" /> Validação Concluída</h4>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold uppercase">Novos Registros</div>
              <div className="text-3xl font-black text-green-600">+{importStats.new}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold uppercase">Atualizações</div>
              <div className="text-3xl font-black text-orange-500">~{importStats.update}</div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setImportStats(null); setPendingData(null); setLogs([]); }} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg flex items-center"><XCircle size={18} className="mr-2 inline"/> Cancelar</button>
            <button onClick={confirmImport} disabled={loading} className="px-6 py-2 bg-green-600 text-white font-black rounded-lg shadow-lg hover:bg-green-700 flex items-center"><CheckCircle size={18} className="mr-2 inline"/> IMPORTAR PARA O BANCO</button>
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