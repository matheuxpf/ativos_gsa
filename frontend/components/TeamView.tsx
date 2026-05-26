import React, { useState } from 'react';
import { Team, Employee, Asset, Role } from '../types';
import { 
  MapPin, Users, Briefcase, ChevronDown, ChevronRight, 
  Monitor, Smartphone, AlertTriangle, CheckCircle2, Package
} from 'lucide-react';
import { BrazilMap } from './BrazilMap'; // Importando o nosso mapa nativo!

interface TeamViewProps {
  teams: Team[];
  employees: Employee[];
  assets: Asset[];
  roles: Role[];
  onDeleteTeam: (id: string) => void;
  onEditTeam: (team: Team) => Promise<void>;
  onAddMember: (teamId: string, employeeId: string) => void; 
  onRemoveMember: (employeeId: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ teams, employees, assets, roles, onEditTeam }) => {
  // Pega todas as regiões únicas que existem no banco (Dinâmico!)
  const activeRegions = Array.from(new Set(teams.map(t => t.region))).sort();
  
  const [selectedRegion, setSelectedRegion] = useState<string>(activeRegions[0] || 'GO');
  const [expandedChannels, setExpandedChannels] = useState<string[]>([]);

  // Filtra as equipes da região selecionada
  const regionTeams = teams.filter(t => t.region === selectedRegion);
  
  // Agrupa as equipes por Canal (Ex: CV GOIAS, ADMINISTRATIVO, etc)
  const channels = Array.from(new Set(regionTeams.map(t => t.channel || 'Sem Canal'))).sort();

  const [searchTeamQuery, setSearchTeamQuery] = useState('');

  const toggleChannel = (channel: string) => {
    setExpandedChannels(prev => 
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  // 🕵️‍♂️ FUNÇÃO DE INTELIGÊNCIA DA T.I.: Analisa o Hardware do Funcionário
  const renderHardwareStatus = (role: Role, emp: Employee | undefined) => {
    if (!emp) return <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">VAGA VACANTE</span>;

    // Busca os ativos do funcionário
    const empAssets = assets.filter(a => a.currentOwnerId === emp.id);
    const hasType = (typeList: string[]) => empAssets.some(a => typeList.includes((a.type || '').toUpperCase()));

    const hardware = [
      { req: role.reqNotebook, has: hasType(['NOTEBOOK']), label: 'Notebook', icon: Monitor },
      { req: role.reqDesktop, has: hasType(['DESKTOP', 'COMPUTADOR']), label: 'Desktop', icon: Package },
      { req: role.reqMobile, has: hasType(['CELULAR', 'SMARTPHONE', 'MOBILE']), label: 'Celular', icon: Smartphone },
      { req: role.reqSim, has: hasType(['CHIP', 'LINHA']), label: 'Chip', icon: Smartphone },
    ];

    // Se a vaga não exige NADA, e o cara não tem NADA
    if (hardware.every(h => !h.req) && empAssets.length === 0) {
      return <span className="text-[10px] text-slate-400 font-bold">Sem equipamentos atrelados</span>;
    }

    return (
      <div className="flex gap-2 items-center flex-wrap">
        {hardware.map((item, idx) => {
          if (!item.req && !item.has) return null; // Não exige e não tem = ignora
          
          const Icon = item.icon;
          
          // Cenário 1: Exige e Tem (Tudo OK)
          if (item.req && item.has) {
            return (
              <div key={idx} className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title={`Possui ${item.label}`}>
                <CheckCircle2 size={12} /> {item.label}
              </div>
            );
          }
          
          // Cenário 2: Exige e NÃO Tem (Alerta T.I.!)
          if (item.req && !item.has) {
            return (
              <div key={idx} className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 animate-pulse" title={`FALTA ENTREGAR: ${item.label}`}>
                <AlertTriangle size={12} /> {item.label}
              </div>
            );
          }
          
          // Cenário 3: Não exige, mas TEM (Equipamento Extra/Emprestado)
          if (!item.req && item.has) {
            return (
              <div key={idx} className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title={`Ativo Extra/Emprestado: ${item.label}`}>
                <Package size={12} /> {item.label} (Extra)
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* COLUNA ESQUERDA: O Mapa Interativo */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 sticky top-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-gsa-blue" /> Visão Territorial
          </h2>
          <p className="text-xs text-slate-500 mb-6">Estados coloridos possuem operação. Clique para detalhar.</p>
          
          {/* AQUI ESTÁ O MAPA! */}
          <BrazilMap 
            activeRegions={activeRegions} 
            selectedRegion={selectedRegion} 
            onSelectRegion={setSelectedRegion} 
          />

          <div className="mt-8 flex justify-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-600"></div> Selecionado</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-300"></div> Com Operação</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200"></div> Sem Operação</span>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: A Cascata de Canais e Equipes */}
      <div className="w-full lg:w-2/3 space-y-4">
        
        {/* Cabeçalho da Região Selecionada */}
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Operação: {selectedRegion}</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">{regionTeams.length} {regionTeams.length === 1 ? 'Equipe alocada' : 'Equipes alocadas'} neste estado.</p>
          </div>
        </div>

        {/* --- FILTRO E BUSCA --- */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <div className="w-full relative">
            <input 
              type="text" 
              placeholder="Buscar equipe, vaga ou funcionário..." 
              value={searchTeamQuery}
              onChange={(e) => {
                const term = e.target.value;
                setSearchTeamQuery(term);
                if (term.trim()) {
                  setExpandedChannels(channels);
                } else {
                  setExpandedChannels([]);
                }
              }}
              className="w-full pl-4 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gsa-green/50 focus:border-gsa-green transition-all shadow-sm"
            />
          </div>
        </div>

        {channels.length === 0 && activeRegions.length > 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-card text-slate-400">
            Nenhum canal/equipe encontrado nesta região.
          </div>
        )}

        {channels.map(channel => {
          const isExpanded = expandedChannels.includes(channel);
          let teamsInChannel = regionTeams.filter(t => t.channel === channel);

          if (searchTeamQuery) {
            const q = searchTeamQuery.toLowerCase();
            teamsInChannel = teamsInChannel.filter(team => {
              if (team.name.toLowerCase().includes(q)) return true;
              const tr = roles.filter(r => r.teamId === team.id && r.status !== 'INATIVA');
              for (const r of tr) {
                if (r.description.toLowerCase().includes(q)) return true;
                const occs = employees.filter(e => String(e.roleId) === String(r.id) && e.status !== 'Desligado');
                if (occs.some(occ => occ.name.toLowerCase().includes(q))) return true;
              }
              return false;
            });
          }

          if (searchTeamQuery && teamsInChannel.length === 0) return null;

          return (
            <div key={channel} className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Acordeão do Canal */}
              <button 
                onClick={() => toggleChannel(channel)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isExpanded ? 'bg-gsa-blue text-white' : 'bg-white text-slate-500 shadow-sm'}`}>
                    <Briefcase size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-800 text-lg uppercase">{channel}</h3>
                    <p className="text-xs font-bold text-slate-500">{teamsInChannel.length} Equipes listadas</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
              </button>

              {/* Lista de Equipes do Canal */}
              {isExpanded && (
                <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 bg-slate-50/50">
                  {teamsInChannel.map(team => {
                    // Pega as Vagas (Roles) que pertencem a esta Equipe
                    let teamRoles = roles.filter(r => r.teamId === team.id && r.status !== 'INATIVA');
                    
                    if (searchTeamQuery) {
                      const q = searchTeamQuery.toLowerCase();
                      if (!team.name.toLowerCase().includes(q)) {
                        teamRoles = teamRoles.filter(role => {
                          if (role.description.toLowerCase().includes(q)) return true;
                          const occs = employees.filter(e => String(e.roleId) === String(role.id) && e.status !== 'Desligado');
                          return occs.some(occ => occ.name.toLowerCase().includes(q));
                        });
                      }
                    }
                    
                    const isTeamExpanded = expandedTeams.includes(team.id) || !!searchTeamQuery;

                    return (
                      <div key={team.id} className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors duration-300">
                        {/* Header da Equipe */}
                        <div 
                          className="px-4 py-3 bg-white border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleTeam(team.id)}
                        >
                          <div>
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                              <Users size={16} className="text-gsa-blue"/> {team.name}
                            </h4>
                            {!isTeamExpanded && (
                              <p className="text-[11px] text-slate-400 mt-0.5 font-bold">{teamRoles.length} Vagas estruturadas</p>
                            )}
                          </div>
                          <button className="text-[10px] font-bold text-slate-400 hover:text-gsa-blue uppercase px-2 py-1 rounded bg-slate-50 hover:bg-blue-50 transition-colors">
                            {isTeamExpanded ? 'Ocultar' : 'Detalhes'}
                          </button>
                        </div>

                        {/* Corpo da Equipe: A Lista de Vagas */}
                        {isTeamExpanded && (
                          <div className="p-0 flex-1 bg-slate-50/30">
                            {teamRoles.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 italic">Nenhuma vaga estruturada nesta equipe.</div>
                            ) : (
                              <div className="divide-y divide-slate-50">
                              {teamRoles.flatMap(role => {
                                // Pega TODOS os funcionários atrelados a esta vaga
                                let occupants = employees.filter(e => String(e.roleId) === String(role.id) && e.status !== 'Desligado');
                                
                                // Opcional: Se estiver buscando um nome, filtra os ocupantes para não exibir pares se for uma equipe muito grande (mas preserva todos se a equipe ou vaga bateu)
                                if (searchTeamQuery) {
                                  const q = searchTeamQuery.toLowerCase();
                                  if (!team.name.toLowerCase().includes(q) && !role.description.toLowerCase().includes(q)) {
                                    occupants = occupants.filter(occ => occ.name.toLowerCase().includes(q));
                                  }
                                }
                                
                                if (occupants.length === 0) {
                                  return [
                                    <div key={role.id} className="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="text-xs font-black text-slate-800 uppercase">{role.description}</div>
                                          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                                            <span className="text-slate-400 italic">Aguardando contratação...</span>
                                          </div>
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-2">
                                          {role.code}
                                        </div>
                                      </div>
                                      
                                      <div className="mt-1">
                                        {renderHardwareStatus(role, undefined)}
                                      </div>
                                    </div>
                                  ];
                                }

                                return occupants.map(occupant => (
                                  <div key={`${role.id}-${occupant.id}`} className="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="text-xs font-black text-slate-800 uppercase">{role.description}</div>
                                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                                          {occupant.name}
                                        </div>
                                      </div>
                                      <div className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-2">
                                        {role.code}
                                      </div>
                                    </div>
                                    
                                    {/* STATUS DA T.I. - O RAIO-X */}
                                    <div className="mt-1">
                                      {renderHardwareStatus(role, occupant)}
                                    </div>
                                  </div>
                                ));
                              })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};