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

// វិធីសាស្ត្រសុវត្ថិភាពដើម្បីការពារ Error ក្នុង Preview
let apiKey = ""; 
try {
  // ប្រសិនបើដំណើរការលើ Vercel វានឹងទៅយក Key ពី Environment Variables
  // @ts-ignore
  apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
} catch (e) {
  // ប្រសិនបើក្នុង Preview បរិស្ថានមិនស្គាល់ import.meta វានឹងមិនគាំងទេ
  apiKey = ""; 
}

const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (jsonMode && text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    }
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

// ==========================================
// 2. DATA (RESTORED FULL CONTENT)
// ==========================================

const lessonsData = [
  {
    id: 'light',
    title: 'ពន្លឺ (Light)',
    icon: <Sun className="w-5 h-5 text-amber-400" />,
    description: 'រៀនអំពីការកែសម្រួលពន្លឺនៅក្នុងរូបភាពរបស់អ្នក។',
    content: [
      { tool: 'Exposure', khmer: 'ការប៉ះពន្លឺ', desc: 'កំណត់ពន្លឺរួមនៃរូបភាពទាំងមូល។ បង្កើន (+) ដើម្បីឱ្យភ្លឺ និងបន្ថយ (-) ដើម្បីឱ្យងងឹត។', tip: 'កែវាមុនគេបង្អស់ ដើម្បីឱ្យឃើញរូបភាពច្បាស់សិន។' },
      { tool: 'Contrast', khmer: 'ភាពផ្ទុយ', desc: 'កំណត់ភាពខុសគ្នារវាងផ្នែកភ្លឺ និងផ្នែកងងឹត។ Contrast ខ្ពស់ធ្វើឱ្យរូបដិតច្បាស់ និងមានជម្រៅ។', tip: 'កុំដាក់ខ្លាំងពេកលើស +40 ព្រោះវាធ្វើឱ្យរូបមើលទៅរឹង។' },
      { tool: 'Highlights', khmer: 'ផ្នែកភ្លឺ', desc: 'គ្រប់គ្រងតែតំបន់ដែលមានពន្លឺខ្លាំងបំផុត។ បន្ថយវាជួយសង្គ្រោះព័ត៌មានដែលបាត់ដោយសារពន្លឺចាំង។', tip: 'បន្ថយដើម្បីសង្គ្រោះពន្លឺមេឃឱ្យឃើញពពកវិញ។' },
      { tool: 'Shadows', khmer: 'ផ្នែកងងឹត', desc: 'គ្រប់គ្រងតែតំបន់ដែលមានស្រមោល។ ការតម្លើងវាជួយឱ្យឃើញព័ត៌មានក្នុងកន្លែងងងឹត។', tip: 'តម្លើងសម្រាប់រូបថតដែលមានមុខមនុស្សងងឹតខ្លាំង។' },
      { tool: 'Whites', khmer: 'ពណ៌ស', desc: 'កំណត់ចំណុចពណ៌សដាច់ខាត។ បង្កើនវាដើម្បីឱ្យផ្នែកភ្លឺបំផុត ក្លាយជាពណ៌សសុទ្ធ។', tip: 'តម្លើងបន្តិច (+10 ទៅ +20) ដើម្បីឱ្យរូបមើលទៅភ្លឺថ្លា។' },
      { tool: 'Blacks', khmer: 'ពណ៌ខ្មៅ', desc: 'កំណត់ចំណុចពណ៌ខ្មៅដាច់ខាត។ បន្ថយវាដើម្បីឱ្យផ្នែកងងឹតបំផុត ក្លាយជាពណ៌ខ្មៅសុទ្ធ។', tip: 'បន្ថយបន្តិច (-10 ទៅ -20) ដើម្បីឱ្យរូបមានជម្រៅ និងពណ៌ដិតល្អ។' }
    ]
  },
  {
    id: 'color',
    title: 'ពណ៌ (Color)',
    icon: <Droplet className="w-5 h-5 text-cyan-400" />,
    description: 'ធ្វើឱ្យពណ៌មានភាពរស់រវើកនិងកែសម្រួលសីតុណ្ហភាព។',
    content: [
      { tool: 'Temp', khmer: 'សីតុណ្ហភាព', desc: 'កំណត់សីតុណ្ហភាពពណ៌៖ លឿង (Warm) ឬខៀវ (Cool)។', tip: 'ថតពេលថ្ងៃលិច តម្លើងទៅលឿង។' },
      { tool: 'Tint', khmer: 'ពណ៌លាំ', desc: 'កែតម្រូវពណ៌លាំរវាង បៃតង និង ស្វាយ (Magenta)។', tip: 'ប្រើសម្រាប់កែពណ៌ស្បែកដែលជាប់បៃតង។' },
      { tool: 'Vibrance', khmer: 'ភាពរស់រវើក', desc: 'បង្កើនពណ៌ដែលស្លេក ដោយមិនធ្វើឱ្យពណ៌ស្បែកខូចឡើយ។', tip: 'តែងតែប្រើវាជំនួស Saturation សម្រាប់រូបថតមនុស្ស។' },
      { tool: 'Saturation', khmer: 'កម្រិតពណ៌', desc: 'បង្កើនភាពដិតនៃពណ៌ទាំងអស់ស្មើៗគ្នា។ ការប្រើខ្លាំងពេកធ្វើឱ្យរូបមើលទៅមិនធម្មជាតិ។', tip: 'ប្រើតិចៗ (-10 ទៅ +10)។' }
    ]
  },
  {
    id: 'effects',
    title: 'បែបផែន (Effects)',
    icon: <Aperture className="w-5 h-5 text-purple-400" />,
    description: 'បន្ថែមភាពច្បាស់ និងវាយនភាពទៅកាន់រូបភាព។',
    content: [
      { tool: 'Texture', khmer: 'វាយនភាព', desc: 'ធ្វើឱ្យផ្ទៃរបស់វត្ថុ (ដូចជាស្បែក, ថ្ម) កាន់តែលេចធ្លោ។', tip: 'បន្ថយ (-20) ដើម្បីធ្វើឱ្យស្បែកមុខម៉ត់រលោង។' },
      { tool: 'Clarity', khmer: 'ភាពច្បាស់', desc: 'បន្ថែម Contrast នៅតំបន់កណ្តាល ធ្វើឱ្យរូបមើលទៅមានជម្រៅ និងមុត។', tip: 'កុំប្រើលើមុខមនុស្សស្ត្រី ឬកុមារ ព្រោះវាធ្វើឱ្យឃើញស្នាម។' },
      { tool: 'Dehaze', khmer: 'កាត់បន្ថយអ័ព្ទ', desc: 'លុបអ័ព្ទ ឬផ្សែងដើម្បីឱ្យរូបច្បាស់។', tip: 'តម្លើងបន្តិច (+15) សម្រាប់រូបថតមេឃ។' }
    ]
  },
  {
    id: 'masking',
    title: 'ការកែតំបន់ (Masking)',
    icon: <ScanFace className="w-5 h-5 text-green-400" />,
    description: 'កែតម្រូវតែផ្នែកខ្លះនៃរូបភាព (មេឃ, មនុស្ស)។',
    content: [
      { tool: 'Select Subject', khmer: 'ជ្រើសរើសវត្ថុ', desc: 'AI នឹងជ្រើសរើសមនុស្ស ឬវត្ថុសំខាន់ដោយស្វ័យប្រវត្តិ។', tip: 'ប្រើដើម្បីធ្វើឱ្យមនុស្សភ្លឺជាង Background។' },
      { tool: 'Select Sky', khmer: 'ជ្រើសរើសមេឃ', desc: 'AI ជ្រើសរើសផ្ទៃមេឃទាំងអស់។', tip: 'បន្ថយ Highlights ដើម្បីបានមេឃពណ៌ខៀវដិតស្អាត។' }
    ]
  }
];

