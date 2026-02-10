
import React, { useState, useEffect } from 'react';
import {
  Dna,
  FlaskConical,
  Download,
  Settings2,
  BarChart3,
  Sparkles,
  Loader2,
  ClipboardList,
  Check,
  Microscope,
  ChevronLeft,
  Menu,
  Database,
  Search,
  Zap
} from 'lucide-react';
import {
  GenerationMethod,
  PeptideFunctionality,
  PeptideResult,
  GenerationParams,
  ResearchInsight
} from './types';
import PeptideTable from './components/PeptideTable';
import PhysicochemicalAnalysis from './components/PhysicochemicalAnalysis';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const AMINO_ACIDS = "ACDEFGHIKLMNPQRSTVWY".split("");

const LOADING_STEPS = [
  "Initializing generative latent space...",
  "Sampling candidate sequences...",
  "Filtering by amino acid constraints...",
  "Invoking bioactivity prediction API...",
  "Calculating physicochemical profiles...",
  "Finalizing multi-model comparison..."
];

const App: React.FC = () => {
  const [params, setParams] = useState<GenerationParams>({
    count: 10,
    methods: [GenerationMethod.PREDICTION],
    functionalities: [PeptideFunctionality.ANTIBACTERIAL],
    excludedAminoAcids: [],
    minLength: 12,
    maxLength: 30,
    threshold: 0.85
  });

  const [results, setResults] = useState<PeptideResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [activeTab, setActiveTab] = useState<'sequences' | 'biophysics'>('sequences');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Cycle through loading messages for a realistic "Compute" feel
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const generatePeptides = async () => {
    setIsGenerating(true);

    setIsSidebarOpen(false);

    // Simulate complex computation/API calls
    await new Promise(resolve => setTimeout(resolve, 3500));

    let allGenerated: PeptideResult[] = [];

    for (const method of params.methods) {
      const methodResults: PeptideResult[] = Array.from({ length: params.count }).map((_, i) => {
        const seqLen = Math.floor(Math.random() * (params.maxLength - params.minLength + 1)) + params.minLength;
        const sequence = Array.from({ length: seqLen })
          .map(() => AMINO_ACIDS.filter(aa => !params.excludedAminoAcids.includes(aa))[Math.floor(Math.random() * (AMINO_ACIDS.length - params.excludedAminoAcids.length))])
          .join('');

        const baseProb = method === GenerationMethod.PREDICTION ? params.threshold + 0.05 : params.threshold;

        return {
          id: `pep-${method === GenerationMethod.PREDICTION ? 'P' : 'S'}-${Date.now()}-${i}`,
          sequence,
          length: seqLen,
          probabilities: {
            [params.functionalities[0]]: Math.min(0.99, baseProb + (Math.random() * 0.1))
          },
          molecularWeight: seqLen * 110.5,
          isoelectricPoint: 4 + Math.random() * 8,
          hydrophobicity: -2 + Math.random() * 4,
          modelSource: method
        };
      });
      allGenerated = [...allGenerated, ...methodResults];
    }

    setResults(allGenerated);
    setIsGenerating(false);

  };



  const downloadData = (format: 'fasta' | 'csv' | 'json') => {
    let content = "";
    let fileName = `multipep_generation_${Date.now()}`;

    if (format === 'fasta') {
      content = results.map(p => `>${p.id} | model=${p.modelSource} | p=${(Object.values(p.probabilities)[0] as number).toFixed(3)}\n${p.sequence}`).join('\n');
      fileName += ".fasta";
    } else if (format === 'csv') {
      const headers = "ID,Sequence,Length,Model_Source,Main_Probability,pI,MW\n";
      const rows = results.map(p => `${p.id},${p.sequence},${p.length},"${p.modelSource}",${Object.values(p.probabilities)[0]},${p.isoelectricPoint},${p.molecularWeight}`).join('\n');
      content = headers + rows;
      fileName += ".csv";
    } else {
      content = JSON.stringify({ params, results }, null, 2);
      fileName += ".json";
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const toggleMethod = (method: GenerationMethod) => {
    setParams(prev => {
      const isSelected = prev.methods.includes(method);
      if (isSelected && prev.methods.length === 1) return prev;
      return {
        ...prev,
        methods: isSelected
          ? prev.methods.filter(m => m !== method)
          : [...prev.methods, method]
      };
    });
  };

  const toggleFunctionality = (func: PeptideFunctionality) => {
    setParams(prev => ({
      ...prev,
      functionalities: prev.functionalities.includes(func)
        ? prev.functionalities.filter(f => f !== func)
        : [...prev.functionalities, func]
    }));
  };

  const toggleExcludedAA = (aa: string) => {
    setParams(prev => ({
      ...prev,
      excludedAminoAcids: prev.excludedAminoAcids.includes(aa)
        ? prev.excludedAminoAcids.filter(a => a !== aa)
        : [...prev.excludedAminoAcids, aa]
    }));
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] overflow-hidden">
      {/* Retractable Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-500 ease-in-out relative flex flex-col shadow-sm z-30 ${isSidebarOpen ? 'w-full lg:w-[420px]' : 'w-0 lg:w-0 overflow-hidden opacity-0 -translate-x-full'
          }`}
      >
        <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-8 min-w-[420px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <Dna className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">MultiPepGen</h1>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Research Suite 3.0</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:flex hidden p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              title="Retract Panel"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <Settings2 size={16} /> Generation Engines
              </label>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(GenerationMethod).map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMethod(m)}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all border flex items-center justify-between ${params.methods.includes(m)
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    {m}
                    {params.methods.includes(m) && <Check size={16} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <FlaskConical size={16} /> Target Functionalities
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(PeptideFunctionality).map(f => (
                  <button
                    key={f}
                    onClick={() => toggleFunctionality(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${params.functionalities.includes(f)
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Count per Model</label>
                <input
                  type="number"
                  value={params.count}
                  onChange={e => setParams(p => ({ ...p, count: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Threshold (%)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={params.threshold}
                  onChange={e => setParams(p => ({ ...p, threshold: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Min Length</label>
                <input
                  type="number"
                  value={params.minLength}
                  onChange={e => setParams(p => ({ ...p, minLength: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Max Length</label>
                <input
                  type="number"
                  value={params.maxLength}
                  onChange={e => setParams(p => ({ ...p, maxLength: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </section>

            <section>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Excluded Residues</label>
              <div className="grid grid-cols-10 gap-1">
                {AMINO_ACIDS.map(aa => (
                  <button
                    key={aa}
                    onClick={() => toggleExcludedAA(aa)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all border ${params.excludedAminoAcids.includes(aa)
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {aa}
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={generatePeptides}
              disabled={isGenerating || params.functionalities.length === 0 || params.methods.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Run Engines ({params.methods.length})
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
        {!isSidebarOpen && !isGenerating && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-8 left-8 z-40 p-3 bg-white border border-slate-200 rounded-xl shadow-lg text-blue-600 hover:bg-blue-50 transition-all hover:scale-110 active:scale-95 animate-in fade-in zoom-in duration-300"
            title="Open Configuration"
          >
            <Menu size={24} />
          </button>
        )}

        <div className={`p-6 lg:p-12 transition-all duration-500 ${!isSidebarOpen ? 'lg:pl-24' : ''}`}>
          {isGenerating ? (
            <div className="h-[80vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                <div className="relative bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-6">
                    <Loader2 className="w-24 h-24 text-blue-600 animate-spin absolute inset-0 opacity-20" strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Dna className="w-12 h-12 text-blue-600 animate-bounce" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Molecular Engine Running</h2>
                  <p className="text-slate-500 font-medium text-center max-w-xs">{LOADING_STEPS[loadingStep]}</p>
                </div>
                {/* Secondary decorative elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center animate-bounce delay-75 shadow-sm">
                  <Search size={20} className="text-purple-600" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center animate-bounce delay-150 shadow-sm">
                  <Zap size={20} className="text-emerald-600" />
                </div>
                <div className="absolute top-1/2 -right-16 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  <Database size={16} className="text-indigo-600" />
                </div>
              </div>
              <div className="flex gap-1.5">
                {LOADING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i <= loadingStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="h-[70vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 backdrop-blur-sm">
              <div className="bg-slate-100 p-6 rounded-full mb-6">
                <ClipboardList className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No sequences generated yet</h3>
              <p className="text-slate-500 max-w-sm text-center mt-2 font-medium">
                Configure your multi-model parameters and click "Run Engines" to begin your research session.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sequence Analysis Workbench</h2>
                  <p className="text-slate-500 mt-1 font-medium">Review, filter, and compare your antimicrobial candidates.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadData('fasta')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download size={16} /> FASTA
                  </button>
                  <button
                    onClick={() => downloadData('csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download size={16} /> CSV
                  </button>
                </div>
              </header>

              {/* View Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('sequences')}
                  className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'sequences' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Sequences & Scores
                </button>
                <button
                  onClick={() => setActiveTab('biophysics')}
                  className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'biophysics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <Microscope size={16} /> Physicochemical Profiling
                </button>
              </div>

              {activeTab === 'sequences' ? (
                <>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /> Model Performance</h4>
                        <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded">N={results.length}</span>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={results}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="id" hide />
                            <YAxis domain={[0, 1]} />
                            <Tooltip
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Probability']}
                            />
                            <Bar dataKey={(p) => (Object.values((p as PeptideResult).probabilities)[0] as number)} radius={[4, 4, 0, 0]}>
                              {results.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.modelSource === GenerationMethod.PREDICTION ? '#8b5cf6' : '#6366f1'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>


                  </div>
                  <PeptideTable peptides={results} />
                </>
              ) : (
                <PhysicochemicalAnalysis peptides={results} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
