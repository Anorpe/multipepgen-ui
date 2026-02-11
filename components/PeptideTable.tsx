
import React from 'react';
import { PeptideResult, GenerationMethod } from '../types';

interface PeptideTableProps {
  peptides: PeptideResult[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600 font-bold';
  if (score >= 50) return 'text-amber-600 font-bold';
  return 'text-slate-400 font-medium';
};

const PeptideTable: React.FC<PeptideTableProps> = ({ peptides }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sequence</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Engine</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Length</th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">XGBoost</th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Random Forest</th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Neural Net</th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Decision Tree</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right bg-slate-100/50">Consensus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {peptides.map((p) => (
            <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
              <td className="px-6 py-4">
                <span className="mono font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">
                  {p.sequence}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${p.modelSource === GenerationMethod.PREDICTION
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}>
                  {p.modelSource}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.length} aa</td>
              <td className="px-4 py-4 text-right">
                <span className={`text-sm ${getScoreColor(p.xgboostScore || 0)}`}>
                  {p.xgboostScore?.toFixed(1)}%
                </span>
              </td>
              <td className={`px-4 py-4 text-right text-sm ${getScoreColor(p.randomForestScore || 0)}`}>{p.randomForestScore?.toFixed(1)}%</td>
              <td className={`px-4 py-4 text-right text-sm ${getScoreColor(p.neuralNetworkScore || 0)}`}>{p.neuralNetworkScore?.toFixed(1)}%</td>
              <td className={`px-4 py-4 text-right text-sm ${getScoreColor(p.decisionTreeScore || 0)}`}>{p.decisionTreeScore?.toFixed(1)}%</td>
              {/* Consensus Bar */}
              <td className="px-6 py-4 text-right bg-slate-50/30">
                <div className="flex flex-col items-end gap-1">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${p.consensusScore || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    {p.consensusScore?.toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PeptideTable;