const initialQuestionBank = [
  { id: 1, question: "តើឧបករណ៍មួយណាសម្រាប់កែពន្លឺទូទៅនៃរូបភាព?", options: ["Contrast", "Exposure", "Highlights", "Shadows"], correct: 1 },
  { id: 2, question: "តើ Vibrance ខុសពី Saturation យ៉ាងដូចម្តេច?", options: ["វាធ្វើឱ្យពណ៌ទាំងអស់ដិតស្មើគ្នា", "វាការពារពណ៌ស្បែកមិនឱ្យដិតពេក", "វាមិនខុសគ្នាទេ", "វាសម្រាប់តែកែរូបសខ្មៅ"], correct: 1 },
  { id: 3, question: "ដើម្បីកែពណ៌មេឃឱ្យដិតស្អាត តើគួរកែពណ៌អ្វីក្នុង HSL?", options: ["Green", "Orange", "Blue", "Red"], correct: 2 },
  { id: 4, question: "តើ Dehaze ប្រើសម្រាប់អ្វី?", options: ["ធ្វើឱ្យរូបព្រាល", "កាត់បន្ថយឬបន្ថែមអ័ព្ទ", "ប្តូរពណ៌រូបភាព", "កាត់រូបភាព"], correct: 1 },
  { id: 5, question: "ប្រសិនបើអ្នកចង់ឱ្យផ្ទៃមុខម៉ត់រលោង តើគួរធ្វើដូចម្តេច?", options: ["តម្លើង Texture", "បន្ថយ Texture", "តម្លើង Clarity", "តម្លើង Sharpening"], correct: 1 }
];

