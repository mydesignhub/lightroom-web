import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sun, Moon, Aperture, Droplet, Sliders, ChevronRight, CheckCircle, XCircle, 
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
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើមដ៏ល្អ បន្ទាប់មកសឹមសារ៉េបន្ថែមតាមចំណូលចិត្ត។", 
    "ចុចសង្កត់លើរូបភាព ដើម្បីមើលរូបដើម (Before) និងរូបដែលកែរួច (After) យ៉ាងរហ័ស។", 
    "ចុចពីរដង (Double Tap) លើរង្វង់មូលនៃ Slider ណាមួយ ដើម្បី Reset វាត្រឡប់ទៅលេខ 0 វិញភ្លាមៗ។", 
    "ប្រើម្រាមដៃពីរចុចលើអេក្រង់ពេលអូស Slider (Whites/Blacks) ដើម្បីមើល Clipping (កន្លែងដែលបាត់ព័ត៌មានរូប)។", 
    "Export រូបភាពជា DNG ប្រសិនបើបងចង់ចែករំលែក Preset នេះទៅកាន់មិត្តភក្តិ។", 
    "ប្រើប្រាស់ Masking ដើម្បីកែតែផ្នែកខ្លះនៃរូបភាព (ឧទាហរណ៍ កែតែមេឃ ឬតួអង្គ) ដោយមិនប៉ះពាល់ផ្ទៃទាំងមូល។",
    "កុំភ្លេចបើក 'Lens Correction' ជានិច្ច ដើម្បីលុបបំបាត់ភាពកោង និងគែមខ្មៅពីកែវថតកាមេរ៉ា។",
    "ប្រើ 'Healing Brush' ដើម្បីបំបាត់ស្នាមមុន ឬវត្ថុរំខានផ្សេងៗចេញពីរូបភាពយ៉ាងងាយស្រួល។"
];

