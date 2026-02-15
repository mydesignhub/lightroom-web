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
const apiKey = ""; // API Key will be provided by the environment

const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
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
    
    // Clean up markdown if AI adds it (fixes JSON parsing errors)
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
// 2. DATA & ICONS
// ==========================================

const FacebookIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const lessonsData = [
  {
    id: 'light',
    title: 'ពន្លឺ (Light)',
    icon: <Sun className="w-5 h-5 text-amber-400" />,
    description: 'រៀនអំពីការកែសម្រួលពន្លឺនៅក្នុងរូបភាពរបស់អ្នក។',
    content: [
      { 
        tool: 'Exposure', 
        khmer: 'ការប៉ះពន្លឺ', 
        desc: 'កំណត់ពន្លឺរួមនៃរូបភាពទាំងមូល។ បង្កើន (+) ដើម្បីឱ្យភ្លឺ និងបន្ថយ (-) ដើម្បីឱ្យងងឹត។ វាជាមូលដ្ឋានគ្រឹះដំបូងគេដែលត្រូវកែ។', 
        tip: 'កែវាមុនគេបង្អស់ ដើម្បីឱ្យឃើញរូបភាពច្បាស់សិន ចាំទៅកែផ្នែកផ្សេង។' 
      },
      { 
        tool: 'Contrast', 
        khmer: 'ភាពផ្ទុយ', 
        desc: 'កំណត់កម្រិតភាពខុសគ្នារវាងផ្នែកភ្លឺ និងផ្នែកងងឹត។ Contrast ខ្ពស់ធ្វើឱ្យរូបដិតច្បាស់ និងមានជម្រៅ (Pop)។ Contrast ទាបធ្វើឱ្យរូបមើលទៅស្រាល ស្រទន់ ឬស្រអាប់ (Flat/Fade)។', 
        tip: 'កុំដាក់ខ្លាំងពេក (កុំឱ្យលើស +40) ព្រោះវានឹងធ្វើឱ្យរូបបាត់បង់ព័ត៌មានលម្អិត ហើយមើលទៅរឹង។' 
      },
      { 
        tool: 'Highlights', 
        khmer: 'ផ្នែកភ្លឺ', 
        desc: 'គ្រប់គ្រងតែតំបន់ដែលមានពន្លឺខ្លាំងបំផុត (ដូចជាមេឃ ពពក ឬពន្លឺថ្ងៃចាំង)។ ការបន្ថយវាជួយសង្គ្រោះព័ត៌មានដែលបាត់ដោយសារពន្លឺចាំង។', 
        tip: 'បន្ថយ (-50 ទៅ -80) ដើម្បីសង្គ្រោះពន្លឺមេឃឱ្យឃើញពពកវិញ។' 
      },
      { 
        tool: 'Shadows', 
        khmer: 'ផ្នែកងងឹត', 
        desc: 'គ្រប់គ្រងតែតំបន់ដែលមានស្រមោល ឬងងឹត។ ការតម្លើងវាជួយឱ្យយើងមើលឃើញព័ត៌មានលម្អិតនៅក្នុងកន្លែងងងឹត ឬមុខមនុស្សដែលឈរបញ្ច្រាសថ្ងៃ។', 
        tip: 'តម្លើង (+40 ទៅ +70) សម្រាប់រូបថតដែលមានពន្លឺថ្ងៃខ្លាំង (Backlit)។' 
      },
      { 
        tool: 'Whites', 
        khmer: 'ពណ៌ស', 
        desc: 'កំណត់ចំណុចពណ៌សដាច់ខាត (True White)។ បង្កើនវាដើម្បីឱ្យផ្នែកភ្លឺបំផុត ក្លាយជាពណ៌សសុទ្ធ មិនមែនប្រផេះ។', 
        tip: 'តម្លើងបន្តិច (+10 ទៅ +20) ដើម្បីឱ្យរូបមើលទៅភ្លឺថ្លា (Clean Look)។' 
      },
      { 
        tool: 'Blacks', 
        khmer: 'ពណ៌ខ្មៅ', 
        desc: 'កំណត់ចំណុចពណ៌ខ្មៅដាច់ខាត (True Black)។ បន្ថយវាដើម្បីឱ្យផ្នែកងងឹតបំផុត ក្លាយជាពណ៌ខ្មៅសុទ្ធ។', 
        tip: 'បន្ថយបន្តិច (-10 ទៅ -20) ដើម្បីឱ្យរូបមានជម្រៅ និងពណ៌ដិតល្អ។' 
      },
    ]
  },
  {
    id: 'color',
    title: 'ពណ៌ (Color)',
    icon: <Droplet className="w-5 h-5 text-cyan-400" />,
    description: 'ធ្វើឱ្យពណ៌មានភាពរស់រវើកនិងកែសម្រួលសីតុណ្ហភាព។',
    content: [
      { tool: 'Temp', khmer: 'សីតុណ្ហភាព', desc: 'កំណត់សីតុណ្ហភាពពណ៌៖ ពណ៌លឿង (កក់ក្តៅ/Warm) ឬពណ៌ខៀវ (ត្រជាក់/Cool)។', tip: 'ថតពេលថ្ងៃលិច តម្លើងទៅលឿង។ ថតពេលព្រឹកព្រលឹម បន្ថយទៅខៀវ។' },
      { tool: 'Tint', khmer: 'ពណ៌លាំ', desc: 'កែតម្រូវពណ៌លាំរវាង ពណ៌បៃតង និង ពណ៌ស្វាយ (Magenta)។', tip: 'ប្រើសម្រាប់កែពណ៌ស្បែកដែលជាប់បៃតង (ដោយសារពន្លឺភ្លើង Fluorescent)។' },
      { tool: 'Vibrance', khmer: 'ភាពរស់រវើក', desc: 'បង្កើនពណ៌ដែលស្លេក ដោយមិនធ្វើឱ្យពណ៌ដែលដិតស្រាប់ (ដូចជាពណ៌ស្បែក) ខូចឡើយ។', tip: 'តែងតែប្រើ Vibrance ជំនួស Saturation សម្រាប់រូបថតមនុស្ស (Portrait)។' },
      { tool: 'Saturation', khmer: 'កម្រិតពណ៌', desc: 'បង្កើនភាពដិតនៃពណ៌ទាំងអស់ស្មើៗគ្នា។ ការប្រើខ្លាំងពេកធ្វើឱ្យរូបមើលទៅមិនធម្មជាតិ។', tip: 'ប្រើតិចៗ (-10 ទៅ +10)។ សម្រាប់ការថតទេសភាព (Landscape) អាចប្រើបាន។' },
      { tool: 'Color Mix', khmer: 'ការលាយពណ៌', desc: 'ឧបករណ៍ខ្លាំងបំផុត! គ្រប់គ្រង Hue (ពណ៌), Saturation (ភាពដិត), Luminance (ពន្លឺ) នៃពណ៌នីមួយៗ។', tip: 'Orange: តម្លើង Luminance ដើម្បីឱ្យស្បែកស។ Blue: បន្ថយ Luminance ដើម្បីឱ្យមេឃដិត។' },
      { tool: 'Color Grading', khmer: 'ការដាក់ពណ៌', desc: 'ដាក់ពណ៌ចូលទៅក្នុង Shadows (ផ្នែកងងឹត), Midtones (កណ្តាល), និង Highlights (ផ្នែកភ្លឺ) ដើម្បីបង្កើត Mood។', tip: 'សាកល្បងដាក់ Teal ក្នុង Shadows និង Orange ក្នុង Highlights (Cinematic Look)។' },
    ]
  },
  {
    id: 'effects',
    title: 'បែបផែន (Effects)',
    icon: <Aperture className="w-5 h-5 text-purple-400" />,
    description: 'បន្ថែមភាពច្បាស់ និងវាយនភាពទៅកាន់រូបភាព។',
    content: [
      { tool: 'Texture', khmer: 'វាយនភាព', desc: 'ធ្វើឱ្យផ្ទៃរបស់វត្ថុ (ដូចជាស្បែក, ថ្ម, ឈើ) កាន់តែលេចធ្លោ។', tip: 'បន្ថយ (-20) ដើម្បីធ្វើឱ្យស្បែកមុខម៉ត់រលោង (Soft Skin)។' },
      { tool: 'Clarity', khmer: 'ភាពច្បាស់', desc: 'បន្ថែម Contrast នៅតំបន់កណ្តាល (Midtone) ធ្វើឱ្យរូបមើលទៅមានជម្រៅ និងមុត។', tip: 'កុំប្រើលើមុខមនុស្សស្ត្រី ឬកុមារ ព្រោះវាធ្វើឱ្យឃើញស្នាម។' },
      { tool: 'Dehaze', khmer: 'កាត់បន្ថយអ័ព្ទ', desc: 'លុបអ័ព្ទ ឬផ្សែងដើម្បីឱ្យរូបច្បាស់។ ក៏អាចប្រើបន្ថែមអ័ព្ទដើម្បីបង្កើតអារម្មណ៍ស្រទន់។', tip: 'តម្លើងបន្តិច (+15) សម្រាប់រូបថតមេឃ ដើម្បីឱ្យពណ៌មេឃដិតល្អ។' },
      { tool: 'Vignette', khmer: 'គែមងងឹត', desc: 'ធ្វើឱ្យគែមរូបភាពងងឹត ឬភ្លឺ ដើម្បីរុញចំណាប់អារម្មណ៍ទៅកាន់ចំណុចកណ្តាលនៃរូប។', tip: 'ដាក់កម្រិត -15 ទៅ -20 គឺល្មមស្អាតសម្រាប់រូបទូទៅ។' },
    ]
  },
  {
    id: 'detail',
    title: 'ភាពលម្អិត (Detail)',
    icon: <Triangle className="w-5 h-5 text-pink-400" />,
    description: 'គ្រប់គ្រងភាពច្បាស់ និងកាត់បន្ថយគ្រាប់ (Noise)។',
    content: [
      { tool: 'Sharpening', khmer: 'ការធ្វើឱ្យច្បាស់', desc: 'ធ្វើឱ្យគែមនៃវត្ថុក្នុងរូបភាពកាន់តែមុត។', tip: 'ចុចពីរម្រាមដៃ (Alt/Option) ពេលអូស Masking ឱ្យដល់ 80% ដើម្បី Sharpen តែគែម។' },
      { tool: 'Noise Reduction', khmer: 'កាត់បន្ថយគ្រាប់', desc: 'លុបគ្រាប់ (Noise) ដែលកើតឡើងដោយសារការថតនៅទីងងឹត (ISO ខ្ពស់)។', tip: 'កុំដាក់លើសពី 40 ព្រោះវាធ្វើឱ្យរូបបាត់បង់ភាពលម្អិត ហើយមើលទៅដូចប្លាស្ទិក។' },
      { tool: 'Color Noise', khmer: 'គ្រាប់ពណ៌', desc: 'លុបគ្រាប់ពណ៌ខុសប្រក្រតី (ស្ុចៗពណ៌ស្វាយ/បៃតង) នៅក្នុងផ្នែកងងឹត។', tip: 'ទុកនៅតម្លៃ 25 (Default) គឺល្អគ្រប់គ្រាន់ហើយ។' },
    ]
  },
  {
    id: 'masking',
    title: 'ការកែតំបន់ (Masking)',
    icon: <ScanFace className="w-5 h-5 text-green-400" />,
    description: 'កែតម្រូវតែផ្នែកខ្លះនៃរូបភាព (មេឃ, មនុស្ស)។',
    content: [
      { tool: 'Select Subject', khmer: 'ជ្រើសរើសវត្ថុ', desc: 'AI នឹងជ្រើសរើសមនុស្ស ឬវត្ថុសំខាន់ដោយស្វ័យប្រវត្តិ។', tip: 'ប្រើដើម្បីធ្វើឱ្យមនុស្សភ្លឺជាង Background (Exposure +) ឬបន្ថែម Texture លើសម្លៀកបំពាក់។' },
      { tool: 'Select Sky', khmer: 'ជ្រើសរើសមេឃ', desc: 'AI ជ្រើសរើសផ្ទៃមេឃទាំងអស់។ ល្អបំផុតសម្រាប់ការកែពន្លឺមេឃ។', tip: 'បន្ថយ Highlights និងតម្លើង Saturation ដើម្បីបានមេឃពណ៌ខៀវដិតស្អាត។' },
      { tool: 'Linear Gradient', khmer: 'ដេញពណ៌', desc: 'កែតំបន់ជាលក្ខណៈបន្ទាត់រលាយ (Gradient)។', tip: 'ប្រើសម្រាប់ធ្វើឱ្យដីភ្លឺ (ទាញពីក្រោមឡើងលើ) ឬធ្វើឱ្យមេឃងងឹត (ទាញពីលើចុះក្រោម)។' },
      { tool: 'Radial Gradient', khmer: 'រង្វង់', desc: 'កែតំបន់ជារង្វង់។ អាចកែខាងក្នុងរង្វង់ ឬខាងក្រៅរង្វង់ (Invert)។', tip: 'ប្រើបង្កើតពន្លឺសិប្បនិម្មិត (Sun Flare) ឬពន្លឺផ្តោត (Spotlight) លើមុខ។' },
    ]
  },
  {
    id: 'optics',
    title: 'Optics & Geometry',
    icon: <Crop className="w-5 h-5 text-cyan-400" />,
    description: 'កែទម្រង់រូបភាព និងកែវថត។',
    content: [
      { tool: 'Lens Corrections', khmer: 'កែកែវថត', desc: 'កែការពន្លយ (Distortion) និង Vignette ដែលជាប់មកជាមួយកែវថតកាមេរ៉ា។', tip: 'បើកវាជានិច្ច (Enable Lens Corrections) សម្រាប់គ្រប់រូបថត។' },
      { tool: 'Chromatic Aberration', khmer: 'ពណ៌តាមគែម', desc: 'លុបស្នាមពណ៌ស្វាយ ឬបៃតង នៅតាមគែមវត្ថុដែលមាន Contrast ខ្ពស់ (ដូចជាស្លឹកឈើនិងមេឃ)។', tip: 'ចាំបាច់សម្រាប់រូបថតដែលមានពន្លឺថ្ងៃខ្លាំង។' },
      { tool: 'Upright', khmer: 'តម្រង់រូប', desc: 'ធ្វើឱ្យអគារ ឬបន្ទាត់ក្នុងរូបត្រង់ដោយស្វ័យប្រវត្តិ។', tip: 'ប្រើ "Auto" សម្រាប់លទ្ធផលរហ័ស។ ប្រើ "Vertical" សម្រាប់រូបថតស្ថាបត្យកម្ម។' },
    ]
  },
  {
    id: 'export',
    title: 'រក្សាទុក (Export)',
    icon: <Save className="w-5 h-5 text-indigo-500" />,
    description: 'របៀបរក្សាទុករូបភាពឱ្យមានគុណភាពខ្ពស់។',
    content: [
      { tool: 'JPG', khmer: 'រូបភាពធម្មតា', desc: 'ឯកសាររូបភាពដែលត្រូវបានបង្រួម។ ទំហំតូច ងាយស្រួលប្រើ។', tip: 'កំណត់ Quality 100% សម្រាប់បង្ហោះលើ Facebook/Instagram។' },
      { tool: 'DNG', khmer: 'ឯកសារ RAW', desc: 'ឯកសារដើមដែលអាចកែពណ៌បន្តបានល្អបំផុត។ វាផ្ទុកការកំណត់ (Settings) ទាំងអស់។', tip: 'ប្រើសម្រាប់រក្សាទុក Preset ដើម្បីចែករំលែកទៅឱ្យអ្នកដទៃ។' },
      { tool: 'Watermark', khmer: 'ឈ្មោះលើរូប', desc: 'ដាក់ឈ្មោះ ឬ Logo របស់អ្នកលើរូបភាព ដើម្បីការពារកម្មសិទ្ធិបញ្ញា។', tip: 'Customize ក្នុង Export Settings ដើម្បីប្តូរ Font និងទីតាំង។' },
    ]
  }
];

