import React, { useMemo } from 'react';
import { TradeLog, TradeSession } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrashIcon, TrendingUpIcon, TrendingDownIcon, ScaleIcon, ShieldCheckIcon, PencilIcon } from './icons';

interface DashboardProps {
  tradeLogs: TradeLog[];
  onClearAll: () => void;
  onEditTrade: (trade: TradeLog) => void;
  onDeleteTrade: (id: string) => void;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ tradeLogs, onClearAll, onEditTrade, onDeleteTrade }) => {
  const analytics = useMemo(() => {
    if (tradeLogs.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPips: 0,
        riskFreeTrades: 0,
        winLossData: [],
        pipsBySessionData: [],
        winRateByStrategyData: [],
      };
    }

    const totalTrades = tradeLogs.length;
    const wins = tradeLogs.filter(log => log.result === 'Win').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPips = tradeLogs.reduce((acc, log) => acc + log.pipsCaptured, 0);
    const riskFreeTrades = tradeLogs.filter(log => log.riskFree).length;
    
    const pipsBySession = Object.values(TradeSession).reduce((acc, session) => {
        acc[session] = 0;
        return acc;
    }, {} as Record<TradeSession, number>);

    tradeLogs.forEach(log => {
        pipsBySession[log.session] = (pipsBySession[log.session] || 0) + log.pipsCaptured;
    });

    const pipsBySessionData = Object.entries(pipsBySession).map(([name, pips]) => ({ name, pips }));

    const winsByStrategy = tradeLogs.reduce((acc, log) => {
        if (log.result === 'Win') {
            acc[log.strategy] = (acc[log.strategy] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const winRateByStrategyData = Object.entries(winsByStrategy).map(([name, value]) => ({ name, value }));
    
    return {
      totalTrades,
      winRate,
      totalPips,
      riskFreeTrades,
      pipsBySessionData,
      winRateByStrategyData,
    };
  }, [tradeLogs]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-sm p-2 border border-slate-200 rounded-md shadow-sm">
          <p className="font-semibold">{`${payload[0].name}`}</p>
          <p className="text-sm text-indigo-600">{`Pips: ${payload[0].value.toFixed(1)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-slate-700">Performance Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <ScaleIcon className="w-6 h-6 mx-auto text-slate-500 mb-1" />
                    <p className="text-2xl font-bold">{analytics.totalTrades}</p>
                    <p className="text-sm text-slate-600">Total Trades</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <div className={`w-6 h-6 mx-auto mb-1 ${analytics.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                        {analytics.winRate >= 50 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    </div>
                    <p className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</p>
                    <p className="text-sm text-slate-600">Win Rate</p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg">
                    <ShieldCheckIcon className="w-6 h-6 mx-auto text-indigo-500 mb-1" />
                    <p className="text-2xl font-bold">{analytics.riskFreeTrades}</p>
                    <p className="text-sm text-slate-600">Risk-Free</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <p className={`text-2xl font-bold ${analytics.totalPips >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.totalPips.toFixed(1)}
                    </p>
                    <p className="text-sm text-slate-600">Total Pips</p>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-slate-700">Wins by Strategy</h3>
                {analytics.winRateByStrategyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            {/* FIX: Handle undefined 'percent' prop from recharts to prevent crash. */}
                            {/* FIX: Explicitly cast 'percent' to a number to satisfy TypeScript's type checker for arithmetic operations. */}
                            <Pie data={analytics.winRateByStrategyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}>
                                {analytics.winRateByStrategyData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div className="h-[300px] flex items-center justify-center text-slate-500">Log winning trades to see this chart.</div>}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-slate-700">Pips by Session</h3>
                {tradeLogs.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.pipsBySessionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}/>
                            <Bar dataKey="pips">
                                {analytics.pipsBySessionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pips >= 0 ? '#10b981' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div className="h-[300px] flex items-center justify-center text-slate-500">No trade data available.</div>}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-700">Recent Trades</h3>
                <button onClick={onClearAll} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled={tradeLogs.length === 0}>
                    <TrashIcon className="w-4 h-4" /> Clear All
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Pair</th>
                            <th scope="col" className="px-6 py-3">Direction</th>
                            <th scope="col" className="px-6 py-3">Pips</th>
                            <th scope="col" className="px-6 py-3">Strategy</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tradeLogs.slice(0, 10).map(log => (
                            <tr key={log.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{log.currencyPair}</td>
                                <td className={`px-6 py-4 font-semibold ${log.direction === 'Long' ? 'text-green-600' : 'text-red-600'}`}>{log.direction}</td>
                                <td className={`px-6 py-4 font-semibold ${log.pipsCaptured >= 0 ? 'text-green-600' : 'text-red-600'}`}>{log.pipsCaptured.toFixed(1)}</td>
                                <td className="px-6 py-4">{log.strategy}</td>
                                <td className="px-6 py-4">{new Date(log.entryDateTime).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onEditTrade(log)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDeleteTrade(log.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tradeLogs.length === 0 && <p className="text-center py-8 text-slate-500">Your logged trades will appear here.</p>}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
