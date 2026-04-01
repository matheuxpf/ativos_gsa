export enum Region {
  GO = 'GO', TO = 'TO', MT = 'MT', INDIRETO = 'INDIRETO', ADM = 'ADM'
}

export enum Channel {
  CV = 'CV', ATACADO = 'ATACADO', KEY_ACCOUNT = 'KEY ACCOUNT', ADMIN = 'ADMINISTRATIVO', VETOR = 'VETOR'
}

export enum AssetStatus {
  EM_USO = 'EM USO',
  EM_ESTOQUE = 'EM ESTOQUE',
  EM_MANUTENCAO = 'EM MANUTENÇÃO',
  BAIXADO = 'BAIXADO',
  PERDIDO = 'PERDIDO'
}

export type AssetState = 'NOVO' | 'USADO' | 'QUEBRADO' | 'COM DEFEITO';

export enum OwnerType {
  FUNCIONARIO = 'FUNCIONÁRIO', VAGA = 'VAGA', EQUIPE = 'EQUIPE', ESTOQUE = 'ESTOQUE', MANUTENCAO = 'MANUTENÇÃO'
}

export type AssetBrand = 'Samsung' | 'Dell' | 'Lenovo' | 'Apple';

// --- ATUALIZADO: Remoção do 'active' e inclusão do 'status' ---
export interface Employee {
  id: string; 
  name: string; 
  role: string; 
  roleId?: string; 
  region: Region; 
  teamId?: string; 
  status: 'Ativo' | 'Afastado' | 'Desligado'; 
}

export interface Team {
  id: string; name: string; region: Region; channel: Channel; leaderId?: string;
}

export interface Role {
  id: string;
  code: string;
  description: string;
  region: string;
  teamId?: string;
  // NOVOS CAMPOS DO KIT PADRÃO E STATUS
  reqNotebook?: boolean;
  reqDesktop?: boolean;
  reqMobile?: boolean;
  reqSim?: boolean;
  status?: string;
}

export interface Asset {
  id: string;
  type: string;
  brand: AssetBrand;
  
  assetTag: string;   
  primaryId: string;  
  
  status: AssetStatus;
  state: AssetState;
  
  color: string;
  details: string;
  value: number;
  
  currentOwnerType: OwnerType;
  currentOwnerId: string;
  currentOwnerName: string;
}

export interface Movement {
  id: string; assetId: string; date: string;
  fromOwnerType: OwnerType; fromOwnerId: string; fromOwnerName: string;
  toOwnerType: OwnerType; toOwnerId: string; toOwnerName: string;
  reason: string; observations?: string; registeredBy: string;
}

export type ViewState = 'DASHBOARD' | 'ASSETS' | 'MOVEMENTS' | 'DETAILS' | 'ADMIN' | 'TEAMS';

// --- TIPOS PARA AUDITORIA ---
export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'IMPORT' | 'STATUS';
export type LogEntity = 'ASSET' | 'EMPLOYEE' | 'TEAM' | 'ROLE' | 'SYSTEM';

export interface AuditLog {
  id: string;
  created_at: string;
  actor_name: string;
  action_type: LogAction;
  entity_type: LogEntity;
  description: string;
}