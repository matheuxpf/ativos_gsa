import axios from 'axios';
import { Asset, Employee, Team, Role, Movement } from '../types';

export const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- TEAMS ---
export const getTeams = async () => (await api.get('/teams/')).data;
export const createTeam = async (data: Partial<Team>) => (await api.post('/teams/', data)).data;
export const updateTeam = async (id: string, data: Partial<Team>) => (await api.put(`/teams/${id}`, data)).data;
export const deleteTeam = async (id: string) => (await api.delete(`/teams/${id}`)).data;

// --- ROLES ---
export const getRoles = async () => (await api.get('/roles/')).data;
export const createRole = async (data: Partial<Role>) => (await api.post('/roles/', data)).data;
export const updateRole = async (id: string, data: Partial<Role>) => (await api.put(`/roles/${id}`, data)).data;
export const deleteRole = async (id: string) => (await api.delete(`/roles/${id}`)).data;

// --- EMPLOYEES ---
export const getEmployees = async () => (await api.get('/employees/')).data;
export const createEmployee = async (data: Partial<Employee>) => (await api.post('/employees/', data)).data;
export const updateEmployee = async (id: string, data: Partial<Employee>) => (await api.put(`/employees/${id}`, data)).data;
export const deleteEmployee = async (id: string) => (await api.delete(`/employees/${id}`)).data;

// --- ASSETS ---
export const getAssets = async () => (await api.get('/assets/')).data;
export const createAsset = async (data: Partial<Asset>) => (await api.post('/assets/', data)).data;
export const updateAsset = async (id: string, data: Partial<Asset>) => (await api.put(`/assets/${id}`, data)).data;
export const deleteAsset = async (id: string) => (await api.delete(`/assets/${id}`)).data;

// --- MOVEMENTS ---
export const getMovements = async () => (await api.get('/movements/')).data;
export const createMovement = async (data: Partial<Movement>) => (await api.post('/movements/', data)).data;

// --- AUDIT LOGS ---
export const getAuditLogs = async () => (await api.get('/audit/')).data;
export const createAuditLog = async (data: any) => (await api.post('/audit/', data)).data;
