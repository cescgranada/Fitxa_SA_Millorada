
import React, { useState, useRef } from 'react';
import { SAPhase, AppStep, PedagogicalAnalysis, SAPhaseLabels, EVALUATION_INSTRUMENTS, GroupingType, SummaryData, ProductProposal } from './types';
import * as geminiService from './geminiService';

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-xl text-white font-bold text-xl shadow-sm">NP</div>
      <div>
        <h1 className="text-lg font-black text-slate-800 leading-tight">Disseny Instruccional</h1>
        <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">Escola Nou Patufet</p>
      </div>
    </div>
  </header>
);

const ProgressBar: React.FC<{ step: AppStep }> = ({ step }) => {
  const steps = [
    { id: 1, label: '📂 Proposta' },
    { id: 2, label: '🧠 Millora i Config' },
    { id: 3, label: '🎯 Triar Producte' },
    { id: 4, label: '📋 Fitxa Alumne' },
    { id: 5, label: '📊 Resum Final' },
  ];
  return (
    <div className="w-full bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${step >= s.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter ${step === s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-1 bg-slate-100 mx-4 -mt-6">
                <div className={`h-full bg-indigo-600 transition-all duration-700`} style={{ width: step > s.id ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [phase, setPhase] = useState<SAPhase>(SAPhase.INICIAL);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [groupingType, setGroupingType] = useState<GroupingType>(GroupingType.INDIVIDUAL);
  const [memberCount, setMemberCount] = useState<number>(4);
  const [userComments, setUserComments] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [analysis, setAnalysis] = useState<PedagogicalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFileContent(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartAnalysis = async () => {
    if (!fileContent.trim()) {
      setError("Cal introduir algun contingut bàsic de la proposta.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.analyzeAndImprove(fileContent, phase, selectedModel, temperature);
      setAnalysis({
        originalContent: fileContent,
        improved: result.improved,
        improvementSuggestion: result.improvementSuggestion,
        studentGuide: '',
        groupingType,
        memberCount,
        userComments
      });
      setCurrentStep(AppStep.ANALYSIS);
    } catch (err: any) {
      setError(err.message || "Error en l'anàlisi inicial.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposals = async () => {
    if (!analysis?.improved || !selectedInstrument) {
      setError("Cal triar un instrument d'avaluació.");
      return;
    }
    setLoading(true);
    try {
      const result = await geminiService.proposeProducts(
        analysis.improved,
        selectedInstrument,
        groupingType,
        SAPhaseLabels[phase],
        selectedModel
      );
      setAnalysis({ ...analysis, productProposals: result.proposals, selectedInstrumentName: selectedInstrument });
      setCurrentStep(AppStep.PRODUCT_SELECTION);
    } catch (err) {
      setError("Error generant propostes de lliurament.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product: ProductProposal) => {
    if (!analysis?.improved) return;
    setLoading(true);
    try {
      const guide = await geminiService.generateStudentGuide(
        analysis.improved,
        product,
        groupingType,
        memberCount,
        userComments,
        selectedInstrument,
        selectedModel
      );
      const evalText = await geminiService.generateEvaluationFull(guide, selectedInstrument, selectedModel);
      const summary = await geminiService.generateSummary(guide, selectedModel);
      
      setAnalysis({ 
        ...analysis, 
        selectedProduct: product,
        studentGuide: guide, 
        evaluationInstrument: evalText,
        summaryTable: summary,
        groupingType,
        memberCount,
        userComments
      });
      setCurrentStep(AppStep.STUDENT_GUIDE);
    } catch (err) {
      setError("Error generant la fitxa operativa final.");
    } finally {
      setLoading(false);
    }
  };

  const renderUpload = () => (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Proposta Educativa</h2>
        <p className="text-slate-500 font-medium">Defineix l'essència de la teva Situació d'Aprenentatge</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <section className="space-y-4">
            <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-1">Contingut de la SA</label>
            <div className="relative group">
              <textarea 
                className="w-full h-80 p-8 text-sm bg-slate-50 border-4 border-slate-100 rounded-[35px] focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-700"
                value={fileContent} 
                onChange={e => setFileContent(e.target.value)} 
                placeholder="Explica la teva idea, unitat o activitat inicial..." 
              />
              <div className="absolute bottom-6 right-6 flex gap-3">
                 {!selectedFile ? (
                   <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 px-6 py-3 rounded-2xl text-white hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                    <span>Adjuntar Arxiu</span>
                   </button>
                 ) : (
                   <div className="flex gap-2">
                      <div className="bg-indigo-50 px-6 py-3 rounded-2xl border-2 border-indigo-200 text-indigo-700 text-xs font-black truncate max-w-[250px]">
                        {selectedFile.name}
                      </div>
                      <button onClick={removeFile} className="bg-rose-500 p-3 rounded-2xl text-white hover:bg-rose-600 transition-all shadow-lg">
                        🗑️ Eliminar
                      </button>
                   </div>
                 )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.md,.txt" />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-50 p-8 rounded-[35px] border-2 border-slate-100 space-y-6">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Configuració IA</h4>
             <div className="space-y-4">
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700">
                    <option value="gemini-3-flash-preview">⚡ Flash</option>
                    <option value="gemini-3-pro-preview">💎 Pro</option>
                </select>
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-black text-slate-400">
                     <span>SOBRI</span><span>CREATIU</span>
                   </div>
                   <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest block text-center">Fase de l'aprenentatge</label>
             <div className="flex flex-col gap-2">
                {Object.entries(SAPhaseLabels).map(([k, v]) => (
                  <button key={k} onClick={() => setPhase(k as SAPhase)} className={`p-4 text-left text-[10px] font-black rounded-2xl border-2 transition-all ${phase === k ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}>
                    {v}
                  </button>
                ))}
             </div>
          </section>
        </div>
      </div>

      <button disabled={loading} onClick={handleStartAnalysis} className="w-full py-8 bg-indigo-600 text-white rounded-[35px] font-black text-2xl shadow-2xl hover:bg-indigo-700 transform active:scale-95 transition-all">
        {loading ? 'PROCESSANT...' : 'GENERAR MILLORA I CONFIGURAR 🚀'}
      </button>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl border-4 border-indigo-500">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300 mb-4">🧠 Rigor Acadèmic: Millora de la Proposta</h3>
        <p className="text-xl font-medium leading-relaxed italic text-slate-100 border-l-4 border-indigo-500 pl-8">{analysis?.improvementSuggestion}</p>
      </div>

      <div className="bg-white rounded-[50px] shadow-sm border-2 border-slate-100 p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-10">
            <div className="space-y-6">
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block border-b-4 border-indigo-50 pb-3">Agrupament i Logística</label>
              <div className="flex gap-4">
                {[GroupingType.INDIVIDUAL, GroupingType.GRUP].map(type => (
                  <button key={type} onClick={() => setGroupingType(type)} className={`flex-1 py-5 px-6 rounded-3xl font-black text-xs border-4 transition-all ${groupingType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-300 border-slate-50'}`}>
                    {type}
                  </button>
                ))}
              </div>
              {groupingType === GroupingType.GRUP && (
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 animate-in zoom-in-95">
                  <label className="text-[10px] font-black text-slate-400 block mb-4">Membres per equip:</label>
                  <input type="range" min="2" max="10" value={memberCount} onChange={e => setMemberCount(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                  <div className="text-center font-black text-indigo-600 mt-2">{memberCount} membres</div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block border-b-4 border-indigo-50 pb-3">Observacions Docents</label>
              <textarea value={userComments} onChange={e => setUserComments(e.target.value)} placeholder="Matisos personals..." className="w-full h-40 p-6 text-sm bg-slate-50 border-4 border-slate-50 rounded-[35px] outline-none shadow-inner" />
            </div>
          </section>

          <section className="space-y-8">
             <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block border-b-4 border-indigo-50 pb-3">Instrument d'Avaluació (Decisiu)</label>
             <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                {EVALUATION_INSTRUMENTS.map((inst, i) => (
                  <button key={i} onClick={() => setSelectedInstrument(inst.name)} className={`p-4 text-left border-4 rounded-2xl transition-all ${selectedInstrument === inst.name ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-slate-50 hover:border-indigo-200'}`}>
                    <h5 className="font-black text-[11px] uppercase">{inst.name}</h5>
                    <p className={`text-[9px] leading-tight ${selectedInstrument === inst.name ? 'text-indigo-100' : 'text-slate-400'}`}>{inst.desc}</p>
                  </button>
                ))}
             </div>
          </section>
        </div>

        <button 
          disabled={loading || !selectedInstrument} 
          onClick={handleGenerateProposals} 
          className="w-full py-8 bg-indigo-600 text-white rounded-[40px] font-black text-2xl shadow-2xl hover:bg-indigo-700 disabled:opacity-30 transform active:scale-95 transition-all"
        >
          {loading ? 'GENERANT PROPOSTES...' : 'VEURE PROPOSTES DE LLIURAMENT 🎯'}
        </button>
      </div>
    </div>
  );

  const renderProductSelection = () => (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Propostes de Producte Final</h2>
        <p className="text-slate-500 font-medium italic">Tria quina d'aquestes opcions s'ajusta millor a l'instrument: <strong>{selectedInstrument}</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {analysis?.productProposals?.map((product) => (
          <button 
            key={product.id}
            onClick={() => handleSelectProduct(product)}
            className="p-10 bg-white rounded-[50px] border-8 border-slate-50 hover:border-indigo-500 hover:shadow-2xl transition-all text-left space-y-6 group transform hover:-translate-y-2"
          >
            <div className="h-16 w-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">✨</div>
            <h4 className="text-xl font-black text-slate-800 uppercase leading-tight">{product.titol}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{product.descripcio}</p>
            <div className="pt-4 text-xs font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-2 transition-transform">Triar aquest →</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStudentGuide = () => (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-40">
      <div className="bg-amber-400 text-amber-950 p-12 rounded-[50px] shadow-2xl border-b-[12px] border-amber-600 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <span className="text-7xl">📋</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-60 mb-2">Guia de Treball de l'Alumne</h3>
            <p className="font-black text-4xl uppercase tracking-tighter leading-none">{analysis?.selectedProduct?.titol}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-[60px] shadow-2xl border-4 border-slate-50 p-16 prose prose-indigo max-w-none prose-headings:font-black prose-p:text-slate-700 prose-p:text-lg">
        <div className="whitespace-pre-wrap leading-relaxed font-medium">
          {analysis?.studentGuide}
        </div>
      </div>

      <div className="bg-indigo-600 p-12 rounded-[60px] shadow-2xl border-b-[12px] border-indigo-800">
        <h3 className="text-3xl font-black text-white mb-6">📝 Instrument d'Avaluació: {analysis?.selectedInstrumentName}</h3>
        <div className="whitespace-pre-wrap text-lg text-white font-bold opacity-90 italic bg-indigo-500/30 p-8 rounded-3xl border-2 border-indigo-400/50">
          {analysis?.evaluationInstrument}
        </div>
      </div>

      <button onClick={() => setCurrentStep(AppStep.SUMMARY)} className="w-full py-8 bg-slate-900 text-white rounded-[45px] font-black text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-6">
        <span>VURE EL RESUM CURRICULAR FINAL</span>
        <span className="text-4xl">→</span>
      </button>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-12 pb-40 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-800 uppercase tracking-tighter">Resum Pedagògic Final</h2>
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xs">LOMLOE • Escola Nou Patufet</p>
      </div>

      <div className="bg-white rounded-[60px] shadow-2xl border-[6px] border-slate-50 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-12 py-8 text-left text-xs font-black uppercase tracking-widest w-1/4">Àmbit</th>
              <th className="px-12 py-8 text-left text-xs font-black uppercase tracking-widest">Detalls</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-slate-50">
            {/* Competències Específiques */}
            <tr>
              <td className="px-12 py-10 bg-slate-50 font-black text-xs text-slate-400 uppercase tracking-widest border-r-4 border-slate-50">Competències</td>
              <td className="px-12 py-10 space-y-4">
                {analysis?.summaryTable?.competencies.map((c, idx) => (
                  <div key={idx} className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
                    <span className="text-[10px] font-black text-indigo-600 uppercase">{c.code}</span>
                    <p className="text-slate-700 font-bold text-sm">{c.definition}</p>
                  </div>
                ))}
              </td>
            </tr>

            {/* Sabers Bàsics */}
            <tr>
              <td className="px-12 py-10 bg-slate-50 font-black text-xs text-slate-400 uppercase tracking-widest border-r-4 border-slate-50">Sabers</td>
              <td className="px-12 py-10">
                <div className="flex flex-wrap gap-2">
                  {analysis?.summaryTable?.sabers.map((s, idx) => (
                    <span key={idx} className="px-4 py-2 bg-sky-50 text-sky-800 text-[10px] font-black rounded-xl border-2 border-sky-100">{s}</span>
                  ))}
                </div>
              </td>
            </tr>

            {/* Eixos Escola */}
            <tr>
              <td className="px-12 py-10 bg-slate-50 font-black text-xs text-slate-400 uppercase tracking-widest border-r-4 border-slate-50">Eixos Escola (Destacats)</td>
              <td className="px-12 py-10">
                <div className="flex flex-wrap gap-4">
                  {analysis?.summaryTable?.eixosEscola.all.map((e, idx) => {
                    const isHighlighted = analysis?.summaryTable?.eixosEscola.highlighted.includes(e);
                    return (
                      <span key={idx} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border-4 transition-all ${isHighlighted ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl' : 'bg-slate-100 text-slate-300 border-slate-200 opacity-40'}`}>
                        {e}
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>

            {/* ODS */}
            <tr>
              <td className="px-12 py-10 bg-slate-50 font-black text-xs text-slate-400 uppercase tracking-widest border-r-4 border-slate-50">ODS (Destacats)</td>
              <td className="px-12 py-10">
                <div className="grid grid-cols-6 gap-2">
                  {analysis?.summaryTable?.ods.all.map((o, idx) => {
                    const isHighlighted = analysis?.summaryTable?.ods.highlighted.some(h => o.includes(h) || h.includes(o));
                    return (
                      <div key={idx} className={`p-2 rounded-xl text-[7px] font-black text-center border-2 ${isHighlighted ? 'bg-amber-500 text-white border-amber-600 shadow-xl scale-110' : 'bg-white text-slate-200 border-slate-100 opacity-30 grayscale'}`}>
                        {o}
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>

            {/* Competències ABP */}
            <tr>
              <td className="px-12 py-10 bg-slate-50 font-black text-xs text-slate-400 uppercase tracking-widest border-r-4 border-slate-50">ABP (Destacats)</td>
              <td className="px-12 py-10">
                <div className="flex flex-wrap gap-2">
                  {analysis?.summaryTable?.competenciesABP.all.map((c, idx) => {
                    const isHighlighted = analysis?.summaryTable?.competenciesABP.highlighted.includes(c);
                    return (
                      <span key={idx} className={`px-4 py-2 rounded-xl text-[9px] font-black border-2 ${isHighlighted ? 'bg-rose-600 text-white border-rose-500 shadow-xl' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'}`}>
                        {c}
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-center pt-10">
        <button onClick={() => window.location.reload()} className="px-16 py-8 bg-indigo-600 text-white rounded-[50px] font-black hover:bg-indigo-700 transition-all shadow-2xl text-2xl flex items-center gap-6">
          <span>🔄 COMENÇAR UNA NOVA UNITAT</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      <ProgressBar step={currentStep} />
      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {loading && (
          <div className="fixed inset-0 bg-indigo-900/30 backdrop-blur-2xl z-[100] flex items-center justify-center">
            <div className="bg-white p-16 rounded-[60px] shadow-2xl text-center space-y-8 max-w-md animate-in zoom-in-90 border-[12px] border-indigo-100">
              <div className="w-24 h-24 border-[12px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-lg">Processant el Disseny...</p>
            </div>
          </div>
        )}
        {error && <div className="bg-rose-50 text-rose-600 p-10 rounded-[40px] text-xs font-black mb-12 border-4 border-rose-100 text-center shadow-xl">{error}</div>}
        
        {currentStep === AppStep.UPLOAD && renderUpload()}
        {currentStep === AppStep.ANALYSIS && renderAnalysis()}
        {currentStep === AppStep.PRODUCT_SELECTION && renderProductSelection()}
        {currentStep === AppStep.STUDENT_GUIDE && renderStudentGuide()}
        {currentStep === AppStep.SUMMARY && renderSummary()}
      </main>

      {analysis?.studentGuide && (currentStep === AppStep.STUDENT_GUIDE) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t-4 border-slate-100 p-10 shadow-2xl z-40 flex justify-center gap-8 animate-in slide-in-from-bottom">
          <button onClick={() => navigator.clipboard.writeText(analysis.studentGuide)} className="px-12 py-5 bg-slate-900 text-white rounded-[25px] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl">
            📋 Copiar Fitxa
          </button>
          <button className="px-12 py-5 bg-indigo-600 text-white rounded-[25px] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl">
            📥 Descarregar Fitxa
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