const initialQuestionBank = [
  {
    id: 1,
    question: "តើឧបករណ៍មួយណាសម្រាប់កែពន្លឺទូទៅនៃរូបភាព?",
    options: ["Contrast", "Exposure", "Highlights", "Shadows"],
    correct: 1,
    level: "beginner"
  },
  {
    id: 2,
    question: "តើ Vibrance ខុសពី Saturation យ៉ាងដូចម្តេច?",
    options: ["វាធ្វើឱ្យពណ៌ទាំងអស់ដិតស្មើគ្នា", "វាការពារពណ៌ស្បែកមិនឱ្យដិតពេក", "វាមិនខុសគ្នាទេ", "វាសម្រាប់តែកែរូបសខ្មៅ"],
    correct: 1,
    level: "beginner"
  },
  {
    id: 3,
    question: "ដើម្បីកែពណ៌មេឃឱ្យដិតស្អាត តើគួរកែពណ៌អ្វីក្នុង HSL?",
    options: ["Green", "Orange", "Blue", "Red"],
    correct: 2,
    level: "beginner"
  },
  {
    id: 4,
    question: "តើ Dehaze ប្រើសម្រាប់អ្វី?",
    options: ["ធ្វើឱ្យរូបព្រាល", "កាត់បន្ថយឬបន្ថែមអ័ព្ទ", "ប្តូរពណ៌រូបភាព", "កាត់រូបភាព"],
    correct: 1,
    level: "beginner"
  },
  {
    id: 5,
    question: "ប្រសិនបើអ្នកចង់ឱ្យផ្ទៃមុខម៉ត់រលោង តើគួរធ្វើដូចម្តេច?",
    options: ["តម្លើង Texture", "បន្ថយ Texture", "តម្លើង Clarity", "តម្លើង Sharpening"],
    correct: 1,
    level: "advanced"
  }
];

