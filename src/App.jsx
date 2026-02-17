import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Aperture, Droplet, Sliders, ChevronRight, CheckCircle, XCircle, 
  BookOpen, Award, PlayCircle, MessageCircle, Send, Sparkles, Loader2, 
  Bot, Settings, HelpCircle, BarChart, Zap, Triangle, Touchpad, 
  AlertTriangle, RotateCcw, Globe, RefreshCw, Layout, Image as ImageIcon, 
  Lightbulb, Palette, X, WifiOff, Download, TrendingUp, Share2, Clipboard, Camera,
  Layers, Crop, Save, ScanFace, Facebook, Upload, ImageDown, FileJson,
  Monitor, Smartphone, ArrowLeft, Minus, Plus, ChevronDown, ChevronUp
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION & UTILS
// ==========================================

let apiKey = ""; 
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  }
} catch (e) {
  apiKey = ""; 
}

const responseCache = {};

const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
  const cacheKey = prompt + (jsonMode ? "_json" : "");
  if (responseCache[cacheKey]) return responseCache[cacheKey];
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
  };

  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    let result = text;
    if (jsonMode && text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(text);
    }
    responseCache[cacheKey] = result;
    return result;
  } catch (error) { console.error("API Error:", error); return null; }
};

// ==========================================
// 2. FULL DATASETS
// ==========================================

const lessonsData = [
  { id: 'light', title: 'ពន្លឺ (Light)', icon: <Sun className="w-5 h-5 text-amber-400" />, description: 'ការកែសម្រួលពន្លឺមូលដ្ឋាន', content: [{ tool: 'Exposure', khmer: 'ការប៉ះពន្លឺ', desc: 'កំណត់ពន្លឺរួមនៃរូបភាព។', tip: 'ចាប់ផ្តើមពីនេះមុនគេ។' }, { tool: 'Contrast', khmer: 'ភាពផ្ទុយ', desc: 'គម្លាតរវាងកន្លែងភ្លឺនិងងងឹត។', tip: 'កុំអោយលើស +50។' }, { tool: 'Highlights', khmer: 'ផ្នែកភ្លឺ', desc: 'គ្រប់គ្រងតំបន់ភ្លឺខ្លាំង។', tip: 'បន្ថយដើម្បីសង្គ្រោះមេឃ។' }, { tool: 'Shadows', khmer: 'ផ្នែកងងឹត', desc: 'គ្រប់គ្រងតំបន់ក្នុងម្លប់។', tip: 'តម្លើងសម្រាប់រូប Backlit។' }, { tool: 'Whites', khmer: 'ពណ៌ស', desc: 'កំណត់ចំណុចសបំផុត។', tip: 'Alt+Drag ដើម្បីមើល Clipping។' }, { tool: 'Blacks', khmer: 'ពណ៌ខ្មៅ', desc: 'កំណត់ចំណុចខ្មៅបំផុត។', tip: 'បន្ថយបន្តិចអោយរូបមានជម្រៅ។' }] },
  { id: 'color', title: 'ពណ៌ (Color)', icon: <Droplet className="w-5 h-5 text-cyan-400" />, description: 'ការកែសម្រួលពណ៌ និង HSL', content: [{ tool: 'Temp', khmer: 'សីតុណ្ហភាព', desc: 'កែពណ៌លឿង/ខៀវ។', tip: 'ថតពេលថ្ងៃលិចអោយជាប់លឿង។' }, { tool: 'Tint', khmer: 'ពណ៌លាំ', desc: 'កែពណ៌បៃតង/ស្វាយ។', tip: 'កែពណ៌ស្បែកដែលជាប់បៃតង។' }, { tool: 'Vibrance', khmer: 'ភាពរស់រវើក', desc: 'បង្កើនពណ៌ដែលស្លេក។', tip: 'ល្អសម្រាប់ Portrait។' }, { tool: 'Saturation', khmer: 'កម្រិតពណ៌', desc: 'បង្កើនគ្រប់ពណ៌។', tip: 'ប្រយ័ត្នស្បែកក្រហម។' }, { tool: 'Color Mix', khmer: 'លាយពណ៌', desc: 'HSL (Hue, Sat, Lum) សម្រាប់ពណ៌នីមួយៗ។', tip: 'Orange Lum សម្រាប់ស្បែកស។' }] },
  { id: 'effects', title: 'បែបផែន (Effects)', icon: <Aperture className="w-5 h-5 text-purple-400" />, description: 'Texture, Clarity, Dehaze', content: [{ tool: 'Texture', khmer: 'វាយនភាព', desc: 'កែផ្ទៃអោយគ្រើមឬរលោង។', tip: '-10 សម្រាប់ស្បែកមុខ។' }, { tool: 'Clarity', khmer: 'ភាពច្បាស់', desc: 'Contrast នៅកណ្តាល។', tip: 'កុំប្រើច្រើនលើមុខមនុស្ស។' }, { tool: 'Dehaze', khmer: 'កាត់អ័ព្ទ', desc: 'លុបឬបន្ថែមអ័ព្ទ។', tip: 'ប្រើពេលមេឃស្រអាប់។' }, { tool: 'Vignette', khmer: 'គែមងងឹត', desc: 'ធ្វើអោយគែមរូបងងឹត។', tip: 'ជួយផ្តោតអារម្មណ៍កណ្តាល។' }] },
  { id: 'detail', title: 'ភាពលម្អិត (Detail)', icon: <Triangle className="w-5 h-5 text-pink-400" />, description: 'Sharpening & Noise', content: [{ tool: 'Sharpening', khmer: 'ភាពមុត', desc: 'ធ្វើអោយរូបច្បាស់។', tip: 'ប្រើ Masking ជាមួយ។' }, { tool: 'Noise Reduction', khmer: 'កាត់បន្ថយគ្រាប់', desc: 'លុបគ្រាប់ Noise។', tip: 'សម្រាប់រូបថតយប់។' }] },
  { id: 'optics', title: 'Optics', icon: <Crop className="w-5 h-5 text-green-400" />, description: 'Lens Corrections', content: [{ tool: 'Lens Profile', khmer: 'កែកែវថត', desc: 'កែ Distortion របស់លែន។', tip: 'គួរតែបើកជានិច្ច។' }, { tool: 'Chromatic', khmer: 'ពណ៌តាមគែម', desc: 'លុបពណ៌ស្វាយតាមគែម។', tip: 'ប្រើលើរូប Contrast ខ្ពស់។' }] },
  { id: 'geometry', title: 'Geometry', icon: <Layout className="w-5 h-5 text-blue-400" />, description: 'តម្រង់រូប', content: [{ tool: 'Upright', khmer: 'តម្រង់', desc: 'ធ្វើអោយអគារត្រង់។', tip: 'ប្រើ Auto សម្រាប់លទ្ធផលលឿន។' }] }
];

