import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Aperture, Droplet, Sliders, ChevronRight, CheckCircle, XCircle, 
  BookOpen, Award, PlayCircle, MessageCircle, Send, Sparkles, Loader2, 
  Bot, Settings, HelpCircle, BarChart, Zap, Triangle, Touchpad, 
  AlertTriangle, RotateCcw, Globe, RefreshCw, Layout, Image as ImageIcon, 
  Lightbulb, Palette, X, WifiOff, Download, TrendingUp, Share2, Clipboard, Camera,
  Layers, Crop, Save, ScanFace 
} from 'lucide-react';

// ==========================================
// 1. GEMINI API CONFIGURATION
// ==========================================
// ចំណាំ៖ សម្រាប់ Vercel សូមប្រើ import.meta.env.VITE_GEMINI_API_KEY
// ដើម្បីការពារកំហុសក្នុង Preview យើងប្រើពាក្យបន្លំប្រសិនបើគ្មាន Key
const apiKey = ""; 

const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
  };

  const backoff = (ms) => new Promise(res => setTimeout(res, ms));

  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonMode && text) {
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
        }
        return text;
      }
    } catch (e) {}
    await backoff(Math.pow(2, i) * 1000);
  }
  return null;
};

// ==========================================
// 2. DATA
// ==========================================

const lessonsData = [
  {
    id: 'light',
    title: 'ពន្លឺ (Light)',
    icon: <Sun className="w-5 h-5 text-amber-400" />,
    description: 'រៀនអំពីការកែសម្រួលពន្លឺនៅក្នុងរូបភាពរបស់អ្នក។',
    content: [
      { tool: 'Exposure', khmer: 'ការប៉ះពន្លឺ', desc: 'កំណត់ពន្លឺរួមនៃរូបភាពទាំងមូល។ បង្កើន (+) ដើម្បីឱ្យភ្លឺ និងបន្ថយ (-) ដើម្បីឱ្យងងឹត។', tip: 'កែវាមុនគេបង្អស់ ដើម្បីឱ្យឃើញរូបភាពច្បាស់សិន។' },
      { tool: 'Contrast', khmer: 'ភាពផ្ទុយ', desc: 'កំណត់ភាពខុសគ្នារវាងផ្នែកភ្លឺ និងផ្នែកងងឹត។ ខ្ពស់ធ្វើឱ្យរូបដិត និងមានជម្រៅ។', tip: 'កុំដាក់ខ្លាំងពេកលើស +40 ព្រោះវាធ្វើឱ្យរូបមើលទៅរឹង។' },
      { tool: 'Highlights', khmer: 'ផ្នែកភ្លឺ', desc: 'គ្រប់គ្រងតែតំបន់ដែលមានពន្លឺខ្លាំងបំផុត។ បន្ថយវាជួយសង្គ្រោះព័ត៌មានដែលបាត់ដោយសារពន្លឺចាំង។', tip: 'បន្ថយដើម្បីសង្គ្រោះពន្លឺមេឃឱ្យឃើញពពកវិញ។' },
      { tool: 'Shadows', khmer: 'ផ្នែកងងឹត', desc: 'គ្រប់គ្រងតែតំបន់ដែលមានស្រមោល។ ការតម្លើងវាជួយឱ្យឃើញព័ត៌មានក្នុងកន្លែងងងឹត។', tip: 'តម្លើងសម្រាប់រូបថតដែលមានមុខមនុស្សងងឹតខ្លាំង។' }
    ]
  },
  {
    id: 'color',
    title: 'ពណ៌ (Color)',
    icon: <Droplet className="w-5 h-5 text-cyan-400" />,
    description: 'ធ្វើឱ្យពណ៌មានភាពរស់រវើកនិងកែសម្រួលសីតុណ្ហភាព។',
    content: [
      { tool: 'Temp', khmer: 'សីតុណ្ហភាព', desc: 'កំណត់សីតុណ្ហភាពពណ៌៖ លឿង (Warm) ឬខៀវ (Cool)។', tip: 'ថតពេលថ្ងៃលិច តម្លើងទៅលឿង។' },
      { tool: 'Vibrance', khmer: 'ភាពរស់រវើក', desc: 'បង្កើនពណ៌ដែលស្លេក ដោយមិនធ្វើឱ្យពណ៌ស្បែកខូច។', tip: 'តែងតែប្រើវាជំនួស Saturation សម្រាប់រូបថតមនុស្ស។' }
    ]
  }
];

const initialQuestionBank = [
  {
    id: 1,
    question: "តើឧបករណ៍មួយណាសម្រាប់កែពន្លឺទូទៅនៃរូបភាព?",
    options: ["Contrast", "Exposure", "Highlights", "Shadows"],
    correct: 1
  },
  {
    id: 2,
    question: "ដើម្បីឱ្យផ្ទៃមុខមនុស្សម៉ត់រលោង តើគួរធ្វើដូចម្តេច?",
    options: ["តម្លើង Texture", "បន្ថយ Texture", "តម្លើង Clarity", "បន្ថយ Exposure"],
    correct: 1
  }
];