// --- 3. COMPONENTS ---

const CurveVisualizer = ({ type }) => {
    const getPath = () => {
        const t = (type || "").toLowerCase();
        if (t.includes("s-curve")) return "M 0 100 C 25 100, 25 75, 50 50 C 75 25, 75 0, 100 0";
        if (t.includes("matte")) return "M 0 80 C 25 80, 25 75, 50 50 C 75 25, 75 0, 100 0";
        return "M 0 100 L 100 0";
    };
    return (
        <div className="relative w-full aspect-square bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-inner">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
                {[25, 50, 75].map(i => <React.Fragment key={i}><line x1={i} y1="0" x2={i} y2="100" stroke="gray" strokeWidth="0.5" /><line x1="0" y1={i} x2="100" y2={i} stroke="gray" strokeWidth="0.5" /></React.Fragment>)}
            </svg>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-0" preserveAspectRatio="none">
                <path d={getPath()} stroke="#60a5fa" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

const ColorWheel = ({ h, s, l, label }) => {
  const radians = (h - 90) * (Math.PI / 180);
  const dist = Math.min(s, 100) / 2.5;
  const x = 50 + (dist * Math.cos(radians));
  const y = 50 + (dist * Math.sin(radians));

  return (
    <div className="flex flex-col items-center">
       <div className="relative w-16 h-16 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] border border-slate-600 shadow-inner overflow-hidden mb-1">
          <div className="absolute w-2 h-2 bg-white rounded-full shadow border border-black transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }} />
       </div>
       <div className="text-[10px] text-slate-400 font-mono text-center">
          <span className="block font-bold text-slate-300 mb-1 font-khmer">{label}</span>
          H{h} S{s}
       </div>
    </div>
  );
};

const LessonModal = ({ lesson, onClose }) => {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm`} onClick={onClose} />
      <div className={`relative w-full max-w-2xl bg-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-10"><h2 className="text-xl font-bold font-khmer text-white">{lesson.title}</h2><button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><X /></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{lesson.content.map((item, idx) => (
          <div key={idx} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <div className="flex justify-between items-center mb-2 gap-2">
              <span className="font-bold text-lg text-blue-400">{item.tool}</span>
              <span className="text-xs font-bold bg-slate-900 text-slate-300 px-2 py-1 rounded font-khmer border border-slate-600 whitespace-nowrap">{item.khmer}</span>
            </div>
            <p className="text-slate-200 text-sm font-khmer leading-relaxed">{item.desc}</p>
            {item.tip && <div className="mt-3 pt-3 border-t border-slate-600 flex items-start space-x-2"><span className="text-lg">💡</span><p className="text-yellow-400 text-sm font-khmer italic leading-relaxed"><span className="font-bold mr-1">គន្លឹះ:</span>{item.tip}</p></div>}
          </div>
        ))}</div>
      </div>
    </div>
  );
};