const PRESET_DB = {
    "teal & orange": { basic: { Exposure: 0.1, Contrast: 20, Highlights: -40, Shadows: 30, Whites: 15, Blacks: -20, Temp: 5, Tint: -5, Vibrance: 25, Saturation: -10, Clarity: 10, Dehaze: 5, Vignette: -15 }, grading: { Shadows: { h: 210, s: 20, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 35, s: 20, l: 0 }, Blending: 50, Balance: 0 } },
    "dark moody": { basic: { Exposure: -0.2, Contrast: 30, Highlights: -50, Shadows: -10, Whites: -30, Blacks: -10, Temp: -5, Vibrance: -10, Saturation: -20, Clarity: 15, Vignette: -30 }, grading: { Shadows: { h: 220, s: 10, l: -10 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 40, s: 5, l: 0 } } },
    "bright & airy": { basic: { Exposure: 0.4, Contrast: 10, Highlights: -30, Shadows: 50, Whites: 30, Blacks: 20, Temp: 5, Vibrance: 30, Saturation: 0, Clarity: -10 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 50, s: 5, l: 0 } } },
    "vintage": { basic: { Exposure: 0.05, Contrast: 10, Highlights: -20, Shadows: 20, Whites: -10, Blacks: 20, Temp: 10, Saturation: -15, Grain: 40, Vignette: -20 }, grading: { Shadows: { h: 40, s: 10, l: 0 }, Highlights: { h: 200, s: 5, l: 0 } } },
    "cyberpunk": { basic: { Exposure: 0.1, Contrast: 20, Highlights: 10, Shadows: 10, Temp: -15, Tint: 20, Vibrance: 40, Dehaze: 15 }, grading: { Shadows: { h: 260, s: 30, l: -5 }, Highlights: { h: 320, s: 20, l: 0 } } },
    "golden hour": { basic: { Exposure: 0.1, Contrast: 15, Highlights: -20, Shadows: 20, Temp: 15, Tint: 5, Vibrance: 20, Saturation: 5 }, grading: { Shadows: { h: 40, s: 15, l: 0 }, Highlights: { h: 45, s: 20, l: 0 } } },
    "soft pastel": { basic: { Exposure: 0.2, Contrast: -10, Highlights: -30, Shadows: 40, Temp: 0, Tint: 5, Vibrance: 30, Saturation: -5, Clarity: -15 }, grading: { Shadows: { h: 220, s: 10, l: 0 }, Highlights: { h: 40, s: 10, l: 0 } } },
    "urban grey": { basic: { Contrast: 25, Highlights: -30, Shadows: 20, Temp: -5, Vibrance: -20, Saturation: -30, Clarity: 25, Dehaze: 10, Vignette: -20 }, grading: { Shadows: { h: 210, s: 10, l: -5 } } },
    "black & white": { basic: { Contrast: 30, Highlights: -20, Shadows: 20, Whites: 20, Blacks: -20, Saturation: -100, Clarity: 20, Vignette: -15 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } } },
    "hdr landscape": { basic: { Contrast: 10, Highlights: -80, Shadows: 80, Whites: 20, Blacks: -20, Vibrance: 40, Clarity: 30, Dehaze: 20 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 50, s: 10, l: 0 } } },
    "matte black": { basic: { Contrast: 20, Highlights: -20, Shadows: 10, Whites: -10, Blacks: 30, Saturation: -10, Vignette: -20 }, grading: { Shadows: { h: 210, s: 5, l: 0 } } },
    "cinematic warm": { basic: { Exposure: 0.05, Contrast: 10, Highlights: -30, Shadows: 20, Temp: 10, Vibrance: 15 }, grading: { Shadows: { h: 190, s: 15, l: -5 }, Highlights: { h: 40, s: 20, l: 0 } } },
    "cool blue": { basic: { Contrast: 15, Highlights: 10, Shadows: 10, Temp: -20, Vibrance: 20, Clarity: 15 }, grading: { Shadows: { h: 220, s: 20, l: -5 }, Highlights: { h: 200, s: 10, l: 0 } } },
    "forest green": { basic: { Exposure: -0.1, Contrast: 20, Highlights: -40, Shadows: 20, Temp: 5, Tint: -15, Vibrance: 30 }, grading: { Shadows: { h: 120, s: 15, l: -5 }, Highlights: { h: 50, s: 10, l: 0 } } },
    "sunset lover": { basic: { Exposure: 0.1, Contrast: 25, Highlights: -30, Shadows: 30, Temp: 20, Tint: 10, Vibrance: 40 }, grading: { Shadows: { h: 280, s: 20, l: 0 }, Highlights: { h: 45, s: 30, l: 0 } } },
    "portrait clean": { basic: { Exposure: 0.1, Contrast: 10, Highlights: -20, Shadows: 20, Whites: 10, Blacks: -5, Vibrance: 10, Saturation: -5, Clarity: -5 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 30, s: 5, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } } },
    "desaturated": { basic: { Contrast: 20, Highlights: -10, Shadows: 10, Saturation: -40, Clarity: 10 }, grading: { Shadows: { h: 220, s: 5, l: 0 } } },
    "vivid pop": { basic: { Exposure: 0.1, Contrast: 30, Highlights: -20, Shadows: 20, Vibrance: 40, Saturation: 10, Clarity: 15 }, grading: { } },
    "sepia tone": { basic: { Contrast: 15, Highlights: -10, Shadows: 10, Temp: 30, Tint: 10, Saturation: -20, Vignette: -20 }, grading: { Shadows: { h: 40, s: 20, l: 0 }, Highlights: { h: 45, s: 10, l: 0 } } },
    "high contrast": { basic: { Contrast: 60, Highlights: -30, Shadows: 30, Whites: 30, Blacks: -30, Vibrance: 10, Clarity: 20 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } } }
};

const QA_DB = {
    "exposure": "សួស្ដី! 👋\n**Exposure (ការប៉ះពន្លឺ)** គឺជាឧបករណ៍សម្រាប់កំណត់ពន្លឺរួមនៃរូបភាព។\n👉 **របៀបប្រើ:**\n• អូសទៅស្តាំ (+): ធ្វើឱ្យរូបភាពភ្លឺ។\n• អូសទៅឆ្វេង (-): ធ្វើឱ្យរូបភាពងងឹត។\n\n💡 **គន្លឹះ:** គួរកែ Exposure ជាមុនគេបង្អស់!",
    "contrast": "សួស្ដី! 👋\n**Contrast (ភាពផ្ទុយ)** កំណត់ភាពដាច់ស្រឡះរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។\n💡 **ការណែនាំ:**\n• **Contrast ខ្ពស់:** ធ្វើឱ្យរូបដិត (Pop)។\n• **Contrast ទាប:** ធ្វើឱ្យរូបស្រាល (Soft)។",
    "highlight": "**Highlights** គ្រប់គ្រងតំបន់ដែល **ភ្លឺខ្លាំងបំផុត** (ដូចជាមេឃ)។ បន្ថយ (-100) ដើម្បីសង្គ្រោះពពក។",
    "shadow": "**Shadows** គ្រប់គ្រងតំបន់ងងឹត។ តម្លើង (+) ដើម្បីមើលឃើញព័ត៌មានក្នុងម្លប់។",
    "white": "**Whites** កំណត់ចំណុចសដាច់ខាត។ តម្លើងបន្តិច (+10) ឱ្យរូបភ្លឺថ្លា។",
    "black": "**Blacks** កំណត់ចំណុចខ្មៅដាច់ខាត។ បន្ថយបន្តិច (-10) ឱ្យរូបមានជម្រៅ។",
    "ស្បែកស": "រូបមន្តកែ **ស្បែកស**:\n1. ចូល Color Mix > Orange។\n2. Luminance (+20)។\n3. Saturation (-10)។",
    "portrait": "គន្លឹះ **Portrait**:\n• Vibrance (+) ជំនួស Saturation។\n• Texture (-15) ឱ្យស្បែកម៉ត់។",
    "teal": "**Teal & Orange**:\n• Shadows: ដាក់ពណ៌ Teal (Hue 210)។\n• Highlights: ដាក់ពណ៌ Orange (Hue 35)។",
    "dehaze": "**Dehaze**:\n• (+) កាត់អ័ព្ទ, មេឃដិត។\n• (-) បន្ថែមអ័ព្ទ (Dreamy)។",
    "យប់": "រូបថត **យប់**:\n• Highlights (-50)។\n• Shadows (+30)។\n• Noise Reduction (+30)។",
    "vintage": "**Vintage**:\n• Lift Blacks (Curve)។\n• Grain (+30)។\n• Saturation (-20)។",
    "curves": "**Tone Curve**:\n• S-Curve: បង្កើន Contrast។\n• Matte: លើកចំណុចខ្មៅឡើងលើ។",
    "grain": "**Grain** បន្ថែមគ្រាប់តូចៗបង្កើតអារម្មណ៍ Film និងបិទបាំង Noise។",
    "ងងឹត": "រូប **ងងឹត**:\n• បង្កើន Exposure និង Shadows។\n• បន្ថយ Contrast បន្តិច។",
    "មេឃ": "**មេឃ**:\n• Highlights (-100)។\n• Blue HSL: Sat (+), Lum (-)។",
    "ទេសភាព": "**Landscape**:\n• Dehaze (+20)។\n• Clarity (+15)។\n• Vibrance (+30)។",
    "vibrance": "**Vibrance** vs **Saturation**:\n• Vibrance: ឆ្លាតវៃ (ការពារស្បែក)។\n• Saturation: ដិតទាំងអស់។",
    "អាហារ": "**Food**:\n• WB: ពណ៌ចានស។\n• Texture: បង្កើនអោយឃើញរសជាតិ។",
    "street": "**Street**:\n• Contrast & Clarity ខ្ពស់។\n• សាកល្បងសខ្មៅ (B&W)។"
};