// --- COMPONENTS ---

const CurveVisualizer = ({ type }) => {
  const getPath = () => {
    const t = (type || "").toLowerCase();
    if (t.includes("s-curve")) return "M 0 100 C 25 100, 25 75, 50 50 C 75 25, 75 0, 100 0";
    if (t.includes("matte")) return "M 0 80 C 25 80, 25 75, 50 50 C 75 25, 75 0, 100 0";
    return "M 0 100 L 100 0";
  };
  return (
    <div className="relative w-full aspect-square bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20">
        {[25, 50, 75].map(i => <React.Fragment key={i}><line x1={i} y1="0" x2={i} y2="100" stroke="white" strokeWidth="0.5" /><line x1="0" y1={i} x2="100" y2={i} stroke="white" strokeWidth="0.5" /></React.Fragment>)}
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d={getPath()} stroke="#60a5fa" strokeWidth="3" fill="none" />
      </svg>
    </div>
  );
};

const ColorWheel = ({ h, s, l, label }) => {
  const radians = (h - 90) * (Math.PI / 180);
  const dist = s / 2.5;
  const x = 50 + dist * Math.cos(radians);
  const y = 50 + dist * Math.sin(radians);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] opacity-80 border border-slate-700">
        <div className="absolute w-2 h-2 bg-white rounded-full border border-black" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} />
      </div>
      <span className="text-[10px] text-slate-400 mt-1 font-khmer">{label}</span>
    </div>
  );
};

