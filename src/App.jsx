import * as React from 'react';
const { useState, useEffect, useRef } = React;
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

// FIX: Updated Call Function with 404 Fallback
const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
  const cacheKey = prompt + (jsonMode ? "_json" : "");
  if (responseCache[cacheKey]) return responseCache[cacheKey];
  
  if (!apiKey) {
      return "⚠️ SYSTEM ERROR: រកមិនឃើញ API Key ទេ។ សូមចូលទៅកាន់ Vercel > Settings > Environment Variables ហើយដាក់ឈ្មោះថា 'VITE_GEMINI_API_KEY' រួចធ្វើការ Redeploy ឡើងវិញ។";
  }

  // Model list: Primary -> Backup
  const models = ["gemini-1.5-flash", "gemini-pro"];
  
  for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
      };

      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        
        if (response.ok) {
            const data = await response.json();
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            let result = text;
            if (jsonMode && text) {
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                result = JSON.parse(text);
            }
            responseCache[cacheKey] = result;
            return result;
        }

        // Handle specific errors
        if (response.status === 404) {
             console.warn(`Model ${model} not found (404). Switching to backup...`);
             continue; // Try next model
        }

        const errorDetail = await response.text();
        let cleanError = "មានបញ្ហាបច្ចេកទេស។";
        
        if (response.status === 400) cleanError = "⚠️ ERROR 400: API Key មិនត្រឹមត្រូវ ឬការកំណត់ខុស។";
        if (response.status === 403) cleanError = "⚠️ ERROR 403: Google Block (Restrictions)។";
        if (response.status === 429) cleanError = "⚠️ ERROR 429: ការប្រើប្រាស់លើសកំណត់ (Quota)។ សូមរង់ចាំបន្តិច។";
        
        console.error(`API Error (${model}): ${response.status} - ${errorDetail}`);
        return `${cleanError} (Code: ${response.status})`;

      } catch (error) { 
          console.error("Network Error:", error); 
          return `⚠️ NETWORK ERROR: ${error.message}. សូមពិនិត្យមើលអ៊ីនធឺណិតរបស់អ្នក។`; 
      }
  }
  
  return "⚠️ ERROR: មិនអាចភ្ជាប់ទៅកាន់ AI បានទេ។ (All models failed)";
};

// ==========================================
// 2. FULL DATASETS
// ==========================================

const lessonsData = [
  { id: 'light', title: 'ពន្លឺ (Light)', icon: <Sun className="w-6 h-6 text-yellow-400" />, description: 'ការគ្រប់គ្រងពន្លឺនិងភាពផ្ទុយ', content: [
    { tool: 'Exposure', khmer: 'ការប៉ះពន្លឺ', desc: 'កំណត់ពន្លឺរួមនៃរូបភាពទាំងមូល។ វាជាជំហានដំបូងក្នុងការកែ។', tip: 'ឧទាហរណ៍៖ រូបថតពេលល្ងាចងងឹតបន្តិច ដាក់ +0.50 ទៅ +1.00។' }, 
    { tool: 'Contrast', khmer: 'ភាពផ្ទុយ', desc: 'កំណត់គម្លាតរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។ Contrast ខ្ពស់ធ្វើឱ្យរូបដិត។', tip: 'ឧទាហរណ៍៖ រូបស្លេកៗ ដាក់ +20។ កុំឱ្យលើស +50 ប្រយ័ត្នបែកពណ៌។' }, 
    { tool: 'Highlights', khmer: 'ផ្នែកភ្លឺ', desc: 'គ្រប់គ្រងតំបន់ដែលភ្លឺខ្លាំងបំផុត (ដូចជាមេឃ ឬពន្លឺថ្ងៃ)។', tip: 'ឧទាហរណ៍៖ បើថតមេឃហើយបាត់ពពក ដាក់ -80 ដល់ -100 ដើម្បីសង្គ្រោះពពកមកវិញ។' }, 
    { tool: 'Shadows', khmer: 'ផ្នែកងងឹត', desc: 'គ្រប់គ្រងតំបន់ដែលស្ថិតក្នុងម្លប់។', tip: 'ឧទាហរណ៍៖ បើថតបញ្ច្រាស់ថ្ងៃមុខខ្មៅ ដាក់ +40 ដល់ +60 ដើម្បីឱ្យមុខភ្លឺ។' }, 
    { tool: 'Whites', khmer: 'ពណ៌ស', desc: 'កំណត់ចំណុចសបំផុត (White Point) នៃរូបភាព។', tip: 'ចុច Alt+Drag (ឬប្រើម្រាមដៃពីរ) ដើម្បីមើលកន្លែងដែលភ្លឺពេក (Clipping)។' }, 
    { tool: 'Blacks', khmer: 'ពណ៌ខ្មៅ', desc: 'កំណត់ចំណុចខ្មៅបំផុត។ ធ្វើឱ្យរូបមានជម្រៅ។', tip: 'ឧទាហរណ៍៖ ដាក់ -10 ទៅ -20 ដើម្បីឱ្យរូបមើលទៅមានទម្ងន់ និងមិនស្លេក។' }
  ] },
  { id: 'color', title: 'ពណ៌ (Color)', icon: <Droplet className="w-6 h-6 text-cyan-400" />, description: 'ការកែសម្រួលពណ៌ និង HSL', content: [
    { tool: 'Temp', khmer: 'សីតុណ្ហភាព', desc: 'កែពណ៌អោយទៅជាលឿង (ក្តៅ) ឬ ខៀវ (ត្រជាក់)។', tip: 'ឧទាហរណ៍៖ រូបថត Golden Hour ដាក់ +10។ រូបថតក្នុងអគារភ្លើងលឿង ដាក់ -10។' }, 
    { tool: 'Tint', khmer: 'ពណ៌លាំ', desc: 'កែពណ៌អោយទៅជាបៃតង ឬ ស្វាយ។ ប្រើសម្រាប់កែ White Balance។', tip: 'ឧទាហរណ៍៖ បើថតក្នុងព្រៃហើយស្បែកជាប់បៃតង ដាក់ +15 (ទៅរកស្វាយ)។' }, 
    { tool: 'Vibrance', khmer: 'ភាពរស់រវើក', desc: 'បង្កើនពណ៌ដែលស្លេក ដោយមិនប៉ះពាល់ពណ៌ដែលដិតស្រាប់ (ការពារពណ៌ស្បែក)។', tip: 'ល្អសម្រាប់រូប Portrait។ ប្រើ +20 ជំនួស Saturation។' }, 
    { tool: 'Saturation', khmer: 'កម្រិតពណ៌', desc: 'បង្កើនភាពដិតនៃពណ៌ទាំងអស់ស្មើៗគ្នា។', tip: 'ប្រើតិចៗ (-10 ទៅ +10)។ ប្រើខ្លាំងពេកធ្វើឱ្យស្បែកទៅជាពណ៌ទឹកក្រូចខ្លាំង។' }, 
    { tool: 'Color Mix', khmer: 'លាយពណ៌', desc: 'ឧបករណ៍ HSL (Hue, Saturation, Luminance) សម្រាប់កែពណ៌នីមួយៗដាច់ដោយឡែក។', tip: 'ឧទាហរណ៍ (ស្បែកស)៖ Orange Luminance +20, Saturation -10។' }
  ] },
  { id: 'effects', title: 'បែបផែន (Effects)', icon: <Aperture className="w-6 h-6 text-purple-400" />, description: 'Texture, Clarity, Dehaze', content: [
    { tool: 'Texture', khmer: 'វាយនភាព', desc: 'កែផ្ទៃអោយគ្រើម (ឃើញលម្អិត) ឬរលោង។', tip: 'ឧទាហរណ៍៖ ដាក់ -15 សម្រាប់ធ្វើឱ្យស្បែកមុខម៉ត់រលោង (Skin Smoothing)។' }, 
    { tool: 'Clarity', khmer: 'ភាពច្បាស់', desc: 'បង្កើន Contrast នៅតំបន់កណ្តាល (Midtones) ធ្វើឱ្យរូបមើលទៅរឹងមាំ។', tip: 'កុំប្រើច្រើនលើមុខមនុស្ស។ ល្អសម្រាប់រូបថត Street ឬ Landscape (+30)។' }, 
    { tool: 'Dehaze', khmer: 'កាត់អ័ព្ទ', desc: 'លុបអ័ព្ទធ្វើឱ្យរូបថ្លា ឬបន្ថែមអ័ព្ទ។', tip: 'ឧទាហរណ៍៖ ថតទេសភាពមេឃស្រអាប់ ដាក់ +20 ធ្វើឱ្យមេឃដិតនិងស្រឡះ។' }, 
    { tool: 'Vignette', khmer: 'គែមងងឹត', desc: 'ធ្វើអោយគែមរូបងងឹត ឬភ្លឺ ដើម្បីផ្តោតអារម្មណ៍ទៅកណ្តាល។', tip: 'ដាក់ -20 សម្រាប់រូប Portrait ដើម្បីឱ្យគេមើលតែតួអង្គ។' }
  ] },
  { id: 'detail', title: 'ភាពលម្អិត (Detail)', icon: <Triangle className="w-6 h-6 text-pink-400" />, description: 'Sharpening & Noise', content: [
    { tool: 'Sharpening', khmer: 'ភាពមុត', desc: 'ធ្វើអោយគែមនៃវត្ថុក្នុងរូបកាន់តែច្បាស់។', tip: 'ប្រើជាមួយ Masking (Alt/Hold) ដើម្បីកុំឱ្យមុតពេញផ្ទៃមុខ។' }, 
    { tool: 'Noise Reduction', khmer: 'កាត់បន្ថយគ្រាប់', desc: 'លុបគ្រាប់ Noise ដែលកើតឡើងពេលថតកន្លែងងងឹត (ISO ខ្ពស់)។', tip: 'ដាក់ +20 ដល់ +30 សម្រាប់រូបថតយប់។ កុំដាក់ច្រើនពេករូបនឹងក្លាយជាជ័រ។' }
  ] },
  { id: 'optics', title: 'Optics', icon: <Crop className="w-6 h-6 text-green-400" />, description: 'Lens Corrections', content: [
    { tool: 'Lens Profile', khmer: 'កែកែវថត', desc: 'កែតម្រូវការពត់កោង (Distortion) និង Vignette ដែលបង្កដោយកែវថត (Lens)។', tip: 'គួរតែបើកជានិច្ច (Enable) គ្រប់រូបភាព។' }, 
    { tool: 'Chromatic', khmer: 'ពណ៌តាមគែម', desc: 'លុបពណ៌ស្វាយ ឬបៃតងដែលមិនចង់បាននៅតាមគែមវត្ថុ (Fringing)។', tip: 'ប្រើលើរូបដែលមាន Contrast ខ្ពស់ ដូចជាថតដើមឈើទល់នឹងមេឃ។' }
  ] },
  { id: 'geometry', title: 'Geometry', icon: <Layout className="w-6 h-6 text-blue-400" />, description: 'តម្រង់រូប', content: [
    { tool: 'Upright', khmer: 'តម្រង់', desc: 'ធ្វើអោយអគារ ឬបន្ទាត់ក្នុងរូបត្រង់ដោយស្វ័យប្រវត្តិ។', tip: 'ប្រើ "Auto" សម្រាប់លទ្ធផលលឿន ឬ "Vertical" សម្រាប់ថតអគារ។' }
  ] }
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
    "desaturated": { basic: { Contrast: 20, Highlights: -10, Shadows: 10, Saturation: -40, Clarity: 10 }, grading: { Shadows: { h: 220, s: 5, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } } },
    "vivid pop": { basic: { Exposure: 0.1, Contrast: 30, Highlights: -20, Shadows: 20, Vibrance: 40, Saturation: 10, Clarity: 15 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } } },
    "sepia tone": { basic: { Contrast: 15, Highlights: -10, Shadows: 10, Temp: 30, Tint: 10, Saturation: -20, Vignette: -20 }, grading: { Shadows: { h: 40, s: 20, l: 0 }, Highlights: { h: 45, s: 10, l: 0 } } },
    "high contrast": { basic: { Contrast: 60, Highlights: -30, Shadows: 30, Whites: 30, Blacks: -30, Vibrance: 10, Clarity: 20 }, grading: { Shadows: { h: 0, s: 0, l: 0 }, Midtones: { h: 0, s: 0, l: 0 }, Highlights: { h: 0, s: 0, l: 0 } } }
};

