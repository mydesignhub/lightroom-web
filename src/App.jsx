import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sun, Aperture, Droplet, Sliders, ChevronRight, CheckCircle, XCircle, 
  BookOpen, Award, PlayCircle, MessageCircle, Send, Sparkles, Loader2, 
  Bot, Settings, HelpCircle, BarChart, Zap, Triangle, Touchpad, 
  AlertTriangle, RotateCcw, Globe, RefreshCw, Layout, Image as ImageIcon, 
  Lightbulb, Palette, X, WifiOff, Download, TrendingUp, Share2, Clipboard, Camera,
  Layers, Crop, Save, ScanFace, Facebook, Upload, ImageDown, FileJson,
  Monitor, Smartphone, ArrowLeft, Minus, Plus, ChevronDown, ChevronUp, Search,
  Grid, List as ListIcon, Filter, Clock, Coffee, Mountain, Smile, Star,
  ThumbsUp, User
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

// --- TIPS LIST ---
const TIPS_LIST = [
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើម។", 
    "ចុចសង្កត់លើរូបដើម្បីមើល Before/After។", 
    "ចុចពីរដងលើ Slider ដើម្បី Reset។", 
    "ប្រើម្រាមដៃពីរចុចលើអេក្រង់ពេលអូស Slider (Whites/Blacks) ដើម្បីមើល Clipping។", 
    "Export ជា DNG ដើម្បីចែករំលែក Preset។", 
    "ប្រើ Masking ដើម្បីកែតែផ្នែកខ្លះនៃរូបភាព។",
    "កុំភ្លេចបើក Lens Correction គ្រប់ពេល។",
    "ប្រើ Healing Brush ដើម្បីលុបមុន ឬវត្ថុដែលមិនចង់បាន។"
];

const SUGGESTED_QUESTIONS = [
    "តើកែស្បែកមុខឱ្យសម៉ត់យ៉ាងដូចម្តេច?", "របៀបធ្វើឱ្យមេឃពណ៌ខៀវដិត?", "តើ Vibrance ខុសពី Saturation យ៉ាងណា?", "ជួយណែនាំ Preset សម្រាប់ថតនៅហាងកាហ្វេ", "របៀបកែរូបថតពេលយប់កុំឱ្យមាន Noise?", "តើអ្វីទៅជា Golden Hour?", "របៀបបង្កើតពណ៌ Teal & Orange?", "តើ Dehaze ប្រើសម្រាប់ធ្វើអ្វី?", "ណែនាំ Preset សម្រាប់ថត Pre-wedding", "របៀបធ្វើឱ្យរូបភាពច្បាស់ (Sharp)?", "តើ Tone Curve ប្រើដូចម្តេច?", "របៀបកែរូបទេសភាពឱ្យស្រស់?", "តើ HSL គឺជាអ្វី?", "របៀបធ្វើឱ្យរូបមាន Mood សោកសៅ?", "តើ Calibration ប្រើសម្រាប់អ្វី?", "របៀបកែរូបឱ្យដូចកាមេរ៉ា Film", "តើគួរ Export រូបបែបណាសម្រាប់ Facebook?", "របៀបប្រើ Masking កែតែមេឃ", "ហេតុអ្វីរូបខ្ញុំថតមកងងឹតមុខ?", "របៀបកែរូបខ្មៅស (B&W) ឱ្យស្អាត", "តើធ្វើម៉េចអោយស្លឹកឈើពណ៌បៃតងខ្មៅ?", "របៀបកែរូបអោយភ្លឺ (Bright & Airy)", "តើ Grain ប្រើដើម្បីអ្វី?", "របៀបលុបអ័ព្ទចេញពីរូប?", "របៀបកែរូបថតអាហារអោយទំនង?", "តើ Vignette គឺអ្វី?", "របៀបកែរូប Street Photography?", "របៀបកែរូប Portrait ពេលយប់?", "តើ Contrast ជួយអ្វីខ្លះ?", "របៀបកែ White Balance?", "តើ Highlights និង Whites ខុសគ្នាម៉េច?", "របៀបកែរូបលេងពណ៌ Neon?", "របៀបធ្វើអោយរូបមានជម្រៅ (Depth)?", "តើ Clarity គួរប្រើពេលណា?", "របៀបកែរូបបែប Minimalist?", "តើ Split Toning ប្រើដូចម្តេច?", "របៀបកែរូបអោយដូចរដូវស្លឹកឈើជ្រុះ?", "តើ Shadows ប្រើសម្រាប់អ្វី?", "របៀបកែរូបថតថ្ងៃរះ?", "តើ Texture ខុសពី Clarity យ៉ាងណា?", "របៀបកែរូបបែប Cyberpunk?", "តើ Lens Correction សំខាន់ទេ?", "របៀបកែរូបក្នុងអគារ (Indoor)?", "តើអ្វីជា RAW file?", "របៀបកែរូបបែប Cinematic?", "តើ Color Grading គឺអ្វី?", "របៀបកែរូបអោយមានពណ៌កក់ក្តៅ?", "របៀបកែរូបអោយមានពណ៌ត្រជាក់?", "តើ Noise Reduction ធ្វើអោយរូបបាត់លម្អិតទេ?", "របៀប Copy ពណ៌ទៅរូបផ្សេង?", "របៀប Reset ការកែប្រែទាំងអស់?", "តើធ្វើម៉េចមើលរូបមុននិងក្រោយកែ?"
];

// --- HELPER FUNCTIONS ---
const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
  const cacheKey = prompt + (jsonMode ? "_json" : "");
  if (responseCache[cacheKey]) return responseCache[cacheKey];
  
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
  };

  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) return null; 

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    let result = text;
    if (jsonMode && text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(text);
    }
    responseCache[cacheKey] = result;
    return result;
  } catch (error) { return null; }
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
    
    const getHSL = (color) => { 
        if (!Array.isArray(colorMix)) return { h: 0, s: 0, l: 0 };
        const c = colorMix.find(item => item.color === color) || {}; 
        return { h: c.h || 0, s: c.s || 0, l: c.l || 0 }; 
    };

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

const getColorName = (hue, sat = 100) => {
  if (sat < 5) return "Neutral";
  const h = Math.round(hue % 360);
  const normalizedHue = h < 0 ? h + 360 : h;

  if (normalizedHue >= 340 || normalizedHue < 15) return "Red";
  if (normalizedHue >= 15 && normalizedHue < 45) return "Orange";
  if (normalizedHue >= 45 && normalizedHue < 70) return "Yellow";
  if (normalizedHue >= 70 && normalizedHue < 140) return "Green";
  if (normalizedHue >= 140 && normalizedHue < 190) return "Teal/Aqua";
  if (normalizedHue >= 190 && normalizedHue < 260) return "Blue";
  if (normalizedHue >= 260 && normalizedHue < 300) return "Purple";
  if (normalizedHue >= 300 && normalizedHue < 340) return "Magenta";
  return "Red"; 
};

// ==========================================
// 2. DATASETS (AI Knowledge, Questions, Presets)
// ==========================================