const TIPS_LIST = [
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើម។", "ចុចសង្កត់លើរូបដើម្បីមើល Before/After។", "ចុចពីរដងលើ Slider ដើម្បី Reset។", 
    "ប្រើម្រាមដៃពីរដើម្បីមើល Clipping។", "Export ជា DNG ដើម្បីចែករំលែក Preset។", "ប្រើ Grid ពេលថត។",
    "ដាក់ Rating លើរូបដែលចូលចិត្ត។", "ប្រើ Color Noise Reduction សម្រាប់រូបយប់។", "ប្រើ Calibration (Blue Primary) សម្រាប់ស្លឹកឈើ។",
    "កុំប្រើ Clarity ខ្លាំងពេកលើមុខ។", "ប្រើ Radial Gradient បង្កើត Sun Flare។", "បន្ថយ Highlights សង្គ្រោះមេឃ។",
    "តម្លើង Shadows សម្រាប់រូប Backlit។", "ប្រើ Linear Gradient សម្រាប់មេឃងងឹត។", "ប្រើ Healing Brush លុបមនុស្សមិនចង់បាន។",
    "ប្រើ Masking 'Select Subject' កែពន្លឺមនុស្ស។", "ប្រើ Vignette ផ្តោតអារម្មណ៍។", "ប្រើ Geometry 'Upright' តម្រង់អគារ។",
    "ប្រើ Dehaze កាត់អ័ព្ទ។", "ប្រើ Texture សម្រាប់ថ្ម/ឈើ។", "ប្រើ Vibrance សម្រាប់រូបមនុស្ស។",
    "ប្រើ B&W សម្រាប់អារម្មណ៍។", "ប្រើ Split Toning សម្រាប់ដាក់ពណ៌ស្រមោល។", "ប្រើ Tone Curve សម្រាប់ Contrast ល្អ។",
    "ប្រើ Optic Corrections ជានិច្ច។", "ប្រើ Crop កែសមាសភាព។", "ប្រើ Presets ដើម្បីចំណេញពេល។",
    "ប្រើ Versions សាកល្បងស្តាយ។", "ប្រើ Histogram មើលពន្លឺ។", "ចុចចុង Slider (+/-) ដើម្បី Fine Tune។",
    "Blacks -10 ធ្វើអោយរូបដិត។", "Whites +10 ធ្វើអោយរូបថ្លា។"
];

const initialQuestionBank = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    question: i === 0 ? "តើឧបករណ៍មួយណាសម្រាប់កែពន្លឺទូទៅនៃរូបភាព?" : 
              i === 1 ? "តើ Vibrance ខុសពី Saturation យ៉ាងដូចម្តេច?" :
              i === 2 ? "ដើម្បីកែពណ៌មេឃឱ្យដិតស្អាត តើគួរកែពណ៌អ្វីក្នុង HSL?" :
              `សំណួរទី ${i+1}: តើឧបករណ៍មួយណាជួយកែរូបភាពឱ្យកាន់តែស្អាត?`,
    options: i === 0 ? ["Contrast", "Exposure", "Highlights", "Shadows"] :
             i === 1 ? ["វាធ្វើឱ្យពណ៌ទាំងអស់ដិតស្មើគ្នា", "វាការពារពណ៌ស្បែកមិនឱ្យដិតពេក", "វាមិនខុសគ្នាទេ", "វាសម្រាប់តែកែរូបសខ្មៅ"] :
             i === 2 ? ["Green", "Orange", "Blue", "Red"] :
             ["Exposure", "Contrast", "Clarity", "Dehaze"],
    correct: i === 0 ? 1 : i === 1 ? 1 : i === 2 ? 2 : 0,
    level: i < 25 ? "beginner" : "advanced"
}));

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

const getLocalResponse = (prompt) => {
    const lower = prompt.toLowerCase();
    for (let key of Object.keys(QA_DB)) { if (lower.includes(key)) return QA_DB[key]; }
    return null; 
};

const getLocalPreset = (style) => {
    const lower = style.toLowerCase();
    for (let key of Object.keys(PRESET_DB)) { if (lower.includes(key)) return PRESET_DB[key]; }
    return null;
};

const escapeXML = (str) => {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            return c;
        }
    });
};