const PresetGenerator = () => {
    const [styleInput, setStyleInput] = useState('');
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateRecipe = async () => {
        if (!styleInput.trim()) return;
        setLoading(true);
        const prompt = `Create a Lightroom preset recipe for the style: "${styleInput}". 
        Return strictly valid JSON with this structure: 
        { 
          "basic": { "Exposure": 0, "Contrast": 0, "Highlights": 0, "Shadows": 0, "Temp": 0, "Tint": 0, "Vibrance": 0, "Saturation": 0 }, 
          "curve": "S-Curve",
          "grading": { "Shadows": { "h": 0, "s": 0, "l": 0 }, "Midtones": { "h": 0, "s": 0, "l": 0 }, "Highlights": { "h": 0, "s": 0, "l": 0 } } 
        }`;
        
        const data = await callGemini(prompt, "You are an expert Lightroom photo editor.", true);
        if (data) setRecipe(data);
        setLoading(false);
    };

    return (
         <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col h-full max-w-4xl mx-auto overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-5 border-b border-slate-700 flex items-center gap-3">
                <Sliders className="text-purple-400" />
                <h3 className="font-bold font-khmer text-white text-lg">អ្នកបង្កើតរូបមន្ត AI ✨</h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="flex gap-3">
                    <input value={styleInput} onChange={(e) => setStyleInput(e.target.value)} placeholder="បញ្ចូលរចនាប័ទ្ម (ឧ. Cyberpunk, Vintage)..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-white focus:border-blue-500 outline-none font-khmer text-sm" />
                    <button onClick={generateRecipe} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold font-khmer disabled:opacity-50 shadow-lg">{loading ? <Loader2 className="animate-spin" /> : 'បង្កើត'}</button>
                </div>
                
                {recipe && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 space-y-3">
                            <h4 className="text-blue-400 font-bold font-khmer flex items-center gap-2 mb-4"><Sun size={18}/> Basic Settings</h4>
                            {Object.entries(recipe.basic).map(([k, v]) => (
                                <div key={k} className="flex justify-between text-xs font-mono text-slate-300">
                                    <span>{k}</span>
                                    <span className={v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-slate-500'}>{v > 0 ? `+${v}` : v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 flex flex-col items-center">
                            <h4 className="text-purple-400 font-bold font-khmer flex items-center gap-2 self-start mb-4"><TrendingUp size={18}/> Tone Curve & Color</h4>
                            <CurveVisualizer type={recipe.curve} />
                            <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                                <ColorWheel h={recipe.grading.Shadows.h} s={recipe.grading.Shadows.s} label="Shadows" />
                                <ColorWheel h={recipe.grading.Midtones.h} s={recipe.grading.Midtones.s} label="Midtones" />
                                <ColorWheel h={recipe.grading.Highlights.h} s={recipe.grading.Highlights.s} label="Highlights" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Quiz = () => {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState(initialQuestionBank);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const startQuiz = () => {
    setQuestions([...initialQuestionBank].sort(() => 0.5 - Math.random()));
    setCurrentQuestion(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setGameState('playing');
  };

  const handleAnswerOptionClick = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentQuestion].correct) setScore(score + 1);
  };

  const handleNextQuestion = () => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) { setCurrentQuestion(nextQuestion); setIsAnswered(false); setSelectedOption(null); } else { setGameState('result'); }
  };

  if (gameState === 'menu') return (
    <div className="bg-slate-800 p-8 text-center rounded-2xl border border-slate-700 shadow-2xl max-w-lg mx-auto">
      <Award className="w-20 h-20 text-blue-500 mx-auto mb-6 drop-shadow-lg" />
      <h2 className="text-3xl font-bold text-white font-khmer mb-2">ការធ្វើតេស្តសមត្ថភាព</h2>
      <p className="text-slate-400 font-khmer mb-8">សាកល្បងចំណេះដឹងរបស់អ្នកអំពី Lightroom</p>
      <button onClick={startQuiz} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-khmer shadow-lg transition-all transform hover:-translate-y-1">ចាប់ផ្ដើមសំណួរ</button>
    </div>
  );
  
  if (gameState === 'result') return (
    <div className="bg-slate-800 p-8 text-center rounded-2xl border border-slate-700 shadow-2xl max-w-lg mx-auto">
      <h2 className="text-3xl font-bold text-white font-khmer mb-2">លទ្ធផល</h2>
      <p className="text-slate-400 font-khmer mb-8">ពិន្ទុរបស់អ្នក: <span className="text-blue-400 font-bold text-2xl">{score}</span> / {questions.length}</p>
      <button onClick={() => setGameState('menu')} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-khmer">សាកល្បងម្តងទៀត</button>
    </div>
  );

  const q = questions[currentQuestion];
  return (
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl mx-auto">
      <div className="mb-6 font-bold text-blue-400 font-khmer text-sm">សំណួរ {currentQuestion + 1}/{questions.length}</div>
      <h3 className="text-xl md:text-2xl font-bold text-white mb-8 font-khmer leading-relaxed">{q.question}</h3>
      <div className="grid gap-3">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswerOptionClick(i)} className={`p-4 text-left rounded-xl border transition-all font-khmer text-sm ${isAnswered ? (i === q.correct ? 'bg-green-600/20 border-green-500 text-green-200' : (i === selectedOption ? 'bg-red-600/20 border-red-500 text-red-200' : 'bg-slate-900 border-slate-800 opacity-50')) : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-blue-500'}`}>
            {opt}
          </button>
        ))}
      </div>
      {isAnswered && <button onClick={handleNextQuestion} className="mt-8 w-full py-3 bg-blue-600 text-white rounded-xl font-bold font-khmer">បន្ទាប់</button>}
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
    const reply = await callGemini(msg, "You are a photography and Lightroom expert assistant speaking Khmer.");
    setMessages(prev => [...prev, { role: 'model', text: reply || "សុំទោស ខ្ញុំមិនទាន់អាចឆ្លើយបានទេក្នុងពេលនេះ។" }]);
    setLoading(false);
  };

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex flex-col h-[550px] max-w-3xl mx-auto shadow-2xl">
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg"><Bot size={20} className="text-white" /></div>
        <h3 className="font-bold text-white font-khmer text-sm">គ្រូជំនួយ AI</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-khmer leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="p-3 bg-slate-800 rounded-xl inline-block border border-slate-700"><Loader2 className="animate-spin text-blue-400" size={16}/></div>}
        <div ref={endRef} />
      </div>
      <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="សួរអ្វីមួយ..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-blue-500 font-khmer" />
        <button onClick={send} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white shadow-lg transition-all"><Send size={20}/></button>
      </div>
    </div>
  );
};