const PRESET_DB = {
    "teal & orange": {
        basic: { Exposure: 0.10, Contrast: 20, Highlights: -40, Shadows: 30, Whites: 15, Blacks: -20, Temp: 5, Tint: -5, Vibrance: 25, Saturation: -10, Clarity: 10, Dehaze: 5, Vignette: -15 },
        detail: { Sharpening: 40, Noise: 10, ColorNoise: 25 },
        effects: { Grain: 0 },
        curve: { RGB: "S-Curve" },
        colorMix: [
            { color: "Red", h: 0, s: 0, l: 0 }, { color: "Orange", h: -10, s: 15, l: 5 }, { color: "Yellow", h: -30, s: -20, l: 0 },
            { color: "Green", h: -60, s: -40, l: -10 }, { color: "Aqua", h: -50, s: 10, l: -10 }, { color: "Blue", h: -50, s: 10, l: -10 }, { color: "Purple", h: 0, s: -40, l: 0 }, { color: "Magenta", h: 0, s: -40, l: 0 }
        ],
        grading: { Shadows: { h: 210, s: 20, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 35, s: 20, l: 0 }, Blending: 50, Balance: 0 }
    }
};

const QA_DB = {
    // Basic Fallback Database
    "exposure": "Exposure (ការប៉ះពន្លឺ) កំណត់ពន្លឺរួមនៃរូបភាព។ + ធ្វើឱ្យភ្លឺ, - ធ្វើឱ្យងងឹត។",
    "contrast": "Contrast (ភាពផ្ទុយ) កំណត់គម្លាតរវាងកន្លែងភ្លឺនិងងងឹត។ ខ្ពស់=ដិត, ទាប=ស្រាល (Flat)។",
    "highlight": "Highlights គ្រប់គ្រងតំបន់ដែលភ្លឺខ្លាំងបំផុតក្នុងរូប។ បន្ថយ (-100) ដើម្បីសង្គ្រោះព័ត៌មានលម្អិតក្នុងមេឃ។",
};

const TIPS_LIST = [
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើម រួចកែតម្រូវតាមក្រោយ។", "ចុចសង្កត់លើរូបដើម្បីមើល Before/After។", "ចុចពីរដងលើ Slider ដើម្បី Reset វាទៅ 0។", 
    "ប្រើម្រាមដៃពីរដើម្បីមើល Clipping ពេលអូស Whites/Blacks។", "បន្ថយ Highlights និងតម្លើង Shadows ដើម្បីបានរូបបែប HDR។", 
    "ប្រើ Masking 'Select Sky' ដើម្បីកែពណ៌មេឃអោយដិតស្អាត។", "ប្រើ Healing Brush ដើម្បីលុបមុន ឬវត្ថុដែលមិនចង់បាន។", "កុំប្រើ Clarity ខ្លាំងពេកលើមុខមនុស្ស។"
];

// --- 3. HELPER FUNCTIONS ---