const generateXMP = (recipe, title) => {
    const basic = recipe.basic || {};
    const colorMix = recipe.colorMix || [];
    const grading = recipe.grading || {};
    const detail = recipe.detail || {};
    const effects = recipe.effects || {};
    const getHSL = (color) => { const c = colorMix.find(item => item.color === color) || {}; return { h: c.h || 0, s: c.s || 0, l: c.l || 0 }; };

    const xmpContent = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c140 79.160451, 2017/05/06-01:08:06">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    crs:Version="14.5" crs:ProcessVersion="11.0"
    crs:Name="${escapeXML(title)}" crs:HasSettings="True" crs:CropConstrainToWarp="0" crs:WhiteBalance="As Shot"
    crs:IncrementalTemperature="${basic.Temp || 0}" crs:IncrementalTint="${basic.Tint || 0}"
    crs:Exposure2012="${basic.Exposure || 0}" crs:Contrast2012="${basic.Contrast || 0}" crs:Highlights2012="${basic.Highlights || 0}" crs:Shadows2012="${basic.Shadows || 0}" crs:Whites2012="${basic.Whites || 0}" crs:Blacks2012="${basic.Blacks || 0}"
    crs:Texture="${basic.Texture || 0}" crs:Clarity2012="${basic.Clarity || 0}" crs:Dehaze="${basic.Dehaze || 0}" crs:Vibrance="${basic.Vibrance || 0}" crs:Saturation="${basic.Saturation || 0}"
    crs:ParametricShadows="0" crs:ParametricDarks="0" crs:ParametricLights="0" crs:ParametricHighlights="0" crs:ParametricShadowSplit="25" crs:ParametricMidtoneSplit="50" crs:ParametricHighlightSplit="75"
    crs:Sharpness="${detail.Sharpening || 40}" crs:SharpenRadius="+1.0" crs:SharpenDetail="25" crs:SharpenEdgeMasking="0"
    crs:LuminanceSmoothing="${detail.Noise || 0}" crs:ColorNoiseReduction="${detail.ColorNoise || 25}"
    crs:HueAdjustmentRed="${getHSL('Red').h}" crs:HueAdjustmentOrange="${getHSL('Orange').h}" crs:HueAdjustmentYellow="${getHSL('Yellow').h}" crs:HueAdjustmentGreen="${getHSL('Green').h}" crs:HueAdjustmentAqua="${getHSL('Aqua').h}" crs:HueAdjustmentBlue="${getHSL('Blue').h}" crs:HueAdjustmentPurple="${getHSL('Purple').h}" crs:HueAdjustmentMagenta="${getHSL('Magenta').h}"
    crs:SaturationAdjustmentRed="${getHSL('Red').s}" crs:SaturationAdjustmentOrange="${getHSL('Orange').s}" crs:SaturationAdjustmentYellow="${getHSL('Yellow').s}" crs:SaturationAdjustmentGreen="${getHSL('Green').s}" crs:SaturationAdjustmentAqua="${getHSL('Aqua').s}" crs:SaturationAdjustmentBlue="${getHSL('Blue').s}" crs:SaturationAdjustmentPurple="${getHSL('Purple').s}" crs:SaturationAdjustmentMagenta="${getHSL('Magenta').s}"
    crs:LuminanceAdjustmentRed="${getHSL('Red').l}" crs:LuminanceAdjustmentOrange="${getHSL('Orange').l}" crs:LuminanceAdjustmentYellow="${getHSL('Yellow').l}" crs:LuminanceAdjustmentGreen="${getHSL('Green').l}" crs:LuminanceAdjustmentAqua="${getHSL('Aqua').l}" crs:LuminanceAdjustmentBlue="${getHSL('Blue').l}" crs:LuminanceAdjustmentPurple="${getHSL('Purple').l}" crs:LuminanceAdjustmentMagenta="${getHSL('Magenta').l}"
    crs:SplitToningShadowHue="${grading.Shadows?.h || 0}" crs:SplitToningShadowSaturation="${grading.Shadows?.s || 0}" crs:SplitToningHighlightHue="${grading.Highlights?.h || 0}" crs:SplitToningHighlightSaturation="${grading.Highlights?.s || 0}" crs:SplitToningBalance="${grading.Balance || 0}"
    crs:ColorGradeMidtoneHue="${grading.Midtones?.h || 0}" crs:ColorGradeMidtoneSat="${grading.Midtones?.s || 0}" crs:ColorGradeMidtoneLum="${grading.Midtones?.l || 0}" crs:ColorGradeShadowLum="${grading.Shadows?.l || 0}" crs:ColorGradeHighlightLum="${grading.Highlights?.l || 0}" crs:ColorGradeBlending="${grading.Blending || 50}" crs:ColorGradeGlobalHue="0" crs:ColorGradeGlobalSat="0" crs:ColorGradeGlobalLum="0"
    crs:GrainAmount="${effects.Grain || 0}" crs:PostCropVignetteAmount="${basic.Vignette || 0}" crs:LensProfileEnable="1">
   <crs:ToneCurvePV2012><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012>
   <crs:ToneCurvePV2012Red><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012Red>
   <crs:ToneCurvePV2012Green><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012Green>
   <crs:ToneCurvePV2012Blue><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012Blue>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
    
    const blob = new Blob([xmpContent.trim()], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_').replace(/&/g, 'and')}.xmp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- COMPONENTS ---

// 1. Color Wheel Component (Interactive)
const ColorWheel = ({ hue, sat, onChange, size = 150 }) => {
    const wheelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const updateColor = (clientX, clientY) => {
        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = clientX - centerX;
        const y = clientY - centerY;
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        const dist = Math.sqrt(x*x + y*y);
        const radius = rect.width / 2;
        let saturation = (dist / radius) * 100;
        if (saturation > 100) saturation = 100;
        onChange(angle, saturation);
    };
    const handleStart = (e) => { setIsDragging(true); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; updateColor(clientX, clientY); };
    const handleMove = (e) => { if (!isDragging) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; updateColor(clientX, clientY); };
    const handleEnd = () => setIsDragging(false);
    const radius = size / 2; const handleDist = (sat / 100) * radius; const handleX = radius + handleDist * Math.cos(hue * Math.PI / 180); const handleY = radius + handleDist * Math.sin(hue * Math.PI / 180);
    return (
        <div className="relative rounded-full overflow-hidden shadow-inner border-2 border-gray-700 mx-auto" style={{ width: size, height: size, background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} ref={wheelRef} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}>
            <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, white, transparent 70%)', opacity: 0.5, pointerEvents: 'none' }}></div>
            <div className="absolute w-4 h-4 bg-white rounded-full border-2 border-black shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: handleX, top: handleY }}></div>
        </div>
    );
};

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : ''} bg-[#0f172a] text-white sticky top-0 z-50 shadow-lg border-b border-gray-800`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('learn')}>
          <div className="w-10 h-10 relative rounded-2xl overflow-hidden shadow-sm flex-shrink-0"><img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" /></div>
          <h1 className="text-xl font-bold font-khmer text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">ម៉ាយឌីហ្សាញ</h1>
        </div>
        <nav className="hidden md:flex space-x-1 bg-[#1e293b] p-1 rounded-xl border border-gray-700 overflow-x-auto">
          {['learn', 'quiz', 'lab', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t ? 'bg-[#334155] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#334155]/50'}`}>
               {t === 'learn' && <BookOpen size={16}/>}{t === 'quiz' && <Award size={16}/>}{t === 'lab' && <Sliders size={16}/>}{t === 'ai' && <Bot size={16}/>}
               <span className="font-khmer text-xs font-bold uppercase hidden md:block">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'គ្រូ AI'}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

// --- DYNAMIC BOTTOM SHEET FOR LESSONS ---
const LessonModal = ({ lesson, onClose }) => {
  const [closing, setClosing] = useState(false);
  const modalRef = useRef(null);
  const dragStartY = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  const handleClose = () => { setClosing(true); setTimeout(onClose, 300); };

  const onTouchStart = (e) => {
    const scrollTop = modalRef.current?.querySelector('.scroll-content')?.scrollTop || 0;
    if (scrollTop <= 0) { dragStartY.current = e.touches[0].clientY; }
  };
  const onTouchMove = (e) => {
    if (dragStartY.current === null) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 0) { setDragOffset(deltaY); if (e.cancelable && deltaY > 10) e.preventDefault(); }
  };
  const onTouchEnd = () => { if (dragOffset > 150) { handleClose(); } else { setDragOffset(0); } dragStartY.current = null; };
  const opacity = 1 - (dragOffset / 500); 

  return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`} style={{ opacity: Math.max(0, opacity) }} onClick={handleClose} />
          <div ref={modalRef} className={`relative w-full max-w-2xl bg-[#1e293b] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] h-[85vh] sm:h-auto transition-transform duration-300 ${closing ? 'translate-y-full' : 'translate-y-0'}`} style={{ transform: `translateY(${closing ? '100%' : `${dragOffset}px`})`, transition: dragOffset > 0 ? 'none' : 'transform 0.3s ease-out' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
             <div className="w-full flex justify-center pt-3 pb-1 shrink-0" onClick={handleClose}><div className="w-12 h-1.5 bg-gray-600 rounded-full"></div></div>
             <div className="bg-[#1e293b] border-b border-gray-800 p-4 pt-2 flex items-center justify-between sticky top-0 z-10 shrink-0 rounded-t-3xl">
                <div className="flex items-center gap-3"><div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">{lesson.icon}</div><h2 className="text-xl font-bold font-khmer text-white">{lesson.title}</h2></div>
                <button onClick={handleClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-300"><ChevronDown className="w-6 h-6" /></button>
             </div>
             <div className="scroll-content flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                {lesson.content.map((item, idx) => (
                    <div key={idx} className="bg-[#334155]/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-2 gap-2"><span className="font-bold text-lg text-blue-400">{item.tool}</span><span className="text-xs font-bold bg-[#0f172a] text-gray-300 px-2 py-1 rounded font-khmer border border-gray-700 whitespace-nowrap">{item.khmer}</span></div>
                        <p className="text-gray-200 text-sm font-khmer leading-relaxed">{item.desc}</p>
                        {item.tip && <div className="mt-3 pt-3 border-t border-gray-700 flex items-start space-x-2"><span className="text-lg">💡</span><p className="text-yellow-400/90 text-sm font-khmer italic leading-relaxed"><span className="font-bold mr-1">គន្លឹះ:</span>{item.tip}</p></div>}
                    </div>
                ))}
             </div>
          </div>
      </div>
  )
};

const LessonCard = ({ lesson, onClick }) => (
    <button onClick={onClick} className="bg-[#1e293b] rounded-xl overflow-hidden border border-gray-800 shadow-md transition-all hover:scale-[1.02] active:scale-95 hover:border-blue-500/50 cursor-pointer h-full flex flex-col group w-full text-left hover:shadow-lg hover:shadow-blue-900/20">
      <div className="p-5 flex items-center justify-between w-full">
        <div className="flex items-center gap-4"><div className="bg-[#0f172a] p-3 rounded-xl shadow-inner border border-gray-800 group-hover:bg-[#1e293b] transition-colors">{lesson.icon}</div><div><h3 className="font-bold text-white text-lg font-khmer">{lesson.title}</h3><p className="text-gray-400 text-xs font-khmer mt-0.5 line-clamp-1">{lesson.description}</p></div></div><div className="bg-[#0f172a] p-2 rounded-full text-blue-400 group-hover:bg-blue-600 group-hover:text-white"><ChevronRight className="w-5 h-5" /></div>
      </div>
    </button>
);

