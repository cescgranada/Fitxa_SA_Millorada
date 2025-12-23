
import React, { useState, useRef, useMemo } from 'react';
import { SAPhase, AppStep, PedagogicalAnalysis, SAPhaseLabels, EVALUATION_INSTRUMENTS, GroupingType, OUTPUT_FORMATS } from './types';
import * as geminiService from './geminiService';

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold text-xl">NP</div>
      <div>
        <h1 className="text-lg font-bold text-slate-800 leading-tight">Disseny Instruccional</h1>
        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Guia de Treball • Escola Nou Patufet</p>
      </div>
    </div>
  </header>
);

const ProgressBar: React.FC<{ step: AppStep }> = ({ step }) => {
  const steps = [
    { id: 1, label: '📂 Proposta' },
    { id: 2, label: '🧠 Millora i Config' },
    { id: 3, label: '📋 Guia Alumne' },
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

  const handleGenerateGuide = async (outputFormat: string) => {
    if (!analysis?.improved) return;
    setLoading(true);
    try {
      const guide = await geminiService.generateStudentGuide(
        analysis.improved,
        outputFormat,
        groupingType,
        memberCount,
        userComments,
        selectedModel
      );
      setAnalysis({ ...analysis, selectedOutput: outputFormat, studentGuide: guide, groupingType, memberCount, userComments });
      setCurrentStep(AppStep.STUDENT_GUIDE);
    } catch (err) {
      setError("Error generant la fitxa operativa de l'alumne.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstrument = async (inst: string) => {
    if (!analysis) return;
    setLoading(true);
    try {
      const evalText = await geminiService.generateEvaluation(analysis.studentGuide, inst, selectedModel);
      const summary = await geminiService.generateSummary(analysis.studentGuide, selectedModel);
      setAnalysis({ ...analysis, evaluationInstrument: evalText, selectedInstrumentName: inst, summaryTable: summary });
      setCurrentStep(AppStep.SUMMARY);
    } catch (err) {
      setError("Error en l'avaluació.");
    } finally {
      setLoading(false);
    }
  };

  const renderUpload = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Proposta Educativa</h2>
        <p className="text-slate-500 text-sm">Introdueix la informació bàsica per començar el procés</p>
      </div>

      <div className="space-y-6">
        <section>
          <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-3">1. Contingut Base (Text o Arxiu)</label>
          <textarea 
            className="w-full h-48 p-4 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all"
            value={fileContent} 
            onChange={e => setFileContent(e.target.value)} 
            placeholder="Enganxa aquí el contingut de la teva unitat, activitat o idea inicial..." 
          />
          <div className="flex justify-between items-center mt-2">
             <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-indigo-600 hover:underline">
              {selectedFile ? `✓ ${selectedFile.name}` : "📁 Carregar arxiu (PDF/Word/TXT)"}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.md,.txt" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-400">IA:</span>
               <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-[10px] font-bold bg-transparent border-none text-slate-500">
                  <option value="gemini-3-flash-preview">Flash (Ràpid)</option>
                  <option value="gemini-3-pro-preview">Pro (Intel·ligent)</option>
               </select>
            </div>
          </div>
        </section>

        <section>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">2. Fase de la Situació d'Aprenentatge</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(SAPhaseLabels).map(([k, v]) => (
              <button key={k} onClick={() => setPhase(k as SAPhase)} className={`p-3 text-[10px] font-black rounded-xl border-2 transition-all ${phase === k ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}>
                {v}
              </button>
            ))}
          </div>
        </section>
      </div>

      <button disabled={loading} onClick={handleStartAnalysis} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 disabled:opacity-50 transform active:scale-95 transition-all">
        {loading ? 'ANALITZANT PROPOSTA...' : 'CONTINUAR A LA MILLORA 🚀'}
      </button>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl border-4 border-indigo-500">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-300">Rigor Acadèmic: Proposta de Millora</h3>
        <p className="text-xl font-medium leading-relaxed italic">{analysis?.improvementSuggestion}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8 space-y-10">
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-800 leading-tight">{analysis?.improved?.titol}</h2>
          <div className="h-2 w-32 bg-indigo-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           {/* Column 1: Configura l'Agrupament */}
          <section className="space-y-6">
            <div>
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-3">A. Tipus d'Agrupament</label>
              <div className="flex gap-3">
                {[GroupingType.INDIVIDUAL, GroupingType.GRUP].map(type => (
                  <button 
                    key={type}
                    onClick={() => setGroupingType(type)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${groupingType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {groupingType === GroupingType.GRUP && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-2">Membres per grup:</label>
                  <input 
                    type="number" min="2" max="10" 
                    value={memberCount} 
                    onChange={e => setMemberCount(parseInt(e.target.value))}
                    className="w-20 p-2 border-2 border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-3">B. Comentaris o Matisos</label>
              <textarea 
                value={userComments}
                onChange={e => setUserComments(e.target.value)}
                placeholder="Ex: Enfoca-ho en la biodiversitat local, o fes-ho senzill per a 1r d'ESO..."
                className="w-full h-32 p-3 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </section>

          {/* Column 2: Objectius Millorats */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Objectius Millorats</h4>
            <ul className="space-y-3">
              {analysis?.improved?.objectius?.map((o, i) => (
                <li key={i} className="flex gap-4 items-start text-slate-700 font-medium text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">{i+1}</span>
                  {o}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="space-y-6 pt-10 border-t-2 border-slate-50">
          <div className="text-center space-y-2">
            <h4 className="text-xl font-black text-slate-800">C. Tria el teu Output (Missió Alumne)</h4>
            <p className="text-slate-500 text-sm font-medium italic">Aquest serà el producte que la Guia de Treball ajudarà a realitzar</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {OUTPUT_FORMATS.map((out) => (
              <button 
                key={out.id} 
                onClick={() => handleGenerateGuide(out.label)}
                className="group p-6 bg-white border-4 border-slate-100 rounded-3xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center space-y-3 transform hover:-translate-y-1 active:scale-95"
              >
                <span className="text-4xl block group-hover:scale-125 transition-transform">{out.icon}</span>
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-700">{out.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderStudentGuide = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
      <div className="bg-amber-500 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between border-4 border-amber-300">
        <div className="flex items-center gap-6">
          <span className="text-5xl">📋</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Guia de Treball Operativa</h3>
            <p className="font-black text-2xl uppercase tracking-tight">Objectiu: {analysis?.selectedOutput}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-10 prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:font-medium">
        <div className="bg-slate-50 p-4 rounded-xl mb-8 flex gap-6 text-xs font-black text-slate-500 border border-slate-200 uppercase tracking-widest">
          <span className="flex items-center gap-2">👥 {groupingType} {groupingType === GroupingType.GRUP ? `(${memberCount} persones)` : ''}</span>
          <span className="flex items-center gap-2">📅 Fase: {SAPhaseLabels[phase]}</span>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">
          {analysis?.studentGuide}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button onClick={() => setCurrentStep(AppStep.EVALUATION_SELECT)} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-2xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group">
          <span>DISSENYAR L'AVALUACIÓ</span>
          <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
        </button>
      </div>
    </div>
  );

  const renderEvaluationSelect = () => (
    <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-10 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800">Avaluació de la Missió</h2>
        <p className="text-slate-500 font-medium">Tria l'instrument que avaluarà l'output: {analysis?.selectedOutput}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
        {EVALUATION_INSTRUMENTS.map((inst, i) => (
          <button key={i} onClick={() => handleSelectInstrument(inst.name)} className="p-6 text-left border-4 border-slate-50 bg-slate-50/50 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
            <h5 className="font-black text-slate-800 group-hover:text-indigo-600 mb-2">{inst.name}</h5>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{inst.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-8 py-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em]">📊 Marc Curricular LOMLOE (Sinteis)</h3>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 gap-6">
            {[
              { label: 'Competències Específiques', val: analysis?.summaryTable?.competencies, color: 'indigo' },
              { label: 'Sabers Bàsics', val: analysis?.summaryTable?.sabers, color: 'amber' },
              { label: 'ODS Relacionats', val: analysis?.summaryTable?.ods, color: 'emerald' },
              { label: 'Competències ABP', val: analysis?.summaryTable?.competenciesABP, color: 'rose' },
            ].map((row, i) => (
              <div key={i} className="space-y-2">
                <span className={`text-[10px] font-black uppercase tracking-widest text-${row.color}-600`}>{row.label}</span>
                <div className="flex flex-wrap gap-2">
                  {row.val?.map((v, idx) => (
                    <span key={idx} className={`px-3 py-1 bg-${row.color}-50 text-${row.color}-700 text-xs font-bold rounded-lg border border-${row.color}-100`}>{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 p-10 rounded-3xl shadow-xl">
        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <span className="text-indigo-600">📝</span> {analysis?.selectedInstrumentName}
        </h3>
        <div className="whitespace-pre-wrap text-slate-600 font-medium leading-relaxed">
          {analysis?.evaluationInstrument}
        </div>
      </div>
      
      <button onClick={() => window.location.reload()} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl text-xl">
        🔄 COMENÇAR DE NOU
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      <ProgressBar step={currentStep} />
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {loading && (
          <div className="fixed inset-0 bg-indigo-900/10 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center space-y-6 max-w-xs animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="space-y-2">
                <p className="text-indigo-600 font-black uppercase tracking-widest text-sm">Dissenyant la Missió</p>
                <p className="text-slate-400 text-[10px] font-bold">L'IA tradueix la teva proposta en una guia operativa per a l'alumne...</p>
              </div>
            </div>
          </div>
        )}
        {error && <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl text-xs font-black mb-8 border-2 border-rose-100 uppercase tracking-widest animate-shake">{error}</div>}
        
        {currentStep === AppStep.UPLOAD && renderUpload()}
        {currentStep === AppStep.ANALYSIS && renderAnalysis()}
        {currentStep === AppStep.STUDENT_GUIDE && renderStudentGuide()}
        {currentStep === AppStep.EVALUATION_SELECT && renderEvaluationSelect()}
        {currentStep === AppStep.SUMMARY && renderSummary()}
      </main>

      {/* Download bar only visible in final steps */}
      {analysis?.studentGuide && (currentStep === AppStep.STUDENT_GUIDE || currentStep === AppStep.SUMMARY) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-6 shadow-2xl z-40 flex justify-center gap-6 animate-in slide-in-from-bottom duration-500">
          <button onClick={() => navigator.clipboard.writeText(analysis.studentGuide)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3">
            <span>📋 Copiar Guia</span>
          </button>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
            📥 Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
