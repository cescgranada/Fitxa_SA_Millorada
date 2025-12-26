
import React, { useState, useRef, useEffect } from 'react';
import { SAPhase, AppStep, PedagogicalAnalysis, SAPhaseLabels, EVALUATION_INSTRUMENTS, GroupingType, OUTPUT_FORMATS } from './types';
import * as geminiService from './geminiService';

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold text-xl shadow-sm">NP</div>
      <div>
        <h1 className="text-lg font-bold text-slate-800 leading-tight">Disseny Instruccional</h1>
        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Escola Nou Patufet</p>
      </div>
    </div>
  </header>
);

const ProgressBar: React.FC<{ step: AppStep }> = ({ step }) => {
  const steps = [
    { id: 1, label: '📂 Proposta' },
    { id: 2, label: '🧠 Millora i Config' },
    { id: 3, label: '📋 Guia Alumne' },
    { id: 4, label: '📊 Resum Final' },
  ];
  return (
    <div className="w-full bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2 flex-1 relative">
            <div className={`h-2 w-full rounded-full transition-all duration-700 ${step >= s.id ? 'bg-indigo-600' : 'bg-slate-100'}`} />
            <span className={`text-[10px] font-black uppercase tracking-tighter ${step === s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
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
  const [selectedOutput, setSelectedOutput] = useState<string>('');
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

  const handleGenerateFinalGuide = async () => {
    if (!analysis?.improved || !selectedOutput || !selectedInstrument) {
      setError("Cal triar un Output i un Instrument d'Avaluació.");
      return;
    }
    setLoading(true);
    try {
      const guide = await geminiService.generateStudentGuide(
        analysis.improved,
        selectedOutput,
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
        selectedOutput, 
        selectedInstrumentName: selectedInstrument, 
        studentGuide: guide, 
        evaluationInstrument: evalText,
        summaryTable: summary,
        groupingType,
        memberCount,
        userComments
      });
      setCurrentStep(AppStep.STUDENT_GUIDE);
    } catch (err) {
      setError("Error generant la fitxa de l'alumne.");
    } finally {
      setLoading(false);
    }
  };

  const renderUpload = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Proposta Educativa</h2>
        <p className="text-slate-500 font-medium">Defineix les bases del teu projecte</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-3">1. Contingut de la Proposta</label>
            <div className="relative group">
              <textarea 
                className="w-full h-64 p-6 text-sm bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none shadow-inner"
                value={fileContent} 
                onChange={e => setFileContent(e.target.value)} 
                placeholder="Explica breument la teva unitat, activitat o idea inicial..." 
              />
              <div className="absolute top-4 right-4 flex gap-2">
                 {!selectedFile ? (
                   <button onClick={() => fileInputRef.current?.click()} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm flex items-center gap-2 text-[10px] font-bold">
                    <span>📁 Adjuntar</span>
                   </button>
                 ) : (
                   <div className="flex gap-1">
                      <div className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center truncate max-w-[150px]">
                        {selectedFile.name}
                      </div>
                      <button onClick={removeFile} className="bg-white p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all shadow-sm">
                        🗑️
                      </button>
                   </div>
                 )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.md,.txt" />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuració IA</h4>
             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 block">Model Intel·ligència</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="gemini-3-flash-preview">Gemini 3 Flash (Ràpid)</option>
                    <option value="gemini-3-pro-preview">Gemini 3 Pro (Avançat)</option>
                    <option value="gemini-flash-lite-latest">Gemini Flash Lite</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-600">Creativitat</label>
                    <span className="text-[10px] font-black text-indigo-600">{temperature}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>
             </div>
          </section>

          <section className="space-y-3">
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">2. Fase de l'aprenentatge</label>
             <div className="flex flex-col gap-2">
                {Object.entries(SAPhaseLabels).map(([k, v]) => (
                  <button key={k} onClick={() => setPhase(k as SAPhase)} className={`p-4 text-left text-[10px] font-black rounded-2xl border-2 transition-all ${phase === k ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}>
                    {v}
                  </button>
                ))}
             </div>
          </section>
        </div>
      </div>

      <button disabled={loading} onClick={handleStartAnalysis} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-indigo-700 disabled:opacity-50 transform active:scale-95 transition-all flex items-center justify-center gap-4">
        {loading ? 'PROCESSANT...' : 'GENERAR MILLORA I CONFIGURAR 🚀'}
      </button>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border-4 border-indigo-500">
        <div className="flex items-center gap-4 mb-4">
          <span className="bg-indigo-500 p-2 rounded-xl text-2xl">🧠</span>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Rigor Acadèmic: Proposta de Millora</h3>
        </div>
        <p className="text-xl font-medium leading-relaxed italic text-slate-100">{analysis?.improvementSuggestion}</p>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border-2 border-slate-100 p-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-8">
            <div className="space-y-6">
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block border-b-2 border-indigo-50 pb-2">Logística del Treball</label>
              <div className="flex gap-4">
                {[GroupingType.INDIVIDUAL, GroupingType.GRUP].map(type => (
                  <button key={type} onClick={() => setGroupingType(type)} className={`flex-1 py-4 px-4 rounded-2xl font-black text-xs border-2 transition-all ${groupingType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}>
                    {type === GroupingType.INDIVIDUAL ? '👤 Individual' : '👥 En Grup'}
                  </button>
                ))}
              </div>
              {groupingType === GroupingType.GRUP && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Membres per equip:</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="2" max="10" value={memberCount} onChange={e => setMemberCount(parseInt(e.target.value))} className="flex-1 accent-indigo-600" />
                    <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm">{memberCount}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block border-b-2 border-indigo-50 pb-2">Comentaris del Docent</label>
              <textarea value={userComments} onChange={e => setUserComments(e.target.value)} placeholder="Afegeix matisos, nivell d'ESO o qualsevol observació..." className="w-full h-32 p-4 text-sm bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none transition-all shadow-inner" />
            </div>
          </section>

          <section className="space-y-8">
             <div className="space-y-6">
               <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block border-b-2 border-indigo-50 pb-2">Instrument d'Avaluació</label>
               <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {EVALUATION_INSTRUMENTS.map((inst, i) => (
                    <button key={i} onClick={() => setSelectedInstrument(inst.name)} className={`p-4 text-left border-2 rounded-2xl transition-all group ${selectedInstrument === inst.name ? 'bg-indigo-600 border-indigo-600 shadow-lg' : 'bg-white border-slate-50 hover:border-indigo-200'}`}>
                      <h5 className={`font-black text-xs mb-1 ${selectedInstrument === inst.name ? 'text-white' : 'text-slate-800'}`}>{inst.name}</h5>
                      <p className={`text-[10px] leading-tight ${selectedInstrument === inst.name ? 'text-indigo-100' : 'text-slate-400'}`}>{inst.desc}</p>
                    </button>
                  ))}
               </div>
             </div>
          </section>
        </div>

        <section className="space-y-8 pt-10 border-t-2 border-slate-50">
          <div className="text-center space-y-2">
            <h4 className="text-2xl font-black text-slate-800">Tria l'Output Final (Missió Alumne)</h4>
            <p className="text-slate-500 font-medium italic">Aquest serà el producte que la Guia de Treball ajudarà a realitzar</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {OUTPUT_FORMATS.map((out) => (
              <button 
                key={out.id} 
                onClick={() => setSelectedOutput(out.label)}
                className={`group p-8 rounded-[40px] border-4 transition-all text-center space-y-4 transform hover:-translate-y-2 ${selectedOutput === out.label ? 'bg-indigo-50 border-indigo-600 shadow-2xl scale-105' : 'bg-white border-slate-50 hover:border-indigo-200 shadow-sm'}`}
              >
                <span className="text-5xl block transform group-hover:scale-110 transition-transform">{out.icon}</span>
                <span className={`text-xs font-black uppercase tracking-widest ${selectedOutput === out.label ? 'text-indigo-700' : 'text-slate-800'}`}>{out.label}</span>
              </button>
            ))}
          </div>
        </section>

        <button 
          disabled={loading || !selectedOutput || !selectedInstrument} 
          onClick={handleGenerateFinalGuide} 
          className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-indigo-700 disabled:opacity-30 transform active:scale-95 transition-all"
        >
          {loading ? 'GENERANT FITXA DE L\'ALUMNE...' : 'GENERAR GUIA DE TREBALL FINAL 🏁'}
        </button>
      </div>
    </div>
  );

  const renderStudentGuide = () => (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 pb-32">
      <div className="bg-amber-400 text-amber-950 p-10 rounded-[40px] shadow-2xl border-b-8 border-amber-600 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-6xl filter drop-shadow-lg">📋</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-2">Guia de Treball de l'Alumne</h3>
            <p className="font-black text-3xl uppercase tracking-tighter">Missió: {analysis?.selectedOutput}</p>
            <div className="mt-4 flex gap-4">
              <span className="px-4 py-1 bg-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest">{analysis?.groupingType}</span>
              <span className="px-4 py-1 bg-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest">Avaluació: {analysis?.selectedInstrumentName}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-[40px] shadow-2xl border-2 border-slate-50 p-12 prose prose-indigo max-w-none prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-li:font-semibold">
        <div className="whitespace-pre-wrap leading-relaxed">
          {analysis?.studentGuide}
        </div>
      </div>

      <div className="bg-indigo-50 p-10 rounded-[40px] border-4 border-indigo-100 shadow-lg">
        <h3 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-4">
          <span className="bg-indigo-600 p-2 rounded-xl text-white text-xl">📝</span> 
          Instrument: {analysis?.selectedInstrumentName}
        </h3>
        <div className="whitespace-pre-wrap text-sm text-indigo-800 leading-loose font-medium opacity-90 italic">
          {analysis?.evaluationInstrument}
        </div>
      </div>

      <button onClick={() => setCurrentStep(AppStep.SUMMARY)} className="w-full py-6 bg-slate-900 text-white rounded-[30px] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 group">
        <span>VURE EL RESUM CURRICULAR FINAL</span>
        <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
      </button>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Resum Pedagògic</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Marc Curricular LOMLOE • Escola Nou Patufet</p>
      </div>

      <div className="bg-white rounded-[50px] shadow-2xl border-4 border-slate-100 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-10 py-6 text-left text-xs font-black uppercase tracking-widest w-1/3">Àmbit</th>
              <th className="px-10 py-6 text-left text-xs font-black uppercase tracking-widest">Detalls Curriculars</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {[
              { label: 'Competències Específiques', val: analysis?.summaryTable?.competencies, color: 'indigo' },
              { label: 'Sabers Bàsics', val: analysis?.summaryTable?.sabers, color: 'sky' },
              { label: 'Eixos de l\'Escola (Màx 2)', val: analysis?.summaryTable?.eixosEscola, color: 'emerald' },
              { label: 'ODS (Màx 2)', val: analysis?.summaryTable?.ods, color: 'amber' },
              { label: 'Competències ABPxODS (Màx 2)', val: analysis?.summaryTable?.competenciesABP, color: 'rose' },
            ].map((row, i) => (
              <tr key={i} className="group hover:bg-slate-50 transition-colors">
                <td className="px-10 py-8 bg-slate-50 font-black text-xs text-slate-500 uppercase tracking-widest w-1/3 border-r-2 border-slate-100">
                  {row.label}
                </td>
                <td className="px-10 py-8">
                  <div className="flex flex-wrap gap-2">
                    {row.val && row.val.length > 0 ? row.val.map((v, idx) => (
                      <span key={idx} className={`px-4 py-2 bg-${row.color}-50 text-${row.color}-700 text-[10px] font-black rounded-2xl border-2 border-${row.color}-100 shadow-sm`}>
                        {v}
                      </span>
                    )) : (
                      <span className="text-slate-300 italic text-[10px] font-bold">No n'hi ha prou dades per aquest apartat.</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-center pt-10">
        <button onClick={() => window.location.reload()} className="px-12 py-6 bg-indigo-600 text-white rounded-[40px] font-black hover:bg-indigo-700 transition-all shadow-2xl text-xl flex items-center gap-4">
          <span>🔄 COMENÇAR UNA NOVA UNITAT</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      <ProgressBar step={currentStep} />
      <main className="max-w-5xl mx-auto p-4 md:p-10">
        {loading && (
          <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-xl z-[100] flex items-center justify-center">
            <div className="bg-white p-12 rounded-[50px] shadow-2xl text-center space-y-8 max-w-sm animate-in zoom-in-90 duration-300 border-8 border-indigo-100">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-4">
                <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-sm">Creant la Guia</p>
                <p className="text-slate-400 text-[10px] font-bold leading-relaxed px-4">Estem traduint la teva visió pedagògica en una fitxa operativa per a l'alumnat...</p>
              </div>
            </div>
          </div>
        )}
        {error && <div className="bg-rose-50 text-rose-600 p-8 rounded-[30px] text-xs font-black mb-10 border-4 border-rose-100 uppercase tracking-widest animate-shake text-center">{error}</div>}
        
        {currentStep === AppStep.UPLOAD && renderUpload()}
        {currentStep === AppStep.ANALYSIS && renderAnalysis()}
        {currentStep === AppStep.STUDENT_GUIDE && renderStudentGuide()}
        {currentStep === AppStep.SUMMARY && renderSummary()}
      </main>

      {analysis?.studentGuide && (currentStep === AppStep.STUDENT_GUIDE) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t-2 border-slate-100 p-8 shadow-2xl z-40 flex justify-center gap-6 animate-in slide-in-from-bottom duration-500">
          <button onClick={() => navigator.clipboard.writeText(analysis.studentGuide)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-4 shadow-xl">
            <span>📋 Copiar Fitxa</span>
          </button>
          <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-4 shadow-xl">
            📥 Descarregar PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
