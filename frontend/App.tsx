import React, { useState, useEffect } from 'react';
import * as api from './lib/api';
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
import { FastMovementTab } from './components/FastMovementTab';

// 🕵️‍♂️ FUNÇÃO RASTREADORA E BLINDADA CENTRALIZADA
const formatAssetForAudit = (asset: any) => {
  const type = (asset.type || '').toUpperCase().trim();
  const nomeDaMaquina = asset.assetTag || asset.asset_tag; 
  const macImei = asset.primaryId || asset.primary_id;
  
  const temMarca = asset.brand && asset.brand !== 'Sem Marca' && asset.brand !== 'Genérica';
  const brandString = temMarca ? ` ${asset.brand}` : '';

  if (['CELULAR', 'MOBILE', 'SMARTPHONE'].includes(type)) {
    return `${type}${brandString} (IMEI/Serial: ${macImei || 'N/A'})`;
  }

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
    try {
      const [assetsData, empData, teamsData, rolesData] = await Promise.all([
        api.getAssets(),
        api.getEmployees(),
        api.getTeams(),
        api.getRoles()
      ]);

      setAssets(assetsData.map((a: any) => ({
        ...a,
        primaryId: a.primary_id,
        assetTag: a.asset_tag,
        currentOwnerId: a.current_owner_id,
        currentOwnerType: a.current_owner_type,
        currentOwnerName: a.current_owner_name
      })));
      
      setEmployees(empData.map((e: any) => ({
        ...e,
        teamId: e.team_id,
        roleId: e.role_id,
        status: e.status || 'Ativo' 
      })));
      
      setTeams(teamsData.map((t: any) => ({
        ...t,
        leaderId: t.leader_id
      })));
      
      setRoles(rolesData.map((r: any) => ({
        ...r,
        teamId: r.team_id,
        reqNotebook: r.req_notebook || false,
        reqDesktop: r.req_desktop || false,
        reqMobile: r.req_mobile || false,
        reqSim: r.req_sim || false,
        status: r.status || 'ATIVA'
      })));
    } catch (err) {
      console.error("Erro ao buscar dados da API:", err);
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

    try {
      const data = await api.createAsset(dbPayload);
      setAssets([...assets, { ...asset, id: data.id }]);
      await registerLog('CREATE', 'ASSET', `Ativo cadastrado: ${formatAssetForAudit(asset)}`);
    } catch (error: any) {
      alert("Erro ao criar Ativo: " + error.message);
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

    try {
      await api.updateAsset(asset.id, dbPayload);
      setAssets(assets.map(a => a.id === asset.id ? asset : a));
      await registerLog('UPDATE', 'ASSET', `Dados do ativo atualizados: ${formatAssetForAudit(asset)}`);
    } catch (error: any) {
      alert("Erro ao atualizar Ativo: " + error.message);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const assetToDelete = assets.find(a => a.id === id);
    if (!assetToDelete) return;
    const nomeAmigavel = formatAssetForAudit(assetToDelete);

    try {
      await api.deleteAsset(id);
      setAssets(assets.filter(a => a.id !== id));
      await registerLog('DELETE', 'ASSET', `Ativo excluído: ${nomeAmigavel}`);
    } catch (error: any) {
      alert("Erro ao excluir Ativo: " + error.message);
    }
  };

  const handleAddEmployee = async (employee: Employee) => {
    const dbPayload = {
      name: employee.name,
      role: employee.role,
      region: employee.region,
      team_id: employee.teamId ? parseInt(employee.teamId as string) : null,
      role_id: employee.roleId ? parseInt(employee.roleId as string) : null,
      status: employee.status || 'Ativo' 
    };

    try {
      const data = await api.createEmployee(dbPayload);
      setEmployees([...employees, { ...employee, id: data.id }]);
      await registerLog('CREATE', 'EMPLOYEE', `Funcionário cadastrado: ${employee.name}`);
    } catch (error: any) {
      alert("Erro ao criar Funcionário: " + error.message);
    }
  };

  const handleUpdateEmployee = async (employee: Employee) => {
    const dbPayload = {
      name: employee.name,
      role: employee.role,
      region: employee.region,
      team_id: employee.teamId ? parseInt(employee.teamId as string) : null,
      role_id: employee.roleId ? parseInt(employee.roleId as string) : null,
      status: employee.status || 'Ativo'
    };

    try {
      await api.updateEmployee(employee.id, dbPayload);
      setEmployees(employees.map(e => e.id === employee.id ? employee : e));
      await registerLog('UPDATE', 'EMPLOYEE', `Cadastro de funcionário atualizado: ${employee.name}`);
    } catch (error: any) {
      alert("Erro ao atualizar Funcionário: " + error.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const empToDelete = employees.find(e => e.id === id);
    try {
      await api.deleteEmployee(id);
      setEmployees(employees.filter(e => e.id !== id));
      await registerLog('DELETE', 'EMPLOYEE', `Funcionário removido: ${empToDelete?.name}`);
    } catch (error: any) {
      alert("Erro ao excluir Funcionário: " + error.message);
    }
  };

  const handleAddTeam = async (team: Team) => {
    const dbPayload = {
      name: team.name,
      region: team.region,
      channel: team.channel,
      leader_id: team.leaderId
    };

    try {
      const data = await api.createTeam(dbPayload);
      setTeams([...teams, { ...team, id: data.id }]);
      await registerLog('CREATE', 'TEAM', `Equipe criada: ${team.name} (${team.region})`);
    } catch (error: any) {
      alert("Erro ao criar Equipe: " + error.message);
    }
  };

  const handleUpdateTeam = async (team: Team) => {
    const dbPayload = {
      name: team.name,
      region: team.region,
      channel: team.channel,
      leader_id: team.leaderId
    };

    try {
      await api.updateTeam(team.id, dbPayload);
      setTeams(teams.map(t => t.id === team.id ? team : t));
      await registerLog('UPDATE', 'TEAM', `Equipe atualizada: ${team.name}`);
    } catch (error: any) {
      alert("Erro ao atualizar Equipe: " + error.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    const teamToDelete = teams.find(t => t.id === id);
    try {
      await api.deleteTeam(id);
      setTeams(teams.filter(t => t.id !== id));
      await registerLog('DELETE', 'TEAM', `Equipe removida: ${teamToDelete?.name}`);
    } catch (error: any) {
      alert("Erro ao excluir Equipe: " + error.message);
    }
  };

  const handleAddRole = async (role: Role) => {
    let codigoGerado = role.code;
    
    if (!codigoGerado) {
      let maiorNumero = 0;
      roles.forEach(r => {
        const match = r.code?.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maiorNumero) maiorNumero = num;
        }
      });
      codigoGerado = `VG-${String(maiorNumero + 1).padStart(4, '0')}`;
    }

    const dbPayload = {
      code: codigoGerado,
      description: role.description,
      region: role.region,
      team_id: role.teamId,
      req_notebook: role.reqNotebook || false,
      req_desktop: role.reqDesktop || false,
      req_mobile: role.reqMobile || false,
      req_sim: role.reqSim || false,
      status: role.status || 'ATIVA'
    };

    try {
      const data = await api.createRole(dbPayload);
      setRoles([...roles, { ...role, id: data.id, code: codigoGerado }]);
      await registerLog('CREATE', 'ROLE', `Vaga criada: ${codigoGerado} - ${role.description}`);
    } catch (error: any) {
      alert("Erro ao criar Vaga: " + error.message);
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

    try {
      await api.updateRole(role.id, dbPayload);
      setRoles(roles.map(r => r.id === role.id ? role : r));
      await registerLog('UPDATE', 'ROLE', `Vaga atualizada: ${role.code}`);
    } catch (error: any) {
      alert("Erro ao atualizar Vaga: " + error.message);
    }
  };

  const handleDeleteRole = async (id: string) => {
    const roleToDelete = roles.find(r => r.id === id);
    try {
      await api.deleteRole(id);
      setRoles(roles.filter(r => r.id !== id));
      await registerLog('DELETE', 'ROLE', `Vaga excluída: ${roleToDelete?.code}`);
    } catch (error: any) {
      alert("Erro ao excluir Vaga: " + error.message);
    }
  };

  const handleConfirmMove = async (movements: Partial<Movement>[], newStatus: AssetStatus, newOwner: { type: OwnerType, id: string, name: string }) => {
    try {
      for (const m of movements) {
        const dbMovement = {
          asset_id: typeof m.assetId === 'string' ? parseInt(m.assetId) : m.assetId,
          from_owner_id: m.fromOwnerId ? m.fromOwnerId.toString() : '',
          from_owner_type: m.fromOwnerType || '',
          from_owner_name: m.fromOwnerName || '',
          to_owner_id: m.toOwnerId ? m.toOwnerId.toString() : '',
          to_owner_type: m.toOwnerType || '',
          to_owner_name: m.toOwnerName || '',
          reason: m.reason || 'Movimentação Rápida',
          observations: m.observations || '',
          registered_by: m.registeredBy || 'Administrador',
          date: m.date || new Date().toISOString()
        };
        await api.createMovement(dbMovement);
      }

      const assetIds = movements.map(m => m.assetId);
      
      for (const id of assetIds) {
        if (!id) continue;
        const currentAsset = assets.find(a => a.id === id);
        if (currentAsset) {
          const dbPayload = {
            ...currentAsset,
            status: newStatus,
            current_owner_type: newOwner.type,
            current_owner_id: newOwner.id ? newOwner.id.toString() : '',
            current_owner_name: newOwner.name,
            primary_id: currentAsset.primaryId,
            asset_tag: currentAsset.assetTag
          };
          await api.updateAsset(id, dbPayload);
        }
      }

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
          assets={assets} employees={employees} teams={teams} searchQuery={searchQuery} 
          onInitiateMove={setMovingAssets} onDelete={handleDeleteAsset} 
          onEdit={handleUpdateAsset} onViewDetail={() => {}} 
        />
      );
      case 'MOVEMENTS': return <LogsView />;
      case 'FAST_MOVE': return <FastMovementTab assets={assets} employees={employees} onConfirmMove={handleConfirmMove} />;
      case 'TEAMS': return (
        <TeamView 
          teams={teams} 
          employees={employees} 
          assets={assets} 
          roles={roles}
          onAddMember={(teamId, empId) => {
            const emp = employees.find(e => e.id === empId);
            if(emp) handleUpdateEmployee({...emp, teamId});
          }} 
          onRemoveMember={(empId) => {
            const emp = employees.find(e => e.id === empId);
            if(emp) handleUpdateEmployee({...emp, teamId: undefined});
          }} 
          onDeleteTeam={handleDeleteTeam} 
          onEditTeam={handleUpdateTeam} 
        />
      );
      case 'ADMIN': return (
        <AdminPanel 
          assets={assets} employees={employees} teams={teams} roles={roles} searchQuery={searchQuery}
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