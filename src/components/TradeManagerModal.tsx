import React, { useState } from 'react';
import { Trade } from '../types';
import { X, Plus, Trash2, Palette, Check } from 'lucide-react';

interface TradeManagerModalProps {
  isOpen: boolean;
  trades: Trade[];
  onClose: () => void;
  onUpdateTrades: (trades: Trade[]) => void;
}

const PRESET_COLORS = [
  '#00A9E0', // Primary Bright Blue
  '#0066B3', // Medium Blue
  '#001430', // Navy
  '#FF8E00', // Vibrant Safety Orange
  '#00C76D', // Green
  '#FFCD00', // Yellow
  '#702082', // Purple
  '#E11D48', // Rose
  '#DC2626', // Crimson Red
  '#0D9488', // Teal
  '#854D0E', // Brown
  '#4B5563', // Slate
];

export const TradeManagerModal: React.FC<TradeManagerModalProps> = ({
  isOpen,
  trades,
  onClose,
  onUpdateTrades,
}) => {
  const [newTradeName, setNewTradeName] = useState('');
  const [newTradeCode, setNewTradeCode] = useState('');
  const [newTradeCompany, setNewTradeCompany] = useState('');
  const [newTradeColor, setNewTradeColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTradeName.trim()) return;

    const code = (newTradeCode || newTradeName.substring(0, 3)).toUpperCase().trim();
    const newTrade: Trade = {
      id: `TRADE-${Date.now()}`,
      name: newTradeName.trim(),
      code,
      color: newTradeColor,
      textColor: '#FFFFFF',
      company: newTradeCompany.trim() || undefined,
      isCustom: true,
    };

    onUpdateTrades([...trades, newTrade]);
    setNewTradeName('');
    setNewTradeCode('');
    setNewTradeCompany('');
  };

  const handleColorChange = (tradeId: string, color: string) => {
    onUpdateTrades(
      trades.map((t) => (t.id === tradeId ? { ...t, color } : t))
    );
  };

  const handleCompanyChange = (tradeId: string, company: string) => {
    onUpdateTrades(
      trades.map((t) => (t.id === tradeId ? { ...t, company } : t))
    );
  };

  const handleDeleteTrade = (tradeId: string) => {
    onUpdateTrades(trades.filter((t) => t.id !== tradeId));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-2 border-slate-300 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#0066B3]" />
            <h2 className="text-base font-black text-slate-900 uppercase">
              Subcontractor & Trade Roster
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-slate-600">
            Trades are automatically color-coded on pull plan sticky notes. Standard trades are pre-populated. You can customize colors, subcontractor names, or add new trades below.
          </p>

          {/* List of existing trades */}
          <div className="space-y-2">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div
                    className="w-6 h-6 rounded-md shadow-xs flex-shrink-0 cursor-pointer border border-black/20"
                    style={{ backgroundColor: trade.color }}
                  />

                  <div className="flex flex-col min-w-[120px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-black bg-slate-800 px-1.5 py-0.2 rounded text-white">
                        {trade.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 font-sans">
                        {trade.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs">
                    <input
                      type="text"
                      placeholder="Subcontractor / Vendor name"
                      value={trade.company || ''}
                      onChange={(e) => handleCompanyChange(trade.id, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#0066B3]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {PRESET_COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(trade.id, c)}
                      className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${
                        trade.color === c ? 'scale-125 border-slate-900 ring-1 ring-[#0066B3]' : 'border-slate-300 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Set color ${c}`}
                    />
                  ))}
                </div>

                {trade.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTrade(trade.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 cursor-pointer"
                    title="Delete trade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new trade form */}
          <form
            onSubmit={handleAddTrade}
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
          >
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-sans">
              <Plus className="w-4 h-4 text-[#0066B3]" />
              Add New Trade / Subcontractor
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Trade Name (e.g. Elevators, Landscaping)"
                value={newTradeName}
                onChange={(e) => setNewTradeName(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0066B3]"
                required
              />
              <input
                type="text"
                placeholder="Code (e.g. ELEV, LND)"
                value={newTradeCode}
                onChange={(e) => setNewTradeCode(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 uppercase focus:outline-none focus:border-[#0066B3]"
              />
              <input
                type="text"
                placeholder="Subcontractor Company"
                value={newTradeCompany}
                onChange={(e) => setNewTradeCompany(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0066B3]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-600 font-sans">Color:</span>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTradeColor(c)}
                    className={`w-5 h-5 rounded-full border cursor-pointer transition-transform flex items-center justify-center ${
                      newTradeColor === c ? 'scale-110 border-slate-900 ring-2 ring-[#0066B3]' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {newTradeColor === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#0066B3] hover:bg-[#005291] text-white font-bold text-xs rounded shadow cursor-pointer transition-colors font-sans"
              >
                Add Trade
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded cursor-pointer transition-colors font-sans"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
