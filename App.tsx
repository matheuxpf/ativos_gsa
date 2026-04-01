import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { registerLog } from './lib/audit';
import { 
  Asset, Employee, Team, Role, ViewState, 
  Movement, AssetStatus, OwnerType 
} from './types';

import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AssetList } from './components/AssetList';
import { AdminPanel } from './components/AdminPanel';
import { LogsView } from './components/LogsView';
import { MovementForm } from './components/MovementForm';
import { TeamView } from './components/TeamView';

// 🕵️‍♂️ FUNÇÃO RASTREADORA E BLINDADA CENTRALIZADA
// Ela procura as chaves tanto do padrão do Banco (snake_case) quanto do Front (camelCase)
// 🕵️‍♂️ FUNÇÃO RASTREADORA E BLINDADA CENTRALIZADA
const formatAssetForAudit = (asset: any) => {
  const type = (asset.type || '').toUpperCase().trim();
  const nomeDaMaquina = asset.assetTag || asset.asset_tag; 
  const macImei = asset.primaryId || asset.primary_id;
  
  // Validação: Só inclui a marca se ela existir de verdade e não for um texto genérico
  const temMarca = asset.brand && asset.brand !== 'Sem Marca' && asset.brand !== 'Genérica';
  const brandString = temMarca ? ` ${asset.brand}` : '';

  // Regra Celular
  if (['CELULAR', 'MOBILE', 'SMARTPHONE'].includes(type)) {
    return `${type}${brandString} (IMEI/Serial: ${macImei || 'N/A'})`;
  }

  // Regra universal (Servidor, Note, Desktop)
  return `${type}${brandString} (${nomeDaMaquina || 'S/ NOME'})`;
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [movingAssets, setMovingAssets] = useState<Asset[] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [assetsRes, empRes, teamsRes, rolesRes] = await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('roles').select('*')
    ]);

    if (assetsRes.data) {
      setAssets(assetsRes.data.map(a => ({
        ...a,
        primaryId: a.primary_id,
        assetTag: a.asset_tag,
        currentOwnerId: a.current_owner_id,
        currentOwnerType: a.current_owner_type,
        currentOwnerName: a.current_owner_name
      })));
    }
    
    if (empRes.data) {
      setEmployees(empRes.data.map(e => ({
        ...e,
        teamId: e.team_id,
        status: e.status || 'Ativo' 
      })));
    }
    
    if (teamsRes.data) {
      setTeams(teamsRes.data.map(t => ({
        ...t,
        leaderId: t.leader_id
      })));
    }
    
    if (rolesRes.data) {
      setRoles(rolesRes.data.map(r => ({
        ...r,
        teamId: r.team_id,
        reqNotebook: r.req_notebook || false,
        reqDesktop: r.req_desktop || false,
        reqMobile: r.req_mobile || false,
        reqSim: r.req_sim || false,
        status: r.status || 'ATIVA'
      })));
    }
  };

  const handleAddAsset = async (asset: Asset) => {
    const dbPayload = {
      primary_id: asset.primaryId,
      asset_tag: asset.assetTag,
      type: asset.type,
      brand: asset.brand,
      model: (asset as any).model || '',
      state: asset.state, 
      status: asset.status,
      value: asset.value,
      color: asset.color,
      details: asset.details,
      current_owner_id: asset.currentOwnerId,
      current_owner_type: asset.currentOwnerType,
      current_owner_name: asset.currentOwnerName
    };

    const { data, error } = await supabase.from('assets').insert([dbPayload]).select().single();
    if (error) { alert("Erro ao criar Ativo: " + error.message); return; }
    
    if (data) {
      setAssets([...assets, { ...asset, id: data.id }]);
      // Aplicando a formatação limpa no momento do cadastro!
      await registerLog('CREATE', 'ASSET', `Ativo cadastrado: ${formatAssetForAudit(asset)}`);
    }
  };

  const handleUpdateAsset = async (asset: Asset) => {
    const dbPayload = {
      primary_id: asset.primaryId,
      asset_tag: asset.assetTag,
      type: asset.type,
      brand: asset.brand,
      state: asset.state,
      status: asset.status,
      value: asset.value,
      color: asset.color,
      details: asset.details,
      current_owner_id: asset.currentOwnerId,
      current_owner_type: asset.currentOwnerType,
      current_owner_name: asset.currentOwnerName
    };

    const { error } = await supabase.from('assets').update(dbPayload).eq('id', asset.id);
    if (error) { alert("Erro ao atualizar Ativo: " + error.message); return; }
    
    setAssets(assets.map(a => a.id === asset.id ? asset : a));
    // Aplicando a formatação limpa no momento da edição!
    await registerLog('UPDATE', 'ASSET', `Dados do ativo atualizados: ${formatAssetForAudit(asset)}`);
  };

  const handleDeleteAsset = async (id: string) => {
    // 1. Pega o objeto antes de excluir
    const assetToDelete = assets.find(a => a.id === id);
    if (!assetToDelete) return;

    // 2. Formata com a inteligência centralizada
    const nomeAmigavel = formatAssetForAudit(assetToDelete);

    // 3. Deleta do banco
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) { alert("Erro ao excluir Ativo: " + error.message); return; }
    
    setAssets(assets.filter(a => a.id !== id));
    
    // 4. Grava no log usando registerLog
    await registerLog('DELETE', 'ASSET', `Ativo excluído: ${nomeAmigavel}`);
  };

  const handleAddEmployee = async (employee: Employee) => {
    const dbPayload = {
      name: employee.name,
      role: employee.role,
      region: employee.region,
      team_id: employee.teamId,
      status: employee.status || 'Ativo' 
    };

    const { data, error } = await supabase.from('employees').insert([dbPayload]).select().single();
    if (error) { alert("Erro ao criar Funcionário: " + error.message); return; }
    
    if (data) {
      setEmployees([...employees, { ...employee, id: data.id }]);
      await registerLog('CREATE', 'EMPLOYEE', `Funcionário cadastrado: ${employee.name}`);
    }
  };

  const handleUpdateEmployee = async (employee: Employee) => {
    const dbPayload = {
      name: employee.name,
      role: employee.role,
      region: employee.region,
      team_id: employee.teamId,
      status: employee.status
    };

    const { error } = await supabase.from('employees').update(dbPayload).eq('id', employee.id);
    if (error) { alert("Erro ao atualizar Funcionário: " + error.message); return; }
    
    setEmployees(employees.map(e => e.id === employee.id ? employee : e));
    await registerLog('UPDATE', 'EMPLOYEE', `Cadastro de funcionário atualizado: ${employee.name}`);
  };

  const handleDeleteEmployee = async (id: string) => {
    const empToDelete = employees.find(e => e.id === id);
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { alert("Erro ao excluir Funcionário: " + error.message); return; }
    
    setEmployees(employees.filter(e => e.id !== id));
    await registerLog('DELETE', 'EMPLOYEE', `Funcionário removido: ${empToDelete?.name}`);
  };

  const handleAddTeam = async (team: Team) => {
    const dbPayload = {
      name: team.name,
      region: team.region,
      channel: team.channel,
      leader_id: team.leaderId
    };

    const { data, error } = await supabase.from('teams').insert([dbPayload]).select().single();
    if (error) { alert("Erro ao criar Equipe: " + error.message); return; }
    
    if (data) {
      setTeams([...teams, { ...team, id: data.id }]);
      await registerLog('CREATE', 'TEAM', `Equipe criada: ${team.name} (${team.region})`);
    }
  };

  const handleUpdateTeam = async (team: Team) => {
    const dbPayload = {
      name: team.name,
      region: team.region,
      channel: team.channel,
      leader_id: team.leaderId
    };

    const { error } = await supabase.from('teams').update(dbPayload).eq('id', team.id);
    if (error) { alert("Erro ao atualizar Equipe: " + error.message); return; }
    
    setTeams(teams.map(t => t.id === team.id ? team : t));
    await registerLog('UPDATE', 'TEAM', `Equipe atualizada: ${team.name}`);
  };

  const handleDeleteTeam = async (id: string) => {
    const teamToDelete = teams.find(t => t.id === id);
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { alert("Erro ao excluir Equipe: " + error.message); return; }
    
    setTeams(teams.filter(t => t.id !== id));
    await registerLog('DELETE', 'TEAM', `Equipe removida: ${teamToDelete?.name}`);
  };

  const handleAddRole = async (role: Role) => {
    const dbPayload = {
      code: role.code,
      description: role.description,
      region: role.region,
      team_id: role.teamId,
      req_notebook: role.reqNotebook || false,
      req_desktop: role.reqDesktop || false,
      req_mobile: role.reqMobile || false,
      req_sim: role.reqSim || false,
      status: role.status || 'ATIVA'
    };

    const { data, error } = await supabase.from('roles').insert([dbPayload]).select().single();
    if (error) { alert("Erro ao criar Vaga: " + error.message); return; }

    if (data) {
      setRoles([...roles, { ...role, id: data.id }]);
      await registerLog('CREATE', 'ROLE', `Vaga criada: ${role.code} - ${role.description}`);
    }
  };

  const handleUpdateRole = async (role: Role) => {
    const dbPayload = {
      code: role.code,
      description: role.description,
      region: role.region,
      team_id: role.teamId,
      req_notebook: role.reqNotebook || false,
      req_desktop: role.reqDesktop || false,
      req_mobile: role.reqMobile || false,
      req_sim: role.reqSim || false,
      status: role.status || 'ATIVA'
    };

    const { error } = await supabase.from('roles').update(dbPayload).eq('id', role.id);
    if (error) { alert("Erro ao atualizar Vaga: " + error.message); return; }

    setRoles(roles.map(r => r.id === role.id ? role : r));
    await registerLog('UPDATE', 'ROLE', `Vaga atualizada: ${role.code}`);
  };

  const handleDeleteRole = async (id: string) => {
    const roleToDelete = roles.find(r => r.id === id);
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) { alert("Erro ao excluir Vaga: " + error.message); return; }

    setRoles(roles.filter(r => r.id !== id));
    await registerLog('DELETE', 'ROLE', `Vaga excluída: ${roleToDelete?.code}`);
  };

  const handleConfirmMove = async (movements: Partial<Movement>[], newStatus: AssetStatus, newOwner: { type: OwnerType, id: string, name: string }) => {
    try {
      const dbMovements = movements.map(m => ({
        asset_id: m.assetId,
        from_owner_id: m.fromOwnerId,
        from_owner_type: m.fromOwnerType,
        from_owner_name: m.fromOwnerName,
        to_owner_id: m.toOwnerId,
        to_owner_type: m.toOwnerType,
        to_owner_name: m.toOwnerName,
        reason: m.reason,
        observations: m.observations,
        registered_by: m.registeredBy,
        date: m.date
      }));

      const { error: moveError } = await supabase.from('movements').insert(dbMovements);
      if (moveError) throw moveError;

      const assetIds = movements.map(m => m.assetId);
      const { error: assetError } = await supabase.from('assets')
        .update({ 
          status: newStatus, 
          current_owner_type: newOwner.type, 
          current_owner_id: newOwner.id, 
          current_owner_name: newOwner.name 
        })
        .in('id', assetIds as string[]);

      if (assetError) throw assetError;

      setAssets(assets.map(a => assetIds.includes(a.id) ? { 
        ...a, status: newStatus, currentOwnerType: newOwner.type, currentOwnerId: newOwner.id, currentOwnerName: newOwner.name 
      } : a));

      await registerLog('MOVE', 'ASSET', `Lote de ${movements.length} ativos movido para ${newOwner.name}.`);
      setMovingAssets(null);
    } catch (err: any) {
      alert("Erro na movimentação: " + err.message);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard assets={assets} />;
      case 'ASSETS': return (
        <AssetList 
          assets={assets} searchQuery={searchQuery} 
          onInitiateMove={setMovingAssets} onDelete={handleDeleteAsset} 
          onEdit={handleUpdateAsset} onViewDetail={() => {}} 
        />
      );
      case 'MOVEMENTS': return <LogsView />;
      case 'TEAMS': return (
        <TeamView 
          teams={teams} employees={employees} assets={assets} 
          onAddMember={(teamId, empId) => {
            const emp = employees.find(e => e.id === empId);
            if(emp) handleUpdateEmployee({...emp, teamId});
          }} 
          onRemoveMember={(empId) => {
            const emp = employees.find(e => e.id === empId);
            if(emp) handleUpdateEmployee({...emp, teamId: null});
          }} 
          onDeleteTeam={handleDeleteTeam} 
          onEditTeam={handleUpdateTeam} 
        />
      );
      case 'ADMIN': return (
        <AdminPanel 
          assets={assets} employees={employees} teams={teams} roles={roles}
          onAddAsset={handleAddAsset} onUpdateAsset={handleUpdateAsset} onDeleteAsset={handleDeleteAsset}
          onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee}
          onAddTeam={handleAddTeam} onUpdateTeam={handleUpdateTeam} onDeleteTeam={handleDeleteTeam}
          onAddRole={handleAddRole} onUpdateRole={handleUpdateRole} onDeleteRole={handleDeleteRole}
        />
      );
      default: return <Dashboard assets={assets} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView} searchValue={searchQuery} onSearch={setSearchQuery}>
      {renderView()}
      {movingAssets && (
        <MovementForm 
          selectedAssets={movingAssets} employees={employees} 
          onClose={() => setMovingAssets(null)} onSubmit={handleConfirmMove} 
        />
      )}
    </Layout>
  );
}