const generateXMP = (recipe, title) => {
    const basic = recipe.basic || {};
    const colorMix = recipe.colorMix || [];
    const grading = recipe.grading || {};
    const detail = recipe.detail || { Sharpening: 0, Noise: 0, ColorNoise: 0 };
    const effects = recipe.effects || { Grain: 0 };
    const curveType = recipe.curve?.RGB || "Linear";

    const getHSL = (name) => {
        const c = colorMix.find(item => item.color.toLowerCase() === name.toLowerCase()) || {};
        return { h: c.h || 0, s: c.s || 0, l: c.l || 0 };
    };

    const getCurvePoints = (type) => {
        const t = (type || "").toLowerCase();
        if (t.includes("s-curve")) return ["0, 0", "64, 50", "190, 200", "255, 255"];
        if (t.includes("matte")) return ["0, 25", "64, 60", "190, 200", "255, 255"];
        return ["0, 0", "255, 255"];
    };
    
    const curvePoints = getCurvePoints(curveType);
    const curveRDF = curvePoints.map(p => `<rdf:li>${p}</rdf:li>`).join('\n        ');
    const exposureVal = basic.Exposure;

    const xmpContent = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c140 79.160451, 2017/05/06-01:08:06">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    crs:Version="14.0"
    crs:ProcessVersion="11.0"
    crs:HasSettings="True"
    crs:AlreadyApplied="False"
    crs:Name="${title}"
    crs:Group="Lightroom Khmer Presets"
    crs:CameraProfile="Adobe Standard"
    photoshop:DateCreated="${new Date().toISOString()}"

    crs:Exposure2012="${exposureVal}"
    crs:Contrast2012="${basic.Contrast || 0}"
    crs:Highlights2012="${basic.Highlights || 0}"
    crs:Shadows2012="${basic.Shadows || 0}"
    crs:Whites2012="${basic.Whites || 0}"
    crs:Blacks2012="${basic.Blacks || 0}"
    crs:Clarity2012="${basic.Clarity || 0}"
    crs:Dehaze="${basic.Dehaze || 0}"
    crs:Vibrance="${basic.Vibrance || 0}"
    crs:Saturation="${basic.Saturation || 0}"
    
    crs:Sharpness="${detail.Sharpening}"
    crs:LuminanceSmoothing="${detail.Noise}"
    crs:ColorNoiseReduction="${detail.ColorNoise}"
    crs:GrainAmount="${effects.Grain}"
    crs:LensProfileEnable="1"
    crs:PostCropVignetteAmount="${basic.Vignette || 0}"
    
    crs:HueAdjustmentRed="${getHSL('Red').h}" crs:SaturationAdjustmentRed="${getHSL('Red').s}" crs:LuminanceAdjustmentRed="${getHSL('Red').l}"
    crs:HueAdjustmentOrange="${getHSL('Orange').h}" crs:SaturationAdjustmentOrange="${getHSL('Orange').s}" crs:LuminanceAdjustmentOrange="${getHSL('Orange').l}"
    crs:HueAdjustmentYellow="${getHSL('Yellow').h}" crs:SaturationAdjustmentYellow="${getHSL('Yellow').s}" crs:LuminanceAdjustmentYellow="${getHSL('Yellow').l}"
    crs:HueAdjustmentGreen="${getHSL('Green').h}" crs:SaturationAdjustmentGreen="${getHSL('Green').s}" crs:LuminanceAdjustmentGreen="${getHSL('Green').l}"
    crs:HueAdjustmentAqua="${getHSL('Aqua').h || getHSL('Blue').h}" crs:SaturationAdjustmentAqua="${getHSL('Aqua').s || getHSL('Blue').s}" crs:LuminanceAdjustmentAqua="${getHSL('Aqua').l || getHSL('Blue').l}"
    crs:HueAdjustmentBlue="${getHSL('Blue').h}" crs:SaturationAdjustmentBlue="${getHSL('Blue').s}" crs:LuminanceAdjustmentBlue="${getHSL('Blue').l}"
    crs:HueAdjustmentPurple="${getHSL('Purple').h}" crs:SaturationAdjustmentPurple="${getHSL('Purple').s}" crs:LuminanceAdjustmentPurple="${getHSL('Purple').l}"
    crs:HueAdjustmentMagenta="${getHSL('Magenta').h || getHSL('Purple').h}" crs:SaturationAdjustmentMagenta="${getHSL('Magenta').s || getHSL('Purple').s}" crs:LuminanceAdjustmentMagenta="${getHSL('Magenta').l || getHSL('Purple').l}"

    crs:SplitToningShadowHue="${grading.Shadows?.h || 0}" crs:SplitToningShadowSaturation="${grading.Shadows?.s || 0}"
    crs:SplitToningHighlightHue="${grading.Highlights?.h || 0}" crs:SplitToningHighlightSaturation="${grading.Highlights?.s || 0}"
    crs:SplitToningBalance="${grading.Balance || 0}"
    
    crs:ColorGradeMidtoneHue="${grading.Midtones?.h || 0}"
    crs:ColorGradeMidtoneSat="${grading.Midtones?.s || 0}"
    crs:ColorGradeMidtoneLum="${grading.Midtones?.l || 0}"
    crs:ColorGradeShadowLum="${grading.Shadows?.l || 0}"
    crs:ColorGradeHighlightLum="${grading.Highlights?.l || 0}"
    crs:ColorGradeBlending="${grading.Blending || 50}"
    >
    <dc:creator><rdf:Seq><rdf:li>My Design App</rdf:li></rdf:Seq></dc:creator>
    <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© 2026 My Design</rdf:li></rdf:Alt></dc:rights>
    <crs:ToneCurvePV2012><rdf:Seq>${curveRDF}</rdf:Seq></crs:ToneCurvePV2012>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
    
    const blob = new Blob([xmpContent.trim()], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.xmp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- COMPONENTS ---

const Header = ({ activeTab, setActiveTab }) => {
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  return (
    <header className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-lg border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('learn')}>
          <div className="w-10 h-10 relative rounded-2xl overflow-hidden shadow-sm bg-white/10 flex-shrink-0">
            {!logoSrc.startsWith('/') && !logoSrc.startsWith('http') ? (
                 <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white" />
                 </div>
            ) : (
                <img src={logoSrc} alt="App Logo" className="w-full h-full object-cover" onError={(e) => setLogoSrc('')} />
            )}
          </div>
          <h1 className="text-lg font-bold font-khmer">Lightroom <span className="text-blue-400">ម៉ាយឌីហ្សាញ</span></h1>
        </div>
        <nav className="hidden md:flex space-x-2 bg-[#1e293b] p-1 rounded-full text-sm border border-gray-700">
          <button onClick={() => setActiveTab('learn')} className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${activeTab === 'learn' ? 'bg-[#334155] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#334155]'}`}><BookOpen className="w-4 h-4" /> <span className="font-khmer">មេរៀន</span></button>
          <button onClick={() => setActiveTab('quiz')} className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${activeTab === 'quiz' ? 'bg-[#334155] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#334155]'}`}><Award className="w-4 h-4" /> <span className="font-khmer">តេស្ត</span></button>
          <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${activeTab === 'ai' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#334155]'}`}><Sparkles className="w-4 h-4" /> <span className="font-khmer">គ្រូ AI</span></button>
        </nav>
      </div>
    </header>
  );
};

const CurveVisualizer = ({ type }) => {
    const getPath = () => {
        const t = (type || "").toLowerCase();
        if (t.includes("s-curve")) return "M 0 100 C 25 100, 25 75, 50 50 C 75 25, 75 0, 100 0";
        if (t.includes("matte")) return "M 0 80 C 25 80, 25 75, 50 50 C 75 25, 75 0, 100 0";
        return "M 0 100 L 100 0";
    };
    return (
        <div className="relative w-full aspect-square bg-[#1e293b] border border-gray-700 rounded-lg overflow-hidden shadow-inner">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
                {[25, 50, 75].map(i => <React.Fragment key={i}><line x1={i} y1="0" x2={i} y2="100" stroke="gray" strokeWidth="0.5" /><line x1="0" y1={i} x2="100" y2={i} stroke="gray" strokeWidth="0.5" /></React.Fragment>)}
            </svg>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-0" preserveAspectRatio="none">
                <path d={getPath()} stroke="white" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

const ColorWheel = ({ h, s, l, label }) => {
  const angle = h; 
  const distance = Math.min(s, 100) / 2; 
  const radians = (angle - 90) * (Math.PI / 180);
  const x = 50 + (distance * Math.cos(radians));
  const y = 50 + (distance * Math.sin(radians));

  return (
    <div className="flex flex-col items-center">
       <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 shadow-inner overflow-hidden mb-1">
          <div className="absolute inset-0 opacity-30 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] rounded-full"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full shadow border border-black transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }} />
       </div>
       <div className="text-[10px] text-gray-400 font-mono text-center">
          <span className="block font-bold text-gray-300 mb-1">{label}</span>
          H{h} S{s} L{l}
       </div>
    </div>
  );
};

const LessonModal = ({ lesson, onClose }) => {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm`} onClick={onClose} />
      <div className={`relative w-full h-[92%] sm:h-[85%] sm:w-[90%] max-w-2xl bg-[#1e293b] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col`}>
        <div className="bg-[#0f172a] border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-10"><h2 className="text-xl font-bold font-khmer text-white">{lesson.title}</h2><button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-300"><X className="w-6 h-6" /></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">{lesson.content.map((item, idx) => (
          <div key={idx} className="bg-[#334155]/50 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-2 gap-2">
              <span className="font-bold text-lg text-blue-400">{item.tool}</span>
              <span className="text-xs font-bold bg-[#0f172a] text-gray-300 px-2 py-1 rounded font-khmer border border-gray-700 whitespace-nowrap flex-shrink-0">{item.khmer}</span>
            </div>
            <p className="text-gray-200 text-sm font-khmer leading-relaxed">{item.desc}</p>
            {item.tip && <div className="mt-3 pt-3 border-t border-gray-700 flex items-start space-x-2"><span className="text-lg">💡</span><p className="text-yellow-400/90 text-sm font-khmer italic leading-relaxed"><span className="font-bold mr-1">គន្លឹះ:</span>{item.tip}</p></div>}
          </div>
        ))}</div>
      </div>
    </div>
  );
};

const LessonCard = ({ lesson, onClick }) => (
    <button onClick={onClick} className="bg-[#1e293b] rounded-xl overflow-hidden border border-gray-800 shadow-md transition-all hover:scale-[1.02] active:scale-95 hover:border-blue-500/50 cursor-pointer h-full flex flex-col group w-full text-left hover:shadow-lg hover:shadow-blue-900/20">
      <div className="p-5 flex items-center justify-between w-full">
        <div className="flex items-center gap-4"><div className="bg-[#0f172a] p-3 rounded-xl shadow-inner border border-gray-800 group-hover:bg-[#1e293b] transition-colors">{lesson.icon}</div><div><h3 className="font-bold text-white text-lg font-khmer">{lesson.title}</h3><p className="text-gray-400 text-xs font-khmer mt-0.5 line-clamp-1">{lesson.description}</p></div></div><div className="bg-[#0f172a] p-2 rounded-full text-blue-400 group-hover:bg-blue-600 group-hover:text-white"><ChevronRight className="w-5 h-5" /></div>
      </div>
    </button>
);

const TipsSection = ({ isExpanded, onToggle, isOnline }) => {
  const [aiTip, setAiTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const getAiTip = async () => {
      setLoadingTip(true);
      const prompt = "Give me one short, useful photography or Lightroom tip in Khmer language. Keep it under 20 words.";
      const tip = await callGemini(prompt, "You are a photography expert.");
      setAiTip(tip || TIPS_LIST[Math.floor(Math.random() * TIPS_LIST.length)]);
      setLoadingTip(false);
  };
  return (
    <div className="mt-8">
      <button onClick={onToggle} className="w-full flex items-center justify-between bg-[#1e293b] p-4 rounded-xl border border-gray-800 shadow-sm hover:border-gray-500 transition-all group active:scale-95">
        <div className="flex items-center space-x-3"><div className="bg-blue-900/30 p-2 rounded-lg group-hover:bg-blue-900/50 transition-colors"><PlayCircle className="w-5 h-5 text-blue-400" /></div><h3 className="font-bold text-white text-lg font-khmer">គន្លឹះបន្ថែម (Tips)</h3></div>
        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4 md:col-span-2 relative overflow-hidden backdrop-blur-sm">
             <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white font-khmer flex items-center gap-2 z-10"><Sparkles className="w-4 h-4 text-yellow-400" /> គន្លឹះពិសេសពី AI (Magic Tip)</h4><button onClick={getAiTip} disabled={loadingTip} className="z-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full font-khmer transition-all shadow-lg hover:shadow-indigo-500/50">{loadingTip ? '...' : 'យកគន្លឹះថ្មី'}</button></div>
             <p className="text-gray-200 text-sm font-khmer leading-relaxed border-l-2 border-indigo-500 pl-3 mt-2">{aiTip || "ចុចប៊ូតុងខាងលើដើម្បីទទួលបានគន្លឹះកែរូបពី AI។"}</p>
          </div>
          <div className="bg-[#1e293b]/80 border border-gray-800 rounded-xl p-4 md:col-span-2">
            <h4 className="font-bold text-white font-khmer mb-3 flex items-center"><Zap className="w-4 h-4 mr-2 text-yellow-400" /> គន្លឹះប្រើកម្មវិធី (Shortcut Tricks)</h4>
            <ul className="space-y-3 text-sm text-gray-300 font-khmer">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">1.</span>
                <span><span className="font-bold text-white">ចុចសង្កត់លើរូប៖</span> មើលរូបភាពដើម (Before) ដើម្បីប្រៀបធៀប។</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">2.</span>
                <span><span className="font-bold text-white">ចុចពីរដងលើ Slider៖</span> ត្រឡប់តម្លៃនោះទៅ 0 វិញ (Reset)។</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">3.</span>
                <span><span className="font-bold text-white">ប្រើម្រាមដៃពីរលើ Slider៖</span> (Whites/Blacks) ដើម្បីមើលកន្លែងដែលបាត់ព័ត៌មាន (Clipping)។</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">4.</span>
                <span><span className="font-bold text-white">Auto + Tweak៖</span> ប្រើ Auto ជាមូលដ្ឋានសិន រួចកែសម្រួលបន្ថែម ដើម្បីចំណេញពេល។</span>
              </li>
               <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400">5.</span>
                <span><span className="font-bold text-white">ចុចពីរដងលើរូប៖</span> Zoom 100% ដើម្បីពិនិត្យមើលភាពច្បាស់ (Sharpness)។</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactSection = () => (
  <div className="mt-8 mb-4 border-t border-gray-800 pt-6"><h3 className="text-center text-gray-400 text-sm font-khmer mb-4">ទំនាក់ទំនង & ស្វែងយល់បន្ថែម</h3><div className="flex justify-center space-x-4"><a href="https://web.facebook.com/mydesignpro" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group"><div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><FacebookIcon className="w-5 h-5 text-white" /></div><span className="text-xs text-gray-400 font-khmer mt-1">Facebook</span></a><a href="https://t.me/koymy" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group"><div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Send className="w-5 h-5 text-white" /></div><span className="text-xs text-gray-400 font-khmer mt-1">Telegram</span></a><a href="https://myaffinity.gumroad.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group"><div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Globe className="w-5 h-5 text-white" /></div><span className="text-xs text-gray-400 font-khmer mt-1">Website</span></a></div><p className="text-center text-gray-600 text-xs mt-6 font-khmer">© 2026 Lightroom My Design. All Right Reserved.</p></div>
);

const Quiz = ({ isOnline }) => {
  const [gameState, setGameState] = useState('menu');
  const [quizConfig, setQuizConfig] = useState({ level: 'beginner', amount: 10 });
  const [questions, setQuestions] = useState(initialQuestionBank);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const startQuiz = () => {
    let filtered = questions.filter(q => quizConfig.level === 'all' || q.level === quizConfig.level);
    // If not enough questions, just use all
    if (filtered.length < 1) filtered = questions;
    
    // Shuffle
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, quizConfig.amount);
    
    setQuestions(selected);
    setCurrentQuestion(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setGameState('playing');
  };

  const generateAIQuestions = async () => {
      setLoadingAI(true);
      const prompt = `Generate 5 multiple choice questions about Adobe Lightroom and Photography in Khmer language. 
      Return a JSON array of objects with this structure: 
      [{ "id": number, "question": "string", "options": ["string", "string", "string", "string"], "correct": number (0-3), "level": "advanced" or "beginner" }]`;
      
      const newQuestions = await callGemini(prompt, "You are a quiz generator.", true);
      
      if (newQuestions && Array.isArray(newQuestions)) {
          setQuestions(newQuestions); // Replace with new AI questions
          setCurrentQuestion(0);
          setScore(0);
          setIsAnswered(false);
          setSelectedOption(null);
          setGameState('playing');
      }
      setLoadingAI(false);
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

  const resetQuiz = () => { setGameState('menu'); setScore(0); setIsAnswered(false); setSelectedOption(null); setQuestions(initialQuestionBank); };

  if (gameState === 'menu') return <div className="bg-[#1e293b] p-8 text-center rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto"><Award className="w-20 h-20 text-blue-500 mx-auto mb-6 drop-shadow-lg" /><h2 className="text-3xl font-bold text-white font-khmer mb-2">ការធ្វើតេស្តសមត្ថភាព</h2><p className="text-gray-400 font-khmer mb-8">សាកល្បងចំណេះដឹងរបស់អ្នកអំពី Lightroom</p><div className="space-y-6"><div className="flex justify-center gap-2 bg-[#0f172a] p-1 rounded-xl w-fit mx-auto"><button onClick={() => setQuizConfig({...quizConfig, level: 'beginner'})} className={`px-6 py-2.5 rounded-lg font-khmer text-sm transition-all ${quizConfig.level==='beginner'?'bg-blue-600 text-white shadow-lg':'text-gray-400 hover:text-white'}`}>មូលដ្ឋាន</button><button onClick={() => setQuizConfig({...quizConfig, level: 'advanced'})} className={`px-6 py-2.5 rounded-lg font-khmer text-sm transition-all ${quizConfig.level==='advanced'?'bg-blue-600 text-white shadow-lg':'text-gray-400 hover:text-white'}`}>កម្រិតខ្ពស់</button></div><div className="flex justify-center gap-2 items-center"><span className="text-gray-400 text-sm font-khmer mr-2">ចំនួន:</span>{[5, 10, 15].map(num => (<button key={num} onClick={() => setQuizConfig({...quizConfig, amount: num})} className={`w-10 h-10 rounded-lg font-bold transition-all ${quizConfig.amount === num ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-[#0f172a] text-gray-400 border border-gray-700 hover:border-gray-500'}`}>{num}</button>))}</div>
  <div className="flex gap-2 flex-col">
      <button onClick={startQuiz} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold font-khmer shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1">ចាប់ផ្ដើមសំណួរ</button>
      <button onClick={generateAIQuestions} disabled={loadingAI} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold font-khmer shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
          {loadingAI ? <Loader2 className="animate-spin"/> : <Sparkles size={18} />} បង្កើតសំណួរថ្មីជាមួយ AI
      </button>
  </div>
  </div></div>;
  
  if (gameState === 'result') {
      const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      return <div className="bg-[#1e293b] p-8 text-center rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto"><div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="60" stroke="#334155" strokeWidth="8" fill="none" /><circle cx="64" cy="64" r="60" stroke={percentage > 70 ? "#22c55e" : percentage > 40 ? "#eab308" : "#ef4444"} strokeWidth="8" fill="none" strokeDasharray={377} strokeDashoffset={377 - (377 * percentage) / 100} className="transition-all duration-1000 ease-out" /></svg><div className="absolute text-3xl font-bold text-white">{percentage}%</div></div><h2 className="text-2xl font-bold text-white font-khmer mb-2">{percentage > 80 ? "អស្ចារ្យណាស់!" : "ព្យាយាមទៀត!"}</h2><p className="text-gray-400 font-khmer mb-8">ពិន្ទុរបស់អ្នក: <span className="text-white font-bold">{score}</span> / {questions.length}</p><button onClick={resetQuiz} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-khmer transition-all">សាកល្បងម្តងទៀត</button></div>;
  }

  const q = questions[currentQuestion];
  if (!q) return <div className="text-white text-center">No questions available.</div>;

  return (
    <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-800 shadow-2xl max-w-2xl mx-auto"><div className="flex justify-between mb-6"><span className="text-sm font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">សំណួរ {currentQuestion + 1}/{questions.length}</span><span className="text-xs text-gray-500 uppercase tracking-wider mt-1">{q.level || 'General'}</span></div><h3 className="text-xl md:text-2xl font-bold text-white mb-8 font-khmer leading-relaxed">{q.question}</h3><div className="grid gap-3">{q.options.map((opt, i) => <button key={i} onClick={() => handleAnswerOptionClick(i)} className={`p-4 text-left rounded-xl border transition-all duration-200 font-khmer text-sm ${isAnswered ? (i === q.correct ? 'bg-green-500/20 border-green-500/50 text-green-200' : (i === selectedOption ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-[#0f172a] border-gray-800 text-gray-400 opacity-50')) : 'bg-[#0f172a] border-gray-700 text-gray-200 hover:bg-[#334155] hover:border-gray-500'}`}>{opt}</button>)}</div>{isAnswered && <div className="mt-8 flex justify-end"><button onClick={handleNextQuestion} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-khmer shadow-lg transition-all flex items-center gap-2">បន្ទាប់ <ChevronRight size={18}/></button></div>}</div>
  );
};

// Helper for grading icon
const CircleIcon = ({color}) => <div className={`w-3 h-3 rounded-full bg-${color}-500 inline-block`}></div>;

const PresetGenerator = ({ isOnline }) => {
    const [styleInput, setStyleInput] = useState('');
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const popularStyles = ["Teal & Orange", "Dark Moody", "Bright & Airy", "Vintage Film", "Cyberpunk", "Golden Hour", "Soft Pastel", "Urban Grey", "Black & White", "HDR Landscape"];

    const generateRecipe = async (styleOverride = null) => {
        const style = styleOverride || styleInput;
        if (!style.trim()) return;
        setLoading(true);
        
        // Use Gemini to generate the recipe
        const prompt = `Create a Lightroom preset recipe for the style: "${style}". 
        Return strictly valid JSON with this structure: 
        { 
          "basic": { "Exposure": number (-5 to 5), "Contrast": number (-100 to 100), "Highlights": number, "Shadows": number, "Whites": number, "Blacks": number, "Temp": number, "Tint": number, "Vibrance": number, "Saturation": number }, 
          "detail": { "Sharpening": number (0-150), "Noise": number (0-100), "ColorNoise": number }, 
          "effects": { "Grain": number (0-100) }, 
          "curve": { "RGB": string ("S-Curve", "Linear", "Matte", "High Contrast", "Faded") }, 
          "colorMix": [array of 8 objects with "color" (Red, Orange, Yellow, Green, Aqua, Blue, Purple, Magenta), "h", "s", "l"], 
          "grading": { "Shadows": { "h": number, "s": number, "l": number }, "Midtones": { "h", "s", "l" }, "Highlights": { "h", "s", "l" }, "Blending": number, "Balance": number } 
        }`;
        
        const systemPrompt = "You are an expert Lightroom photo editor. Generate high-quality JSON presets.";
        const data = await callGemini(prompt, systemPrompt, true);

        if (data) {
            setRecipe(data);
        } else {
            // Fallback to local logic if API fails
             if (style.toLowerCase().includes('teal')) setRecipe(PRESET_DB["teal & orange"]);
             else setRecipe(PRESET_DB["teal & orange"]); // Default fallback
        }
        
        if (styleOverride) setStyleInput(styleOverride);
        setLoading(false);
    };

    const handleExport = () => { if (recipe) generateXMP(recipe, styleInput || "Preset"); };
    
    // --- Slider UI Helper ---
    const Slider = ({ label, value, min = -100, max = 100 }) => (
        <div className="mb-3">
            <div className="flex justify-between text-[11px] text-gray-400 font-mono mb-1.5 uppercase tracking-wider">
                <span>{label}</span>
                <span className={value > 0 ? "text-blue-400" : value < 0 ? "text-red-400" : "text-gray-300"}>{value > 0 ? `+${value}` : value}</span>
            </div>
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={`absolute top-0 bottom-0 ${value === 0 ? 'hidden' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
                     style={{
                         left: value < 0 ? `${50 + (value / (max - min)) * 100}%` : '50%',
                         width: `${Math.abs(value) / (max - min) * 100}%`
                     }}
                />
                <div className="absolute top-0 bottom-0 w-0.5 bg-gray-500 left-1/2 -translate-x-1/2 opacity-50"></div>
            </div>
        </div>
    );

    return (
         <div className="bg-[#1e293b] rounded-2xl border border-gray-800 flex flex-col h-full max-w-4xl mx-auto overflow-hidden shadow-2xl">
            <div className="bg-[#0f172a] p-5 border-b border-gray-800"><h3 className="font-bold font-khmer text-white flex items-center gap-2 text-lg"><Sliders className="text-purple-400 w-6 h-6" /> អ្នកបង្កើតរូបមន្ត AI ✨</h3></div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="flex gap-3"><input value={styleInput} onChange={(e) => setStyleInput(e.target.value)} placeholder="បញ្ចូលរចនាប័ទ្ម (ឧ. Cyberpunk, Soft Wedding)..." className="flex-1 bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-khmer text-sm" /><button onClick={() => generateRecipe()} disabled={loading} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold font-khmer disabled:opacity-50 shadow-lg">{loading ? <Loader2 className="animate-spin" /> : 'បង្កើត ✨'}</button></div>
                <div className="flex flex-wrap gap-2">{popularStyles.map(s => <button key={s} onClick={() => generateRecipe(s)} className="px-4 py-2 bg-[#0f172a] border border-gray-700 hover:border-purple-500 hover:bg-[#334155] rounded-full text-xs text-gray-300 transition-all font-medium">{s}</button>)}</div>
                {recipe && <div className="bg-[#0f172a] rounded-2xl p-6 border border-gray-800 animate-fade-in-down shadow-inner">
                    <button onClick={handleExport} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mb-8 shadow-lg font-khmer tracking-wide"><Download size={18} /> ទាញយក XMP (Export)</button>
                    
                    {/* NEW LAYOUT: Light & Curve on Top Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                         <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-gray-800">
                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 pb-2 border-b border-gray-700"><Sun size={14} className="text-orange-400"/> Light & Color</h5>
                            <Slider label="Exposure" value={Math.round(recipe.basic.Exposure * 50)} /> 
                            <Slider label="Contrast" value={recipe.basic.Contrast} />
                            <Slider label="Highlights" value={recipe.basic.Highlights} />
                            <Slider label="Shadows" value={recipe.basic.Shadows} />
                            <Slider label="Whites" value={recipe.basic.Whites} />
                            <Slider label="Blacks" value={recipe.basic.Blacks} />
                            
                             <div className="mt-6 pt-4 border-t border-gray-700">
                                <div className="grid grid-cols-2 gap-x-6">
                                    <Slider label="Temp" value={recipe.basic.Temp} />
                                    <Slider label="Tint" value={recipe.basic.Tint} />
                                    <Slider label="Vibrance" value={recipe.basic.Vibrance} />
                                    <Slider label="Saturation" value={recipe.basic.Saturation} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                             <h5 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 pb-2 border-b border-gray-700"><TrendingUp size={14} className="text-green-400"/> Curve</h5>
                             <div className="flex-1 flex items-center justify-center"><CurveVisualizer type={recipe.curve.RGB} /></div>
                        </div>
                    </div>

                    {/* Color Mix Grid */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <h5 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Palette size={14} className="text-pink-400"/> Color Mix</h5>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
                            {recipe.colorMix.map((c) => (
                                <div key={c.color} className="flex justify-between items-center bg-[#1e293b] p-2 rounded-lg border border-gray-700">
                                    <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${c.color === 'Red' ? 'bg-red-500' : c.color === 'Green' ? 'bg-green-500' : c.color === 'Blue' ? 'bg-blue-500' : 'bg-gray-500'}`}></div><span className="font-bold text-gray-300">{c.color}</span></div>
                                    <div className="flex flex-col text-gray-500 text-[8px]"><span>H {c.h}</span><span>S {c.s}</span><span>L {c.l}</span></div>
                                </div>
                            ))}
                         </div>
                    </div>

                     {/* Grading */}
                     <div className="mt-6 pt-6 border-t border-gray-800">
                        <h5 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><CircleIcon color="purple"/> Color Grading</h5>
                        <div className="grid grid-cols-3 gap-6">
                            <ColorWheel h={recipe.grading.Shadows.h} s={recipe.grading.Shadows.s} l={recipe.grading.Shadows.l} label="Shadows" />
                            <ColorWheel h={recipe.grading.Midtones.h} s={recipe.grading.Midtones.s} l={recipe.grading.Midtones.l} label="Midtones" />
                            <ColorWheel h={recipe.grading.Highlights.h} s={recipe.grading.Highlights.s} l={recipe.grading.Highlights.l} label="Highlights" />
                        </div>
                    </div>
                </div>}
            </div>
        </div>
    );
};

