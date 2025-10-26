import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TradeLog, TradeFormData } from './types';
import TradeForm from './components/TradeForm';
import Dashboard from './components/Dashboard';
import { JournalIcon } from './components/icons';
import { mockTradeData } from './constants';

const App: React.FC = () => {
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>(() => {
    try {
      const storedLogs = localStorage.getItem('forexTradeLogs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        // Revive date strings from localStorage into Date objects
        return parsedLogs.map((log: any) => ({
          ...log,
          entryDateTime: new Date(log.entryDateTime),
        }));
      }
      // If no logs are stored, initialize with mock data.
      return mockTradeData;
    } catch (error) {
      console.error("Failed to load or parse trade logs from localStorage, starting fresh.", error);
      // If storage is corrupted, start with an empty list.
      return [];
    }
  });

  const [editingTrade, setEditingTrade] = useState<TradeLog | null>(null);
  const tradeFormRef = useRef<HTMLDivElement>(null);

  // This effect runs whenever the 'tradeLogs' state changes, persisting it to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem('forexTradeLogs', JSON.stringify(tradeLogs));
    } catch (error) {
      console.error("Failed to save trade logs to localStorage", error);
    }
  }, [tradeLogs]);

  const addTrade = useCallback((newTradeData: TradeFormData) => {
    const { customStrategy, ...logData } = newTradeData;
    const newLog: TradeLog = {
      ...logData,
      id: new Date().toISOString() + Math.random().toString(),
      entryDateTime: new Date(logData.entryDateTime),
      result: logData.pipsCaptured > 0 ? 'Win' : 'Loss',
    };
    setTradeLogs(prevLogs => [newLog, ...prevLogs]);
  }, []);

  const updateTrade = useCallback((updatedTradeData: TradeFormData, id: string) => {
    const { customStrategy, ...logData } = updatedTradeData;
    const updatedLog: TradeLog = {
      ...logData,
      id: id,
      entryDateTime: new Date(logData.entryDateTime),
      result: logData.pipsCaptured > 0 ? 'Win' : 'Loss',
    };
    setTradeLogs(prevLogs => prevLogs.map(log => (log.id === id ? updatedLog : log)));
    setEditingTrade(null);
  }, []);

  const deleteTrade = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      setTradeLogs(prevLogs => prevLogs.filter(log => log.id !== id));
    }
  }, []);

  const clearAllTrades = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all trade logs? This action cannot be undone.")) {
      setTradeLogs([]);
    }
  }, []);

  const handleEditTrade = useCallback((trade: TradeLog) => {
    setEditingTrade(trade);
    tradeFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingTrade(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <JournalIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">The Trader's Book: FX</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1" ref={tradeFormRef}>
            <TradeForm 
              onAddTrade={addTrade}
              editingTrade={editingTrade}
              onUpdateTrade={updateTrade}
              onCancelEdit={cancelEdit}
            />
          </div>
          <div className="lg:col-span-2">
            <Dashboard 
              tradeLogs={tradeLogs} 
              onClearAll={clearAllTrades}
              onEditTrade={handleEditTrade}
              onDeleteTrade={deleteTrade}
            />
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Built for disciplined traders. © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;