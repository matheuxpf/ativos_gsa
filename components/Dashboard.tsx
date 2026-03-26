import React from 'react';
import { Asset, AssetStatus, AssetState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Monitor, Smartphone, AlertTriangle, CheckCircle, CircleDollarSign, Box } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
}

export const Dashboard: React.FC<DashboardProps> = ({ assets }) => {
  // Cálculos Estatísticos
  const totalAssets = assets.length;
  const totalValue = assets.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  
  const inUse = assets.filter(a => a.status === AssetStatus.EM_USO).length;
  const inStock = assets.filter(a => a.status === AssetStatus.EM_ESTOQUE).length;
  const inMaintenance = assets.filter(a => a.status === AssetStatus.EM_MANUTENCAO).length;

  // Dados para o Gráfico de Status (Operacional)
  const statusData = [
    { name: 'Em Uso', value: inUse, color: '#10B981' }, // Green
    { name: 'Estoque', value: inStock, color: '#3B82F6' }, // Blue
    { name: 'Manutenção', value: inMaintenance, color: '#F59E0B' }, // Yellow
    { name: 'Outros', value: totalAssets - inUse - inStock - inMaintenance, color: '#9CA3AF' } // Gray
  ];

  // Dados para o Gráfico de Estado Físico (Novo, Usado...)
  const conditionData = [
    { name: 'Novo', value: assets.filter(a => a.state === 'NOVO').length },
    { name: 'Usado', value: assets.filter(a => a.state === 'USADO').length },
    { name: 'Defeito', value: assets.filter(a => a.state === 'COM DEFEITO' || a.state === 'QUEBRADO').length },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total de Ativos</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{totalAssets}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-gsa-blue"><Box size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Valor Patrimonial</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600"><CircleDollarSign size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Em Estoque</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{inStock}</h3>
              <p className="text-xs text-slate-400 mt-1">Disponíveis para uso</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><CheckCircle size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Manutenção</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{inMaintenance}</h3>
              <p className="text-xs text-red-400 mt-1">Requer atenção</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600"><AlertTriangle size={24} /></div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Distribuição */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h4 className="font-bold text-slate-700 mb-4">Status Operacional</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Condição Física */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h4 className="font-bold text-slate-700 mb-4">Integridade da Frota</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conditionData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista Recente Rápida */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <h4 className="font-bold text-slate-700">Últimas Adições ao Inventário</h4>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <tbody className="bg-white divide-y divide-slate-200">
            {assets.slice(0, 5).map(asset => (
              <tr key={asset.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      {asset.type === 'CELULAR' ? <Smartphone size={16}/> : <Monitor size={16}/>}
                    </div>
                    <div className="ml-4">
                      {/* AQUI ESTAVA O ERRO: asset.model foi removido. Substituído por brand + type */}
                      <div className="text-sm font-bold text-slate-900">{asset.brand} {asset.type}</div>
                      <div className="text-xs text-slate-500">{asset.primaryId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.status === 'EM ESTOQUE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {asset.currentOwnerName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};