const ChatBot = ({ isOnline }) => {
  const [messages, setMessages] = useState([{ role: 'model', text: 'សួស្ដី! ខ្ញុំជាគ្រូជំនួយ AI។ អ្នកអាចសួរខ្ញុំអំពីរបៀបកែរូប ឬអោយខ្ញុំណែនាំ Setting។' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const suggestedQuestionsPool = ["តើ Dehaze ប្រើសម្រាប់អ្វី?", "ចង់កែរូបបែប Vintage", "រូបងងឹតពេក ធ្វើម៉េច?", "សុំរូបមន្តកែរូបបែប Cinematic", "របៀបធ្វើអោយស្បែកស?", "កែរូបថតពេលយប់អោយស្អាត", "របៀបដាក់ពណ៌ Teal & Orange", "ពន្យល់ពី Curves", "តើ Grain ជួយអ្វីខ្លះ?", "របៀបកែរូប Portrait អោយស្អាត"];
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const shuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 3));
  }, []);

  const randomizeSuggestions = () => {
    const shuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 3));
  };

  const handleSend = async (text = null) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    const systemPrompt = "You are a friendly, expert Lightroom and photography assistant speaking Khmer. Your answers should be helpful, concise, and related to photo editing. When suggesting settings, format the response as a clean list with bullet points and provide specific numerical values (e.g., • Exposure: +0.20) for better readability.";
    let reply = await callGemini(msg, systemPrompt);
    
    if (!reply) {
        // Simple fallback check
        if (msg.includes('preset')) reply = "សុំទោស ខ្ញុំមិនអាចភ្ជាប់ទៅកាន់ AI បានទេ។ សូមសាកល្បងមុខងារ 'បង្កើតរូបមន្ត' ជំនួសវិញ។";
        else reply = "សុំទោស មានបញ្ហាបច្ចេកទេសក្នុងការភ្ជាប់ទៅកាន់ AI។";
    }

    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setLoading(false);
  };
  
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col h-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-gray-800 flex items-center space-x-3"><div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-purple-500/20"><Bot className="w-5 h-5 text-white" /></div><div><h3 className="font-bold text-white font-khmer">គ្រូជំនួយ AI</h3><p className="text-xs text-blue-200 font-khmer">Powered by Gemini ✨</p></div></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f172a]">{messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-khmer leading-relaxed shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] text-gray-200 rounded-bl-none border border-gray-700'}`}>{m.text}</div></div>)}
        {loading && <div className="flex justify-start"><div className="p-3.5 rounded-2xl bg-[#1e293b] border border-gray-700 rounded-bl-none"><Loader2 className="w-4 h-4 text-purple-400 animate-spin" /></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-[#1e293b] border-t border-gray-800">
          <div className="flex gap-2 items-center mb-3"><button onClick={randomizeSuggestions} className="p-1.5 bg-[#0f172a] hover:bg-[#334155] rounded-full text-gray-400 hover:text-white transition-all"><RefreshCw className="w-3 h-3" /></button><div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{suggestions.map((q, i) => <button key={i} onClick={() => handleSend(q)} className="whitespace-nowrap px-3 py-1.5 bg-[#0f172a] hover:bg-[#334155] hover:border-blue-500 rounded-full text-xs text-gray-300 border border-gray-700 transition-all font-khmer">{q}</button>)}</div></div>
          <div className="flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="សួរអ្វីមួយ..." className="flex-1 bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-khmer transition-colors" /><button onClick={() => handleSend()} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-3 rounded-xl text-white shadow-lg disabled:opacity-50"><Send size={18}/></button></div>
      </div>
    </div>
  );
};