const QA_DB = {
    "exposure": "សួស្ដី! 👋\n**Exposure (ការប៉ះពន្លឺ)** គឺជាឧបករណ៍សម្រាប់កំណត់ពន្លឺរួមនៃរូបភាព។\n👉 **របៀបប្រើ:**\n• អូសទៅស្តាំ (+): ធ្វើឱ្យរូបភាពភ្លឺ។\n• អូសទៅឆ្វេង (-): ធ្វើឱ្យរូបភាពងងឹត។\n\n💡 **Recommendation:** គួរកែ Exposure ជាមុនគេបង្អស់មុននឹងកែពណ៌!",
    "contrast": "សួស្ដី! 👋\n**Contrast (ភាពផ្ទុយ)** កំណត់ភាពដាច់ស្រឡះរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។\n\n👉 **ការណែនាំ:**\n• **Contrast ខ្ពស់ (+):** ធ្វើឱ្យរូបដិត ពណ៌ឆ្អិន (Pop)។\n• **Contrast ទាប (-):** ធ្វើឱ្យរូបស្រាល ទន់ (Soft/Dreamy)។\n\n✨ **Example:** សម្រាប់រូប Street Photography គេនិយមប្រើ Contrast ខ្ពស់។",
    "skin tone": "សួស្ដី! ដើម្បីកែ **ពណ៌ស្បែក** ឱ្យស្អាតក្នុង Lightroom សូមអនុវត្តតាមជំហាននេះ៖\n\n1. ចូលទៅកាន់ **Color Mix** > **Orange** (ពណ៌ទឹកក្រូច)។\n2. **Luminance (+):** បង្កើនពី +15 ទៅ +25 ដើម្បីឱ្យស្បែកសភ្លឺ។\n3. **Saturation (-):** បន្ថយពី -5 ទៅ -15 ដើម្បីកុំឱ្យស្បែកលឿង ឬក្រហមពេក។\n4. **Hue:** កែតិចៗទៅស្តាំ (+5) បើចង់បានលឿង ឬឆ្វេង (-5) បើចង់បានផ្កាឈូក។\n\n💡 **Recommendation:** កុំប្រើ Clarity លើមុខ វានឹងធ្វើឱ្យឃើញស្នាម។",
    "portrait": "សួស្ដី! នេះជាគន្លឹះសម្រាប់រូប **Portrait** ឱ្យស្អាត៖\n\n• **Light:** បង្កើន Shadows បន្តិច (+20) ដើម្បីឱ្យមុខភ្លឺ និងកាត់បន្ថយ Contrast បន្តិច។\n• **Color:** ប្រើ Vibrance ជំនួស Saturation ដើម្បីការពារពណ៌ស្បែក។\n• **Effects:** បន្ថយ Texture (-10) និង Clarity (-5) ដើម្បីឱ្យស្បែកម៉ត់ (Skin Softening)។\n• **Detail:** បង្កើន Sharpening (+30) តែប្រើ Masking (ចុចពីរដងហើយអូស Alt)។",
    "teal orange": "សួស្ដី! រូបមន្ត **Teal & Orange** ដ៏ពេញនិយម៖\n\n1. **Calibration (សំខាន់បំផុត):**\n   • Red Primary: Hue +50, Sat -20\n   • Blue Primary: Hue -50, Sat +50\n2. **Color Mix:**\n   • Orange: Sat (-), Lum (+)\n   • Aqua/Blue: Hue ទៅឆ្វេង (Teal)\n3. **Color Grading:**\n   • Shadows: ដាក់ពណ៌ Teal (Hue ~210)\n   • Highlights: ដាក់ពណ៌ Orange (Hue ~35)",
    "dehaze": "សួស្ដី! **Dehaze** គឺជាឧបករណ៍ដ៏មានអានុភាព៖\n\n👉 **Dehaze (+):** កាត់អ័ព្ទ ធ្វើឱ្យមេឃស្រឡះ និងពណ៌ដិតខ្លាំង។ ស័ក្តិសមសម្រាប់រូប Landscape។\n👉 **Dehaze (-):** បន្ថែមអ័ព្ទ បង្កើតបរិយាកាសស្រទន់ (Dreamy/Foggy)។\n\n⚠️ **ប្រយ័ត្ន:** ការប្រើ Dehaze (+) ច្រើនពេកអាចធ្វើឱ្យរូបមានពណ៌ដិតហួសហេតុ (Oversaturated)។",
    "night": "សួស្ដី! គន្លឹះកែរូបថត **ពេលយប់ (Night Photography)**៖\n\n1. **Light:** បន្ថយ Highlights (-100) ដើម្បីសង្គ្រោះពន្លឺភ្លើង។ បង្កើន Shadows និង Whites។\n2. **Temp:** ភាគច្រើនរូបយប់ស្អាតជាមួយពណ៌ត្រជាក់ (Temp -10)។\n3. **Detail:** សំខាន់ណាស់! បង្កើន **Noise Reduction** (+30 ទៅ +50) ដើម្បីលុបគ្រាប់ Noise។\n\n✨ **Example:** រូបថតទីក្រុងពេលយប់ (Cityscape)។",
    "vintage": "សួស្ដី! ដើម្បីបានរូបបែប **Vintage (បុរាណ)**៖\n\n1. **Tone Curve:** ទាញចំណុចខ្មៅ (Black Point) ខាងឆ្វេងក្រោមឡើងលើបន្តិច (Faded Blacks/Matte Look)។\n2. **Color:** បន្ថយ Saturation (-20)។\n3. **Effects:** បន្ថែម **Grain** (+30 ទៅ +40) ដើម្បីឱ្យដូចរូបថតហ្វីល។\n4. **Color Grading:** ដាក់ពណ៌បៃតងឬលឿងក្នុង Shadows។",
    "curves": "សួស្ដី! **Tone Curve** គឺជាឧបករណ៍កម្រិតខ្ពស់៖\n\n• **S-Curve:** ទាញពន្លឺ (Highlights) ឡើង និងងងឹត (Shadows) ចុះ បង្កើតជាអក្សរ S។ វាជួយបង្កើន Contrast បានស្អាតជាង Slider ធម្មតា។\n• **Matte Look:** ទាញចំណុចខ្មៅបំផុតឡើងលើ។\n• **RGB Curves:** ប្រើសម្រាប់កែពណ៌ក្នុងកម្រិតពន្លឺនីមួយៗ។",
    "grain": "សួស្ដី! **Grain** បន្ថែមគ្រាប់តូចៗ (Noise សិប្បនិម្មិត) ទៅក្នុងរូបភាព។\n\n👉 **ហេតុអ្វីប្រើ?**\n1. ដើម្បីបង្កើតអារម្មណ៍ Film (Cinematic/Vintage)។\n2. ដើម្បីបិទបាំង Noise មិនស្អាតដែលកើតពី ISO ខ្ពស់។\n3. ធ្វើឱ្យរូបភាពមើលទៅមានសាច់ (Texture) មិនរលោងពេក។\n\n✨ **Example:** រូបសខ្មៅ (B&W) ដាក់ Grain +40 គឺស្អាតណាស់។",
    "sky": "សួស្ដី! ដើម្បីកែ **មេឃ (Sky)** ឱ្យដិតស្អាត៖\n\n1. **Light:** បន្ថយ Highlights (-50 ដល់ -100)។\n2. **Color Mix (Blue):**\n   • **Saturation:** បង្កើន (+) ដើម្បីឱ្យខៀវដិត។\n   • **Luminance:** បន្ថយ (-) ដើម្បីឱ្យខៀវងងឹត/ធ្ងន់។\n3. **Dehaze:** បង្កើន (+10 ដល់ +20) នឹងជួយឱ្យពពកដាច់ច្បាស់។",
    "landscape": "សួស្ដី! គន្លឹះកែរូប **ទេសភាព (Landscape)**៖\n\n• **Light:** Highlights (-100), Shadows (+50) ដើម្បីឃើញព័ត៌មានទាំងមេឃនិងដី (HDR Look)។\n• **Effects:** បង្កើន Clarity (+20) និង Dehaze (+15) ឱ្យរូបច្បាស់។\n• **Color:** បង្កើន Vibrance (+30) ដើម្បីឱ្យពណ៌រស់រវើក។\n• **Composition:** កុំភ្លេចតម្រង់ជើងមេឃ (Horizon line) ឱ្យត្រង់!",
    "vibrance": "សួស្ដី! **Vibrance vs Saturation**:\n\n• **Saturation:** បង្កើនភាពដិតនៃពណ៌ *ទាំងអស់* ស្មើៗគ្នា។ អាចធ្វើឱ្យស្បែកខូចពណ៌។\n• **Vibrance:** បង្កើនភាពដិតនៃពណ៌ *ដែលស្លេក* ប៉ុណ្ណោះ ហើយការពារពណ៌ស្បែក (Skin tones)។\n\n💡 **Recommendation:** តែងតែប្រើ Vibrance មុន ជាពិសេសរូបមានមនុស្ស។",
    "food": "សួស្ដី! គន្លឹះកែរូប **អាហារ (Food)**៖\n\n1. **White Balance:** ត្រូវប្រាកដថាចានពណ៌ស គឺសពិតប្រាកដ (មិនជាប់លឿង)។\n2. **Light:** បង្កើន Whites និង Shadows ឱ្យរូបភ្លឺថ្លា (Bright & Airy)។\n3. **Effects:** បង្កើន **Texture** (+20) ឱ្យឃើញសរសៃសាច់ ឬបន្លែច្បាស់ គួរឱ្យចង់ញ៉ាំ។\n4. **Color:** បង្កើន Saturation ពណ៌ក្រហម/បៃតង/លឿង។",
    "street": "សួស្ដី! គន្លឹះកែរូប **Street Photography**៖\n\n• **Contrast:** ប្រើ Contrast និង Clarity ខ្ពស់ (+30) ដើម្បីឱ្យរូបមើលទៅរឹងមាំ (Gritty)។\n• **Highlights:** បន្ថយដើម្បីកុំឱ្យចាំង។\n• **Color:** សាកល្បង Desaturate (បន្ថយពណ៌) ឬធ្វើជាសខ្មៅ (B&W) ដើម្បីឱ្យមានអារម្មណ៍ (Mood)។\n• **Vignette:** ដាក់បន្តិច (-10) ដើម្បីឱ្យគេមើលចំកណ្តាល។",
    "moody": "សួស្ដី! ដើម្បីបានរូប **Dark & Moody**៖\n\n• **Exposure:** បន្ថយបន្តិច (-0.5)។\n• **Contrast:** ប្រើ Contrast ទាប ប៉ុន្តែទាញ Blacks ចុះ (-30)។\n• **Color:** បន្ថយ Saturation (-40) ស្ទើរតែគ្រប់ពណ៌ លើកលែងតែពណ៌ស្បែក (Orange)។\n• **Grading:** ដាក់ពណ៌ខៀវស្រាលក្នុង Shadows។",
    "sharpness": "សួស្ដី! ការប្រើ **Sharpening**៖\n\n• **Amount:** កំណត់កម្រិតភាពមុត (+40 គឺល្មម)។\n• **Radius:** ទំហំនៃគែម (+1.0)។\n• **Masking (សំខាន់!):** សង្កត់ Alt (ឬម្រាមដៃពីរ) ពេលអូស។ ពណ៌សគឺកន្លែងដែលនឹងមុត ពណ៌ខ្មៅគឺមិនប៉ះពាល់។ ព្យាយាមឱ្យមុតតែគែមវត្ថុ កុំឱ្យមុតលើផ្ទៃរលោង (ដូចមេឃ ឬស្បែក)។",
    "export": "សួស្ដី! ការ **Export** រូបភាព៖\n\n• **JPG (Small):** សម្រាប់បង្ហោះ Facebook/Instagram (លឿន)។\n• **JPG (Large/100%):** សម្រាប់បោះពុម្ព ឬទុកជាឯកសារ។\n• **DNG:** រក្សាទុកជា RAW អាចយកទៅកែបន្តក្នុងកម្មវិធីផ្សេងដោយមិនបាត់បង់គុណភាព។\n• **Watermark:** អាចដាក់ឈ្មោះរបស់អ្នកបានក្នុង Settings។",
    "histogram": "សួស្ដី! **Histogram** គឺជាក្រាហ្វបង្ហាញពន្លឺ៖\n\n• **ឆ្វេង:** តំបន់ងងឹត (Shadows/Blacks)។\n• **កណ្តាល:** តំបន់ពន្លឺមធ្យម (Midtones)។\n• **ស្តាំ:** តំបន់ភ្លឺ (Highlights/Whites)។\n\n💡 **Tip:** រូបដែលល្អ (Correct Exposure) គួរតែមានក្រាហ្វនៅកណ្តាល មិនប៉ះជញ្ជាំងឆ្វេង (ងងឹតឈុល) ឬស្តាំ (ភ្លឺចាំង) ខ្លាំងពេកទេ។",
    "masking": "សួស្ដី! **Masking** (កែតំបន់ជាក់លាក់)៖\n\n• **Select Subject:** AI ជ្រើសរើសមនុស្ស/វត្ថុឯង។ ល្អសម្រាប់ធ្វើឱ្យតួអង្គភ្លឺ។\n• **Select Sky:** AI ជ្រើសរើសមេឃ។ ល្អសម្រាប់ធ្វើឱ្យមេឃដិត។\n• **Linear Gradient:** អូសពីក្រោម/លើ។ ល្អសម្រាប់ធ្វើឱ្យដីភ្លឺ ឬមេឃងងឹត។\n• **Radial Gradient:** ជារង្វង់។ ល្អសម្រាប់បង្កើតពន្លឺព្រះអាទិត្យ ឬ Highlight មុខ។",
    "sunset": "សួស្ដី! គន្លឹះកែរូប **ថ្ងៃលិច (Sunset)**៖\n\n• **White Balance:** បង្កើន Temp (+) និង Tint (+) ដើម្បីឱ្យពណ៌មាស/ស្វាយកាន់តែខ្លាំង។\n• **Highlights:** បន្ថយ (-100) ដើម្បីឃើញដួងអាទិត្យច្បាស់។\n• **Shadows:** បង្កើន (+) ដើម្បីឃើញផ្ទៃខាងមុខ (Foreground)។\n• **Color Mix:** បង្កើន Saturation ពណ៌លឿង និងទឹកក្រូច។",
    "raw": "សួស្ដី! **RAW (DNG)** vs **JPEG**:\n\n• **RAW:** ផ្ទុកព័ត៌មានពន្លឺ/ពណ៌ច្រើន។ អាចកែ Highlights/Shadows បានល្អជាងឆ្ងាយ។ ឯកសារធំ។\n• **JPEG:** រូបភាពដែលកាមេរ៉ាកែសម្រួលរួច។ ឯកសារតូច។\n\n💡 **Recommendation:** បើចង់កែរូបបានស្អាត គួរថតជា RAW (DNG) ក្នុង Lightroom Camera។",
    "split tone": "សួស្ដី! **Split Toning** (ឥឡូវហៅថា Color Grading)៖\n\nប្រើសម្រាប់ដាក់ពណ៌ផ្សេងគ្នាទៅក្នុង Shadows និង Highlights។\n\n✨ **Classic Example:**\n• **Highlights:** ដាក់ពណ៌លឿង/ទឹកក្រូច (កក់ក្តៅ)។\n• **Shadows:** ដាក់ពណ៌ខៀវ/Teal (ត្រជាក់)។\nនេះបង្កើតបានជា 'Color Contrast' ដែលធ្វើឱ្យរូបមានជម្រៅ។",
    "healing": "សួស្ដី! **Healing Brush** ប្រើសម្រាប់លុបស្នាម ឬវត្ថុមិនចង់បាន។\n\n• **Heal:** ចម្លងកន្លែងផ្សេងមកបិទ (Copy texture)។\n• **Clone:** ចម្លងទាំងស្រុង (Copy pixels)។\n\n💡 **Tip:** ប្រើ Heal សម្រាប់លុបមុន ឬស្នាមលើមុខ ព្រោះវាបញ្ចូលពណ៌បានល្អជាង។",
    "geometry": "សួស្ដី! **Geometry** ប្រើសម្រាប់រូបថតអគារ (Architecture)។\n\n• **Upright Auto:** តម្រង់ដោយស្វ័យប្រវត្តិ។\n• **Upright Vertical:** តម្រង់តែសសរឈរឱ្យត្រង់ (កុំឱ្យអគារដួល)។\n• **Distortion:** កែការពត់កោងរបស់ឡេន (Fisheye effect)។"
};

