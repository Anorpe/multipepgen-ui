
import React from 'react';
import { PeptideResult, GenerationMethod } from '../types';

interface PeptideTableProps {
  peptides: PeptideResult[];
}

const PeptideTable: React.FC<PeptideTableProps> = ({ peptides }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sequence</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Engine</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Length</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Probability Score</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Isoelectric (pI)</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">MW (Da)</th>
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
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                  p.modelSource === GenerationMethod.PREDICTION 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                  {p.modelSource}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.length} aa</td>
              <td className="px-6 py-4 text-right">
                <div className="inline-flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(Object.values(p.probabilities)[0] as number) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {((Object.values(p.probabilities)[0] as number) * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 text-right font-medium">{p.isoelectricPoint.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-600 text-right font-medium">{p.molecularWeight.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PeptideTable;