const LessonModal = ({ lesson, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-2xl bg-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-700">
        <h2 className="text-xl font-bold font-khmer text-white">{lesson.title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><X /></button>
      </div>
      <div className="overflow-y-auto p-4 space-y-4">
        {lesson.content.map((item, idx) => (
          <div key={idx} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-blue-400 text-lg">{item.tool}</span>
              <span className="text-xs font-bold bg-slate-900 text-slate-300 px-2 py-1 rounded font-khmer border border-slate-600">{item.khmer}</span>
            </div>
            <p className="text-slate-200 text-sm font-khmer">{item.desc}</p>
            {item.tip && <div className="mt-3 pt-3 border-t border-slate-600 text-yellow-400 text-sm font-khmer italic">💡 គន្លឹះ: {item.tip}</div>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PresetGenerator = () => {
  const [style, setStyle] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (s) => {
    const target = s || style;
    if (!target) return;
    setLoading(true);
    const prompt = `Create a Lightroom preset JSON for "${target}" style. Format: { "basic": { "Exposure": 0, "Contrast": 0, "Highlights": 0, "Shadows": 0, "Temp": 0, "Tint": 0, "Vibrance": 0 }, "curve": "S-Curve", "grading": { "Shadows": {"h":0,"s":0,"l":0}, "Midtones": {"h":0,"s":0,"l":0}, "Highlights": {"h":0,"s":0,"l":0} } }`;
    const data = await callGemini(prompt, "Expert photo editor.", true);
    setRecipe(data);
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl max-w-3xl mx-auto space-y-6">
      <div className="flex gap-2">
        <input value={style} onChange={e => setStyle(e.target.value)} placeholder="បញ្ចូលរចនាប័ទ្ម (ឧ. Vintage, Teal)..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-khmer text-sm" />
        <button onClick={() => generate()} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-khmer transition-all">
          {loading ? <Loader2 className="animate-spin" /> : 'បង្កើត ✨'}
        </button>
      </div>
      
      {recipe && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl">
            <h4 className="text-blue-400 font-bold font-khmer flex items-center gap-2"><Sun size={16}/> Basic Settings</h4>
            {Object.entries(recipe.basic).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs font-mono text-slate-300">
                <span>{k}</span>
                <span className={v > 0 ? 'text-green-400' : 'text-red-400'}>{v > 0 ? `+${v}` : v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl flex flex-col items-center">
            <h4 className="text-purple-400 font-bold font-khmer flex items-center gap-2 self-start"><TrendingUp size={16}/> Tone Curve</h4>
            <CurveVisualizer type={recipe.curve} />
            <div className="flex gap-4 mt-2">
              <ColorWheel h={recipe.grading.Shadows.h} s={recipe.grading.Shadows.s} l={recipe.grading.Shadows.l} label="Shadows" />
              <ColorWheel h={recipe.grading.Midtones.h} s={recipe.grading.Midtones.s} l={recipe.grading.Midtones.l} label="Midtones" />
              <ColorWheel h={recipe.grading.Highlights.h} s={recipe.grading.Highlights.s} l={recipe.grading.Highlights.l} label="Highlights" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Quiz = () => {
  const [step, setStep] = useState('menu');
  const [curr, setCurr] = useState(0);
  const [score, setScore] = useState(0);
  const [ans, setAns] = useState(null);

  const q = initialQuestionBank[curr];

  const handle = (i) => {
    if (ans !== null) return;
    setAns(i);
    if (i === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (curr + 1 < initialQuestionBank.length) { setCurr(c => c + 1); setAns(null); }
    else setStep('end');
  };

  if (step === 'menu') return (
    <div className="bg-slate-800 p-8 rounded-2xl text-center border border-slate-700 max-w-md mx-auto">
      <Award className="w-16 h-16 text-blue-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white font-khmer mb-6">តេស្តសមត្ថភាព Lightroom</h2>
      <button onClick={() => setStep('play')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-khmer transition-all">ចាប់ផ្ដើម</button>
    </div>
  );

  if (step === 'end') return (
    <div className="bg-slate-800 p-8 rounded-2xl text-center border border-slate-700 max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-white font-khmer mb-2">ជោគជ័យ!</h2>
      <p className="text-slate-400 font-khmer mb-6">ពិន្ទុរបស់អ្នក: {score} / {initialQuestionBank.length}</p>
      <button onClick={() => {setStep('menu'); setCurr(0); setScore(0);}} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-khmer">ត្រឡប់ទៅដើម</button>
    </div>
  );

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-xl mx-auto space-y-6">
      <div className="text-blue-400 font-bold">សំណួរ {curr + 1}/{initialQuestionBank.length}</div>
      <h3 className="text-xl font-bold text-white font-khmer leading-relaxed">{q.question}</h3>
      <div className="grid gap-3">
        {q.options.map((o, i) => (
          <button key={i} onClick={() => handle(i)} className={`p-4 text-left rounded-xl border transition-all font-khmer text-sm ${ans === null ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : (i === q.correct ? 'bg-green-600/20 border-green-500 text-green-300' : (i === ans ? 'bg-red-600/20 border-red-500 text-red-300' : 'bg-slate-900 border-slate-800 opacity-50'))}`}>
            {o}
          </button>
        ))}
      </div>
      {ans !== null && <button onClick={next} className="w-full py-3 bg-blue-600 text-white rounded-xl font-khmer">បន្ទាប់</button>}
    </div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState([{ role: 'model', text: 'សួស្ដី! ខ្ញុំជាគ្រូជំនួយ AI។ អ្នកអាចសួរខ្ញុំអំពីរបៀបកែរូបបាន។' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    const reply = await callGemini(msg, "Lightroom expert speaking Khmer.");
    setMessages(prev => [...prev, { role: 'model', text: reply || "សុំទោស ខ្ញុំមិនទាន់អាចឆ្លើយបានទេក្នុងពេលនេះ។" }]);
    setLoading(false);
  };

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex flex-col h-[500px] max-w-2xl mx-auto">
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex items-center gap-3">
        <Bot className="text-blue-400" />
        <h3 className="font-bold text-white font-khmer text-sm">គ្រូជំនួយ AI</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[85%] text-sm font-khmer leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="p-3 bg-slate-800 rounded-xl inline-block border border-slate-700"><Loader2 className="animate-spin text-blue-400" size={16}/></div>}
        <div ref={endRef} />
      </div>
      <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="សួរអ្វីមួយ..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-khmer" />
        <button onClick={send} className="bg-blue-600 p-2.5 rounded-xl text-white"><Send size={18}/></button>
      </div>
    </div>
  );
};

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  const [tab, setTab] = useState('learn');
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 md:pb-0">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; }`}</style>
      
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab('learn')}>
            <ImageIcon className="text-blue-500" />
            <h1 className="text-lg font-bold font-khmer tracking-tight">Lightroom <span className="text-blue-400">Khmer</span></h1>
          </div>
          <nav className="hidden md:flex gap-1 bg-slate-800 p-1 rounded-full border border-slate-700">
            {['learn', 'quiz', 'preset', 'ai'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-xs font-khmer transition-all ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'preset' ? 'បង្កើតរូបមន្ត' : 'គ្រូ AI'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {expanded && <LessonModal lesson={lessonsData.find(l => l.id === expanded)} onClose={() => setExpanded(null)} />}

      <main className="max-w-5xl mx-auto p-4 pt-8 md:p-8">
        {tab === 'learn' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessonsData.map(l => (
              <button key={l.id} onClick={() => setExpanded(l.id)} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-left hover:border-blue-500/50 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-800 p-3 rounded-xl">{l.icon}</div>
                  <div><h3 className="font-bold text-white font-khmer">{l.title}</h3><p className="text-slate-400 text-xs font-khmer">{l.description}</p></div>
                </div>
                <ChevronRight className="text-slate-600 group-hover:text-blue-400" />
              </button>
            ))}
          </div>
        )}

        {tab === 'quiz' && <Quiz />}
        {tab === 'preset' && <PresetGenerator />}
        {tab === 'ai' && <ChatBot />}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 flex justify-around p-3">
        {['learn', 'quiz', 'preset', 'ai'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex flex-col items-center gap-1 ${tab === t ? 'text-blue-400' : 'text-slate-500'}`}>
            {t === 'learn' ? <BookOpen size={20}/> : t === 'quiz' ? <Award size={20}/> : t === 'preset' ? <Sliders size={20}/> : <Bot size={20}/>}
            <span className="text-[10px] font-khmer">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'preset' ? 'រូបមន្ត' : 'AI'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}