const TIPS_LIST = [
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើម ហើយកែតម្រូវតាមក្រោយ។", 
    "ចុចសង្កត់លើរូបដើម្បីមើល Before/After ភ្លាមៗ។", 
    "ចុចពីរដង (Double Tap) លើ Slider ដើម្បី Reset តម្លៃទៅ 0។", 
    "ប្រើម្រាមដៃពីរចុចលើអេក្រង់ពេលអូស Slider (Whites/Blacks) ដើម្បីមើល Clipping (J Mode)។", 
    "Export ជា DNG ដើម្បីចែករំលែក Preset ទៅមិត្តភក្តិ។", 
    "ប្រើ Grid (Rule of Thirds) ពេលថត ដើម្បីសមាសភាពល្អ។",
    "ដាក់ Rating (ផ្កាយ) លើរូបដែលចូលចិត្ត ដើម្បីងាយស្រួលរក។", 
    "ប្រើ Color Noise Reduction (+15) សម្រាប់រូបថតយប់ ដើម្បីកាត់បន្ថយគ្រាប់ពណ៌។", 
    "ប្រើ Calibration (Blue Primary Saturation +) ដើម្បីឱ្យពណ៌ស្លឹកឈើ និងស្បែកស្អាត។",
    "កុំប្រើ Clarity លើសពី +20 លើរូប Portrait វាធ្វើឱ្យស្បែកមើលទៅចាស់។", 
    "ប្រើ Radial Gradient បង្កើតពន្លឺព្រះអាទិត្យ (Sun Flare) សិប្បនិម្មិត។", 
    "បន្ថយ Highlights (-100) ជាជំហានដំបូងដើម្បីសង្គ្រោះព័ត៌មានមេឃ។",
    "តម្លើង Shadows សម្រាប់រូប Backlit (ថតបញ្ច្រាស់ថ្ងៃ)។", 
    "ប្រើ Linear Gradient ទាញពីក្រោមឡើងលើ ដើម្បីធ្វើឱ្យដីភ្លឺ តែមេឃនៅដដែល។", 
    "ប្រើ Healing Brush (Mode: Heal) ដើម្បីលុបមុន ឬស្នាមតូចៗ។",
    "ប្រើ Masking 'Select Subject' រួចបង្កើន Exposure ដើម្បីឱ្យតួអង្គភ្លឺជាង Background (Pop)។", 
    "ប្រើ Vignette (-10 ដល់ -20) ដើម្បីផ្តោតចំណាប់អារម្មណ៍ទៅកណ្តាលរូប។", 
    "ប្រើ Geometry 'Upright Vertical' ពេលថតអគារ ដើម្បីកុំឱ្យអគារមើលទៅដួល។",
    "ប្រើ Dehaze បន្តិច (+10) សម្រាប់រូប Landscape ដើម្បីកាត់អ័ព្ទ។", 
    "ប្រើ Texture ជំនួស Sharpening សម្រាប់បង្កើនភាពលម្អិតនៃថ្ម ឬឈើ។", 
    "ប្រើ Vibrance ជំនួស Saturation សម្រាប់រូបមនុស្ស (ការពារពណ៌ស្បែក)។",
    "សាកល្បងប្តូរទៅជាសខ្មៅ (B&W) ប្រសិនបើពណ៌រូបភាពមិនស្អាត ឬរញ៉េរញ៉ៃ។", 
    "ប្រើ Split Toning (Shadows: Teal, Highlights: Orange) សម្រាប់ Cinematic Look។", 
    "ប្រើ Tone Curve (S-Curve) ដើម្បីទទួលបាន Contrast ដែលស្អាតជាង Slider ធម្មតា។",
    "បើក Lens Profile Correction ជានិច្ច ដើម្បីកែការបង្ខូចទ្រង់ទ្រាយរបស់ឡេន។", 
    "Crop រូបភាពក្នុងអនុបាត 4:5 សម្រាប់ការបង្ហោះលើ Instagram/Facebook (ពេញអេក្រង់)។", 
    "បង្កើត Presets ផ្ទាល់ខ្លួន ដើម្បីកែរូបភាពមួយឈុតឱ្យមានពណ៌ដូចគ្នា (Consistency)។",
    "ប្រើ Versions ដើម្បីសាកល្បងការកែច្រើនបែប លើរូបតែមួយដោយមិនបាត់ការកែចាស់។", 
    "មើល Histogram៖ បើក្រាហ្វប៉ះខាងឆ្វេងខ្លាំង=ងងឹតពេក, ប៉ះស្តាំខ្លាំង=ភ្លឺពេក។", 
    "ចុចលើលេខនៅចុង Slider ដើម្បីវាយបញ្ចូលលេខដោយផ្ទាល់ (សម្រាប់ភាពជាក់លាក់)។",
    "Blacks -10 ធ្វើឱ្យរូបភាពមានជម្រៅ (Depth) និងមិនមើលទៅស្លេក។", 
    "Whites +10 ធ្វើឱ្យរូបភាពភ្លឺថ្លា (Brilliant)។",
    "ប្រើ Invert Mask ដើម្បីកែផ្ទៃខាងក្រោយ (Background) ដោយមិនប៉ះពាល់តួអង្គ។",
    "Temperature -5 ធ្វើឱ្យរូបភាពមើលទៅទំនើប (Modern/Clean) ជាងពណ៌លឿងខ្លាំង។",
    "ថតជា RAW (DNG) ក្នុងកម្មវិធី Lightroom ដើម្បីគុណភាពខ្ពស់បំផុត។",
    "ប្រើ Long Press លើឧបករណ៍ Masking ដើម្បីបង្ហាញជម្រើសបន្ថែម (Intersect/Subtract)។"
];