const SUGGESTED_QUESTIONS = [
    "របៀបកែរូបតាមអារម្មណ៍សោកសៅ?", "របៀបកែរូបឱ្យមើលទៅសប្បាយរីករាយ?", "តើបច្ចេកទេសថតរូបមានអ្វីខ្លះ?", 
    "របៀបកែរូបបែប Vintage (សម័យមុន)?", "របៀបកែរូបកាលពីព្រឹកព្រលឹម?", "ថតរូបថ្ងៃត្រង់ក្ដៅ គួរកែម៉េច?", 
    "តើកែស្បែកមុខឱ្យសម៉ត់យ៉ាងដូចម្តេច?", "តើពណ៌ក្រហមមានអត្ថន័យយ៉ាងណា?", "តើអ្វីទៅជា Aspect Ratio 4:5?", 
    "របៀបកែរូបបែប Cyberpunk?", "តើអត្ថន័យនៃពណ៌ខៀវ (Blue) គឺជាអ្វី?", "តើ Snapshot និង Versions ប្រើធ្វើអ្វី?", 
    "របៀបបង្កើតពណ៌ Teal & Orange?", "របៀបធ្វើឱ្យមេឃពណ៌ខៀវដិត?", "តើ Clone Stamp និង Healing Brush ខុសគ្នាម៉េច?", 
    "តើ Dehaze ប្រើសម្រាប់ធ្វើអ្វី?", "ណែនាំ Preset សម្រាប់ថត Pre-wedding", "របៀបធ្វើឱ្យរូបភាពច្បាស់ (Sharp)?", 
    "តើអ្វីទៅជា Rating និង Flag?", "តើ Chromatic Aberration គឺជាអ្វី?", "ហេតុអ្វីរូបខ្ញុំថតមកងងឹតមុខ?", 
    "តើធ្វើម៉េចអោយស្លឹកឈើពណ៌បៃតងខ្មៅ?", "របៀបកែរូបអោយភ្លឺ (Bright & Airy)", "តើ Grain ប្រើដើម្បីអ្វី?"
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
            default: return c;
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
    crs:Sharpness="${detail.Sharpening || 40}" crs:SharprenRadius="+1.0" crs:SharpenDetail="25" crs:SharpenEdgeMasking="0"
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

const FALLBACK_RESPONSES = [
    "អូហូ! 😅 សំណួរនេះរាងជ្រៅបន្តិច ខ្ញុំកំពុងអាប់ដេតខួរក្បាលបន្ថែម។ តែបើបងសួរពី 'របៀបកែពណ៌ Teal & Orange' ធានាថាខ្ញុំឆ្លើយបានម៉ាអេម!",
    "ហឺម... 🤔 ខ្ញុំទើបតែផឹកកាហ្វេហើយ អត់ទាន់យល់សំណួរនេះច្បាស់ទេ។ សុំបងសួរពី 'បច្ចេកទេសថតរូប' ឬ 'របៀបប្រើ Tone Curve' វិញបានអត់បង?",
    "អុញ! 🧐 ពាក្យនេះដូចអត់មានក្នុងសៀវភៅជំនាញ Lightroom របស់ខ្ញុំសោះ។ បងសាកសួរខ្ញុំពី 'របៀបកែរូបកុំឱ្យមាន Noise' មើល៍ ប្រហែលខ្ញុំដឹង!",
    "សុំទោសបងមហាទម្ងន់! 🙈 ខ្ញុំជា AI បង្រៀនកែរូប មិនមែន Google ទេ ហិហិ។ បងអាចសួរខ្ញុំពី 'អត្ថន័យពណ៌ក្រហមក្នុងការថតរូប' បានណា៎!",
    "សំណួរនេះអេម! 😂 តែខ្ញុំអត់ចេះឆ្លើយទេបងអើយ! សុំប្ដូររឿងទៅនិយាយពី 'របៀបធ្វើអោយស្បែកមុខសម៉ត់' វិញល្អជាង តោះ!",
    "អូខេ! 🏳️ ខ្ញុំសុំលើកទង់សចុះចាញ់ត្រង់សំណួរនេះ! តែបើបងសួរពី 'របៀបកែរូបបែប Cinematic' ខ្ញុំប្រាប់អស់គ្មានលាក់ម៉ង!",
    "វ៉ាវ! 🤫 សួរយកតែពិន្ទុតែម្ដង! តែខ្ញុំសុំជំពាក់សិនណា៎។ បងសាកសួរ 'របៀបកែរូបបែប Vintage អតីតកាល' វិញមើល ល្អអត់?",
    "Error 404: រកមិនឃើញចម្លើយទេបង! 🤖 តើបងចង់ដឹងពី 'របៀបកែរូបបែប Dark & Moody' ជំនួសវិញទេ? ខ្ញុំពូកែខាងហ្នឹង!",
    "សុំទោសបង! 🌅 ខួរក្បាល AI ខ្ញុំដើរទាន់តែរឿងកែរូប និងអត្ថន័យពណ៌ទេ។ បងសាកសួរពីការកែរូប 'Golden Hour' មើល៍ ខ្ញុំពន្យល់ឡើងកប់!",
    "ហ៊ើយ! 🥺 ពិបាកម៉្លេះបង! បន្ធូរដៃសួរត្រឹម 'របៀបប្រើ Healing Brush លុបមុន' មកបានអត់ ខ្ញុំត្រៀមចម្លើយជូនម៉ាស្អាត!"
];

// Extended Knowledge Base to cover ALL quiz questions, Color Psychology, Techniques, Eras, Time, and Moods.
const KNOWLEDGE_BASE = [
    // --- PHOTOGRAPHY TECHNIQUES ---
    { keys: ['rule of thirds', 'ច្បាប់៣ចំណែក', 'បច្ចេកទេសថត', 'ថតរូប', 'technique'], answer: "សួស្ដីបងប្អូនកាមេរ៉ាមែន! 📸 បើនិយាយពីបច្ចេកទេសថតរូបដែលល្បីជាងគេគឺ 'Rule of Thirds' (ច្បាប់ ៣ ចំណែក)! \n\n💡 វាជាការបែងចែករូបភាពជា ៩ ប្រឡោះ (បន្ទាត់កាត់ខ្វែង ២ បញ្ឈរ ២) ហើយយើងតម្រូវឱ្យដាក់តួអង្គ ឬចំណុចសំខាន់នៅត្រង់ចំណុចប្រសព្វនៃបន្ទាត់ទាំងនោះ។ វាធ្វើឱ្យរូបភាពមើលទៅមានលំនឹង ទាក់ទាញ និងរស់រវើកជាងការដាក់វត្ថុនៅកណ្តាលចំៗ! បងសាកអនុវត្តមើលណា៎ ធានាថារូបចេញមកមានសិល្បៈតែម្ដង! 🤩" },

    // --- MOODS & EMOTIONS ---
    { keys: ['sad', 'lonely', 'កំសត់', 'សោកសៅ', 'ឯកា', 'យំ', 'ខូចចិត្ត'], answer: "អូយ... អារម្មណ៍កំសត់មែនទេបង? 🥺 ដើម្បីកែពណ៌ឱ្យស៊ីនឹងអារម្មណ៍សោកសៅ (Sad/Lonely Mood) បងអាចសាកក្បួននេះ៖\n\n១. ទាញ Temp ទៅរកពណ៌ខៀវ (-) បន្តិចដើម្បីបង្កើតភាពត្រជាក់និងឯកា។\n២. បន្ថយ Vibrance និង Saturation (-15 ដល់ -30) ឱ្យរូបមើលទៅស្លេកគ្មានជីវិត។\n៣. ប្រើ Tone Curve ទាញចំណុចខ្មៅ (Blacks) ឡើងលើបន្តិច ដើម្បីឱ្យស្រមោលមើលទៅស្រអាប់ (Faded/Matte)។\nធានាថាមើលហើយ ចង់ស្រក់ទឹកភ្នែកម៉ងបង! ជួយកន្សែងមួយ? 🤧" },
    { keys: ['happy', 'smile', 'joy', 'សប្បាយ', 'ញញឹម', 'រីករាយ'], answer: "យេ! អារម្មណ៍សប្បាយរីករាយត្រូវតែអមដោយពណ៌ស្រស់ថ្លា! 🥳 សម្រាប់រូបភាពស្នាមញញឹម ឬបែប Happy នេះជាគន្លឹះ៖\n\n១. ទាញ Exposure ឱ្យភ្លឺស្រឡះបន្តិចបង។\n២. បង្កើន Temp (+) ឱ្យកក់ក្តៅ និងមានជីវិតជីវ៉ា។\n៣. បង្កើន Vibrance (+20 ទៅ +35) ឱ្យពណ៌សម្លៀកបំពាក់ និងធម្មជាតិលេចធ្លោ។\n៤. ទាញ Shadows ឡើង (+) ដើម្បីលុបភាពងងឹតលើផ្ទៃមុខ ឱ្យស្នាមញញឹមកាន់តែច្បាស់! រក្សាស្នាមញញឹមណា៎បង! 😁✨" },

    // --- ERAS & PERIODS ---
    { keys: ['vintage', 'retro', '90s', '80s', 'បុរាណ', 'សម័យមុន', 'កាលពីមុន'], answer: "នឹកដល់សម័យកាល 90s មែនទេបង? 📻 ដើម្បីកែរូបបែប Vintage ឬ Retro ឱ្យមើលទៅកلاسស៊ិក នេះជារូបមន្តសម្ងាត់៖\n\n១. ទាញ Contrast ចុះ (-) ដើម្បីកាត់បន្ថយភាពដិតរឹង។\n២. ចូល Tone Curve ទាញចំណុចខ្មៅឡើងលើបន្តិច (Faded Blacks) ឱ្យមើលទៅដូចហ្វីលចាស់ៗដែលហើរពណ៌។\n៣. ចូល Effect > បន្ថែម Grain (+30 ទៅ +50) ឱ្យមានគ្រាប់អុចៗ។\n៤. ដាក់ពណ៌លឿង ឬត្នោត (Warm) ចូលទៅក្នុង Highlights និង Midtones តាមរយៈ Color Grading។ ឡូយបែបអតីតកាលតែម្ដងបង! 🎞️⏳" },
    { keys: ['modern', 'cyberpunk', 'សម័យថ្មី', 'អនាគត', 'neon', 'glow'], answer: "ចង់បានរូបបែបអនាគត ឬសម័យទំនើបបែប Cyberpunk មែនទេបង? 🚀 វាងាយស្រួលណាស់៖\n\n១. បង្កើន Contrast និង Clarity អោយរូបភាពមុតស្រួច (Edgy) កម្រិត HD។\n២. កែ Temp ទៅជាពណ៌ខៀវត្រជាក់ (-) និង Tint ទៅជាពណ៌ស្វាយ (+)\n៣. ចូល Color Mix > ប្តូរពណ៌ខៀវ ទៅជា Cyan (ទឹកប៊ិចភ្លឺ) ហើយពណ៌ក្រហម/ស្វាយ ទៅជា Magenta (ផ្កាឈូកដិត)។\n៤. លុបពណ៌ផ្សេងទៀតចោល (Desaturate) ទុកតែ ២ ពណ៌នេះ។ មើលទៅដូចក្នុងកុន Sci-Fi អនាគតម៉ង! 霓虹🌃" },

    // --- TIME OF DAY ---
    { keys: ['morning', 'sunrise', 'ព្រឹក', 'ព្រលឹម'], answer: "អរុណសួស្ដីបង! 🌅 រូបថតពេលព្រឹកព្រលឹម តែងមានពន្លឺទន់ភ្លន់ និងមានអ័ព្ទតិចៗ គួរឱ្យស្រឡាញ់ណាស់៖\n\n១. បន្ថយ Dehaze (-) បន្តិច ដើម្បីរក្សាភាពស្រទន់ និងទិដ្ឋភាពអ័ព្ទពេលព្រឹក ធ្វើឱ្យរូបមានលក្ខណៈ Dreamy។\n២. ទាញ Temp (+) ទៅរកពណ៌លឿងមាសបន្តិច ដើម្បីឱ្យត្រូវនឹងពន្លឺថ្ងៃរះកក់ក្ដៅ។\n៣. បន្ថយ Contrast តិចតួច ដើម្បីឱ្យរូបភាពមើលទៅស្រួលភ្នែក និងពោរពេញដោយសង្ឃឹម! សាកល្បងផឹកកាហ្វេបណ្ដើរ កែរូបនេះបណ្ដើរទៅមើល៍! ☕✨" },
    { keys: ['noon', 'midday', 'ថ្ងៃត្រង់', 'ថ្ងៃក្ដៅ'], answer: "សួស្ដីបង! ថតរូបពេលថ្ងៃត្រង់ក្ដៅហែង ពន្លឺព្រះអាទិត្យគឺរឹង និងខ្លាំង (Harsh Light) ធ្វើឱ្យមុខមនុស្សមានស្រមោលខ្មៅក្រាស់! ☀️🔥\n\nដំណោះស្រាយក្នុង Lightroom៖\n១. ទាញ Highlights ចុះខ្លាំង (-50 ដល់ -80) ដើម្បីសង្គ្រោះពន្លឺឆេះលើមុខ មេឃ ឬអាវស។\n២. ទាញ Shadows ឡើងខ្លាំង (+40 ដល់ +70) ដើម្បីបើកពន្លឺត្រង់កន្លែងងងឹត (ក្រោមភ្នែក ឬក) ឱ្យភ្លឺមកវិញ។\n៣. បន្ថយ Contrast បន្តិច ឱ្យរូបភាពត្រឡប់មកទន់រលោង។ ពិបាកថតតិច តែ AI ខ្ញុំជួយបងបានជានិច្ច! ✌️" },

    // --- COLORS & PSYCHOLOGY ---
    { keys: ['red', 'ពណ៌ក្រហម', 'ក្រហម'], answer: "សួស្ដីបង! ❤️ ពណ៌ក្រហម (Red) គឺជានិមិត្តសញ្ញានៃថាមពល ក្តីស្រលាញ់ ភាពរំភើប និងការទាក់ទាញចំណាប់អារម្មណ៍ខ្លាំងបំផុត!\n\n💡 **ក្នុងការថតរូប និងកែរូប៖**\nវត្ថុពណ៌ក្រហមទាញភ្នែកអ្នកមើលមុនគេបង្អស់។ ក្នុង Lightroom បងអាចចូលទៅ HSL > Red ហើយទាញ Saturation ឡើងបន្តិច ដើម្បីឱ្យបបូរមាត់ រ៉ូប ឬផ្កាពណ៌ក្រហមលេចធ្លោរស់រវើក។ តែប្រយ័ត្នកុំឱ្យឆេះពេកណា៎! ចង់ដឹងពីពណ៌អីផ្សេងទៀតទេបង? 😊" },
    { keys: ['blue', 'ពណ៌ខៀវ', 'ខៀវ'], answer: "ជម្រាបសួរ! 💙 ពណ៌ខៀវ (Blue) តំណាងឱ្យភាពស្ងប់ស្ងាត់ ភាពជឿជាក់ និងភាពត្រជាក់ត្រជុំ (Cool tone)។\n\n💡 **ក្នុងការកែរូប៖**\nអ្នកថតរូបចូលចិត្តពណ៌នេះណាស់ ពិសេសសម្រាប់មេឃ (Sky) ឬទឹកសមុទ្រ (Ocean)។ ការទាញ Temp ទៅខាងឆ្វេងបន្តិច ធ្វើឱ្យរូបភាពមានអារម្មណ៍បែប Cinematic ឬ Moody ត្រជាក់ៗ។ សាកល្បងលេងជាមួយ Blue Luminance ក្នុង HSL មើល ដើម្បីឱ្យមេឃកាន់តែជ្រៅនិងស្រស់ស្អាត! 🌊" },
    { keys: ['green', 'ពណ៌បៃតង', 'បៃតង', 'ស្លឹកឈើ'], answer: "សួស្ដីចាស៎! 💚 ពណ៌បៃតង (Green) តំណាងឱ្យធម្មជាតិ ភាពស្រស់ស្រាយ ការលូតលាស់ និងជីវិតថ្មី។\n\n💡 **គន្លឹះកម្រិតប្រូ (Pro Tip)៖**\nអ្នកថតរូបភាគច្រើនចូលចិត្តធ្វើឱ្យពណ៌ស្លឹកឈើមើលទៅ 'Dark & Moody' ដោយចូលទៅ HSL > Green:\n- ទាញ Green Hue ទៅខាងឆ្វេង (រកពណ៌លឿងបន្តិច)\n- បន្ថយ Green Saturation ឱ្យស្លេកបន្តិច\n- ទាញ Green Luminance ចុះក្រោមឱ្យងងឹត។ ធានាថារូបភាពមើលទៅបែប Cinematic អាថ៌កំបាំងតែម្ដងបង! 🌿✨" },
    { keys: ['yellow', 'ពណ៌លឿង', 'លឿង'], answer: "សួស្ដីបង! 💛 ពណ៌លឿង (Yellow) គឺជាពណ៌នៃពន្លឺព្រះអាទិត្យ ភាពរីករាយ សុទិដ្ឋិនិយម និងភាពកក់ក្តៅ (Warmth)។\n\n💡 **ក្នុងការកែរូប៖**\nពណ៌នេះដើរតួសំខាន់ណាស់នៅក្នុងការថតរូបពេលរះ ឬពេលលិច (Golden Hour)។ បងអាចទាញ Temp ទៅខាងស្តាំ (ពង្រីកភាពកក់ក្តៅ) និងបន្ថែម Yellow Saturation បន្តិចដើម្បីឱ្យរូបភាពមានពន្លឺជះស្រស់ស្អាត និងមានអារម្មណ៍វិជ្ជមានបំផុត! 🌅" },
    { keys: ['orange', 'ពណ៌ទឹកក្រូច', 'ទឹកក្រូច'], answer: "ជម្រាបសួរ! 🧡 ពណ៌ទឹកក្រូច (Orange) ជាពណ៌នៃភាពរស់រវើក ភាពកក់ក្តៅ និងភាពច្នៃប្រឌិត។\n\n💡 **សំខាន់បំផុតក្នុងការកែស្បែក (Skin Tones)៖**\nក្នុង Lightroom ពណ៌ទឹកក្រូចគឺគ្រប់គ្រងលើពណ៌ស្បែកមនុស្សផ្ទាល់តែម្ដង! បងចង់ឱ្យមុខសម៉ត់ គឺត្រូវចូលទៅ HSL > Orange រួចបង្កើន Luminance (ឱ្យភ្លឺ) និងបន្ថយ Saturation បន្តិចកុំឱ្យស្បែកលឿង។ កុំភ្លេចក្បួននេះណា៎ វាមានប្រយោជន៍ខ្លាំងណាស់សម្រាប់រូប Portrait! 😍" },
    { keys: ['purple', 'magenta', 'ពណ៌ស្វាយ', 'ស្វាយ', 'ពណ៌ផ្កាឈូក', 'ផ្កាឈូក', 'pink'], answer: "សួស្ដីបង! 💜 ពណ៌ស្វាយ និងផ្កាឈូក តំណាងឱ្យភាពអាថ៌កំបាំង ភាពរ៉ូមែនទិក និងភាពប្រណីត (Luxury)។\n\n💡 **ក្នុងការកែរូប៖**\nច្រើនតែប្រើក្នុងស្តាយបែប Cyberpunk ឬការថតរូប Fashion។ បងអាចលេងជាមួយឧបករណ៍ Tint ដោយរុញទៅស្តាំ (Magenta) បន្តិច ដើម្បីកាត់បន្ថយពណ៌បៃតងចេញពីស្បែក ឬបង្កើត Mood ប្លែកៗ។ ស្ទីលកែពណ៌នេះកំពុងពេញនិយមណាស់បងអើយ! 🎆" },
    { keys: ['white', 'ពណ៌ស', 'ស', 'black', 'ពណ៌ខ្មៅ', 'ខ្មៅ'], answer: "ជម្រាបសួរ! 🤍🖤 ពណ៌ស និងខ្មៅ មិនមែនគ្រាន់តែជាពណ៌ទេ តែវាជាគ្រឹះនៃពន្លឺ និងស្រមោល (Light & Contrast)!\n\n- **ពណ៌ស (White)**: តំណាងឱ្យភាពបរិសុទ្ធ និងពន្លឺ។ ក្នុងរូបភាព ឧបករណ៍ Whites កំណត់ចំណុចភ្លឺបំផុត។\n- **ពណ៌ខ្មៅ (Black)**: តំណាងឱ្យភាពអាថ៌កំបាំង និងជម្រៅ។ ឧបករណ៍ Blacks កំណត់ចំណុចងងឹតបំផុត។\n\n💡 **គន្លឹះ:** ការបន្ថយ Blacks (-) បន្តិច ធ្វើឱ្យរូបភាពកាន់តែមានជម្រៅ (Depth) និងមើលទៅរឹងមាំ (Punchy) ជាងមុន! សាកល្បងមើលណា៎! 📸" },

    // --- WORKFLOW, EXPORT, & UI TOOLS (QUIZ FULL COVERAGE) ---
    { keys: ['aspect ratio', '4:5', '16:9', 'ratio', 'ទំហំរូប'], answer: "សួស្ដីបង! 📐 តើបងដឹងទេថា **Aspect Ratio** គឺជាអ្វី? វាគឺជាសមាមាត្ររវាងទទឹង និងបណ្ដោយរបស់រូបភាព។\n\n- **៤:៥ (4:5)**: គឺជាទំហំស្តង់ដារល្អបំផុតសម្រាប់ផុសលើ **Instagram (Portrait)** ព្រោះវាបង្ហាញពេញអេក្រង់ទូរស័ព្ទ លេចធ្លោជាងគេ។\n- **១៦:៩ (16:9)**: គឺជាសមាមាត្រផ្ដេក ពេញនិយមសម្រាប់ការថតវីដេអូ YouTube ឬទម្រង់បែប **Cinematic (ភាពយន្ត)**។\n\nបងចង់ផុសរូបលើបណ្តាញសង្គមមួយណាដែរ ខ្ញុំអាចណែនាំទំហំឱ្យត្រូវស្តង់ដារបានណា៎! 😉" },
    { keys: ['clone stamp', 'healing brush', 'លុបមុន', 'លុបមនុស្ស', 'ស្នាម'], answer: "ជម្រាបសួរ! 🩹 បងមានបញ្ហារូបជាប់ស្នាម ឬជាប់មនុស្សមែនទេ? **Healing Brush** និង **Clone Stamp** គឺជាវេទមន្តសម្រាប់ជួសជុលរូបភាព៖\n\n- **Healing Brush**: ល្អបំផុតសម្រាប់ **លុបមុន ឬស្នាម** លើស្បែក ដោយវាចម្លងយកទម្រង់ក្បែរៗនោះមកបិទពីលើ រួចតម្រឹមពណ៌ និងពន្លឺដោយស្វ័យប្រវត្តិ។\n- **Clone Stamp**: ចម្លងវត្ថុទាំងមូលពីកន្លែងមួយទៅកន្លែងមួយទៀតទាំងស្រុង ល្អសម្រាប់លុបវត្ថុរំខានធំៗចេញពីផ្ទៃខាងក្រោយ។\n\nសាកល្បងប្រើវា ដើម្បីឱ្យរូបបងកាន់តែ Perfect ឥតខ្ចោះ! ✨" },
    { keys: ['snapshot', 'versions', 'រក្សាទុកការកែ', 'កត់ត្រា'], answer: "សួស្ដីបង! 📸 តើបងធ្លាប់ឆ្ងល់ទេថា **Snapshot (ឬ Versions លើទូរស័ព្ទ)** មានប្រយោជន៍អ្វី?\n\nវាជួយបងឱ្យ **រក្សាទុកដំណាក់កាលកែប្រែ (Save State)** នៅវិនាទីណាមួយ។ ឧទាហរណ៍ បងកែបានស្អាតមួយបែបហើយ ចង់សាកលេងពណ៌បែបផ្សេងទៀត តែខ្លាចបាត់កុងមុន បងគ្រាន់តែបង្កើត Snapshot ទុកសិន។ ពេលបងចង់ត្រលប់មកពណ៌ចាស់វិញ គ្រាន់តែចុចលើ Snapshot នោះ គឺមកវិញភ្លាម ដោយមិនបាច់ចុច Undo ហត់ទេ! ងាយៗមែនទែនបង! 🙌" },
    { keys: ['rating', 'flag', 'ផ្កាយ', 'ទង់', 'សម្គាល់រូប'], answer: "ជម្រាបសួរ! ⭐️ **Rating (ដាក់ផ្កាយ)** និង 🚩 **Flag (ដាក់ទង់)** គឺជាឧបករណ៍ចាត់ចែងរូបភាពកម្រិតប្រូ (Professional Photo Culling)៖\n\n- **Flag**: ប្រើសម្រាប់សម្គាល់រូបដែលត្រូវយក (Pick) ឬ រូបត្រូវបោះចោល (Reject) អោយបានលឿន។\n- **Rating**: ប្រើសម្រាប់ដាក់ពិន្ទុ ១ ដល់ ៥ ផ្កាយ ដើម្បីងាយស្រួលរើសរូបណាដែលស្អាតដាច់គេ (ឧទាហរណ៍ រូប ៥ ផ្កាយទុកធ្វើការងារធំ ឬផ្ញើអោយភ្ញៀវ)។\n\nបើចេះប្រើពួកវា គឺស្រួលរៀបចំរូបរាប់ពាន់សន្លឹកដោយមិនវិលមុខទេបង! 📂" },
    { keys: ['export', 'save', 'facebook', 'fb', 'quality', 'sharpen for screen'], answer: "សួស្ដីបង! 🌟 ធ្លាប់ផុសរូបលើហ្វេសប៊ុកហើយបែកព្រិលមែនទេ? ចង់ Export រូបភាពឱ្យច្បាស់ម៉ត់ល្អ នេះជារូបមន្តអាថ៌កំបាំងដែលជាងថតលាក់ទុក៖\n\n១. **Format**: ជ្រើសយក JPG\n២. **Quality**: ដាក់ ១០០% តែម្ដង\n៣. **Resize to Fit**: ជ្រើសយក Long Edge រួចវាយលេខ **2048 pixels** (នេះជាទំហំមាសដែល FB មិនបង្រួមរូបបង)\n៤. **Output Sharpening**: ធីកលើ **Sharpen for Screen** រួចយក Standard (សម្រាប់ជួយកុំឱ្យបែកពេល Upload)។\n\nសាកល្បងមើលណា៎បង ធានាថាច្បាស់ប្លែកមិត្តភក្តិសួររកក្បួនហើយ! 😎" },
    { keys: ['copy', 'paste', 'settings', 'ចម្លង', 'កូពី'], answer: "ជម្រាបសួរ! 📝 ក្នុងកម្មវិធី Lightroom បងអាចយកការកែប្រែពីរូបមួយ ទៅដាក់រូបមួយទៀត ឬច្រើនសន្លឹកព្រមគ្នាបានយ៉ាងរហ័ស (Batch Edit):\n\n១. ចូលទៅរូបដែលកែហើយ ចុចលើសញ្ញា **... (៣គ្រាប់)** > យក **Copy Settings**។\n២. ទៅកាន់រូបថ្មីដែលបងចង់កែ ចុចសញ្ញា **...** នោះដដែល រួចយក **Paste Settings**។\n\nវានឹងចម្លងពណ៌ និងពន្លឺទាំងមូលតែម្ដង! លឿនជាងផ្លេកបន្ទោរ ហើយចំណេញពេលរាប់ម៉ោងណា៎បង! ⏱️⚡" },
    { keys: ['reset', 'ត្រឡប់ទៅដើម', 'កែខុស'], answer: "សួស្ដីបង! 🔄 បើកែពណ៌ទៅរាងជ្រុលដៃ ឬវង្វេងផ្លូវ មិនអីទេបង មិនបាច់ភ័យ! \n\nបងអាចចុចប៊ូតុង **Reset** នៅខាងក្រោម ឬគ្រាន់តែ **ចុចពីរដង (Double-tap)** លើរង្វង់មូលនៃ Slider ណាមួយ នោះវានឹងរត់ត្រឡប់ទៅលេខ 0 ជាធម្មតាវិញភ្លាមៗ។ កុំខ្លាចក្នុងការសាកល្បងទាញខុសណា៎! រៀនកែរូប គឺត្រូវមានភាពក្លាហានក្នុងការលេងពណ៌! 💪" },
    { keys: ['before', 'after', 'មុន', 'ក្រោយ', 'មើលរូប'], answer: "ជម្រាបសួរ! 👁️ ដើម្បីប្រៀបធៀបរូបភាពមើលថាតើយើងកែបានស្អាតកម្រិតណា បងគ្រាន់តែ **ចុចសង្កត់ (Press and Hold)** លើរូបភាពផ្ទាល់ វានឹងបង្ហាញរូបភាពដើម (Before) រួចពេលបងដកម្រាមដៃចេញ វានឹងបង្ហាញរូបដែលកែរួច (After)។ \n\nការធ្វើបែបនេះជួយបងកុំឱ្យកែពណ៌ជ្រុលដៃពេក (Over-edited)! ស្អាតប្លែកអត់បង? ចង់កែត្រង់ណាទៀតប្រាប់ខ្ញុំមក! 😉" },
    { keys: ['raw', 'jpg', 'ប្រភេទឯកសារ'], answer: "សួស្ដីបង! 📁 តើបងធ្លាប់ឆ្ងល់ទេថាហេតុអ្វីជាងថតអាជីពចូលចិត្តថត **RAW** ជាជាង JPG?\n\n- **RAW File**: គឺជាទិន្នន័យស្រស់ៗពីសេនស័រកាមេរ៉ា។ វាផ្ទុកព័ត៌មានពន្លឺ និងពណ៌ច្រើនមហិមា! ពេលបងទាញ Shadows ដែលងងឹតឈឹង វានៅតែឃើញច្បាស់ មិនបែកគ្រាប់ទេ។\n- **JPG**: ជារូបដែលកាមេរ៉ាកាត់តរួច និងបង្រួម (Compressed) វាតូចស្រួលប្រើមែន តែបងយកមកកែខ្លាំងមិនបានទេ វានឹងបែករូប (Color Banding)។\n\nបើអាច សូមកំណត់កាមេរ៉ាថត RAW ណា៎បង ការកែប្រែនឹងមានសេរីភាពជាងមុន ១០០ ដង! 📷✨" },

    // --- LIGHT & EXPOSURE TOOLS (QUIZ COVERAGE) ---
    { keys: ['exposure', 'ពន្លឺ'], answer: "សួស្ដីបង! 💡 **Exposure** គឺជាឧបករណ៍សម្រាប់គ្រប់គ្រង **ពន្លឺរួម (Overall Light)** នៃរូបភាពទាំងមូលតែម្ដង។\n\n- បើទាញទៅស្ដាំ (+) រូបនឹងភ្លឺឡើង។\n- បើទាញទៅឆ្វេង (-) រូបនឹងងងឹត។\nវាជាជំហានទី ១ សំខាន់បំផុត ដែលបងត្រូវប៉ះមុនគេបង្អស់ ពេលចាប់ផ្តើមកែរូបមួយសន្លឹក! កុំភ្លេចសារ៉េវាឱ្យត្រូវពន្លឺសិនមុននឹងទៅលេងពណ៌ណា៎! ☀️" },
    { keys: ['contrast'], answer: "ជម្រាបសួរ! 🌗 **Contrast** គឺជាមេបញ្ជាការកំណត់គម្លាតរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។\n\n- បើបងដាក់ Contrast ខ្ពស់៖ កន្លែងងងឹតនឹងកាន់តែខ្មៅ កន្លែងភ្លឺកាន់តែភ្លឺ ធ្វើឱ្យរូបភាពមើលទៅរឹងមាំ (Punchy) និងដិតច្បាស់ល្អសម្រាប់ការថតទេសភាព។\n- បើបន្ថយវាទាប៖ រូបភាពនឹងមើលទៅស្រទន់បែបស្រអាប់ៗ (Faded/Vintage look) ដ៏សែនរ៉ូមែនទិក ល្អសម្រាប់ស្តាយកូរ៉េ។ បងចូលចិត្តបែបណាដែរថ្ងៃនេះ? 🤔" },
    { keys: ['highlight', 'whits', 'whites'], answer: "សួស្ដីបង! ☁️ បងប្រាកដជាឆ្ងល់ហើយថា **Highlights** និង **Whites** ខុសគ្នាម៉េចមែនទេ?\n\n- **Highlights**: គ្រប់គ្រងតែតំបន់ដែលភ្លឺខ្លាំង (ដូចជាមេឃ ឬពន្លឺថ្ងៃជះលើមុខ)។ ភាគច្រើនអ្នកជំនាញចូលចិត្តបន្ថយវា (-) ដើម្បីសង្គ្រោះពពក ឬពន្លឺដែលឆេះឱ្យលេចចេញមកវិញ។\n- **Whites**: កំណត់ចំណុច 'សបំផុត' នៅក្នុងរូបភាពទាំងមូល។ គេទាញវាឡើងបន្តិច (+) ដើម្បីឱ្យរូបភាពទាំងមូលមើលទៅស្រឡះ (Pop) និងមិនស្លេកស្លាំង។ សាកសង្កេតពេលទាញវាទាំងពីរមើលបង នឹងឃើញភាពខុសគ្នា! ✨" },
    { keys: ['shadow', 'blacks', 'ពណ៌ខ្មៅ'], answer: "ជម្រាបសួរ! 🌑 សម្រាប់ការគ្រប់គ្រងភាពងងឹត យើងមានវីរបុរស ២ គឺ **Shadows** និង **Blacks**៖\n\n- **Shadows**: ប៉ះពាល់តែតំបន់នៅក្នុងម្លប់ប៉ុណ្ណោះ។ បើបងថតបញ្ច្រាស់ថ្ងៃមុខតួអង្គខ្មៅងងឹត គ្រាន់តែទាញ Shadows បូក (+) មុខនឹងភ្លឺមកវិញវេទមន្តតែម្ដង!\n- **Blacks**: កំណត់ចំណុច 'ខ្មៅបំផុត' ក្នុងរូប។ ការទាញ Blacks ចុះ (-) ជួយឱ្យរូបភាពមានជម្រៅ (Depth) មើលទៅមានទម្ងន់ មិនអណ្ដែត។ ដៃគូទាំងពីរនេះសំខាន់ណាស់សម្រាប់រូប Portrait! 🎩" },
    { keys: ['tone curve', 'curve', 'ខ្សែកោង'], answer: "សួស្ដីបង! 📈 **Tone Curve** គឺជាអាវុធសម្ងាត់ដ៏មានឥទ្ធិពលបំផុតរបស់អ្នកកែរូបអាជីព (Pro Retoucher)!\n\nវាជួយគ្រប់គ្រងពន្លឺ និងពណ៌កម្រិតខ្ពស់។ ក្បួនដែលល្បីជាងគេគឺ ការទាញខ្សែកោងឱ្យចេញជារាង **អក្សរ S (S-Curve)** ៖ គឺគ្រាន់តែទាញចំណុច Highlights (ខាងលើ) ឡើងលើបន្តិច និងទាញ Shadows (ខាងក្រោម) ចុះក្រោមបន្តិច... បងនឹងទទួលបាន Contrast ដ៏ស្រស់ស្អាតនិងទន់ភ្លន់បំផុត! ហ៊ានសាកល្បងប្រើវាទេបង? បើចេះប្រើវាហើយ គឺដកចិត្តមិនរួចទេ! 🚀" },

    // --- COLOR & HSL TOOLS (QUIZ COVERAGE) ---
    { keys: ['white balance', 'wb', 'temp', 'tint', 'សីតុណ្ហភាព'], answer: "ជម្រាបសួរ! 🌡️ **White Balance (WB)** គឺជារឿងសំខាន់បំផុត ដើម្បីកំណត់ថាពណ៌សក្នុងរូប គឺពិតជាពណ៌សពិតប្រាកដ ឬអត់!\n\nវាមានពីរផ្នែកងាយៗ៖\n១. **Temp (Temperature)**: ប្តូរពណ៌ទៅជា លឿង (កក់ក្តៅ/Warm) ឬ ខៀវ (ត្រជាក់/Cool)។ ប្រើសម្រាប់កែពន្លឺព្រះអាទិត្យ ឬពន្លឺភ្លើង។\n២. **Tint**: ប្តូរពណ៌ទៅជា បៃតង (Green) ឬ ស្វាយផ្កាឈូក (Magenta)។ ប្រើដើម្បីកែទម្រូវពណ៌ដែលផ្លាតខុសប្រក្រតីចេញពីដើមឈើ ឬអំពូល Neon ជាដើម។ ត្រូវកែវាឱ្យត្រឹមត្រូវសិន មុននឹងទាញពណ៌ផ្សេងៗណា៎! ⚖️" },
    { keys: ['vibrance', 'saturation'], answer: "សួស្ដីបង! ✨ ចង់ឱ្យពណ៌ស្រស់ តើគួរប្រើ **Vibrance** ឬ **Saturation** ល្អទៅ?\n\n- **Vibrance (ភាពរស់រវើក)**: វាឆ្លាតណាស់បង! វាជ្រើសរើសទាញតែពណ៌ណាដែលស្លេក ឱ្យស្រស់ឡើង ដោយមិនប៉ះពាល់ពណ៌ដែលដិតស្រាប់ និង **សំខាន់គឺការពារមិនឱ្យខូចពណ៌ស្បែកមនុស្ស (Skin tones)** ឡើយ។ ខ្ញុំណែនាំឱ្យបងប្រើវាជានិច្ចសម្រាប់រូប Portrait!\n- **Saturation (កម្រិតពណ៌)**: វាទាញពណ៌ទាំងអស់ឡើងព្រមគ្នាដោយងងឹតងងុល។ បើទាញខ្លាំង ស្បែកមនុស្សនឹងទៅជាពណ៌លឿងឆេះដូចមានជម្ងឺខាន់លឿងអញ្ចឹង! រាងប្រយ័ត្នបន្តិចណា៎! 🎨" },
    { keys: ['hsl', 'mix', 'លាយពណ៌'], answer: "ជម្រាបសួរ! 🎛️ **HSL ឬ Color Mix** គឺជាបន្ទប់ពិសោធន៍វេទមន្តពណ៌របស់អ្នកកែរូប!\n\nពាក្យនេះមកពី៖\n- **H (Hue)**: ប្តូរប្រភេទពណ៌ (ឧ. ប្តូរពណ៌ស្លឹកឈើបៃតង ទៅជាពណ៌លឿងរដូវស្លឹកឈើជ្រុះ)\n- **S (Saturation)**: កំណត់ភាពដិត ឬភាពស្លេករបស់ពណ៌មួយនោះដាច់ដោយឡែក\n- **L (Luminance)**: កំណត់ភាពភ្លឺ ឬងងឹតរបស់ពណ៌នោះ (ឧ. ល្បិចធ្វើឱ្យស្បែកមុខភ្លឺស គឺប្រើ Orange Luminance ទាញឡើងបូក)។\n\nបងចង់ប្តូរពណ៌មួយណាក្នុងរូបដែរពេលនេះ? ប្រាប់ខ្ញុំមក! 🖌️" },
    { keys: ['split toning', 'grading', 'color grading'], answer: "សួស្ដីបង! 🎬 **Color Grading (កាលមុនគេហៅថា Split Toning)** គឺជាតិចនិកកំពូលធ្វើឱ្យរូបមានស្តាយភាពយន្ត (Cinematic Look) កម្រិតហូលីវូដ។\n\nវាអនុញ្ញាតឱ្យបងបាញ់ពណ៌ចូលទៅក្នុងតំបន់ ៣ ផ្សេងគ្នានៃរូបភាព៖\n- **Shadows (តំបន់ងងឹត)**: គេនិយមដាក់ពណ៌ Teal (ខៀវបៃតង) ឬ ខៀវទឹកប៊ិច ឱ្យត្រជាក់ភ្នែក។\n- **Highlights (តំបន់ភ្លឺ)**: គេនិយមដាក់ពណ៌ Orange (ទឹកក្រូច) ឬ លឿង ឱ្យមានភាពកក់ក្តៅ។\nការលាយបញ្ចូលគ្នានៃ Teal & Orange នេះ ធ្វើឱ្យរូបភាពមានសោភ័ណភាព និងអារម្មណ៍ជ្រាលជ្រៅបំផុត! សាកមើលបង ធានាថាឡូយ! 🍿" },
    { keys: ['calibration', 'rgb'], answer: "ជម្រាបសួរ! 🎚️ **Calibration** គឺជាអាវុធកម្រិតខ្ពស់សម្រាប់ប្តូរពណ៌គោលរបស់សេនស័រកាមេរ៉ាតែម្ដង (Red, Green, Blue Primary)។\n\nអ្នកជំនាញតែងតែចូលមកទីនេះដើម្បីបង្កើតទម្រង់ពណ៌ផ្ដាច់មុខរបស់ពួកគេ (Signature Preset Look)។ ឧទាហរណ៍៖ ទាញ Red Primary Hue ទៅស្តាំ និង Blue Primary Hue ទៅឆ្វេង ដើម្បីបង្កើតពណ៌ Teal & Orange ដ៏ស្រស់ស្អាតបំផុត និងធ្វើឱ្យស្លឹកឈើមើលទៅប្លែកភ្នែក! នេះជាអាថ៌កំបាំងនៃការបង្កើត Preset ល្បីៗណា៎! 🤫" },

    // --- EFFECTS, DETAIL, & OPTICS (QUIZ COVERAGE) ---
    { keys: ['texture', 'clarity'], answer: "សួស្ដីបង! 💎 ចង់ឱ្យរូបច្បាស់កម្រិតណា? តោះស្គាល់ពីភាពខុសគ្នារវាង **Texture** និង **Clarity**៖\n\n- **Texture**: ផ្ដោតលើលម្អិតតូចៗ (Micro-details)។ បើទាញដក (-) វាធ្វើឱ្យស្បែកមុខម៉ត់រលោងស្អាតខ្លាំងណាស់ (Skin Smoothing) ដោយមិនប៉ះពាល់ភ្នែក ឬសក់ឱ្យព្រិលឡើយ។\n- **Clarity**: បង្កើន Contrast នៅកម្រិត Midtones។ វាធ្វើឱ្យរូបភាពរឹងមាំ និងមុតស្រួច។ ល្អសម្រាប់ការថតសំណង់អគារ ទេសភាព ឬមនុស្សប្រុស តែបើទាញលើមុខមនុស្សស្រី អាចធ្វើឱ្យមើលទៅចាស់ ឬគ្រើមពេក! ប្រើដោយប្រុងប្រយ័ត្នណា៎បង! 🧑‍🎨" },
    { keys: ['dehaze', 'អ័ព្ទ', 'fog', 'mist'], answer: "ជម្រាបសួរ! 🌫️ **Dehaze** គឺជាឧបករណ៍កម្ចាត់អ័ព្ទដ៏មានឥទ្ធិពលបំផុត៖\n\n- ទាញទៅស្តាំ (+)៖ វាសម្លាប់អ័ព្ទ ផ្សែង ឬធូលី ធ្វើឱ្យរូបភាពទេសភាព ឬមេឃដែលស្រអាប់ ក្លាយជាថ្លាឆ្វង់ និងដិតពណ៌មកវិញភ្លាមៗ។\n- ទាញទៅឆ្វេង (-)៖ វាបន្ថែមអ័ព្ទចូលទៅក្នុងរូប បង្កើតជា Mood បែបយល់សប្តិ អាថ៌កំបាំង ឬរដូវរងា (Dreamy/Fairy tale)។\nឧបករណ៍នេះក៏អាចប្រើសម្រាប់បិទបាំងកន្លែងដែលឆេះពន្លឺខ្លាំងពេកបានខ្លះៗដែរណា៎! 🌄" },
    { keys: ['vignette', 'គែមងងឹត'], answer: "សួស្ដីបង! ⚫ **Vignette** គឺជាបែបផែនកាត់គែម ធ្វើឱ្យជុំវិញគែមរូបភាពទៅជាងងឹត (ឬស)។\n\nមូលហេតុដែលអ្នកថតរូបចូលចិត្តប្រើវា គឺដើម្បីទាញចំណាប់អារម្មណ៍ភ្នែកអ្នកមើល ឱ្យផ្ដោតត្រង់ទៅចំណុចកណ្តាលនៃរូបភាព (Subject) ដោយកាត់បន្ថយភាពរំខាននៅជុំវិញ។ ជាទូទៅ គេដាក់វានៅខ្ទង់ -10 ទៅ -20 សម្រាប់រូប Portrait គឺមើលទៅមានសិល្បៈណាស់បង! អត់ជឿសាកមើលទៅ! 👁️" },
    { keys: ['grain', 'គ្រាប់', 'film'], answer: "ជម្រាបសួរ! 🎞️ **Grain** គឺជាការបន្ថែមគ្រាប់អុចៗតូចៗទៅក្នុងរូបភាព ដើម្បីត្រាប់តាមកាមេរ៉ាហ្វីលជំនាន់មុន (Analog Film Look)។\n\nវាជួយឱ្យរូបភាពមើលទៅមានលក្ខណៈសិល្បៈ បុរាណ (Vintage) និងកាត់បន្ថយភាពរលោងរលិបរលុបពេករបស់កាមេរ៉ាឌីជីថលសម័យថ្មី។ ជួនកាល បើបងកែរូបហើយខូចពណ៌តិចតួច ឬបែកសាច់ ការរោយ Grain ពីលើក៏អាចជួយបិទបាំងកំហុសបានយ៉ាងស័ក្តិសមដែរណា៎! ឆ្លាតមែនទេ? 😉" },
    { keys: ['sharp', 'sharpness', 'ច្បាស់', 'sharpening'], answer: "សួស្ដីបង! 🔪 ដើម្បីធ្វើឱ្យរូបភាពកាន់តែច្បាស់មុតស្រួច (Sharp) បងអាចប្រើឧបករណ៍ **Sharpening** នៅក្នុងផ្នែក Detail។\n\n💡 **គន្លឹះពិសេស (Pro Trick) សម្រាប់ការថត Portrait**:\nពេលបងទាញ Sharpening កុំភ្លេចប្រើមុខងារ **Masking** ពីក្រោមវា (នៅលើកុំព្យូទ័រចុច Alt សង្កត់ រួចអូស slider Masking) ដើម្បីកំណត់ឱ្យកម្មវិធីធ្វើឱ្យច្បាស់តែត្រង់គែមវត្ថុ ឬភ្នែក សក់ប៉ុណ្ណោះ ដោយរក្សាផ្ទៃស្បែកមុខឱ្យនៅរលោងដដែល។ បើមិនអញ្ចឹងទេ ស្នាមមុនក៏ត្រូវបានច្បាស់មកជាមួយដែរណា៎! 👁️✨" },
    { keys: ['noise reduction', 'noise', 'luminance noise'], answer: "ជម្រាបសួរ! 🤫 តើបងធ្លាប់ថតរូបយប់ហើយបែកគ្រាប់អត់? **Luminance Noise Reduction** គឺជាវីរបុរសសង្គ្រោះរូបភាពពេលយប់!\n\nពេលបងថតរូបយប់ងងឹត ហើយប្រើ ISO ខ្ពស់ រូបនឹងចេញគ្រាប់អុចៗសខ្មៅ (Noise) ពេញហ្នឹង។ ការទាញ Luminance ទៅបូក (+) នឹងជួយរំលាយគ្រាប់ទាំងនោះឱ្យម៉ត់រលោងវិញ។ \n⚠️ **ចំណាំ:** សូមកុំទាញខ្លាំងពេក (លើសពី ៤០) ព្រោះរូបភាពនឹងបាត់បង់លម្អិត ហើយមើលទៅដូចរូបមនុស្សជ័រអញ្ចឹង (Plastic look)! យកល្មមៗបានហើយបង! 🌃" },
    { keys: ['optics', 'lens correction', 'profile correction', 'chromatic aberration'], answer: "សួស្ដីបង! 📷 **Lens Corrections (Optics)** គឺជាមួយមុខងារដែលបងត្រូវតែ 'បើកជានិច្ច' គ្រប់រូបភាពទាំងអស់មុននឹងកែពណ៌!\nវាមានពីរចំណុចសំខាន់៖\n១. **Enable Profile Corrections**: កែតម្រូវភាពកោង (Distortion) និងគែមងងឹត (Vignette) ដែលបង្កឡើងដោយកែវថត (Lens) របស់បង មកជារូបរាងធម្មតាវិញដោយស្វ័យប្រវត្តិ។\n២. **Remove Chromatic Aberration**: លុបបំបាត់គែមពណ៌ព្រាលៗ (ពណ៌ស្វាយ ឬបៃតង) ដែលច្រើនកើតមាននៅតាមគែមមែកឈើពេលថតបញ្ច្រាស់ពន្លឺ។\nគ្រាន់តែធីក ២ នេះ រូបបងស្អាតឡើងមួយកម្រិតដោយមិនដឹងខ្លួន! 🔍" },
    { keys: ['geometry', 'upright', 'តម្រង់អគារ'], answer: "ជម្រាបសួរ! 📐 **Geometry (ឬ Upright)** គឺជាឧបករណ៍ដ៏អស្ចារ្យសម្រាប់ការថតអគារ ស្ថាបត្យកម្ម ឬបន្ទប់ (Real Estate)។\n\nបើបងថតរូបមកឃើញអគារ ឬជញ្ជាំងកោងទោរ ផ្អៀងមិនត្រង់ល្អ បងគ្រាន់តែចូលទៅចុចប៊ូតុង **Auto** ឬ **Vertical** ក្នុង Geometry នោះកម្មវិធីនឹងទាញតម្រង់អគារនោះឱ្យឈរត្រង់ភ្លឹង ៩០ ដឺក្រេតែម្ដង ដូចជាងថតស្ថាបត្យកម្មអាជីពថតអញ្ចឹង! 🏢📏" },

    // --- MASKING & SELECTIVE EDITS (QUIZ COVERAGE) ---
    { keys: ['mask', 'masking', 'select sky', 'select subject'], answer: "សួស្ដីបង! 🎭 **Masking** គឺជាការកែប្រែកម្រិតកំពូល ដែលអនុញ្ញាតឱ្យបងកែតែមួយចំណែកនៃរូបភាព ដោយមិនប៉ះពាល់កន្លែងផ្សេង!\n\n- **Select Subject**: កម្មវិធី AI នឹងគូសយកតែតួអង្គ (មនុស្ស ឬ សត្វ) ដោយស្វ័យប្រវត្តិ ដើម្បីបងអាចទាញពន្លឺ ឬពណ៌ឱ្យមនុស្សភ្លឺលេចធ្លោឡើង។\n- **Select Sky**: គូសយកតែផ្ទៃមេឃ។ ងាយស្រួលបំផុតបើចង់ឱ្យមេឃពណ៌ខៀវដិតស្រស់ តែមិនចង់ឱ្យជាប់ពណ៌ទៅដល់មុខមនុស្ស! បងសាកប្រើ Masking មើល រូបភាពនឹងលោតដល់កម្រិត Pro ភ្លាម! 🦸‍♂️" },
    { keys: ['radial gradient', 'linear gradient', 'invert mask'], answer: "ជម្រាបសួរ! 🔘 ក្នុង Masking បងអាចប្រើឧបករណ៍គូសវាសផ្ទាល់ដៃជាច្រើន៖\n\n- **Radial Gradient**: គឺការគូសជារង្វង់។ ឧទាហរណ៍ គូសរង្វង់ចំលើមុខតួអង្គ រួចទាញ Exposure ឡើងបន្តិចដើម្បីបង្កើតជាចំណុចលេចធ្លោ (Spotlight)។\n- **Linear Gradient**: គូសជាបន្ទាត់ត្រង់។ ល្អសម្រាប់ការទាញមេឃឱ្យងងឹតបន្តិចនៅផ្នែកខាងលើ ដើម្បីឱ្យរូបមានជម្រៅទាក់ទាញ។\n- **Invert Mask**: គឺការត្រឡប់តំបន់ដែលបានជ្រើសរើស (ឧ. គូសរង្វង់លើមុខ រួចចុច Invert មានន័យថា វានឹងជ្រើសរើសទីតាំងទាំងអស់ **ក្រៅពីមុខ** វិញ)។ ល្បិចនេះឡូយណាស់ណា៎សាកមើលទៅ! 🔄" },

    // --- FIXES ---
    { keys: ['underexposed', 'dark face', 'ងងឹតមុខ'], answer: "សួស្ដីបង! 📸 បើរូបថតមកងងឹតមុខ ឬថតបញ្ច្រាស់ថ្ងៃ កុំបារម្ភអី ងាយៗទេតោះធ្វើតាមខ្ញុំ៖\n\n១. សាកល្បងចូល Basic រួចទាញ **Shadows** ឡើង (+) ខ្ទង់ +40 ទៅ +60 ដើម្បីបើកពន្លឺក្នុងម្លប់។\n២. បើវានៅតែមិនគ្រប់គ្រាន់ ឬធ្វើអោយរូបស្លេកពេក បងអាចប្រើយុទ្ធសាស្ត្រ **Masking > Radial Gradient** គូសរង្វង់ចំពីលើមុខតួអង្គ រួចទាញ Exposure ឡើងបន្តិច។ ធានាថាមុខភ្លឺស្អាតដូចមានអ្នកកាន់ភ្លើងហ្វាពន្លឺឱ្យអញ្ចឹង! 💡" },
    { keys: ['blurry', 'not sharp', 'មិនច្បាស់'], answer: "ជម្រាបសួរ! 🧐 បើរូបថតមកមិនសូវច្បាស់ ឬរាងព្រិលបន្តិច បងអាចសង្គ្រោះបានខ្លះៗដោយ៖\n\n១. ចូលទៅ Detail លើក **Sharpening** ឡើងខ្ទង់ +40 ទៅ +60 ដើម្បិអោយគែមវត្ថុមុត។\n២. ត្រលប់មក Basic លើក **Clarity** បន្តិច (+10 ទៅ +15) ដើម្បីបន្ថែមភាពរឹងមាំ (Micro-contrast)។\n⚠️ តែបើវាព្រិលខ្លាំងដោយសាររលាក់ដៃពេលថត (Motion Blur) ឬខុស Focus ខ្លាំងពេក ការកែមិនអាចសង្គ្រោះបាន ១០០% ទេណា៎បង។ ដូច្នេះការព្យាយាមថតរូបដើមអោយច្បាស់ (Raw file) គឺសំខាន់បំផុត! 📸" },
    { keys: ['dull', 'flat', 'ស្លេក'], answer: "សួស្ដីបង! 🎨 បើរូបភាពមើលទៅស្លេកៗ គ្មានជីវិត តោះធ្វើឱ្យវាលេចធ្លោរស់រវើកឡើងវិញ៖\n\n១. បង្កើន **Contrast** បន្តិច (+15 ទៅ +25) អោយរូបមានទម្ងន់។\n២. ទាញ **Blacks** ចុះអោយជាប់ដក (-) ដើម្បីឱ្យរូបភាពមានស្រមោលកាត់គ្នា និងមានជម្រៅ។\n៣. បង្កើន **Vibrance** (+20) ឱ្យពណ៌ស្រស់រស់រវើកមកវិញដោយសុវត្ថិភាព មិនខូចស្បែកមនុស្ស។ គ្រាន់តែ ៣ ជំហានងាយៗនេះ រូបបងនឹង Pop ឡើងតែម្ដង! ✨" },
    { keys: ['too bright', 'overexposed', 'ភ្លឺពេក'], answer: "ជម្រាបសួរ! ☀️ បើរូបភាពភ្លឺឆេះពេក (Overexposed) បងអាចទាញវាចុះបានយ៉ាងងាយ (ពិសេសបើរូបនោះជាទម្រង់ RAW)៖\n\n១. បន្ថយពន្លឺរួមមុនគេ ដោយទាញ **Exposure** ចុះ (-0.5 ទៅ -1.0)។\n២. ទាញសង្គ្រោះពពកមេឃ ឬពន្លឺថ្ងៃឆេះ ដោយទាញ **Highlights** ចុះខ្លាំង (-50 ទៅ -100)។\n៣. ទាញ **Whites** ចុះបន្តិចបើសិនជានៅតែឆេះសខ្លាំង។ ធានាថាពពកដែលបាត់ នឹងលេចចេញមកវិញយ៉ាងអស្ចារ្យ! ☁️" },

    // --- SPECIFIC SCENARIOS & LOOKS ---
    { keys: ['street', 'urban', 'ផ្លូវ', 'ទីក្រុង', 'street photography'], answer: "សួស្ដីបង! 🏙️ សម្រាប់រូបភាព Street Photography ថតតាមដងផ្លូវទីក្រុង ស្ទីលបែបស្រអាប់ៗ តែរឹងមាំ (Gritty & Contrast) គឺសាកសមបំផុត៖\n\n- **Light**: បង្កើន Contrast (+30), ទាញ Highlights ចុះ (-40) ដើម្បីយកពពកមកវិញ និងបង្កើន Shadows (+30) អោយឃើញសំណង់។\n- **Effects**: បង្កើន Clarity (+20 ទៅ +30) ឱ្យអគារមើលទៅរឹងមាំមុតស្រួច។\n- **Color**: បន្ថយ Saturation រួមបន្តិច (-10) ឬប្រើ Color Grading បន្ថែមពណ៌ខៀវក្នុង Shadows ឱ្យមើលទៅបែបភាពយន្ត (Cinematic)! ម៉េចដែរចាប់អារម្មណ៍ស្តាយនេះទេបង? សាកកែឥឡូវទៅ! 📸" },
    { keys: ['food', 'delicious', 'អាហារ', 'ម្ហូប', 'ញ៉ាំ'], answer: "ជម្រាបសួរ! 🍔 ដើម្បីកែរូបអាហារ ឬកាហ្វេឱ្យមើលទៅគួរឱ្យចង់ញ៉ាំ ស្រក់ទឹកមាត់ នេះជាគន្លឹះប្រចាំហាងល្បីៗ៖\n\n១. **White Balance**: កុំឱ្យរូបភាពលឿងពេក ឬខៀវពេក ត្រូវប្រាកដថាពណ៌ចានពណ៌ស គឺពិតជាពណ៌ស! (បងអាចចុចយក Auto ក៏បាន)\n២. **Color**: បង្កើន Vibrance (+30) ឱ្យពណ៌បន្លែ សាច់ ស្រស់ស្អាត។ បងអាចបន្ថែម Red និង Orange Saturation បន្តិចក្នុង HSL។\n៣. **Details**: បង្កើន Texture (+15) ដើម្បីឱ្យគេឃើញសរសៃសាច់ គ្រឿងទេស ឬភាពស្រួយរបស់អាហារបានច្បាស់។ ឃ្លានបាត់អីឡូវហើយ! 🤤" },
    { keys: ['cafe', 'coffee', 'shop', 'ហាងកាហ្វេ', 'កាហ្វេ'], answer: "សួស្ដីបង! ☕ សម្រាប់ការថតរូបលេងនៅហាងកាហ្វេ ស្តាយកូរ៉េបែបកក់ក្តៅ និងបែប Minimalist (Warm & Minimal) គឺកំពុងពេញនិយមខ្លាំងនៅលើ IG៖\n\n- **Temp**: ទាញទៅស្តាំបន្តិច ឱ្យកក់ក្តៅ (Warm tone) រាងលឿងតិចៗ។\n- **Contrast**: បន្ថយបន្តិច (-15) ឱ្យរូបភាពស្រទន់ មើលទៅស្រួលភ្នែក មិនដិតពេក។\n- **Color Mix**: បន្ថយ Saturation ពណ៌បៃតង និងខៀវឱ្យស្លេក (Desaturate) ទុកតែពណ៌ទឹកក្រូច លឿង និងត្នោត ដែលជាពណ៌ឈើ និងកាហ្វេ។ ធានាផុសទៅបាន Like ច្រើនណាស់បង! 🤎" },
    { keys: ['wedding', 'pre-wedding', 'prewedding', 'ការងារ', 'រោងការ'], answer: "ជម្រាបសួរ! 💍 សម្រាប់រូប Pre-wedding ស្តាយកូរ៉េ ដែលជាងថតល្បីៗនិយមប្រើគឺ **Bright & Airy (ភ្លឺ ស្រទន់ និងមានខ្យល់អាកាសបរិសុទ្ធ)**៖\n\n១. បង្កើន **Exposure** (+0.3 ទៅ +0.7) ឱ្យរូបភ្លឺស្រឡះ។\n២. ទាញ **Shadows** ឡើងខ្លាំង (+40 ទៅ +60) ឱ្យមុខតួអង្គទាំងពីរភ្លឺទន់ភ្លន់ លុបស្រមោលអាក្រក់។\n៣. បន្ថយ **Contrast** (-10 ទៅ -20) និងបន្ថយ **Texture/Clarity** បន្តិច (-10) ដើម្បីឱ្យស្បែកមើលទៅម៉ត់រលោង និងបង្កើតបរិយាកាសរ៉ូមែនទិក។ ផ្អែមល្ហែមណាស់បងអើយ! 🥰" },
    { keys: ['sunset', 'sunrise', 'ថ្ងៃលិច', 'ថ្ងៃរះ', 'golden', 'golden hour'], answer: "សួស្ដីបង! 🌅 រូប Golden Hour ពេលថ្ងៃរះ ឬថ្ងៃលិច ត្រូវការបង្ហាញភាពកក់ក្តៅ និងរ៉ូមែនទិកខ្លាំង៖\n\n- **White Balance**: ទាញ Temp ទៅរកពណ៌លឿង/ទឹកក្រូច (+) ច្រើនបន្តិច ដើម្បីបន្ថែមភាពកក់ក្តៅអោយពន្លឺ។\n- **Light**: ទាញ Highlights ចុះខ្លាំង (-50 ដល់ -80) ដើម្បីកុំឱ្យឆេះព្រះអាទិត្យ និងទាញ Shadows ឡើង (+40) ឱ្យឃើញទេសភាពនិងតួអង្គច្បាស់។\n- **Color Grading**: សាកល្បងដាក់ពណ៌ទឹកក្រូចក្នុង Highlights ឱ្យពន្លឺព្រះអាទិត្យកាន់តែជះខ្លាំង។ ធានាថាល្អឥតខ្ចោះបង! ✨" },
    { keys: ['portrait', 'មនុស្ស', 'tua'], answer: "ជម្រាបសួរ! 🧑 សម្រាប់ការកែរូប Portrait ឱ្យស្អាតទាក់ទាញ ក្បួនធំបំផុតគឺ **ត្រូវយកតួអង្គជាធំ**៖\n\n១. ត្រូវប្រាកដថាមុខតួអង្គភ្លឺល្អ (ប្រើ Exposure ឱ្យល្មម ឬ Radial Mask គូសលើមុខរួចទាញភ្លឺ)។\n២. កែពណ៌ស្បែកឱ្យស៊ីជម្ពូ ដោយប្រើ HSL > Orange (បន្ថយ Saturation បន្តិច, បង្កើន Luminance អោយសម៉ត់)។\n៣. បន្ថយ Texture (-15) លើមុខ ដើម្បីធ្វើឱ្យស្បែកមុខរលោងស្អាត ដោយមិនប៉ះពាល់ភាពច្បាស់របស់សក់និងភ្នែក។\n៤. ដាក់ Vignette (-15) ឱ្យគែមងងឹត ដើម្បីកុំអោយមានអ្វីរំខានភ្នែក គឺឱ្យគេមើលតែតួអង្គ។ ស្អាតកប់ស៊េរី! 📸" },
    { keys: ['landscape', 'scenery', 'ទេសភាព', 'ព្រៃ', 'ភ្នំ'], answer: "សួស្ដីបង! 🏞️ ដើម្បីកែរូបទេសភាព (Landscape) ឱ្យស្រស់ស្អាត ដិតល្អ នេះជាក្បួនប្រចាំត្រកូល៖\n\n១. **ពន្លឺ**: ទេសភាពច្រើនតែមានផ្ទៃមេឃភ្លឺពេក ហើយដីងងឹតពេក។ ដូច្នេះ បងត្រូវទាញ Highlights ចុះ (-60) និងទាញ Shadows ឡើង (+60) ដើម្បីឱ្យពន្លឺស្មើគ្នាល្អ។\n២. **ភាពច្បាស់**: បង្កើន Texture និង Clarity ខ្ទង់ +20 ឡើង ដើម្បីឱ្យដើមឈើ និងផ្ទាំងថ្មមើលទៅមានទម្រង់ច្បាស់លាស់។\n៣. **ពណ៌**: បង្កើន Vibrance (+30 ទៅ +40) ដើម្បីឱ្យមេឃ និងពណ៌បៃតងរស់រវើក! បងត្រៀមវ៉ាលីចេញដើរលេងហើយមែនទេ? តោះកែរូបហើយផុសយក Like អោយពេញហ្នឹងទៅ! 😉" },
    
    // --- GREETINGS & GENERAL CONVERSATION ---
    { keys: ['hello', 'hi', 'suesdey', 'សួស្តី', 'សួរ', 'bhat', 'jah', 'love', 'ញុំា'], answer: "សួស្ដីបងបាទ/ចាស! 👋 ស្វាគមន៍មកកាន់ 'ម៉ាយឌីហ្សាញ' ។ ខ្ញុំជាជំនួយការ AI ដ៏ឆ្លាតវៃ និងរួសរាយរបស់អ្នក ដែលមានជំនាញពិសេសខាងកែរូបភាពបែបអាជីពជាមួយ Lightroom។ \n\nតើថ្ងៃនេះបងចង់ឱ្យខ្ញុំជួយពន្យល់ពីឧបករណ៍ណា (ឧទាហរណ៍ Tone Curve, HSL) អត្ថន័យនៃពណ៌ ឬ ចង់បានរូបមន្ត Preset ស្តាយអីដែរ (ឧទាហរណ៍ Cinematic, កាហ្វេ, Pre-wedding)? ប្រាប់ខ្ញុំមកបានតាមសប្បាយណា៎ មិនបាច់ក្រែងចិត្តទេ! 😊✨" },
    { keys: ['thanks', 'orkun', 'អរគុណ'], answer: "មិនអីទេបង! ខ្ញុំជួយបានដោយក្ដីរំភើប! ❤️ ខ្ញុំសប្បាយចិត្តណាស់ដែលបានជួយចែករំលែកចំណេះដឹងនេះដល់បង។ \n\nកុំភ្លេចណា៎ ការកែរូបកាន់តែស្អាត គឺអាស្រ័យលើការហាត់អនុវត្តញឹកញាប់ (Practice makes perfect!) លេងជាមួយពណ៌ឱ្យច្រើន។ បើពេលកំពុងកែមានចម្ងល់អី ឬចង់សួរពីបច្ចេកទេសថ្មីៗ បងអាចឆាតសួរខ្ញុំបានរហូតណា៎! សំណាងល្អក្នុងការកែរូបបង! 📸🔥" },
    { keys: ['help', 'ជួយ', 'របៀបប្រើ', 'guide'], answer: "ជម្រាបសួរ! 🤝 ខ្ញុំនៅទីនេះរង់ចាំជួយបងជានិច្ច! បងអាចសួរខ្ញុំបានរាល់ចម្ងល់ទាំងអស់ទាក់ទងនឹងការកែរូប ដូចជា៖\n\n🎨 **សួរពីរូបមន្តពណ៌**: 'សុំ Preset ហាងកាហ្វេ' ឬ 'របៀបកែពណ៌ Cinematic'\n🛠️ **សួរពីឧបករណ៍កែរូប**: 'តើ Dehaze ប្រើសម្រាប់អ្វី?' ឬ 'ពន្យល់ពី Tone Curve'\n🧠 **សួរពីអត្ថន័យពណ៌**: 'តើពណ៌ខៀវមានន័យដូចម្តេចក្នុងរូបភាព?'\n📸 **សួរពីបញ្ហាក្នុងរូប**: 'ហេតុអីថតរូបមកងងឹតមុខ?' ឬ 'របៀបកែរូបកុំឱ្យមាន Noise'\n\nគ្រាន់តែសរសេរសំណួររបស់បងមក ខ្ញុំនឹងពន្យល់ប្រាប់យ៉ាងលម្អិត និងងាយយល់បំផុត! តោះ ចាប់ផ្តើមសួរមក! 🚀" }
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
    { id: 'bright_airy_1', name: 'Bright & Airy', color: 'from-blue-100 to-white' },
    { id: 'teal_orange_1', name: 'Teal & Orange', color: 'from-teal-500 to-orange-500' },
    { id: 'feeling_moody_1', name: 'Moody Dark', color: 'from-gray-700 to-gray-900' },
    { id: 'vintage_film_1', name: 'Vintage Film', color: 'from-yellow-600 to-orange-700' },
    { id: 'cyberpunk_1', name: 'Cyberpunk', color: 'from-pink-500 to-cyan-500' },
    { id: 'cinematic_1', name: 'Cinematic', color: 'from-slate-700 to-slate-900' },
    { id: 'wedding_classic_1', name: 'Wedding Classic', color: 'from-rose-100 to-white' },
    { id: 'portrait_clean_1', name: 'Clean Portrait', color: 'from-orange-100 to-rose-100' },
    { id: 'urban_street_1', name: 'Urban Street', color: 'from-gray-600 to-slate-800' },
    { id: 'golden_hour_1', name: 'Golden Hour', color: 'from-yellow-400 to-orange-500' },
    { id: 'nature_landscape_1', name: 'Nature Pop', color: 'from-green-500 to-emerald-700' },
    { id: 'food_tasty_1', name: 'Tasty Food', color: 'from-yellow-400 to-orange-400' },
    { id: 'bw_noir_1', name: 'B&W Noir', color: 'from-black to-gray-500' },
    { id: 'soft_pastel_1', name: 'Soft Pastel', color: 'from-pink-200 to-blue-200' },
    { id: 'fashion_editorial_1', name: 'Fashion', color: 'from-purple-400 to-pink-400' },
    { id: 'night_neon_1', name: 'Night Neon', color: 'from-blue-900 to-purple-900' },
    { id: 'dark_moody_1', name: 'Dark Moody', color: 'from-stone-800 to-stone-950' },
    { id: 'forest_green_1', name: 'Forest Green', color: 'from-green-800 to-emerald-900' },
    { id: 'portrait_glow_1', name: 'Portrait Glow', color: 'from-amber-200 to-yellow-100' },
    { id: 'matte_black_1', name: 'Matte Black', color: 'from-zinc-600 to-zinc-800' },
];

const generateVariations = (baseId, baseParams, count) => {
    const variants = {};
    for (let i = 1; i <= count; i++) {
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
    ...generateVariations("color_red", { basic: { Temp: 10, Tint: 20, Saturation: 10, Vibrance: 20 }, grading: { Shadows: { h: 350, s: 15, l: 0 }, Highlights: { h: 10, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_orange", { basic: { Temp: 15, Tint: 5, Saturation: 10 }, grading: { Shadows: { h: 25, s: 20, l: 0 }, Highlights: { h: 40, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_yellow", { basic: { Temp: 10, Tint: 0, Vibrance: 30 }, grading: { Shadows: { h: 50, s: 15, l: 0 }, Highlights: { h: 60, s: 20, l: 5 } } }, 15),
    ...generateVariations("color_green", { basic: { Temp: -5, Tint: -20, Saturation: 10 }, grading: { Shadows: { h: 120, s: 20, l: -5 }, Highlights: { h: 90, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_cyan", { basic: { Temp: -10, Tint: -5, Saturation: 5 }, grading: { Shadows: { h: 180, s: 20, l: 0 }, Highlights: { h: 170, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_blue", { basic: { Temp: -20, Tint: 0, Saturation: 5 }, grading: { Shadows: { h: 220, s: 20, l: -5 }, Highlights: { h: 200, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_purple", { basic: { Temp: -5, Tint: 20, Vibrance: 15 }, grading: { Shadows: { h: 270, s: 20, l: -5 }, Highlights: { h: 280, s: 10, l: 0 } } }, 15),
    ...generateVariations("color_pink", { basic: { Temp: 5, Tint: 25, Vibrance: 20 }, grading: { Shadows: { h: 320, s: 15, l: 0 }, Highlights: { h: 340, s: 10, l: 5 } } }, 15),
    ...generateVariations("color_teal_orange", { basic: { Exposure: 0.1, Contrast: 20, Highlights: -40, Shadows: 30, Temp: 5 }, grading: { Shadows: { h: 210, s: 20, l: -5 }, Midtones: { h: 30, s: 10, l: 0 }, Highlights: { h: 35, s: 20, l: 0 } } }, 20),
    ...generateVariations("feeling_moody", { basic: { Exposure: -0.2, Contrast: 30, Highlights: -50, Shadows: -10, Vibrance: -20 }, grading: { Shadows: { h: 220, s: 10, l: -10 }, Highlights: { h: 40, s: 5, l: 0 } } }, 20),
    ...generateVariations("feeling_bright", { basic: { Exposure: 0.3, Contrast: 5, Highlights: -30, Shadows: 40, Whites: 20, Vibrance: 20 }, grading: { Highlights: { h: 50, s: 5, l: 5 } } }, 15),
    ...generateVariations("feeling_soft", { basic: { Exposure: 0.1, Contrast: -10, Highlights: -20, Shadows: 20, Clarity: -15, Texture: -10 }, grading: { Midtones: { h: 30, s: 10, l: 0 } } }, 15),
    ...generateVariations("feeling_dramatic", { basic: { Exposure: 0.0, Contrast: 60, Highlights: -40, Shadows: 40, Clarity: 30, Dehaze: 10 }, grading: { Shadows: { h: 240, s: 10, l: -10 } } }, 15),
    ...generateVariations("time_golden", { basic: { Exposure: 0.1, Contrast: 15, Highlights: -20, Shadows: 20, Temp: 20, Tint: 5, Vibrance: 30 }, grading: { Shadows: { h: 40, s: 15, l: 0 }, Highlights: { h: 45, s: 20, l: 0 } } }, 15),
    ...generateVariations("time_night", { basic: { Exposure: 0.2, Contrast: 20, Highlights: 10, Shadows: 10, Temp: -10, Tint: 10, Vibrance: 40 }, grading: { Shadows: { h: 260, s: 30, l: -5 }, Highlights: { h: 300, s: 20, l: 0 } } }, 15),
    ...generateVariations("time_bluehour", { basic: { Exposure: 0.0, Contrast: 15, Temp: -25, Tint: 0, Vibrance: 20 }, grading: { Shadows: { h: 230, s: 30, l: -10 } } }, 10),
    ...generateVariations("food_tasty", { basic: { Exposure: 0.2, Contrast: 25, Highlights: -10, Vibrance: 40, Saturation: 10, Clarity: 10 }, grading: { Midtones: { h: 20, s: 5, l: 0 } } }, 15),
    ...generateVariations("nature_landscape", { basic: { Contrast: 20, Highlights: -60, Shadows: 60, Vibrance: 50, Clarity: 20, Dehaze: 10 }, grading: { Highlights: { h: 200, s: 10, l: 0 } } }, 20),
    ...generateVariations("urban_street", { basic: { Exposure: 0.0, Contrast: 40, Highlights: -40, Shadows: 20, Clarity: 30, Saturation: -20 }, grading: { Shadows: { h: 200, s: 10, l: -5 } } }, 15),
    ...generateVariations("vintage_film", { basic: { Exposure: 0.05, Contrast: 15, Highlights: -25, Shadows: 25, Temp: 10, Tint: -5, Grain: 40 }, grading: { Shadows: { h: 210, s: 10, l: 5 }, Highlights: { h: 45, s: 15, l: 0 } } }, 20),
    ...generateVariations("bw_noir", { basic: { Contrast: 40, Highlights: -30, Shadows: 30, Whites: 20, Blacks: -30, Saturation: -100, Clarity: 20 }, grading: {} }, 15),
    ...generateVariations("cinematic_teal", { basic: { Exposure: 0.0, Contrast: 20, Highlights: -40, Shadows: 20, Vibrance: 10 }, grading: { Shadows: { h: 210, s: 30, l: -10 }, Highlights: { h: 35, s: 20, l: 0 } } }, 10),
    ...generateVariations("bright_airy", { basic: { Exposure: 0.4, Contrast: 10, Highlights: -30, Shadows: 50, Whites: 30, Blacks: 20, Temp: 5, Vibrance: 30, Saturation: 0, Clarity: -10 }, grading: { Highlights: { h: 50, s: 5, l: 0 } } }, 10),
    ...generateVariations("wedding_classic", { basic: { Exposure: 0.15, Contrast: 15, Highlights: -30, Shadows: 30, Whites: 10, Vibrance: 15 }, grading: { Midtones: { h: 40, s: 8, l: 0 } } }, 10),
    ...generateVariations("wedding_bright", { basic: { Exposure: 0.3, Contrast: 5, Highlights: -40, Shadows: 40, Whites: 25, Vibrance: 20 }, grading: { Highlights: { h: 50, s: 5, l: 5 } } }, 10),
    ...generateVariations("portrait_clean", { basic: { Exposure: 0.1, Contrast: 10, Highlights: -20, Shadows: 20, Whites: 10, Blacks: -5, Vibrance: 10, Saturation: -5, Clarity: -5 }, grading: { Midtones: { h: 30, s: 5, l: 0 } } }, 10),
    ...generateVariations("portrait_smooth", { basic: { Exposure: 0.15, Contrast: 5, Highlights: -20, Shadows: 20, Clarity: -10, Texture: -10 }, grading: { Midtones: { h: 25, s: 10, l: 5 } } }, 10),
    ...generateVariations("portrait_glow", { basic: { Exposure: 0.1, Contrast: 10, Highlights: -30, Shadows: 15, Temp: 10, Vibrance: 20 }, grading: { Highlights: { h: 45, s: 15, l: 5 } } }, 10),
    ...generateVariations("cyberpunk", { basic: { Exposure: 0.1, Contrast: 20, Highlights: 10, Shadows: 10, Temp: -15, Tint: 20, Vibrance: 40, Dehaze: 15 }, grading: { Shadows: { h: 260, s: 30, l: -5 }, Highlights: { h: 320, s: 20, l: 0 } } }, 10),
    ...generateVariations("forest_green", { basic: { Exposure: -0.1, Contrast: 20, Highlights: -40, Shadows: 20, Temp: 5, Tint: -15, Vibrance: 30 }, grading: { Shadows: { h: 120, s: 15, l: -5 }, Highlights: { h: 50, s: 10, l: 0 } } }, 10),
    ...generateVariations("black_white", { basic: { Contrast: 30, Highlights: -20, Shadows: 20, Whites: 20, Blacks: -20, Saturation: -100, Clarity: 20, Vignette: -15 } }, 10),
    ...generateVariations("cinematic", { basic: { Exposure: 0.05, Contrast: 10, Highlights: -30, Shadows: 20, Temp: 10, Vibrance: 15 }, grading: { Shadows: { h: 190, s: 15, l: -5 }, Highlights: { h: 40, s: 20, l: 0 } } }, 10),
    ...generateVariations("food_vivid", { basic: { Exposure: 0.1, Contrast: 30, Highlights: -20, Shadows: 20, Vibrance: 40, Saturation: 10, Clarity: 15 }, grading: { Midtones: { h: 0, s: 0, l: 0 } } }, 10),
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
    
    const match = KNOWLEDGE_BASE.find(item => item.keys.some(key => {
        // បើ key ជាភាសាអង់គ្លេសសុទ្ធ (English words) យើងប្រើ Word Boundary Regex
        // ដើម្បីកុំឱ្យពាក្យ "shop" ទៅរត់ចូលក្នុងពាក្យ "photoshop"
        if (/^[a-z0-9\s]+$/.test(key)) {
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            return regex.test(query);
        }
        // បើជាអក្សរខ្មែរ យើងប្រើ includes ធម្មតា ព្រោះខ្មែរអត់ប្រើ Space ទេ
        return query.includes(key);
    }));
    
    if (match) return match.answer;

    const refusedTopics = ['video', 'song', 'music', 'game', 'hack', 'money', 'crypto'];
    if (refusedTopics.some(t => {
        if (/^[a-z0-9\s]+$/.test(t)) {
            return new RegExp(`\\b${t}\\b`, 'i').test(query);
        }
        return query.includes(t);
    })) {
        return "សូមអភ័យទោសបង! 🚫 ខ្ញុំគឺជា AI ដែលបណ្ដុះបណ្ដាលឡើងពិសេសសម្រាប់តែការកែរូបភាពក្នុងកម្មវិធី Lightroom ប៉ុណ្ណោះ។\nបើបងមានចម្ងល់ពីការទាញពណ៌ ប្រើប្រាស់ឧបករណ៍នានា ឬស្វែងរក Preset ស្អាតៗ បងអាចសួរខ្ញុំបានជានិច្ចណា៎! 😊";
    }

    // Return a random funny fallback response
    const randomFallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    return randomFallback;
};

// ==========================================
// 4. MAIN COMPONENTS
// ==========================================

const ColorWheel = ({ hue, sat, onChange, size = 150, isDarkMode }) => {
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
            <div className={`absolute -inset-4 rounded-full blur-xl ${isDarkMode ? 'bg-[#121212]/50' : 'bg-[#1A1C1E]/5'}`}></div>
            <div className={`absolute -inset-3 rounded-full border shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}></div>
            <div className={`absolute -inset-[2px] rounded-full shadow-inner ${isDarkMode ? 'bg-[#121212]/50' : 'bg-[#1A1C1E]/5'}`}></div>
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(closest-side, white, transparent 100%)', pointerEvents: 'none' }}></div>
            </div>
            <div className={`absolute w-6 h-6 bg-[#FFFFFF] rounded-full border-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ease-out group-hover:scale-110 z-10 ${isDarkMode ? 'border-[#1E1E1E]' : 'border-[#FFFFFF]'}`} style={{ left: handleX, top: handleY }}></div>
        </div>
    );
};

const Header = ({ activeTab, setActiveTab, isDarkMode, setIsDarkMode }) => {
  return (
    <header className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : ''} backdrop-blur-xl sticky top-0 z-50 border-b transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/80 text-[#E3E3E3] border-[#2C2C2C]' : 'bg-[#FFFFFF]/80 text-[#1A1C1E] border-[#E0E0E0]'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('learn')}>
          <div className={`w-12 h-12 relative rounded-xl overflow-hidden shadow-lg flex-shrink-0 group-hover:shadow-[#C65102]/20 transition-all duration-500 ease-spring group-hover:scale-105 p-1 border ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className={`text-xl font-bold font-khmer tracking-tight group-hover:opacity-80 transition-opacity ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>ម៉ាយឌីហ្សាញ</h1>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#2C2C2C] text-[#9AA0A6]' : 'hover:bg-[#FAFAFA] text-[#5F6368]'}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <nav className={`hidden md:flex space-x-1 p-1.5 rounded-full border shadow-lg ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
            {['learn', 'quiz', 'lab', 'ai'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-full transition-all duration-300 ease-spring flex items-center gap-2 whitespace-nowrap font-medium text-sm ${activeTab === t ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-md ring-1 ring-[#2C2C2C]' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-md ring-1 ring-[#E0E0E0]') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-[#1A1C1E] hover:bg-[#FAFAFA]')}`}>
                {t === 'learn' && <BookOpen size={16}/>}{t === 'quiz' && <Award size={16}/>}{t === 'lab' && <Sliders size={16}/>}{t === 'ai' && <Bot size={16}/>}
                <span className="font-khmer font-bold uppercase hidden lg:block tracking-wide text-[13px]">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'គ្រូ AI'}</span>
                </button>
            ))}
            </nav>
        </div>
      </div>
    </header>
  );
};

const LessonModal = ({ lesson, onClose, isDarkMode }) => {
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
          <div className={`absolute inset-0 backdrop-blur-md transition-opacity duration-500 ease-out ${closing ? 'opacity-0' : 'opacity-100'} ${isDarkMode ? 'bg-[#121212]/60' : 'bg-[#1A1C1E]/20'}`} style={{ opacity: Math.max(0, opacity) }} onClick={handleClose} />
          <div ref={modalRef} className={`relative w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] h-[85vh] sm:h-auto transition-transform duration-500 ease-spring ring-1 ${isDarkMode ? 'bg-[#1E1E1E] ring-[#2C2C2C]' : 'bg-[#FFFFFF] ring-[#E0E0E0]'} ${closing ? 'translate-y-full' : 'translate-y-0'}`} style={{ transform: `translateY(${closing ? '100%' : `${dragOffset}px`})`, transition: dragOffset > 0 ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
             <div className="w-full flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing sm:hidden" onClick={handleClose}><div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#E0E0E0]'}`}></div></div>
             <div className={`border-b p-6 flex items-center justify-between sticky top-0 z-10 shrink-0 rounded-t-3xl ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-[#C65102]/10 rounded-2xl text-[#C65102] border border-[#C65102]/20">{lesson.icon}</div>
                    <h2 className={`text-2xl font-bold font-khmer tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{lesson.title}</h2>
                </div>
                <button onClick={handleClose} className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#2C2C2C]/80 text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#5F6368] hover:text-[#1A1C1E]'}`}><XCircle className="w-6 h-6" /></button>
             </div>
             <div className={`scroll-content flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain ${isDarkMode ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`}>
                {lesson.content.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border shadow-sm transition-colors group ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] hover:border-[#C65102]/50' : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#C65102]/50'}`}>
                        <div className="flex justify-between items-center mb-3 gap-3">
                            <span className={`font-bold text-lg group-hover:text-[#C65102] transition-colors ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{item.tool}</span>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg font-khmer border whitespace-nowrap ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6] border-[#2C2C2C]' : 'bg-[#FAFAFA] text-[#5F6368] border-[#E0E0E0]'}`}>{item.khmer}</span>
                        </div>
                        <p className={`text-base font-khmer leading-relaxed ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{item.desc}</p>
                        {item.tip && <div className={`mt-4 pt-4 border-t flex items-start space-x-3 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><span className="text-lg">💡</span><p className={`text-sm font-khmer font-medium leading-relaxed ${isDarkMode ? 'text-yellow-500/90' : 'text-[#C65102]'}`}>{item.tip}</p></div>}
                    </div>
                ))}
             </div>
          </div>
      </div>
  )
};

const LessonCard = ({ lesson, onClick, isDarkMode }) => (
    <button onClick={onClick} className={`rounded-3xl overflow-hidden border transition-all duration-500 ease-spring hover:scale-[1.02] active:scale-95 cursor-pointer w-full text-left relative shadow-lg hover:shadow-2xl group ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] hover:shadow-[#121212]/50' : 'bg-[#FFFFFF] border-[#E0E0E0] hover:shadow-[#1A1C1E]/10'}`}>
      <div className="p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center shadow-inner border group-hover:bg-[#C65102]/10 group-hover:text-[#C65102] transition-colors ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C] text-[#9AA0A6]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#5F6368]'}`}>
                {lesson.icon}
            </div>
            <div>
                <h3 className={`font-bold text-lg font-khmer group-hover:text-[#C65102] transition-colors tracking-tight mb-0.5 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{lesson.title}</h3>
                <p className={`text-xs font-khmer line-clamp-1 leading-relaxed ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{lesson.description}</p>
            </div>
        </div>
        <div className={`p-2.5 rounded-full group-hover:bg-gradient-to-r group-hover:from-[#C65102] group-hover:to-[#E86A10] group-hover:text-[#FFFFFF] transition-all transform group-hover:translate-x-1 flex-shrink-0 ml-4 ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6]' : 'bg-[#FAFAFA] text-[#5F6368]'}`}><ChevronRight className="w-4 h-4" /></div>
      </div>
    </button>
);

const TipsSection = ({ isExpanded, onToggle, isDarkMode }) => {
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
      <button onClick={onToggle} className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all group active:scale-95 shadow-sm ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] hover:bg-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0] hover:bg-[#FAFAFA]'}`}>
        <div className="flex items-center space-x-5">
            <div className="bg-[#C65102]/10 p-3 rounded-2xl group-hover:bg-[#C65102]/20 transition-colors ring-1 ring-[#C65102]/20"><PlayCircle className="w-6 h-6 text-[#C65102]" /></div>
            <h3 className={`font-bold text-xl font-khmer tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>គន្លឹះបន្ថែម (Tips)</h3>
        </div>
        <ChevronRight className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
      </button>
      {isExpanded && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          <div className={`bg-gradient-to-br border rounded-3xl p-8 md:col-span-2 relative overflow-hidden shadow-xl flex flex-col justify-center min-h-[180px] ${isDarkMode ? 'from-[#2C2C2C] to-[#1E1E1E] border-[#2C2C2C]' : 'from-[#FFFFFF] to-[#FAFAFA] border-[#E0E0E0]'}`}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#C65102]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="flex justify-between items-center mb-6 relative z-10">
                 <h4 className={`font-bold font-khmer flex items-center gap-3 text-lg whitespace-nowrap ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>
                    <Sparkles className="w-5 h-5 text-yellow-500" /> គន្លឹះពិសេស (Pro Tip)
                 </h4>
                 <button onClick={nextTip} className={`text-[10px] px-4 py-2 rounded-full font-khmer transition-all font-bold tracking-wide border active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-[#E3E3E3]/10 hover:bg-[#E3E3E3]/20 text-[#E3E3E3] border-[#E3E3E3]/5' : 'bg-[#1A1C1E]/5 hover:bg-[#1A1C1E]/10 text-[#1A1C1E] border-[#1A1C1E]/5'}`}>គន្លឹះថ្មី</button>
             </div>
             <div className="relative z-10 flex-1 flex items-center">
                 <p key={tipIndex} className={`text-base font-khmer leading-relaxed border-l-4 border-[#C65102] pl-6 py-2 animate-fade-in-up ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{TIPS_LIST[tipIndex]}</p>
             </div>
          </div>
          <div className={`border rounded-3xl p-8 md:col-span-2 shadow-lg ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
            <h4 className={`font-bold font-khmer mb-6 flex items-center text-lg ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}><Zap className="w-5 h-5 mr-3 text-yellow-500" /> គន្លឹះប្រើកម្មវិធី (Shortcut Tricks)</h4>
            <ul className={`space-y-4 text-sm font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              <li className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#2C2C2C]/50 border-[#2C2C2C] hover:bg-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0] hover:bg-[#E0E0E0]/50'}`}>
                <span className="font-bold text-[#C65102] bg-[#C65102]/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">1</span>
                <span><span className={`font-bold block mb-1 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>មើលរូបដើម (Before/After)៖</span> ចុចសង្កត់លើរូបភាពដើម្បីមើលរូបដើម (Before) ហើយដកដៃចេញដើម្បីមើលរូបដែលកែរួច (After)។</span>
              </li>
              <li className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#2C2C2C]/50 border-[#2C2C2C] hover:bg-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0] hover:bg-[#E0E0E0]/50'}`}>
                <span className="font-bold text-[#C65102] bg-[#C65102]/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">2</span>
                <span><span className={`font-bold block mb-1 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>Reset តម្លៃ Slider៖</span> ចុចពីរដងលើរង្វង់មូលនៃ Slider ណាមួយ ដើម្បីត្រឡប់តម្លៃនោះទៅ 0 វិញភ្លាមៗ។</span>
              </li>
              <li className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#2C2C2C]/50 border-[#2C2C2C] hover:bg-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0] hover:bg-[#E0E0E0]/50'}`}>
                <span className="font-bold text-[#C65102] bg-[#C65102]/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">3</span>
                <span><span className={`font-bold block mb-1 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>មើល Clipping (J Mode)៖</span> ពេលកំពុងអូស Slider (Whites/Blacks/Exposure) យកម្រាមដៃមួយទៀតចុចលើអេក្រង់ ដើម្បីមើលកន្លែងដែលដាច់ព័ត៌មាន។</span>
              </li>
              <li className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#2C2C2C]/50 border-[#2C2C2C] hover:bg-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0] hover:bg-[#E0E0E0]/50'}`}>
                <span className="font-bold text-[#C65102] bg-[#C65102]/10 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">4</span>
                <span><span className={`font-bold block mb-1 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>Copy/Paste ពណ៌៖</span> ចុចលើសញ្ញា (...) ជ្រុងលើស្តាំ {'>'} "Copy Settings" រួចបើករូបថ្មីចុច (...) {'>'} "Paste Settings" ដើម្បីចម្លងការកែទាំងអស់។</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactSection = ({ isDarkMode }) => (
  <div className={`mt-16 mb-10 border-t pt-10 text-center ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}>
      <div className="flex justify-center gap-10">
          <a href="https://web.facebook.com/mydesignpro" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}><Facebook className="text-[#C65102] w-5 h-5" /></div>
              <span className={`text-[10px] font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Facebook</span>
          </a>
          <a href="https://t.me/koymy" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}><Send className="text-[#E86A10] w-5 h-5" /></div>
              <span className={`text-[10px] font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Telegram</span>
          </a>
          <a href="https://myaffinity.gumroad.com" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
                <div className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}><Globe className="text-[#E86A10] w-5 h-5" /></div>
              <span className={`text-[10px] font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Website</span>
          </a>
      </div>
      <p className={`text-center text-[10px] mt-8 font-khmer uppercase opacity-50 tracking-widest ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>© 2026 My Design. Crafted with Passion.</p>
  </div>
);

const PhotoLab = ({ isDarkMode }) => {
  const [image, setImage] = useState("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80");
  const [imageName, setImageName] = useState("Portrait");
  const [mode, setMode] = useState('manual');
  const fileInputRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [gradingTab, setGradingTab] = useState('Shadows');
  const [gradingSync, setGradingSync] = useState(false);
  const defaultSettings = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0, redHue: 0, redSat: 0, redLum: 0, orangeHue: 0, orangeSat: 0, orangeLum: 0, yellowHue: 0, yellowSat: 0, yellowLum: 0, greenHue: 0, greenSat: 0, greenLum: 0, aquaHue: 0, aquaSat: 0, aquaLum: 0, blueHue: 0, blueSat: 0, blueLum: 0, purpleHue: 0, purpleSat: 0, purpleLum: 0, magentaHue: 0, magentaSat: 0, magentaLum: 0, shadowHue: 0, shadowSat: 0, shadowLum: 0, midHue: 0, midSat: 0, midLum: 0, highlightHue: 0, highlightSat: 0, highlightLum: 0, gradingBlending: 50, gradingBalance: 0 };
  const [settings, setSettings] = useState(defaultSettings);
  const [activeColor, setActiveColor] = useState('Orange'); 
  const [filteredPresets, setFilteredPresets] = useState([]);
  const [suggestedMoods, setSuggestedMoods] = useState([]);
  
  useEffect(() => {
      if (mode !== 'preset') return;
      const query = aiPrompt.toLowerCase().trim();
      const allPresets = Object.values(BASE_PRESETS_DATA);
      if (!query) {
        setFilteredPresets(allPresets.filter(p => p.id.endsWith('_1'))); 
        setSuggestedMoods([]);
        return;
      }
      const khmerMap = {
        'ក្រហម': 'red', 'ខៀវ': 'blue', 'បៃតង': 'green', 'លឿង': 'yellow', 'ទឹកក្រូច': 'orange', 
        'ស្វាយ': 'purple', 'ផ្កាឈូក': 'pink', 'ស': 'white', 'ខ្មៅ': 'black', 'សោកសៅ': 'moody', 
        'ស្រស់': 'fresh', 'ភ្លឺ': 'bright', 'ងងឹត': 'dark', 'អាហារ': 'food', 'យប់': 'night', 
        'ថ្ងៃលិច': 'sunset', 'ធម្មជាតិ': 'nature', 'បុរាណ': 'vintage', 'ហ្វីល': 'film', 
        'រោងការ': 'wedding', 'ការងារ': 'wedding', 'ទេសភាព': 'landscape', 'ផ្លូវ': 'street', 
        'ភាពយន្ត': 'cinematic', 'សមុទ្រ': 'teal', 'មេឃ': 'blue', 'ព្រៃ': 'forest'
      };
      let searchTerms = [query];
      Object.keys(khmerMap).forEach(k => { if (query.includes(k)) searchTerms.push(khmerMap[k]); });
      const exactMatches = allPresets.filter(p => searchTerms.some(term => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term)));
      const matchedMoods = PRESET_MOODS.filter(m => (m.keywords && m.keywords.some(k => searchTerms.some(term => term.includes(k) || k.includes(term)))) || searchTerms.some(term => m.name.toLowerCase().includes(term)));
      let relatedPresets = [];
      if (matchedMoods.length > 0) {
          matchedMoods.forEach(mood => {
              let searchKey = "";
              if (mood.id.startsWith('color_')) searchKey = mood.id.replace('color_', '');
              else if (mood.id.startsWith('feeling_')) searchKey = mood.id.replace('feeling_', '');
              else if (mood.id.startsWith('time_')) searchKey = mood.id.replace('time_', '');
              else if (mood.id.startsWith('subject_')) searchKey = mood.id.replace('subject_', '');
              else searchKey = mood.id;
              const moodRelated = allPresets.filter(p => p.id.includes(searchKey) || p.name.toLowerCase().includes(searchKey));
              relatedPresets = [...relatedPresets, ...moodRelated];
          });
      }
      const combined = [...new Set([...exactMatches, ...relatedPresets])];
      setFilteredPresets(combined);
      setSuggestedMoods(matchedMoods);
  }, [aiPrompt, mode]);

  const updateSetting = (key, value) => setSettings(prev => ({...prev, [key]: value}));
  const resetSettings = () => setSettings(defaultSettings);
  
  const handleImageUpload = (e) => { 
      const file = e.target.files[0]; 
      if (file) {
          setImage(URL.createObjectURL(file));
          const lastDot = file.name.lastIndexOf('.');
          setImageName(lastDot !== -1 ? file.name.substring(0, lastDot) : file.name);
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
          // Extract purely CSS portion of filter for canvas (ignores SVG filter part due to canvas limits)
          const cssOnlyFilter = getFilterString().replace(/url\([^)]+\)\s*/, '');
          ctx.filter = cssOnlyFilter; 
          ctx.drawImage(img, 0, 0); 
          const link = document.createElement('a'); 
          link.download = `${imageName}_MD.jpg`; 
          link.href = canvas.toDataURL('image/jpeg', 1.0); 
          link.click(); 
      }; 
  };
  
  const handlePresetExport = () => { 
      const recipe = { basic: { Exposure: settings.exposure, Contrast: settings.contrast, Highlights: settings.highlights, Shadows: settings.shadows, Whites: settings.whites, Blacks: settings.blacks, Temp: settings.temp, Tint: settings.tint, Vibrance: settings.vibrance, Saturation: settings.saturation, Texture: settings.texture, Clarity: settings.clarity, Dehaze: settings.dehaze, Vignette: settings.vignette }, detail: { Sharpening: 40, Noise: 0, ColorNoise: 25 }, colorMix: [ { color: 'Red', h: settings.redHue, s: settings.redSat, l: settings.redLum }, { color: 'Orange', h: settings.orangeHue, s: settings.orangeSat, l: settings.orangeLum }, { color: 'Yellow', h: settings.yellowHue, s: settings.yellowSat, l: settings.yellowLum }, { color: 'Green', h: settings.greenHue, s: settings.greenSat, l: settings.greenLum }, { color: 'Aqua', h: settings.aquaHue, s: settings.aquaSat, l: settings.aquaLum }, { color: 'Blue', h: settings.blueHue, s: settings.blueSat, l: settings.blueLum }, { color: 'Purple', h: settings.purpleHue, s: settings.purpleSat, l: settings.purpleLum }, { color: 'Magenta', h: settings.magentaHue, s: settings.magentaSat, l: settings.magentaLum } ], grading: { Shadows: { h: settings.shadowHue, s: settings.shadowSat, l: settings.shadowLum }, Midtones: { h: settings.midHue, s: settings.midSat, l: settings.midLum }, Highlights: { h: settings.highlightHue, s: settings.highlightSat, l: settings.highlightLum }, Blending: settings.gradingBlending, Balance: settings.gradingBalance } }; 
      const presetName = aiPrompt.trim() ? aiPrompt.trim() : "Custom_Preset";
      generateXMP(recipe, `${presetName}_MD`); 
  };
  
  const applyPresetToSettings = (presetData) => { const b = presetData.basic; const newSettings = { ...defaultSettings }; if (b) { if (b.Exposure) newSettings.exposure = b.Exposure * 10; if (b.Contrast) newSettings.contrast = b.Contrast; if (b.Highlights) newSettings.highlights = b.Highlights; if (b.Shadows) newSettings.shadows = b.Shadows; if (b.Whites) newSettings.whites = b.Whites; if (b.Blacks) newSettings.blacks = b.Blacks; if (b.Temp) newSettings.temp = b.Temp; if (b.Tint) newSettings.tint = b.Tint; if (b.Vibrance) newSettings.vibrance = b.Vibrance; if (b.Saturation) newSettings.saturation = b.Saturation; if (b.Clarity) newSettings.clarity = b.Clarity; if (b.Dehaze) newSettings.dehaze = b.Dehaze; if (b.Vignette) newSettings.vignette = b.Vignette; } if (presetData.grading) { if (presetData.grading.Shadows) { newSettings.shadowHue = presetData.grading.Shadows.h || 0; newSettings.shadowSat = presetData.grading.Shadows.s || 0; } if (presetData.grading.Highlights) { newSettings.highlightHue = presetData.grading.Highlights.h || 0; newSettings.highlightSat = presetData.grading.Highlights.s || 0; } } setSettings(newSettings); };
  const resetGroup = (items) => { const newSettings = { ...settings }; items.forEach(item => { newSettings[item.id] = 0; }); setSettings(newSettings); };
  
  // Real implementation for controlling light and color safely without breaking presets
  const getFilterString = () => {
      // Base adjustments
      const exp = 100 + (settings.exposure * 10) - (settings.dehaze > 0 ? settings.dehaze * 0.1 : 0);
      const con = 100 + settings.contrast + (settings.clarity * 0.1) + (settings.dehaze * 0.2);
      const sat = 100 + settings.saturation + (settings.vibrance * 0.4);
      
      // Removed broken sepia/hue-rotate hack. Now uses SVG feColorMatrix for pure Temp/Tint blending!
      return `brightness(${exp}%) contrast(${con}%) saturate(${sat}%) url(#lr-adjustments)`;
  };

  // Safe SVG mapping to mimic Lightroom tone curves without extreme color inversions
  const getTonalTable = () => {
      const b = settings.blacks / 400;     // -0.25 to 0.25
      const s = settings.shadows / 400;    
      const h = settings.highlights / 400; 
      const w = settings.whites / 400;

      const v0 = Math.max(0, Math.min(1, 0 + b));
      const v1 = Math.max(0, Math.min(1, 0.25 + s + (b * 0.2)));
      const v2 = 0.5; // Anchor midtones firmly
      const v3 = Math.max(0, Math.min(1, 0.75 + h + (w * 0.2)));
      const v4 = Math.max(0, Math.min(1, 1 + w));

      return `${v0} ${v1} ${v2} ${v3} ${v4}`;
  };

  // SVG matrix for clean Temperature and Tint manipulation
  const getColorMatrix = () => {
      const temp = settings.temp / 100;
      const tint = settings.tint / 100;
      
      const r = 1 + (temp * 0.2) + (tint * 0.1);
      const g = 1 - (Math.abs(temp) * 0.05) - (tint * 0.15);
      const b = 1 - (temp * 0.2) + (tint * 0.1);
      
      return `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  };
  
  const getVignetteStyle = () => { const v = settings.vignette; return v < 0 ? { background: `radial-gradient(circle, transparent ${60 + (v * 0.4)}%, rgba(0,0,0,${Math.abs(v)/100}))` } : { background: `radial-gradient(circle, transparent ${60 - (v * 0.4)}%, rgba(255,255,255,${v/100}))` }; };
  const updateGrading = (tone, hue, sat) => { let targetHueKey = tone === 'Shadows' ? 'shadowHue' : tone === 'Midtones' ? 'midHue' : 'highlightHue'; let targetSatKey = tone === 'Shadows' ? 'shadowSat' : tone === 'Midtones' ? 'midSat' : 'highlightSat'; const newSettings = { ...settings }; newSettings[targetHueKey] = hue; newSettings[targetSatKey] = sat; if (gradingSync && (tone === 'Shadows' || tone === 'Highlights')) { const otherTone = tone === 'Shadows' ? 'Highlights' : 'Shadows'; const otherHueKey = otherTone === 'Shadows' ? 'shadowHue' : 'highlightHue'; const otherSatKey = otherTone === 'Shadows' ? 'shadowSat' : 'highlightSat'; newSettings[otherHueKey] = (hue + 180) % 360; newSettings[otherSatKey] = sat; } setSettings(newSettings); };

  useEffect(() => { 
    const style = document.createElement('style'); 
    style.innerHTML = `
    .grad-hue::-webkit-slider-runnable-track { background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red) !important; } 
    .grad-sat::-webkit-slider-runnable-track { background: linear-gradient(to right, ${isDarkMode ? '#2C2C2C, #E3E3E3' : '#5F6368, #E0E0E0'}) !important; } 
    .grad-lum::-webkit-slider-runnable-track { background: linear-gradient(to right, ${isDarkMode ? '#121212, #E3E3E3' : '#1A1C1E, #FFFFFF'}) !important; } 
    .grad-temp::-webkit-slider-runnable-track { background: linear-gradient(to right, #3B82F6, #9CA3AF, #F59E0B) !important; }
    .grad-tint::-webkit-slider-runnable-track { background: linear-gradient(to right, #10B981, #9CA3AF, #EC4899) !important; }
    
    input[type=range] { -webkit-appearance: none; background: transparent; pointer-events: none; } 
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: ${isDarkMode ? '#E3E3E3' : '#FFFFFF'}; border: 1px solid ${isDarkMode ? '#2C2C2C' : '#E0E0E0'}; box-shadow: 0 2px 5px rgba(0,0,0,0.2); margin-top: -7px; cursor: grab; pointer-events: auto; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); } 
    input[type=range]::-webkit-slider-thumb:active { transform: scale(1.3); cursor: grabbing; } 
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: ${isDarkMode ? '#2C2C2C' : '#E0E0E0'}; border-radius: 10px; } 
    `; 
    document.head.appendChild(style); 
    return () => document.head.removeChild(style); 
  }, [isDarkMode]);

  const toolsGroups = [ { group: 'Light', icon: <Sun size={18}/>, items: [{ id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.1 }, { id: 'contrast', label: 'Contrast', min: -100, max: 100 }, { id: 'highlights', label: 'Highlights', min: -100, max: 100 }, { id: 'shadows', label: 'Shadows', min: -100, max: 100 }, { id: 'whites', label: 'Whites', min: -100, max: 100 }, { id: 'blacks', label: 'Blacks', min: -100, max: 100 }] }, { group: 'Color', icon: <Palette size={18}/>, items: [{ id: 'temp', label: 'Temp', min: -100, max: 100 }, { id: 'tint', label: 'Tint', min: -100, max: 100 }, { id: 'vibrance', label: 'Vibrance', min: -100, max: 100 }, { id: 'saturation', label: 'Saturation', min: -100, max: 100 }] }, { group: 'Effects', icon: <Aperture size={18}/>, items: [{ id: 'texture', label: 'Texture', min: -100, max: 100 }, { id: 'clarity', label: 'Clarity', min: -100, max: 100 }, { id: 'dehaze', label: 'Dehaze', min: -100, max: 100 }, { id: 'vignette', label: 'Vignette', min: -100, max: 100 }] } ];
  
  // High saturation color selection for visually impaired / color blind users
  const colors = [ 
      { name: 'Red', id: 'red', hex: '#FF0000' }, 
      { name: 'Orange', id: 'orange', hex: '#FF6600' }, 
      { name: 'Yellow', id: 'yellow', hex: '#FFCC00' }, 
      { name: 'Green', id: 'green', hex: '#00FF00' }, 
      { name: 'Aqua', id: 'aqua', hex: '#00FFFF' }, 
      { name: 'Blue', id: 'blue', hex: '#0000FF' }, 
      { name: 'Purple', id: 'purple', hex: '#9900FF' }, 
      { name: 'Magenta', id: 'magenta', hex: '#FF00FF' } 
  ];
  
  const sampleImages = [ { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80", label: "Portrait" }, { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80", label: "Golden Hour" }, { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80", label: "Night" }, { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", label: "Nature" }, { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80", label: "Food" } ];

  return (
    <div className={`rounded-3xl border flex flex-col h-full max-w-7xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6 relative z-0 ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 h-full overflow-hidden relative">
            <div className={`h-[50%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-4 shrink-0 px-2 pb-2 pt-2 lg:p-0 ${isDarkMode ? 'bg-[#121212]/40 lg:bg-transparent' : 'bg-[#FFFFFF]/40 lg:bg-transparent'}`}>
                <div className={`flex-1 rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center relative border group ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl' : 'bg-[#FFFFFF] border-[#E0E0E0] shadow-lg'}`}>
                    <div className="relative w-full h-full">
                        {/* Perfect Highlights, Shadows, Temp, Tint recovery using SVG filter map */}
                        <svg width="0" height="0" className="absolute pointer-events-none">
                            <filter id="lr-adjustments">
                                <feColorMatrix type="matrix" values={getColorMatrix()} />
                                <feComponentTransfer>
                                    <feFuncR type="table" tableValues={getTonalTable()} />
                                    <feFuncG type="table" tableValues={getTonalTable()} />
                                    <feFuncB type="table" tableValues={getTonalTable()} />
                                </feComponentTransfer>
                            </filter>
                        </svg>
                        <img src={image} className="w-full h-full object-cover scale-110 transition-all duration-100 ease-linear" style={{ filter: getFilterString() }} />
                        <div className="absolute inset-0 pointer-events-none" style={getVignetteStyle()}></div>
                    </div>
                </div>
                <div className={`flex items-center justify-between gap-2 p-2 rounded-2xl border shrink-0 overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] shadow-lg' : 'bg-[#FFFFFF] border-[#E0E0E0] shadow-sm'}`}>
                    <div className="flex gap-2 shrink-0">
                        {sampleImages.map((item, idx) => (<button key={idx} onClick={() => { setImage(item.src); setImageName(item.label.replace(/\s+/g, '_')); }} className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 ${image === item.src ? 'border-[#C65102] scale-105' : 'border-transparent opacity-60 hover:opacity-100'} overflow-hidden transition-all duration-300 ease-spring relative group shadow-md`} title={item.label}><img src={item.src} className="w-full h-full object-cover" /></button>))}
                    </div>
                    <div className={`w-px h-8 mx-1 shrink-0 ${isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#E0E0E0]'}`}></div>
                    <div className="flex gap-2 shrink-0">
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current.click()} className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#2C2C2C]/80 border-[#2C2C2C] text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] border-[#E0E0E0] text-[#1A1C1E]'}`} title="Upload"><Upload size={16} /></button>
                        <button onClick={handleDownload} className={`w-10 h-10 flex items-center justify-center text-[#FFFFFF] rounded-xl transition-all shadow-lg shadow-[#C65102]/30 active:scale-95 ${isDarkMode ? 'bg-gradient-to-r from-[#C65102]/90 to-[#E86A10]/90 hover:from-[#A84502] hover:to-[#C65102]' : 'bg-gradient-to-r from-[#C65102] to-[#E86A10] hover:from-[#A84502] hover:to-[#C65102]'}`} title="Download"><ImageDown size={16} /></button>
                        <button onClick={handlePresetExport} className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#2C2C2C]/80 border-[#2C2C2C] text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] border-[#E0E0E0] text-[#1A1C1E]'}`} title="Export XMP"><FileJson size={16} /></button>
                    </div>
                </div>
            </div>
            <div className={`flex-1 lg:w-96 xl:w-[400px] lg:flex-none flex flex-col h-full rounded-t-3xl lg:rounded-3xl border overflow-hidden relative z-10 ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl' : 'bg-[#FFFFFF] border-[#E0E0E0] shadow-xl'}`}>
                 <div className={`w-full h-14 border-b flex items-center px-2 gap-2 shrink-0 z-20 ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                    <div className={`flex-1 flex p-1 rounded-xl ${isDarkMode ? 'bg-[#121212]' : 'bg-[#E0E0E0]/50'}`}>
                        <button onClick={() => setMode('manual')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-khmer uppercase tracking-wider transition-all duration-200 ${mode === 'manual' ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>កែដោយដៃ</button>
                        <button onClick={() => setMode('preset')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-khmer uppercase tracking-wider transition-all duration-200 ${mode === 'preset' ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>Preset</button>
                    </div>
                    <button onClick={resetSettings} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'text-[#9AA0A6] hover:text-red-400 hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-red-500 hover:bg-[#E0E0E0]'}`} title="Reset All"><RotateCcw size={16}/></button>
                 </div>
                 <div className={`flex-1 flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-[#FFFFFF]'}`}>
                    {mode === 'manual' ? (
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-6 pb-24 lg:pb-10 pt-2">
                             {toolsGroups.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-4">
                                    <div className={`flex items-center justify-between pb-0 border-b ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-2 tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{group.icon} {group.group}</h4><button onClick={() => resetGroup(group.items)} className={`text-[10px] transition-colors font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#FF8C33] hover:text-[#C65102]' : 'text-[#C65102] hover:text-[#A84502]'}`}>Reset</button></div>
                                    <div className="space-y-4">
                                        {group.items.map(t => (
                                            <div key={t.id} className="group/item">
                                                <div className="flex justify-between mb-3 items-center">
                                                    <label className={`text-xs font-bold font-khmer cursor-pointer transition-colors ${isDarkMode ? 'text-[#E3E3E3] hover:text-[#C65102]/90' : 'text-[#1A1C1E] hover:text-[#C65102]'}`} onDoubleClick={() => updateSetting(t.id, 0)}>{t.label}</label>
                                                    <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>{settings[t.id].toFixed(t.step < 1 ? 1 : 0)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => updateSetting(t.id, settings[t.id] - (t.step || 1))} className={`transition-colors active:scale-90 ${isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]'}`}><Minus size={14}/></button>
                                                    <input 
                                                        type="range" min={t.min} max={t.max} step={t.step || 1} 
                                                        value={settings[t.id]} 
                                                        onChange={(e) => updateSetting(t.id, Number(e.target.value))} 
                                                        className={`flex-1 ${t.id === 'temp' ? 'grad-temp' : ''} ${t.id === 'tint' ? 'grad-tint' : ''}`} 
                                                    />
                                                    <button onClick={() => updateSetting(t.id, settings[t.id] + (t.step || 1))} className={`transition-colors active:scale-90 ${isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]'}`}><Plus size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="space-y-4"><div className={`flex items-center justify-between pb-0 border-b ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-2 tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}><Palette size={16}/> Color Mix</h4></div><div className="flex justify-between gap-3 mb-4 px-1">{colors.map(c => (<button key={c.id} onClick={() => setActiveColor(c.name)} style={{ backgroundColor: c.hex }} className={`w-8 h-8 rounded-full border-2 ${activeColor === c.name ? (isDarkMode ? 'border-[#E3E3E3] scale-110 shadow-lg ring-2 ring-[#2C2C2C]' : 'border-[#1A1C1E] scale-110 shadow-lg ring-2 ring-[#E0E0E0]') : 'border-transparent opacity-80 hover:opacity-100'} transition-all duration-300 ease-spring`} />))}</div><div className="space-y-4 px-2">{['Hue', 'Sat', 'Lum'].map((type) => { const key = `${activeColor.toLowerCase()}${type}`; return (<div key={key} className="flex items-center gap-3"><label className={`text-[10px] font-bold font-khmer w-8 uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{type}</label><input type="range" min="-100" max="100" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer ${type === 'Hue' ? 'grad-hue' : type === 'Sat' ? 'grad-sat' : 'grad-lum'}`} /><input type="number" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className={`w-10 bg-transparent text-xs font-bold text-right outline-none ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`} /></div>)})}</div></div>
                            <div className="space-y-4 pb-4"><div className={`flex items-center justify-between pb-0 border-b ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-2 tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}><TrendingUp size={16}/> Grading</h4><button onClick={() => setGradingSync(!gradingSync)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${gradingSync ? 'bg-[#C65102]/10 border-[#C65102]/30 text-[#C65102]' : (isDarkMode ? 'bg-[#2C2C2E] border-[#2C2C2C] text-[#5F6368]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#5F6368]')}`}><span className="text-[9px] font-bold uppercase tracking-wider">{gradingSync ? 'Sync' : 'Normal'}</span><div className={`w-2 h-2 rounded-full ${gradingSync ? 'bg-[#C65102] shadow-[0_0_8px_rgba(198,81,2,0.5)]' : (isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#E0E0E0]')}`}></div></button></div><div className={`flex justify-around mb-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#FAFAFA]'}`}>{['Shadows', 'Midtones', 'Highlights'].map(t => (<button key={t} onClick={() => setGradingTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 ease-spring ${gradingTab === t ? (isDarkMode ? 'bg-[#1E1E1E] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>{t}</button>))}</div><div className="p-1 space-y-4"><div className="flex justify-center py-1"><ColorWheel hue={settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']} sat={settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']} onChange={(h, s) => updateGrading(gradingTab, h, s)} size={160} isDarkMode={isDarkMode} /></div><div className={`rounded-2xl p-3 border space-y-3 ${isDarkMode ? 'bg-[#2C2C2C]/50 border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}><div className="flex justify-between items-center px-1"><div className="flex flex-col"><span className="text-[9px] text-[#5F6368] uppercase tracking-wider font-bold">Selected</span><span className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}><div className="w-2 h-2 rounded-full" style={{backgroundColor: `hsl(${settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']}, ${settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']}%, 50%)`}}></div>{getColorName(settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'], settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])}</span></div><div className="flex flex-col items-end"><span className="text-[9px] text-[#5F6368] uppercase tracking-wider font-bold">Complementary</span><span className={`text-xs font-bold flex items-center gap-1.5 flex-row-reverse ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}><div className="w-2 h-2 rounded-full" style={{backgroundColor: `hsl(${(settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'] + 180) % 360}, 60%, 50%)`}}></div>{getColorName((settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'] + 180) % 360)}</span></div></div><div className="space-y-1"><div className="flex justify-between"><label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Hue</label></div><div className="flex items-center gap-3"><input type="range" min="0" max="360" value={settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue']} onChange={(e) => updateGrading(gradingTab, Number(e.target.value), settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer grad-hue flex-1" /><input type="number" value={Math.round(settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'])} onChange={(e) => updateGrading(gradingTab, Number(e.target.value), settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])} className={`w-10 bg-transparent text-xs font-bold text-right outline-none ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}/></div></div><div className="space-y-1"><div className="flex justify-between"><label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Saturation</label></div><div className="flex items-center gap-3"><input type="range" min="0" max="100" value={settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat']} onChange={(e) => updateGrading(gradingTab, settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'], Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer grad-sat flex-1" /><input type="number" value={Math.round(settings[gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : 'highlightSat'])} onChange={(e) => updateGrading(gradingTab, settings[gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : 'highlightHue'], Number(e.target.value))} className={`w-10 bg-transparent text-xs font-bold text-right outline-none ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}/></div></div><div className="space-y-1"><div className="flex justify-between"><label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Luminance</label></div><div className="flex items-center gap-3"><input type="range" min="-100" max="100" value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer grad-lum flex-1" /><input type="number" value={settings[gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum']} onChange={(e) => updateSetting(gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : 'highlightLum', Number(e.target.value))} className={`w-10 bg-transparent text-xs font-bold text-right outline-none ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}/></div></div><div className={`pt-2 border-t space-y-2 px-1 mt-2 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><div className="flex flex-col gap-1.5"><div className="flex justify-between"><label className={`text-[10px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Blending</label><span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>{settings.gradingBlending}</span></div><input type="range" min="0" max="100" value={settings.gradingBlending} onChange={(e) => updateSetting('gradingBlending', Number(e.target.value))} className="w-full"/></div><div className="flex flex-col gap-1.5"><div className="flex justify-between"><label className={`text-[10px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Balance</label><span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>{settings.gradingBalance}</span></div><input type="range" min="-100" max="100" value={settings.gradingBalance} onChange={(e) => updateSetting('gradingBalance', Number(e.target.value))} className="w-full"/></div></div></div></div></div>
                        </div>
                    ) : (
                        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-[#FFFFFF]'}`}>
                            <div className={`p-3 border-b shrink-0 z-10 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}>
                                <div className={`p-1 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                                    <div className="flex gap-2 items-center px-2">
                                        <Search size={16} className="text-[#5F6368]" />
                                        <input 
                                            value={aiPrompt} 
                                            onChange={(e) => setAiPrompt(e.target.value)} 
                                            placeholder="ស្វែងរកតាម ឈ្មោះ, ពណ៌, អារម្មណ៍..." 
                                            className={`flex-1 bg-transparent px-2 py-3 text-sm outline-none font-khmer ${isDarkMode ? 'text-[#E3E3E3] placeholder:text-[#9AA0A6]' : 'text-[#1A1C1E] placeholder:text-[#5F6368]'}`} 
                                            autoComplete="off" 
                                            name="search-preset-unique-id" 
                                        />
                                        {aiPrompt && (<button onClick={() => setAiPrompt('')} className={`p-1 ${isDarkMode ? 'text-[#5F6368] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]'}`}><XCircle size={14} /></button>)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
                                <div className="space-y-6 pb-20">
                                    {!aiPrompt && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1"><h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}><Star size={14} className="text-[#C65102]" /> Top Moods</h4></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {PRESET_MOODS.map(s => (
                                                    <button key={s.id} onClick={() => { const presetToApply = BASE_PRESETS_DATA[s.id]; if (presetToApply) applyPresetToSettings(presetToApply); }} className={`relative h-16 border rounded-2xl flex items-center justify-center overflow-hidden group transition-all duration-300 ease-spring active:scale-95 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#2C2C2C]/80 border-[#2C2C2C]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] border-[#E0E0E0]'}`}>
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${s.color} transition-opacity ${isDarkMode ? 'opacity-20 group-hover:opacity-30' : 'opacity-10 group-hover:opacity-20'}`}></div>
                                                        <span className={`capitalize text-xs font-bold z-10 tracking-wide font-khmer ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1"><h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}><ListIcon size={14} /> {aiPrompt ? 'Results' : 'All Presets'}{filteredPresets.length > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6]' : 'bg-[#E0E0E0] text-[#5F6368]'}`}>{filteredPresets.length}</span>}</h4></div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {filteredPresets.length > 0 ? (
                                                filteredPresets.map((preset, idx) => (
                                                    <button key={preset.id || idx} onClick={() => applyPresetToSettings(preset)} className={`flex items-center justify-between p-3 border rounded-2xl transition-all duration-200 group active:scale-[0.98] text-left ${isDarkMode ? 'bg-[#2C2C2C]/50 hover:bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0]/50 border-[#E0E0E0]'}`}>
                                                        <div className="flex flex-col"><span className={`text-sm font-bold capitalize font-khmer ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{preset.name || preset.id.replace(/_/g, ' ')}</span><span className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{Object.keys(preset.grading || {}).length > 0 ? 'Color Grade' : 'Basic'}</span></div>
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br border flex items-center justify-center group-hover:border-[#C65102]/50 group-hover:shadow-[0_0_10px_rgba(198,81,2,0.3)] transition-all ${isDarkMode ? 'from-[#2C2C2C] to-[#1E1E1E] border-[#2C2C2C]' : 'from-[#FAFAFA] to-[#E0E0E0] border-[#E0E0E0]'}`}><div className={`w-2 h-2 rounded-full opacity-20 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-[#E3E3E3]' : 'bg-[#1A1C1E]'}`}></div></div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 opacity-50"><Filter className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} /><p className={`text-xs font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>រកមិនឃើញ Presets សម្រាប់ "{aiPrompt}" ទេ</p></div>
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

const Quiz = ({ isDarkMode }) => {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState(initialQuestionBank);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizConfig, setQuizConfig] = useState({ level: 'beginner', amount: 10 });
  const startQuiz = () => { let filtered = initialQuestionBank.filter(q => quizConfig.level === 'all' || q.level === quizConfig.level); if (filtered.length < quizConfig.amount) filtered = initialQuestionBank; const shuffled = [...filtered].sort(() => 0.5 - Math.random()); setQuestions(shuffled.slice(0, quizConfig.amount)); setCurrentQuestion(0); setScore(0); setIsAnswered(false); setSelectedOption(null); setGameState('playing'); };

  if (gameState === 'menu') return (
    <div className="flex h-full items-center justify-center p-4">
      <div className={`backdrop-blur-md p-6 sm:p-8 text-center rounded-[32px] border shadow-2xl max-w-lg w-full animate-fade-in-up ${isDarkMode ? 'bg-[#1E1E1E]/80 border-[#2C2C2C]' : 'bg-[#FFFFFF]/80 border-[#E0E0E0]'}`}>
          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ${isDarkMode ? 'bg-[#C65102]/20 ring-[#2C2C2C]' : 'bg-[#C65102]/10 ring-[#E0E0E0]'}`}><Award className="w-12 h-12 text-[#C65102] drop-shadow-sm" /></div>
          <h2 className={`text-3xl font-extrabold font-khmer mb-3 tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>ការធ្វើតេស្ត</h2>
          <div className="space-y-6">
              <div className={`p-1.5 rounded-2xl w-fit mx-auto border flex justify-center gap-3 ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                <button onClick={() => setQuizConfig({...quizConfig, level: 'beginner'})} className={`px-6 py-2.5 rounded-xl font-khmer text-sm font-bold transition-all duration-300 ease-spring ${quizConfig.level==='beginner' ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-md ring-1 ring-[#2C2C2C]' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-md ring-1 ring-[#E0E0E0]') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>មូលដ្ឋាន</button>
                <button onClick={() => setQuizConfig({...quizConfig, level: 'advanced'})} className={`px-6 py-2.5 rounded-xl font-khmer text-sm font-bold transition-all duration-300 ease-spring ${quizConfig.level==='advanced' ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-md ring-1 ring-[#2C2C2C]' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-md ring-1 ring-[#E0E0E0]') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>កម្រិតខ្ពស់</button>
              </div>
              <div className="flex justify-center gap-3 items-center"><span className={`text-xs font-khmer uppercase tracking-widest font-bold ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>ចំនួន</span>{[5, 10, 15, 20].map(num => (<button key={num} onClick={() => setQuizConfig({...quizConfig, amount: num})} className={`w-10 h-10 rounded-2xl font-bold text-xs transition-all duration-300 ease-spring ${quizConfig.amount === num ? 'bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF] shadow-lg shadow-[#C65102]/30 scale-110' : (isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6] border border-[#2C2C2C] hover:bg-[#2C2C2C]/80' : 'bg-[#FFFFFF] text-[#5F6368] border border-[#E0E0E0] hover:bg-[#FAFAFA]')}`}>{num}</button>))}</div>
              <button onClick={startQuiz} className={`w-full py-3.5 rounded-2xl font-bold font-khmer shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 text-sm tracking-wide ${isDarkMode ? 'bg-[#E3E3E3] hover:bg-[#FFFFFF] text-[#1A1C1E]' : 'bg-[#1A1C1E] hover:bg-[#5F6368] text-[#FFFFFF]'}`}>ចាប់ផ្ដើម</button>
          </div>
      </div>
    </div>
  );
  
  if (gameState === 'result') {
      const percentage = Math.round((score / questions.length) * 100);
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className={`p-10 text-center rounded-[32px] border shadow-2xl max-w-lg w-full animate-fade-in-up ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}><div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="80" cy="80" r="64" stroke="currentColor" className={isDarkMode ? "text-[#2C2C2C]" : "text-[#E0E0E0]"} strokeWidth="12" fill="none" /><circle cx="80" cy="80" r="64" stroke={percentage > 70 ? "#34C759" : percentage > 40 ? "#FFD60A" : "#FF453A"} strokeWidth="16" fill="none" strokeDasharray={402} strokeDashoffset={402 - (402 * percentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" /></svg><div className={`absolute text-4xl font-black tracking-tighter ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{percentage}%</div></div><h2 className={`text-2xl font-bold font-khmer mb-2 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{percentage > 80 ? "អស្ចារ្យណាស់!" : "ព្យាយាមទៀត!"}</h2><p className={`font-khmer mb-8 text-sm ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>ពិន្ទុរបស់អ្នក: <span className={`font-bold ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{score}</span> / {questions.length}</p><button onClick={() => setGameState('menu')} className={`px-10 py-3 rounded-2xl font-bold font-khmer transition-all shadow-md w-full text-sm ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#3A3A3C] text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#1A1C1E]'}`}>សាកល្បងម្តងទៀត</button></div>
        </div>
      );
  }

  const q = questions[currentQuestion];
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className={`p-6 sm:p-10 rounded-[32px] border shadow-2xl max-w-3xl w-full animate-fade-in-up ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
        <div className="flex justify-between mb-8 items-center"><span className="text-[10px] font-bold text-[#C65102] bg-[#C65102]/10 px-3 py-1.5 rounded-full ring-1 ring-[#C65102]/20">{currentQuestion + 1} / {questions.length}</span><span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{q.level || 'General'}</span></div>
        <h3 className={`text-xl md:text-2xl font-bold mb-8 font-khmer leading-snug ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{q.question}</h3>
        <div className="grid gap-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => { if (!isAnswered) { setSelectedOption(i); setIsAnswered(true); if (i === q.correct) setScore(score + 1); } }} className={`p-4 text-left rounded-2xl border transition-all duration-300 ease-spring font-khmer text-sm relative overflow-hidden group ${isAnswered ? (i === q.correct ? 'bg-[#34C759]/10 border-[#34C759] text-[#34C759]' : (i === selectedOption ? 'bg-[#FF453A]/10 border-[#FF453A] text-[#FF453A]' : (isDarkMode ? 'bg-[#2C2C2C]/30 border-transparent text-[#9AA0A6] opacity-50' : 'bg-[#FAFAFA]/50 border-transparent text-[#5F6368] opacity-50'))) : (isDarkMode ? 'bg-[#2C2C2C]/50 border-transparent text-[#E3E3E3] hover:bg-[#3A3A3C]' : 'bg-[#FAFAFA] border-transparent text-[#1A1C1E] hover:bg-[#E0E0E0]/50')}`}><span className={`inline-flex w-6 h-6 items-center justify-center rounded-full mr-3 text-[10px] font-bold ${isAnswered && i === q.correct ? 'bg-[#34C759] text-[#FFFFFF]' : (isDarkMode ? 'bg-[#3A3A3C] text-[#9AA0A6] group-hover:bg-[#E3E3E3] group-hover:text-[#121212]' : 'bg-[#E0E0E0] text-[#5F6368] group-hover:bg-[#1A1C1E] group-hover:text-[#FFFFFF]')}`}>{String.fromCharCode(65 + i)}</span>{opt}</button>
          ))}
        </div>
        {isAnswered && (<div className="mt-8 flex justify-end animate-fade-in-up"><button onClick={() => { const next = currentQuestion + 1; if (next < questions.length) { setCurrentQuestion(next); setIsAnswered(false); setSelectedOption(null); } else { setGameState('result'); } }} className={`px-8 py-3 rounded-2xl font-bold font-khmer shadow-xl transition-all flex items-center gap-2 transform hover:translate-x-1 text-sm ${isDarkMode ? 'bg-[#E3E3E3] hover:bg-[#FFFFFF] text-[#1A1C1E]' : 'bg-[#1A1C1E] hover:bg-[#5F6368] text-[#FFFFFF]'}`}>បន្ទាប់ <ChevronRight size={16}/></button></div>)}
      </div>
    </div>
  );
};

const ChatBot = ({ messages, setMessages, isDarkMode }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  
  useEffect(() => {
     const rotate = () => { const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random()); setCurrentSuggestions(shuffled.slice(0, 3)); };
     rotate(); const interval = setInterval(rotate, 15000); return () => clearInterval(interval);
  }, []);

  const handleSend = async (text = null) => {
    const msg = text || input;
    if (!msg.trim()) return; 
    setInput(''); 
    setMessages(prev => [...prev, { role: 'user', text: msg }]); 
    setLoading(true);
    setTimeout(() => {
        const response = findAIResponse(msg);
        setMessages(prev => [...prev, { role: 'model', text: response || "សុំទោសបង! ខ្ញុំមិនទាន់ស្គាល់ពាក្យនេះទេ។ អ្នកអាចសួរខ្ញុំអំពី:\n• ការប្រើប្រាស់ឧបករណ៍ (Exposure, Contrast, Tone Curve...)\n• អត្ថន័យនៃពណ៌ (Color Psychology)\n• ឬឱ្យខ្ញុំណែនាំ Presets ស្អាតៗក៏បានដែរណា៎! 😊" }]);
        setLoading(false);
    }, 800 + Math.random() * 500);
  };
  
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  return (
    <div className={`flex flex-col h-full w-full md:rounded-[32px] overflow-hidden shadow-2xl relative md:border font-khmer transition-colors ${isDarkMode ? 'bg-[#1E1E1E] md:border-[#2C2C2C]' : 'bg-[#FFFFFF] md:border-[#E0E0E0]'}`}>
      <div className={`absolute top-0 left-0 right-0 h-16 backdrop-blur-md border-b flex items-center justify-between px-6 z-10 transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/80 border-[#2C2C2C]' : 'bg-[#FFFFFF]/80 border-[#E0E0E0]'}`}>
          <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full bg-gradient-to-tr flex items-center justify-center shadow-lg ${isDarkMode ? 'from-[#C65102]/90 to-[#E86A10]/90' : 'from-[#C65102] to-[#E86A10]'}`}><Bot size={18} className="text-[#FFFFFF]" /></div><div><h3 className={`text-sm font-bold leading-none ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>AI Assistant</h3><span className={`text-[10px] font-medium ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>Online</span></div></div>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 pt-20 pb-4 space-y-4 no-scrollbar transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`}>
        {messages.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-center opacity-40"><Bot size={48} className="mb-4 text-[#5F6368]" /><p className={`text-sm ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>សួស្តី! មានអ្វីឲ្យខ្ញុំជួយទេ?</p></div>)}
        {messages.map((m, i) => (<div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>{m.role === 'model' && (<div className={`w-6 h-6 rounded-full bg-gradient-to-tr flex items-center justify-center mr-2 shrink-0 mt-auto ${isDarkMode ? 'from-[#C65102]/90 to-[#E86A10]/90' : 'from-[#C65102] to-[#E86A10]'}`}><Bot size={12} className="text-[#FFFFFF]" /></div>)}<div className={`max-w-[80%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm border ${m.role === 'user' ? (isDarkMode ? 'bg-gradient-to-r from-[#C65102]/90 to-[#E86A10]/90 text-[#FFFFFF] rounded-[18px] rounded-br-none border-transparent' : 'bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF] rounded-[18px] rounded-br-none border-transparent') : (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] rounded-[18px] rounded-bl-none border-[#2C2C2C]' : 'bg-[#FFFFFF] text-[#1A1C1E] rounded-[18px] rounded-bl-none border-[#E0E0E0]')}`}>{m.text}</div></div>))}
        {loading && (<div className="flex justify-start items-end"><div className={`w-6 h-6 rounded-full bg-gradient-to-tr flex items-center justify-center mr-2 ${isDarkMode ? 'from-[#C65102]/90 to-[#E86A10]/90' : 'from-[#C65102] to-[#E86A10]'}`}><Bot size={12} className="text-[#FFFFFF]" /></div><div className={`px-4 py-3 rounded-[18px] rounded-bl-none border flex gap-1 ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}><div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`} style={{animationDelay: '0ms'}}></div><div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`} style={{animationDelay: '150ms'}}></div><div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`} style={{animationDelay: '300ms'}}></div></div></div>)}
        <div ref={messagesEndRef} className="h-2" />
      </div>
      <div className={`backdrop-blur-xl border-t pb-safe transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/90 border-[#2C2C2C]' : 'bg-[#FFFFFF]/90 border-[#E0E0E0]'}`}>
         <div className={`flex items-center border-b pl-2 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><button onClick={() => { const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random()); setCurrentSuggestions(shuffled.slice(0, 3)); }} className={`p-2 transition-colors active:scale-90 ${isDarkMode ? 'text-[#FF8C33] hover:text-[#E3E3E3]' : 'text-[#C65102] hover:text-[#E86A10]'}`}><RefreshCw size={14} /></button><div className="flex gap-2 overflow-x-auto pb-3 pt-3 px-2 no-scrollbar">{currentSuggestions.map((q, i) => (<button key={i} onClick={() => handleSend(q)} className={`shrink-0 px-3 py-1.5 text-[11px] rounded-full border active:scale-95 transition-all whitespace-nowrap ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#3A3A3C] text-[#FF8C33] border-[#C65102]/20' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#C65102] border-[#C65102]/20'}`}>{q}</button>))}</div></div>
         <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 flex gap-2 items-end" autoComplete="off">
            <div className={`flex-1 rounded-[24px] border flex items-center px-1 focus-within:border-[#C65102]/50 transition-colors ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                <input type="search" value={input} onChange={e => setInput(e.target.value)} placeholder="សួរសំណួរ..." className={`flex-1 bg-transparent px-3 py-2.5 text-1g outline-none h-full [&::-webkit-search-cancel-button]:hidden ${isDarkMode ? 'text-[#E3E3E3] placeholder:text-[#9AA0A6]' : 'text-[#1A1C1E] placeholder:text-[#5F6368]'}`} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" name="chat_input_unique_field_safe_v2" id="chat_input_unique_field_safe_v2" />
            </div>
            <button type="submit" disabled={!input.trim()} className={`p-2.5 rounded-full transition-all active:scale-90 shadow-lg ${input.trim() ? (isDarkMode ? 'bg-gradient-to-r from-[#C65102]/90 to-[#E86A10]/90 text-[#FFFFFF]' : 'bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF]') : (isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6]' : 'bg-[#E0E0E0] text-[#5F6368]')}`}><Send size={18} /></button>
         </form>
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
  const [chatMessages, setChatMessages] = useState([{ role: 'model', text: 'សួស្ដីបង! 👋 ខ្ញុំជាគ្រូជំនួយ AI ផ្ទាល់ខ្លួនរបស់បង។\n\nតើបងចង់ដឹងពីក្បួនកែរូបអ្វីខ្លះនៅថ្ងៃនេះ? បងអាចសួរខ្ញុំបានពីអត្ថន័យនៃពណ៌ របៀបប្រើប្រាស់មុខងារផ្សេងៗ ឬឱ្យខ្ញុំណែនាំ Preset ស្អាតៗក៏បានដែរណា៎! ធានាថារៀនជាមួយខ្ញុំមិនធុញទេ! 😊✨' }]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) document.head.removeChild(existingMeta);
    document.head.appendChild(meta);
  }, []);

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col font-khmer overflow-hidden touch-pan-x touch-pan-y transition-colors duration-300 ${isDarkMode ? 'bg-[#121212] text-[#E3E3E3]' : 'bg-[#FAFAFA] text-[#1A1C1E]'}`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&display=swap'); body, html { overscroll-behavior: none; } .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }`}</style>
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      {expandedLesson && <LessonModal lesson={lessonsData.find(l => l.id === expandedLesson)} onClose={() => setExpandedLesson(null)} isDarkMode={isDarkMode} />}
      
      <main className={`flex-1 max-w-7xl mx-auto w-full ${activeTab === 'ai' || activeTab === 'lab' ? 'h-full overflow-hidden p-0 md:p-8' : 'overflow-y-auto custom-scrollbar p-4 md:p-8'}`}>
        {activeTab === 'learn' && (
          <div className="space-y-6 pb-24">
            <div className="text-center py-10 mt-6 relative"><div className={`absolute inset-0 blur-[120px] rounded-full pointer-events-none ${isDarkMode ? 'bg-[#C65102]/10' : 'bg-[#C65102]/5'}`} /><h2 className={`text-4xl md:text-6xl font-black mb-6 tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>Lightroom Master</h2><p className={`max-w-xl mx-auto text-sm md:text-base leading-relaxed ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>រៀនពីមូលដ្ឋានគ្រឹះដល់កម្រិតខ្ពស់ នៃការកែរូបភាពកំរិតស្ដង់ដា។</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{lessonsData.map(l => <LessonCard key={l.id} lesson={l} onClick={() => setExpandedLesson(l.id)} isDarkMode={isDarkMode} />)}</div>
            <TipsSection isExpanded={expandedSection === 'tips'} onToggle={() => setExpandedSection(expandedSection === 'tips' ? null : 'tips')} isDarkMode={isDarkMode} />
            <ContactSection isDarkMode={isDarkMode} />
          </div>
        )}
        {activeTab === 'lab' && <PhotoLab isDarkMode={isDarkMode} />}
        {activeTab === 'quiz' && <Quiz isDarkMode={isDarkMode} />}
        {activeTab === 'ai' && <div className="h-full md:h-[650px] max-w-2xl mx-auto w-full relative"><ChatBot messages={chatMessages} setMessages={setChatMessages} isDarkMode={isDarkMode} /></div>}
      </main>

      <nav className={`md:hidden backdrop-blur-xl border-t flex justify-around p-3 pb-safe z-50 transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/90 border-[#2C2C2C]' : 'bg-[#FFFFFF]/90 border-[#E0E0E0]'}`}>
        {['learn', 'quiz', 'lab', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === t ? 'text-[#C65102] scale-110' : (isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]')}`}>{t === 'learn' && <BookOpen size={22}/>}{t === 'quiz' && <Award size={22}/>}{t === 'lab' && <Sliders size={22}/>}{t === 'ai' && <Bot size={22}/>}<span className="text-[10px] font-bold uppercase">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'AI'}</span></button>
        ))}
      </nav>
    </div>
  );
}