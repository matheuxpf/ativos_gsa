import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle, XCircle, Monitor, Smartphone, Users, ChevronLeft } from 'lucide-react';
import { AssetStatus } from '../types';

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
      title: 'Estrutura & RH (Novo)',
      icon: Users,
      table: 'relational_rh', // Lógica customizada relacional
      description: 'Criação em cascata: Região > Canal > Equipe > Vaga > Funcionário.',
      expectedColumns: ['Regiao', 'Canal', 'Equipe', 'Cargo / Vaga', 'Exige Notebook', 'Exige Celular', 'Nome do Funcionario'],
    }
  };

  // ==========================================
  // MOTOR PRINCIPAL DE LEITURA
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
        
        const rawMatrix = XLSX.utils.sheet_to_json(workbook.Sheets[targetSheetName], { header: 1 }) as any[][];
        
        const headerIndex = rawMatrix.findIndex(row => 
          row.some(cell => typeof cell === 'string' && (cell.toUpperCase().includes('NOME') || cell.toUpperCase().includes('DISPOSITIVO') || cell.toUpperCase().includes('IMEI') || cell.toUpperCase().includes('FUNCIONARIO') || cell.toUpperCase().includes('MAC') || cell.toUpperCase().includes('REGIAO') || cell.toUpperCase().includes('VAGA')))
        );

        if (headerIndex === -1) throw new Error("Não consegui encontrar o cabeçalho na planilha.");

        const headers = rawMatrix[headerIndex].map(h => h ? String(h).toUpperCase().trim() : `COL_${Math.random()}`);
        const dataRows = rawMatrix.slice(headerIndex + 1);

        const rawData = dataRows.map(row => {
          const obj: any = {};
          row.forEach((cell, i) => { if (headers[i]) obj[headers[i]] = cell; });
          return obj;
        });

        let formattedData: any[] = [];

        if (mode === 'COMPUTERS') formattedData = parseComputers(rawData);
        if (mode === 'MOBILES') formattedData = parseMobiles(rawData);
        if (mode === 'EMPLOYEES') formattedData = parseStructure(rawData);

        if (formattedData.length === 0) throw new Error("Nenhum dado válido encontrado.");

        setPendingData(formattedData);
        setImportStats({ new: formattedData.length, update: 0 }); // Simplificado para a UI não quebrar
        setLogs(prev => [...prev, { type: 'success', msg: `Análise concluída: ${formattedData.length} linhas processadas com sucesso.` }]);
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
  // PARSERS
  // ==========================================
  const parseComputers = (rawData: any[]) => { /* Mantido igual */
    return rawData.map((row: any) => {
      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const found = Object.keys(row).find(k => k.includes(alias));
          if (found) return row[found];
        }
        return null;
      };
      const tipoFisico = (get('TIPO', 'CATEGORIA') || 'NOTEBOOK').toUpperCase();
      if (tipoFisico.includes('MOBILE') || tipoFisico.includes('CELULAR')) return null;
      const nomeMaquina = get('NOME DO DISPOSITIVO', 'NOME DA MÁQUINA', 'HOSTNAME');
      if (!nomeMaquina) return null;
      const macAddress = get('MAC ADDRESS', 'MAC');
      if (!macAddress) return null;
      return {
        type: tipoFisico, asset_tag: String(nomeMaquina).trim(), primary_id: String(macAddress).trim(),
        status: AssetStatus.EM_ESTOQUE, details: get('MODELO') || null, current_owner_name: get('USUÁRIO') || null
      };
    }).filter(Boolean);
  };

  const parseMobiles = (rawData: any[]) => { /* Mantido igual */
    return rawData.map((row: any) => {
      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const found = Object.keys(row).find(k => k.includes(alias));
          if (found) return row[found];
        }
        return null;
      };
      const tipoFisico = (get('TIPO', 'CATEGORIA') || '').toUpperCase();
      if (tipoFisico && !tipoFisico.includes('MOBILE') && !tipoFisico.includes('CELULAR') && !tipoFisico.includes('TABLET')) return null;
      const imei = get('IMEI', 'SERIAL', 'S/N');
      if (!imei) return null;
      return {
        type: 'CELULAR', asset_tag: get('ETIQUETA', 'TAG') || String(imei).trim(), primary_id: String(imei).trim(),
        status: AssetStatus.EM_ESTOQUE, details: null, current_owner_name: get('USUÁRIO') || null
      };
    }).filter(Boolean);
  };

  // 🚀 O NOVO MOTOR DE ESTRUTURA (Lê todas as colunas da Hierarquia)
  const parseStructure = (rawData: any[]) => {
    return rawData.map((row: any) => {
      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const found = Object.keys(row).find(k => k.includes(alias));
          if (found) return row[found];
        }
        return null;
      };

      const teamName = get('EQUIPE', 'DEPARTAMENTO');
      const roleName = get('CARGO', 'VAGA', 'FUNCAO');
      if (!teamName || !roleName) return null; // Trava: Tem que ter Equipe e Vaga

      // Pega os checkboxes (Aceita "Sim", "S", "True", "X")
      const checkBoolean = (val: any) => {
        if (!val) return false;
        const str = String(val).toUpperCase().trim();
        return str === 'SIM' || str === 'S' || str === 'TRUE' || str === 'X';
      };

      const employeeName = get('NOME', 'FUNCIONARIO', 'COLABORADOR');

      return {
        region: get('REGIAO', 'UF', 'ESTADO') || 'GO',
        channel: get('CANAL', 'AREA') || 'ADMINISTRATIVO',
        team: String(teamName).trim(),
        role: String(roleName).trim(),
        reqNotebook: checkBoolean(get('NOTEBOOK', 'REQ_NOTEBOOK')),
        reqDesktop: checkBoolean(get('DESKTOP', 'COMPUTADOR', 'REQ_DESKTOP')),
        reqMobile: checkBoolean(get('CELULAR', 'MOBILE', 'REQ_CELULAR')),
        reqSim: checkBoolean(get('CHIP', 'LINHA', 'REQ_CHIP')),
        employeeName: employeeName ? String(employeeName).trim() : null, // Pode ser vaga vazia
      };
    }).filter(Boolean);
  };

  // ==========================================
  // CONFIRMAÇÃO DE GRAVAÇÃO (O Cérebro Relacional)
  // ==========================================
  const confirmImport = async () => {
    if (!pendingData || !mode) return;
    setLoading(true);

    try {
      // 1. FLUXO PADRÃO (ATIVOS)
      if (mode !== 'EMPLOYEES') {
        const pk = 'asset_tag';
        const { error } = await supabase.from(MODULES[mode].table).upsert(pendingData, { onConflict: pk, ignoreDuplicates: true });
        if (error) throw error;
        setLogs(prev => [...prev, { type: 'success', msg: `SUCESSO! Dados gravados na tabela de Ativos.` }]);
      } 
      // 2. O FLUXO RELACIONAL AVANÇADO (ESTRUTURA)
      else {
        setLogs(prev => [...prev, { type: 'info', msg: `Iniciando montagem do organograma...` }]);
        let rolesCounter = 1; // Para gerar VG-0001, VG-0002...

        for (const row of pendingData) {
          // A. EQUIPE (Buscar ou Criar)
          let teamId = null;
          const { data: existingTeam } = await supabase.from('teams').select('id').eq('name', row.team).eq('region', row.region).single();
          
          if (existingTeam) {
            teamId = existingTeam.id;
          } else {
            const { data: newTeam, error: teamErr } = await supabase.from('teams').insert([{ name: row.team, region: row.region, channel: row.channel }]).select('id').single();
            if (teamErr) throw teamErr;
            teamId = newTeam.id;
          }

          // B. VAGA (Sempre cria uma nova cadeira no painel)
          const roleCode = `VG-${String(rolesCounter++).padStart(4, '0')}`;
          const { data: newRole, error: roleErr } = await supabase.from('roles').insert([{
            code: roleCode,
            description: row.role,
            region: row.region,
            team_id: teamId,
            req_notebook: row.reqNotebook,
            req_desktop: row.reqDesktop,
            req_mobile: row.reqMobile,
            req_sim: row.reqSim,
            status: 'ATIVA'
          }]).select('id').single();
          
          if (roleErr) throw roleErr;

          // C. FUNCIONÁRIO (Senta o cara na cadeira, se tiver nome)
          if (row.employeeName) {
            // Usa upsert para não duplicar o funcionário se ele já existir (amarrado pelo nome)
            const { error: empErr } = await supabase.from('employees').upsert([{
              name: row.employeeName,
              role: row.role, // Compatibilidade com código legado
              region: row.region,
              status: 'Ativo',
              role_id: newRole.id // Vínculo real e indestrutível
            }], { onConflict: 'name' });
            if (empErr) throw empErr;
          }
        }
        setLogs(prev => [...prev, { type: 'success', msg: `SUCESSO! Organograma (Equipes, Vagas e Funcionários) estruturado no banco.` }]);
      }

      await supabase.from('audit_logs').insert({
        action_type: 'IMPORT', entity_type: mode === 'EMPLOYEES' ? 'EMPLOYEE' : 'ASSET',
        description: `Importação em lote de ${pendingData.length} registros no módulo ${MODULES[mode].title}.`,
        actor_name: 'Administrador (TI)'
      });

      alert('Importação realizada com sucesso!');
      setPendingData(null); setImportStats(null); setMode(null);
      onSuccess();
    } catch (error: any) {
      setLogs(prev => [...prev, { type: 'error', msg: `Erro de Banco: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // ... (A UI continua exatamente igual, apenas o Header e as lógicas de botões fecham o componente)
  
  if (!mode) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="bg-blue-50 text-blue-800 p-4 mb-6 rounded-lg text-sm border border-blue-200">
          <strong>Aviso Tático:</strong> O banco de dados foi limpo e preparado. Comece sempre importando a <strong>Estrutura & RH</strong> para montar o Mapa, e só depois importe os Equipamentos da TI.
        </div>
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
              <div className="text-sm text-slate-500 font-bold uppercase">Registros Lidos</div>
              <div className="text-3xl font-black text-gsa-blue">{importStats.new}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold uppercase">Status do Arquivo</div>
              <div className="text-3xl font-black text-green-600">Pronto</div>
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