const KNOWLEDGE_BASE = [
    // --- TOP PRIORITY (ដាក់នៅខាងលើគេ ដើម្បីកុំឱ្យជាន់ពាក្យផ្សេង) ---
    { keys: ['export', 'save', 'facebook', 'fb', 'quality'], answer: "Export សម្រាប់ Facebook ឱ្យច្បាស់៖\n- Format: JPG\n- Quality: 100%\n- Resize: Long Edge 2048 pixels\n- Sharpen for Screen: Standard" },
    { keys: ['mask', 'masking', 'select sky', 'select subject'], answer: "🎭 **Masking** (Select Sky/Subject) ល្អបំផុតសម្រាប់កែតែផ្នែកណាមួយ។ ឧទាហរណ៍ ជ្រើសរើសមេឃរួច បន្ថយ Exposure និង Highlights ដើម្បីឱ្យមេឃលេចធ្លោ។" },
    { keys: ['copy', 'paste', 'settings'], answer: "ក្នុង Lightroom: ចុចសញ្ញា ... (3 គ្រាប់) > Copy Settings > ទៅរូបថ្មី > Paste Settings។" },

    // --- SPECIFIC SCENARIOS (សាច់រឿងជាក់លាក់) ---
    { keys: ['night portrait', 'portrait ពេលយប់', 'រូបមនុស្សពេលយប់'], answer: "Portrait ពេលយប់៖\n- ប្រើ Aperture ធំ (f/1.8)\n- ក្នុង Lightroom: បង្កើន Exposure និង Shadows, តែប្រយ័ត្ន Noise។" },
    { keys: ['street', 'urban', 'ផ្លូវ', 'ទីក្រុង', 'street photography'], answer: "Street Photography:\n- Contrast: +30\n- Clarity: +20\n- Saturation: -10\n- ប្រើ Tone Curve បែប S-Curve ។" },
    { keys: ['food', 'delicious', 'អាហារ', 'ម្ហូប', 'ញ៉ាំ'], answer: "រូបអាហារ៖\n- White Balance: កុំឱ្យលឿងពេក\n- Contrast: +20\n- Structure/Texture: +10 ដើម្បីឱ្យឃើញសរសៃសាច់/បន្លែ។" },
    { keys: ['cafe', 'coffee', 'shop', 'ហាងកាហ្វេ', 'កាហ្វេ'], answer: "សម្រាប់ហាងកាហ្វេ គួរប្រើ Preset បែប **Warm & Minimalist**៖\n- Exposure: +0.2\n- Contrast: -10\n- Temp: +5\n- Shadows: +20" },
    { keys: ['wedding', 'pre-wedding', 'prewedding', 'ការងារ'], answer: "សម្រាប់ Pre-wedding និយមប្រើ **Bright & Airy**:\n- Exposure: +0.3\n- Contrast: -10\n- Shadows: +30\n- Vibrance: +20" },
    { keys: ['sunset', 'sunrise', 'ថ្ងៃលិច', 'ថ្ងៃរះ', 'golden', 'golden hour'], answer: "សួស្ដី! រូប **Sunset** ឬ Golden Hour ត្រូវការពណ៌កក់ក្តៅ។\n- **Temp**: បង្កើន (+) ទៅពណ៌លឿង/ទឹកក្រូច។\n- **Tint**: បង្កើន (+) ទៅពណ៌ស្វាយបន្តិច។\n- **Grading**: ដាក់ពណ៌ទឹកក្រូចក្នុង Highlights និងពណ៌ខៀវក្នុង Shadows។" },
    { keys: ['flower', 'macro', 'ផ្កា'], answer: "សម្រាប់រូបថតផ្កា៖\n1. បង្កើន **Texture** ដើម្បីឱ្យឃើញត្របកផ្កាច្បាស់។\n2. ប្រើ **Radial Filter** ដើម្បីធ្វើឱ្យផ្ទៃខាងក្រោយព្រិល។\n3. បង្កើន Vibrance។" },
    { keys: ['indoor', 'ក្នុងអគារ'], answer: "ថតក្នុងអគារ:\n- បង្កើន ISO/Exposure (ព្រោះងងឹត)\n- កែ White Balance (ភ្លើងអំពូលច្រើនតែលឿង)។" },
    { keys: ['night', 'dark photo', 'យប់', 'ងងឹត', 'noise'], answer: "កែរូបយប់កុំឱ្យមាន Noise៖\n1. បង្កើន **Exposure** ល្មម។\n2. សំខាន់បំផុត៖ ប្រើ **Noise Reduction** (Luminance) ប្រហែល +20 ទៅ +30។" },
    
    // --- PORTRAIT / SKIN ---
    { keys: ['skin', 'face', 'ស្បែក', 'មុខ'], answer: "ដើម្បីកែស្បែកមុខឱ្យសម៉ត់៖\n1. ចូល **Color Mix > Orange**\n2. បន្ថយ Saturation (-10 ទៅ -20)\n3. បង្កើន Luminance (+15 ទៅ +25)\n4. បន្ថយ Texture (-15) ដើម្បីឱ្យរលោង។" },
    { keys: ['eye', 'eyes', 'ភ្នែក'], answer: "ដើម្បីឱ្យភ្នែកលេចធ្លោ៖\n- ប្រើ Masking (Radial Gradient) នៅលើភ្នែក។\n- បង្កើន Exposure, Clarity, និង Saturation បន្តិច។" },
    { keys: ['teeth', 'ធ្មេញ'], answer: "ដើម្បីធ្វើឱ្យធ្មេញស៖\n- ប្រើ Brush tool លើធ្មេញ។\n- បន្ថយ Saturation (-50)។\n- បង្កើន Exposure (+0.2)។" },
    { keys: ['portrait', 'មនុស្ស', 'tua'], answer: "រូប Portrait ស្អាត៖\n- ផ្តោតលើពន្លឺមុខ (Exposure)\n- កែស្បែក (Orange HSL)\n- ធ្វើឱ្យភ្នែកច្បាស់ (Sharpening)" },

    // --- LANDSCAPE / NATURE ---
    { keys: ['sky', 'mhek', 'មេឃ'], answer: "ដើម្បីឱ្យមេឃពណ៌ខៀវដិត៖\n1. បន្ថយ **Highlights**\n2. ចូល Color Mix > **Blue**\n3. បន្ថយ Luminance (-20) និងបង្កើន Saturation (+15)។" },
    { keys: ['green', 'leaves', 'ស្លឹកឈើ'], answer: "ស្លឹកឈើបៃតងខ្មៅ (Dark Green)៖\n- Green Hue: +20\n- Green Saturation: -20\n- Green Luminance: -30" },
    { keys: ['autumn', 'fall', 'រដូវស្លឹកឈើជ្រុះ'], answer: "រដូវស្លឹកឈើជ្រុះ (Autumn):\n- Green Hue: -100 (ទៅលឿង)\n- Yellow Hue: -50 (ទៅទឹកក្រូច)\n- Temp: +10" },
    { keys: ['water', 'sea', 'beach', 'ទឹក', 'សមុទ្រ'], answer: "សម្រាប់រូបទឹកសមុទ្រ៖\n- ប្រើ **Aqua/Teal** ក្នុង Color Mix។\n- បង្កើន Clarity បន្តិច (+10) ដើម្បីឱ្យទឹកមើលទៅថ្លា។\n- បង្កើន Whites ដើម្បីឱ្យពពុះទឹកស។" },
    { keys: ['landscape', 'scenery', 'ទេសភាព', 'ព្រៃ', 'ភ្នំ'], answer: "សួស្ដី! ដើម្បីកែរូប **Landscape** ឱ្យស្រស់ស្អាត សូមសាកល្បងរូបមន្តនេះ៖\n\n1. **Light**: បន្ថយ Highlights (-40) ដើម្បីយកពពកមកវិញ, បង្កើន Shadows (+40) ដើម្បីបំភ្លឺដើមឈើ។\n2. **Color**: បង្កើន Vibrance (+20) ឱ្យពណ៌ស្រស់។\n3. **Effect**: ប្រើ Dehaze (+15) បើមានអ័ព្ទ។" },

    // --- STYLES & LOOKS ---
    { keys: ['teal', 'orange', 'teal & orange', 'teal and orange'], answer: "របៀបបង្កើត **Teal & Orange**:\n1. Shadows (Calibration/Grading) ដាក់ពណ៌ Teal (Cyan-Blue)។\n2. Highlights/Skin ដាក់ពណ៌ Orange។\n3. Primary Blue Hue: -20, Primary Red Hue: +20។" },
    { keys: ['mood', 'sad', 'dark', 'សោកសៅ'], answer: "ធ្វើឱ្យរូបមាន Mood សោកសៅ៖\n- បន្ថយ Exposure (-0.5)\n- បន្ថយ Saturation (-30)\n- ដាក់ពណ៌ខៀវ (Cool) ក្នុង Temp (-10)\n- បន្ថយ Vibrance" },
    { keys: ['film', 'analog', 'vintage', 'ហ្វីល'], answer: "កែរូបបែប **Film**:\n- បន្ថយ Contrast\n- បន្ថែម **Grain** (+30)\n- Tone Curve: លើកចំណុចខ្មៅឡើងលើ (Fade Shadows)។" },
    { keys: ['bw', 'black white', 'b&w', 'black & white', 'ខ្មៅស'], answer: "កែរូប **B&W** ឱ្យស្អាត៖\n1. ចុច B&W mode\n2. បង្កើន Contrast (+40)\n3. កែ B&W Mix: ធ្វើឱ្យពណ៌ក្រហម/ទឹកក្រូចភ្លឺ (Luminance +) ដើម្បីឱ្យមុខស។" },
    { keys: ['bright', 'airy', 'bright & airy', 'ភ្លឺ'], answer: "**Bright & Airy** គឺជារូបភ្លឺនិងស្រាល៖\n- Exposure: +0.5\n- Shadows: +50\n- Whites: +20\n- Blacks: +20\n- Contrast: -10" },
    { keys: ['neon', 'glow', 'light', 'លេងពណ៌'], answer: "កែរូប Neon:\n- Highlights: -100 (កុំឱ្យភ្លើងឆេះ)\n- Shadows: +30\n- Vibrance: +40\n- Hue: ប្តូរពណ៌ Blue/Purple ទៅតាមចិត្ត។" },
    { keys: ['minimal', 'minimalist'], answer: "Minimalist:\n- សមាសភាពរូបសាមញ្ញ\n- ពណ៌: Desaturate (បន្ថយពណ៌) ភាគច្រើន ទុកតែ 1-2 ពណ៌។\n- Exposure: ភ្លឺ។" },
    { keys: ['cyberpunk'], answer: "Cyberpunk Style:\n- Temp: ត្រជាក់ (Blue)\n- Tint: Magenta\n- Color Mix: Blue -> Cyan, Purple -> Magenta" },
    { keys: ['cinematic'], answer: "Cinematic:\n- Aspect Ratio: 16:9 ឬ 2.35:1\n- Color: Teal & Orange\n- Black point: បន្ថយបន្តិច (Faded)។" },
    { keys: ['warm', 'កក់ក្តៅ'], answer: "ពណ៌កក់ក្តៅ (Warm): បង្កើន **Temp** ទៅខាងលឿង និង **Tint** ទៅខាង Magenta បន្តិច។" },
    { keys: ['cool', 'ត្រជាក់'], answer: "ពណ៌ត្រជាក់ (Cool): បន្ថយ **Temp** ទៅខាងខៀវ។" },

    // --- TOOLS & TECHNICAL ---
    { keys: ['vibrance'], answer: "✨ **Vibrance** បង្កើនតែពណ៌ដែលស្លេក (Smart Saturation) និងការពារពណ៌ស្បែក។" },
    { keys: ['saturation'], answer: "**Saturation** បង្កើនគ្រប់ពណ៌ទាំងអស់ស្មើគ្នាដែលអាចធ្វើឱ្យរូបឆេះ។" },
    { keys: ['tone curve', 'curve'], answer: "📈 **Tone Curve** ប្រើសម្រាប់កែពន្លឺកម្រិតខ្ពស់។ បង្កើត 'S-Curve' (ទាញ Highlights ឡើង, Shadows ចុះ) ដើម្បីបាន Contrast ស្អាត។" },
    { keys: ['hsl', 'mix'], answer: "🎛️ **HSL** (Hue, Saturation, Luminance) គឺជាកន្លែងកែពណ៌នីមួយៗដាច់ដោយឡែក។ ឧ. ចង់ប្តូរពណ៌ស្លឹកឈើ ត្រូវចូលទៅ Green Hue។" },
    { keys: ['calibration'], answer: "🎚️ **Calibration** ប្រើកែពណ៌គោល (RGB)។ អ្នកថតរូបអាជីពប្រើវាដើម្បីប្តូរពណ៌ស្បែក ឬធ្វើឱ្យពណ៌ស្លឹកឈើប្លែក។" },
    { keys: ['mask', 'masking', 'subject'], answer: "🎭 **Masking** (Select Sky/Subject) ល្អបំផុតសម្រាប់កែតែផ្នែកណាមួយ។ ឧទាហរណ៍ ជ្រើសរើសមេឃរួច បន្ថយ Exposure និង Highlights ដើម្បីឱ្យមេឃលេចធ្លោ។" },
    { keys: ['dehaze', 'អ័ព្ទ', 'fog', 'mist'], answer: "🌫️ **Dehaze** ប្រើសម្រាប់កាត់អ័ព្ទ ឬផ្សែង។\n- (+) ធ្វើឱ្យរូបថ្លា និងឃើញមេឃច្បាស់។\n- (-) ធ្វើឱ្យរូបមានអ័ព្ទ (Dreamy)។" },
    { keys: ['sharp', 'sharpness', 'ច្បាស់'], answer: "ធ្វើឱ្យរូបច្បាស់ (Sharp) ដោយ៖\n1. បង្កើន **Sharpening** (+40)\n2. ប្រើ **Masking** (Alt+Drag) ដើម្បីកុំឱ្យមុតលើស្បែក។\n3. បង្កើន **Clarity** បន្តិច (+10)។" },
    { keys: ['exposure', 'ពន្លឺ'], answer: "💡 **Exposure** គឺជាពន្លឺរួមរបស់រូបភាព។\n- (+) ធ្វើឱ្យរូបភ្លឺទាំងមូល។\n- (-) ធ្វើឱ្យរូបងងឹតទាំងមូល។" },
    { keys: ['contrast'], answer: "🌗 **Contrast** កំណត់ភាពដាច់គ្នារវាងភ្លឺនិងងងឹត។ Contrast ខ្ពស់ = រូបដិត។ Contrast ទាប = រូបស្រាល (Faded)។" },
    { keys: ['highlight', 'whits', 'whites'], answer: "**Highlights** ប៉ះពាល់តែតំបន់ភ្លឺខ្លាំង (ដូចមេឃ)។ **Whites** ប៉ះពាល់ចំណុចសទាំងអស់ក្នុងរូប។ បន្ថយ Highlights ដើម្បីសង្គ្រោះពពក។" },
    { keys: ['shadow'], answer: "🌑 **Shadows** គ្រប់គ្រងតំបន់ក្នុងម្លប់។ បង្កើនវាដើម្បីឱ្យឃើញព័ត៌មានក្នុងកន្លែងងងឹត។" },
    { keys: ['black', 'blacks', 'ពណ៌ខ្មៅ'], answer: "🏴 **Blacks** កំណត់ចំណុច 'ខ្មៅ' បំផុត។ បន្ថយវា (-10) ដើម្បីឱ្យរូបភាពមានជម្រៅ (Depth)។" },
    { keys: ['white balance', 'wb'], answer: "🌡️ **White Balance** (Temp & Tint) គឺសំខាន់បំផុត។ កែវាឱ្យពណ៌ 'ស' ក្នុងរូប មើលទៅពិតជា 'ស' មិនជាប់លឿងឬខៀវ។" },
    { keys: ['split toning', 'grading', 'color grading'], answer: "🎨 **Color Grading** គឺការដាក់ពណ៌ចូលក្នុង Shadows, Midtones, និង Highlights។\nឧទាហរណ៍៖ Shadows (Teal) + Highlights (Orange) = Cinematic Look។" },
    { keys: ['grain', 'គ្រាប់'], answer: "🎞️ **Grain** គឺបន្ថែមគ្រាប់តូចៗដូចខ្សាច់។ ប្រើវាដើម្បីឱ្យរូបមើលទៅមានសិល្បៈ បុរាណ ឬបិទបាំង Noise ខ្លះៗ។" },
    { keys: ['vignette'], answer: "⚫ **Vignette** ធ្វើឱ្យគែមរូបភាពងងឹត ឬស។ ប្រើវាដើម្បីឱ្យគេផ្តោតអារម្មណ៍ទៅកណ្តាលរូប។" },
    { keys: ['noise reduction', 'noise'], answer: "🤫 **Noise Reduction** ជួយលុបគ្រាប់ដែលកើតឡើងដោយសារ ISO ខ្ពស់។ ប្រើ Luminance Noise Reduction។" },
    { keys: ['optics', 'lens correction', 'lens profile'], answer: "📷 **Lens Corrections** ជួយកែតម្រូវការពត់កោង (Distortion) និងគែមងងឹតដែលបណ្តាលមកពីកែវថត។" },
    { keys: ['geometry', 'upright'], answer: "📐 **Geometry** ជួយតម្រង់អគារ ឬបន្ទាត់ឱ្យត្រង់ (Upright)។ ល្អសម្រាប់រូបថតស្ថាបត្យកម្ម។" },
    { keys: ['histogram'], answer: "📊 **Histogram** គឺជាក្រាហ្វបង្ហាញពីពន្លឺក្នុងរូប។\n- ឆ្វេង៖ ងងឹត (Shadows)\n- កណ្តាល៖ Midtones\n- ស្តាំ៖ ភ្លឺ (Highlights)\nព្យាយាមកុំឱ្យក្រាហ្វប៉ះគែមខ្លាំងពេក។" },
    { keys: ['depth', 'dimension', 'ជម្រៅ'], answer: "បង្កើតជម្រៅ (Depth):\n1. ប្រើ Contrast\n2. បន្ថយ Blacks បន្តិច\n3. ប្រើ Radial Gradient ធ្វើឱ្យតួអង្គភ្លឺជាង Background។" },
    { keys: ['clarity'], answer: "💎 **Clarity** បង្កើន Contrast នៅ Midtones។ ធ្វើឱ្យរូបច្បាស់ រឹងមាំ។ *ប្រយ័ត្ន*៖ ធ្វើឱ្យស្បែកមុខចាស់ បើប្រើច្រើនពេក។" },
    { keys: ['texture'], answer: "**Texture** បង្កើនលម្អិតតូចៗ (ល្អសម្រាប់ស្បែក)។ បន្ថយ Texture ដើម្បីឱ្យស្បែករលោង។" },
    { keys: ['hdr', 'ច្បាស់', 'លម្អិត'], answer: "ដើម្បីឱ្យរូបច្បាស់ខ្លាំងបែប HDR:\n1. បន្ថយ Highlights (-80)\n2. បង្កើន Shadows (+80)\n3. បង្កើន Clarity និង Dehaze បន្តិច។" },

    // --- WORKFLOW & FIXES ---
    { keys: ['underexposed', 'dark face', 'ងងឹតមុខ'], answer: "បើរូបងងឹតមុខ៖\n1. ប្រើ **Shadows** (+40)\n2. ឬប្រើ Masking (Radial Gradient) នៅលើមុខ ហើយបង្កើន Exposure បន្តិច។" },
    { keys: ['blurry', 'not sharp', 'មិនច្បាស់'], answer: "បើរូបមិនច្បាស់៖\n1. បង្កើន **Sharpening**។\n2. បង្កើន **Clarity** បន្តិច។\n3. ពិនិត្យមើលថាអ្នកបាន Focus ត្រូវកន្លែងដែរឬទេ។" },
    { keys: ['dull', 'flat', 'ស្លេក'], answer: "បើរូបមើលទៅស្លេក៖\n1. បង្កើន **Contrast**។\n2. បង្កើន **Vibrance**។\n3. បន្ថយ **Blacks** ដើម្បីឱ្យមានជម្រៅ។" },
    { keys: ['too bright', 'overexposed', 'ភ្លឺពេក'], answer: "បើរូបភ្លឺពេក៖\n1. បន្ថយ **Exposure**។\n2. បន្ថយ **Highlights** និង **Whites**។" },
    { keys: ['too dark', 'underexposed', 'ងងឹតពេក'], answer: "បើរូបងងឹតពេក៖\n1. បង្កើន **Exposure**។\n2. បង្កើន **Shadows**។" },
    { keys: ['reset'], answer: "ចុចប៊ូតុង **Reset** នៅខាងក្រោម ឬចុចពីរដងលើ Slider នីមួយៗដើម្បីឱ្យវាត្រឡប់ទៅ 0។" },
    { keys: ['before', 'after', 'មុន', 'ក្រោយ'], answer: "👉 **ចុចសង្កត់** លើរូបភាពដើម្បីមើលរូបដើម (Before)។ ដកដៃចេញដើម្បីមើលរូបកែរួច (After)។" },
    { keys: ['raw'], answer: "📁 **RAW** រក្សាទុកព័ត៌មានរូបភាពទាំងស្រុង។ ពេលកែមិនងាយបែកគ្រាប់ដូច JPG ទេ។ គួរថត RAW បើអាច។" },
    
    // --- GREETINGS ---
    { keys: ['hello', 'hi', 'suesdey', 'សួស្តី', 'សួរ', 'bhat', 'jah', 'love'], answer: "សួស្ដីបាទ/ចាស! ខ្ញុំគឺ AI ជំនួយការរបស់អ្នក។ មានអ្វីឱ្យខ្ញុំជួយទាក់ទងនឹងការកែរូប Lightroom ដែរឬទេ?" },
    { keys: ['thanks', 'orkun', 'អរគុណ'], answer: "រីករាយដែលបានជួយ! មានសំណួរអ្វីផ្សេងទៀតទេ?" },
    { keys: ['help', 'ជួយ'], answer: "ខ្ញុំអាចជួយឆ្លើយសំណួរអំពី៖\n- ឧបករណ៍កែរូប (Exposure, Contrast...)\n- រូបមន្តពណ៌ (Preset)\n- បច្ចេកទេសថតរូប\nសូមសួរខ្ញុំមក!" }
];

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
    { tool: 'Noise Reduction', khmer: 'កាត់បន្ថយគ្រាប់', desc: 'លុបគ្រាប់ Noise ដែលកើតឡើងដោយសារ ISO ខ្ពស់។', tip: 'ដាក់ +20 ដល់ +30 សម្រាប់រូបថតយប់។ កុំដាក់ច្រើនពេករូបនឹងក្លាយជាជ័រ។' }
  ] },
  { id: 'optics', title: 'Optics', icon: <Crop className="w-6 h-6 text-green-400" />, description: 'Lens Corrections', content: [
    { tool: 'Lens Profile', khmer: 'កែកែវថត', desc: 'កែតម្រូវការពត់កោង (Distortion) និង Vignette ដែលបង្កដោយកែវថត (Lens)។', tip: 'គួរតែបើកជានិច្ច (Enable) គ្រប់រូបភាព។' }, 
    { tool: 'Chromatic', khmer: 'ពណ៌តាមគែម', desc: 'លុបពណ៌ស្វាយ ឬបៃតងដែលមិនចង់បាននៅតាមគែមវត្ថុ (Fringing)។', tip: 'ប្រើលើរូបដែលមាន Contrast ខ្ពស់ ដូចជាថតដើមឈើទល់នឹងមេឃ។' }
  ] },
  { id: 'geometry', title: 'Geometry', icon: <Layout className="w-6 h-6 text-blue-400" />, description: 'តម្រង់រូប', content: [
    { tool: 'Upright', khmer: 'តម្រង់', desc: 'ធ្វើអោយអគារ ឬបន្ទាត់ក្នុងរូបត្រង់ដោយស្វ័យប្រវត្តិ។', tip: 'ប្រើ "Auto" សម្រាប់លទ្ធផលលឿន ឬ "Vertical" សម្រាប់ថតអគារ។' }
  ] }
  
];

