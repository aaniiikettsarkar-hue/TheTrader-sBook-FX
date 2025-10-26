import React, { useState, useEffect, useCallback } from 'react';
import { TradeFormData, TradeSession, TradeDirection, EmotionalState, TradeLog } from '../types';
import { STRATEGY_OPTIONS } from '../constants';
import { getAISuggestion } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface TradeFormProps {
  onAddTrade: (trade: TradeFormData) => void;
  editingTrade: TradeLog | null;
  onUpdateTrade: (trade: TradeFormData, id: string) => void;
  onCancelEdit: () => void;
}

const initialFormState: TradeFormData = {
  entryDateTime: new Date().toISOString().slice(0, 16),
  session: TradeSession.London,
  currencyPair: '',
  direction: TradeDirection.Long,
  strategy: STRATEGY_OPTIONS[0],
  customStrategy: '',
  pipsCaptured: 0,
  riskFree: false,
  reason: '',
  emotionalState: EmotionalState.Calm,
  suggestion: '',
};

const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade, editingTrade, onUpdateTrade, onCancelEdit }) => {
  const [formData, setFormData] = useState<TradeFormData>(initialFormState);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState('');
  
  const isEditing = !!editingTrade;

  useEffect(() => {
    if (editingTrade) {
      const isOtherStrategy = !STRATEGY_OPTIONS.includes(editingTrade.strategy);
      setFormData({
        entryDateTime: new Date(editingTrade.entryDateTime).toISOString().slice(0, 16),
        session: editingTrade.session,
        currencyPair: editingTrade.currencyPair,
        direction: editingTrade.direction,
        strategy: isOtherStrategy ? 'Other' : editingTrade.strategy,
        customStrategy: isOtherStrategy ? editingTrade.strategy : '',
        pipsCaptured: editingTrade.pipsCaptured,
        riskFree: editingTrade.riskFree,
        reason: editingTrade.reason,
        emotionalState: editingTrade.emotionalState,
        suggestion: editingTrade.suggestion,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingTrade]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pipsCaptured' ? parseFloat(value) || 0 : value,
    }));
  };
  
  const handleDirectionChange = (direction: TradeDirection) => {
    setFormData(prev => ({ ...prev, direction }));
  };

  const handleRiskFreeChange = (isRiskFree: boolean) => {
    setFormData(prev => ({ ...prev, riskFree: isRiskFree }));
  };
  
  const handleGenerateSuggestion = async () => {
    if(!formData.reason || !formData.pipsCaptured) {
        setError('Please enter Pips Captured and Reason for Win/Loss before generating a suggestion.');
        return;
    }
    if (formData.strategy === 'Other' && (!formData.customStrategy || !formData.customStrategy.trim())) {
        setError('Please specify your custom strategy before generating a suggestion.');
        return;
    }
    setError('');
    setIsLoadingAI(true);
    try {
        const suggestion = await getAISuggestion({
            ...formData,
            strategy: formData.strategy === 'Other' ? formData.customStrategy! : formData.strategy,
            result: formData.pipsCaptured > 0 ? 'Win' : 'Loss',
        });
        setFormData(prev => ({...prev, suggestion }));
    } catch (err) {
        setError('Failed to get AI suggestion. Please try again.');
        console.error(err);
    } finally {
        setIsLoadingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currencyPair.trim()) {
        setError('Currency Pair is a required field.');
        return;
    }
    if (formData.strategy === 'Other' && (!formData.customStrategy || !formData.customStrategy.trim())) {
        setError('Please specify your custom strategy when "Other" is selected.');
        return;
    }
    setError('');

    const tradeToSubmit: TradeFormData = {
        ...formData,
        strategy: formData.strategy === 'Other' ? formData.customStrategy!.trim() : formData.strategy,
    };
    
    if(isEditing) {
        onUpdateTrade(tradeToSubmit, editingTrade.id);
    } else {
        onAddTrade(tradeToSubmit);
    }
    setFormData(initialFormState); // Reset form after add or update
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
      <h2 className="text-xl font-bold mb-4 text-slate-700">{isEditing ? 'Edit Trade' : 'Log New Trade'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600">Date & Time (Entry)</label>
          <input type="datetime-local" name="entryDateTime" value={formData.entryDateTime} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Session</label>
            <select name="session" value={formData.session} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {Object.values(TradeSession).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Currency Pair</label>
            <input type="text" name="currencyPair" value={formData.currencyPair} onChange={handleChange} placeholder="e.g., EUR/USD" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600">Direction</label>
          <div className="mt-1 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
              <button type="button" onClick={() => handleDirectionChange(TradeDirection.Long)} className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${formData.direction === TradeDirection.Long ? 'bg-green-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Long</button>
              <button type="button" onClick={() => handleDirectionChange(TradeDirection.Short)} className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${formData.direction === TradeDirection.Short ? 'bg-red-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Short</button>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600">Strategy</label>
            <select name="strategy" value={formData.strategy} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            {STRATEGY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {formData.strategy === 'Other' && (
            <input
                type="text"
                name="customStrategy"
                value={formData.customStrategy || ''}
                onChange={handleChange}
                placeholder="Specify your strategy"
                required
                className="mt-2 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Pips Captured</label>
              <input type="number" name="pipsCaptured" value={formData.pipsCaptured} onChange={handleChange} step="0.1" placeholder="e.g., 25 or -15.5" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600">Risk-Free?</label>
                <div className="mt-1 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1 h-[42px] items-center">
                    <button type="button" onClick={() => handleRiskFreeChange(true)} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${formData.riskFree ? 'bg-indigo-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Yes</button>
                    <button type="button" onClick={() => handleRiskFreeChange(false)} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${!formData.riskFree ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200'}`}>No</button>
                </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600">Reason for Win/Loss</label>
          <textarea name="reason" value={formData.reason} onChange={handleChange} rows={3} placeholder="Detailed post-trade reflection..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-slate-600">Emotional State</label>
            <select name="emotionalState" value={formData.emotionalState} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {Object.values(EmotionalState).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-600">Suggestion for Self</label>
            <button type="button" onClick={handleGenerateSuggestion} disabled={isLoadingAI} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed">
              <SparklesIcon className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
              {isLoadingAI ? 'Generating...' : 'Get AI Suggestion'}
            </button>
          </div>
          <textarea name="suggestion" value={formData.suggestion} onChange={handleChange} rows={3} placeholder="Key lesson or corrective action..." className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col gap-2">
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
              {isEditing ? 'Update Trade' : 'Add Trade to Journal'}
            </button>
            {isEditing && (
                <button type="button" onClick={onCancelEdit} className="w-full bg-slate-200 text-slate-700 py-2 px-4 rounded-md font-semibold hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-200">
                    Cancel
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default TradeForm;