const initialQuestionBank = [
  { id: 1, question: "ឧបករណ៍មួយណាសម្រាប់កែពន្លឺរួមនៃរូបភាព?", options: ["Contrast", "Exposure", "Highlights", "Shadows"], correct: 1, level: "beginner" },
  { id: 2, question: "Contrast មានតួនាទីអ្វី?", options: ["កែពន្លឺឱ្យភ្លឺ", "ធ្វើឱ្យរូបភាពច្បាស់", "កំណត់គម្លាតរវាងកន្លែងភ្លឺនិងងងឹត", "កែពណ៌ឱ្យដិត"], correct: 2, level: "beginner" },
  { id: 3, question: "ដើម្បីសង្គ្រោះព័ត៌មាននៅផ្នែកមេឃដែលភ្លឺពេក តើគួរកែអ្វី?", options: ["Highlights (-)", "Shadows (+)", "Whites (+)", "Exposure (+)"], correct: 0, level: "beginner" },
  { id: 4, question: "ដើម្បីមើលឃើញព័ត៌មានក្នុងម្លប់ដែលងងឹត តើគួរកែអ្វី?", options: ["Highlights (-)", "Shadows (+)", "Blacks (-)", "Contrast (+)"], correct: 1, level: "beginner" },
  { id: 5, question: "Temp (Temperature) ប្រើសម្រាប់អ្វី?", options: ["កែពណ៌បៃតង/ស្វាយ", "កែពណ៌លឿង/ខៀវ", "កែពន្លឺ", "កែភាពច្បាស់"], correct: 1, level: "beginner" },
  { id: 6, question: "Tint ប្រើសម្រាប់អ្វី?", options: ["កែពណ៌បៃតង/ស្វាយ", "កែពណ៌លឿង/ខៀវ", "កែពន្លឺ", "កែភាពច្បាស់"], correct: 0, level: "beginner" },
  { id: 7, question: "តើ Vibrance ខុសពី Saturation យ៉ាងដូចម្តេច?", options: ["Vibrance កែពណ៌ទាំងអស់ស្មើគ្នា", "Vibrance ការពារពណ៌ស្បែកមិនឱ្យដិតពេក", "Vibrance សម្រាប់តែរូបសខ្មៅ", "គ្មានអ្វីខុសគ្នាទេ"], correct: 1, level: "beginner" },
  { id: 8, question: "ដើម្បីធ្វើឱ្យស្បែកស តើត្រូវកែពណ៌អ្វីក្នុង Color Mix?", options: ["Red", "Orange", "Yellow", "Green"], correct: 1, level: "intermediate" },
  { id: 9, question: "ក្នុង Color Mix (Orange) តើត្រូវកែអ្វីដើម្បីឱ្យស្បែកភ្លឺ?", options: ["Hue", "Saturation", "Luminance", "All of above"], correct: 2, level: "intermediate" },
  { id: 10, question: "ដើម្បីធ្វើឱ្យមេឃពណ៌ខៀវដិតស្អាត តើគួរកែពណ៌អ្វី?", options: ["Blue Saturation (+), Luminance (-)", "Blue Hue (+)", "Blue Luminance (+)", "Aqua Saturation (+)"], correct: 0, level: "intermediate" },
  { id: 11, question: "Clarity ប្រើសម្រាប់អ្វី?", options: ["ធ្វើឱ្យរូបភាពស្រាល", "បង្កើន Contrast នៅផ្នែកកណ្តាល (Midtones)", "បន្ថែម Noise", "ប្តូរពណ៌"], correct: 1, level: "beginner" },
  { id: 12, question: "Dehaze ប្រើសម្រាប់អ្វី?", options: ["កាត់អ័ព្ទ ឬធ្វើឱ្យមេឃស្រឡះ", "ធ្វើឱ្យរូបភាពព្រិល", "ប្តូរពណ៌មេឃ", "បន្ថែមពន្លឺ"], correct: 0, level: "beginner" },
  { id: 13, question: "Vignette ធ្វើឱ្យរូបភាពមានលក្ខណៈដូចម្តេច?", options: ["ភ្លឺកណ្តាល", "ងងឹតឬភ្លឺនៅតាមគែមទាំង ៤", "ច្បាស់ទាំងអស់", "ប្តូរពណ៌"], correct: 1, level: "beginner" },
  { id: 14, question: "Grain ប្រើសម្រាប់អ្វី?", options: ["ធ្វើឱ្យរូបភាពច្បាស់", "បន្ថែមគ្រាប់តូចៗបែប Film", "លុប Noise", "កែពណ៌"], correct: 1, level: "intermediate" },
  { id: 15, question: "Sharpening ប្រើសម្រាប់អ្វី?", options: ["ធ្វើឱ្យរូបភាពទន់", "ធ្វើឱ្យគែមក្នុងរូបភាពច្បាស់ (មុត)", "ប្តូរពណ៌", "កែពន្លឺ"], correct: 1, level: "beginner" },
  { id: 16, question: "Noise Reduction ប្រើសម្រាប់អ្វី?", options: ["បន្ថែមគ្រាប់", "លុបគ្រាប់ Noise (រូបភាពរលោង)", "ធ្វើឱ្យរូបភាពច្បាស់", "កែពណ៌"], correct: 1, level: "beginner" },
  { id: 17, question: "Optics 'Remove Chromatic Aberration' ជួយអ្វី?", options: ["លុបពណ៌ស្វាយ/បៃតងនៅតាមគែមវត្ថុ", "ធ្វើឱ្យរូបភាពច្បាស់", "កែពន្លឺ", "កែទ្រង់ទ្រាយ"], correct: 0, level: "intermediate" },
  { id: 18, question: "Lens Profile Correction ជួយអ្វី?", options: ["កែការបង្ខូចទ្រង់ទ្រាយរបស់លែន (Distortion)", "កែពណ៌", "កែពន្លឺ", "កែភាពច្បាស់"], correct: 0, level: "intermediate" },
  { id: 19, question: "Crop Ratio 4:5 គឺស័ក្តិសមសម្រាប់អ្វី?", options: ["Facebook Story", "Instagram Post (Portrait)", "YouTube Thumbnail", "Desktop Wallpaper"], correct: 1, level: "beginner" },
  { id: 20, question: "Color Grading 'Shadows' ប្រើសម្រាប់អ្វី?", options: ["ដាក់ពណ៌ទៅក្នុងកន្លែងភ្លឺ", "ដាក់ពណ៌ទៅក្នុងកន្លែងងងឹត", "ដាក់ពណ៌ទៅក្នុងកន្លែងកណ្តាល", "ដាក់ពណ៌ទាំងអស់"], correct: 1, level: "intermediate" },
  { id: 21, question: "Color Grading 'Highlights' ប្រើសម្រាប់អ្វី?", options: ["ដាក់ពណ៌ទៅក្នុងកន្លែងភ្លឺ", "ដាក់ពណ៌ទៅក្នុងកន្លែងងងឹត", "ដាក់ពណ៌ទៅក្នុងកន្លែងកណ្តាល", "ដាក់ពណ៌ទាំងអស់"], correct: 0, level: "intermediate" },
  { id: 22, question: "តើ S-Curve ក្នុង Tone Curve បង្កើតអ្វី?", options: ["រូបភាពស្រាល (Low Contrast)", "រូបភាពដិត (High Contrast)", "រូបភាពសខ្មៅ", "រូបភាពព្រិល"], correct: 1, level: "advanced" },
  { id: 23, question: "ដើម្បីធ្វើឱ្យស្លឹកឈើពណ៌បៃតងក្លាយជាពណ៌ទឹកក្រូច តើត្រូវកែអ្វី?", options: ["Green Hue (-)", "Green Saturation (+)", "Green Luminance (+)", "Green Hue (+)"], correct: 0, level: "intermediate" },
  { id: 24, question: "Masking 'Select Subject' ប្រើសម្រាប់អ្វី?", options: ["ជ្រើសរើសមេឃ", "ជ្រើសរើសវត្ថុ ឬមនុស្សដោយស្វ័យប្រវត្តិ", "ជ្រើសរើសផ្ទៃខាងក្រោយ", "ជ្រើសរើសពណ៌"], correct: 1, level: "intermediate" },
  { id: 25, question: "Masking 'Select Sky' ប្រើសម្រាប់អ្វី?", options: ["ជ្រើសរើសមេឃដោយស្វ័យប្រវត្តិ", "ជ្រើសរើសដី", "ជ្រើសរើសមនុស្ស", "ជ្រើសរើសពន្លឺ"], correct: 0, level: "intermediate" },
  { id: 26, question: "Linear Gradient ប្រើសម្រាប់អ្វី?", options: ["កែតំបន់ជារង្វង់", "កែតំបន់ជាបន្ទាត់ត្រង់ (បន្លាយ)", "កែពណ៌ទាំងមូល", "កែតែចំណុចតូច"], correct: 1, level: "intermediate" },
  { id: 27, question: "Radial Gradient ប្រើសម្រាប់អ្វី?", options: ["កែតំបន់ជារង្វង់", "កែតំបន់ជាបន្ទាត់", "កែពណ៌ទាំងមូល", "កែតែចំណុចតូច"], correct: 0, level: "intermediate" },
  { id: 28, question: "Healing Brush ប្រើសម្រាប់អ្វី?", options: ["លុបវត្ថុដែលមិនចង់បាន", "គូររូប", "ប្តូរពណ៌", "កែពន្លឺ"], correct: 0, level: "beginner" },
  { id: 29, question: "ដើម្បី Copy ការកែពីរូបមួយទៅរូបមួយទៀត ត្រូវចូលទៅណា?", options: ["Export", "Settings > Copy Settings", "Crop", "Masking"], correct: 1, level: "beginner" },
  { id: 30, question: "តើ Preset ជាអ្វី?", options: ["ការកំណត់កែរូបដែលបានរក្សាទុក", "រូបភាពដើម", "កម្មវិធីថតរូប", "ប្រភេទកាមេរ៉ា"], correct: 0, level: "beginner" },
  { id: 31, question: "DNG គឺជាអ្វី?", options: ["រូបភាព JPEG", "រូបភាព RAW ដែលមានព័ត៌មានច្រើន", "វីដេអូ", "ឯកសារអត្ថបទ"], correct: 1, level: "advanced" },
  { id: 32, question: "តើធ្វើដូចម្តេចដើម្បីមើលកន្លែងដែលដាច់ព័ត៌មាន (Clipping)?", options: ["ប្រើម្រាមដៃពីរចុចលើអេក្រង់ពេលអូស Slider", "ចុចប៊ូតុង Auto", "ប្រើ Crop", "ប្រើ Masking"], correct: 0, level: "advanced" },
  { id: 33, question: "Geometry 'Upright' ប្រើសម្រាប់អ្វី?", options: ["តម្រង់អគារ ឬបន្ទាត់ឱ្យត្រង់", "ធ្វើឱ្យរូបភាពកោង", "បង្វិលរូបភាព", "កាត់រូបភាព"], correct: 0, level: "intermediate" },
  { id: 34, question: "តើ 'Matte Look' ធ្វើឡើងដោយរបៀបណា?", options: ["ទាញចំណុចខ្មៅក្នុង Tone Curve ឡើងលើ", "បង្កើន Contrast", "បង្កើន Saturation", "ប្រើ Dehaze"], correct: 0, level: "advanced" },
  { id: 35, question: "តើការប្រើ 'Auto' នៅក្នុង Light panel ធ្វើអ្វី?", options: ["កែពន្លឺដោយស្វ័យប្រវត្តិ", "កែពណ៌ដោយស្វ័យប្រវត្តិ", "កាត់រូបភាព", "លុប Noise"], correct: 0, level: "beginner" },
  { id: 36, question: "ដើម្បីបង្កើតរូបភាពសខ្មៅ (B&W) តើត្រូវធ្វើដូចម្តេច?", options: ["Saturation -100", "Vibrance -100", "ចុចប៊ូតុង B&W", "ទាំងអស់គឺត្រូវ"], correct: 3, level: "beginner" },
  { id: 37, question: "Calibration 'Blue Primary' ពេញនិយមសម្រាប់អ្វី?", options: ["កែពណ៌ស្បែក និងស្លឹកឈើឱ្យមានពណ៌ទាក់ទាញ (Teal & Orange)", "កែពណ៌មេឃ", "កែពន្លឺ", "កែ Noise"], correct: 0, level: "advanced" },
  { id: 38, question: "តើឧបករណ៍អ្វីជួយកែភ្នែកក្រហម (Red Eye)?", options: ["Healing Brush", "Red Eye Correction", "Masking", "Crop"], correct: 1, level: "beginner" },
  { id: 39, question: "Invert Mask មានន័យថាអ្វី?", options: ["ត្រឡប់តំបន់ដែលបានជ្រើសរើស (ផ្ទុយ)", "លុប Mask", "បង្កើត Mask ថ្មី", "កែពណ៌ Mask"], correct: 0, level: "intermediate" },
  { id: 40, question: "តើ Feather ក្នុង Masking ប្រើសម្រាប់អ្វី?", options: ["ធ្វើឱ្យគែម Mask ទន់ (ព្រិល)", "ធ្វើឱ្យគែម Mask មុត", "ប្តូរពណ៌ Mask", "លុប Mask"], correct: 0, level: "intermediate" },
  { id: 41, question: "តើ Versions ប្រើសម្រាប់អ្វី?", options: ["រក្សាទុកការកែសម្រួលផ្សេងៗគ្នានៃរូបភាពតែមួយ", "Export រូបភាព", "ចែករំលែករូបភាព", "លុបរូបភាព"], correct: 0, level: "intermediate" },
  { id: 42, question: "តើការចុចពីរដង (Double Tap) លើ Slider នឹងមានលទ្ធផលអ្វី?", options: ["Reset តម្លៃនោះទៅ 0 ឬ Default", "បង្កើនតម្លៃដល់ 100", "បន្ថយតម្លៃដល់ -100", "គ្មានអ្វីកើតឡើង"], correct: 0, level: "beginner" },
  { id: 43, question: "តើ Texture ខុសពី Sharpening យ៉ាងដូចម្តេច?", options: ["Texture កែផ្ទៃកណ្តាល (Mid-frequency), Sharpening កែគែម (High-frequency)", "ដូចតែគ្នា", "Sharpening សម្រាប់តែពណ៌", "Texture សម្រាប់តែពន្លឺ"], correct: 0, level: "advanced" },
  { id: 44, question: "តើពណ៌អ្វីដែលមិនមាននៅក្នុង Color Mix (HSL)?", options: ["Red", "Blue", "Cyan", "Black"], correct: 3, level: "beginner" },
  { id: 45, question: "Targeted Adjustment Tool ប្រើសម្រាប់អ្វី?", options: ["កែពណ៌ ឬពន្លឺដោយការអូសផ្ទាល់លើរូបភាព", "កែដោយស្វ័យប្រវត្តិ", "កាត់រូបភាព", "បន្ថែមអក្សរ"], correct: 0, level: "advanced" },
  { id: 46, question: "តើអ្វីទៅជា 'Aspect Ratio'?", options: ["សមាមាត្រទទឹងនិងបណ្តោយនៃរូបភាព", "ទំហំឯកសារ", "គុណភាពរូបភាព", "ពណ៌រូបភាព"], correct: 0, level: "beginner" },
  { id: 47, question: "តើ 'Constraint Crop' ប្រើសម្រាប់អ្វី?", options: ["រក្សាសមាមាត្រដើមពេលកាត់រូប", "កាត់រូបតាមចិត្ត", "បង្វិលរូប", "ត្រឡប់រូប"], correct: 0, level: "beginner" },
  { id: 48, question: "តើការ Export 'Small' មានប្រយោជន៍អ្វី?", options: ["ចែករំលែកលឿនលើបណ្តាញសង្គម", "បោះពុម្ពខ្នាតធំ", "រក្សាគុណភាពដើម", "កែសម្រួលបន្ត"], correct: 0, level: "beginner" },
  { id: 49, question: "តើអាចដាក់ Watermark ក្នុង Lightroom Mobile បានទេ?", options: ["បាន", "មិនបាន", "បានតែក្នុង PC", "បានតែគណនី Premium"], correct: 0, level: "beginner" },
  { id: 50, question: "តើការប្រើ 'Previous' ក្នុង Presets មានន័យថាអ្វី?", options: ["ប្រើការកែសម្រួលពីរូបភាពមុន", "ប្រើ Preset ដើម", "លុបការកែសម្រួល", "ទៅរូបភាពមុន"], correct: 0, level: "intermediate" },
];

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
        <div className="relative rounded-full overflow-hidden shadow-2xl border border-white/10 mx-auto group ring-1 ring-white/5" style={{ width: size, height: size, background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} ref={wheelRef} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}>
            <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, white, transparent 70%)', opacity: 0.3, pointerEvents: 'none' }}></div>
            <div className="absolute w-5 h-5 bg-white rounded-full border-2 border-black/80 shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-100 ease-spring group-hover:scale-125" style={{ left: handleX, top: handleY }}></div>
        </div>
    );
};

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : ''} bg-black/80 backdrop-blur-xl text-white sticky top-0 z-50 border-b border-white/10`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('learn')}>
          <div className="w-10 h-10 relative rounded-xl overflow-hidden shadow-lg flex-shrink-0 group-hover:shadow-blue-500/20 transition-all duration-500 ease-spring group-hover:scale-105 bg-white/5 p-1.5 border border-white/10">
             <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <h1 className="text-xl font-bold font-khmer text-white tracking-tight group-hover:opacity-80 transition-opacity">ម៉ាយឌីហ្សាញ</h1>
        </div>
        <nav className="hidden md:flex space-x-1 bg-[#1C1C1E] p-1.5 rounded-full border border-white/10 shadow-lg">
          {['learn', 'quiz', 'lab', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-full transition-all duration-300 ease-spring flex items-center gap-2 whitespace-nowrap font-medium text-sm ${activeTab === t ? 'bg-[#2C2C2E] text-white shadow-md ring-1 ring-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
               {t === 'learn' && <BookOpen size={16}/>}{t === 'quiz' && <Award size={16}/>}{t === 'lab' && <Sliders size={16}/>}{t === 'ai' && <Bot size={16}/>}
               <span className="font-khmer font-bold uppercase hidden lg:block tracking-wide text-[11px]">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'គ្រូ AI'}</span>
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
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ease-out ${closing ? 'opacity-0' : 'opacity-100'}`} style={{ opacity: Math.max(0, opacity) }} onClick={handleClose} />
          <div ref={modalRef} className={`relative w-full max-w-3xl bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] h-[85vh] sm:h-auto transition-transform duration-500 ease-spring ring-1 ring-white/10 ${closing ? 'translate-y-full' : 'translate-y-0'}`} style={{ transform: `translateY(${closing ? '100%' : `${dragOffset}px`})`, transition: dragOffset > 0 ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
             <div className="w-full flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing sm:hidden" onClick={handleClose}><div className="w-12 h-1.5 bg-[#3A3A3C] rounded-full"></div></div>
             <div className="bg-[#1C1C1E] border-b border-white/5 p-6 flex items-center justify-between sticky top-0 z-10 shrink-0 rounded-t-3xl">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">{lesson.icon}</div>
                    <h2 className="text-2xl font-bold font-khmer text-white tracking-tight">{lesson.title}</h2>
                </div>
                <button onClick={handleClose} className="p-2.5 bg-[#2C2C2E] hover:bg-[#3A3A3C] rounded-full text-gray-400 hover:text-white transition-colors"><XCircle className="w-6 h-6" /></button>
             </div>
             <div className="scroll-content flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain bg-[#000000]">
                {lesson.content.map((item, idx) => (
                    <div key={idx} className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 shadow-sm hover:border-white/10 transition-colors group">
                        <div className="flex justify-between items-center mb-3 gap-3">
                            <span className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{item.tool}</span>
                            <span className="text-xs font-bold bg-[#2C2C2E] text-gray-300 px-3 py-1.5 rounded-lg font-khmer border border-white/5 whitespace-nowrap">{item.khmer}</span>
                        </div>
                        <p className="text-gray-400 text-base font-khmer leading-relaxed">{item.desc}</p>
                        {item.tip && <div className="mt-4 pt-4 border-t border-white/5 flex items-start space-x-3"><span className="text-lg">💡</span><p className="text-yellow-500/90 text-sm font-khmer font-medium leading-relaxed">{item.tip}</p></div>}
                    </div>
                ))}
             </div>
          </div>
      </div>
  )
};

