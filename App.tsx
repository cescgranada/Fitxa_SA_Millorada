
import React, { useState, useRef, useMemo } from 'react';
import { SAPhase, AppStep, PedagogicalAnalysis, SAPhaseLabels, EVALUATION_INSTRUMENTS } from './types';
import * as geminiService from './geminiService';

// --- Global UI Components ---

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold text-xl">NP</div>
      <div>
        <h1 className="text-lg font-bold text-slate-800 leading-tight">Assistent Pedagògic</h1>
        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Escola Nou Patufet • LOMLOE</p>
      </div>
    </div>
  </header>
);

const ProgressBar: React.FC<{ step: AppStep }> = ({ step }) => {
  const steps = [
    { id: 1, label: '📂 Inici' },
    { id: 2, label: '🧠 Millora' },
    { id: 3, label: '🤝 DUA' },
    { id: 4, label: '📝 Avaluació' },
    { id: 5, label: '📊 Resum' },
  ];
  return (
    <div className="w-full bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-1">
            <div className={`h-1.5 w-12 md:w-24 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-tighter ${step === s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [phase, setPhase] = useState<SAPhase>(SAPhase.INICIAL);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [analysis, setAnalysis] = useState<PedagogicalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Actions ---

  const reset = () => {
    setCurrentStep(AppStep.UPLOAD);
    setFileContent('');
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type === "text/plain" || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => setFileContent(e.target?.result as string);
        reader.readAsText(file);
      } else {
        // En una versió real utilitzaríem un parser de PDF/Word o enviaríem el fitxer a la API.
        // Per aquesta simulació, mantenim el text manual o informem de la càrrega.
        setFileContent(`[Document carregat: ${file.name}. Contingut llest per a l'anàlisi pedagògica.]`);
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (!fileContent.trim() && !selectedFile) {
      setError("Cal pujar un document o escriure text.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.analyzeAndImprove(fileContent, phase, selectedModel, temperature);
      if (!result.improved) throw new Error("Resultat no estructurat correctament");
      
      setAnalysis({
        originalContent: fileContent,
        improved: result.improved,
        improvementSuggestion: result.improvementSuggestion,
        udlVersion: '',
      });
      setCurrentStep(AppStep.ANALYSIS);
    } catch (err) {
      setError("Error en l'anàlisi. Reintenta-ho.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOutput = async (output: string) => {
    if (!analysis || !analysis.improved) return;
    setLoading(true);
    try {
      const udl = await geminiService.generateUDL(JSON.stringify(analysis.improved), output, selectedModel, temperature);
      setAnalysis({ ...analysis, selectedOutput: output, udlVersion: udl });
      setCurrentStep(AppStep.ADAPTATION);
    } catch (err) {
      setError("Error en generar DUA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstrument = async (inst: string) => {
    if (!analysis || !analysis.improved) return;
    setLoading(true);
    try {
      const evalText = await geminiService.generateEvaluation(JSON.stringify(analysis.improved), inst, selectedModel, temperature);
      const summary = await geminiService.generateSummary(JSON.stringify(analysis.improved), selectedModel);
      setAnalysis({ ...analysis, evaluationInstrument: evalText, selectedInstrumentName: inst, summaryTable: summary });
      setCurrentStep(AppStep.SUMMARY);
    } catch (err) {
      setError("Error en l'avaluació.");
    } finally {
      setLoading(false);
    }
  };

  // --- Export Data Memo ---

  const exportData = useMemo(() => {
    if (!analysis || !analysis.improved) return null;
    const { improved, selectedOutput, udlVersion, selectedInstrumentName, evaluationInstrument } = analysis;
    
    const contentText = `TITOL: ${improved.titol || ''}\nCONTEXT: ${improved.context || ''}\nOBJECTIUS:\n${(improved.objectius || []).map(o => '- ' + o).join('\n')}\n\nDESENVOLUPAMENT:\n${(improved.desenvolupament || []).map(d => (d.nom || '') + ': ' + (d.descripcio || '')).join('\n')}\n\nOUTPUT SELECCIONAT: ${selectedOutput || 'Pendent'}\n\nADAPTACIÓ DUA:\n${udlVersion}\n\nAVALUACIÓ (${selectedInstrumentName || 'N/A'}):\n${evaluationInstrument || 'Pendent'}`;

    return {
      markdown: `# SA: ${improved.titol || 'Sense títol'}\n\n${contentText}`,
      latex: `\\documentclass[12pt]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[t1]{sourcesanspro}\n\\usepackage[catalan]{babel}\n\\begin{document}\n\\section*{Fitxa Pedagògica}\n${contentText.replace(/_/g, '\\_').replace(/%/g, '\\%')}\n\\end{document}`,
      python: `from fpdf import FPDF\npdf = FPDF()\npdf.add_page()\npdf.set_font("Arial", size=12)\npdf.multi_cell(0, 10, """${contentText.replace(/"/g, "'")}""")\npdf.output("Fitxa_NouPatufet.pdf")`
    };
  }, [analysis]);

  // --- Views ---

  const renderDownloadsBar = () => (
    analysis && analysis.improved && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-40 flex justify-center gap-4">
        <button onClick={() => navigator.clipboard.writeText(exportData?.markdown || '')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-black transition-all">
          📥 MD (WORD)
        </button>
        <button onClick={() => navigator.clipboard.writeText(exportData?.latex || '')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">
          📥 LATEX
        </button>
        <button onClick={() => navigator.clipboard.writeText(exportData?.python || '')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all">
          📥 PYTHON (PDF)
        </button>
      </div>
    )
  );

  const renderUpload = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Assistent Pedagògic Nou Patufet 👋</h2>
        <p className="text-slate-500 text-sm">Configura la teva Situació d'Aprenentatge</p>
      </div>
      
      <div className="space-y-4">
        {/* IA Model Selection */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model d'IA</span>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash (Ràpid)</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro (Avançat)</option>
                <option value="gemini-flash-lite-latest">Gemini Flash Lite (lleuger)</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temperatura</span>
                <span className="text-[10px] font-black text-indigo-600">{temperature}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                <span>CONSERVADOR</span>
                <span>CREATIU</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">1. Document base (PDF, Word, MD o Text)</span>
          {!selectedFile ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-all group">
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📄</span>
              <p className="text-xs text-slate-400 font-medium">Clica per carregar un document</p>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.md,.txt" />
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <span className="text-xs font-bold text-indigo-700 truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <button onClick={() => { setSelectedFile(null); setFileContent(''); if(fileInputRef.current) fileInputRef.current.value=''; }} className="text-lg hover:rotate-12 transition-transform">🗑️</button>
            </div>
          )}
        </div>
        
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">2. Contingut / Edició</span>
          <textarea className="w-full h-32 p-4 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-indigo-500" value={fileContent} onChange={e => setFileContent(e.target.value)} placeholder="Escriu o edita el document base aquí..." />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SAPhaseLabels).map(([k, v]) => (
            <button key={k} onClick={() => setPhase(k as SAPhase)} className={`p-3 text-[10px] font-bold rounded-lg border transition-all ${phase === k ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      
      <button disabled={loading} onClick={handleStartAnalysis} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">
        {loading ? 'PREPARANT IA...' : '🚀 CONTINUAR'}
      </button>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Millora Bloom</h3>
        <p className="text-lg font-medium leading-relaxed italic">"{analysis?.improvementSuggestion}"</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800">{analysis?.improved?.titol}</h2>
          <div className="h-1 w-20 bg-indigo-500 rounded-full" />
        </div>
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Context</h4>
          <p className="text-slate-600 leading-relaxed">{analysis?.improved?.context}</p>
        </section>
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Objectius</h4>
          <ul className="space-y-2">
            {analysis?.improved?.objectius?.map((o, i) => (
              <li key={i} className="flex gap-3 items-start text-slate-600">
                <span className="text-indigo-400 font-bold">•</span> {o}
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Desenvolupament</h4>
          <div className="space-y-6 border-l-2 border-slate-100 pl-6">
            {analysis?.improved?.desenvolupament?.map((f, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <h5 className="font-bold text-slate-800 mb-1">{f.nom}</h5>
                <p className="text-sm text-slate-500 leading-relaxed">{f.descripcio}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">🎯 Tria el teu Output (Producte Final)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis?.improved?.outputs?.map((out, i) => (
              <button key={i} onClick={() => handleSelectOutput(out)} className="p-4 text-left border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-sm font-medium text-slate-700">
                {out}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderAdaptation = () => (
    <div className="space-y-6">
      <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Versió DUA</h3>
        <p className="font-medium">Accesibilitat Universal per a l'output: {analysis?.selectedOutput}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 whitespace-pre-wrap leading-loose text-slate-700 font-medium">
        {analysis?.udlVersion}
      </div>
      <button onClick={() => setCurrentStep(AppStep.EVALUATION_SELECT)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
        📝 SEGÜENT: TRIA INSTRUMENT D'AVALUACIÓ
      </button>
    </div>
  );

  const renderEvaluationSelect = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Quin instrument d'avaluació prefereixes?</h2>
        <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Llista completa Escola Nou Patufet</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {EVALUATION_INSTRUMENTS.map((inst, i) => (
          <button key={i} onClick={() => handleSelectInstrument(inst.name)} className="p-4 text-left border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-indigo-600 hover:text-white group transition-all">
            <h5 className="font-bold text-sm mb-1">{inst.name}</h5>
            <p className="text-[10px] opacity-70 leading-tight">{inst.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-8 pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest">📊 Resum Pedagògic</h3>
        </div>
        <table className="w-full text-xs text-left border-collapse">
          <tbody className="divide-y divide-slate-100">
            {[
              { label: 'Competències LOMLOE', val: analysis?.summaryTable?.competencies },
              { label: 'Sabers Bàsics', val: analysis?.summaryTable?.sabers },
              { label: 'ODS', val: analysis?.summaryTable?.ods },
              { label: 'Eixos Escola (Feminisme, Territori, Sostenibilitat)', val: analysis?.summaryTable?.eixosEscola },
              { label: 'Competències ABPxODS', val: analysis?.summaryTable?.competenciesABP },
            ].map((row, i) => (
              <tr key={i}>
                <td className="px-6 py-4 bg-slate-50 font-bold text-slate-600 w-1/3 border-r border-slate-100">{row.label}</td>
                <td className="px-6 py-4 text-slate-500 leading-relaxed">{row.val?.join(', ') || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-2xl">
        <h3 className="text-lg font-bold text-indigo-900 mb-4">📝 Instrument: {analysis?.selectedInstrumentName}</h3>
        <div className="whitespace-pre-wrap text-sm text-indigo-900/80 leading-relaxed font-medium">
          {analysis?.evaluationInstrument}
        </div>
      </div>
      <button onClick={reset} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all">
        🔄 COMENÇAR NOVA FITXA
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header />
      <ProgressBar step={currentStep} />
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-indigo-600 font-bold animate-pulse text-sm uppercase tracking-widest">Preparant materials...</p>
            </div>
          </div>
        )}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-4 border border-red-100 uppercase">{error}</div>}
        
        {currentStep === AppStep.UPLOAD && renderUpload()}
        {currentStep === AppStep.ANALYSIS && renderAnalysis()}
        {currentStep === AppStep.ADAPTATION && renderAdaptation()}
        {currentStep === AppStep.EVALUATION_SELECT && renderEvaluationSelect()}
        {currentStep === AppStep.SUMMARY && renderSummary()}
      </main>
      {renderDownloadsBar()}
    </div>
  );
};

export default App;