const AIAssistant = ({ isOnline }) => {
    const [mode, setMode] = useState('chat');
    return (
        <div className="h-[75vh] min-h-[600px] flex flex-col">
            <div className="flex justify-center mb-6 bg-[#0f172a] p-1.5 rounded-xl self-center border border-gray-800 shadow-md"><button onClick={() => setMode('chat')} className={`px-6 py-2 rounded-lg text-sm font-khmer transition-all ${mode === 'chat' ? 'bg-[#1e293b] text-white shadow-md border border-gray-700' : 'text-gray-400 hover:text-white'}`}>គ្រូជំនួយ AI</button><button onClick={() => setMode('preset')} className={`px-6 py-2 rounded-lg text-sm font-khmer transition-all ${mode === 'preset' ? 'bg-[#1e293b] text-white shadow-md border border-gray-700' : 'text-gray-400 hover:text-white'}`}>បង្កើតរូបមន្ត AI</button></div>
            <div className="flex-1 overflow-hidden">{mode === 'chat' ? <ChatBot isOnline={isOnline} /> : <PresetGenerator isOnline={isOnline} />}</div>
        </div>
    );
};

// --- APP COMPONENT (LAST) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('learn');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const toggleSection = (id) => setExpandedSection(prev => prev === id ? null : id);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans pb-24 md:pb-0 selection:bg-blue-500/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&family=Inter:wght@400;500;600;700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {expandedLesson && <LessonModal lesson={lessonsData.find(l => l.id === expandedLesson)} onClose={() => setExpandedLesson(null)} />}
      <main className="max-w-6xl mx-auto p-4 pt-8 md:p-8">
        <div className="animate-fade-in-down">
          {activeTab === 'learn' && (<div className="space-y-8"><div className="text-center mb-8"><h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3 font-khmer">វគ្គសិក្សា Lightroom</h2><p className="text-gray-400 font-khmer max-w-lg mx-auto">រៀនពីមូលដ្ឋានគ្រឹះដល់កម្រិតខ្ពស់នៃការកែរូបភាព។</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{lessonsData.map(lesson => <LessonCard key={lesson.id} lesson={lesson} onClick={() => setExpandedLesson(lesson.id)} />)}</div><TipsSection isExpanded={expandedSection === 'tips'} onToggle={() => toggleSection('tips')} isOnline={isOnline} /><ContactSection /></div>)}
          {activeTab === 'quiz' && <Quiz isOnline={isOnline} />}
          {activeTab === 'ai' && <AIAssistant isOnline={isOnline} />}
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-md border-t border-gray-800 pb-safe z-40 flex justify-around p-2">
         <button onClick={() => setActiveTab('learn')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'learn' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><BookOpen size={20}/><span className="text-[10px] font-khmer mt-1">មេរៀន</span></button>
         <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'quiz' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Award size={20}/><span className="text-[10px] font-khmer mt-1">តេស្ត</span></button>
         <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'ai' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Sparkles size={20}/><span className="text-[10px] font-khmer mt-1">គ្រូ AI</span></button>
      </div>
    </div>
  );
}