const PRESET_MOODS = [
    { id: 'mood_warm', name: 'Warm', color: 'from-orange-500 to-red-500', keywords: ['warm', 'summer', 'gold', 'sun'] },
    { id: 'mood_cool', name: 'Cool', color: 'from-blue-500 to-cyan-500', keywords: ['cool', 'winter', 'blue', 'ice'] },
    { id: 'mood_vintage', name: 'Vintage', color: 'from-yellow-600 to-orange-700', keywords: ['vintage', 'film', 'retro', 'old'] },
    { id: 'mood_moody', name: 'Moody', color: 'from-gray-700 to-gray-900', keywords: ['moody', 'dark', 'sad', 'drama'] },
    { id: 'mood_bright', name: 'Bright', color: 'from-white to-yellow-200', keywords: ['bright', 'airy', 'light', 'clean'] },
    { id: 'mood_nature', name: 'Nature', color: 'from-green-500 to-emerald-700', keywords: ['nature', 'green', 'forest', 'tree'] },
];

const generateVariations = (baseId, baseParams, count) => {
    const variants = {};
    for (let i = 1; i <= count; i++) {
        const factor = (i - 1) * 0.1; 
        const adjExposure = (baseParams.basic.Exposure || 0) + (i % 3 === 0 ? 0.05 * (i/3) : -0.05 * (i/3));
        const adjTemp = (baseParams.basic.Temp || 0) + (i * 2 * (i % 2 === 0 ? 1 : -1));
        const adjTint = (baseParams.basic.Tint || 0) + (i % 4 === 0 ? 5 : 0);
        
        variants[`${baseId}_${i}`] = {
            id: `${baseId}_${i}`,
            name: `${baseId.replace(/_/g, ' ')} ${i}`,
            basic: { ...baseParams.basic, Exposure: Number(adjExposure.toFixed(2)), Temp: adjTemp, Tint: adjTint },
            grading: baseParams.grading || {}
        };
    }
    return variants;
};

