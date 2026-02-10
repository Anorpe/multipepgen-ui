
import React, { useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { PeptideResult, GenerationMethod } from '../types';
import { Activity, Zap, Droplets, Ruler, Layers } from 'lucide-react';

interface Props {
  peptides: PeptideResult[];
}

const AMINO_ACIDS = "ACDEFGHIKLMNPQRSTVWY".split("");

const PhysicochemicalAnalysis: React.FC<Props> = ({ peptides }) => {
  const modelsInPlay = useMemo(() => Array.from(new Set(peptides.map(p => p.modelSource))), [peptides]);

  const statsByModel = useMemo(() => {
    return modelsInPlay.reduce((acc, model) => {
      const modelPeps = peptides.filter(p => p.modelSource === model);
      acc[model] = {
        // Fix: Explicitly type accumulator for arithmetic operation to prevent inference issues
        avgPI: modelPeps.reduce((s: number, p: PeptideResult) => s + p.isoelectricPoint, 0) / (modelPeps.length || 1),
        avgHydro: modelPeps.reduce((s: number, p: PeptideResult) => s + p.hydrophobicity, 0) / (modelPeps.length || 1),
        avgMW: modelPeps.reduce((s: number, p: PeptideResult) => s + p.molecularWeight, 0) / (modelPeps.length || 1),
        avgLen: modelPeps.reduce((s: number, p: PeptideResult) => s + p.length, 0) / (modelPeps.length || 1),
        count: modelPeps.length
      };
      return acc;
    }, {} as Record<string, any>);
  }, [peptides, modelsInPlay]);

  const aaCompositionComparison = useMemo(() => {
    return AMINO_ACIDS.map(aa => {
      const entry: any = { name: aa };
      modelsInPlay.forEach(model => {
        const modelPeps = peptides.filter(p => p.modelSource === model);
        // Fix: Explicitly type accumulator
        const totalAA = modelPeps.reduce((s: number, p: PeptideResult) => s + p.sequence.length, 0);
        // Explicitly typed the accumulator and wrapped subtraction to resolve arithmetic ambiguity for the TypeScript compiler
        const countAA = modelPeps.reduce((s: number, p: PeptideResult) => s + (p.sequence.split(aa).length - 1), 0);
        entry[model] = totalAA > 0 ? (countAA / totalAA) * 100 : 0;
      });
      return entry;
    });
  }, [peptides, modelsInPlay]);

  const lengthDistribution = useMemo(() => {
    const lengthsSet = new Set(peptides.map(p => p.length));
    // Fix: Explicitly type sort parameters to avoid arithmetic operation errors on unknown types
    const lengths = Array.from(lengthsSet).sort((a: number, b: number) => a - b);
    return lengths.map(len => {
      const entry: any = { length: `${len} aa` };
      modelsInPlay.forEach(model => {
        entry[model] = peptides.filter(p => p.modelSource === model && p.length === len).length;
      });
      return entry;
    });
  }, [peptides, modelsInPlay]);

  const getModelColor = (model: GenerationMethod) => 
    model === GenerationMethod.PREDICTION ? '#8b5cf6' : '#6366f1';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Comparative Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <ComparativeMetricCard 
          icon={<Zap className="text-amber-500" size={18} />} 
          label="Isoelectric Point (pI)" 
          stats={statsByModel}
          dataKey="avgPI"
          unit="pH"
        />
        <ComparativeMetricCard 
          icon={<Droplets className="text-blue-500" size={18} />} 
          label="Hydrophobicity" 
          stats={statsByModel}
          dataKey="avgHydro"
          unit="H"
        />
        <ComparativeMetricCard 
          icon={<Activity className="text-emerald-500" size={18} />} 
          label="Molecular Weight" 
          stats={statsByModel}
          dataKey="avgMW"
          unit="Da"
        />
        <ComparativeMetricCard 
          icon={<Ruler className="text-indigo-500" size={18} />} 
          label="Sequence Length" 
          stats={statsByModel}
          dataKey="avgLen"
          unit="aa"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Physicochemical Space Comparison */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 italic">
              <Layers size={20} className="text-blue-600" /> Inter-Model Chemical Space
            </h4>
            <div className="flex gap-4">
              {modelsInPlay.map(m => (
                <div key={m} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getModelColor(m as GenerationMethod) }}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{m}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="hydrophobicity" 
                  name="Hydrophobicity" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  label={{ value: 'Hydrophobicity Index', position: 'bottom', offset: -10, fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="isoelectricPoint" 
                  name="pI" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  label={{ value: 'Isoelectric Point (pH)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 600 }}
                />
                <ZAxis type="number" dataKey="length" range={[40, 300]} name="Length" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xl">
                          <p className="text-xs font-bold text-slate-900 mb-2">{data.id}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] flex justify-between gap-4"><span className="text-slate-400 font-bold uppercase">pI:</span> <span className="text-slate-700 font-mono">{data.isoelectricPoint.toFixed(2)}</span></p>
                            <p className="text-[10px] flex justify-between gap-4"><span className="text-slate-400 font-bold uppercase">Hydro:</span> <span className="text-slate-700 font-mono">{data.hydrophobicity.toFixed(2)}</span></p>
                            <p className="text-[10px] flex justify-between gap-4"><span className="text-slate-400 font-bold uppercase">Source:</span> <span className="font-bold text-blue-600">{data.modelSource}</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {modelsInPlay.map(model => (
                  <Scatter 
                    key={model} 
                    name={model} 
                    data={peptides.filter(p => p.modelSource === model)} 
                    fill={getModelColor(model as GenerationMethod)} 
                    fillOpacity={0.5} 
                    stroke={getModelColor(model as GenerationMethod)}
                    strokeWidth={1}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Residue Composition */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2 italic">
            <Layers size={20} className="text-emerald-600" /> Residue Propensity Analysis
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aaCompositionComparison} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tick={{ fontWeight: 700 }} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '20px' }} />
                {modelsInPlay.map(model => (
                  <Bar 
                    key={model} 
                    dataKey={model} 
                    fill={getModelColor(model as GenerationMethod)} 
                    radius={[4, 4, 0, 0]} 
                    barSize={12}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Length Distribution Comparison */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm xl:col-span-2">
          <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2 italic">
            <Ruler size={20} className="text-indigo-600" /> Sequence Length Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lengthDistribution} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="length" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '16px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                {modelsInPlay.map(model => (
                  <Bar 
                    key={model} 
                    dataKey={model} 
                    fill={getModelColor(model as GenerationMethod)} 
                    radius={[4, 4, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparativeMetricCard = ({ icon, label, stats, dataKey, unit }: { 
  icon: React.ReactNode, 
  label: string, 
  stats: Record<string, any>, 
  dataKey: string, 
  unit: string 
}) => {
  const models = Object.keys(stats);
  
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      </div>
      
      <div className="space-y-4">
        {models.map(model => (
          <div key={model} className="group">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase">{model}</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-bold font-mono ${model.includes('Prediction') ? 'text-purple-600' : 'text-indigo-600'}`}>
                  {stats[model][dataKey].toFixed(dataKey === 'avgMW' ? 1 : 2)}
                </span>
                <span className="text-[9px] font-bold text-slate-300">{unit}</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${model.includes('Prediction') ? 'bg-purple-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, (stats[model][dataKey] / (dataKey === 'avgMW' ? 4000 : 15)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhysicochemicalAnalysis;
