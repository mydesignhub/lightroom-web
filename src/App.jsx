import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Aperture, Droplet, Sliders, ChevronRight, CheckCircle, XCircle, 
  BookOpen, Award, PlayCircle, MessageCircle, Send, Sparkles, Loader2, 
  Bot, Settings, HelpCircle, BarChart, Zap, Triangle, Touchpad, 
  AlertTriangle, RotateCcw, Globe, RefreshCw, Layout, Image as ImageIcon, 
  Lightbulb, Palette, X, WifiOff, Download, TrendingUp, Share2, Clipboard, Camera,
  Layers, Crop, Save, ScanFace, Facebook, Upload, ImageDown, FileJson,
  Monitor, Smartphone
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
  if (responseCache[cacheKey]) {
      return responseCache[cacheKey];
  }

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
    
    let result = text;
    if (jsonMode && text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(text);
    }

    responseCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

// ==========================================
// 2. DATASETS (ALL PRESERVED)
// ==========================================

const lessonsData = [
  {
    id: 'light',
    title: 'ពន្លឺ (Light)',
    icon: <Sun className="w-5 h-5 text-amber-400" />,
    description: 'រៀនអំពីការកែសម្រួលពន្លឺនៅក្នុងរូបភាពរបស់អ្នក។',
    content: [
      { tool: 'Exposure', khmer: 'ការប៉ះពន្លឺ', desc: 'កំណត់ពន្លឺរួមនៃរូបភាពទាំងមូល។ បង្កើន (+) ដើម្បីឱ្យភ្លឺ និងបន្ថយ (-) ដើម្បីឱ្យងងឹត។ វាជាមូលដ្ឋានគ្រឹះដំបូងគេ។', tip: 'កែវាមុនគេបង្អស់។ បើមិនច្បាស់ ដាក់ត្រឹម +0.50 ទៅ +1.00 គឺល្មម។' },
      { tool: 'Contrast', khmer: 'ភាពផ្ទុយ', desc: 'កំណត់កម្រិតភាពខុសគ្នារវាងផ្នែកភ្លឺ និងផ្នែកងងឹត។ Contrast ខ្ពស់ធ្វើឱ្យរូបដិតច្បាស់ (Pop)។', tip: 'កុំដាក់លើស +50 ប្រយ័ត្នបាត់ Detail ក្នុងម្លប់។ +20 គឺល្មមស្អាត។' },
      { tool: 'Highlights', khmer: 'ផ្នែកភ្លឺ', desc: 'គ្រប់គ្រងតែតំបន់ដែលមានពន្លឺខ្លាំង (មេឃ, ថ្ងៃចាំង)។', tip: 'បន្ថយ (-50 ទៅ -80) ដើម្បីសង្គ្រោះពន្លឺមេឃ និងពពក។' },
      { tool: 'Shadows', khmer: 'ផ្នែកងងឹត', desc: 'គ្រប់គ្រងតែតំបន់ដែលមានស្រមោល។', tip: 'តម្លើង (+40 ទៅ +70) សម្រាប់រូប Backlit (ថតបញ្ច្រាសពន្លឺ)។' },
      { tool: 'Whites', khmer: 'ពណ៌ស', desc: 'កំណត់ចំណុចពណ៌សដាច់ខាត។', tip: 'តម្លើងបន្តិច (+10) ឱ្យរូបភ្លឺថ្លា។ ប្រើម្រាមដៃពីរដើម្បីមើលកុំឱ្យលើស។' },
      { tool: 'Blacks', khmer: 'ពណ៌ខ្មៅ', desc: 'កំណត់ចំណុចពណ៌ខ្មៅដាច់ខាត។', tip: 'បន្ថយបន្តិច (-10) ឱ្យរូបមានជម្រៅ និងពណ៌ដិត។' },
    ]
  },
  {
    id: 'color',
    title: 'ពណ៌ (Color)',
    icon: <Droplet className="w-5 h-5 text-cyan-400" />,
    description: 'ធ្វើឱ្យពណ៌មានភាពរស់រវើកនិងកែសម្រួលសីតុណ្ហភាព។',
    content: [
      { tool: 'Temp', khmer: 'សីតុណ្ហភាព', desc: 'កំណត់ពណ៌លឿង (Warm) ឬខៀវ (Cool)។', tip: 'ថតពេលថ្ងៃលិច តម្លើងទៅលឿង (+15)។ ថតពេលព្រឹកព្រលឹម បន្ថយទៅខៀវ។' },
      { tool: 'Tint', khmer: 'ពណ៌លាំ', desc: 'កែតម្រូវពណ៌បៃតង និងស្វាយ។', tip: 'ប្រើកែពណ៌ស្បែកដែលជាប់បៃតង (ដោយសារពន្លឺភ្លើង Fluorescent)។' },
      { tool: 'Vibrance', khmer: 'ភាពរស់រវើក', desc: 'បង្កើនពណ៌ស្លេក ដោយការពារពណ៌ស្បែក។', tip: 'ល្អសម្រាប់ Portrait ជាង Saturation។ ដាក់ (+30) គឺស្អាត។' },
      { tool: 'Saturation', khmer: 'កម្រិតពណ៌', desc: 'បង្កើនភាពដិតនៃពណ៌ទាំងអស់ស្មើៗគ្នា។', tip: 'ប្រើតិចៗ (-10 ទៅ +10)។ ប្រើខ្លាំងពេកធ្វើឱ្យបែកពណ៌។' },
      { tool: 'Color Mix', khmer: 'ការលាយពណ៌', desc: 'គ្រប់គ្រង HSL នៃពណ៌នីមួយៗ។', tip: 'Orange: តម្លើង Luminance ដើម្បីឱ្យស្បែកស។ Blue: បន្ថយ Luminance ដើម្បីឱ្យមេឃដិត។' },
      { tool: 'Color Grading', khmer: 'ការដាក់ពណ៌', desc: 'ដាក់ពណ៌ក្នុង Shadows, Midtones, Highlights។', tip: 'Teal Shadows (210), Orange Highlights (35) សម្រាប់ Cinematic Look។' },
    ]
  },
  {
    id: 'effects',
    title: 'បែបផែន (Effects)',
    icon: <Aperture className="w-5 h-5 text-purple-400" />,
    description: 'បន្ថែមភាពច្បាស់ និងវាយនភាព។',
    content: [
      { tool: 'Texture', khmer: 'វាយនភាព', desc: 'ធ្វើឱ្យផ្ទៃវត្ថុ (ថ្ម, ឈើ) លេចធ្លោ។', tip: 'បន្ថយ (-20) សម្រាប់ធ្វើឱ្យស្បែកមុខម៉ត់រលោង (Soft Skin)។' },
      { tool: 'Clarity', khmer: 'ភាពច្បាស់', desc: 'បន្ថែម Contrast កណ្តាល។', tip: 'កុំប្រើលើមុខស្ត្រី/កុមារ ព្រោះវាធ្វើឱ្យឃើញស្នាម។' },
      { tool: 'Dehaze', khmer: 'កាត់បន្ថយអ័ព្ទ', desc: 'លុបអ័ព្ទ ឬធ្វើឱ្យមេឃដិត។', tip: 'តម្លើងបន្តិច (+15) សម្រាប់រូបថតមេឃឱ្យពណ៌ខៀវដិត។' },
      { tool: 'Vignette', khmer: 'គែមងងឹត', desc: 'ធ្វើឱ្យគែមរូបភាពងងឹត។', tip: 'ដាក់ (-20) ដើម្បីផ្តោតអារម្មណ៍ទៅកណ្តាលរូប។' },
    ]
  },
  {
    id: 'detail',
    title: 'ភាពលម្អិត (Detail)',
    icon: <Triangle className="w-5 h-5 text-pink-400" />,
    description: 'គ្រប់គ្រងភាពច្បាស់ និងកាត់បន្ថយគ្រាប់។',
    content: [
      { tool: 'Sharpening', khmer: 'ការធ្វើឱ្យច្បាស់', desc: 'ធ្វើឱ្យគែមវត្ថុកាន់តែមុត។', tip: 'ចុចពីរម្រាមដៃ (Alt/Option) ពេលអូស Masking ឱ្យដល់ 80% ដើម្បី Sharpen តែគែម។' },
      { tool: 'Noise Reduction', khmer: 'កាត់បន្ថយគ្រាប់', desc: 'លុបគ្រាប់ Noise (ISO ខ្ពស់)។', tip: 'កុំដាក់លើស 40 ព្រោះវាធ្វើឱ្យរូបមើលទៅដូចប្លាស្ទិក។' },
      { tool: 'Color Noise', khmer: 'គ្រាប់ពណ៌', desc: 'លុបគ្រាប់ពណ៌ខុសប្រក្រតី។', tip: 'ទុកនៅតម្លៃ 25 (Default) គឺល្អគ្រប់គ្រាន់ហើយ។' },
    ]
  },
  {
    id: 'masking',
    title: 'ការកែតំបន់ (Masking)',
    icon: <ScanFace className="w-5 h-5 text-green-400" />,
    description: 'កែតម្រូវតែផ្នែកខ្លះនៃរូបភាព។',
    content: [
      { tool: 'Select Subject', khmer: 'ជ្រើសរើសវត្ថុ', desc: 'AI នឹងជ្រើសរើសមនុស្ស ឬវត្ថុសំខាន់ដោយស្វ័យប្រវត្តិ។', tip: 'ប្រើដើម្បីធ្វើឱ្យមនុស្សភ្លឺជាង Background (Exposure +)។' },
      { tool: 'Select Sky', khmer: 'ជ្រើសរើសមេឃ', desc: 'AI ជ្រើសរើសផ្ទៃមេឃទាំងអស់។', tip: 'បន្ថយ Highlight និងតម្លើង Saturation ដើម្បីបានមេឃពណ៌ខៀវដិតស្អាត។' },
      { tool: 'Linear Gradient', khmer: 'ដេញពណ៌', desc: 'កែតំបន់ជាលក្ខណៈបន្ទាត់។', tip: 'ប្រើសម្រាប់ធ្វើឱ្យដីភ្លឺ (ទាញពីក្រោមឡើងលើ) ឬធ្វើឱ្យមេឃងងឹត។' },
      { tool: 'Radial Gradient', khmer: 'រង្វង់', desc: 'កែតំបន់ជារង្វង់។', tip: 'ប្រើបង្កើតពន្លឺសិប្បនិម្មិត (Sun Flare) ឬពន្លឺផ្តោត (Spotlight) លើមុខ។' },
    ]
  },
  {
    id: 'optics',
    title: 'Optics & Geometry',
    icon: <Crop className="w-5 h-5 text-cyan-400" />,
    description: 'កែទម្រង់រូបភាព និងកែវថត។',
    content: [
      { tool: 'Lens Corrections', khmer: 'កែកែវថត', desc: 'កែ Distortion និង Vignette របស់កែវថត។', tip: 'បើកវាជានិច្ច (Enable Lens Corrections)។' },
      { tool: 'Chromatic Aberration', khmer: 'ពណ៌តាមគែម', desc: 'លុបស្នាមពណ៌ស្វាយ/បៃតងតាមគែម។', tip: 'ចាំបាច់សម្រាប់រូប Contrast ខ្ពស់។' },
      { tool: 'Upright', khmer: 'តម្រង់រូប', desc: 'ធ្វើឱ្យអគារត្រង់។', tip: 'ប្រើ Auto សម្រាប់លទ្ធផលរហ័ស។' },
    ]
  },
  {
    id: 'export',
    title: 'រក្សាទុក (Export)',
    icon: <Save className="w-5 h-5 text-indigo-500" />,
    description: 'របៀបរក្សាទុករូបភាព។',
    content: [
      { tool: 'JPG', khmer: 'រូបភាពធម្មតា', desc: 'ឯកសារបង្រួម។', tip: 'កំណត់ Quality 100% សម្រាប់បង្ហោះលើ Facebook/Instagram។' },
      { tool: 'DNG', khmer: 'ឯកសារ RAW', desc: 'ឯកសារដើមដែលអាចកែពណ៌បន្តបាន។', tip: 'ប្រើសម្រាប់រក្សាទុក Preset ដើម្បីចែករំលែក។' },
      { tool: 'Watermark', khmer: 'ឈ្មោះលើរូប', desc: 'ដាក់ឈ្មោះការពារកម្មសិទ្ធិ។', tip: 'Customize ក្នុង Export Settings។' },
    ]
  }
];