// --- 4. MAIN APP COMPONENT ---

export default function App() {
  const [tab, setTab] = useState('learn');
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 md:pb-0 selection:bg-blue-500/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; }`}</style>
      
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab('learn')}>
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20"><ImageIcon className="text-white" size={24}/></div>
            <h1 className="text-xl font-bold font-khmer tracking-tight">Lightroom <span className="text-blue-400">Khmer</span></h1>
          </div>
          <nav className="hidden md:flex gap-1 bg-slate-800 p-1.5 rounded-full border border-slate-700 shadow-inner">
            {[
              { id: 'learn', label: 'មេរៀន' },
              { id: 'quiz', label: 'តេស្ត' },
              { id: 'preset', label: 'បង្កើតរូបមន្ត' },
              { id: 'ai', label: 'គ្រូ AI' }
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-2 rounded-full text-sm font-khmer transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {expanded && <LessonModal lesson={lessonsData.find(l => l.id === expanded)} onClose={() => setExpanded(null)} />}

      <main className="max-w-6xl mx-auto p-4 pt-8 md:p-10">
        <div className="animate-in fade-in duration-700">
            {tab === 'learn' && (
              <div className="space-y-10">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold font-khmer">វគ្គសិក្សា Lightroom</h2>
                    <p className="text-slate-400 font-khmer">រៀនកែរូបភាពឱ្យដូចអាជីព ជាមួយភាសាខ្មែរ</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {lessonsData.map(l => (
                    <button key={l.id} onClick={() => setExpanded(l.id)} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-left hover:border-blue-500/50 transition-all flex items-center justify-between group shadow-xl hover:shadow-blue-900/10">
                        <div className="flex items-center gap-5">
                            <div className="bg-slate-800 p-4 rounded-2xl group-hover:bg-blue-600/10 transition-colors">{l.icon}</div>
                            <div><h3 className="font-bold text-white text-lg font-khmer mb-1">{l.title}</h3><p className="text-slate-400 text-sm font-khmer">{l.description}</p></div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded-full text-slate-600 group-hover:text-blue-400 group-hover:bg-blue-600/10 transition-all"><ChevronRight /></div>
                    </button>
                    ))}
                </div>
              </div>
            )}

            {tab === 'quiz' && <Quiz />}
            {tab === 'preset' && <PresetGenerator />}
            {tab === 'ai' && <ChatBot />}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 flex justify-around p-3 pb-6">
        {[
          { id: 'learn', label: 'មេរៀន', icon: <BookOpen size={20}/> },
          { id: 'quiz', label: 'តេស្ត', icon: <Award size={20}/> },
          { id: 'preset', label: 'រូបមន្ត', icon: <Sliders size={20}/> },
          { id: 'ai', label: 'AI', icon: <Bot size={20}/> }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1.5 px-4 py-1 rounded-xl transition-all ${tab === t.id ? 'text-blue-400' : 'text-slate-500'}`}>
            {t.icon}
            <span className="text-[10px] font-khmer font-bold">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}