const TipsSection = ({ isExpanded, onToggle }) => {
  const [randomTip, setRandomTip] = useState(null);
  const getTip = () => setRandomTip(TIPS_LIST[Math.floor(Math.random() * TIPS_LIST.length)]);
  return (
    <div className="mt-8">
      <button onClick={onToggle} className="w-full flex items-center justify-between bg-[#1e293b] p-4 rounded-xl border border-gray-800 shadow-sm hover:border-gray-500 transition-all group active:scale-95">
        <div className="flex items-center space-x-3"><div className="bg-blue-900/30 p-2 rounded-lg group-hover:bg-blue-900/50 transition-colors"><PlayCircle className="w-5 h-5 text-blue-400" /></div><h3 className="font-bold text-white text-lg font-khmer">គន្លឹះបន្ថែម (Tips)</h3></div>
        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4 md:col-span-2 relative overflow-hidden backdrop-blur-sm">
             <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white font-khmer flex items-center gap-2 z-10"><Sparkles className="w-4 h-4 text-yellow-400" /> គន្លឹះពិសេស (Pro Tip)</h4><button onClick={getTip} className="z-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full font-khmer transition-all shadow-lg hover:shadow-indigo-500/50">បង្ហាញគន្លឹះ</button></div>
             <p className="text-gray-200 text-sm font-khmer leading-relaxed border-l-2 border-indigo-500 pl-3 mt-2">{randomTip || "ចុចប៊ូតុងខាងលើដើម្បីទទួលបានគន្លឹះកែរូប។"}</p>
          </div>
          <div className="bg-[#1e293b]/80 border border-gray-800 rounded-xl p-4 md:col-span-2">
            <h4 className="font-bold text-white font-khmer mb-3 flex items-center"><Zap className="w-4 h-4 mr-2 text-yellow-400" /> គន្លឹះប្រើកម្មវិធី (Shortcut Tricks)</h4>
            <ul className="space-y-3 text-sm text-gray-300 font-khmer">
              <li className="flex items-start gap-2"><span className="font-bold text-blue-400">1.</span><span><span className="font-bold text-white">ចុចសង្កត់លើរូប៖</span> មើលរូបភាពដើម (Before)។</span></li>
              <li className="flex items-start gap-2"><span className="font-bold text-blue-400">2.</span><span><span className="font-bold text-white">ចុចពីរដងលើ Slider៖</span> ត្រឡប់តម្លៃទៅ 0 (Reset) វិញភ្លាមៗ។</span></li>
              <li className="flex items-start gap-2"><span className="font-bold text-blue-400">3.</span><span><span className="font-bold text-white">ចុចចុងសងខាង (+/-)៖</span> បន្ថែមឬបន្ថយលេខម្ដង ១។</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactSection = () => (
  <div className="mt-8 mb-4 border-t border-gray-800 pt-6"><h3 className="text-center text-gray-400 text-sm font-khmer mb-4">ទំនាក់ទំនង & ស្វែងយល់បន្ថែម</h3><div className="flex justify-center space-x-4"><a href="https://web.facebook.com/mydesignpro" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group"><div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Facebook className="w-5 h-5 text-white" /></div><span className="text-xs text-gray-400 font-khmer mt-1">Facebook</span></a><a href="https://t.me/koymy" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group"><div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Send className="w-5 h-5 text-white" /></div><span className="text-xs text-gray-400 font-khmer mt-1">Telegram</span></a><a href="https://myaffinity.gumroad.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group"><div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Globe className="w-5 h-5 text-white" /></div><span className="text-xs text-gray-400 font-khmer mt-1">Website</span></a></div><p className="text-center text-gray-600 text-xs mt-6 font-khmer">© 2026 My Design. All Right Reserved.</p></div>
);

// --- 4. PHOTO LAB ---
const PhotoLab = () => {
  const [image, setImage] = useState("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80");
  const [mode, setMode] = useState('manual');
  const fileInputRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null); 
  const [gradingTab, setGradingTab] = useState('Shadows');

  const defaultSettings = {
    exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0,
    redHue: 0, redSat: 0, redLum: 0, orangeHue: 0, orangeSat: 0, orangeLum: 0, yellowHue: 0, yellowSat: 0, yellowLum: 0, greenHue: 0, greenSat: 0, greenLum: 0, aquaHue: 0, aquaSat: 0, aquaLum: 0, blueHue: 0, blueSat: 0, blueLum: 0, purpleHue: 0, purpleSat: 0, purpleLum: 0, magentaHue: 0, magentaSat: 0, magentaLum: 0,
    shadowHue: 0, shadowSat: 0, shadowLum: 0, midHue: 0, midSat: 0, midLum: 0, highlightHue: 0, highlightSat: 0, highlightLum: 0, gradingBlending: 50, gradingBalance: 0
  };
  
  const [settings, setSettings] = useState(defaultSettings);
  const [activeColor, setActiveColor] = useState('Orange'); 

  const updateSetting = (key, value) => { setSettings(prev => ({...prev, [key]: value})); };
  const resetSettings = () => { setSettings(defaultSettings); setActiveRecipe(null); }
  const resetGroup = (groupItems) => { const newSettings = {...settings}; groupItems.forEach(item => newSettings[item.id] = 0); setSettings(newSettings); }
  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { setImage(URL.createObjectURL(file)); } };
  const handleDownload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image(); img.crossOrigin = "anonymous"; img.src = image; img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.filter = getFilterString(); ctx.drawImage(img, 0, 0); const link = document.createElement('a'); link.download = 'edited-photo.jpg'; link.href = canvas.toDataURL('image/jpeg'); link.click(); }; };
  const handlePresetExport = () => { generateXMP(settings, aiPrompt || "Custom"); };

  const generateAIPreset = async () => {
      if (!aiPrompt.trim()) return; setAiLoading(true);
      const localPreset = getLocalPreset(aiPrompt);
      if (localPreset && localPreset.basic) { applyPresetToSettings(localPreset); setAiLoading(false); return; }
      const prompt = `Create a Lightroom preset for style "${aiPrompt}". Return JSON.`;
      const data = await callGemini(prompt, "Expert photo editor.", true);
      if (data && data.basic) applyPresetToSettings(data); else applyPresetToSettings(PRESET_DB["teal & orange"]);
      setAiLoading(false);
  };

  const applyPresetToSettings = (presetData) => {
      setActiveRecipe(presetData); const b = presetData.basic; const newSettings = { ...defaultSettings };
      if (b) { if (b.Exposure) newSettings.exposure = b.Exposure * 10; if (b.Contrast) newSettings.contrast = b.Contrast; if (b.Highlights) newSettings.highlights = b.Highlights; if (b.Shadows) newSettings.shadows = b.Shadows; if (b.Whites) newSettings.whites = b.Whites; if (b.Blacks) newSettings.blacks = b.Blacks; if (b.Temp) newSettings.temp = b.Temp; if (b.Tint) newSettings.tint = b.Tint; if (b.Vibrance) newSettings.vibrance = b.Vibrance; if (b.Saturation) newSettings.saturation = b.Saturation; if (b.Clarity) newSettings.clarity = b.Clarity; if (b.Dehaze) newSettings.dehaze = b.Dehaze; if (b.Vignette) newSettings.vignette = b.Vignette; }
      if (presetData.colorMix) presetData.colorMix.forEach(c => { const name = c.color.toLowerCase(); newSettings[`${name}Hue`] = c.h; newSettings[`${name}Sat`] = c.s; newSettings[`${name}Lum`] = c.l; });
      if (presetData.grading) {
          newSettings.shadowHue = presetData.grading.Shadows?.h || 0; newSettings.shadowSat = presetData.grading.Shadows?.s || 0; newSettings.shadowLum = presetData.grading.Shadows?.l || 0; newSettings.highlightHue = presetData.grading.Highlights?.h || 0; newSettings.highlightSat = presetData.grading.Highlights?.s || 0; newSettings.highlightLum = presetData.grading.Highlights?.l || 0; newSettings.midHue = presetData.grading.Midtones?.h || 0; newSettings.midSat = presetData.grading.Midtones?.s || 0; newSettings.midLum = presetData.grading.Midtones?.l || 0;
          if (presetData.grading.Blending) newSettings.gradingBlending = presetData.grading.Blending; if (presetData.grading.Balance) newSettings.gradingBalance = presetData.grading.Balance;
      }
      setSettings(newSettings);
  };

  const getFilterString = () => {
    let b = 100 + (settings.exposure * 10) + (settings.highlights * 0.1) + (settings.whites * 0.1) + (settings.shadows * 0.1); 
    let c = 100 + settings.contrast + (settings.dehaze * 0.5) + (settings.clarity * 0.2) + (settings.blacks * 0.1);
    let s = 100 + settings.saturation + (settings.vibrance * 0.5);
    let sepia = settings.temp > 0 ? settings.temp * 0.4 : 0; 
    let hue = settings.tint + (settings.temp < 0 ? settings.temp * 0.3 : 0);
    if (Math.abs(settings.orangeSat) > 20) s += settings.orangeSat * 0.2; 
    if (Math.abs(settings.blueSat) > 20) s += settings.blueSat * 0.2;
    if (settings.shadowSat > 0) { b -= settings.shadowSat * 0.1; hue += settings.shadowHue * 0.05; }
    if (settings.highlightSat > 0) { b += settings.highlightSat * 0.1; hue += settings.highlightHue * 0.05; }
    return `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sepia}%) hue-rotate(${hue}deg)`;
  };
  const getVignetteStyle = () => { const v = settings.vignette; if (v < 0) return { background: `radial-gradient(circle, transparent ${60 + (v * 0.4)}%, rgba(0,0,0,${Math.abs(v)/100}))` }; return { background: `radial-gradient(circle, transparent ${60 - (v * 0.4)}%, rgba(255,255,255,${v/100}))` }; };

  useEffect(() => { const style = document.createElement('style'); style.innerHTML = `.drag-only-range { pointer-events: none; } .drag-only-range::-webkit-slider-thumb { pointer-events: auto; cursor: pointer; } .grad-hue { background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red); } .grad-sat { background: linear-gradient(to right, #333, #ccc); } .grad-lum { background: linear-gradient(to right, black, white); }`; document.head.appendChild(style); return () => document.head.removeChild(style); }, []);
  const toolsGroups = [ { group: 'Light', icon: <Sun size={18}/>, items: [{ id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.1 }, { id: 'contrast', label: 'Contrast', min: -100, max: 100 }, { id: 'highlights', label: 'Highlights', min: -100, max: 100 }, { id: 'shadows', label: 'Shadows', min: -100, max: 100 }, { id: 'whites', label: 'Whites', min: -100, max: 100 }, { id: 'blacks', label: 'Blacks', min: -100, max: 100 }] }, { group: 'Color', icon: <Palette size={18}/>, items: [{ id: 'temp', label: 'Temp', min: -100, max: 100 }, { id: 'tint', label: 'Tint', min: -100, max: 100 }, { id: 'vibrance', label: 'Vibrance', min: -100, max: 100 }, { id: 'saturation', label: 'Saturation', min: -100, max: 100 }] }, { group: 'Effects', icon: <Aperture size={18}/>, items: [{ id: 'texture', label: 'Texture', min: -100, max: 100 }, { id: 'clarity', label: 'Clarity', min: -100, max: 100 }, { id: 'dehaze', label: 'Dehaze', min: -100, max: 100 }, { id: 'vignette', label: 'Vignette', min: -100, max: 100 }] } ];
  const colors = [ { name: 'Red', id: 'red', color: 'bg-red-500' }, { name: 'Orange', id: 'orange', color: 'bg-orange-500' }, { name: 'Yellow', id: 'yellow', color: 'bg-yellow-500' }, { name: 'Green', id: 'green', color: 'bg-green-500' }, { name: 'Aqua', id: 'aqua', color: 'bg-cyan-400' }, { name: 'Blue', id: 'blue', color: 'bg-blue-600' }, { name: 'Purple', id: 'purple', color: 'bg-purple-600' }, { name: 'Magenta', id: 'magenta', color: 'bg-pink-500' } ];
  const sampleImages = [ { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80", label: "Portrait" }, { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80", label: "Golden Hour" }, { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80", label: "Night" }, { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", label: "Nature" }, { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80", label: "Food" } ];

  const updateGrading = (tone, hue, sat) => {
     updateSetting(tone === 'Shadows' ? 'shadowHue' : tone === 'Midtones' ? 'midHue' : 'highlightHue', hue);
     updateSetting(tone === 'Shadows' ? 'shadowSat' : tone === 'Midtones' ? 'midSat' : 'highlightSat', sat);
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-gray-800 flex flex-col h-[calc(100dvh-60px)] md:h-[calc(100dvh-130px)] max-w-6xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6">
        <div className="p-3 md:p-0 bg-[#1e293b] md:bg-transparent md:mb-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative shadow-md md:shadow-none">
            <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto justify-center md:justify-end ml-auto">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button onClick={() => fileInputRef.current.click()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap"><Upload size={14} /> Upload</button>
                <button onClick={handleDownload} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap"><ImageDown size={14} /> Download</button>
                <button onClick={handlePresetExport} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap"><FileJson size={14} /> Export XMP</button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 h-full overflow-hidden relative">
            <div className="h-[55%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-4 shrink-0 bg-black/40 lg:bg-transparent p-2 lg:p-0">
                <div className="flex-1 bg-[#020617] rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-700 group shadow-inner">
                    <div className="relative w-full h-full"><img src={image} className="w-full h-full object-contain transition-all duration-75 ease-linear" style={{ filter: getFilterString() }} /><div className="absolute inset-0 pointer-events-none" style={getVignetteStyle()}></div></div>
                </div>
                <div className="flex justify-center gap-2 lg:gap-3 bg-[#0f172a] p-2 rounded-xl border border-gray-700 overflow-x-auto shrink-0">{sampleImages.map((item, idx) => (<button key={idx} onClick={() => setImage(item.src)} className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg border-2 ${image === item.src ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-600 hover:border-gray-400'} overflow-hidden transition-all relative group`} title={item.label}><img src={item.src} className="w-full h-full object-cover" /></button>))}</div>
            </div>

            <div className="flex-1 lg:w-96 lg:flex-none flex flex-col h-full bg-[#0f172a] rounded-t-2xl lg:rounded-xl border-t lg:border border-gray-700 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.5)] lg:shadow-lg">
                 <div className="flex border-b border-gray-700 shrink-0 bg-[#1e293b] lg:bg-transparent">
                    <button onClick={() => setMode('manual')} className={`flex-1 py-3 text-xs font-bold font-khmer ${mode === 'manual' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#0f172a]' : 'text-gray-400 hover:text-white'}`}>កែដោយដៃ</button>
                    <button onClick={() => setMode('ai')} className={`flex-1 py-3 text-xs font-bold font-khmer ${mode === 'ai' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#0f172a]' : 'text-gray-400 hover:text-white'}`}>AI Preset</button>
                    <button onClick={resetSettings} className="px-4 text-[10px] text-red-400 font-khmer hover:bg-red-500/10 border-l border-gray-700 flex items-center gap-1 transition-all"><RotateCcw size={12}/> Reset</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-[#0f172a]">
                    {mode === 'manual' ? (
                        <div className="space-y-5 pb-20 lg:pb-10">
                             {toolsGroups.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-gray-700 pb-1"><h4 className="text-xs font-bold text-blue-400 font-khmer uppercase flex items-center gap-2">{group.icon} {group.group}</h4><button onClick={() => resetGroup(group.items)} className="text-[9px] text-gray-500 hover:text-white">Reset</button></div>
                                    <div className="space-y-3 px-1">
                                        {group.items.map(t => (
                                            <div key={t.id} className="group/item">
                                                <div className="flex justify-between mb-1 items-center">
                                                    <label className="text-[10px] font-bold text-gray-300 font-khmer cursor-pointer hover:text-white transition-colors select-none" onDoubleClick={() => updateSetting(t.id, 0)}>{t.label}</label>
                                                    <span className="text-[10px] text-blue-400 font-mono bg-gray-800 px-1.5 rounded min-w-[30px] text-center">{settings[t.id].toFixed(t.step < 1 ? 1 : 0)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateSetting(t.id, settings[t.id] - (t.step || 1))} className="text-gray-400 hover:text-white p-1 bg-gray-800 rounded"><Minus size={10}/></button>
                                                    <input type="range" min={t.min} max={t.max} step={t.step || 1} value={settings[t.id]} onChange={(e) => updateSetting(t.id, Number(e.target.value))} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all drag-only-range" />
                                                    <button onClick={() => updateSetting(t.id, settings[t.id] + (t.step || 1))} className="text-gray-400 hover:text-white p-1 bg-gray-800 rounded"><Plus size={10}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-700 pb-1"><h4 className="text-xs font-bold text-pink-400 font-khmer uppercase flex items-center gap-2"><Palette size={16}/> Color Mix</h4></div>
                                <div className="flex justify-between gap-1 mb-2">
                                    {colors.map(c => (<button key={c.id} onClick={() => setActiveColor(c.name)} className={`w-7 h-7 rounded-full ${c.color} border-2 ${activeColor === c.name ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`} />))}
                                </div>
                                <div className="space-y-3 px-2 bg-[#151f32] p-2 rounded-lg border border-gray-700/50">
                                    {['Hue', 'Sat', 'Lum'].map((type) => {
                                        const key = `${activeColor.toLowerCase()}${type}`;
                                        return (
                                            <div key={key} className="flex items-center gap-2">
                                                <label className="text-[10px] font-bold text-gray-400 font-khmer w-8">{type}</label>
                                                <button onClick={() => updateSetting(key, settings[key] - 1)} className="text-gray-400 hover:text-white p-0.5 bg-gray-800 rounded"><Minus size={8}/></button>
                                                <input type="range" min="-100" max="100" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer drag-only-range ${type === 'Hue' ? 'grad-hue' : type === 'Sat' ? 'grad-sat' : 'grad-lum'}`} />
                                                <button onClick={() => updateSetting(key, settings[key] + 1)} className="text-gray-400 hover:text-white p-0.5 bg-gray-800 rounded"><Plus size={8}/></button>
                                                <input type="number" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className="w-10 bg-gray-800 text-[10px] text-center text-white border border-gray-600 rounded p-0.5" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3 pb-4">
                                <div className="flex items-center justify-between border-b border-gray-700 pb-1"><h4 className="text-xs font-bold text-purple-400 font-khmer uppercase flex items-center gap-2"><TrendingUp size={16}/> Grading</h4></div>
                                <div className="flex justify-around mb-2 bg-gray-800/50 p-1 rounded-lg">
                                    {['Shadows', 'Midtones', 'Highlights'].map(t => (
                                        <button key={t} onClick={() => setGradingTab(t)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${gradingTab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
                                    ))}
                                </div>
                                <div className="bg-[#151f32] p-3 rounded-lg border border-gray-700/50 space-y-4">
                                    <div className="flex justify-center py-2">
                                        <ColorWheel 
                                            hue={settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']}
                                            sat={settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']}
                                            onChange={(h, s) => updateGrading(gradingTab, h, s)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-bold text-gray-400 w-8">Lum</label>
                                        <input type="range" min="-100" max="100" value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 drag-only-range"/>
                                        <input type="number" className="w-10 bg-gray-800 text-[10px] text-center text-white border border-gray-600 rounded p-0.5" value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-700 space-y-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between"><label className="text-[10px] text-gray-400">Blending</label><span className="text-[10px] text-purple-400">{settings.gradingBlending}</span></div>
                                        <input type="range" min="0" max="100" value={settings.gradingBlending} onChange={(e) => updateSetting('gradingBlending', Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded accent-purple-500 drag-only-range"/>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between"><label className="text-[10px] text-gray-400">Balance</label><span className="text-[10px] text-purple-400">{settings.gradingBalance}</span></div>
                                        <input type="range" min="-100" max="100" value={settings.gradingBalance} onChange={(e) => updateSetting('gradingBalance', Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded accent-purple-500 drag-only-range"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-[#0f172a]">
                            <div className="p-3 border-b border-gray-800 bg-[#0f172a] shrink-0 z-10">
                                <div className="bg-purple-900/20 p-3 rounded-xl border border-purple-500/30">
                                    <h4 className="text-white font-bold font-khmer mb-2 flex items-center gap-2 text-xs"><Sparkles size={14} className="text-purple-400"/> បង្កើតពណ៌ដោយ AI</h4>
                                    <div className="flex gap-2">
                                        <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="ឈ្មោះស្តាយ..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500 font-khmer" />
                                        <button onClick={generateAIPreset} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg font-bold font-khmer text-xs disabled:opacity-50">{aiLoading ? <Loader2 className="animate-spin" size={14}/> : 'បង្កើត'}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <div className="space-y-2 pb-20">
                                    <h5 className="text-gray-400 text-[10px] font-bold font-khmer uppercase">ស្តាយពេញនិយម (20 Moods)</h5>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {Object.keys(PRESET_DB).map(s => (
                                            <button key={s} onClick={() => { setAiPrompt(s); generateAIPreset(); }} className="px-1 py-2 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group">
                                                <span className="capitalize text-[9px] font-bold text-gray-300 group-hover:text-white line-clamp-2 leading-tight">{s}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

const Quiz = ({ isOnline }) => {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState(initialQuestionBank);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizConfig, setQuizConfig] = useState({ level: 'beginner', amount: 10 });

  const startQuiz = () => {
    let filtered = questions.filter(q => quizConfig.level === 'all' || q.level === quizConfig.level);
    if (filtered.length < quizConfig.amount) filtered = questions;
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, quizConfig.amount));
    setCurrentQuestion(0); setScore(0); setIsAnswered(false); setSelectedOption(null); setGameState('playing');
  };

  const handleAnswerOptionClick = (index) => {
    if (isAnswered) return;
    setSelectedOption(index); setIsAnswered(true);
    if (index === questions[currentQuestion].correct) setScore(score + 1);
  };

  const handleNextQuestion = () => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) { setCurrentQuestion(nextQuestion); setIsAnswered(false); setSelectedOption(null); } else { setGameState('result'); }
  };

  if (gameState === 'menu') return (
    <div className="bg-[#1e293b] p-8 text-center rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto">
        <Award className="w-20 h-20 text-blue-500 mx-auto mb-6 drop-shadow-lg" />
        <h2 className="text-3xl font-bold text-white font-khmer mb-2">ការធ្វើតេស្តសមត្ថភាព</h2>
        <div className="space-y-6 mt-6">
            <div className="flex justify-center gap-2 bg-[#0f172a] p-1 rounded-xl w-fit mx-auto"><button onClick={() => setQuizConfig({...quizConfig, level: 'beginner'})} className={`px-6 py-2.5 rounded-lg font-khmer text-sm transition-all ${quizConfig.level==='beginner'?'bg-blue-600 text-white shadow-lg':'text-gray-400 hover:text-white'}`}>មូលដ្ឋាន</button><button onClick={() => setQuizConfig({...quizConfig, level: 'advanced'})} className={`px-6 py-2.5 rounded-lg font-khmer text-sm transition-all ${quizConfig.level==='advanced'?'bg-blue-600 text-white shadow-lg':'text-gray-400 hover:text-white'}`}>កម្រិតខ្ពស់</button></div>
            <div className="flex justify-center gap-2 items-center"><span className="text-gray-400 text-sm font-khmer mr-2">ចំនួន:</span>{[5, 10, 15, 20].map(num => (<button key={num} onClick={() => setQuizConfig({...quizConfig, amount: num})} className={`w-10 h-10 rounded-lg font-bold transition-all ${quizConfig.amount === num ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-[#0f172a] text-gray-400 border border-gray-700 hover:border-gray-500'}`}>{num}</button>))}</div>
            <button onClick={startQuiz} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold font-khmer shadow-lg transition-all transform hover:-translate-y-1">ចាប់ផ្ដើមសំណួរ</button>
        </div>
    </div>
  );
  
  if (gameState === 'result') {
      const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      return <div className="bg-[#1e293b] p-8 text-center rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto"><div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="60" stroke="#334155" strokeWidth="8" fill="none" /><circle cx="64" cy="64" r="60" stroke={percentage > 70 ? "#22c55e" : percentage > 40 ? "#eab308" : "#ef4444"} strokeWidth="8" fill="none" strokeDasharray={377} strokeDashoffset={377 - (377 * percentage) / 100} className="transition-all duration-1000 ease-out" /></svg><div className="absolute text-3xl font-bold text-white">{percentage}%</div></div><h2 className="text-2xl font-bold text-white font-khmer mb-2">{percentage > 80 ? "អស្ចារ្យណាស់!" : "ព្យាយាមទៀត!"}</h2><p className="text-gray-400 font-khmer mb-8">ពិន្ទុរបស់អ្នក: <span className="text-white font-bold">{score}</span> / {questions.length}</p><button onClick={() => setGameState('menu')} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-khmer transition-all">សាកល្បងម្តងទៀត</button></div>;
  }

  const q = questions[currentQuestion];
  return (
    <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-800 shadow-2xl max-w-2xl mx-auto">
      <div className="flex justify-between mb-6"><span className="text-sm font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">សំណួរ {currentQuestion + 1}/{questions.length}</span><span className="text-xs text-gray-500 uppercase tracking-wider mt-1">{q.level || 'General'}</span></div><h3 className="text-xl md:text-2xl font-bold text-white mb-8 font-khmer leading-relaxed">{q.question}</h3><div className="grid gap-3">{q.options.map((opt, i) => <button key={i} onClick={() => handleAnswerOptionClick(i)} className={`p-4 text-left rounded-xl border transition-all duration-200 font-khmer text-sm ${isAnswered ? (i === q.correct ? 'bg-green-500/20 border-green-500/50 text-green-200' : (i === selectedOption ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-[#0f172a] border-gray-800 text-gray-400 opacity-50')) : 'bg-[#0f172a] border-gray-700 text-gray-200 hover:bg-[#334155] hover:border-gray-500'}`}>{opt}</button>)}</div>{isAnswered && <div className="mt-8 flex justify-end"><button onClick={handleNextQuestion} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-khmer shadow-lg transition-all flex items-center gap-2">បន្ទាប់ <ChevronRight size={18}/></button></div>}</div>
  );
};

const ChatBot = ({ isOnline }) => {
  const [messages, setMessages] = useState([{ role: 'model', text: 'សួស្ដី! ខ្ញុំជាគ្រូជំនួយ AI។ អ្នកអាចសួរខ្ញុំអំពីរបៀបកែរូប ឬអោយខ្ញុំណែនាំ Setting។' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const suggestedQuestionsPool = [ "របៀបធ្វើអោយស្បែកស?", "របៀបកែរូប Portrait?", "របៀបដាក់ពណ៌ Teal & Orange?", "តើ Dehaze ប្រើសម្រាប់អ្វី?", "កែរូបថតពេលយប់?", "រូបមន្ត Vintage?", "ពន្យល់ពី Curves?", "តើ Grain ជួយអ្វី?", "រូបងងឹតពេកធ្វើម៉េច?", "របៀបធ្វើអោយមេឃដិត?", "របៀបកែរូបទេសភាព?", "តើ Vibrance ខុសពី Saturation ម៉េច?", "របៀបកែរូបថតអាហារ?", "របៀបកែរូបថត Street?", "របៀបកែរូបថតសមុទ្រ?" ];
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => { const shuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random()); setSuggestions(shuffled.slice(0, 3)); }, []);
  const randomizeSuggestions = () => { const shuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random()); setSuggestions(shuffled.slice(0, 3)); };

  const handleSend = async (text = null) => {
    const msg = text || input;
    if (!msg.trim()) return; setInput(''); setMessages(prev => [...prev, { role: 'user', text: msg }]); setLoading(true);
    const localReply = getLocalResponse(msg);
    if (localReply) { setTimeout(() => { setMessages(prev => [...prev, { role: 'model', text: localReply }]); setLoading(false); }, 500); return; }
    const systemPrompt = "You are a friendly, expert Lightroom and photography assistant speaking Khmer. Your answers should be helpful, concise, and related to photo editing. When suggesting settings, format the response as a clean list with bullet points and provide specific numerical values (e.g., • Exposure: +0.20) for better readability.";
    let reply = await callGemini(msg, systemPrompt);
    if (!reply) { if (!apiKey) { reply = "⚠️ សូមបញ្ចូល Gemini API Key នៅក្នុង Vercel ដើម្បីឱ្យខ្ញុំអាចឆ្លើយតបបាន។"; } else { reply = "សុំទោស មានបញ្ហាបច្ចេកទេសក្នុងការភ្ជាប់ទៅកាន់ AI។ សូមព្យាយាមម្តងទៀត។"; } }
    setMessages(prev => [...prev, { role: 'model', text: reply }]); setLoading(false);
  };
  
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="bg-[#1e293b] rounded-none md:rounded-2xl border-0 md:border border-gray-800 shadow-2xl flex flex-col h-full max-w-6xl mx-auto w-full fixed inset-0 z-50 md:relative md:h-[calc(100dvh-150px)] md:max-h-[600px] md:z-0">
      <div className="flex-none bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-gray-800 flex items-center space-x-3">
          <button className="md:hidden p-2 bg-white/10 rounded-full text-white" onClick={() => window.history.back()}><ArrowLeft size={20}/></button>
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-purple-500/20"><Bot className="w-5 h-5 text-white" /></div>
          <div className="flex-1"><h3 className="font-bold text-white font-khmer">គ្រូជំនួយ AI</h3><p className="text-xs text-blue-200 font-khmer">Powered by Gemini & Hybrid Cache ✨</p></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f172a] custom-scrollbar">
        {messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-khmer leading-relaxed shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] text-gray-200 rounded-bl-none border border-gray-700'}`}>{m.text}</div></div>)}
        {loading && <div className="flex justify-start"><div className="p-3.5 rounded-2xl bg-[#1e293b] border border-gray-700 rounded-bl-none"><Loader2 className="w-4 h-4 text-purple-400 animate-spin" /></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-none p-4 bg-[#1e293b] border-t border-gray-800 pb-safe md:pb-4">
          <div className="flex gap-2 items-center mb-3"><button onClick={randomizeSuggestions} className="p-1.5 bg-[#0f172a] hover:bg-[#334155] rounded-full text-gray-400 hover:text-white transition-all"><RefreshCw className="w-3 h-3" /></button><div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{suggestions.map((q, i) => <button key={i} onClick={() => handleSend(q)} className="whitespace-nowrap px-3 py-1.5 bg-[#0f172a] hover:bg-[#334155] hover:border-blue-500 rounded-full text-xs text-gray-300 border border-gray-700 transition-all font-khmer">{q}</button>)}</div></div>
          <div className="flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="សួរអ្វីមួយ..." className="flex-1 bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-base text-white focus:outline-none focus:border-blue-500 font-khmer transition-colors" style={{ touchAction: 'manipulation' }} /><button onClick={() => handleSend()} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-3 rounded-xl text-white shadow-lg disabled:opacity-50"><Send size={18}/></button></div>
      </div>
    </div>
  );
};

const AIAssistant = ({ isOnline }) => { return <div className="h-full flex flex-col justify-center w-full"><ChatBot isOnline={isOnline} /></div>; };

// --- APP COMPONENT (LAST) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('learn');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [backPressCount, setBackPressCount] = useState(0);

  const toggleSection = (id) => setExpandedSection(prev => prev === id ? null : id);

  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      if (expandedLesson) { setExpandedLesson(null); try { window.history.pushState(null, "", window.location.pathname); } catch (e) {} return; }
      if (activeTab !== 'learn') { setActiveTab('learn'); try { window.history.pushState(null, "", window.location.pathname); } catch (e) {} return; }
      if (backPressCount === 0) {
        setBackPressCount(1);
        const toast = document.createElement('div'); toast.textContent = "ចុចម្តងទៀតដើម្បីចាកចេញ"; toast.style.cssText = "position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 20px; z-index: 1000; font-family: 'Kantumruy Pro'; font-size: 12px;"; document.body.appendChild(toast);
        setTimeout(() => { document.body.removeChild(toast); setBackPressCount(0); }, 2000);
        try { window.history.pushState(null, "", window.location.pathname); } catch (e) {}
      } else { window.history.back(); }
    };
    try { window.history.pushState(null, "", window.location.pathname); } catch (e) {}
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [expandedLesson, activeTab, backPressCount]);

  useEffect(() => {
      const preventZoom = (e) => { if (e.touches.length > 1) { e.preventDefault(); } };
      document.addEventListener('touchmove', preventZoom, { passive: false });
      return () => document.removeEventListener('touchmove', preventZoom);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans pb-16 md:pb-0 selection:bg-blue-500/30 flex flex-col h-[100dvh]" style={{ touchAction: 'pan-x pan-y' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&family=Inter:wght@400;500;600;700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
      
      <div className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block flex-none' : 'block flex-none'}`}><Header activeTab={activeTab} setActiveTab={setActiveTab} /></div>
      {expandedLesson && <LessonModal lesson={lessonsData.find(l => l.id === expandedLesson)} onClose={() => setExpandedLesson(null)} />}
      
      <main className={`flex-1 overflow-hidden max-w-6xl mx-auto w-full relative ${activeTab === 'lab' || activeTab === 'ai' ? 'p-0' : 'p-4 pt-4 md:p-8 overflow-y-auto custom-scrollbar'}`}>
        <div className="animate-fade-in-down h-full">
          {activeTab === 'learn' && (<div className="space-y-8 pb-10"><div className="text-center mb-8"><h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3 font-khmer">វគ្គសិក្សា Lightroom</h2><p className="text-gray-400 font-khmer max-w-lg mx-auto">រៀនពីមូលដ្ឋានគ្រឹះដល់កម្រិតខ្ពស់នៃការកែរូបភាព។</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{lessonsData.map(lesson => <LessonCard key={lesson.id} lesson={lesson} onClick={() => setExpandedLesson(lesson.id)} />)}</div><TipsSection isExpanded={expandedSection === 'tips'} onToggle={() => toggleSection('tips')} /> <ContactSection /></div>)}
          {activeTab === 'quiz' && <Quiz isOnline={isOnline} />}
          {activeTab === 'lab' && <PhotoLab />}
          {activeTab === 'ai' && <AIAssistant isOnline={isOnline} />}
        </div>
      </main>
      
      <div className="flex-none md:hidden bg-[#0f172a]/90 backdrop-blur-md border-t border-gray-800 pb-safe z-40 flex justify-around p-2">
         <button onClick={() => setActiveTab('learn')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'learn' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><BookOpen size={20}/><span className="text-[10px] font-khmer mt-1">មេរៀន</span></button>
         <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'quiz' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Award size={20}/><span className="text-[10px] font-khmer mt-1">តេស្ត</span></button>
         <button onClick={() => setActiveTab('lab')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'lab' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Sliders size={20}/><span className="text-[10px] font-khmer mt-1">Lab</span></button>
         <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'ai' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Sparkles size={20}/><span className="text-[10px] font-khmer mt-1">គ្រូ AI</span></button>
      </div>
    </div>
  );
}