const BASE_PRESETS_DATA = {
    // --- 1. COLOR BASED (Must have all colors) ---
    ...generateVariations("color_red", { basic: { Temp: 10, Tint: 20, Saturation: 10, Vibrance: 20 }, grading: { Shadows: { h: 350, s: 15, l: 0 }, Highlights: { h: 10, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_orange", { basic: { Temp: 15, Tint: 5, Saturation: 10 }, grading: { Shadows: { h: 25, s: 20, l: 0 }, Highlights: { h: 40, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_yellow", { basic: { Temp: 10, Tint: 0, Vibrance: 30 }, grading: { Shadows: { h: 50, s: 15, l: 0 }, Highlights: { h: 60, s: 20, l: 5 } } }, 15),
    ...generateVariations("color_green", { basic: { Temp: -5, Tint: -20, Saturation: 10 }, grading: { Shadows: { h: 120, s: 20, l: -5 }, Highlights: { h: 90, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_cyan", { basic: { Temp: -10, Tint: -5, Saturation: 5 }, grading: { Shadows: { h: 180, s: 20, l: 0 }, Highlights: { h: 170, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_blue", { basic: { Temp: -20, Tint: 0, Saturation: 5 }, grading: { Shadows: { h: 220, s: 20, l: -5 }, Highlights: { h: 200, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_purple", { basic: { Temp: -5, Tint: 20, Vibrance: 15 }, grading: { Shadows: { h: 270, s: 20, l: -5 }, Highlights: { h: 280, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_pink", { basic: { Temp: 5, Tint: 25, Vibrance: 20 }, grading: { Shadows: { h: 320, s: 15, l: 0 }, Highlights: { h: 340, s: 10, l: 5 } } }, 15),
    ...generateVariations("color_teal_orange", { basic: { Exposure: 0.1, Contrast: 20, Highlights: -40, Shadows: 30, Temp: 5 }, grading: { Shadows: { h: 210, s: 20, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 35, s: 20, l: 0 } } }, 20),
    
    // --- 2. FEELING BASED ---
    ...generateVariations("feeling_moody", { basic: { Exposure: -0.2, Contrast: 30, Highlights: -50, Shadows: -10, Vibrance: -20 }, grading: { Shadows: { h: 220, s: 10, l: -10 }, Highlights: { h: 40, s: 5, l: 0 } } }, 20),
    ...generateVariations("feeling_bright", { basic: { Exposure: 0.3, Contrast: 5, Highlights: -30, Shadows: 40, Whites: 20, Vibrance: 20 }, grading: { Highlights: { h: 50, s: 5, l: 5 } } }, 15),
    ...generateVariations("feeling_soft", { basic: { Exposure: 0.1, Contrast: -10, Highlights: -20, Shadows: 20, Clarity: -15, Texture: -10 }, grading: { Midtones: { h: 30, s: 10, l: 0 } } }, 15),
    ...generateVariations("feeling_dramatic", { basic: { Exposure: 0.0, Contrast: 60, Highlights: -40, Shadows: 40, Clarity: 30, Dehaze: 10 }, grading: { Shadows: { h: 240, s: 10, l: -10 } } }, 15),

    // --- 3. TIME BASED ---
    ...generateVariations("time_golden", { basic: { Exposure: 0.1, Contrast: 15, Highlights: -20, Shadows: 20, Temp: 20, Tint: 5, Vibrance: 30 }, grading: { Shadows: { h: 40, s: 15, l: 0 }, Highlights: { h: 45, s: 20, l: 0 } } }, 15),
    ...generateVariations("time_night", { basic: { Exposure: 0.2, Contrast: 20, Highlights: 10, Shadows: 10, Temp: -10, Tint: 10, Vibrance: 40 }, grading: { Shadows: { h: 260, s: 30, l: -5 }, Highlights: { h: 300, s: 20, l: 0 } } }, 15),
    ...generateVariations("time_bluehour", { basic: { Exposure: 0.0, Contrast: 15, Temp: -25, Tint: 0, Vibrance: 20 }, grading: { Shadows: { h: 230, s: 30, l: -10 } } }, 10),

    // --- 4. SUBJECT BASED ---
    ...generateVariations("food_tasty", { basic: { Exposure: 0.2, Contrast: 25, Highlights: -10, Vibrance: 40, Saturation: 10, Clarity: 10 }, grading: { Midtones: { h: 20, s: 5, l: 0 } } }, 15),
    ...generateVariations("nature_landscape", { basic: { Contrast: 20, Highlights: -60, Shadows: 60, Vibrance: 50, Clarity: 20, Dehaze: 10 }, grading: { Highlights: { h: 200, s: 10, l: 0 } } }, 20),
    ...generateVariations("urban_street", { basic: { Exposure: 0.0, Contrast: 40, Highlights: -40, Shadows: 20, Clarity: 30, Saturation: -20 }, grading: { Shadows: { h: 200, s: 10, l: -5 } } }, 15),
    
    // --- 5. VINTAGE & FILM ---
    ...generateVariations("vintage_film", { basic: { Exposure: 0.05, Contrast: 15, Highlights: -25, Shadows: 25, Temp: 10, Tint: -5, Grain: 40 }, grading: { Shadows: { h: 210, s: 10, l: 5 }, Highlights: { h: 45, s: 15, l: 0 } } }, 20),
    ...generateVariations("bw_noir", { basic: { Contrast: 40, Highlights: -30, Shadows: 30, Whites: 20, Blacks: -30, Saturation: -100, Clarity: 20 }, grading: {} }, 15),
    ...generateVariations("cinematic_teal", { basic: { Exposure: 0.0, Contrast: 20, Highlights: -40, Shadows: 20, Vibrance: 10 }, grading: { Shadows: { h: 210, s: 30, l: -10 }, Highlights: { h: 35, s: 20, l: 0 } } }, 10),
    
    // --- 6. WEDDING & PORTRAIT ---
    ...generateVariations("bright_airy", { basic: { Exposure: 0.4, Contrast: 10, Highlights: -30, Shadows: 50, Whites: 30, Blacks: 20, Temp: 5, Vibrance: 30, Saturation: 0, Clarity: -10 }, grading: { Highlights: { h: 50, s: 5, l: 0 } } }, 10),
    ...generateVariations("wedding_classic", { basic: { Exposure: 0.15, Contrast: 15, Highlights: -30, Shadows: 30, Whites: 10, Vibrance: 15 }, grading: { Midtones: { h: 40, s: 8, l: 0 } } }, 10),
    ...generateVariations("wedding_bright", { basic: { Exposure: 0.3, Contrast: 5, Highlights: -40, Shadows: 40, Whites: 25, Vibrance: 20 }, grading: { Highlights: { h: 50, s: 5, l: 5 } } }, 10),
    ...generateVariations("portrait_clean", { basic: { Exposure: 0.1, Contrast: 10, Highlights: -20, Shadows: 20, Whites: 10, Blacks: -5, Vibrance: 10, Saturation: -5, Clarity: -5 }, grading: { Midtones: { h: 30, s: 5, l: 0 } } }, 10),
    ...generateVariations("portrait_smooth", { basic: { Exposure: 0.15, Contrast: 5, Highlights: -20, Shadows: 20, Clarity: -10, Texture: -10 }, grading: { Midtones: { h: 25, s: 10, l: 5 } } }, 10),
    ...generateVariations("portrait_glow", { basic: { Exposure: 0.1, Contrast: 10, Highlights: -30, Shadows: 15, Temp: 10, Vibrance: 20 }, grading: { Highlights: { h: 45, s: 15, l: 5 } } }, 10),
    
    // --- 7. MISSING TOP MOODS FILLED ---
    ...generateVariations("cyberpunk", { basic: { Exposure: 0.1, Contrast: 20, Highlights: 10, Shadows: 10, Temp: -15, Tint: 20, Vibrance: 40, Dehaze: 15 }, grading: { Shadows: { h: 260, s: 30, l: -5 }, Highlights: { h: 320, s: 20, l: 0 } } }, 10),
    ...generateVariations("forest_green", { basic: { Exposure: -0.1, Contrast: 20, Highlights: -40, Shadows: 20, Temp: 5, Tint: -15, Vibrance: 30 }, grading: { Shadows: { h: 120, s: 15, l: -5 }, Highlights: { h: 50, s: 10, l: 0 } } }, 10),
    ...generateVariations("black_white", { basic: { Contrast: 30, Highlights: -20, Shadows: 20, Whites: 20, Blacks: -20, Saturation: -100, Clarity: 20, Vignette: -15 } }, 10),
    ...generateVariations("cinematic", { basic: { Exposure: 0.05, Contrast: 10, Highlights: -30, Shadows: 20, Temp: 10, Vibrance: 15 }, grading: { Shadows: { h: 190, s: 15, l: -5 }, Highlights: { h: 40, s: 20, l: 0 } } }, 10),
    ...generateVariations("food_vivid", { basic: { Exposure: 0.1, Contrast: 30, Highlights: -20, Shadows: 20, Vibrance: 40, Saturation: 10, Clarity: 15 }, grading: { Midtones: { h: 0, s: 0, l: 0 } } }, 10),

    // --- 8. NEW CATEGORIES ---
    ...generateVariations("fashion_editorial", { basic: { Exposure: 0.1, Contrast: 25, Clarity: 10, Vibrance: 10, Saturation: -5 }, grading: { Shadows: { h: 240, s: 5, l: 0 } } }, 10),
    ...generateVariations("product_clean", { basic: { Exposure: 0.3, Contrast: 15, Whites: 30, Blacks: 10, Vibrance: 20 }, grading: {} }, 10),
    ...generateVariations("matte_black", { basic: { Exposure: 0.1, Contrast: 20, Highlights: -20, Shadows: 10, Whites: -10, Blacks: 30, Saturation: -10, Vignette: -20 }, grading: { Shadows: { h: 210, s: 5, l: 0 } } }, 10),
    ...generateVariations("high_contrast", { basic: { Contrast: 60, Highlights: -30, Shadows: 30, Whites: 30, Blacks: -30, Vibrance: 10, Clarity: 20 }, grading: { Midtones: { h: 0, s: 0, l: 0 } } }, 10),
    ...generateVariations("cool_blue", { basic: { Contrast: 15, Highlights: 10, Shadows: 10, Temp: -20, Vibrance: 20, Clarity: 15 }, grading: { Shadows: { h: 220, s: 20, l: -5 }, Highlights: { h: 200, s: 10, l: 0 } } }, 10),
    ...generateVariations("warm_sunset", { basic: { Exposure: 0.1, Contrast: 25, Highlights: -30, Shadows: 30, Temp: 20, Tint: 10, Vibrance: 40 }, grading: { Shadows: { h: 280, s: 20, l: 0 }, Highlights: { h: 45, s: 30, l: 0 } } }, 10),
    ...generateVariations("hdr_landscape", { basic: { Contrast: 10, Highlights: -80, Shadows: 80, Whites: 20, Blacks: -20, Vibrance: 40, Clarity: 30, Dehaze: 20 }, grading: { Highlights: { h: 50, s: 10, l: 0 } } }, 10),
    ...generateVariations("soft_pastel", { basic: { Exposure: 0.2, Contrast: -10, Highlights: -30, Shadows: 40, Temp: 0, Tint: 5, Vibrance: 30, Saturation: -5, Clarity: -15 }, grading: { Shadows: { h: 220, s: 10, l: 0 }, Highlights: { h: 40, s: 10, l: 0 } } }, 10),
    ...generateVariations("night_neon", { basic: { Exposure: 0.1, Contrast: 30, Highlights: 10, Shadows: 10, Temp: -15, Tint: 20, Vibrance: 40, Dehaze: 15, Noise: 30 }, grading: { Shadows: { h: 260, s: 30, l: -5 } } }, 10),
    ...generateVariations("urban_street", { basic: { Contrast: 25, Highlights: -30, Shadows: 20, Temp: -5, Vibrance: -20, Saturation: -30, Clarity: 25, Dehaze: 10, Vignette: -20 }, grading: { Shadows: { h: 210, s: 10, l: -5 } } }, 10),
    ...generateVariations("teal_orange", { basic: { Exposure: 0.1, Contrast: 20, Highlights: -40, Shadows: 30, Temp: 5 }, grading: { Shadows: { h: 210, s: 20, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 35, s: 20, l: 0 } } }, 10),
    ...generateVariations("dark_moody", { basic: { Exposure: -0.2, Contrast: 30, Highlights: -50, Shadows: -10, Vibrance: -20 }, grading: { Shadows: { h: 220, s: 10, l: -10 }, Highlights: { h: 40, s: 5, l: 0 } } }, 10),
    ...generateVariations("golden_hour", { basic: { Exposure: 0.1, Contrast: 15, Highlights: -20, Shadows: 20, Temp: 20, Tint: 5, Vibrance: 30 }, grading: { Shadows: { h: 40, s: 15, l: 0 }, Highlights: { h: 45, s: 20, l: 0 } } }, 10),
};

const initialQuestionBank = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    question: [
        "ឧបករណ៍មួយណាសម្រាប់កែពន្លឺរួមនៃរូបភាព?", "Contrast មានតួនាទីអ្វី?", "Highlights គ្រប់គ្រងអ្វី?", "Shadows គ្រប់គ្រងអ្វី?", 
        "Temp ប្រើសម្រាប់អ្វី?", "Tint ប្រើសម្រាប់អ្វី?", "Vibrance ខុសពី Saturation ដូចម្តេច?", "Dehaze ប្រើពេលណា?",
        "Vignette គឺអ្វី?", "Noise Reduction ប្រើពេលណា?", "Clarity ធ្វើអ្វី?", "Texture ធ្វើអ្វី?", "Tone Curve គឺជាអ្វី?",
        "HSL មកពីពាក្យអ្វី?", "Split Toning ប្រើធ្វើអ្វី?", "Grain ប្រើធ្វើអ្វី?", "Sharpening ធ្វើអ្វី?", "Masking ប្រើធ្វើអ្វី?",
        "Lens Correction ជួយអ្វី?", "Geometry ប្រើពេលណា?", "Aspect Ratio 4:5 សម្រាប់អ្វី?", "Aspect Ratio 16:9 សម្រាប់អ្វី?",
        "RAW file ល្អជាង JPG ត្រង់ណា?", "Preset គឺជាអ្វី?", "Histogram បង្ហាញអ្វី?", "White Balance គឺអ្វី?", "Invert Mask គឺអ្វី?",
        "Radial Gradient ប្រើពេលណា?", "Linear Gradient ប្រើពេលណា?", "Color Grading គឺអ្វី?", "Calibration ប្រើធ្វើអ្វី?",
        "Select Subject ប្រើធ្វើអ្វី?", "Select Sky ប្រើធ្វើអ្វី?", "Healing Brush ប្រើធ្វើអ្វី?", "Clone Stamp ប្រើធ្វើអ្វី?",
        "Snapshot ក្នុង Lightroom គឺអ្វី?", "Versions ប្រើធ្វើអ្វី?", "Rating (ផ្កាយ) ប្រើធ្វើអ្វី?", "Flag (ទង់) ប្រើធ្វើអ្វី?",
        "Export Quality គួរដាក់ប៉ុន្មាន?", "Resize Long Edge សម្រាប់ FB?", "Sharpen for Screen ប្រើពេលណា?", "Copy Settings ប្រើធ្វើអ្វី?",
        "Paste Settings ប្រើធ្វើអ្វី?", "Reset ប្រើធ្វើអ្វី?", "Before/After មើលម៉េច?", "Chromatic Aberration គឺអ្វី?",
        "Profile Correction គឺអ្វី?", "Auto Settings ល្អទេ?", "Luminance Noise Reduction គឺអ្វី?"
    ][i] || "សំណួរបន្ថែម...",
    options: [
        ["Contrast", "Exposure", "Highlights", "Shadows"], ["កែពន្លឺ", "កែភាពច្បាស់", "កំណត់គម្លាតពន្លឺ/ងងឹត", "កែពណ៌"],
        ["តំបន់ងងឹត", "តំបន់ភ្លឺខ្លាំង", "ពណ៌", "សីតុណ្ហភាព"], ["តំបន់ភ្លឺ", "តំបន់ងងឹត", "ពណ៌ស", "ពណ៌ខ្មៅ"],
        ["កែពណ៌បៃតង", "កែសីតុណ្ហភាព (លឿង/ខៀវ)", "កែពន្លឺ", "កែភាពច្បាស់"], ["កែពណ៌បៃតង/ស្វាយ", "កែពន្លឺ", "កែសីតុណ្ហភាព", "កែ Contrast"],
        ["ដូចគ្នា", "Vibrance ការពារពណ៌ស្បែក", "Vibrance ធ្វើឱ្យរូបខ្មៅ", "Saturation ល្អជាង"], ["ពេលរូបច្បាស់", "ពេលមានអ័ព្ទ", "ពេលរូបងងឹត", "ពេលរូបភ្លឺ"],
        ["ធ្វើឱ្យរូបភ្លឺ", "ធ្វើឱ្យគែមងងឹត", "ធ្វើឱ្យរូបច្បាស់", "ប្តូរពណ៌"], ["ពេលរូបច្បាស់", "ពេលរូបមានគ្រាប់ Noise", "ពេលរូបងងឹត", "ពេលរូបភ្លឺ"],
        ["ធ្វើឱ្យរូបរលោង", "បង្កើន Contrast កណ្តាល", "ប្តូរពណ៌", "កាត់រូប"], ["ធ្វើឱ្យរូបរលោង", "បង្កើនលម្អិតតូចៗ", "ប្តូរពណ៌", "កាត់រូប"],
        ["កាត់រូប", "កែពន្លឺ/ពណ៌កម្រិតខ្ពស់", "ដាក់អក្សរ", "លុបមុន"], ["Hue Sat Light", "Hue Saturation Luminance", "High Standard Light", "Hue Shade Light"],
        ["ដាក់ពណ៌ក្នុង Shadows/Highlights", "កែ Exposure", "កែ WB", "កែ Lens"], ["ធ្វើឱ្យរូបច្បាស់", "បន្ថែមគ្រាប់បែប Film", "លុបអ័ព្ទ", "កែពណ៌"],
        ["ធ្វើឱ្យរូបព្រិល", "ធ្វើឱ្យគែមវត្ថុច្បាស់", "ប្តូរពណ៌", "កែពន្លឺ"], ["កែរូបទាំងមូល", "កែតែផ្នែកខ្លះ", "Export", "Import"],
        ["កែពណ៌", "កែការពត់កោងកែវថត", "កែពន្លឺ", "កែ Sharpness"], ["តម្រង់អគារ", "កែពណ៌", "កែពន្លឺ", "លុបមុន"],
        ["Facebook", "Instagram Story", "Youtube", "TV"], ["Facebook", "Instagram Story", "Profile", "Print"],
        ["រូបតូច", "រក្សាទុកព័ត៌មានច្រើន", "រូបស្អាតស្រាប់", "បង្ហោះលឿន"], ["ការកំណត់ដែលបានរក្សាទុក", "ការកែថ្មី", "រូបភាព", "កាមេរ៉ា"],
        ["ពន្លឺក្នុងរូប", "ពណ៌", "ទំហំ", "ទីតាំង"], ["កែពន្លឺ", "កែពណ៌សឱ្យត្រូវពន្លឺពិត", "កែ Contrast", "កែ Saturation"],
        ["លុប Mask", "ជ្រើសរើសតំបន់ផ្ទុយ", "កែពណ៌ផ្ទុយ", "បង្វិលរូប"], ["កែទាំងមូល", "កែចំណុចកណ្តាល/មូល", "កែពណ៌", "កែពន្លឺ"],
        ["កែទាំងមូល", "កែជាលក្ខណៈបន្ទាត់ (មេឃ/ដី)", "កែពណ៌", "កែពន្លឺ"], ["ដាក់ពណ៌", "កែពន្លឺ", "កែ WB", "កែ Lens"],
        ["កែពណ៌គោល (RGB)", "កែពន្លឺ", "កែ Contrast", "កែ Saturation"], ["ជ្រើសរើសមេឃ", "ជ្រើសរើសតួអង្គ", "ជ្រើសរើសកន្លែងភ្លឺ", "ជ្រើសរើសកន្លែងងងឹត"],
        ["ជ្រើសរើសដី", "ជ្រើសរើសមេឃ", "ជ្រើសរើសទឹក", "ជ្រើសរើសមនុស្ស"], ["គូររូប", "លុបមុន/វត្ថុ", "កែពណ៌", "កែពន្លឺ"],
        ["ចម្លងរូប", "ចម្លងផ្នែកមួយទៅដាក់មួយទៀត", "កែពណ៌", "កែពន្លឺ"], ["រូបថត", "ការរក្សាទុកដំណាក់កាលកែ", "Preset", "Filter"],
        ["Export", "រក្សាទុកការកែផ្សេងគ្នា", "Share", "Delete"], ["ដាក់ពិន្ទុ", "លុប", "កែ", "Share"], ["សម្គាល់រូប (Pick/Reject)", "ដាក់ពិន្ទុ", "កែ", "Share"],
        ["100%", "50%", "10%", "0%"], ["1080px", "2048px", "4000px", "Original"], ["Standard", "High", "Low", "None"],
        ["ចម្លងរូប", "ចម្លងការកែ (Settings)", "ចម្លងពណ៌", "ចម្លងពន្លឺ"], ["បិទភ្ជាប់រូប", "បិទភ្ជាប់ការកែ", "បិទភ្ជាប់ពណ៌", "បិទភ្ជាប់ពន្លឺ"],
        ["លុបរូប", "ត្រឡប់ទៅដើម", "Save", "Export"], ["ចុចពីរដង", "ចុចសង្កត់", "អូសឆ្វេង", "អូសស្តាំ"],
        ["ពណ៌ខុសតាមគែម", "ពន្លឺខុស", "Noise", "Blur"], ["កែ Lens", "កែពណ៌", "កែពន្លឺ", "កែ Noise"],
        ["ល្អ", "មិនល្អ", "មធ្យម", "អាក្រក់"], ["លុបគ្រាប់ពណ៌", "លុបគ្រាប់ពន្លឺ (Grain)", "បង្កើនពណ៌", "បង្កើនពន្លឺ"]
    ][i] || ["A", "B", "C", "D"],
    correct: [1, 2, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0][i] || 0,
    level: i < 20 ? "beginner" : i < 40 ? "intermediate" : "advanced"
}));

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

const findAIResponse = (input) => {
    const query = input.toLowerCase().trim();
    
    // ១. ស្វែងរកចម្លើយក្នុង Knowledge Base ជាមុនសិន (Check KB First)
    // យើងដាក់វាលើគេ ដើម្បីឱ្យប្រាកដថា បើយើងមានចម្លើយសម្រាប់ "Facebook" វានឹងឆ្លើយ មិនមែនបដិសេធទេ។
    const match = KNOWLEDGE_BASE.find(item => item.keys.some(key => query.includes(key)));
    if (match) return match.answer;

    // ២. បន្ទាប់មកចាំឆែកពាក្យដែលត្រូវបដិសេធ (Check Refusal Last)
    // ចំណាំ៖ ខ្ញុំបានដកពាក្យ 'facebook', 'tiktok', 'youtube' ចេញពីបញ្ជីនេះ
    const refusedTopics = ['video', 'song', 'music', 'game', 'hack', 'money', 'crypto'];
    if (refusedTopics.some(t => query.includes(t))) {
        return "សូមអភ័យទោស! 🚫 ខ្ញុំគឺជា AI ជំនាញខាងកែរូបភាព Lightroom ប៉ុណ្ណោះ។\nខ្ញុំមិនអាចឆ្លើយសំណួរដែលមិនពាក់ព័ន្ធនឹងការកែរូប ឬបច្ចេកទេសថតរូបបានទេ។ សូមសួរខ្ញុំអំពី Presets, Tools, ឬគន្លឹះកែរូបវិញណា៎! 😊";
    }

    return null;
};

// ==========================================
// 4. MAIN COMPONENTS (ColorWheel, Header, etc.)
// ==========================================

// --- ColorWheel Component ---
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
        let hueValue = angle + 90;
        
        if (hueValue < 0) hueValue += 360;
        if (hueValue >= 360) hueValue -= 360; 
        
        const dist = Math.sqrt(x*x + y*y);
        const radius = rect.width / 2;
        let saturation = (dist / radius) * 100;
        if (saturation > 100) saturation = 100;
        onChange(hueValue, saturation);
    };
    const handleStart = (e) => { setIsDragging(true); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; updateColor(clientX, clientY); };
    const handleMove = (e) => { if (!isDragging) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; updateColor(clientX, clientY); };
    const handleEnd = () => setIsDragging(false);
    
    const radius = size / 2; 
    const handleDist = (sat / 100) * radius; 
    const angleRad = (hue - 90) * (Math.PI / 180);
    const handleX = radius + handleDist * Math.cos(angleRad); 
    const handleY = radius + handleDist * Math.sin(angleRad);

    return (
        <div 
            className="relative mx-auto group touch-none select-none" 
            style={{ width: size, height: size }} 
            ref={wheelRef} 
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} 
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
        >
            <div className="absolute -inset-4 rounded-full bg-black/20 blur-xl"></div>
            <div className="absolute -inset-3 rounded-full bg-[#1C1C1E] border border-white/5 shadow-2xl"></div>
            <div className="absolute -inset-[2px] rounded-full bg-[#000000]/50 shadow-inner"></div>
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(closest-side, white, transparent 100%)', pointerEvents: 'none' }}></div>
            </div>
            <div className="absolute w-6 h-6 bg-white rounded-full border-[3px] border-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ease-out group-hover:scale-110 z-10" style={{ left: handleX, top: handleY }}></div>
        </div>
    );
};

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : ''} bg-black/80 backdrop-blur-xl text-white sticky top-0 z-50 border-b border-white/10`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('learn')}>
          <div className="w-10 h-10 relative rounded-xl overflow-hidden shadow-lg flex-shrink-0 group-hover:shadow-blue-500/20 transition-all duration-500 ease-spring group-hover:scale-105 bg-white/5 p-1.5 border border-white/10">
              <Bot className="w-full h-full text-blue-500 p-1" />
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

const LessonModal = ({ lesson, onClose }) => {
  const [closing, setClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const modalRef = useRef(null);
  const dragStartY = useRef(null);

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
      <button onClick={onToggle} className="w-full flex items-center justify-between bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 hover:bg-[#2C2C2E] transition-all group active:scale-95">
        <div className="flex items-center space-x-5">
            <div className="bg-blue-500/10 p-3 rounded-2xl group-hover:bg-blue-500/20 transition-colors ring-1 ring-blue-500/20"><PlayCircle className="w-6 h-6 text-blue-400" /></div>
            <h3 className="font-bold text-white text-xl font-khmer tracking-tight">គន្លឹះបន្ថែម (Tips)</h3>
        </div>
        <ChevronRight className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
  <div className="mt-16 mb-10 border-t border-white/10 pt-10 text-center">
      <div className="flex justify-center gap-10">
          <a href="https://web.facebook.com/mydesignpro" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="p-3 bg-[#1C1C1E] rounded-xl border border-white/10"><Facebook className="text-blue-500 w-5 h-5" /></div>
              <span className="text-[10px] text-gray-500 font-khmer">Facebook</span>
          </a>
          <a href="https://t.me/koymy" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="p-3 bg-[#1C1C1E] rounded-xl border border-white/10"><Send className="text-sky-400 w-5 h-5" /></div>
              <span className="text-[10px] text-gray-500 font-khmer">Telegram</span>
          </a>
          <a href="https://myaffinity.gumroad.com" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="p-3 bg-[#1C1C1E] rounded-xl border border-white/10"><Globe className="text-pink-500 w-5 h-5" /></div>
              <span className="text-[10px] text-gray-500 font-khmer">Website</span>
          </a>
      </div>
      <p className="text-center text-gray-600 text-[10px] mt-8 font-khmer uppercase opacity-50 tracking-widest">© 2026 My Design. Crafted with Passion.</p>
  </div>
);

// ==========================================
// 5. MAIN FEATURES COMPONENTS
// ==========================================

const PhotoLab = () => {
  const [image, setImage] = useState("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80");
  const [mode, setMode] = useState('manual');
  const fileInputRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [gradingTab, setGradingTab] = useState('Shadows');
  const [gradingSync, setGradingSync] = useState(false);

  const defaultSettings = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0, redHue: 0, redSat: 0, redLum: 0, orangeHue: 0, orangeSat: 0, orangeLum: 0, yellowHue: 0, yellowSat: 0, yellowLum: 0, greenHue: 0, greenSat: 0, greenLum: 0, aquaHue: 0, aquaSat: 0, aquaLum: 0, blueHue: 0, blueSat: 0, blueLum: 0, purpleHue: 0, purpleSat: 0, purpleLum: 0, magentaHue: 0, magentaSat: 0, magentaLum: 0, shadowHue: 0, shadowSat: 0, shadowLum: 0, midHue: 0, midSat: 0, midLum: 0, highlightHue: 0, highlightSat: 0, highlightLum: 0, gradingBlending: 50, gradingBalance: 0 };
  const [settings, setSettings] = useState(defaultSettings);
  const [activeColor, setActiveColor] = useState('Orange'); 

  // --- PRESET FILTERING LOGIC ---
  const [filteredPresets, setFilteredPresets] = useState([]);
  const [suggestedMoods, setSuggestedMoods] = useState([]);
  
  useEffect(() => {
      if (mode !== 'preset') return;
      
      const query = aiPrompt.toLowerCase().trim();
      const allPresets = Object.values(BASE_PRESETS_DATA);
      
      if (!query) {
    // បង្ហាញ Presets ទាំងអស់ ឬ បង្ហាញតែជំនាន់ទី ១ (ends with _1) ដើម្បីកុំឱ្យច្រើនពេក
    setFilteredPresets(allPresets.filter(p => p.id.endsWith('_1'))); 
    setSuggestedMoods([]);
    return;
}

      // 1. Direct Text Match
      const exactMatches = allPresets.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.id.toLowerCase().includes(query)
      );

      // 2. Keyword Match (Moods)
      const matchedMoods = PRESET_MOODS.filter(m => 
          m.keywords.some(k => k.includes(query) || query.includes(k)) || 
          m.name.toLowerCase().includes(query)
      );

      let relatedPresets = [];
      if (matchedMoods.length > 0) {
          matchedMoods.forEach(mood => {
              // Try to find presets starting with the mood id prefix (e.g. 'color_teal' -> find 'teal_orange')
              // Mapping logic: 
              let searchKey = "";
              if (mood.id.startsWith('color_')) searchKey = mood.id.replace('color_', '');
              else if (mood.id.startsWith('feeling_')) searchKey = mood.id.replace('feeling_', '');
              else if (mood.id.startsWith('time_')) searchKey = mood.id.replace('time_', '');
              else if (mood.id.startsWith('subject_')) searchKey = mood.id.replace('subject_', '');
              else searchKey = mood.id;

              // Scan keys in BASE_PRESETS_DATA
              const moodRelated = allPresets.filter(p => p.id.includes(searchKey) || p.name.toLowerCase().includes(searchKey));
              relatedPresets = [...relatedPresets, ...moodRelated];
          });
      }

      // Combine results unique
      const combined = [...new Set([...exactMatches, ...relatedPresets])];
      
      setFilteredPresets(combined);
      setSuggestedMoods(matchedMoods);

  }, [aiPrompt, mode]);


  const updateSetting = (key, value) => setSettings(prev => ({...prev, [key]: value}));
  const resetSettings = () => setSettings(defaultSettings);
  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) setImage(URL.createObjectURL(file)); };
  const handleDownload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image(); img.crossOrigin = "anonymous"; img.src = image; img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.filter = getFilterString(); ctx.drawImage(img, 0, 0); const link = document.createElement('a'); link.download = 'edited-photo.jpg'; link.href = canvas.toDataURL('image/jpeg'); link.click(); }; };
  
  const handlePresetExport = () => { 
      // Map flat settings to XMP structure
      const recipe = {
          basic: {
              Exposure: settings.exposure,
              Contrast: settings.contrast,
              Highlights: settings.highlights,
              Shadows: settings.shadows,
              Whites: settings.whites,
              Blacks: settings.blacks,
              Temp: settings.temp,
              Tint: settings.tint,
              Vibrance: settings.vibrance,
              Saturation: settings.saturation,
              Texture: settings.texture,
              Clarity: settings.clarity,
              Dehaze: settings.dehaze,
              Vignette: settings.vignette
          },
          detail: {
              Sharpening: 40, 
              Noise: 0,
              ColorNoise: 25
          },
          colorMix: [
              { color: 'Red', h: settings.redHue, s: settings.redSat, l: settings.redLum },
              { color: 'Orange', h: settings.orangeHue, s: settings.orangeSat, l: settings.orangeLum },
              { color: 'Yellow', h: settings.yellowHue, s: settings.yellowSat, l: settings.yellowLum },
              { color: 'Green', h: settings.greenHue, s: settings.greenSat, l: settings.greenLum },
              { color: 'Aqua', h: settings.aquaHue, s: settings.aquaSat, l: settings.aquaLum },
              { color: 'Blue', h: settings.blueHue, s: settings.blueSat, l: settings.blueLum },
              { color: 'Purple', h: settings.purpleHue, s: settings.purpleSat, l: settings.purpleLum },
              { color: 'Magenta', h: settings.magentaHue, s: settings.magentaSat, l: settings.magentaLum },
          ],
          grading: {
              Shadows: { h: settings.shadowHue, s: settings.shadowSat, l: settings.shadowLum },
              Midtones: { h: settings.midHue, s: settings.midSat, l: settings.midLum },
              Highlights: { h: settings.highlightHue, s: settings.highlightSat, l: settings.highlightLum },
              Blending: settings.gradingBlending,
              Balance: settings.gradingBalance
          }
      };
      
      generateXMP(recipe, aiPrompt || "Custom_Preset"); 
  };

  const applyPresetToSettings = (presetData) => {
      const b = presetData.basic; 
      const newSettings = { ...defaultSettings };
      
      if (b) { 
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
      
      // Apply grading if exists
      if (presetData.grading) {
          if (presetData.grading.Shadows) {
             newSettings.shadowHue = presetData.grading.Shadows.h || 0;
             newSettings.shadowSat = presetData.grading.Shadows.s || 0;
          }
          if (presetData.grading.Highlights) {
             newSettings.highlightHue = presetData.grading.Highlights.h || 0;
             newSettings.highlightSat = presetData.grading.Highlights.s || 0;
          }
      }

      setSettings(newSettings);
  };

  const resetGroup = (items) => {
    const newSettings = { ...settings };
    items.forEach(item => {
        newSettings[item.id] = 0;
    });
    setSettings(newSettings);
  };

  const getFilterString = () => `brightness(${100 + settings.exposure * 10}%) contrast(${100 + settings.contrast}%) saturate(${100 + settings.saturation}%) sepia(${settings.temp > 0 ? settings.temp * 0.4 : 0}%) hue-rotate(${settings.tint}deg)`;
  const getVignetteStyle = () => { const v = settings.vignette; return v < 0 ? { background: `radial-gradient(circle, transparent ${60 + (v * 0.4)}%, rgba(0,0,0,${Math.abs(v)/100}))` } : { background: `radial-gradient(circle, transparent ${60 - (v * 0.4)}%, rgba(255,255,255,${v/100}))` }; };

  const updateGrading = (tone, hue, sat) => {
      let targetHueKey = tone === 'Shadows' ? 'shadowHue' : tone === 'Midtones' ? 'midHue' : 'highlightHue';
      let targetSatKey = tone === 'Shadows' ? 'shadowSat' : tone === 'Midtones' ? 'midSat' : 'highlightSat';

      const newSettings = { ...settings };
      newSettings[targetHueKey] = hue;
      newSettings[targetSatKey] = sat;

      if (gradingSync && (tone === 'Shadows' || tone === 'Highlights')) {
          const otherTone = tone === 'Shadows' ? 'Highlights' : 'Shadows';
          const otherHueKey = otherTone === 'Shadows' ? 'shadowHue' : 'highlightHue';
          const otherSatKey = otherTone === 'Shadows' ? 'shadowSat' : 'highlightSat';
          
          // Complementary Hue Logic: Add 180 degrees to get the opposite color
          newSettings[otherHueKey] = (hue + 180) % 360;
          newSettings[otherSatKey] = sat;
      }
      
      setSettings(newSettings);
  };

  useEffect(() => { const style = document.createElement('style'); style.innerHTML = `.grad-hue { background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red); } .grad-sat { background: linear-gradient(to right, #333, #ccc); } .grad-lum { background: linear-gradient(to right, black, white); } input[type=range] { -webkit-appearance: none; background: transparent; pointer-events: none; } input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #ffffff; border: 1px solid #000000; box-shadow: 0 2px 5px rgba(0,0,0,0.4); margin-top: -7px; cursor: grab; pointer-events: auto; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); } input[type=range]::-webkit-slider-thumb:active { transform: scale(1.3); cursor: grabbing; } input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #3A3A3C; border-radius: 10px; }`; document.head.appendChild(style); return () => document.head.removeChild(style); }, []);
  const toolsGroups = [ { group: 'Light', icon: <Sun size={18}/>, items: [{ id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.1 }, { id: 'contrast', label: 'Contrast', min: -100, max: 100 }, { id: 'highlights', label: 'Highlights', min: -100, max: 100 }, { id: 'shadows', label: 'Shadows', min: -100, max: 100 }, { id: 'whites', label: 'Whites', min: -100, max: 100 }, { id: 'blacks', label: 'Blacks', min: -100, max: 100 }] }, { group: 'Color', icon: <Palette size={18}/>, items: [{ id: 'temp', label: 'Temp', min: -100, max: 100 }, { id: 'tint', label: 'Tint', min: -100, max: 100 }, { id: 'vibrance', label: 'Vibrance', min: -100, max: 100 }, { id: 'saturation', label: 'Saturation', min: -100, max: 100 }] }, { group: 'Effects', icon: <Aperture size={18}/>, items: [{ id: 'texture', label: 'Texture', min: -100, max: 100 }, { id: 'clarity', label: 'Clarity', min: -100, max: 100 }, { id: 'dehaze', label: 'Dehaze', min: -100, max: 100 }, { id: 'vignette', label: 'Vignette', min: -100, max: 100 }] } ];
  const colors = [ { name: 'Red', id: 'red', color: 'bg-red-500' }, { name: 'Orange', id: 'orange', color: 'bg-orange-500' }, { name: 'Yellow', id: 'yellow', color: 'bg-yellow-500' }, { name: 'Green', id: 'green', color: 'bg-green-500' }, { name: 'Aqua', id: 'aqua', color: 'bg-cyan-400' }, { name: 'Blue', id: 'blue', color: 'bg-blue-600' }, { name: 'Purple', id: 'purple', color: 'bg-purple-600' }, { name: 'Magenta', id: 'magenta', color: 'bg-pink-500' } ];
  const sampleImages = [ { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80", label: "Portrait" }, { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80", label: "Golden Hour" }, { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80", label: "Night" }, { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", label: "Nature" }, { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80", label: "Food" } ];

  return (
  <div className="bg-[#000000] rounded-3xl border border-white/10 flex flex-col h-full max-w-7xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6 relative z-0">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 h-full overflow-hidden relative">
            
            {/* Left Column (Desktop) / Top Section (Mobile): Image & Actions */}
            <div className="h-[50%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-4 shrink-0 bg-black/40 lg:bg-transparent px-2 pb-2 pt-2 lg:p-0">
                
                {/* Main Image Preview */}
                <div className="flex-1 bg-[#1C1C1E] rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center relative border border-white/5 group shadow-2xl">
                    <div className="relative w-full h-full"><img src={image} className="w-full h-full object-cover scale-110 transition-all duration-100 ease-linear" style={{ filter: getFilterString() }} /><div className="absolute inset-0 pointer-events-none" style={getVignetteStyle()}></div></div>
                </div>

                {/* Combined Toolbar: Thumbnails + Action Buttons (Updated Layout) */}
                <div className="flex items-center justify-between gap-2 bg-[#1C1C1E] p-2 rounded-2xl border border-white/5 shadow-lg shrink-0 overflow-x-auto no-scrollbar">
                    
                    {/* Thumbnails */}
                    <div className="flex gap-2 shrink-0">
                        {sampleImages.map((item, idx) => (<button key={idx} onClick={() => setImage(item.src)} className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 ${image === item.src ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'} overflow-hidden transition-all duration-300 ease-spring relative group shadow-md`} title={item.label}><img src={item.src} className="w-full h-full object-cover" /></button>))}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/10 mx-1 shrink-0"></div>

                    {/* Action Buttons (Moved Here) */}
                    <div className="flex gap-2 shrink-0">
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current.click()} className="w-10 h-10 flex items-center justify-center bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/10 text-white rounded-xl transition-all active:scale-95" title="Upload"><Upload size={16} /></button>
                        <button onClick={handleDownload} className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95" title="Download"><ImageDown size={16} /></button>
                        <button onClick={handlePresetExport} className="w-10 h-10 flex items-center justify-center bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/10 text-white rounded-xl transition-all active:scale-95" title="Export XMP"><FileJson size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Right Column (Desktop) / Bottom Section (Mobile): Controls */}
            <div className="flex-1 lg:w-96 xl:w-[400px] lg:flex-none flex flex-col h-full bg-[#1C1C1E] rounded-t-3xl lg:rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10">
                 {/* Top Controls Bar - FIXED AND STICKY (Updated Style) */}
                 <div className="w-full h-14 bg-[#2C2C2E] border-b border-white/10 flex items-center px-2 gap-2 shrink-0 z-20">
                    <div className="flex-1 flex bg-black/20 p-1 rounded-xl">
                        <button 
                            onClick={() => setMode('manual')} 
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-khmer uppercase tracking-wider transition-all duration-200 ${mode === 'manual' ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                        >
                            កែដោយដៃ
                        </button>
                        <button 
                            onClick={() => setMode('preset')} 
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-khmer uppercase tracking-wider transition-all duration-200 ${mode === 'preset' ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                        >
                            Preset
                        </button>
                    </div>
                    <button onClick={resetSettings} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all" title="Reset All"><RotateCcw size={16}/></button>
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
                                <div className="flex items-center justify-between pb-0 border-b border-white/5">
                                    <h4 className="text-xs font-bold text-gray-400 font-khmer uppercase flex items-center gap-2 tracking-wider"><TrendingUp size={16}/> Grading</h4>
                                    <button 
                                        onClick={() => setGradingSync(!gradingSync)} 
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${gradingSync ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-[#2C2C2E] border-white/5 text-gray-500'}`}
                                    >
                                        <span className="text-[9px] font-bold uppercase tracking-wider">{gradingSync ? 'Sync' : 'Normal'}</span>
                                        <div className={`w-2 h-2 rounded-full ${gradingSync ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-600'}`}></div>
                                    </button>
                                </div>
                                <div className="flex justify-around mb-2 bg-[#2C2C2E] p-1.5 rounded-xl">
                                    {['Shadows', 'Midtones', 'Highlights'].map(t => (
                                        <button key={t} onClick={() => setGradingTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 ease-spring ${gradingTab === t ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                                    ))}
                                </div>
                                <div className="p-1 space-y-4">
                                    <div className="flex justify-center py-1">
                                        <ColorWheel 
                                            hue={settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']}
                                            sat={settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']}
                                            onChange={(h, s) => updateGrading(gradingTab, h, s)}
                                            size={160}
                                        />
                                    </div>

                                    <div className="bg-[#2C2C2E]/50 rounded-2xl p-3 border border-white/5 space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Selected</span>
                                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: `hsl(${settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']}, ${settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']}%, 50%)`}}></div>
                                                    {getColorName(settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'], settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Complementary</span>
                                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 flex-row-reverse">
                                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: `hsl(${(settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'] + 180) % 360}, 60%, 50%)`}}></div>
                                                    {getColorName((settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'] + 180) % 360)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hue</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="range" min="0" max="360" 
                                                    value={settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']} 
                                                    onChange={(e) => updateGrading(gradingTab, Number(e.target.value), settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])} 
                                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer grad-hue flex-1" 
                                                />
                                                <input 
                                                    type="number" 
                                                    value={Math.round(settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'])} 
                                                    onChange={(e) => updateGrading(gradingTab, Number(e.target.value), settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])} 
                                                    className="w-10 bg-transparent text-xs font-bold text-right text-blue-400 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saturation</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="range" min="0" max="100" 
                                                    value={settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']} 
                                                    onChange={(e) => updateGrading(gradingTab, settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'], Number(e.target.value))} 
                                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-700 to-white flex-1" 
                                                />
                                                <input 
                                                    type="number" 
                                                    value={Math.round(settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])} 
                                                    onChange={(e) => updateGrading(gradingTab, settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'], Number(e.target.value))}
                                                    className="w-10 bg-transparent text-xs font-bold text-right text-blue-400 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Luminance</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="range" min="-100" max="100" 
                                                    value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} 
                                                    onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} 
                                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer grad-lum flex-1"
                                                />
                                                <input 
                                                    type="number" 
                                                    value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']}
                                                    onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))}
                                                    className="w-10 bg-transparent text-xs font-bold text-right text-blue-400 outline-none"
                                                />
                                            </div>
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
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-[#1C1C1E]">
                            <div className="p-3 border-b border-white/5 shrink-0 z-10">
                                <div className="bg-[#2C2C2E] p-1 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="flex gap-2 items-center px-2">
                                        <Search size={16} className="text-gray-500" />
                                        <input 
                                            value={aiPrompt} 
                                            onChange={(e) => setAiPrompt(e.target.value)} 
                                            placeholder="ស្វែងរកតាម ឈ្មោះ, ពណ៌, អារម្មណ៍..." 
                                            className="flex-1 bg-transparent px-2 py-3 text-white text-sm outline-none font-khmer placeholder:text-gray-500" 
                                            autoComplete="off" 
                                            name="search-preset" 
                                        />
                                        {aiPrompt && (
                                            <button onClick={() => setAiPrompt('')} className="text-gray-500 hover:text-white p-1">
                                                <XCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="space-y-6 pb-20">
                                    
                                    {/* Suggested Moods (When searching) */}
                                    {aiPrompt && suggestedMoods.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {suggestedMoods.map(m => (
                                                <button 
                                                    key={m.id} 
                                                    onClick={() => setAiPrompt(m.name)}
                                                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 whitespace-nowrap"
                                                >
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Categories / Moods (Show only if search is empty) */}
                                    {!aiPrompt && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Star size={14} className="text-yellow-500" /> Top Moods
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {PRESET_MOODS.map(s => (
                                                    <button 
                                                        key={s.id} 
                                                        onClick={() => setAiPrompt(s.name)} 
                                                        className="relative h-16 bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden group transition-all duration-300 ease-spring active:scale-95 shadow-sm hover:shadow-lg"
                                                    >
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                                                        <span className="capitalize text-xs font-bold text-gray-200 group-hover:text-white z-10 tracking-wide font-khmer">{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Filtered Results List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <ListIcon size={14} /> {aiPrompt ? 'Results' : 'All Presets'}
                                                {filteredPresets.length > 0 && <span className="bg-[#2C2C2E] px-2 py-0.5 rounded-full text-[10px] text-gray-400">{filteredPresets.length}</span>}
                                            </h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2">
                                            {filteredPresets.length > 0 ? (
                                                filteredPresets.map((preset, idx) => (
                                                    <button 
                                                        key={preset.id || idx} 
                                                        onClick={() => applyPresetToSettings(preset)} 
                                                        className="flex items-center justify-between p-3 bg-[#2C2C2E]/50 hover:bg-[#3A3A3C] border border-white/5 rounded-2xl transition-all duration-200 group active:scale-[0.98] text-left"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white capitalize font-khmer">
                                                                {preset.name || preset.id.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                                                {Object.keys(preset.grading || {}).length > 0 ? 'Color Grade' : 'Basic'}
                                                            </span>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all">
                                                            <div className="w-2 h-2 rounded-full bg-white opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 opacity-50">
                                                    <Filter className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                                                    <p className="text-xs text-gray-500 font-khmer">រកមិនឃើញ Presets សម្រាប់ "{aiPrompt}" ទេ</p>
                                                    <p className="text-[10px] text-gray-600 mt-1">សាកល្បងពាក្យដូចជា "Wedding", "Dark", "Green"</p>
                                                </div>
                                            )}
                                        </div>
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

const ChatBot = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Suggested questions cache rotation
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  
  useEffect(() => {
     // Initial shuffle
     const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
     setCurrentSuggestions(shuffled.slice(0, 3)); // Show only 3 as requested

     // Rotate every 15s (User request)
     const interval = setInterval(() => {
       const nextShuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
       setCurrentSuggestions(nextShuffled.slice(0, 3));
     }, 15000);

     return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    const nextShuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(nextShuffled.slice(0, 3));
  };

  const handleSend = async (text = null) => {
    const msg = text || input;
    if (!msg.trim()) return; 
    setInput(''); 
    setMessages(prev => [...prev, { role: 'user', text: msg }]); 
    setLoading(true);
    
    // AI Logic Simulation
    setTimeout(() => {
        const response = findAIResponse(msg);
        setMessages(prev => [...prev, { role: 'model', text: response || "សុំទោស! ខ្ញុំមិនទាន់ស្គាល់ពាក្យនេះទេ។ អ្នកអាចសួរអំពី:\n• ឧបករណ៍ (Exposure, Contrast)\n• ពណ៌ (Skin Tone, Teal & Orange)\n• ឬ Presets ផ្សេងៗ។" }]);
        setLoading(false);
    }, 800 + Math.random() * 500); // Simulate "thinking" time
  };
  
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] md:rounded-[32px] overflow-hidden shadow-2xl relative md:border md:border-white/10 font-khmer">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#1C1C1E]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Bot size={18} className="text-white" />
              </div>
              <div>
                  <h3 className="text-sm font-bold text-white leading-none">AI Assistant</h3>
                  <span className="text-[10px] text-green-400 font-medium">Online</span>
              </div>
          </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 pb-4 space-y-4 bg-[#000000] no-scrollbar">
        {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                 <Bot size={48} className="mb-4 text-gray-500" />
                 <p className="text-sm text-gray-400">សួស្តី! មានអ្វីឲ្យខ្ញុំជួយទេ?</p>
             </div>
        )}
        
        {messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                {m.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mr-2 shrink-0 mt-auto">
                        <Bot size={12} className="text-white" />
                    </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${m.role === 'user' ? 'bg-[#0A84FF] text-white rounded-[18px] rounded-br-none' : 'bg-[#2C2C2E] text-gray-100 rounded-[18px] rounded-bl-none border border-white/5'}`}>
                    {m.text}
                </div>
            </div>
        ))}
        {loading && (
             <div className="flex justify-start items-end">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                    <Bot size={12} className="text-white" />
                </div>
                <div className="bg-[#2C2C2E] px-4 py-3 rounded-[18px] rounded-bl-none border border-white/5 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>
      
      {/* Suggestions & Input */}
      <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-white/5 pb-safe">
         {/* Auto-refreshing suggestions with Refresh Button */}
         <div className="flex items-center border-b border-white/5 pl-2">
             <button 
                 onClick={handleManualRefresh}
                 className="p-2 text-blue-400 hover:text-white transition-colors active:scale-90"
             >
                 <RefreshCw size={14} />
             </button>
             <div className="flex gap-2 overflow-x-auto pb-3 pt-3 px-2 no-scrollbar">
                {currentSuggestions.map((q, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(q)} 
                        className="shrink-0 px-3 py-1.5 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-blue-400 text-[11px] rounded-full border border-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
                    >
                        {q}
                    </button>
                ))}
             </div>
         </div>

         <div className="p-3 flex gap-2 items-end">
            <div className="flex-1 bg-[#2C2C2E] rounded-[24px] border border-white/10 flex items-center px-1 focus-within:border-blue-500/50 transition-colors">
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && handleSend()} 
                    placeholder="សួរសំណួរ..." 
                    className="flex-1 bg-transparent text-white px-3 py-2.5 text-sm outline-none placeholder:text-gray-500 h-full" 
                    autoComplete="off" 
                />
            </div>
            <button 
                onClick={() => handleSend()} 
                disabled={!input.trim()}
                className={`p-2.5 rounded-full transition-all active:scale-90 shadow-lg ${input.trim() ? 'bg-[#0A84FF] text-white' : 'bg-[#2C2C2E] text-gray-500'}`}
            >
                <Send size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APP
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState('learn');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [chatMessages, setChatMessages] = useState([{ role: 'model', text: 'សួស្ដី! ខ្ញុំជាគ្រូជំនួយ AI។ អ្នកអាចសួរខ្ញុំអំពីរបៀបកែរូប ឬឱ្យខ្ញុំណែនាំស្ទីលពណ៌ Presets ផ្សេងៗ។' }]);

  const toggleSection = (id) => setExpandedSection(prev => prev === id ? null : id);

  useEffect(() => {
    const handlePopState = (event) => {
      // event.preventDefault() is generally not needed/valid for popstate in this way,
      // and preventDefault() might not exist on some event objects if synthetically dispatched.
      // We'll just rely on the logic.
      if (expandedLesson) { setExpandedLesson(null); return; }
      if (activeTab !== 'learn') { setActiveTab('learn'); return; }
    };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [expandedLesson, activeTab]);

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-[#000000] text-gray-100 font-khmer overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&display=swap'); .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }`}</style>
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {expandedLesson && <LessonModal lesson={lessonsData.find(l => l.id === expandedLesson)} onClose={() => setExpandedLesson(null)} />}
      
      <main className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full ${activeTab === 'lab' || activeTab === 'ai' ? 'h-full overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
        {activeTab === 'learn' && (
          <div className="space-y-12 pb-24">
            <div className="text-center py-10 mt-6 relative">
                 <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                 <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Lightroom Master</h2>
                 <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">រៀនពីមូលដ្ឋានគ្រឹះដល់កម្រិតខ្ពស់ នៃការកែរូបភាពកំរិតស្ដង់ដា។</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lessonsData.map(l => <LessonCard key={l.id} lesson={l} onClick={() => setExpandedLesson(l.id)} />)}
            </div>
            <TipsSection isExpanded={expandedSection === 'tips'} onToggle={() => setExpandedSection(expandedSection === 'tips' ? null : 'tips')} />
            <ContactSection />
          </div>
        )}
        
        {activeTab === 'lab' && <PhotoLab />}
        {activeTab === 'quiz' && <Quiz />}
        {activeTab === 'ai' && <div className="h-full md:h-[650px] max-w-2xl mx-auto w-full relative"><ChatBot messages={chatMessages} setMessages={setChatMessages} /></div>}
      </main>

      <nav className="md:hidden bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-white/10 flex justify-around p-3 pb-safe z-50">
        {['learn', 'quiz', 'lab', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === t ? 'text-blue-500 scale-110' : 'text-gray-500'}`}>
                {t === 'learn' && <BookOpen size={22}/>}
                {t === 'quiz' && <Award size={22}/>}
                {t === 'lab' && <Sliders size={22}/>}
                {t === 'ai' && <Bot size={22}/>}
                <span className="text-[10px] font-bold uppercase">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'AI'}</span>
            </button>
        ))}
      </nav>
    </div>
  );
}