const LessonCard = ({ lesson, onClick }) => (
    <button onClick={onClick} className="bg-[#1C1C1E] rounded-3xl overflow-hidden border border-white/5 transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-95 cursor-pointer w-full text-left relative shadow-lg hover:shadow-2xl hover:shadow-black/50 group">
      <div className="p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
            <div className="bg-[#2C2C2E] w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center shadow-inner border border-white/5 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors text-gray-300">
                {lesson.icon}
            </div>
            <div>
                <h3 className="font-bold text-white text-lg font-khmer group-hover:text-blue-400 transition-colors tracking-tight mb-0.5">{lesson.title}</h3>
                <p className="text-gray-500 text-xs font-khmer line-clamp-1 leading-relaxed">{lesson.description}</p>
            </div>
        </div>
        <div className="bg-[#2C2C2E] p-2.5 rounded-full text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-all transform group-hover:translate-x-1 flex-shrink-0 ml-4"><ChevronRight className="w-4 h-4" /></div>
      </div>
    </button>
);

const TipsSection = ({ isExpanded, onToggle }) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * TIPS_LIST.length));
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS_LIST.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isExpanded]);

  const nextTip = (e) => {
    e.stopPropagation();
    setTipIndex((prev) => (prev + 1) % TIPS_LIST.length);
  };

  return (
    <div className="mt-12">
      <button onClick={onToggle} className="w-full flex items-center justify-between bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 hover:bg-[#2C2C2E] transition-all duration-300 group active:scale-95">
        <div className="flex items-center space-x-5">
            <div className="bg-blue-500/10 p-3 rounded-2xl group-hover:bg-blue-500/20 transition-colors ring-1 ring-blue-500/20"><PlayCircle className="w-6 h-6 text-blue-400" /></div>
            <h3 className="font-bold text-white text-xl font-khmer tracking-tight">គន្លឹះបន្ថែម (Tips)</h3>
        </div>
        <ChevronRight className={`w-6 h-6 text-gray-500 transition-transform duration-500 ease-spring ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      {isExpanded && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] border border-white/5 rounded-3xl p-8 md:col-span-2 relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[180px]">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             
             <div className="flex justify-between items-center mb-6 relative z-10">
                 <h4 className="font-bold text-white font-khmer flex items-center gap-3 text-lg whitespace-nowrap">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> គន្លឹះពិសេស (Pro Tip)
                 </h4>
                 <button 
                    onClick={nextTip} 
                    className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-4 py-2 rounded-full font-khmer transition-all font-bold tracking-wide border border-white/5 active:scale-95 whitespace-nowrap"
                 >
                    គន្លឹះថ្មី
                 </button>
             </div>
             
             <div className="relative z-10 flex-1 flex items-center">
                 <p key={tipIndex} className="text-gray-300 text-base font-khmer leading-relaxed border-l-4 border-blue-500 pl-6 py-2 animate-fade-in-up">
                    {TIPS_LIST[tipIndex]}
                 </p>
             </div>
          </div>
          <div className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-8 md:col-span-2 shadow-xl">
            <h4 className="font-bold text-white font-khmer mb-6 flex items-center text-lg"><Zap className="w-5 h-5 mr-3 text-yellow-400" /> គន្លឹះប្រើកម្មវិធី (Shortcut Tricks)</h4>
            <ul className="space-y-4 text-sm text-gray-400 font-khmer">
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-[#2C2C2E]/50 border border-white/5 hover:bg-[#2C2C2E] transition-colors">
                <span className="font-bold text-blue-400 bg-blue-500/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">1</span>
                <span>
                    <span className="font-bold text-white block mb-1">មើលរូបដើម (Before/After)៖</span> 
                    ចុចសង្កត់លើរូបភាពដើម្បីមើលរូបដើម (Before) ហើយដកដៃចេញដើម្បីមើលរូបដែលកែរួច (After)។
                </span>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-[#2C2C2E]/50 border border-white/5 hover:bg-[#2C2C2E] transition-colors">
                <span className="font-bold text-blue-400 bg-blue-500/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">2</span>
                <span>
                    <span className="font-bold text-white block mb-1">Reset តម្លៃ Slider៖</span> 
                    ចុចពីរដងលើរង្វង់មូលនៃ Slider ណាមួយ ដើម្បីត្រឡប់តម្លៃនោះទៅ 0 វិញភ្លាមៗ។
                </span>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-[#2C2C2E]/50 border border-white/5 hover:bg-[#2C2C2E] transition-colors">
                <span className="font-bold text-blue-400 bg-blue-500/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">3</span>
                <span>
                    <span className="font-bold text-white block mb-1">មើល Clipping (J Mode)៖</span> 
                    ពេលកំពុងអូស Slider (Whites/Blacks/Exposure) យកម្រាមដៃមួយទៀតចុចលើអេក្រង់ ដើម្បីមើលកន្លែងដែលដាច់ព័ត៌មាន។
                </span>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-[#2C2C2E]/50 border border-white/5 hover:bg-[#2C2C2E] transition-colors">
                <span className="font-bold text-blue-400 bg-blue-500/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">4</span>
                <span>
                    <span className="font-bold text-white block mb-1">Copy/Paste ពណ៌៖</span> 
                    ចុចលើសញ្ញា (...) ជ្រុងលើស្តាំ {'>'} "Copy Settings" រួចបើករូបថ្មីចុច (...) {'>'} "Paste Settings" ដើម្បីចម្លងការកែទាំងអស់។
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactSection = () => (
  <div className="mt-16 mb-10 border-t border-white/10 pt-10">
      <h3 className="text-center text-gray-500 text-xs font-khmer mb-8 tracking-[0.2em] uppercase font-bold">ទំនាក់ទំនង & ស្វែងយល់បន្ថែម</h3>
      <div className="flex justify-center gap-8">
          <a href="https://web.facebook.com/mydesignpro" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-[#1C1C1E] rounded-2xl flex items-center justify-center shadow-lg border border-white/5 group-hover:border-blue-500/50 group-hover:bg-blue-600 transition-all duration-300 ease-spring group-hover:scale-110 group-hover:rotate-3">
                  <Facebook className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] text-gray-500 font-khmer font-bold group-hover:text-blue-400 transition-colors">Facebook</span>
          </a>
          <a href="https://t.me/koymy" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-[#1C1C1E] rounded-2xl flex items-center justify-center shadow-lg border border-white/5 group-hover:border-sky-400/50 group-hover:bg-sky-500 transition-all duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                  <Send className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors ml-0.5 mt-0.5" />
              </div>
              <span className="text-[10px] text-gray-500 font-khmer font-bold group-hover:text-sky-400 transition-colors">Telegram</span>
          </a>
          <a href="https://myaffinity.gumroad.com" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-[#1C1C1E] rounded-2xl flex items-center justify-center shadow-lg border border-white/5 group-hover:border-pink-500/50 group-hover:bg-pink-600 transition-all duration-300 ease-spring group-hover:scale-110 group-hover:rotate-3">
                  <Globe className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] text-gray-500 font-khmer font-bold group-hover:text-pink-400 transition-colors">Website</span>
          </a>
      </div>
      <p className="text-center text-gray-600 text-[10px] mt-12 font-khmer tracking-wider uppercase opacity-50">© 2026 My Design. Crafted with Passion.</p>
  </div>
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

  const generateAIPreset = async (manualPrompt = null) => {
      const targetPrompt = typeof manualPrompt === 'string' ? manualPrompt : aiPrompt;
      if (!targetPrompt.trim()) return; 
      setAiLoading(true);
      if (typeof manualPrompt === 'string') setAiPrompt(manualPrompt);

      const localPreset = getLocalPreset(targetPrompt);
      if (localPreset && localPreset.basic) { applyPresetToSettings(localPreset); setAiLoading(false); return; }
      
      const prompt = `Create a Lightroom preset for style "${targetPrompt}". Return JSON.`;
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

  useEffect(() => { const style = document.createElement('style'); style.innerHTML = `.grad-hue { background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red); } .grad-sat { background: linear-gradient(to right, #333, #ccc); } .grad-lum { background: linear-gradient(to right, black, white); } input[type=range] { -webkit-appearance: none; background: transparent; pointer-events: none; } input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #ffffff; border: 1px solid #000000; box-shadow: 0 2px 5px rgba(0,0,0,0.4); margin-top: -7px; cursor: grab; pointer-events: auto; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); } input[type=range]::-webkit-slider-thumb:active { transform: scale(1.3); cursor: grabbing; } input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #3A3A3C; border-radius: 10px; }`; document.head.appendChild(style); return () => document.head.removeChild(style); }, []);
  const toolsGroups = [ { group: 'Light', icon: <Sun size={18}/>, items: [{ id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.1 }, { id: 'contrast', label: 'Contrast', min: -100, max: 100 }, { id: 'highlights', label: 'Highlights', min: -100, max: 100 }, { id: 'shadows', label: 'Shadows', min: -100, max: 100 }, { id: 'whites', label: 'Whites', min: -100, max: 100 }, { id: 'blacks', label: 'Blacks', min: -100, max: 100 }] }, { group: 'Color', icon: <Palette size={18}/>, items: [{ id: 'temp', label: 'Temp', min: -100, max: 100 }, { id: 'tint', label: 'Tint', min: -100, max: 100 }, { id: 'vibrance', label: 'Vibrance', min: -100, max: 100 }, { id: 'saturation', label: 'Saturation', min: -100, max: 100 }] }, { group: 'Effects', icon: <Aperture size={18}/>, items: [{ id: 'texture', label: 'Texture', min: -100, max: 100 }, { id: 'clarity', label: 'Clarity', min: -100, max: 100 }, { id: 'dehaze', label: 'Dehaze', min: -100, max: 100 }, { id: 'vignette', label: 'Vignette', min: -100, max: 100 }] } ];
  const colors = [ { name: 'Red', id: 'red', color: 'bg-red-500' }, { name: 'Orange', id: 'orange', color: 'bg-orange-500' }, { name: 'Yellow', id: 'yellow', color: 'bg-yellow-500' }, { name: 'Green', id: 'green', color: 'bg-green-500' }, { name: 'Aqua', id: 'aqua', color: 'bg-cyan-400' }, { name: 'Blue', id: 'blue', color: 'bg-blue-600' }, { name: 'Purple', id: 'purple', color: 'bg-purple-600' }, { name: 'Magenta', id: 'magenta', color: 'bg-pink-500' } ];
  const sampleImages = [ { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80", label: "Portrait" }, { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80", label: "Golden Hour" }, { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80", label: "Night" }, { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", label: "Nature" }, { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80", label: "Food" } ];

  const updateGrading = (tone, hue, sat) => {
     updateSetting(tone === 'Shadows' ? 'shadowHue' : tone === 'Midtones' ? 'midHue' : 'highlightHue', hue);
     updateSetting(tone === 'Shadows' ? 'shadowSat' : tone === 'Midtones' ? 'midSat' : 'highlightSat', sat);
  };

  return (
    <div className="bg-[#000000] rounded-3xl border border-white/10 flex flex-col h-[calc(100dvh-60px)] md:h-[calc(100dvh-130px)] max-w-7xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6 fixed inset-0 z-0">
        <div className="p-1 md:p-0 bg-[#000000] md:bg-transparent md:mb-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative shadow-md md:shadow-none">
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:justify-end ml-auto px-2 md:px-0">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button onClick={() => fileInputRef.current.click()} className="px-3 py-1 bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/10 text-white rounded-xl font-bold text-[10px] transition-all flex flex-row items-center justify-center gap-2"><Upload size={14} /> Upload</button>
                <button onClick={handleDownload} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] transition-all flex flex-row items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><ImageDown size={14} /> Download</button>
                <button onClick={handlePresetExport} className="px-3 py-1 bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/10 text-white rounded-xl font-bold text-[10px] transition-all flex flex-row items-center justify-center gap-2"><FileJson size={14} /> Export XMP</button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 h-full overflow-hidden relative">
            <div className="h-[45%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-6 shrink-0 bg-black/40 lg:bg-transparent px-2 pb-2 pt-0 lg:p-0">
                <div className="flex-1 bg-[#1C1C1E] rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center relative border border-white/5 group shadow-2xl">
                    <div className="relative w-full h-full"><img src={image} className="w-full h-full object-cover scale-110 transition-all duration-100 ease-linear" style={{ filter: getFilterString() }} /><div className="absolute inset-0 pointer-events-none" style={getVignetteStyle()}></div></div>
                </div>
                <div className="flex justify-center gap-2 lg:gap-4 bg-[#1C1C1E] p-2 rounded-3xl border border-white/5 overflow-x-auto shrink-0 shadow-lg no-scrollbar">{sampleImages.map((item, idx) => (<button key={idx} onClick={() => setImage(item.src)} className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 ${image === item.src ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'} overflow-hidden transition-all duration-300 ease-spring relative group shadow-md`} title={item.label}><img src={item.src} className="w-full h-full object-cover" /></button>))}</div>
            </div>

            <div className="flex-1 lg:w-96 xl:w-[400px] lg:flex-none flex flex-col h-full bg-[#1C1C1E] rounded-t-3xl lg:rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                 <div className="flex border-b border-white/10 shrink-0 bg-[#2C2C2E] p-1.5 m-2 rounded-2xl">
                    <button onClick={() => setMode('manual')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-khmer transition-all duration-300 ease-spring ${mode === 'manual' ? 'bg-[#3A3A3C] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>កែដោយដៃ</button>
                    <button onClick={() => setMode('ai')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-khmer transition-all duration-300 ease-spring ${mode === 'ai' ? 'bg-[#3A3A3C] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>AI Preset</button>
                    <button onClick={resetSettings} className="px-4 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl flex items-center gap-1 transition-all ml-1"><RotateCcw size={16}/></button>
                 </div>
                 
                 <div className="flex-1 flex flex-col bg-[#1C1C1E] overflow-hidden relative">
                    {mode === 'manual' ? (
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2 pb-24 lg:pb-10">
                             {toolsGroups.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-1">
                                    <div className="flex items-center justify-between pb-0 border-b border-white/5"><h4 className="text-xs font-bold text-gray-400 font-khmer uppercase flex items-center gap-2 tracking-wider">{group.icon} {group.group}</h4><button onClick={() => resetGroup(group.items)} className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors font-bold uppercase tracking-wider">Reset</button></div>
                                    <div className="space-y-1">
                                        {group.items.map(t => (
                                            <div key={t.id} className="group/item">
                                                <div className="flex justify-between mb-0.5 items-center">
                                                    <label className="text-xs font-bold text-gray-300 font-khmer cursor-pointer hover:text-white transition-colors" onDoubleClick={() => updateSetting(t.id, 0)}>{t.label}</label>
                                                    <span className="text-xs text-blue-400 font-mono font-bold">{settings[t.id].toFixed(t.step < 1 ? 1 : 0)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateSetting(t.id, settings[t.id] - (t.step || 1))} className="text-gray-500 hover:text-white transition-colors active:scale-90"><Minus size={14}/></button>
                                                    <input type="range" min={t.min} max={t.max} step={t.step || 1} value={settings[t.id]} onChange={(e) => updateSetting(t.id, Number(e.target.value))} className="flex-1" />
                                                    <button onClick={() => updateSetting(t.id, settings[t.id] + (t.step || 1))} className="text-gray-500 hover:text-white transition-colors active:scale-90"><Plus size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-0 border-b border-white/5"><h4 className="text-xs font-bold text-gray-400 font-khmer uppercase flex items-center gap-2 tracking-wider"><Palette size={16}/> Color Mix</h4></div>
                                <div className="flex justify-between gap-2 mb-2">
                                    {colors.map(c => (<button key={c.id} onClick={() => setActiveColor(c.name)} className={`w-8 h-8 rounded-full ${c.color} border-2 ${activeColor === c.name ? 'border-white scale-110 shadow-lg ring-2 ring-white/10' : 'border-transparent opacity-40 hover:opacity-100'} transition-all duration-300 ease-spring`} />))}
                                </div>
                                <div className="space-y-2 px-2">
                                    {['Hue', 'Sat', 'Lum'].map((type) => {
                                        const key = `${activeColor.toLowerCase()}${type}`;
                                        return (
                                            <div key={key} className="flex items-center gap-2">
                                                <label className="text-[10px] font-bold text-gray-400 font-khmer w-8 uppercase tracking-wider">{type}</label>
                                                <input type="range" min="-100" max="100" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer ${type === 'Hue' ? 'grad-hue' : type === 'Sat' ? 'grad-sat' : 'grad-lum'}`} />
                                                <input type="number" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className="w-10 bg-transparent text-xs font-bold text-right text-white outline-none" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2 pb-4">
                                <div className="flex items-center justify-between pb-0 border-b border-white/5"><h4 className="text-xs font-bold text-gray-400 font-khmer uppercase flex items-center gap-2 tracking-wider"><TrendingUp size={16}/> Grading</h4></div>
                                <div className="flex justify-around mb-2 bg-[#2C2C2E] p-1.5 rounded-xl">
                                    {['Shadows', 'Midtones', 'Highlights'].map(t => (
                                        <button key={t} onClick={() => setGradingTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 ease-spring ${gradingTab === t ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                                    ))}
                                </div>
                                <div className="p-1 space-y-2">
                                    <div className="flex justify-center py-1">
                                        <ColorWheel 
                                            hue={settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']}
                                            sat={settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']}
                                            onChange={(h, s) => updateGrading(gradingTab, h, s)}
                                            size={140}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 px-1">
                                        <label className="text-[10px] font-bold text-gray-400 w-8 uppercase tracking-wider">Lum</label>
                                        <input type="range" min="-100" max="100" value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} className="flex-1"/>
                                        <input type="number" className="w-10 bg-transparent text-xs font-bold text-right text-white outline-none" value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} />
                                    </div>
                                    <div className="pt-1 border-t border-white/5 space-y-1 px-1">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex justify-between"><label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Blending</label><span className="text-[10px] text-blue-400 font-mono font-bold">{settings.gradingBlending}</span></div>
                                            <input type="range" min="0" max="100" value={settings.gradingBlending} onChange={(e) => updateSetting('gradingBlending', Number(e.target.value))} className="w-full"/>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex justify-between"><label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Balance</label><span className="text-[10px] text-blue-400 font-mono font-bold">{settings.gradingBalance}</span></div>
                                            <input type="range" min="-100" max="100" value={settings.gradingBalance} onChange={(e) => updateSetting('gradingBalance', Number(e.target.value))} className="w-full"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-[#1C1C1E]">
                            <div className="p-3 border-b border-white/5 shrink-0 z-10">
                                <div className="bg-[#2C2C2E] p-1 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="flex gap-2 items-center px-2">
                                        <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe a style (e.g. Moody Blue)..." className="flex-1 bg-transparent px-2 py-3 text-white text-sm outline-none font-khmer placeholder:text-gray-500" />
                                        <button onClick={() => generateAIPreset()} disabled={aiLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-bold font-khmer text-xs disabled:opacity-50 whitespace-nowrap active:scale-95 transition-all shadow-lg">{aiLoading ? <Loader2 className="animate-spin" size={14}/> : 'Create'}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="space-y-3 pb-20">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">AI Presets</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.keys(PRESET_DB).map(s => (
                                            <button key={s} onClick={() => { setAiPrompt(s); generateAIPreset(s); }} className="px-4 py-4 bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 ease-spring active:scale-95 group relative overflow-hidden shadow-sm hover:shadow-lg">
                                                <span className="capitalize text-xs font-bold text-gray-300 group-hover:text-white z-10 tracking-wide">{s}</span>
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
    <div className="flex h-full items-center justify-center p-4">
      <div className="bg-[#1C1C1E]/80 backdrop-blur-md p-6 sm:p-8 text-center rounded-[32px] border border-white/10 shadow-2xl max-w-lg w-full animate-fade-in-up">
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/5">
            <Award className="w-12 h-12 text-blue-400 drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-extrabold text-white font-khmer mb-3 tracking-tight">ការធ្វើតេស្ត</h2>
          <p className="text-gray-400 text-sm font-khmer mb-6 leading-relaxed">វាស់ស្ទង់សមត្ថភាពរបស់អ្នក។</p>
          <div className="space-y-6">
              <div className="flex justify-center gap-3 bg-[#000000] p-1.5 rounded-2xl w-fit mx-auto border border-white/10">
                <button onClick={() => setQuizConfig({...quizConfig, level: 'beginner'})} className={`px-6 py-2.5 rounded-xl font-khmer text-sm font-bold transition-all duration-300 ease-spring ${quizConfig.level==='beginner'?'bg-[#1C1C1E] text-white shadow-lg ring-1 ring-white/10':'text-gray-500 hover:text-white'}`}>មូលដ្ឋាន</button>
                <button onClick={() => setQuizConfig({...quizConfig, level: 'advanced'})} className={`px-6 py-2.5 rounded-xl font-khmer text-sm font-bold transition-all duration-300 ease-spring ${quizConfig.level==='advanced'?'bg-[#1C1C1E] text-white shadow-lg ring-1 ring-white/10':'text-gray-500 hover:text-white'}`}>កម្រិតខ្ពស់</button>
              </div>
              <div className="flex justify-center gap-3 items-center">
                <span className="text-gray-500 text-xs font-khmer uppercase tracking-widest font-bold">ចំនួន</span>
                {[5, 10, 15, 20].map(num => (<button key={num} onClick={() => setQuizConfig({...quizConfig, amount: num})} className={`w-10 h-10 rounded-2xl font-bold text-xs transition-all duration-300 ease-spring ${quizConfig.amount === num ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' : 'bg-[#2C2C2E] text-gray-400 border border-white/5 hover:bg-[#3A3A3C]'}`}>{num}</button>))}
              </div>
              <button onClick={startQuiz} className="w-full py-3.5 bg-white hover:bg-gray-200 text-black rounded-2xl font-bold font-khmer shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 text-sm tracking-wide">ចាប់ផ្ដើម</button>
          </div>
      </div>
    </div>
  );
  
  if (gameState === 'result') {
      const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="bg-[#1C1C1E] p-10 text-center rounded-[32px] border border-white/10 shadow-2xl max-w-lg w-full animate-fade-in-up">
            <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="64" stroke="#2C2C2E" strokeWidth="12" fill="none" />
                <circle cx="80" cy="80" r="64" stroke={percentage > 70 ? "#34C759" : percentage > 40 ? "#FFD60A" : "#FF453A"} strokeWidth="16" fill="none" strokeDasharray={402} strokeDashoffset={402 - (402 * percentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute text-4xl font-black text-white tracking-tighter">{percentage}%</div>
            </div>
            <h2 className="text-2xl font-bold text-white font-khmer mb-2">{percentage > 80 ? "អស្ចារ្យណាស់!" : "ព្យាយាមទៀត!"}</h2>
            <p className="text-gray-400 font-khmer mb-8 text-sm">ពិន្ទុរបស់អ្នក: <span className="text-white font-bold">{score}</span> / {questions.length}</p>
            <button onClick={() => setGameState('menu')} className="px-10 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white rounded-2xl font-bold font-khmer transition-all shadow-lg w-full text-sm">សាកល្បងម្តងទៀត</button>
          </div>
        </div>
      );
  }

  const q = questions[currentQuestion];
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="bg-[#1C1C1E] p-6 sm:p-10 rounded-[32px] border border-white/10 shadow-2xl max-w-3xl w-full animate-fade-in-up">
        <div className="flex justify-between mb-8 items-center">
          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full ring-1 ring-blue-500/20">{currentQuestion + 1} / {questions.length}</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{q.level || 'General'}</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-8 font-khmer leading-snug">{q.question}</h3>
        <div className="grid gap-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswerOptionClick(i)} className={`p-4 text-left rounded-2xl border transition-all duration-300 ease-spring font-khmer text-sm relative overflow-hidden group ${isAnswered ? (i === q.correct ? 'bg-[#34C759]/10 border-[#34C759] text-[#34C759]' : (i === selectedOption ? 'bg-[#FF453A]/10 border-[#FF453A] text-[#FF453A]' : 'bg-[#2C2C2E]/30 border-transparent text-gray-600 opacity-50')) : 'bg-[#2C2C2E]/50 border-transparent text-gray-200 hover:bg-[#3A3A3C]'}`}>
              <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full mr-3 text-[10px] font-bold ${isAnswered && i === q.correct ? 'bg-[#34C759] text-black' : 'bg-[#3A3A3C] text-gray-400 group-hover:bg-white group-hover:text-black transition-colors'}`}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        {isAnswered && (
          <div className="mt-8 flex justify-end animate-fade-in-up">
            <button onClick={handleNextQuestion} className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-2xl font-bold font-khmer shadow-xl transition-all flex items-center gap-2 transform hover:translate-x-1 text-sm">បន្ទាប់ <ChevronRight size={16}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatBot = ({ isOnline, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); 

  const suggestedQuestionsPool = [ "របៀបធ្វើអោយស្បែកស?", "របៀបកែរូប Portrait?", "របៀបដាក់ពណ៌ Teal & Orange?", "តើ Dehaze ប្រើសម្រាប់អ្វី?", "កែរូបថតពេលយប់?", "រូបមន្ត Vintage?", "ពន្យល់ពី Curves?", "តើ Grain ជួយអ្វី?", "រូបងងឹតពេកធ្វើម៉េច?", "របៀបធ្វើអោយមេឃដិត?", "របៀបកែរូបទេសភាព?", "តើ Vibrance ខុសពី Saturation ម៉េច?", "របៀបកែរូបថតអាហារ?", "របៀបកែរូបថត Street?", "របៀបកែរូបថតសមុទ្រ?" ];
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => { 
    // Initial shuffle
    const shuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random()); 
    setSuggestions(shuffled.slice(0, 3));

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
        const nextShuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random());
        setSuggestions(nextShuffled.slice(0, 3));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const randomizeSuggestions = () => { const shuffled = [...suggestedQuestionsPool].sort(() => 0.5 - Math.random()); setSuggestions(shuffled.slice(0, 3)); };

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
  
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  return (
    <div className="flex flex-col h-[100dvh] md:h-[700px] w-full bg-[#000000] md:rounded-[32px] overflow-hidden shadow-2xl relative md:border md:border-white/10">
      <div className="flex-none bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-center relative z-20">
         <button className="md:hidden absolute left-4 p-2 text-blue-500 hover:text-white transition-colors" onClick={() => window.history.back()}>
            <ArrowLeft size={24} />
         </button>
         
         <div className="flex flex-col items-center">
            <h3 className="font-bold text-white font-khmer text-sm tracking-wide">AI Assistant</h3>
            <p className="text-[10px] text-gray-500 font-medium">Lightroom Expert</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-[#000000]">
        <div className="flex justify-center py-4">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Today</span>
        </div>
        {messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                {m.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex-shrink-0 flex items-center justify-center mr-2 self-end shadow-md">
                        <Bot size={14} className="text-white" />
                    </div>
                )}
                <div 
                    className={`max-w-[75%] px-5 py-3 text-[15px] font-khmer leading-relaxed whitespace-pre-wrap shadow-sm relative
                    ${m.role === 'user' 
                        ? 'bg-[#0A84FF] text-white rounded-[20px] rounded-br-[4px]' 
                        : 'bg-[#2C2C2E] text-gray-100 rounded-[20px] rounded-bl-[4px]'}`}
                >
                    {m.text}
                </div>
            </div>
        ))}
        {loading && (
            <div className="flex justify-start w-full animate-fade-in-up">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex-shrink-0 flex items-center justify-center mr-2 self-end">
                        <Bot size={14} className="text-white" />
                 </div>
                 <div className="px-4 py-3 bg-[#2C2C2E] rounded-[20px] rounded-bl-[4px] flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="flex-none bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-white/5 p-4 pb-safe md:pb-4 z-20">
         {suggestions.length > 0 && (
             <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mask-gradient-right">
                {suggestions.map((q, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(q)} 
                        className="flex-shrink-0 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 text-xs rounded-full border border-white/5 transition-all duration-300 ease-spring font-khmer whitespace-nowrap active:scale-95"
                    >
                        {q}
                    </button>
                ))}
                <button onClick={randomizeSuggestions} className="flex-shrink-0 p-2 bg-[#2C2C2E] rounded-full text-gray-400 border border-white/5 hover:bg-[#3A3A3C] active:rotate-180 transition-all">
                    <RefreshCw size={14} />
                </button>
             </div>
         )}

         <div className="flex items-end gap-3">
            <div className="bg-[#2C2C2E] rounded-[20px] p-1 flex-1 border border-white/5 focus-within:border-gray-500 transition-colors flex items-center">
                <input 
                    ref={inputRef}
                    type="text"
                    name="chat-message"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && handleSend()} 
                    placeholder="iMessage" 
                    className="flex-1 bg-transparent text-white px-4 py-2.5 text-[15px] focus:outline-none font-khmer placeholder:text-gray-500 max-h-32 overflow-y-auto"
                    style={{ touchAction: 'manipulation' }}
                />
            </div>
            <button 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => handleSend()} 
                disabled={loading || !input.trim()} 
                className={`p-3 rounded-full flex-shrink-0 transition-all duration-300 ease-spring ${input.trim() ? 'bg-[#0A84FF] text-white shadow-lg scale-100' : 'bg-[#2C2C2E] text-gray-500 scale-90'}`}
            >
                <ArrowUpCircleIcon />
            </button>
         </div>
      </div>
    </div>
  );
};

// Simple arrow up circle icon for send button replacement to look like iMessage
const ArrowUpCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-0">
        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12L12 8L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const AIAssistant = ({ isOnline, messages, setMessages }) => { return <div className="h-full flex flex-col justify-center w-full p-0 md:p-6"><ChatBot isOnline={isOnline} messages={messages} setMessages={setMessages} /></div>; };

// --- APP COMPONENT (LAST) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('learn');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [backPressCount, setBackPressCount] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'model', text: 'សួស្ដី! ខ្ញុំជាគ្រូជំនួយ AI។ អ្នកអាចសួរខ្ញុំអំពីរបៀបកែរូប ឬអោយខ្ញុំណែនាំ Setting។' }]);

  const toggleSection = (id) => setExpandedSection(prev => prev === id ? null : id);

  useEffect(() => {
    const handleFocus = (e) => { if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) setIsInputFocused(true); };
    const handleBlur = (e) => { if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) setIsInputFocused(false); };
    window.addEventListener('focus', handleFocus, true); window.addEventListener('blur', handleBlur, true);
    return () => { window.removeEventListener('focus', handleFocus, true); window.removeEventListener('blur', handleBlur, true); };
  }, []);

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
      const preventZoom = (e) => { if (e.touches && e.touches.length > 1) { e.preventDefault(); } };
      document.addEventListener('touchmove', preventZoom, { passive: false });
      return () => document.removeEventListener('touchmove', preventZoom);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-[#000000] text-gray-100 font-khmer selection:bg-blue-500/30" style={{ touchAction: 'pan-x pan-y' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&family=Inter:wght@400;500;600;700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #3A3A3C; border-radius: 10px; } @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
      
      <div className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block flex-none' : 'block flex-none'}`}><Header activeTab={activeTab} setActiveTab={setActiveTab} /></div>
      {expandedLesson && <LessonModal lesson={lessonsData.find(l => l.id === expandedLesson)} onClose={() => setExpandedLesson(null)} />}
      
      <main className={`flex-1 overflow-hidden max-w-7xl mx-auto w-full relative ${activeTab === 'lab' || activeTab === 'ai' ? 'p-0' : 'p-4 pt-6 md:p-8 overflow-y-auto custom-scrollbar'}`}>
        <div className="animate-fade-in-up h-full">
          {activeTab === 'learn' && (
            <div className="space-y-12 pb-12">
              <div className="text-center mb-16 mt-8 relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                 <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-khmer relative z-10 tracking-tight leading-tight">វគ្គសិក្សា Lightroom</h2>
                 <p className="text-gray-500 font-khmer max-w-xl mx-auto text-sm leading-relaxed relative z-10 font-medium">រៀនពីមូលដ្ឋានគ្រឹះដល់កម្រិតខ្ពស់ នៃការកែរូបភាពកំរិតស្ដង់ដា។</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{lessonsData.map(lesson => <LessonCard key={lesson.id} lesson={lesson} onClick={() => setExpandedLesson(lesson.id)} />)}</div>
              <TipsSection isExpanded={expandedSection === 'tips'} onToggle={() => toggleSection('tips')} /> 
              <ContactSection />
            </div>
          )}
          {activeTab === 'quiz' && <Quiz isOnline={isOnline} />}
          {activeTab === 'lab' && <PhotoLab />}
          {activeTab === 'ai' && <AIAssistant isOnline={isOnline} messages={chatMessages} setMessages={setChatMessages} />}
        </div>
      </main>
      
      <div className={`flex-none md:hidden bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-white/10 pb-safe z-40 flex justify-around p-2 ${isInputFocused ? 'hidden' : ''}`}>
         <button onClick={() => setActiveTab('learn')} className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 w-16 ${activeTab === 'learn' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className={`mb-1 transition-transform ${activeTab === 'learn' ? '-translate-y-1 scale-110' : ''}`}><BookOpen size={24} strokeWidth={activeTab === 'learn' ? 2.5 : 2} /></div>
            <span className={`text-[10px] font-khmer font-bold transition-opacity ${activeTab === 'learn' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>មេរៀន</span>
         </button>
         <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 w-16 ${activeTab === 'quiz' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className={`mb-1 transition-transform ${activeTab === 'quiz' ? '-translate-y-1 scale-110' : ''}`}><Award size={24} strokeWidth={activeTab === 'quiz' ? 2.5 : 2} /></div>
            <span className={`text-[10px] font-khmer font-bold transition-opacity ${activeTab === 'quiz' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>តេស្ត</span>
         </button>
         <button onClick={() => setActiveTab('lab')} className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 w-16 ${activeTab === 'lab' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className={`mb-1 transition-transform ${activeTab === 'lab' ? '-translate-y-1 scale-110' : ''}`}><Sliders size={24} strokeWidth={activeTab === 'lab' ? 2.5 : 2} /></div>
            <span className={`text-[10px] font-khmer font-bold transition-opacity ${activeTab === 'lab' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Lab</span>
         </button>
         <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 w-16 ${activeTab === 'ai' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className={`mb-1 transition-transform ${activeTab === 'ai' ? '-translate-y-1 scale-110' : ''}`}><Sparkles size={24} strokeWidth={activeTab === 'ai' ? 2.5 : 2} /></div>
            <span className={`text-[10px] font-khmer font-bold transition-opacity ${activeTab === 'ai' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>គ្រូ AI</span>
         </button>
      </div>
    </div>
  );
}