
import React, { useState, useEffect } from 'react';
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
  Zap,
  Layers
} from 'lucide-react';
import {
  GenerationMethod,
  PeptideFunctionality,
  PeptideResult,
  GenerationParams,
  FilterParams,
  ResearchInsight
} from './types';
import {
  calculateMolecularWeight,
  calculateIsoelectricPoint,
  calculateHydrophobicity,
  calculateNetCharge,
  calculateBomanIndex
} from './utils/biophysics';
import PeptideTable from './components/PeptideTable';
import PhysicochemicalAnalysis from './components/PhysicochemicalAnalysis';
import DoubleRangeSlider from './components/DoubleRangeSlider';
import { generatePeptidesRemote, predictPeptidesRemote } from './services/api';

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
    functionalities: [PeptideFunctionality.ANTIBACTERIAL]
  });

  const [filterParams, setFilterParams] = useState<FilterParams>({
    excludedAminoAcids: [],
    minLength: 0,
    maxLength: 32,
    threshold: 0
  });

  const [results, setResults] = useState<PeptideResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [predictionError, setPredictionError] = useState<boolean>(false);

  // Apply Client-Side Filters
  const filteredResults = results.filter(p => {
    const score = p.consensusScore || (Object.values(p.probabilities)[0] as number);
    const meetsThreshold = score >= filterParams.threshold;
    const meetsLength = p.length >= filterParams.minLength && p.length <= filterParams.maxLength;
    const hasExcludedAA = filterParams.excludedAminoAcids.some(aa => p.sequence.includes(aa));

    return meetsThreshold && meetsLength && !hasExcludedAA;
  });

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
    setError(null);
    setPredictionError(false);

    try {
      // 1. Generate Sequences
      // Only pass core generation params to API
      const remoteData = await generatePeptidesRemote({
        count: params.count,
        methods: params.methods,
        functionalities: params.functionalities,
        // The API might still expect these fields if strict strict, passing safely
        excludedAminoAcids: [],
        minLength: 0,
        maxLength: 100,
        threshold: 0
      } as any); // Cast as any if API requires full Params, or update API definition later

      // 2. Collect all sequences for prediction
      const allSequences = [
        ...(remoteData.generated_better_prediction || []),
        ...(remoteData.generated_more_stable || [])
      ];

      // 3. Predict Properties & Scores
      let predictionMap = new Map<string, any>();
      if (allSequences.length > 0) {
        try {
          const predictions = await predictPeptidesRemote(allSequences);
          predictions.forEach(p => predictionMap.set(p.Peptido, p));
        } catch (err) {
          console.error("Prediction API failed, falling back to partial data:", err);
          setPredictionError(true);
          // We continue, and mapToResult will handle missing data by using safe defaults
        }
      }



      // Helper to map raw sequences to PeptideResult 
      const mapToResult = (sequences: string[], method: GenerationMethod): PeptideResult[] => {
        return sequences.map((sequence, i) => {
          const pred = predictionMap.get(sequence);
          const seqLen = sequence.length;

          // Use XGBoost score as the main probability (scaled 0-1)
          const probability = pred ? (pred['XGboost'] / 100) : 0;

          // Calculate Consensus Score
          let consensus: number | undefined = undefined;
          if (pred) {
            const scores = [
              pred['XGboost'],
              pred['Bosque Aleatorio'],
              pred['Red Neuronal'],
              pred['Arbol de Decisión'],
              pred['Regresión Lógistica']
            ];
            consensus = (scores.reduce((a, b) => a + b, 0) / (scores.length || 1)) / 100;
          }

          // Calculate physicochemical properties locally
          const mw = calculateMolecularWeight(sequence);
          const pI = calculateIsoelectricPoint(sequence);
          const hydro = calculateHydrophobicity(sequence);
          const charge = calculateNetCharge(sequence);
          const boman = calculateBomanIndex(sequence);

          return {
            id: `pep-${method === GenerationMethod.PREDICTION ? 'P' : 'S'}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            sequence,
            length: seqLen,
            probabilities: {
              [params.functionalities[0]]: probability
            },
            modelSource: method,

            // Map real physicochemical properties from LOCAL CALCULATION
            molecularWeight: mw,
            isoelectricPoint: pI,
            hydrophobicity: hydro,
            charge: charge,
            hydrophobicMoment: pred ? pred['momento hidrofobico'] : undefined, // Keep from API if available, or implement local later
            bomanIndex: boman,
            wimley: pred ? pred['wimley'] : undefined,
            transmembraneHelices: pred ? pred['helices transmembrana'] : 'unknown',

            // Individual Scores
            xgboostScore: pred ? pred['XGboost'] : undefined,
            randomForestScore: pred ? pred['Bosque Aleatorio'] : undefined,
            neuralNetworkScore: pred ? pred['Red Neuronal'] : undefined,
            decisionTreeScore: pred ? pred['Arbol de Decisión'] : undefined,
            logisticRegressionScore: pred ? pred['Regresión Lógistica'] : undefined,

            // Final Consensus
            consensusScore: consensus
          };
        });
      };

      const predictionResults = params.methods.includes(GenerationMethod.PREDICTION)
        ? mapToResult(remoteData.generated_better_prediction || [], GenerationMethod.PREDICTION)
        : [];

      const stabilityResults = params.methods.includes(GenerationMethod.STABILITY)
        ? mapToResult(remoteData.generated_more_stable || [], GenerationMethod.STABILITY)
        : [];

      setResults([...predictionResults, ...stabilityResults]);

    } catch (error: any) {
      console.error("Failed to generate peptides:", error);
      setError(error.message || "An unexpected error occurred while generating peptides.");
    } finally {
      setIsGenerating(false);
    }
  };


  const downloadData = (format: 'fasta' | 'csv' | 'json') => {
    let content = "";
    let fileName = `multipep_generation_${Date.now()}`;

    if (format === 'fasta') {
      // Clean FASTA header as requested
      content = filteredResults.map(p => `>${p.id} | model=${p.modelSource}\n${p.sequence}`).join('\n');
      fileName += ".fasta";
    } else if (format === 'csv') {
      // Remove Main_Probability, pI, MW columns
      const headers = "ID,Sequence,Length,Model_Source\n";
      const rows = filteredResults.map(p => `${p.id},${p.sequence},${p.length},"${p.modelSource}"`).join('\n');
      content = headers + rows;
      fileName += ".csv";
    } else {
      content = JSON.stringify({ params, results: filteredResults }, null, 2);
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
      if (isSelected && prev.methods.length === 1) {
        // Prevent deselecting the last method
        return prev;
      }
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
    setFilterParams(prev => ({
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

            <section>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Layers size={16} /> Sequences per Model
                </label>
                <div className="flex items-center bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
                  <input
                    type="number"
                    value={params.count}
                    min="1"
                    max="100"
                    onChange={e => setParams(p => ({ ...p, count: Math.min(100, Math.max(1, Number(e.target.value))) }))}
                    className="w-12 bg-transparent text-right text-xs font-bold text-slate-700 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-bold ml-1">SEQ</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={params.count}
                  onChange={e => setParams(p => ({ ...p, count: Number(e.target.value) }))}
                  className="w-full accent-blue-600 mb-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>1 seq</span>
                  <span>50 seq</span>
                  <span>100 seq</span>
                </div>
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
          ) : error ? (
            <div className="h-[70vh] flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-3xl bg-red-50/50 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
              <div className="bg-red-100 p-6 rounded-full mb-6">
                <Zap className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-800">Generation Failed</h3>
              <p className="text-red-600 max-w-md text-center mt-2 font-medium">
                {error}
              </p>

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
              <header className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                </div>

                {/* New Horizontal Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-48">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-center">
                        Probability Threshold ({(filterParams.threshold * 100).toFixed(0)}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={filterParams.threshold}
                        onChange={e => setFilterParams(p => ({ ...p, threshold: Number(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col">
                      <div className="mb-1 text-center">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase text-center">Length Range</label>
                        <div className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">{filterParams.minLength} - {filterParams.maxLength} aa</div>
                      </div>
                      <div className="px-2 py-1 w-48">
                        <DoubleRangeSlider
                          min={0}
                          max={32}
                          minVal={filterParams.minLength}
                          maxVal={filterParams.maxLength}
                          onChange={(min, max) => setFilterParams(p => ({ ...p, minLength: min, maxLength: max }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-px h-10 bg-slate-200 lg:block hidden"></div>

                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Excluded Residues</label>
                    <div className="flex flex-wrap gap-1">
                      {AMINO_ACIDS.map(aa => (
                        <button
                          key={aa}
                          onClick={() => toggleExcludedAA(aa)}
                          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-all border ${filterParams.excludedAminoAcids.includes(aa)
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {aa}
                        </button>
                      ))}
                    </div>
                  </div>
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
                    {predictionError && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg">
                          <Zap size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-900 text-sm">Prediction Service Unavailable</h4>
                          <p className="text-amber-700 text-xs mt-1">
                            We collected the generated sequences, but the property prediction service (AmpClass) is currently offline or unreachable. Scores and properties are displayed as unknown.
                          </p>
                        </div>
                      </div>
                    )}




                  </div>
                  <PeptideTable peptides={filteredResults} />
                </>
              ) : (
                <PhysicochemicalAnalysis peptides={filteredResults} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