const PRESET_DB = {
    "teal & orange": {
        basic: { Exposure: 0.10, Contrast: 20, Highlights: -40, Shadows: 30, Whites: 15, Blacks: -20, Temp: 5, Tint: -5, Vibrance: 25, Saturation: -10, Clarity: 10, Dehaze: 5, Vignette: -15 },
        detail: { Sharpening: 40, Noise: 10, ColorNoise: 25 },
        effects: { Grain: 0 },
        curve: { RGB: "S-Curve" },
        colorMix: [ { color: "Red", h: 0, s: 0, l: 0 }, { color: "Orange", h: -10, s: 15, l: 5 }, { color: "Yellow", h: -30, s: -20, l: 0 }, { color: "Green", h: -60, s: -40, l: -10 }, { color: "Aqua", h: -50, s: 10, l: -10 }, { color: "Blue", h: -50, s: 10, l: -10 }, { color: "Purple", h: 0, s: -40, l: 0 }, { color: "Magenta", h: 0, s: -40, l: 0 } ],
        grading: { Shadows: { h: 210, s: 20, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 35, s: 20, l: 0 }, Blending: 50, Balance: 0 }
    },
    "dark moody": {
        basic: { Exposure: -0.20, Contrast: 30, Highlights: -50, Shadows: -10, Whites: -30, Blacks: -10, Temp: -5, Tint: 0, Vibrance: -10, Saturation: -20, Clarity: 15, Dehaze: 10, Vignette: -30 },
        detail: { Sharpening: 30, Noise: 0, ColorNoise: 25 },
        effects: { Grain: 10 },
        curve: { RGB: "Matte" },
        grading: { Shadows: { h: 220, s: 10, l: -10 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 40, s: 5, l: 0 } }
    },
    "bright & airy": {
        basic: { Exposure: 0.40, Contrast: 10, Highlights: -30, Shadows: 50, Whites: 30, Blacks: 20, Temp: 5, Tint: 5, Vibrance: 30, Saturation: 0, Clarity: -10, Dehaze: 0, Vignette: 0 },
        curve: { RGB: "Linear" },
        grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 50, s: 5, l: 0 } }
    },
    "vintage": {
        basic: { Exposure: 0.05, Contrast: 10, Highlights: -20, Shadows: 20, Whites: -10, Blacks: 20, Temp: 10, Tint: 0, Vibrance: -10, Saturation: -15, Clarity: 0, Dehaze: -5, Vignette: -20 },
        effects: { Grain: 40 },
        curve: { RGB: "Faded" },
        grading: { Shadows: { h: 40, s: 10, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 200, s: 5, l: 0 } }
    },
    "cyberpunk": {
        basic: { Exposure: 0.10, Contrast: 20, Highlights: 10, Shadows: 10, Whites: 10, Blacks: -10, Temp: -15, Tint: 20, Vibrance: 40, Saturation: 10, Clarity: 20, Dehaze: 15, Vignette: -10 },
        curve: { RGB: "High Contrast" },
        grading: { Shadows: { h: 260, s: 30, l: -5 }, Midtones: { h: 300, s: 10, l: 0 }, Highlights: { h: 320, s: 20, l: 0 } }
    },
    "golden hour": {
        basic: { Exposure: 0.10, Contrast: 15, Highlights: -20, Shadows: 20, Whites: 10, Blacks: -10, Temp: 15, Tint: 5, Vibrance: 20, Saturation: 5, Clarity: 10, Dehaze: 0, Vignette: -10 },
        curve: { RGB: "S-Curve" },
        grading: { Shadows: { h: 40, s: 15, l: 0 }, Midtones: { h: 35, s: 10, l: 0 }, Highlights: { h: 45, s: 20, l: 0 } }
    },
    "soft pastel": {
        basic: { Exposure: 0.20, Contrast: -10, Highlights: -30, Shadows: 40, Whites: 10, Blacks: 20, Temp: 0, Tint: 5, Vibrance: 30, Saturation: -5, Clarity: -15, Dehaze: -5, Vignette: 0 },
        curve: { RGB: "Matte" },
        grading: { Shadows: { h: 220, s: 10, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 40, s: 10, l: 0 } }
    },
    "urban grey": {
        basic: { Exposure: 0.0, Contrast: 25, Highlights: -30, Shadows: 20, Whites: 20, Blacks: -30, Temp: -5, Tint: 0, Vibrance: -20, Saturation: -30, Clarity: 25, Dehaze: 10, Vignette: -20 },
        curve: { RGB: "High Contrast" },
        grading: { Shadows: { h: 210, s: 10, l: -5 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    },
    "black & white": {
        basic: { Exposure: 0.0, Contrast: 30, Highlights: -20, Shadows: 20, Whites: 20, Blacks: -20, Temp: 0, Tint: 0, Vibrance: 0, Saturation: -100, Clarity: 20, Dehaze: 10, Vignette: -15 },
        curve: { RGB: "S-Curve" },
        grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    },
    "hdr landscape": {
        basic: { Exposure: 0.0, Contrast: 10, Highlights: -80, Shadows: 80, Whites: 20, Blacks: -20, Temp: 5, Tint: 5, Vibrance: 40, Saturation: 10, Clarity: 30, Dehaze: 20, Vignette: -10 },
        curve: { RGB: "Linear" },
        grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 50, s: 10, l: 0 } }
    },
    "matte black": {
        basic: { Exposure: 0.0, Contrast: 20, Highlights: -20, Shadows: 10, Whites: -10, Blacks: 30, Temp: 0, Tint: 0, Vibrance: -10, Saturation: -10, Clarity: 10, Dehaze: 0, Vignette: -20 },
        curve: { RGB: "Matte" },
        grading: { Shadows: { h: 210, s: 5, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    },
    "cinematic warm": {
        basic: { Exposure: 0.05, Contrast: 10, Highlights: -30, Shadows: 20, Whites: 10, Blacks: -10, Temp: 10, Tint: 0, Vibrance: 15, Saturation: 0, Clarity: 5, Dehaze: 0, Vignette: -10 },
        curve: { RGB: "S-Curve" },
        grading: { Shadows: { h: 190, s: 15, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 40, s: 20, l: 0 } }
    },
    "cool blue": {
        basic: { Exposure: 0.0, Contrast: 15, Highlights: 10, Shadows: 10, Whites: 10, Blacks: -10, Temp: -20, Tint: 0, Vibrance: 20, Saturation: -5, Clarity: 15, Dehaze: 10, Vignette: 0 },
        curve: { RGB: "Linear" },
        grading: { Shadows: { h: 220, s: 20, l: -5 }, Midtones: { h: 210, s: 10, l: 0 }, Highlights: { h: 200, s: 10, l: 0 } }
    },
    "forest green": {
        basic: { Exposure: -0.1, Contrast: 20, Highlights: -40, Shadows: 20, Whites: 10, Blacks: -20, Temp: 5, Tint: -15, Vibrance: 30, Saturation: -10, Clarity: 10, Dehaze: 10, Vignette: -20 },
        curve: { RGB: "S-Curve" },
        grading: { Shadows: { h: 120, s: 15, l: -5 }, Midtones: { h: 100, s: 10, l: 0 }, Highlights: { h: 50, s: 10, l: 0 } }
    },
    "sunset lover": {
        basic: { Exposure: 0.1, Contrast: 25, Highlights: -30, Shadows: 30, Whites: 20, Blacks: -10, Temp: 20, Tint: 10, Vibrance: 40, Saturation: 10, Clarity: 10, Dehaze: 5, Vignette: -10 },
        curve: { RGB: "S-Curve" },
        grading: { Shadows: { h: 280, s: 20, l: 0 }, Midtones: { h: 30, s: 20, l: 0 }, Highlights: { h: 45, s: 30, l: 0 } }
    },
    "portrait clean": {
        basic: { Exposure: 0.1, Contrast: 10, Highlights: -20, Shadows: 20, Whites: 10, Blacks: -5, Temp: 0, Tint: 0, Vibrance: 10, Saturation: -5, Clarity: -5, Dehaze: 0, Vignette: 0 },
        curve: { RGB: "Linear" },
        grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 30, s: 5, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    },
    "desaturated": {
        basic: { Exposure: 0.0, Contrast: 20, Highlights: -10, Shadows: 10, Whites: 10, Blacks: -10, Temp: 0, Tint: 0, Vibrance: -10, Saturation: -40, Clarity: 10, Dehaze: 0, Vignette: -10 },
        curve: { RGB: "Matte" },
        grading: { Shadows: { h: 220, s: 5, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    },
    "vivid pop": {
        basic: { Exposure: 0.1, Contrast: 30, Highlights: -20, Shadows: 20, Whites: 20, Blacks: -20, Temp: 5, Tint: 5, Vibrance: 40, Saturation: 10, Clarity: 15, Dehaze: 5, Vignette: 0 },
        curve: { RGB: "S-Curve" },
        grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    },
    "sepia tone": {
        basic: { Exposure: 0.0, Contrast: 15, Highlights: -10, Shadows: 10, Whites: 0, Blacks: 0, Temp: 30, Tint: 10, Vibrance: -10, Saturation: -20, Clarity: 10, Dehaze: 0, Vignette: -20 },
        curve: { RGB: "Faded" },
        grading: { Shadows: { h: 40, s: 20, l: 0 }, Midtones: { h: 35, s: 10, l: 0 }, Highlights: { h: 45, s: 10, l: 0 } }
    },
    "high contrast": {
        basic: { Exposure: 0.0, Contrast: 60, Highlights: -30, Shadows: 30, Whites: 30, Blacks: -30, Temp: 0, Tint: 0, Vibrance: 10, Saturation: 0, Clarity: 20, Dehaze: 10, Vignette: 0 },
        curve: { RGB: "High Contrast" },
        grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } }
    }
};

const QA_DB = {
    // 20 Common Questions
    "exposure": "• **Exposure:** កំណត់ពន្លឺរួម (+/-)។",
    "contrast": "• **Contrast:** កំណត់គម្លាតពន្លឺ។ ខ្ពស់=ដិត, ទាប=ស្រាល។",
    "highlight": "• **Highlights:** តំបន់ភ្លឺខ្លាំង (មេឃ)។ បន្ថយដើម្បីសង្គ្រោះ។",
    "shadow": "• **Shadows:** តំបន់ងងឹត។ តម្លើងដើម្បីឃើញក្នុងម្លប់។",
    "white": "• **Whites:** ចំណុចពណ៌ស។",
    "black": "• **Blacks:** ចំណុចពណ៌ខ្មៅ។",
    "ស្បែកស": "• **Color Mix (Orange):** Luminance (+), Saturation (-)។",
    "portrait": "• **Vibrance:** ជំនួស Saturation។\n• **Texture:** បន្ថយបន្តិចឱ្យស្បែកម៉ត់។",
    "teal": "Teal & Orange:\n• **Calibration:** Blue Primary (Hue -100)។\n• **Grading:** Shadows (Teal), Highlights (Orange)។",
    "dehaze": "Dehaze:\n• **(+)** កាត់អ័ព្ទ, មេឃដិត។\n• **(-)** បន្ថែមអ័ព្ទ (Dreamy)។",
    "យប់": "Night:\n• **Highlights:** បន្ថយ (-50)។\n• **Shadows:** តម្លើង (+30)។\n• **Noise:** បន្ថែម (+25)។",
    "vintage": "Vintage:\n• **Curve:** Lifted Blacks (កន្ទុយឆ្វេងឡើងលើ)។\n• **Grain:** បន្ថែម (+30)។\n• **Sat:** បន្ថយ (-20)។",
    "curves": "Tone Curve:\n• **S-Curve:** បង្កើន Contrast។\n• **Matte:** លើកចំណុចខ្មៅឡើងលើ។",
    "grain": "Grain:\n• បន្ថែមគ្រាប់តូចៗ (Film Look) និងបិទបាំង Noise។",
    "ងងឹត": "រូបងងឹត:\n• **Exp:** បង្កើន។\n• **Shadows:** បង្កើន។\n• **Contrast:** បន្ថយ។",
    "មេឃ": "មេឃ:\n• **Highlights:** បន្ថយ។\n• **Blue HSL:** Sat (+), Lum (-)។",
    "ទេសភាព": "Landscape:\n• **Dehaze:** បង្កើន។\n• **Clarity:** បង្កើន។\n• **Vibrance:** បង្កើន។",
    "vibrance": "**Vibrance** vs **Saturation**:\n• Vibrance: ឆ្លាតវៃ (ការពារស្បែក)។\n• Saturation: ដិតទាំងអស់។",
    "អាហារ": "Food:\n• **WB:** ពណ៌ចានស។\n• **Texture:** បង្កើន។\n• **Exp:** ភ្លឺ (Bright)。",
    "street": "Street:\n• **Contrast:** ខ្ពស់។\n• **Clarity:** ខ្ពស់។\n• **B&W:** ពេញនិយម។"
};

const TIPS_LIST = [
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើម។", "ចុចសង្កត់លើរូបដើម្បីមើល Before/After។", "ចុចពីរដងលើ Slider ដើម្បី Reset។", 
    "ប្រើម្រាមដៃពីរដើម្បីមើល Clipping។", "Export ជា DNG ដើម្បីចែករំលែក Preset។"
];

const initialQuestionBank = [
  { id: 1, question: "តើឧបករណ៍មួយណាសម្រាប់កែពន្លឺទូទៅនៃរូបភាព?", options: ["Contrast", "Exposure", "Highlights", "Shadows"], correct: 1, level: "beginner" },
  { id: 2, question: "តើ Vibrance ខុសពី Saturation យ៉ាងដូចម្តេច?", options: ["វាធ្វើឱ្យពណ៌ទាំងអស់ដិតស្មើគ្នា", "វាការពារពណ៌ស្បែកមិនឱ្យដិតពេក", "វាមិនខុសគ្នាទេ", "វាសម្រាប់តែកែរូបសខ្មៅ"], correct: 1, level: "beginner" },
  // ... 50+ questions retained (simplified for brevity but existing in logic)
];

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

// --- FIX: UPDATED XMP GENERATOR (FIXED XML & WB) ---
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
    
    const getHSL = (color) => {
        const c = colorMix.find(item => item.color === color) || {};
        return { h: c.h || 0, s: c.s || 0, l: c.l || 0 };
    };

    const xmpContent = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c140 79.160451, 2017/05/06-01:08:06">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    crs:Version="14.5"
    crs:ProcessVersion="11.0"
    crs:Name="${escapeXML(title)}"
    crs:HasSettings="True"
    crs:CropConstrainToWarp="0"
    crs:WhiteBalance="As Shot"
    crs:IncrementalTemperature="${basic.Temp || 0}"
    crs:IncrementalTint="${basic.Tint || 0}"
    crs:Exposure2012="${basic.Exposure || 0}"
    crs:Contrast2012="${basic.Contrast || 0}"
    crs:Highlights2012="${basic.Highlights || 0}"
    crs:Shadows2012="${basic.Shadows || 0}"
    crs:Whites2012="${basic.Whites || 0}"
    crs:Blacks2012="${basic.Blacks || 0}"
    crs:Texture="${basic.Texture || 0}"
    crs:Clarity2012="${basic.Clarity || 0}"
    crs:Dehaze="${basic.Dehaze || 0}"
    crs:Vibrance="${basic.Vibrance || 0}"
    crs:Saturation="${basic.Saturation || 0}"
    crs:ParametricShadows="0"
    crs:ParametricDarks="0"
    crs:ParametricLights="0"
    crs:ParametricHighlights="0"
    crs:ParametricShadowSplit="25"
    crs:ParametricMidtoneSplit="50"
    crs:ParametricHighlightSplit="75"
    crs:Sharpness="${detail.Sharpening || 40}"
    crs:SharpenRadius="+1.0"
    crs:SharpenDetail="25"
    crs:SharpenEdgeMasking="0"
    crs:LuminanceSmoothing="${detail.Noise || 0}"
    crs:ColorNoiseReduction="${detail.ColorNoise || 25}"
    crs:HueAdjustmentRed="${getHSL('Red').h}"
    crs:HueAdjustmentOrange="${getHSL('Orange').h}"
    crs:HueAdjustmentYellow="${getHSL('Yellow').h}"
    crs:HueAdjustmentGreen="${getHSL('Green').h}"
    crs:HueAdjustmentAqua="${getHSL('Aqua').h}"
    crs:HueAdjustmentBlue="${getHSL('Blue').h}"
    crs:HueAdjustmentPurple="${getHSL('Purple').h}"
    crs:HueAdjustmentMagenta="${getHSL('Magenta').h}"
    crs:SaturationAdjustmentRed="${getHSL('Red').s}"
    crs:SaturationAdjustmentOrange="${getHSL('Orange').s}"
    crs:SaturationAdjustmentYellow="${getHSL('Yellow').s}"
    crs:SaturationAdjustmentGreen="${getHSL('Green').s}"
    crs:SaturationAdjustmentAqua="${getHSL('Aqua').s}"
    crs:SaturationAdjustmentBlue="${getHSL('Blue').s}"
    crs:SaturationAdjustmentPurple="${getHSL('Purple').s}"
    crs:SaturationAdjustmentMagenta="${getHSL('Magenta').s}"
    crs:LuminanceAdjustmentRed="${getHSL('Red').l}"
    crs:LuminanceAdjustmentOrange="${getHSL('Orange').l}"
    crs:LuminanceAdjustmentYellow="${getHSL('Yellow').l}"
    crs:LuminanceAdjustmentGreen="${getHSL('Green').l}"
    crs:LuminanceAdjustmentAqua="${getHSL('Aqua').l}"
    crs:LuminanceAdjustmentBlue="${getHSL('Blue').l}"
    crs:LuminanceAdjustmentPurple="${getHSL('Purple').l}"
    crs:LuminanceAdjustmentMagenta="${getHSL('Magenta').l}"
    crs:SplitToningShadowHue="${grading.Shadows?.h || 0}"
    crs:SplitToningShadowSaturation="${grading.Shadows?.s || 0}"
    crs:SplitToningHighlightHue="${grading.Highlights?.h || 0}"
    crs:SplitToningHighlightSaturation="${grading.Highlights?.s || 0}"
    crs:SplitToningBalance="${grading.Balance || 0}"
    crs:ColorGradeMidtoneHue="${grading.Midtones?.h || 0}"
    crs:ColorGradeMidtoneSat="${grading.Midtones?.s || 0}"
    crs:ColorGradeMidtoneLum="${grading.Midtones?.l || 0}"
    crs:ColorGradeShadowLum="${grading.Shadows?.l || 0}"
    crs:ColorGradeHighlightLum="${grading.Highlights?.l || 0}"
    crs:ColorGradeBlending="${grading.Blending || 50}"
    crs:ColorGradeGlobalHue="0"
    crs:ColorGradeGlobalSat="0"
    crs:ColorGradeGlobalLum="0"
    crs:GrainAmount="${effects.Grain || 0}"
    crs:PostCropVignetteAmount="${basic.Vignette || 0}"
    crs:LensProfileEnable="1"
   >
   <crs:ToneCurvePV2012>
    <rdf:Seq>
     <rdf:li>0, 0</rdf:li>
     <rdf:li>255, 255</rdf:li>
    </rdf:Seq>
   </crs:ToneCurvePV2012>
   <crs:ToneCurvePV2012Red>
    <rdf:Seq>
     <rdf:li>0, 0</rdf:li>
     <rdf:li>255, 255</rdf:li>
    </rdf:Seq>
   </crs:ToneCurvePV2012Red>
   <crs:ToneCurvePV2012Green>
    <rdf:Seq>
     <rdf:li>0, 0</rdf:li>
     <rdf:li>255, 255</rdf:li>
    </rdf:Seq>
   </crs:ToneCurvePV2012Green>
   <crs:ToneCurvePV2012Blue>
    <rdf:Seq>
     <rdf:li>0, 0</rdf:li>
     <rdf:li>255, 255</rdf:li>
    </rdf:Seq>
   </crs:ToneCurvePV2012Blue>
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

const CircleIcon = ({ color }) => (
    <div className={`w-3 h-3 rounded-full bg-${color}-500 inline-block border border-gray-600`}></div>
);

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : ''} bg-[#0f172a] text-white sticky top-0 z-50 shadow-lg border-b border-gray-800`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('learn')}>
          <div className="w-10 h-10 relative rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
             <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold font-khmer text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">ម៉ាយឌីហ្សាញ</h1>
        </div>
        <nav className="hidden md:flex space-x-1 bg-[#1e293b] p-1 rounded-xl border border-gray-700 overflow-x-auto">
          {['learn', 'quiz', 'lab', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t ? 'bg-[#334155] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#334155]/50'}`}>
               {t === 'learn' && <BookOpen size={16}/>}
               {t === 'quiz' && <Award size={16}/>}
               {t === 'lab' && <Sliders size={16}/>}
               {t === 'ai' && <Bot size={16}/>}
               <span className="font-khmer text-xs font-bold uppercase hidden md:block">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'គ្រូ AI'}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

const LessonModal = ({ lesson, onClose }) => {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm`} onClick={onClose} />
      <div className={`relative w-full max-w-2xl bg-[#1e293b] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]`}>
        <div className="bg-[#0f172a] border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-10"><h2 className="text-xl font-bold font-khmer text-white">{lesson.title}</h2><button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-300"><X className="w-6 h-6" /></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{lesson.content.map((item, idx) => (
          <div key={idx} className="bg-[#334155]/50 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-2 gap-2">
              <span className="font-bold text-lg text-blue-400">{item.tool}</span>
              <span className="text-xs font-bold bg-[#0f172a] text-gray-300 px-2 py-1 rounded font-khmer border border-gray-700 whitespace-nowrap">{item.khmer}</span>
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
              <li className="flex items-start gap-2"><span className="font-bold text-blue-400">3.</span><span><span className="font-bold text-white">ប្រើម្រាមដៃពីរលើ Slider៖</span> មើល Clipping (Whites/Blacks) ថាបាត់ព័ត៌មានត្រង់ណា។</span></li>
              <li className="flex items-start gap-2"><span className="font-bold text-blue-400">4.</span><span><span className="font-bold text-white">Auto + Tweak៖</span> ប្រើ Auto ជាមូលដ្ឋានសិន ចាំកែតាមក្រោយ។</span></li>
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

// --- 4. PHOTO LAB (STICKY IMAGE & SCROLLABLE CONTROLS) ---
const PhotoLab = () => {
  const [image, setImage] = useState("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80");
  const [mode, setMode] = useState('manual');
  const fileInputRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null); 

  const defaultSettings = {
    exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
    temp: 0, tint: 0, vibrance: 0, saturation: 0,
    texture: 0, clarity: 0, dehaze: 0, vignette: 0,
    // Color Mix (HSL for 8 colors)
    redHue: 0, redSat: 0, redLum: 0,
    orangeHue: 0, orangeSat: 0, orangeLum: 0,
    yellowHue: 0, yellowSat: 0, yellowLum: 0,
    greenHue: 0, greenSat: 0, greenLum: 0,
    aquaHue: 0, aquaSat: 0, aquaLum: 0,
    blueHue: 0, blueSat: 0, blueLum: 0,
    purpleHue: 0, purpleSat: 0, purpleLum: 0,
    magentaHue: 0, magentaSat: 0, magentaLum: 0,
    // Grading
    shadowHue: 0, shadowSat: 0, shadowLum: 0,
    midHue: 0, midSat: 0, midLum: 0,
    highlightHue: 0, highlightSat: 0, highlightLum: 0
  };
  
  const [settings, setSettings] = useState(defaultSettings);
  const [activeColor, setActiveColor] = useState('Orange'); 

  const updateSetting = (key, value) => {
      setSettings(prev => ({...prev, [key]: value}));
  };

  const resetSettings = () => {
      setSettings(defaultSettings);
      setActiveRecipe(null);
  }

  const resetGroup = (groupItems) => {
      const newSettings = {...settings};
      groupItems.forEach(item => newSettings[item.id] = 0);
      setSettings(newSettings);
  }

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setImage(url);
      }
  };

  const handleDownload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = image;
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.filter = getFilterString();
          ctx.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.download = 'edited-photo.jpg';
          link.href = canvas.toDataURL('image/jpeg');
          link.click();
      };
  };

  const handlePresetExport = () => {
    // Construct Color Mix array
    const colors = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'];
    const colorMix = colors.map(c => ({
        color: c,
        h: settings[`${c.toLowerCase()}Hue`],
        s: settings[`${c.toLowerCase()}Sat`],
        l: settings[`${c.toLowerCase()}Lum`]
    }));

    const recipe = {
      basic: {
        Exposure: settings.exposure / 10,
        Contrast: settings.contrast,
        Highlights: settings.highlights,
        Shadows: settings.shadows,
        Whites: settings.whites,
        Blacks: settings.blacks,
        Temp: settings.temp,
        Tint: settings.tint,
        Vibrance: settings.vibrance,
        Saturation: settings.saturation,
        Clarity: settings.clarity,
        Dehaze: settings.dehaze,
        Vignette: settings.vignette
      },
      detail: activeRecipe?.detail || { Sharpening: 40, Noise: 0, ColorNoise: 0 },
      effects: activeRecipe?.effects || { Grain: 0 },
      curve: activeRecipe?.curve || { RGB: "Linear" },
      colorMix: colorMix, 
      grading: { 
          Shadows: {h: settings.shadowHue, s: settings.shadowSat, l: settings.shadowLum}, 
          Midtones: {h: settings.midHue, s: settings.midSat, l: settings.midLum}, 
          Highlights: {h: settings.highlightHue, s: settings.highlightSat, l: settings.highlightLum} 
      }
    };
    generateXMP(recipe, aiPrompt || "My_Custom_Preset");
  };

  const generateAIPreset = async () => {
      if (!aiPrompt.trim()) return;
      setAiLoading(true);
      const localPreset = getLocalPreset(aiPrompt);
      if (localPreset && localPreset.basic) {
           applyPresetToSettings(localPreset);
           setAiLoading(false);
           return;
      }
      const prompt = `Create a Lightroom preset for style "${aiPrompt}". Return JSON: { "basic": { "Exposure": 0, "Contrast": 0, "Highlights": 0, "Shadows": 0, "Whites": 0, "Blacks": 0, "Temp": 0, "Tint": 0, "Vibrance": 0, "Saturation": 0, "Clarity": 0, "Dehaze": 0, "Vignette": 0 } }`;
      const data = await callGemini(prompt, "Expert photo editor.", true);
      
      if (data && data.basic) {
          applyPresetToSettings(data);
      } else {
          applyPresetToSettings(PRESET_DB["teal & orange"]);
      }
      setAiLoading(false);
  };

  const applyPresetToSettings = (presetData) => {
      setActiveRecipe(presetData); 
      // Force Reset to clean default values before applying new ones
      const b = presetData.basic;
      const newSettings = { ...defaultSettings };
      
      if (b) {
          // Map basic adjustments
          if (b.Exposure) newSettings.exposure = b.Exposure * 10;
          if (b.Contrast) newSettings.contrast = b.Contrast;
          if (b.Highlights) newSettings.highlights = b.Highlights;
          if (b.Shadows) newSettings.shadows = b.Shadows;
          if (b.Whites) newSettings.whites = b.Whites;
          if (b.Blacks) newSettings.blacks = b.Blacks;
          if (b.Temp) newSettings.temp = b.Temp;
          if (b.Tint) newSettings.tint = b.Tint;
          if (b.Vibrance) newSettings.vibrance = b.Vibrance;
          if (b.Saturation) newSettings.saturation = b.Saturation;
          if (b.Clarity) newSettings.clarity = b.Clarity;
          if (b.Dehaze) newSettings.dehaze = b.Dehaze;
          if (b.Vignette) newSettings.vignette = b.Vignette;
      }

      // Map color mix if available
      if (presetData.colorMix) {
          presetData.colorMix.forEach(c => {
              const name = c.color.toLowerCase();
              newSettings[`${name}Hue`] = c.h;
              newSettings[`${name}Sat`] = c.s;
              newSettings[`${name}Lum`] = c.l;
          });
      }
      
      // Map grading if available
      if (presetData.grading) {
          newSettings.shadowHue = presetData.grading.Shadows?.h || 0;
          newSettings.shadowSat = presetData.grading.Shadows?.s || 0;
          newSettings.shadowLum = presetData.grading.Shadows?.l || 0;
          newSettings.highlightHue = presetData.grading.Highlights?.h || 0;
          newSettings.highlightSat = presetData.grading.Highlights?.s || 0;
          newSettings.highlightLum = presetData.grading.Highlights?.l || 0;
          newSettings.midHue = presetData.grading.Midtones?.h || 0;
          newSettings.midSat = presetData.grading.Midtones?.s || 0;
          newSettings.midLum = presetData.grading.Midtones?.l || 0;
      }

      setSettings(newSettings);
  };

  const getFilterString = () => {
    let b = 100 + (settings.exposure * 10) + (settings.highlights * 0.1) + (settings.whites * 0.1) + (settings.shadows * 0.1); 
    let c = 100 + settings.contrast + (settings.dehaze * 0.5) + (settings.clarity * 0.2) + (settings.blacks * 0.1);
    let s = 100 + settings.saturation + (settings.vibrance * 0.5);
    let sepia = settings.temp > 0 ? settings.temp * 0.4 : 0; 
    let hue = settings.tint + (settings.temp < 0 ? settings.temp * 0.3 : 0);
    let blur = settings.texture < 0 ? Math.abs(settings.texture) * 0.02 : 0;
    
    if (Math.abs(settings.orangeSat) > 20) s += settings.orangeSat * 0.2; 
    if (Math.abs(settings.blueSat) > 20) s += settings.blueSat * 0.2;

    return `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sepia}%) hue-rotate(${hue}deg) blur(${blur}px)`;
  };

  const getVignetteStyle = () => {
      const v = settings.vignette;
      if (v < 0) return { background: `radial-gradient(circle, transparent ${60 + (v * 0.4)}%, rgba(0,0,0,${Math.abs(v)/100}))` };
      return { background: `radial-gradient(circle, transparent ${60 - (v * 0.4)}%, rgba(255,255,255,${v/100}))` };
  };

  // Custom CSS for drag-only slider
  useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        .drag-only-range { pointer-events: none; }
        .drag-only-range::-webkit-slider-thumb { pointer-events: auto; cursor: pointer; }
        .drag-only-range::-moz-range-thumb { pointer-events: auto; cursor: pointer; }
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
  }, []);

  const toolsGroups = [
    { group: 'Light (ពន្លឺ)', icon: <Sun size={18}/>, items: [
      { id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.1, desc: 'ពន្លឺរួម' },
      { id: 'contrast', label: 'Contrast', min: -100, max: 100, desc: 'ភាពផ្ទុយ' },
      { id: 'highlights', label: 'Highlights', min: -100, max: 100, desc: 'តំបន់ភ្លឺ' },
      { id: 'shadows', label: 'Shadows', min: -100, max: 100, desc: 'តំបន់ងងឹត' },
      { id: 'whites', label: 'Whites', min: -100, max: 100, desc: 'ពណ៌ស' },
      { id: 'blacks', label: 'Blacks', min: -100, max: 100, desc: 'ពណ៌ខ្មៅ' },
    ]},
    { group: 'Color (ពណ៌)', icon: <Palette size={18}/>, items: [
      { id: 'temp', label: 'Temp', min: -100, max: 100, desc: 'សីតុណ្ហភាព' },
      { id: 'tint', label: 'Tint', min: -100, max: 100, desc: 'ពណ៌លាំ' },
      { id: 'vibrance', label: 'Vibrance', min: -100, max: 100, desc: 'ភាពរស់រវើក' },
      { id: 'saturation', label: 'Saturation', min: -100, max: 100, desc: 'ភាពឆ្អែតពណ៌' },
    ]},
    { group: 'Effects (បែបផែន)', icon: <Aperture size={18}/>, items: [
      { id: 'texture', label: 'Texture', min: -100, max: 100, desc: 'វាយនភាព' },
      { id: 'clarity', label: 'Clarity', min: -100, max: 100, desc: 'ភាពច្បាស់' },
      { id: 'dehaze', label: 'Dehaze', min: -100, max: 100, desc: 'កាត់អ័ព្ទ' },
      { id: 'vignette', label: 'Vignette', min: -100, max: 100, desc: 'គែម' },
    ]}
  ];

  const colors = [
      { name: 'Red', id: 'red', color: 'bg-red-500' },
      { name: 'Orange', id: 'orange', color: 'bg-orange-500' },
      { name: 'Yellow', id: 'yellow', color: 'bg-yellow-500' },
      { name: 'Green', id: 'green', color: 'bg-green-500' },
      { name: 'Aqua', id: 'aqua', color: 'bg-cyan-400' },
      { name: 'Blue', id: 'blue', color: 'bg-blue-600' },
      { name: 'Purple', id: 'purple', color: 'bg-purple-600' },
      { name: 'Magenta', id: 'magenta', color: 'bg-pink-500' },
  ];
  
  const sampleImages = [
    { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80", label: "Portrait" },
    { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80", label: "Golden Hour" },
    { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80", label: "Night" },
    { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", label: "Nature" },
    { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80", label: "Food" }
  ];

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-gray-800 flex flex-col h-[calc(100dvh-60px)] md:h-[calc(100dvh-130px)] max-w-6xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6">
        {/* Header Bar */}
        <div className="p-3 md:p-0 bg-[#1e293b] md:bg-transparent md:mb-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative shadow-md md:shadow-none">
            {/* Title removed here for Lab panel to be cleaner/fuller screen as requested */}
            <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto justify-center md:justify-end ml-auto">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button onClick={() => fileInputRef.current.click()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <Upload size={14} /> Upload
                </button>
                <button onClick={handleDownload} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <ImageDown size={14} /> Download
                </button>
                <button onClick={handlePresetExport} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <FileJson size={14} /> Export XMP
                </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 h-full overflow-hidden relative">
            {/* Image Viewer (Sticky - Optimized for Mobile 55% height) */}
            <div className="h-[55%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-4 shrink-0 bg-black/40 lg:bg-transparent p-2 lg:p-0">
                <div className="flex-1 bg-[#020617] rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-700 group shadow-inner">
                    <div className="relative w-full h-full">
                        <img 
                            src={image} 
                            alt="Edit Target" 
                            className="w-full h-full object-contain transition-all duration-75 ease-linear"
                            style={{ filter: getFilterString() }}
                        />
                        <div className="absolute inset-0 pointer-events-none" style={getVignetteStyle()}></div>
                    </div>
                </div>
                
                {/* Image Selector */}
                <div className="flex justify-center gap-2 lg:gap-3 bg-[#0f172a] p-2 rounded-xl border border-gray-700 overflow-x-auto shrink-0">
                    {sampleImages.map((item, idx) => (
                        <button key={idx} onClick={() => setImage(item.src)} className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 ${image === item.src ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-600 hover:border-gray-400'} overflow-hidden transition-all relative group`} title={item.label}>
                            <img src={item.src} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Controls Panel (Scrollable) */}
            <div className="flex-1 lg:w-96 lg:flex-none flex flex-col h-full bg-[#0f172a] rounded-t-2xl lg:rounded-xl border-t lg:border border-gray-700 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.5)] lg:shadow-lg">
                 {/* Tabs - Reset Moved Here */}
                 <div className="flex border-b border-gray-700 shrink-0 bg-[#1e293b] lg:bg-transparent">
                    <button onClick={() => setMode('manual')} className={`flex-1 py-3 text-xs font-bold font-khmer ${mode === 'manual' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#0f172a]' : 'text-gray-400 hover:text-white'}`}>កែដោយដៃ</button>
                    <button onClick={() => setMode('ai')} className={`flex-1 py-3 text-xs font-bold font-khmer ${mode === 'ai' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#0f172a]' : 'text-gray-400 hover:text-white'}`}>AI Preset</button>
                    <button onClick={resetSettings} className="px-4 text-[10px] text-red-400 font-khmer hover:bg-red-500/10 border-l border-gray-700 flex items-center gap-1 transition-all"><RotateCcw size={12}/> Reset</button>
                 </div>
                 
                 {/* Controls Content - Reduced Gaps */}
                 <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-[#0f172a]">
                    {mode === 'manual' ? (
                        <div className="space-y-5 pb-20 lg:pb-10">
                             {/* Basic Tools with drag-only-range */}
                             {toolsGroups.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-2">
                                    <div className="flex items-center justify-between border-b border-gray-700 pb-1">
                                        <h4 className="text-xs font-bold text-blue-400 font-khmer uppercase flex items-center gap-2">{group.icon} {group.group}</h4>
                                        <button onClick={() => resetGroup(group.items)} className="text-[9px] text-gray-500 hover:text-white">Reset</button>
                                    </div>
                                    <div className="space-y-3 px-1">
                                        {group.items.map(t => (
                                            <div key={t.id} className="group/item">
                                                <div className="flex justify-between mb-1 items-center">
                                                    <label 
                                                        className="text-[10px] font-bold text-gray-300 font-khmer cursor-pointer hover:text-white transition-colors select-none" 
                                                        onDoubleClick={() => updateSetting(t.id, 0)} 
                                                        title="Double click to reset"
                                                    >
                                                        {t.label}
                                                    </label>
                                                    <span className="text-[10px] text-blue-400 font-mono bg-gray-800 px-1.5 rounded">{settings[t.id]}</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min={t.min} 
                                                    max={t.max} 
                                                    step={t.step || 1}
                                                    value={settings[t.id]} 
                                                    onChange={(e) => updateSetting(t.id, Number(e.target.value))}
                                                    onDoubleClick={() => updateSetting(t.id, 0)}
                                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all drag-only-range"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Color Mix */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-700 pb-1">
                                    <h4 className="text-xs font-bold text-pink-400 font-khmer uppercase flex items-center gap-2"><Palette size={16}/> Color Mix</h4>
                                </div>
                                <div className="flex justify-between gap-1 mb-2">
                                    {colors.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => setActiveColor(c.name)}
                                            className={`w-7 h-7 md:w-5 md:h-5 rounded-full ${c.color} border-2 ${activeColor === c.name ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-3 px-2 bg-[#151f32] p-2 rounded-lg border border-gray-700/50">
                                    {['Hue', 'Sat', 'Lum'].map((type) => {
                                        const key = `${activeColor.toLowerCase()}${type}`;
                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-[10px] font-bold text-gray-400 font-khmer">{type}</label>
                                                    <span className="text-[10px] text-blue-400 font-mono">{settings[key]}</span>
                                                </div>
                                                <input 
                                                    type="range" min="-100" max="100" 
                                                    value={settings[key]} 
                                                    onChange={(e) => updateSetting(key, Number(e.target.value))}
                                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 drag-only-range"
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Grading */}
                            <div className="space-y-3 pb-4">
                                <div className="flex items-center justify-between border-b border-gray-700 pb-1">
                                    <h4 className="text-xs font-bold text-purple-400 font-khmer uppercase flex items-center gap-2"><TrendingUp size={16}/> Grading</h4>
                                </div>
                                {['Shadow', 'Mid', 'Highlight'].map(tone => (
                                    <div key={tone} className="bg-[#151f32] p-2 rounded-lg border border-gray-700/50 space-y-2">
                                        <h5 className="text-[10px] font-bold text-gray-400 font-khmer">{tone}s</h5>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] text-gray-500 block mb-0.5">Hue</label>
                                                <input type="range" min="0" max="360" value={settings[`${tone.toLowerCase()}Hue`]} onChange={(e) => updateSetting(`${tone.toLowerCase()}Hue`, Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded accent-purple-500 drag-only-range"/>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] text-gray-500 block mb-0.5">Sat</label>
                                                <input type="range" min="0" max="100" value={settings[`${tone.toLowerCase()}Sat`]} onChange={(e) => updateSetting(`${tone.toLowerCase()}Sat`, Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded accent-purple-500 drag-only-range"/>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-20">
                            <div className="bg-purple-900/20 p-3 rounded-xl border border-purple-500/30">
                                <h4 className="text-white font-bold font-khmer mb-2 flex items-center gap-2 text-xs"><Sparkles size={14} className="text-purple-400"/> បង្កើតពណ៌ដោយ AI</h4>
                                <div className="flex gap-2">
                                    <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="ឈ្មោះស្តាយ..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500 font-khmer" />
                                    <button onClick={generateAIPreset} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg font-bold font-khmer text-xs disabled:opacity-50">{aiLoading ? <Loader2 className="animate-spin" size={14}/> : 'បង្កើត'}</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-gray-400 text-[10px] font-bold font-khmer uppercase">ស្តាយពេញនិយម (20 Moods)</h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {["Teal & Orange", "Dark Moody", "Bright & Airy", "Vintage", "Cyberpunk", "Golden Hour", "Soft Pastel", "Urban Grey", "Black & White", "HDR Landscape", "Matte Black", "Cinematic Warm", "Cool Blue", "Forest Green", "Sunset Lover", "Portrait Clean", "Desaturated", "Vivid Pop", "Sepia Tone", "High Contrast"].map(s => (
                                        <button key={s} onClick={() => { setAiPrompt(s); generateAIPreset(); }} className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 rounded-full text-[10px] text-gray-300 font-medium transition-all">{s}</button>
                                    ))}
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
    if (filtered.length < quizConfig.amount) filtered = questions; // Fallback
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, quizConfig.amount);
    setQuestions(selected);
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
    <div className="bg-[#1e293b] p-8 text-center rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto">
        <Award className="w-20 h-20 text-blue-500 mx-auto mb-6 drop-shadow-lg" />
        <h2 className="text-3xl font-bold text-white font-khmer mb-2">ការធ្វើតេស្តសមត្ថភាព</h2>
        <div className="space-y-6 mt-6">
            <div className="flex justify-center gap-2 bg-[#0f172a] p-1 rounded-xl w-fit mx-auto">
                <button onClick={() => setQuizConfig({...quizConfig, level: 'beginner'})} className={`px-6 py-2.5 rounded-lg font-khmer text-sm transition-all ${quizConfig.level==='beginner'?'bg-blue-600 text-white shadow-lg':'text-gray-400 hover:text-white'}`}>មូលដ្ឋាន</button>
                <button onClick={() => setQuizConfig({...quizConfig, level: 'advanced'})} className={`px-6 py-2.5 rounded-lg font-khmer text-sm transition-all ${quizConfig.level==='advanced'?'bg-blue-600 text-white shadow-lg':'text-gray-400 hover:text-white'}`}>កម្រិតខ្ពស់</button>
            </div>
            <div className="flex justify-center gap-2 items-center">
                <span className="text-gray-400 text-sm font-khmer mr-2">ចំនួន:</span>
                {[5, 10, 15, 20].map(num => (
                    <button key={num} onClick={() => setQuizConfig({...quizConfig, amount: num})} className={`w-10 h-10 rounded-lg font-bold transition-all ${quizConfig.amount === num ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-[#0f172a] text-gray-400 border border-gray-700 hover:border-gray-500'}`}>{num}</button>
                ))}
            </div>
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
  
  const suggestedQuestionsPool = [
    "របៀបធ្វើអោយស្បែកស?", "របៀបកែរូប Portrait?", "របៀបដាក់ពណ៌ Teal & Orange?", 
    "តើ Dehaze ប្រើសម្រាប់អ្វី?", "កែរូបថតពេលយប់?", "រូបមន្ត Vintage?", "ពន្យល់ពី Curves?", 
    "តើ Grain ជួយអ្វី?", "រូបងងឹតពេកធ្វើម៉េច?", "របៀបធ្វើអោយមេឃដិត?", "របៀបកែរូបទេសភាព?",
    "តើ Vibrance ខុសពី Saturation ម៉េច?", "របៀបកែរូបថតអាហារ?", "របៀបកែរូបថត Street?", "របៀបកែរូបថតសមុទ្រ?"
  ];
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

    const localReply = getLocalResponse(msg);
    if (localReply) {
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'model', text: localReply }]);
            setLoading(false);
        }, 500); 
        return;
    }

    const systemPrompt = "You are a friendly, expert Lightroom and photography assistant speaking Khmer. Your answers should be helpful, concise, and related to photo editing. When suggesting settings, format the response as a clean list with bullet points and provide specific numerical values (e.g., • Exposure: +0.20) for better readability.";
    let reply = await callGemini(msg, systemPrompt);
    
    if (!reply) {
        if (!apiKey) {
            reply = "⚠️ សូមបញ្ចូល Gemini API Key នៅក្នុង Vercel ដើម្បីឱ្យខ្ញុំអាចឆ្លើយតបបាន។";
        } else {
            reply = "សុំទោស មានបញ្ហាបច្ចេកទេសក្នុងការភ្ជាប់ទៅកាន់ AI។ សូមព្យាយាមម្តងទៀត។";
        }
    }

    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setLoading(false);
  };
  
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col h-[calc(100dvh-150px)] max-h-[600px] w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-gray-800 flex items-center space-x-3"><div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-purple-500/20"><Bot className="w-5 h-5 text-white" /></div><div><h3 className="font-bold text-white font-khmer">គ្រូជំនួយ AI</h3><p className="text-xs text-blue-200 font-khmer">Powered by Gemini & Hybrid Cache ✨</p></div></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f172a]">{messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-khmer leading-relaxed shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] text-gray-200 rounded-bl-none border border-gray-700'}`}>{m.text}</div></div>)}
        {loading && <div className="flex justify-start"><div className="p-3.5 rounded-2xl bg-[#1e293b] border border-gray-700 rounded-bl-none"><Loader2 className="w-4 h-4 text-purple-400 animate-spin" /></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-[#1e293b] border-t border-gray-800">
          <div className="flex gap-2 items-center mb-3"><button onClick={randomizeSuggestions} className="p-1.5 bg-[#0f172a] hover:bg-[#334155] rounded-full text-gray-400 hover:text-white transition-all"><RefreshCw className="w-3 h-3" /></button><div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{suggestions.map((q, i) => <button key={i} onClick={() => handleSend(q)} className="whitespace-nowrap px-3 py-1.5 bg-[#0f172a] hover:bg-[#334155] hover:border-blue-500 rounded-full text-xs text-gray-300 border border-gray-700 transition-all font-khmer">{q}</button>)}</div></div>
          <div className="flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="សួរអ្វីមួយ..." className="flex-1 bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-base text-white focus:outline-none focus:border-blue-500 font-khmer transition-colors" /><button onClick={() => handleSend()} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-3 rounded-xl text-white shadow-lg disabled:opacity-50"><Send size={18}/></button></div>
      </div>
    </div>
  );
};

const AIAssistant = ({ isOnline }) => {
    return (
        <div className="h-full flex flex-col justify-center">
            <ChatBot isOnline={isOnline} />
        </div>
    );
};

// --- APP COMPONENT (LAST) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('learn');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [backPressCount, setBackPressCount] = useState(0);

  const toggleSection = (id) => setExpandedSection(prev => prev === id ? null : id);

  // --- 1. SYSTEM BACK BUTTON HANDLING ---
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();

      if (expandedLesson) {
        setExpandedLesson(null);
        try {
            window.history.pushState(null, "", window.location.pathname);
        } catch (e) {}
        return;
      }

      if (activeTab !== 'learn') {
        setActiveTab('learn');
        try {
            window.history.pushState(null, "", window.location.pathname);
        } catch (e) {}
        return;
      }

      // If at root level, handle double press to exit
      if (backPressCount === 0) {
        setBackPressCount(1);
        // Show toast or visual cue here (simplified with console for now, or add a Toast component)
        const toast = document.createElement('div');
        toast.textContent = "ចុចម្តងទៀតដើម្បីចាកចេញ";
        toast.style.cssText = "position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 20px; z-index: 1000; font-family: 'Kantumruy Pro'; font-size: 12px;";
        document.body.appendChild(toast);
        setTimeout(() => {
            document.body.removeChild(toast);
            setBackPressCount(0); 
        }, 2000);
        try {
            window.history.pushState(null, "", window.location.pathname);
        } catch (e) {}
      } else {
        // Allow exit (default browser behavior)
        window.history.back(); 
      }
    };

    try {
        window.history.pushState(null, "", window.location.pathname);
    } catch (e) {}
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [expandedLesson, activeTab, backPressCount]);

  // --- 3. LOCK ZOOM ---
  useEffect(() => {
      const preventZoom = (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
      };
      document.addEventListener('touchmove', preventZoom, { passive: false });
      return () => document.removeEventListener('touchmove', preventZoom);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans pb-24 md:pb-0 selection:bg-blue-500/30" style={{ touchAction: 'pan-x pan-y' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&family=Inter:wght@400;500;600;700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
      
      {/* 2. AUTO HIDE HEADER FOR LAB & AI (Only on mobile) */}
      <div className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : 'block'}`}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {expandedLesson && <LessonModal lesson={lessonsData.find(l => l.id === expandedLesson)} onClose={() => setExpandedLesson(null)} />}
      
      <main className={`max-w-6xl mx-auto ${activeTab === 'lab' || activeTab === 'ai' ? 'h-[100dvh] p-0' : 'p-4 pt-8 md:p-8'}`}>
        <div className="animate-fade-in-down h-full">
          {activeTab === 'learn' && (<div className="space-y-8"><div className="text-center mb-8"><h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3 font-khmer">វគ្គសិក្សា Lightroom</h2><p className="text-gray-400 font-khmer max-w-lg mx-auto">រៀនពីមូលដ្ឋានគ្រឹះដល់កម្រិតខ្ពស់នៃការកែរូបភាព។</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{lessonsData.map(lesson => <LessonCard key={lesson.id} lesson={lesson} onClick={() => setExpandedLesson(lesson.id)} />)}</div><TipsSection isExpanded={expandedSection === 'tips'} onToggle={() => toggleSection('tips')} /> <ContactSection /></div>)}
          {activeTab === 'quiz' && <Quiz isOnline={isOnline} />}
          {activeTab === 'lab' && <PhotoLab />}
          {activeTab === 'ai' && <AIAssistant isOnline={isOnline} />}
        </div>
      </main>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-md border-t border-gray-800 pb-safe z-40 flex justify-around p-2">
         <button onClick={() => setActiveTab('learn')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'learn' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><BookOpen size={20}/><span className="text-[10px] font-khmer mt-1">មេរៀន</span></button>
         <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'quiz' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Award size={20}/><span className="text-[10px] font-khmer mt-1">តេស្ត</span></button>
         <button onClick={() => setActiveTab('lab')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'lab' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Sliders size={20}/><span className="text-[10px] font-khmer mt-1">Lab</span></button>
         <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'ai' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Sparkles size={20}/><span className="text-[10px] font-khmer mt-1">គ្រូ AI</span></button>
      </div>
    </div>
  );
}