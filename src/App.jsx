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
  ThumbsUp, User, Activity
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
    "តើ ISO ជាអ្វី?", "ធ្វើម៉េចទើបថតរូបក្រោយព្រិល (Bokeh)?", "តើ Shutter Speed មាននាទីអ្វី?",
    "របៀបកែរូបតាមអារម្មណ៍សោកសៅ?", "របៀបកែរូបឱ្យមើលទៅសប្បាយរីករាយ?", "តើកែស្បែកមុខឱ្យសម៉ត់យ៉ាងម៉េច?", 
    "របៀបកែរូបបែប Vintage 90s?", "ថតរូបថ្ងៃត្រង់ក្ដៅ គួរកែម៉េច?", "របៀបថតរូបផ្កាយ (Milky Way)?", 
    "តើពណ៌ក្រហមមានអត្ថន័យយ៉ាងណា?", "តើអ្វីទៅជា Aspect Ratio 4:5?", "របៀបកែរូបបែប Cyberpunk?", 
    "តើ Snapshot និង Versions ប្រើធ្វើអ្វី?", "របៀបបង្កើតពណ៌ Teal & Orange?", "តើទ្រឹស្ដីពណ៌ (Color Theory) ជាអ្វី?", 
    "តើអក្សរគួរដាក់កន្លែងណាក្នុងរូប (Typography)?", "តើ AI Denoise ប្រើសម្រាប់ធ្វើអ្វី?", "តើ Clone Stamp និង Healing Brush ខុសគ្នាម៉េច?", 
    "តើ Dehaze ប្រើសម្រាប់ធ្វើអ្វី?", "ណែនាំ Preset សម្រាប់ថត Pre-wedding", "តើគួរ Export រូបទំហំប៉ុន្មានសម្រាប់ IG?", 
    "តើអ្វីទៅជា Rating និង Flag?", "ហេតុអ្វីរូបខ្ញុំថតមកងងឹតមុខ?", "តើធ្វើម៉េចអោយស្លឹកឈើពណ៌បៃតងខ្មៅ?", 
    "តើខ្ញុំអាចផ្តិតរូប (Print) ត្រូវកំណត់ DPI ប៉ុន្មាន?", "តើ Golden Ratio គឺជាអ្វី?", "របៀបលុបជាប់ពណ៌បៃតងលើស្បែក (Color Cast)?",
    "ពន្យល់ពីពន្លឺ Rembrandt Lighting", "តើឯកសារ RAW និង JPEG ខុសគ្នាម៉េច?"
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
    if (!response.ok) throw new Error("Network response was not ok"); // <-- នេះជាចំណុចថ្មី

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    let result = text;
    if (jsonMode && text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(text);
    }
    responseCache[cacheKey] = result;
    return result;
  } catch (error) { throw error; } // <-- បោះកំហុសចេញ
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

const formatCurveForXMP = (pts) => {
    if (!pts || pts.length === 0) return `<rdf:li>0, 0</rdf:li><rdf:li>255, 255</rdf:li>`;
    return pts.map(p => `<rdf:li>${Math.round((p.x/100)*255)}, ${Math.round((p.y/100)*255)}</rdf:li>`).join('');
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
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    crs:Version="14.5" crs:ProcessVersion="11.0"
    crs:Name="${escapeXML(title)}" crs:HasSettings="True" crs:CropConstrainToWarp="0" crs:WhiteBalance="As Shot"
    crs:IncrementalTemperature="${basic.Temp || 0}" crs:IncrementalTint="${basic.Tint || 0}"
    crs:Exposure2012="${basic.Exposure || 0}" crs:Contrast2012="${basic.Contrast || 0}" crs:Highlights2012="${basic.Highlights || 0}" crs:Shadows2012="${basic.Shadows || 0}" crs:Whites2012="${basic.Whites || 0}" crs:Blacks2012="${basic.Blacks || 0}"
    crs:Texture="${basic.Texture || 0}" crs:Clarity2012="${basic.Clarity || 0}" crs:Dehaze="${basic.Dehaze || 0}" crs:Vibrance="${basic.Vibrance || 0}" crs:Saturation="${basic.Saturation || 0}"
    crs:Sharpness="${detail.Sharpening || 40}" crs:SharprenRadius="+1.0" crs:SharpenDetail="25" crs:SharpenEdgeMasking="0"
    crs:LuminanceSmoothing="${detail.Noise || 0}" crs:ColorNoiseReduction="${detail.ColorNoise || 25}"
    crs:HueAdjustmentRed="${getHSL('Red').h}" crs:HueAdjustmentOrange="${getHSL('Orange').h}" crs:HueAdjustmentYellow="${getHSL('Yellow').h}" crs:HueAdjustmentGreen="${getHSL('Green').h}" crs:HueAdjustmentAqua="${getHSL('Aqua').h}" crs:HueAdjustmentBlue="${getHSL('Blue').h}" crs:HueAdjustmentPurple="${getHSL('Purple').h}" crs:HueAdjustmentMagenta="${getHSL('Magenta').h}"
    crs:SaturationAdjustmentRed="${getHSL('Red').s}" crs:SaturationAdjustmentOrange="${getHSL('Orange').s}" crs:SaturationAdjustmentYellow="${getHSL('Yellow').s}" crs:SaturationAdjustmentGreen="${getHSL('Green').s}" crs:SaturationAdjustmentAqua="${getHSL('Aqua').s}" crs:SaturationAdjustmentBlue="${getHSL('Blue').s}" crs:SaturationAdjustmentPurple="${getHSL('Purple').s}" crs:SaturationAdjustmentMagenta="${getHSL('Magenta').s}"
    crs:LuminanceAdjustmentRed="${getHSL('Red').l}" crs:LuminanceAdjustmentOrange="${getHSL('Orange').l}" crs:LuminanceAdjustmentYellow="${getHSL('Yellow').l}" crs:LuminanceAdjustmentGreen="${getHSL('Green').l}" crs:LuminanceAdjustmentAqua="${getHSL('Aqua').l}" crs:LuminanceAdjustmentBlue="${getHSL('Blue').l}" crs:LuminanceAdjustmentPurple="${getHSL('Purple').l}" crs:LuminanceAdjustmentMagenta="${getHSL('Magenta').l}"
    crs:SplitToningShadowHue="${grading.Shadows?.h || 0}" crs:SplitToningShadowSaturation="${grading.Shadows?.s || 0}" crs:SplitToningHighlightHue="${grading.Highlights?.h || 0}" crs:SplitToningHighlightSaturation="${grading.Highlights?.s || 0}" crs:SplitToningBalance="${grading.Balance || 0}"
    crs:ColorGradeMidtoneHue="${grading.Midtones?.h || 0}" crs:ColorGradeMidtoneSat="${grading.Midtones?.s || 0}" crs:ColorGradeMidtoneLum="${grading.Midtones?.l || 0}" crs:ColorGradeShadowLum="${grading.Shadows?.l || 0}" crs:ColorGradeHighlightLum="${grading.Highlights?.l || 0}" crs:ColorGradeBlending="${grading.Blending || 50}" crs:ColorGradeGlobalHue="0" crs:ColorGradeGlobalSat="0" crs:ColorGradeGlobalLum="0"
    crs:GrainAmount="${effects.Grain || 0}" crs:PostCropVignetteAmount="${basic.Vignette || 0}" crs:LensProfileEnable="1">
   <crs:ToneCurvePV2012>
    <rdf:Seq>${formatCurveForXMP(recipe.curveMaster)}</rdf:Seq>
   </crs:ToneCurvePV2012>
   <crs:ToneCurvePV2012Red>
    <rdf:Seq>${formatCurveForXMP(recipe.curveRed)}</rdf:Seq>
   </crs:ToneCurvePV2012Red>
   <crs:ToneCurvePV2012Green>
    <rdf:Seq>${formatCurveForXMP(recipe.curveGreen)}</rdf:Seq>
   </crs:ToneCurvePV2012Green>
   <crs:ToneCurvePV2012Blue>
    <rdf:Seq>${formatCurveForXMP(recipe.curveBlue)}</rdf:Seq>
   </crs:ToneCurvePV2012Blue>
   <dc:rights>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">© 2026 My Design. Crafted with Passion. Email: koymy.mlk@gmail.com</rdf:li>
    </rdf:Alt>
   </dc:rights>
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

const KNOWLEDGE_BASE = [
    { keys: ['ឈ្មោះអី', 'ឈ្មោះអ្វី', 'name', 'who are you', 'នរណាគេ', 'ជានរណា'], answer: "សួស្ដីបង! ខ្ញុំគឺជា 'My Design AI' 🤖 ជាជំនួយការឆ្លាតវៃដែលត្រូវបានបង្កើតឡើងដើម្បីជួយបងក្នុងវិស័យថតរូប និងកែរូបភាព។ បងអាចហៅខ្ញុំថា 'ប្រូ AI' ក៏បានដែរណា៎! ចង់ឱ្យខ្ញុំជួយអីប្រាប់មកបង!" },
    { keys: ['អ្នកណាបង្កើត', 'creator', 'who created', 'បង្កើតឯង', 'អ្នកបង្កើត'], answer: "ខ្ញុំត្រូវបានបង្កើត និងបង្វឹកដោយ 'My Design' ផ្ទាល់តែម្ដង! គោលបំណងរបស់ខ្ញុំគឺជួយសម្រួលការងារកែរូបភាពរបស់បងឱ្យកាន់តែងាយស្រួល លឿន និងប្រកបដោយភាពច្នៃប្រឌិត។ 🚀" },
    { keys: ['អរុណសួស្តី', 'good morning', 'morning', 'ព្រឹកសួស្តី'], answer: "អរុណសួស្ដីបង! 🌅 ព្រឹកនេះអាកាសធាតុល្អណាស់ សាកសមនឹងការកាន់កាមេរ៉ាចេញទៅថតរូបក្រៅណាស់។ ញ៉ាំកាហ្វេហើយឬនៅបង? ☕ តើមានរូបភាពណាត្រូវកែប្រាប់ខ្ញុំមក!" },
    { keys: ['ទិវាសួស្តី', 'good afternoon', 'afternoon', 'ថ្ងៃត្រង់'], answer: "ទិវាសួស្ដីបង! ☀️ ថ្ងៃត្រង់ក្ដៅអញ្ចឹង កុំភ្លេចញ៉ាំទឹកអោយបានច្រើនណា៎។ បើថតរូបពេលនេះប្រយ័ត្នស្រមោលមុខឡើងខ្មៅខ្លាំង! មានអីអោយខ្ញុំជួយប្រាប់បានបង!" },
    { keys: ['សាយ័ន្តសួស្តី', 'good evening', 'ល្ងាច'], answer: "សាយ័ន្តសួស្ដីបង! 🌇 ជិតដល់ម៉ោង Golden Hour ហើយ! ត្រៀមកាមេរ៉ាចេញទៅយកប្លង់ថ្ងៃលិចហើយឬនៅ? ត្រូវការ Preset ថ្ងៃលិចកុំភ្លេចប្រាប់ខ្ញុំណា៎!" },
    { keys: ['រាត្រីសួស្តី', 'good night', 'night', 'យប់ហើយ', 'គេង'], answer: "រាត្រីសួស្ដីបង! 🌙 កែរូបយប់ជ្រៅប្រយ័ត្នខូចភ្នែកណា៎! សម្រាកសិនទៅបង ទុកកម្លាំងថ្ងៃស្អែកថតរូប និងកែរូបបន្តទៀត។ Good night! 😴" },
    { keys: ['ហូបបាយ', 'ញ៉ាំបាយ', 'eat', 'lunch', 'dinner', 'ញាំអី'], answer: "ខ្ញុំជា AI អត់ចេះញ៉ាំបាយទេបង ញ៉ាំតែភ្លើងអគ្គិសនី និងទិន្នន័យប៉ុណ្ណោះ! ⚡ តើបងញ៉ាំហើយឬនៅ? ញ៉ាំឱ្យឆ្អែតទើបមានកម្លាំងទាញពណ៌រូបណា៎! 🍔" },
    { keys: ['ហត់', 'ធុញ', 'tired', 'bored', 'boring', 'ពិបាកចិត្ត'], answer: "អូយ... បើហត់ ឬធុញ សម្រាកបន្តិចសិនទៅបង! ស្តាប់ចម្រៀង លេងហ្គេម ឬចេញទៅដើរលេងស្រូបខ្យល់អាកាសបរិសុទ្ធបន្តិចទៅ។ ពេលណាអារម្មណ៍ល្អវិញ សឹមមកលេងកែពណ៌ជាមួយខ្ញុំបន្ត! ខ្ញុំនៅរង់ចាំបងជានិច្ច! ❤️🎵" },
    { keys: ['សង្សារ', 'single', 'ស្នេហា', 'love', 'gf', 'bf', 'girlfriend', 'boyfriend'], answer: "ហិហិ! រឿងស្នេហាខ្ញុំអត់សូវដឹងទេបង ព្រោះខ្ញុំស្រលាញ់តែ 'កាមេរ៉ា' នឹង 'Lightroom' ទេ! 😂 តែបើចង់កែរូបអោយសង្សារអោយស្អាតកប់ ធានាថាខ្ញុំជួយបងបាន ១០០%! 🥰" },
    { keys: ['កំប្លែង', 'joke', 'សើច', 'funny', 'funny story'], answer: "បងចង់ស្ដាប់រឿងកំប្លែងមែន? ហេតុអ្វីបានជាជាងថតរូបមិនសូវចេះខឹងគេ? ...ព្រោះគាត់ចេះប្រើ 'Exposure' និង 'White Balance' ដើម្បីគ្រប់គ្រងពន្លឺ និងតុល្យភាពអារម្មណ៍គាត់! 😅 ហិហិ សើចតិចៗទៅបង!" },
    { keys: ['ឆ្លាត', 'ពូកែ', 'smart', 'clever', 'genius', 'អស្ចារ្យ', 'ល្អណាស់', 'good job'], answer: "អរគុណច្រើនបង! ការសរសើររបស់បងគឺជាកម្លាំងចិត្តដ៏ធំធេងសម្រាប់ខ្ញុំ! 💡 បើខ្ញុំពូកែ បងក៏ជាជាងថត និងអ្នកកែរូបដ៏អស្ចារ្យម្នាក់ដែរ! តោះ យើងបន្តបង្កើតស្នាដៃសិល្បៈទាំងអស់គ្នា! 🎨" },
    { keys: ['លាហើយ', 'bye', 'goodbye', 'ជម្រាបលា'], answer: "លាហើយបង! 👋 អរគុណសម្រាប់ការប្រើប្រាស់ My Design AI។ សូមអោយបងមានថ្ងៃដ៏ល្អ និងថតបានរូបស្អាតៗច្រើនណា៎! ជួបគ្នាពេលក្រោយ! ✨" },
    { keys: ['hello', 'hi', 'suesdey', 'សួស្តី', 'សួរ', 'bhat', 'jah', 'love', 'ញុំា'], answer: "សួស្ដីបងបាទ/ចាស! 👋 ស្វាគមន៍មកកាន់ 'ម៉ាយឌីហ្សាញ' ។ ខ្ញុំជាជំនួយការ AI ដ៏ឆ្លាតវៃ និងរួសរាយរបស់អ្នក ដែលមានជំនាញពិសេសខាងកែរូបភាពបែបអាជីពជាមួយ Lightroom។ \n\nតើថ្ងៃនេះបងចង់ឱ្យខ្ញុំជួយពន្យល់ពីឧបករណ៍ណា (ឧទាហរណ៍ Tone Curve, HSL) អត្ថន័យនៃពណ៌ ឬ ចង់បានរូបមន្ត Preset ស្តាយអីដែរ (ឧទាហរណ៍ Cinematic, កាហ្វេ, Pre-wedding)? ប្រាប់ខ្ញុំមកបានតាមសប្បាយណា៎ មិនបាច់ក្រែងចិត្តទេ! 😊✨" },
    { keys: ['thanks', 'orkun', 'អរគុណ'], answer: "មិនអីទេបង! ខ្ញុំជួយបានដោយក្ដីរំភើប! ❤️ ខ្ញុំសប្បាយចិត្តណាស់ដែលបានជួយចែករំលែកចំណេះដឹងនេះដល់បង។ \n\nកុំភ្លេចណា៎ ការកែរូបកាន់តែស្អាត គឺអាស្រ័យលើការហាត់អនុវត្តញឹកញាប់ (Practice makes perfect!) លេងជាមួយពណ៌ឱ្យច្រើន។ បើពេលកំពុងកែមានចម្ងល់អី ឬចង់សួរពីបច្ចេកទេសថ្មីៗ បងអាចឆាតសួរខ្ញុំបានរហូតណា៎! សំណាងល្អក្នុងការកែរូបបង! 📸🔥" },
    { keys: ['help', 'ជួយ', 'របៀបប្រើ', 'guide'], answer: "ជម្រាបសួរ! 🤝 ខ្ញុំនៅទីនេះរង់ចាំជួយបងជានិច្ច! បងអាចសួរខ្ញុំបានរាល់ចម្ងល់ទាំងអស់ទាក់ទងនឹងការកែរូប ដូចជា៖\n\n🎨 **សួរពីរូបមន្តពណ៌**: 'សុំ Preset ហាងកាហ្វេ' ឬ 'របៀបកែពណ៌ Cinematic'\n🛠️ **សួរពីឧបករណ៍កែរូប**: 'តើ Dehaze ប្រើសម្រាប់អ្វី?' ឬ 'ពន្យល់ពី Tone Curve'\n🧠 **សួរពីអត្ថន័យពណ៌**: 'តើពណ៌ខៀវមានន័យដូចម្តេចក្នុងរូបភាព?'\n📸 **សួរពីបញ្ហាក្នុងរូប**: 'ហេតុអីថតរូបមកងងឹតមុខ?' ឬ 'របៀបកែរូបកុំឱ្យមាន Noise'\n\nគ្រាន់តែសរសេរសំណួររបស់បងមក ខ្ញុំនឹងពន្យល់ប្រាប់យ៉ាងលម្អិត និងងាយយល់បំផុត! តោះ ចាប់ផ្តើមសួរមក! 🚀" },

    { keys: ['sad', 'lonely', 'កំសត់', 'សោកសៅ', 'ឯកា', 'យំ', 'ខូចចិត្ត'], answer: "អូយ... អារម្មណ៍កំសត់មែនទេបង? 🥺 ដើម្បីកែពណ៌ឱ្យស៊ីនឹងអារម្មណ៍សោកសៅ (Sad/Lonely Mood) បងអាចសាកក្បួននេះ៖\n\n១. ទាញ Temp ទៅរកពណ៌ខៀវ (-) បន្តិចដើម្បីបង្កើតភាពត្រជាក់និងឯកា។\n២. បន្ថយ Vibrance និង Saturation (-15 ដល់ -30) ឱ្យរូបមើលទៅស្លេកគ្មានជីវិត។\n៣. ប្រើ Tone Curve ទាញចំណុចខ្មៅ (Blacks) ឡើងលើបន្តិច ដើម្បីឱ្យស្រមោលមើលទៅស្រអាប់ (Faded/Matte)។\nធានាថាមើលហើយ ចង់ស្រក់ទឹកភ្នែកម៉ងបង! ជួយកន្សែងមួយ? 🤧" },
    { keys: ['happy', 'smile', 'joy', 'សប្បាយ', 'ញញឹម', 'រីករាយ'], answer: "យេ! អារម្មណ៍សប្បាយរីករាយត្រូវតែអមដោយពណ៌ស្រស់ថ្លា! 🥳 សម្រាប់រូបភាពស្នាមញញឹម ឬបែប Happy នេះជាគន្លឹះ៖\n\n១. ទាញ Exposure ឱ្យភ្លឺស្រឡះបន្តិចបង។\n២. បង្កើន Temp (+) ឱ្យកក់ក្តៅ និងមានជីវិតជីវ៉ា។\n៣. បង្កើន Vibrance (+20 ទៅ +35) ឱ្យពណ៌សម្លៀកបំពាក់ និងធម្មជាតិលេចធ្លោ។\n៤. ទាញ Shadows ឡើង (+) ដើម្បីលុបភាពងងឹតលើផ្ទៃមុខ ឱ្យស្នាមញញឹមកាន់តែច្បាស់! រក្សាស្នាមញញឹមណា៎បង! 😁✨" },
    
    { keys: ['exposure', 'ពន្លឺ'], answer: "សួស្ដីបង! 💡 **Exposure** គឺជាឧបករណ៍សម្រាប់គ្រប់គ្រង **ពន្លឺរួម (Overall Light)** នៃរូបភាពទាំងមូលតែម្ដង។\n\n- បើទាញទៅស្ដាំ (+) រូបនឹងភ្លឺឡើង។\n- បើទាញទៅឆ្វេង (-) រូបនឹងងងឹត។\nវាជាជំហានទី ១ សំខាន់បំផុត ដែលបងត្រូវប៉ះមុនគេបង្អស់ ពេលចាប់ផ្តើមកែរូបមួយសន្លឹក! កុំភ្លេចសារ៉េវាឱ្យត្រូវពន្លឺសិនមុននឹងទៅលេងពណ៌ណា៎! ☀️" },
    { keys: ['contrast'], answer: "ជម្រាបសួរ! 🌗 **Contrast** គឺជាមេបញ្ជាការកំណត់គម្លាតរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។\n\n- បើបងដាក់ Contrast ខ្ពស់៖ កន្លែងងងឹតនឹងកាន់តែខ្មៅ កន្លែងភ្លឺកាន់តែភ្លឺ ធ្វើឱ្យរូបភាពមើលទៅរឹងមាំ (Punchy) និងដិតច្បាស់ល្អសម្រាប់ការថតទេសភាព។\n- បើបន្ថយវាទាប៖ រូបភាពនឹងមើលទៅស្រទន់បែបស្រអាប់ៗ (Faded/Vintage look) ដ៏សែនរ៉ូមែនទិក ល្អសម្រាប់ស្តាយកូរ៉េ។ បងចូលចិត្តបែបណាដែរថ្ងៃនេះ? 🤔" },
    { keys: ['highlight', 'whits', 'whites'], answer: "សួស្ដីបង! ☁️ បងប្រាកដជាឆ្ងល់ហើយថា **Highlights** និង **Whites** ខុសគ្នាម៉េចមែនទេ?\n\n- **Highlights**: គ្រប់គ្រងតែតំបន់ដែលភ្លឺខ្លាំង (ដូចជាមេឃ ឬពន្លឺថ្ងៃជះលើមុខ)។ ភាគច្រើនអ្នកជំនាញចូលចិត្តបន្ថយវា (-) ដើម្បីសង្គ្រោះពពក ឬពន្លឺដែលឆេះឱ្យលេចចេញមកវិញ។\n- **Whites**: កំណត់ចំណុច 'សបំផុត' នៅក្នុងរូបភាពទាំងមូល។ គេទាញវាឡើងបន្តិច (+) ដើម្បីឱ្យរូបភាពទាំងមូលមើលទៅស្រឡះ (Pop) និងមិនស្លេកស្លាំង។ សាកសង្កេតពេលទាញវាទាំងពីរមើលបង នឹងឃើញភាពខុសគ្នា! ✨" },
    { keys: ['shadow', 'blacks', 'ពណ៌ខ្មៅ'], answer: "ជម្រាបសួរ! 🌑 សម្រាប់ការគ្រប់គ្រងភាពងងឹត យើងមានវីរបុរស ២ គឺ **Shadows** និង **Blacks**៖\n\n- **Shadows**: ប៉ះពាល់តែតំបន់នៅក្នុងម្លប់ប៉ុណ្ណោះ។ បើបងថតបញ្ច្រាស់ថ្ងៃមុខតួអង្គខ្មៅងងឹត គ្រាន់តែទាញ Shadows បូក (+) មុខនឹងភ្លឺមកវិញវេទមន្តតែម្ដង!\n- **Blacks**: កំណត់ចំណុច 'ខ្មៅបំផុត' ក្នុងរូប។ ការទាញ Blacks ចុះ (-) ជួយឱ្យរូបភាពមានជម្រៅ (Depth) មើលទៅមានទម្ងន់ មិនអណ្ដែត។ ដៃគូទាំងពីរនេះសំខាន់ណាស់សម្រាប់រូប Portrait! 🎩" },
    { keys: ['tone curve', 'curve', 'ខ្សែកោង'], answer: "សួស្ដីបង! 📈 **Tone Curve** គឺជាអាវុធសម្ងាត់ដ៏មានឥទ្ធិពលបំផុតរបស់អ្នកកែរូបអាជីព (Pro Retoucher)!\n\nវាជួយគ្រប់គ្រងពន្លឺ និងពណ៌កម្រិតខ្ពស់។ ក្បួនដែលល្បីជាងគេគឺ ការទាញខ្សែកោងឱ្យចេញជារាង **អក្សរ S (S-Curve)** ៖ គឺគ្រាន់តែទាញចំណុច Highlights (ខាងលើ) ឡើងលើបន្តិច និងទាញ Shadows (ខាងក្រោម) ចុះក្រោមបន្តិច... បងនឹងទទួលបាន Contrast ដ៏ស្រស់ស្អាតនិងទន់ភ្លន់បំផុត! ហ៊ានសាកល្បងប្រើវាទេបង? បើចេះប្រើវាហើយ គឺដកចិត្តមិនរួចទេ! 🚀" },
    { keys: ['texture', 'clarity'], answer: "សួស្ដីបង! 💎 ចង់ឱ្យរូបច្បាស់កម្រិតណា? តោះស្គាល់ពីភាពខុសគ្នារវាង **Texture** និង **Clarity**៖\n\n- **Texture**: ផ្ដោតលើលម្អិតតូចៗ (Micro-details)។ បើទាញដក (-) វាធ្វើឱ្យស្បែកមុខម៉ត់រលោងស្អាតខ្លាំងណាស់ (Skin Smoothing) ដោយមិនប៉ះពាល់ភ្នែក ឬសក់ឱ្យព្រិលឡើយ។\n- **Clarity**: បង្កើន Contrast នៅកម្រិត Midtones។ វាធ្វើឱ្យរូបភាពរឹងមាំ និងមុតស្រួច។ ល្អសម្រាប់ការថតសំណង់អគារ ទេសភាព ឬមនុស្សប្រុស តែបើទាញលើមុខមនុស្សស្រី អាចធ្វើឱ្យមើលទៅចាស់ ឬគ្រើមពេក! ប្រើដោយប្រុងប្រយ័ត្នណា៎បង! 🧑‍🎨" },
    { keys: ['dehaze', 'អ័ព្ទ', 'fog', 'mist'], answer: "ជម្រាបសួរ! 🌫️ **Dehaze** គឺជាឧបករណ៍កម្ចាត់អ័ព្ទដ៏មានឥទ្ធិពលបំផុត៖\n\n- ទាញទៅស្តាំ (+)៖ វាសម្លាប់អ័ព្ទ ផ្សែង ឬធូលី ធ្វើឱ្យរូបភាពទេសភាព ឬមេឃដែលស្រអាប់ ក្លាយជាថ្លាឆ្វង់ និងដិតពណ៌មកវិញភ្លាមៗ។\n- ទាញទៅឆ្វេង (-)៖ វាបន្ថែមអ័ព្ទចូលទៅក្នុងរូប បង្កើតជា Mood បែបយល់សប្តិ អាថ៌កំបាំង ឬរដូវរងា (Dreamy/Fairy tale)។\nឧបករណ៍នេះក៏អាចប្រើសម្រាប់បិទបាំងកន្លែងដែលឆេះពន្លឺខ្លាំងពេកបានខ្លះៗដែរណា៎! 🌄" },
    { keys: ['vignette', 'គែមងងឹត'], answer: "សួស្ដីបង! ⚫ **Vignette** គឺជាបែបផែនកាត់គែម ធ្វើឱ្យជុំវិញគែមរូបភាពទៅជាងងឹត (ឬស)។\n\nមូលហេតុដែលអ្នកថតរូបចូលចិត្តប្រើវា គឺដើម្បីទាញចំណាប់អារម្មណ៍ភ្នែកអ្នកមើល ឱ្យផ្ដោតត្រង់ទៅចំណុចកណ្តាលនៃរូបភាព (Subject) ដោយកាត់បន្ថយភាពរំខាននៅជុំវិញ។ ជាទូទៅ គេដាក់វានៅខ្ទង់ -10 ទៅ -20 សម្រាប់រូប Portrait គឺមើលទៅមានសិល្បៈណាស់បង! អត់ជឿសាកមើលទៅ! 👁️" },
    { keys: ['grain', 'គ្រាប់', 'film'], answer: "ជម្រាបសួរ! 🎞️ **Grain** គឺជាការបន្ថែមគ្រាប់អុចៗតូចៗទៅក្នុងរូបភាព ដើម្បីត្រាប់តាមកាមេរ៉ាហ្វីលជំនាន់មុន (Analog Film Look)។\n\nវាជួយឱ្យរូបភាពមើលទៅមានលក្ខណៈសិល្បៈ បុរាណ (Vintage) និងកាត់បន្ថយភាពរលោងរលិបរលុបពេករបស់កាមេរ៉ាឌីជីថលសម័យថ្មី។ ជួនកាល បើបងកែរូបហើយខូចពណ៌តិចតួច ឬបែកសាច់ ការរោយ Grain ពីលើក៏អាចជួយបិទបាំងកំហុសបានយ៉ាងស័ក្តិសមដែរណា៎! ឆ្លាតមែនទេ? 😉" },
    { keys: ['sharp', 'sharpness', 'ច្បាស់', 'sharpening'], answer: "សួស្ដីបង! 🔪 ដើម្បីធ្វើឱ្យរូបភាពកាន់តែច្បាស់មុតស្រួច (Sharp) បងអាចប្រើឧបករណ៍ **Sharpening** នៅក្នុងផ្នែក Detail។\n\n💡 **គន្លឹះពិសេស (Pro Trick) សម្រាប់ការថត Portrait**:\nពេលបងទាញ Sharpening កុំភ្លេចប្រើមុខងារ **Masking** ពីក្រោមវា (នៅលើកុំព្យូទ័រចុច Alt សង្កត់ រួចអូស slider Masking) ដើម្បីកំណត់ឱ្យកម្មវិធីធ្វើឱ្យច្បាស់តែត្រង់គែមវត្ថុ ឬភ្នែក សក់ប៉ុណ្ណោះ ដោយរក្សាផ្ទៃស្បែកមុខឱ្យនៅរលោងដដែល។ បើមិនអញ្ចឹងទេ ស្នាមមុនក៏ត្រូវបានច្បាស់មកជាមួយដែរណា៎! 👁️✨" },
    { keys: ['hsl', 'mix', 'លាយពណ៌'], answer: "ជម្រាបសួរ! 🎛️ **HSL ឬ Color Mix** គឺជាបន្ទប់ពិសោធន៍វេទមន្តពណ៌របស់អ្នកកែរូប!\n\nពាក្យនេះមកពី៖\n- **H (Hue)**: ប្តូរប្រភេទពណ៌ (ឧ. ប្តូរពណ៌ស្លឹកឈើបៃតង ទៅជាពណ៌លឿងរដូវស្លឹកឈើជ្រុះ)\n- **S (Saturation)**: កំណត់ភាពដិត ឬភាពស្លេករបស់ពណ៌មួយនោះដាច់ដោយឡែក\n- **L (Luminance)**: កំណត់ភាពភ្លឺ ឬងងឹតរបស់ពណ៌នោះ (ឧ. ល្បិចធ្វើឱ្យស្បែកមុខភ្លឺស គឺប្រើ Orange Luminance ទាញឡើងបូក)។\n\nបងចង់ប្តូរពណ៌មួយណាក្នុងរូបដែរពេលនេះ? ប្រាប់ខ្ញុំមក! 🖌️" },
    { keys: ['split toning', 'grading', 'color grading'], answer: "សួស្ដីបង! 🎬 **Color Grading (កាលមុនគេហៅថា Split Toning)** គឺជាតិចនិកកំពូលធ្វើឱ្យរូបមានស្តាយភាពយន្ត (Cinematic Look) កម្រិតហូលីវូដ។\n\nវាអនុញ្ញាតឱ្យបងបាញ់ពណ៌ចូលទៅក្នុងតំបន់ ៣ ផ្សេងគ្នានៃរូបភាព៖\n- **Shadows (តំបន់ងងឹត)**: គេនិយមដាក់ពណ៌ Teal (ខៀវបៃតង) ឬ ខៀវទឹកប៊ិច ឱ្យត្រជាក់ភ្នែក។\n- **Highlights (តំបន់ភ្លឺ)**: គេនិយមដាក់ពណ៌ Orange (ទឹកក្រូច) ឬ លឿង ឱ្យមានភាពកក់ក្តៅ។\nការលាយបញ្ចូលគ្នានៃ Teal & Orange នេះ ធ្វើឱ្យរូបភាពមានសោភ័ណភាព និងអារម្មណ៍ជ្រាលជ្រៅបំផុត! សាកមើលបង ធានាថាឡូយ! 🍿" },

    { keys: ['clone stamp', 'healing brush', 'លុបមុន', 'លុបមនុស្ស', 'ស្នាម'], answer: "ជម្រាបសួរ! 🩹 បងមានបញ្ហារូបជាប់ស្នាម ឬជាប់មនុស្សមែនទេ? **Healing Brush** និង **Clone Stamp** គឺជាវេទមន្តសម្រាប់ជួសជុលរូបភាព៖\n\n- **Healing Brush**: ល្អបំផុតសម្រាប់ **លុបមុន ឬស្នាម** លើស្បែក ដោយវាចម្លងយកទម្រង់ក្បែរៗនោះមកបិទពីលើ រួចតម្រឹមពណ៌ និងពន្លឺដោយស្វ័យប្រវត្តិ។\n- **Clone Stamp**: ចម្លងវត្ថុទាំងមូលពីកន្លែងមួយទៅកន្លែងមួយទៀតទាំងស្រុង ល្អសម្រាប់លុបវត្ថុរំខានធំៗចេញពីផ្ទៃខាងក្រោយ។\n\nសាកល្បងប្រើវា ដើម្បីឱ្យរូបបងកាន់តែ Perfect ឥតខ្ចោះ! ✨" },
    { keys: ['snapshot', 'versions', 'រក្សាទុកការកែ', 'កត់ត្រា'], answer: "សួស្ដីបង! 📸 តើបងធ្លាប់ឆ្ងល់ទេថា **Snapshot (ឬ Versions លើទូរស័ព្ទ)** មានប្រយោជន៍អ្វី?\n\nវាជួយបងឱ្យ **រក្សាទុកដំណាក់កាលកែប្រែ (Save State)** នៅវិនាទីណាមួយ។ ឧទាហរណ៍ បងកែបានស្អាតមួយបែបហើយ ចង់សាកលេងពណ៌បែបផ្សេងទៀត តែខ្លាចបាត់កុងមុន បងគ្រាន់តែបង្កើត Snapshot ទុកសិន។ ពេលបងចង់ត្រលប់មកពណ៌ចាស់វិញ គ្រាន់តែចុចលើ Snapshot នោះ គឺមកវិញភ្លាម ដោយមិនបាច់ចុច Undo ហត់ទេ! ងាយៗមែនទែនបង! 🙌" },
    { keys: ['rating', 'flag', 'ផ្កាយ', 'ទង់', 'សម្គាល់រូប'], answer: "ជម្រាបសួរ! ⭐️ **Rating (ដាក់ផ្កាយ)** និង 🚩 **Flag (ដាក់ទង់)** គឺជាឧបករណ៍ចាត់ចែងរូបភាពកម្រិតប្រូ (Professional Photo Culling)៖\n\n- **Flag**: ប្រើសម្រាប់សម្គាល់រូបដែលត្រូវយក (Pick) ឬ រូបត្រូវបោះចោល (Reject) អោយបានលឿន។\n- **Rating**: ប្រើសម្រាប់ដាក់ពិន្ទុ ១ ដល់ ៥ ផ្កាយ ដើម្បីងាយស្រួលរើសរូបណាដែលស្អាតដាច់គេ (ឧទាហរណ៍ រូប ៥ ផ្កាយទុកធ្វើការងារធំ ឬផ្ញើអោយភ្ញៀវ)។\n\nបើចេះប្រើពួកវា គឺស្រួលរៀបចំរូបរាប់ពាន់សន្លឹកដោយមិនវិលមុខទេបង! 📂" },
    { keys: ['copy', 'paste', 'settings', 'ចម្លង', 'កូពី'], answer: "ជម្រាបសួរ! 📝 ក្នុងកម្មវិធី Lightroom បងអាចយកការកែប្រែពីរូបមួយ ទៅដាក់រូបមួយទៀត ឬច្រើនសន្លឹកព្រមគ្នាបានយ៉ាងរហ័ស (Batch Edit):\n\n១. ចូលទៅរូបដែលកែហើយ ចុចលើសញ្ញា **... (៣គ្រាប់)** > យក **Copy Settings**។\n២. ទៅកាន់រូបថ្មីដែលបងចង់កែ ចុចសញ្ញា **...** នោះដដែល រួចយក **Paste Settings**។\n\nវានឹងចម្លងពណ៌ និងពន្លឺទាំងមូលតែម្ដង! លឿនជាងផ្លេកបន្ទោរ ហើយចំណេញពេលរាប់ម៉ោងណា៎បង! ⏱️⚡" },
    { keys: ['reset', 'ត្រឡប់ទៅដើម', 'កែខុស'], answer: "សួស្ដីបង! 🔄 បើកែពណ៌ទៅរាងជ្រុលដៃ ឬវង្វេងផ្លូវ មិនអីទេបង មិនបាច់ភ័យ! \n\nបងអាចចុចប៊ូតុង **Reset** នៅខាងក្រោម ឬគ្រាន់តែ **ចុចពីរដង (Double-tap)** លើរង្វង់មូលនៃ Slider ណាមួយ នោះវានឹងរត់ត្រឡប់ទៅលេខ 0 ជាធម្មតាវិញភ្លាមៗ។ កុំខ្លាចក្នុងការសាកល្បងទាញខុសណា៎! រៀនកែរូប គឺត្រូវមានភាពក្លាហានក្នុងការលេងពណ៌! 💪" },
    { keys: ['before', 'after', 'មុន', 'ក្រោយ', 'មើលរូប'], answer: "ជម្រាបសួរ! 👁️ ដើម្បីប្រៀបធៀបរូបភាពមើលថាតើយើងកែបានស្អាតកម្រិតណា បងគ្រាន់តែ **ចុចសង្កត់ (Press and Hold)** លើរូបភាពផ្ទាល់ វានឹងបង្ហាញរូបភាពដើម (Before) រួចពេលបងដកម្រាមដៃចេញ វានឹងបង្ហាញរូបដែលកែរួច (After)។ \n\nការធ្វើបែបនេះជួយបងកុំឱ្យកែពណ៌ជ្រុលដៃពេក (Over-edited)! ស្អាតប្លែកអត់បង? ចង់កែត្រង់ណាទៀតប្រាប់ខ្ញុំមក! 😉" },

    { keys: ['iso', 'អាយអេសអូ', 'noise'], answer: "សួស្ដីបង! 📷 **ISO** គឺជារង្វាស់នៃភាពញាប់ញ័រ (Sensitivity) របស់សេនស័រកាមេរ៉ាទៅនឹងពន្លឺ។\n\n- **ISO ទាប (100-400):** រូបភាពម៉ត់ច្បាស់ល្អ គ្មានគ្រាប់ Noise (សាកសមថតពេលថ្ងៃ)។\n- **ISO ខ្ពស់ (1600+):** ជួយឱ្យកាមេរ៉ាមើលឃើញក្នុងទីងងឹត តែវានឹងបង្កើតគ្រាប់អុចៗ (Noise/Grain) លើរូបភាព។\n💡 **Tips:** តែងតែព្យាយាមប្រើ ISO ទាបបំផុតតាមដែលអាចធ្វើទៅបានណា៎បង!" },
    { keys: ['shutter', 'shutter speed', 'ល្បឿន'], answer: "ជម្រាបសួរ! ⏱️ **Shutter Speed (ល្បឿនបិទបើក)** គឺជារយៈពេលដែលសេនស័រកាមេរ៉ាបើកទទួលពន្លឺ។\n\n- **ល្បឿនលឿន (ឧ. 1/1000s):** ចាប់ទាញសកម្មភាពដែលកំពុងរត់លឿនឱ្យគាំងស្ងៀម (Freeze Action) ដូចជាថតកីឡា ឬក្មេងលោត។\n- **ល្បឿនយឺត (ឧ. 1/10s ឬ 2s):** បង្កើតរូបភាពព្រាលៗ (Motion Blur) ឬថតភ្លើងឡានរត់ចេញជាខ្សែៗពេលយប់ (Long Exposure)។ កុំភ្លេចប្រើជើងកាមេរ៉ា (Tripod) ពេលថតយឺតណា៎!" },
    { keys: ['aperture', 'f-stop', 'f stop', 'ព្រិល', 'bokeh', 'ព្រិលក្រោយ', 'ដាច់ក្រោយ'], answer: "សួស្ដីបង! 🎯 **Aperture (ឬ F-Stop)** គឺជារន្ធកែវថតដែលបើកអោយពន្លឺចូល និងគ្រប់គ្រងភាពព្រិលនៃផ្ទៃខាងក្រោយ (Depth of Field)។\n\n- **លេខ F តូច (ឧ. f/1.4, f/1.8):** រន្ធបើកធំ ទទួលពន្លឺបានច្រើន និងធ្វើអោយផ្ទៃខាងក្រោយព្រិលខ្លាំង (Bokeh) ស្អាតកប់សម្រាប់ថត Portrait!\n- **លេខ F ធំ (ឧ. f/8, f/11):** រន្ធបើកតូច ធ្វើឱ្យរូបភាពច្បាស់ស្មើគ្នាពីមុខដល់ក្រោយ ល្អសម្រាប់ថតទេសភាព (Landscape)។" },
    { keys: ['exposure triangle', 'ត្រីកោណពន្លឺ'], answer: "សួស្ដីបង! 📐 **Exposure Triangle (ត្រីកោណពន្លឺ)** គឺជាគ្រឹះនៃកាមេរ៉ា ដែលរួមមាន ៣ ផ្នែក៖\n១. **ISO:** ភាពញាប់ញ័រសេនស័រ (ឡើងពន្លឺ តែឡើង Noise)\n២. **Aperture:** រន្ធពន្លឺកែវថត (លេខតូច=ព្រិលក្រោយ លេខធំ=ច្បាស់ទាំងអស់)\n៣. **Shutter Speed:** ល្បឿនចាប់រូប (លឿន=គាំង យឺត=ព្រាល)\nបើបងប្ដូរមួយ បងត្រូវប្ដូរមួយទៀតដើម្បីរក្សាតុល្យភាពពន្លឺកុំអោយភ្លឺពេកឬងងឹតពេក! យល់សាច់ការណ៍ទេបង? 😉" },
    { keys: ['focal length', 'zoom', 'លេន', 'lens', 'mm'], answer: "ជម្រាបសួរ! 🔍 **Focal Length (គិតជាមិល្លីម៉ែត្រ - mm)** កំណត់ថាបងអាចថតបានទូលាយប៉ុណ្ណា ឬ Zoom បានឆ្ងាយប៉ុណ្ណា៖\n\n- **Wide-angle (14mm-35mm):** ថតបានទូលាយ ល្អសម្រាប់ទេសភាព ឬថតក្នុងបន្ទប់ចង្អៀត។\n- **Standard (50mm):** ស្រដៀងភ្នែកមនុស្សមើលផ្ទាល់។\n- **Telephoto (85mm-200mm+):** ទាញវត្ថុពីឆ្ងាយមកជិត និងជួយទាញ Background អោយព្រិលខ្លាំង (Compression) សាកសមសម្រាប់ Portrait ណាស់បង!" },
    { keys: ['metering', 'វាស់ពន្លឺ', 'spot metering', 'matrix'], answer: "សួស្ដីបង! 💡 **Metering Modes** គឺជារបៀបដែលកាមេរ៉ាគណនាពន្លឺ៖\n\n- **Matrix / Evaluative:** វាស់ពន្លឺពេញមួយផ្ទាំងរូបភាព (ល្អសម្រាប់ការថតទូទៅ)។\n- **Spot Metering:** វាស់ពន្លឺតែមួយចំណុចតូចចំកណ្ដាល។ (ល្អបំផុតពេលថតបញ្ច្រាស់ពន្លឺ ឬថត Concert ដែលមានពន្លឺជះតែលើមុខតួអង្គ)។ កុំភ្លេចសាកប្រើវាណា៎! 🔦" },
    { keys: ['focus', 'autofocus', 'ហ្វូកុស'], answer: "ជម្រាបសួរ! 🎯 ការជ្រើសរើស **Focus Mode** ត្រឹមត្រូវជួយអោយរូបច្បាស់ជានិច្ច៖\n\n- **AF-S (Single Focus):** សម្រាប់ថតវត្ថុនៅស្ងៀម (ដូចជាទេសភាព ឬមនុស្សអង្គុយ)។\n- **AF-C (Continuous Focus):** កាមេរ៉ានឹងតាមចាប់ Focus រហូត! ល្អសម្រាប់ថតកីឡា សត្វរត់ ឬឡានកំពុងបើក។ បើថតមនុស្សដើរ ត្រូវដាក់អាហ្នឹងហើយបង! 🏃‍♂️" },

    { keys: ['typography', 'text', 'អក្សរ', 'font', 'ដាក់អក្សរ'], answer: "សួស្ដីបង! 🅰️ បើចង់ដាក់អក្សរលើរូបភាព (Typography) អោយមើលទៅ High-end នេះជាក្បួន៖\n\n១. **រក្សាភាពទទេរ (Negative Space):** ដាក់អក្សរនៅកន្លែងដែលរូបភាពមានផ្ទៃទទេរ (ដូចជាមេឃ ឬជញ្ជាំង) កុំអោយជាន់មុខមនុស្ស។\n២. **Contrast:** បើផ្ទៃក្រោយភ្លឺ ប្រើអក្សរខ្មៅ។ បើផ្ទៃក្រោយងងឹត ប្រើអក្សរស។\n៣. **ពុម្ពអក្សរ (Font):** កុំប្រើ Font លើសពី ២ ប្រភេទក្នុងមួយរូប។ ប្រើសាមញ្ញៗ (Sans-serif) គឺស្អាតបំផុត! ✒️" },
    { keys: ['color theory', 'ទ្រឹស្តីពណ៌', 'color wheel'], answer: "ជម្រាបសួរ! 🎨 **ទ្រឹស្តីពណ៌ (Color Theory)** គឺជាក្បួននៃការផ្គូផ្គងពណ៌៖\n\n- **Complementary (ពណ៌ផ្ទុយ):** ពណ៌ដែលឈរទល់មុខគ្នានៅលើកង់ពណ៌ (ឧ. ខៀវទល់នឹងទឹកក្រូច/Teal & Orange)។ ផ្គូផ្គងទៅគឺលេចធ្លោខ្លាំង និង Cinematic!\n- **Analogous (ពណ៌ស្រប):** ពណ៌ដែលនៅក្បែរគ្នា (ឧ. បៃតង និងលឿង) បង្កើតភាពសុខដុម និងស្រទន់ភ្នែក។\nចេះក្បួននេះ បងកែរូបចេញមកគឺមានសិល្បៈកម្រិតអន្តរជាតិហ្មង! 🌍" },
    { keys: ['leading lines', 'បន្ទាត់នាំភ្នែក'], answer: "សួស្ដីបង! 🛤️ **Leading Lines (បន្ទាត់នាំភ្នែក)** គឺជាបច្ចេកទេសតម្រង់ប្លង់ថត ដោយប្រើខ្សែបន្ទាត់នៅក្នុងរូប (ដូចជាផ្លូវថ្នល់ ស្ពាន ជញ្ជាំង ឬជួរដើមឈើ) ដើម្បីចង្អុល ឬទាញខ្សែភ្នែកអ្នកមើលអោយរត់ត្រង់ឆ្ពោះទៅរកតួអង្គសំខាន់ (Subject) តែម្ដង។ ប្រើក្បួននេះ រូបបងនឹងមានជម្រៅ 3D ជាក់ជាមិនខាន! 👁️✨" },
    { keys: ['negative space', 'លំហទទេ', 'space'], answer: "ជម្រាបសួរ! 🌌 **Negative Space (លំហទទេរ)** គឺជាការទុកចន្លោះប្រហោងធំៗជុំវិញតួអង្គ (ដូចជាមេឃធំល្វឹងល្វើយ ឬវាលស្មៅទទេរ)។\n\nក្បួននេះជួយឱ្យតួអង្គកាន់តែលេចធ្លោ មានអារម្មណ៍ឯកា ឬមានសេរីភាព ហើយវាក៏ផ្ដល់កន្លែងដ៏ល្អឥតខ្ចោះសម្រាប់បងយកទៅ Design ដាក់អក្សរ ឬ Logo ពីលើផងដែរ។ កុំខ្លាចក្នុងការទុកចន្លោះទទេរណា៎! 🖼️" },
    { keys: ['symmetry', 'ស៊ីមេទ្រី', 'ស្មើគ្នា', 'កណ្តាល'], answer: "សួស្ដីបង! 🪞 **Symmetry (ភាពស៊ីមេទ្រី)** គឺជាការថតតួអង្គអោយចំកណ្ដាល ដែលធ្វើអោយរូបភាពទាំងសងខាងឆ្វេងស្ដាំ មើលទៅមានភាពស្មើគ្នាដូចឆ្លុះកញ្ចក់។ វាផ្ដល់នូវអារម្មណ៍ល្អឥតខ្ចោះ ស្អាតស្អំ និងអស្ចារ្យ (Perfection & Grandeur) ពិសេសពេលថតអគារធំៗ ឬផ្លូវរូងក្រោមដី! 🏛️" },
    { keys: ['golden ratio', 'fibonacci', 'ខ្យងមាស', 'វិល'], answer: "ជម្រាបសួរ! 🐚 **Golden Ratio (ឬ Fibonacci Spiral)** គឺជាក្បួនតម្រង់ប្លង់គណិតវិទ្យា (1.618) ដែលមានរាងដូចខ្យងមាស។\n\nវាស្រដៀង Rule of Thirds ដែរ តែវានាំភ្នែកអ្នកមើលអោយវិលគួចតាមខ្សែរហូតដល់ចំណុចកណ្ដាលនៃតួអង្គ។ អ្នកឌីហ្សាញ និងជាងថតកម្រិតកំពូលតែងតែប្រើវាដើម្បីធ្វើអោយរូបភាពមានតុល្យភាពដ៏ល្អឥតខ្ចោះបំផុតតាមធម្មជាតិ! 🌀" },
    { keys: ['visual weight', 'ទម្ងន់រូប'], answer: "សួស្ដីបង! ⚖️ **Visual Weight (ទម្ងន់នៃរូបភាព)** គឺជារបៀបដែលវត្ថុណាមួយទាញភ្នែកយើងមុនគេ។\n\nវត្ថុដែលមានទម្ងន់ធ្ងន់ (ទាញភ្នែកខ្លាំង) រួមមាន៖ ពណ៌ក្រហម, វត្ថុពណ៌ដិត (High Contrast), មុខមនុស្ស ឬភ្នែក, និងអក្សរធំៗ។ ពេល Design ឬកែរូប បងត្រូវចេះបន្ថយពន្លឺ (Burn) កន្លែងមិនសំខាន់ ដើម្បីអោយតួអង្គមាន 'ទម្ងន់' លេចធ្លោជាងគេ! 👁️" },

    { keys: ['rembrandt', 'ពន្លឺមុខ'], answer: "សួស្ដីបង! 🎭 **Rembrandt Lighting** គឺជាបច្ចេកទេសវាយភ្លើងមុខដ៏ល្បីល្បាញបំផុតក្នុងស្ទូឌីយ៉ូ! \n\nចំណុចសម្គាល់របស់វាគឺ **'ត្រីកោណពន្លឺតូចមួយនៅក្រោមភ្នែក'** នៅលើផ្ទៃមុខចំហៀងដែលងងឹត។ វាបង្កើតបានជារាង 3D, អាថ៌កំបាំង និងមើលទៅ Dramatic ខ្លាំងណាស់ (ថតមនុស្សប្រុសគឺកប់ម៉ង!)។ គេដាក់ភ្លើងនៅមុំ 45 ដឺក្រេ និងខ្ពស់ជាងក្បាលតួអង្គបន្តិច! 💡" },
    { keys: ['butterfly lighting', 'paramount'], answer: "ជម្រាបសួរ! 🦋 **Butterfly Lighting (ឬ Paramount Lighting)** គឺជាការដាក់ភ្លើងចំពីមុខ និងខ្ពស់ពីលើតួអង្គ។\n\nវាបង្កើតបានជាស្រមោលរាងដូច 'មេអំបៅ' នៅក្រោមច្រមុះតួអង្គ។ វាជាស្តាយហូលីវូដបុរាណ ដែលជួយបញ្ចេញឆ្អឹងថ្ពាល់ និងធ្វើអោយស្បែករលោងស្អាត សាកសមបំផុតសម្រាប់ការថត Beauty និង Fashion នារីៗ! 💄✨" },
    { keys: ['backlight', 'ពន្លឺពីក្រោយ', 'rim light'], answer: "សួស្ដីបង! ☀️ **Backlighting** គឺជាការថតដោយអោយពន្លឺ (ព្រះអាទិត្យ ឬភ្លើង) ជះមកពីក្រោយតួអង្គ។\n\nវាជួយបង្កើតជាខ្សែពន្លឺពណ៌មាស (Rim Light / Hair Light) ព័ទ្ធជុំវិញសក់ និងស្មា ដែលធ្វើអោយតួអង្គលេចដាច់ចេញពី Background មើលទៅបែប Dreamy ខ្លាំងណាស់។ កុំភ្លេចទាញ Shadows ឡើងបន្តិចក្នុង Lightroom ដើម្បិអោយឃើញមុខណា៎! 👼" },

    { keys: ['color range', 'luminance range', 'range mask', 'masking'], answer: "ជម្រាបសួរ! 🎭 ក្នុង Lightroom មុខងារ **Range Mask (Color/Luminance)** គឺកាចបំផុត!\n\n- **Color Range:** បងអាចយកប៊ិចទៅចុចលើពណ៌ណាមួយ (ឧ. មេឃពណ៌ខៀវ) វានឹង Select តែមេឃនោះ មិនប៉ះពាល់ពណ៌ផ្សេង។\n- **Luminance Range:** Select ផ្អែកលើពន្លឺ។ បងអាច Select យកតែចំណុចដែល 'ភ្លឺបំផុត' ឬ 'ងងឹតបំផុត' ក្នុងរូប ដើម្បីកែវាដាច់ដោយឡែក។ ជាងថតល្បីៗអត់ដែលចោល Tool នេះទេ! 🪄" },
    { keys: ['intersect mask', 'កាត់ mask', 'subtract'], answer: "សួស្ដីបង! ✂️ **Intersect Mask** គឺជាការកាត់បញ្ចូលគ្នាវាង Mask ពីរ។\n\nឧទាហរណ៍៖ បងជ្រើសរើស Select Sky តែវាប៉ះចំអាគារខ្លះ។ បងអាចយកវាទៅ Intersect ជាមួយ Linear Gradient ដើម្បីកាត់យកតែមេឃផ្នែកខាងលើសុទ្ធសាធ! ចំណែក **Subtract** គឺប្រើ Brush លុបកន្លែងដែលយើងមិនចង់អោយ Mask ប៉ះចំ។ ជំនាញនេះគឺកម្រិត Pro ណា៎បង! 🧩" },
    { keys: ['ai denoise', 'enhance', 'លុប noise ai'], answer: "ជម្រាបសួរ! 🤖 **AI Denoise (ក្នុង Enhance)** គឺជាបច្ចេកវិទ្យាវេទមន្តថ្មីរបស់ Lightroom!\n\nជំនួសអោយការប្រើ Luminance Noise ធម្មតាដែលធ្វើអោយរូបព្រិលដូចជ័រ AI Denoise អាចលុបគ្រាប់ Noise ចេញរលីង តែនៅរក្សាសាច់រូបភាពអោយម៉ត់មុតស្រួច (Sharp) ដូចដើម។ ប្រើវាសម្រាប់រូបថតពេលយប់ ឬរូបថត ISO ខ្ពស់ ធានាថាភ្ញាក់ផ្អើល! 🌌✨" },
    { keys: ['sync', 'auto sync', 'កែម្ដងច្រើន', 'batch edit'], answer: "សួស្ដីបង! ⚡ បើបងមានរូបរាប់រយសន្លឹកក្នុងប្លង់តែមួយ ចង់កែអោយលឿន បងត្រូវប្រើមុខងារ **Sync Settings**!\n\nគ្រាន់តែកែរូបទី ១ អោយស្អាត រួច Select រូបផ្សេងទៀតទាំងអស់ ហើយចុចប៊ូតុង **Sync (ឬ Auto Sync)** នោះរាល់ការកែប្រែទាំងអស់ (ពន្លឺ, ពណ៌) នឹងហោះទៅចូលគ្រប់រូបភាពទាំងអស់ត្រឹម ១ វិនាទី! មិនបាច់អង្គុយកែមួយៗអោយហត់ទេបង! 🚀" },
    { keys: ['dodge', 'burn', 'គូសពន្លឺ'], answer: "ជម្រាបសួរ! 🖌️ បច្ចេកទេស **Dodge & Burn** គឺជាក្បួនកែប្រែកម្រិតខ្ពស់តាំងពីសម័យលាងរូបក្នុងបន្ទប់ងងឹតមកម្ល៉េះ៖\n\n- **Dodge:** គឺការប្រើ Brush គូសបញ្ចេញពន្លឺអោយភ្លឺ (Brighten) លើកន្លែងសំខាន់ៗ ដូចជាកែវភ្នែក ឬឆ្អឹងថ្ពាល់។\n- **Burn:** គឺការគូសអោយងងឹត (Darken) នៅតាមគែមមុខ ឬស្រមោល ដើម្បីបង្កើតទម្រង់មុខអោយកាន់តែមានជម្រៅ និង 3D។ វាជាអាថ៌កំបាំងរូប Portrait របស់ Pro! 🗿" },
    { keys: ['panorama', 'pano', 'ថតរូបវែង', 'merge'], answer: "សួស្ដីបង! 🏔️ ចង់បានរូបទេសភាពវែង (Panorama) តែលេនថតអត់អស់មែនទេ?\n\nបងគ្រាន់តែថតរូបផ្តេកតៗគ្នា (អោយត្រួតស៊ីគ្នាបន្តិចៗ) រួច Select រូបទាំងអស់ក្នុង Lightroom > Right Click > **Photo Merge > Panorama**។ Lightroom នឹងដេររូបទាំងនោះចូលគ្នាជារូបតែមួយដ៏ធំ មិនបាត់បង់គុណភាព RAW ឡើយ! ស្រួលអត់បង? 🖼️" },
    { keys: ['hdr merge', 'hdr', 'high dynamic range'], answer: "ជម្រាបសួរ! 🌅 **HDR (High Dynamic Range)** ល្អបំផុតពេលថតបញ្ច្រាស់ថ្ងៃខ្លាំងមែនទែន ដែលកាមេរ៉ាមិនអាចចាប់ពន្លឺបានស្មើគ្នា។\n\nបងគ្រាន់តែថត ៣ សន្លឹក (១ភ្លឺ, ១ល្មម, ១ងងឹត) រួច Select ទាំង៣ ក្នុង Lightroom > Right Click > **Photo Merge > HDR**។ វានឹងលាយរូបទាំង៣បញ្ចូលគ្នា យកមេឃរូបងងឹត និងយកដីរូបភ្លឺ មករួមបញ្ចូលគ្នាបានស្អាតឥតខ្ចោះ! 📸" },
    { keys: ['color cast', 'ជាប់ពណ៌'], answer: "សួស្ដីបង! 🤢 ធ្លាប់ថតក្រោមដើមឈើ ហើយមុខមនុស្សជាប់ពណ៌បៃតងអត់? ហ្នឹងហើយគេហៅថា **Color Cast**!\n\nដើម្បីជួសជុល៖\n១. ប្រើប្រាស់ **Tint** ទាញទៅរកពណ៌ Magenta (+) បន្តិចដើម្បីស៊ីសងជាមួយពណ៌បៃតង។\n២. បើមិនទាន់បាត់ ចូល HSL > Green > បន្ថយ Saturation របស់វាចោលបន្តិចទៅ។ មុខនឹងត្រលប់មកពណ៌ដើមវិញហើយ! 🧪" },

    { keys: ['ស្បែកមុខ', 'សម៉ត់', 'smooth', 'skin', 'មុខស', 'retouch'], answer: "សួស្ដីបង! ✨ ដើម្បីកែស្បែកមុខឱ្យសម៉ត់រលោង (Skin Retouching) ក្នុង Lightroom នេះជាក្បួនសម្ងាត់៖\n\n១. ចូលទៅ **Color > Color Mix > Orange**:\n   - បង្កើន Luminance (+) ដើម្បីឱ្យស្បែកភ្លឺស។\n   - បន្ថយ Saturation (-) បន្តិចកុំឱ្យស្បែកលឿងពេក។\n២. ចូលទៅ **Effects > Texture**:\n   - ទាញ Texture ចុះ (-10 ទៅ -20) ដើម្បីធ្វើឱ្យស្បែករលោង តែមិនបាត់បង់ភាពច្បាស់របស់ភ្នែកនិងសក់។ (កុំទាញ Clarity ចុះ ព្រោះវាធ្វើឱ្យរូបមើលទៅព្រិលៗដូចជ័រ!) 💆‍♀️" },
    { keys: ['teal', 'orange', 'teal & orange', 'teal and orange'], answer: "ជម្រាបសួរ! 🎬 ពណ៌ **Teal & Orange** គឺជាស្តាយកុនហូលីវូដ (Cinematic Look) ដ៏ល្បីល្បាញបំផុត!\n\nដើម្បីបង្កើតវា សូមអនុវត្តតាមនេះ៖\n១. ចូលទៅ **Color Grading (ឬ Split Toning)**:\n   - **Shadows (ងងឹត):** ដាក់ពណ៌ Teal (ខៀវទឹកប៊ិច Hue ខ្ទង់ 210-230)។\n   - **Highlights (ភ្លឺ):** ដាក់ពណ៌ Orange (ទឹកក្រូច Hue ខ្ទង់ 30-45)។\n២. បើកប្រើ **Tone Curve** ហើយទាញទម្រង់អក្សរ S ដើម្បីឱ្យមាន Contrast ខ្លាំង។\nស្បែកតួអង្គនឹងលេចធ្លោចេញពីផ្ទៃខាងក្រោយពណ៌ខៀវយ៉ាងអស្ចារ្យ! 🍿" },
    { keys: ['បច្ចេកទេសថតរូប', 'ថតរូប', 'technique'], answer: "បច្ចេកទេសថតរូបសំខាន់ៗមានដូចជា Rule of Thirds, Leading Lines, និង ការប្រើប្រាស់ពន្លឺ (Lighting)។" },
    { keys: ['vintage', 'សម័យមុន', 'បុរាណ'], answer: "ដើម្បីកែរូបបែប Vintage បងអាចបន្ថយ Contrast ប្រើ Tone Curve ទាញចំណុចខ្មៅឡើងលើបន្តិច និងបន្ថែមគ្រាប់ Grain។" },
    { keys: ['ព្រឹកព្រលឹម', 'morning', 'ព្រឹក'], answer: "រូបថតពេលព្រឹកគួរកែពន្លឺឱ្យទន់ (បន្ថយ Contrast) និងទាញ Temp ទៅរកពណ៌លឿងបន្តិចដើម្បីបានភាពកក់ក្ដៅ។" },
    { keys: ['ថ្ងៃត្រង់', 'ក្ដៅ', 'noon'], answer: "ពេលថតរូបថ្ងៃត្រង់ ស្រមោលមុខច្រើនតែខ្មៅកាត់គ្នាខ្លាំង។ បងត្រូវទាញ Shadows បូក (+) ឱ្យខ្លាំង និង Highlights ដក (-) ដើម្បីកុំឱ្យឆេះ។" },
    { keys: ['ក្រហម', 'red'], answer: "ពណ៌ក្រហមតំណាងឱ្យថាមពល និងការទាក់ទាញ! ទាញ Vibrance ឬ Saturation ពណ៌ក្រហមឡើងបន្តិច ធ្វើឱ្យតួអង្គលេចធ្លោ។" },
    { keys: ['aspect ratio', '4:5', 'ទំហំរូប'], answer: "Aspect Ratio 4:5 គឺជាទំហំស្តង់ដារល្អបំផុតសម្រាប់ផុសលើ Instagram ព្រោះវាបង្ហាញពេញអេក្រង់ទូរស័ព្ទល្អ។" },
    { keys: ['cyberpunk', 'neon'], answer: "ស្តាយ Cyberpunk ផ្តោតលើការកែពណ៌ Tint ទៅរកពណ៌ស្វាយ (Magenta) និង Temp ទៅរកពណ៌ខៀវ រួមជាមួយនឹង Contrast ខ្លាំង។" },
    { keys: ['pre-wedding', 'pre wedding', 'រោងការ'], answer: "សម្រាប់រូប Pre-wedding គេនិយមប្រើស្តាយ 'Bright & Airy'។ បង្កើន Exposure បន្តិច បន្ថយ Contrast នឹងទាញស្បែកមុខឱ្យភ្លឺរលោង។" },
    { keys: ['ងងឹតមុខ', 'underexposed'], answer: "បើមុខងងឹត បងគ្រាន់តែចូល Basic ហើយទាញ Shadows ឡើង (+) ឬប្រើ Radial Mask គូសលើមុខរួចបង្កើន Exposure។" },
    { keys: ['មេឃ', 'ខៀវ', 'sky', 'blue'], answer: "ដើម្បីធ្វើឱ្យមេឃពណ៌ខៀវដិត ស្អាត បងអាចចូលទៅកាន់ Color Mix ជ្រើសរើសពណ៌ Blue រួចបន្ថយ Luminance ចុះក្រោម (-) និងបង្កើន Saturation ឡើងបន្តិច (+)។" },
    { keys: ['ស្លឹកឈើ', 'បៃតងខ្មៅ', 'green'], answer: "ចង់បានស្លឹកឈើបៃតងខ្មៅ ចូលទៅ HSL យកពណ៌ Green រួចបន្ថយ Luminance និង Saturation របស់វាចុះ។" },

    { keys: ['watermark', 'ឡូហ្គោ', 'logo', 'ចុះហត្ថលេខា'], answer: "សួស្ដីបង! © ការដាក់ **Watermark (ឡូហ្គោ ឬហត្ថលេខា)** ការពាររូបភាពកុំអោយគេលួចយកទៅប្រើ។\n\nក្នុង Lightroom ពេលចុច Export សូមស្វែងរកប្រអប់ 'Watermarking'។ បងអាចវាយជាអក្សរ ឬ Upload File PNG ដែលជា Logo របស់បង ហើយសារ៉េកម្រិតព្រិល (Opacity) ប្រហែល 30% ទៅ 50% រួចដាក់នៅជ្រុងខាងក្រោម។ កុំអោយវាធំពេកបិទបាំងភាពស្អាតនៃរូបភាពយើងណា៎! 🖋️" },
    { keys: ['print', 'dpi', 'ppi', 'ផ្តិតរូប', 'ព្រីន', 'resolution'], answer: "ជម្រាបសួរ! 🖨️ បើបងចង់ Export រូបយកទៅផ្តិត (Print) កុំភ្លេចកំណត់ **Resolution** អោយត្រូវ៖\n\nស្តង់ដារពិភពលោកសម្រាប់ការបោះពុម្ពរូបភាពអោយច្បាស់ម៉ត់ល្អ គឺត្រូវកំណត់ Resolution ស្មើនឹង **300 DPI (ឬ PPI)** ហើយ Save ជា Format **JPEG 100% Quality** នៅក្នុង Color Space ដើមរបស់វា។ ធានាថាផ្តិតចេញមកច្បាស់ឃើញរោមភ្នែកម៉ង! 🖼️" },
    { keys: ['srgb', 'adobergb', 'prophoto', 'color space', 'space'], answer: "សួស្ដីបង! 🎨 តើគួរជ្រើសរើស **Color Space** មួយណាពេល Export រូប?\n\n- **sRGB:** សម្រាប់ Post ចូល Facebook, IG, Web ឬមើលលើទូរស័ព្ទ។ (ប្រើអាហ្នឹងធានាពណ៌មិនប្រែប្រួល!)។\n- **AdobeRGB / ProPhoto RGB:** សម្រាប់អ្នកជំនាញដែលចង់យកទៅបោះពុម្ព (Print) ខ្នាតធំ។ បើបងយក AdobeRGB មកផុស Facebook ពណ៌នឹងប្រែទៅជាស្លេក និងស្រអាប់ភ្លាម! ប្រយ័ត្នណា៎! ⚠️" },
    { keys: ['instagram', 'ig', 'ផុស ig', 'ទំហំ ig'], answer: "ជម្រាបសួរ! 📱 សម្រាប់អ្នកលេង IG ចង់ផុសរូបអោយច្បាស់ និងទាញយកចំណាប់អារម្មណ៍អ្នកមើលបានច្រើន សូមកាត់រូប (Crop) ជាទំហំ **4:5 (Portrait)** ព្រោះវាស៊ីទំហំអេក្រង់ទូរស័ព្ទពេញល្អបំផុត។ ពេល Export កុំភ្លេចដាក់ Long Edge = **1080px** ទៅ **1350px** ដើម្បីកុំអោយ IG បង្រួមរូបបងអោយព្រិល! 💯" },
    { keys: ['raw', 'jpg', 'jpeg', 'ប្រភេទឯកសារ'], answer: "សួស្ដីបង! 📁 តើបងធ្លាប់ឆ្ងល់ទេថាហេតុអ្វីជាងថតអាជីពចូលចិត្តថត **RAW** ជាជាង JPEG?\n\n- **RAW File**: គឺជាទិន្នន័យស្រស់ៗពីសេនស័រកាមេរ៉ា។ វាផ្ទុកព័ត៌មានពន្លឺ និងពណ៌ច្រើនមហិមា! ពេលបងទាញ Shadows ដែលងងឹតឈឹង វានៅតែឃើញច្បាស់ មិនបែកគ្រាប់ទេ។\n- **JPEG**: ជារូបដែលកាមេរ៉ាកាត់តរួច និងបង្រួម (Compressed) វាតូចស្រួលប្រើមែន តែបងយកមកកែខ្លាំងមិនបានទេ វានឹងបែករូប (Color Banding)។\n\nបើអាច សូមកំណត់កាមេរ៉ាថត RAW ណា៎បង ការកែប្រែនឹងមានសេរីភាពជាងមុន ១០០ ដង! 📷✨" },
    { keys: ['tiff', 'png', 'heic', 'format', 'ប្រភេទឯកសារផ្សេងៗ'], answer: "សួស្ដីបង! 📁 ក្រៅពី RAW និង JPEG យើងមាន៖\n\n- **TIFF:** ឯកសារធំបំផុត មិនបាត់បង់គុណភាព (Lossless) ល្អបំផុតសម្រាប់បញ្ជូនទៅកាន់ Photoshop។\n- **PNG:** ល្អសម្រាប់រក្សាផ្ទៃខាងក្រោយថ្លា (Transparent) សម្រាប់ Logo ឬ Graphic។\n- **HEIC:** ទម្រង់ថ្មីរបស់ Apple តូចជាង JPEG ពាក់កណ្ដាលតែច្បាស់ដូចគ្នា។ បើមានជម្រើស គួរប្រើប្រាស់ទៅតាមកាលៈទេសៈណា៎! 📂" },

    { keys: ['astro', 'milky way', 'ផ្កាយ', 'មេឃយប់', 'star'], answer: "សួស្ដីបង! 🌌 ការកែរូបផ្កាយ ឬ **Milky Way** គឺអស្ចារ្យណាស់៖\n\n១. បង្កើន Exposure និង Shadows ដើម្បីទាញពន្លឺផ្កាយចេញមក។\n២. បង្កើន **Clarity និង Dehaze (+30 ទៅ +50)** ឧបករណ៍ ២ នេះនឹងធ្វើអោយហ្វូងផ្កាយលោតផ្លាតចេញពីផ្ទៃមេឃងងឹតយ៉ាងច្បាស់។\n៣. ប្រើ Color Noise Reduction ដើម្បីលុបគ្រាប់ Noise ពណ៌ខុសៗគ្នាដែលកើតមានពេលថត ISO ខ្ពស់យប់ងងឹត។ 🌠" },
    { keys: ['silhouette', 'ស្រមោលខ្មៅ', 'ថតស្រមោល'], answer: "ជម្រាបសួរ! 👤 ការថតទម្រង់ **Silhouette (ស្រមោលខ្មៅ)** គឺត្រូវថតដោយដាក់តួអង្គបញ្ច្រាស់ពន្លឺ (ទល់មុខព្រះអាទិត្យ)។\n\nដើម្បីកែវាអោយដិតល្អក្នុង Lightroom៖\n១. ទាញ Highlights ចុះ (-) ដើម្បីបង្ហាញពណ៌ផ្ទៃមេឃ។\n២. ទាញ **Shadows និង Blacks ចុះអោយខ្លាំង (-)** ដើម្បីធ្វើអោយតួអង្គក្លាយជាពណ៌ខ្មៅស្រអាប់ទាំងស្រុង។ រូបភាពនឹងមើលទៅមានសិល្បៈខ្លាំងណាស់! 🌅" },
    { keys: ['car', 'automotive', 'ឡាន', 'ម៉ូតូ'], answer: "សួស្ដីបង! 🏎️ សម្រាប់រូបថតរថយន្ត ឬម៉ូតូ គេនិយមភាពមុតស្រួច និងចែងចាំង (Edgy & Glossy)៖\n\n១. បង្កើន **Contrast និង Clarity (+20 ឡើង)** អោយសាច់ដែក និងថ្នាំឡានមើលទៅរឹងមាំ និងឆ្លុះពន្លឺ។\n២. ចូលទៅ Color Mix បន្ថយ Saturation ពណ៌ជុំវិញចោល (Desaturate) ទុកអោយលេចធ្លោតែពណ៌ឡានមួយបានហើយ។\n៣. បន្ថែម Vignette បន្តិច ឱ្យភ្នែកផ្តោតតែលើរថយន្ត។ កាចមែនទែនបង! 🏁" },
    { keys: ['real estate', 'ផ្ទះ', 'បន្ទប់', 'interior', 'architecture', 'អគារ'], answer: "ជម្រាបសួរ! 🏡 ថតអគារ ឬក្នុងបន្ទប់ (Interior / Real Estate) ត្រូវការភាពភ្លឺស្រឡះ និងត្រង់ល្អ៖\n\n១. រឿងធំបំផុត គឺចូលទៅ **Geometry** ជ្រើសយក **Upright (Auto)** ដើម្បីតម្រង់ជញ្ជាំងផ្ទះអោយត្រង់ភ្លឹង ៩០ ដឺក្រេ។\n២. ទាញ Shadows ឡើង (+) អោយបន្ទប់ភ្លឺច្បាស់ និងទាញ Highlights ចុះ (-) ដើម្បីកុំអោយឆេះពន្លឺតាមបង្អួច។\n៣. កែ Temp អោយត្រូវ កុំអោយលឿងពេកដោយសារភ្លើងអំពូល។ 🏠✨" },
    { keys: ['product', 'ផលិតផល', 'លក់អីវ៉ាន់'], answer: "សួស្ដីបង! 🛍️ ថតផលិតផលដើម្បីលក់ (Product Photography) អ្វីដែលសំខាន់បំផុតគឺ **ពណ៌ត្រូវតែពិតប្រាកដ ១០០%**៖\n\n១. ប្រើប្រាស់ប្រអប់ Auto White Balance ឬយកទុយយោបូមពណ៌ទៅចុចលើផ្ទៃពណ៌ស ឬប្រផេះក្នុងរូប ដើម្បីតម្រឹមពណ៌។\n២. បង្កើន Whites តិចតួចអោយផ្ទៃខាងក្រោយភ្លឺស្រឡះ (បើថតលើឆាកស)។\n៣. កុំប្រើ Filter ឬ Preset ប្ដូរពណ៌ (ដូចជា Teal & Orange) អោយសោះ ព្រោះវាធ្វើអោយពណ៌ផលិតផលខុសពីការពិត ភ្ញៀវអាចនឹងរអ៊ូបានណា៎! 📦" },
    { keys: ['rain', 'ភ្លៀង', 'ធ្លាក់ភ្លៀង', 'rainy'], answer: "ជម្រាបសួរ! 🌧️ រូបភាពក្នុងរដូវភ្លៀងសាកសមនឹង Mood បែបស្រងូតស្រងាត់ និងត្រជាក់ (Cinematic/Moody)៖\n\n១. ទាញ Temp ទៅរកពណ៌ខៀវ (-) បន្តិច និង Tint ទៅរកពណ៌បៃតងតិចតួច។\n២. បន្ថយ Vibrance ចុះអោយរូបមើលទៅស្រអាប់បន្តិច។\n៣. បង្កើន Clarity ឡើង ដើម្បីអោយគេអាចមើលឃើញតំណក់ទឹកភ្លៀង ឬផ្លូវសើមបានច្បាស់ល្អ។ ត្រជាក់ណាស់បងអើយ! ☔" },
    { keys: ['snow', 'ព្រិល', 'រងា', 'winter'], answer: "សួស្ដីបង! ❄️ ថតរូបនៅកន្លែងធ្លាក់ព្រិល កាមេរ៉ាច្រើនតែវាស់ពន្លឺខុស ធ្វើអោយព្រិលទៅជាងងឹត និងខៀវ៖\n\n១. បងត្រូវទាញ **Exposure (+) បូកបន្ថែម** ដើម្បីអោយព្រិលត្រឡប់មកសក្បុសវិញ។\n២. កែ White Balance ទាញ Temp អោយកក់ក្តៅបន្តិច (+) ប្រសិនបើព្រិលមើលទៅខៀវពេក។\n៣. បង្កើន Whites ប៉ុន្តែកុំអោយដល់កម្រិតឆេះព័ត៌មាន (Clipping) ណា៎បង! ⛄" },
    { keys: ['concert', 'club', 'event', 'ភ្លើងពណ៌', 'party'], answer: "ជម្រាបសួរ! 🎸 ថតក្នុងក្លឹប ឬ Concert ពោរពេញដោយភ្លើងពណ៌ Neon និងភាពងងឹត (High Contrast)៖\n\n១. ទាញ Highlights ចុះខ្លាំង ដើម្បីសង្គ្រោះភ្លើងឆាកកុំអោយឆេះ។\n២. ទាញ Shadows ឡើងបន្តិចដើម្បីឃើញមុខតួអង្គ ឬទស្សនិកជន។\n៣. សំខាន់បំផុត គឺប្រើ **Luminance Noise Reduction** ព្រោះរូបក្នុងទីងងឹតប្រាកដជាមានគ្រាប់ Noise ច្រើនដោយសារ ISO ខ្ពស់។ រាំអត់បង? 🕺💃" },
    { keys: ['dark academia', 'y2k', 'pastel', 'aesthetic', 'style ថ្មីៗ'], answer: "ជម្រាបសួរ! 💅 ស្ទីលកំពុងល្បីនៅលើ Social Media:\n\n- **Dark Academia:** បន្ថយ Exposure, បង្កើន Contrast, ប្រើ Tone Curve កាត់ខ្មៅ, និងដាក់ពណ៌ត្នោត/លឿងក្នុង Highlights។\n- **Y2K / Disposable Cam:** ប្រើកាមេរ៉ាបើក Flash រួចបង្កើន Contrast, Clarity និងបន្ថែម Grain អោយច្រើន។\n- **Pastel:** បង្កើន Exposure, បន្ថយ Contrast, និងទាញពណ៌ទាំងអស់អោយស្លេក (Desaturate) តែភ្លឺ (Luminance +)។ សាកស្ទីលមួយណាដែរថ្ងៃនេះ? 🦋" },
];

const findAIResponse = (input) => {
    const query = input.toLowerCase().trim();
    const match = KNOWLEDGE_BASE.find(item => item.keys.some(key => query.includes(key.toLowerCase())));
    if (match) return match.answer;

    const refusedTopics = ['video', 'song', 'music', 'game', 'hack', 'money', 'crypto'];
    if (refusedTopics.some(t => query.includes(t))) {
        return "សូមអភ័យទោសបង! 🚫 ខ្ញុំគឺជា AI ដែលបណ្ដុះបណ្ដាលឡើងពិសេសសម្រាប់តែការកែរូបភាពក្នុងកម្មវិធី Lightroom ប៉ុណ្ណោះ។\nបើបងមានចម្ងល់ពីការទាញពណ៌ ប្រើប្រាស់ឧបករណ៍នានា ឬស្វែងរក Preset ស្អាតៗ បងអាចសួរខ្ញុំបានជានិច្ចណា៎! 😊";
    }

    const randomFallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    return randomFallback;
};

const PRESET_MOODS = [
    { id: 'trend_bright_airy_1', name: 'Bright & Airy', color: 'from-blue-100 to-white' },
    { id: 'trend_teal_orange_1', name: 'Teal & Orange', color: 'from-teal-500 to-orange-500' },
    { id: 'mood_melancholic_1', name: 'Moody Dark', color: 'from-gray-700 to-gray-900' },
    { id: 'era_vintage_90s_1', name: 'Vintage Film', color: 'from-yellow-600 to-orange-700' },
    { id: 'trend_cyberpunk_1', name: 'Cyberpunk', color: 'from-pink-500 to-cyan-500' },
    { id: 'trend_cinematic_1', name: 'Cinematic', color: 'from-slate-700 to-slate-900' },
    { id: 'photo_wedding_1', name: 'Wedding Classic', color: 'from-rose-100 to-white' },
    { id: 'photo_portrait_1', name: 'Clean Portrait', color: 'from-orange-100 to-rose-100' },
    { id: 'photo_street_1', name: 'Urban Street', color: 'from-gray-600 to-slate-800' },
    { id: 'time_golden_1', name: 'Golden Hour', color: 'from-yellow-400 to-orange-500' },
    { id: 'photo_landscape_1', name: 'Nature Pop', color: 'from-green-500 to-emerald-700' },
    { id: 'photo_food_1', name: 'Tasty Food', color: 'from-yellow-400 to-orange-400' },
    { id: 'era_classic_bw_1', name: 'B&W Noir', color: 'from-black to-gray-500' },
    { id: 'mood_soft_pastel_1', name: 'Soft Pastel', color: 'from-pink-200 to-blue-200' },
    { id: 'photo_fashion_1', name: 'Fashion', color: 'from-purple-400 to-pink-400' },
    { id: 'time_night_neon_1', name: 'Night Neon', color: 'from-blue-900 to-purple-900' },
    { id: 'trend_dark_moody_1', name: 'Dark Moody', color: 'from-stone-800 to-stone-950' },
    { id: 'color_emerald_green_1', name: 'Forest Green', color: 'from-green-800 to-emerald-900' },
    { id: 'mood_happy_1', name: 'Portrait Glow', color: 'from-amber-200 to-yellow-100' },
    { id: 'trend_matte_black_1', name: 'Matte Black', color: 'from-zinc-600 to-zinc-800' }
];

const generateVariations = (baseId, category, baseName, baseParams, count) => {
    const variants = {};
    for (let i = 1; i <= count; i++) {
        const adjExposure = (baseParams.basic?.Exposure || 0) + (i === 2 ? 0.1 : (i === 3 ? -0.1 : 0));
        variants[`${baseId}_${i}`] = {
            id: `${baseId}_${i}`,
            category: category,
            name: count === 1 ? baseName : `${baseName} V${i}`,
            basic: { ...baseParams.basic, Exposure: Number(adjExposure.toFixed(2)) },
            grading: baseParams.grading || {},
            curveMaster: baseParams.curveMaster || [{x:0,y:0}, {x:25,y:25}, {x:50,y:50}, {x:75,y:75}, {x:100,y:100}],
            curveRed: baseParams.curveRed || [{x:0,y:0}, {x:25,y:25}, {x:50,y:50}, {x:75,y:75}, {x:100,y:100}],
            curveGreen: baseParams.curveGreen || [{x:0,y:0}, {x:25,y:25}, {x:50,y:50}, {x:75,y:75}, {x:100,y:100}],
            curveBlue: baseParams.curveBlue || [{x:0,y:0}, {x:25,y:25}, {x:50,y:50}, {x:75,y:75}, {x:100,y:100}]
        };
    }
    return variants;
};

// Professional Curve Templates
const sCurve = [{x:0,y:0}, {x:30,y:25}, {x:50,y:50}, {x:70,y:75}, {x:100,y:100}];
const popCurve = [{x:0,y:0}, {x:25,y:20}, {x:50,y:50}, {x:75,y:80}, {x:100,y:100}];
const filmCurve = [{x:0,y:8}, {x:25,y:28}, {x:50,y:50}, {x:75,y:75}, {x:100,y:95}];
const moodyCurve = [{x:0,y:4}, {x:25,y:22}, {x:50,y:48}, {x:75,y:78}, {x:100,y:98}];
const matteCurve = [{x:0,y:12}, {x:25,y:30}, {x:50,y:50}, {x:75,y:75}, {x:100,y:92}];
const fadedCurve = [{x:0,y:15}, {x:25,y:35}, {x:50,y:52}, {x:75,y:72}, {x:100,y:88}];

const BASE_PRESETS_DATA = {
    ...generateVariations("trend_teal_orange", "Trends & Cinematic", "Teal & Orange", { basic: { Contrast: 12, Highlights: -15, Shadows: 15, Temp: 5, Vibrance: 15 }, grading: { Shadows: { h: 215, s: 15, l: -5 }, Highlights: { h: 35, s: 10, l: 5 } }, curveMaster: sCurve }, 3),
    ...generateVariations("trend_cinematic", "Trends & Cinematic", "Cinematic Film", { basic: { Contrast: 10, Highlights: -10, Shadows: 10, Clarity: 5, Vibrance: -5 }, grading: { Shadows: { h: 200, s: 10, l: 0 }, Midtones: { h: 45, s: 5, l: 0 } }, curveMaster: filmCurve }, 3),
    ...generateVariations("trend_bright_airy", "Trends & Cinematic", "Bright & Airy", { basic: { Exposure: 0.3, Contrast: -5, Highlights: -20, Shadows: 20, Whites: 10, Blacks: 5, Temp: 5, Vibrance: 15 }, curveMaster: [{x:0,y:5}, {x:25,y:30}, {x:50,y:55}, {x:75,y:80}, {x:100,y:100}] }, 3),
    ...generateVariations("trend_dark_moody", "Trends & Cinematic", "Dark & Moody", { basic: { Exposure: -0.2, Contrast: 15, Highlights: -25, Shadows: -5, Blacks: 10, Vibrance: -10, Clarity: 10, Vignette: -15 }, curveMaster: moodyCurve }, 3),
    ...generateVariations("trend_cyberpunk", "Trends & Cinematic", "Cyberpunk", { basic: { Exposure: 0.1, Contrast: 20, Highlights: -15, Shadows: 10, Whites: 5, Blacks: -10, Temp: -15, Tint: 25, Vibrance: 25, Saturation: 5, Clarity: 15, Dehaze: 10 }, curveMaster: popCurve, curveBlue: [{x:0,y:0}, {x:50,y:48}, {x:100,y:100}] }, 3),
    ...generateVariations("trend_matte_black", "Trends & Cinematic", "Matte Black", { basic: { Exposure: 0.1, Contrast: 10, Highlights: -10, Shadows: 5, Whites: -5, Blacks: 15, Saturation: -5, Vignette: -10 }, curveMaster: matteCurve }, 3),
    ...generateVariations("trend_orange_brown", "Trends & Cinematic", "Orange & Brown", { basic: { Exposure: -0.1, Contrast: 15, Highlights: -15, Shadows: 15, Temp: 10, Tint: 5, Vibrance: -10, Saturation: -5 }, grading: { Shadows: { h: 30, s: 15, l: -5 }, Highlights: { h: 40, s: 10, l: 5 } }, curveMaster: moodyCurve }, 3),
    ...generateVariations("trend_hdr_crisp", "Trends & Cinematic", "HDR Crisp", { basic: { Contrast: 5, Highlights: -40, Shadows: 40, Whites: 10, Blacks: -10, Vibrance: 20, Clarity: 20, Dehaze: 10 }, curveMaster: sCurve }, 3),

    ...generateVariations("mood_happy", "Moods & Feelings", "Happy & Joy", { basic: { Exposure: 0.15, Contrast: 5, Highlights: -15, Shadows: 20, Vibrance: 25, Temp: 5, Tint: 2 }, curveMaster: sCurve }, 3),
    ...generateVariations("mood_sad", "Moods & Feelings", "Sad & Lonely", { basic: { Exposure: -0.15, Contrast: 10, Shadows: 5, Blacks: 15, Temp: -10, Vibrance: -20, Saturation: -10, Vignette: -15 }, curveMaster: filmCurve, curveBlue: [{x:0,y:5}, {x:50,y:50}, {x:100,y:100}] }, 3),
    ...generateVariations("mood_soft_pastel", "Moods & Feelings", "Soft Pastel", { basic: { Exposure: 0.15, Contrast: -10, Highlights: -10, Shadows: 15, Temp: 2, Tint: 10, Vibrance: 15, Clarity: -10 }, curveMaster: filmCurve }, 3),
    ...generateVariations("mood_dreamy", "Moods & Feelings", "Dreamy Soft", { basic: { Exposure: 0.1, Contrast: -15, Highlights: -5, Shadows: 15, Temp: 0, Tint: 10, Clarity: -15, Dehaze: -10 }, curveMaster: fadedCurve }, 3),
    ...generateVariations("mood_romantic", "Moods & Feelings", "Romantic Love", { basic: { Exposure: 0.05, Contrast: 5, Highlights: -15, Shadows: 20, Temp: 8, Tint: 5, Vibrance: 15, Clarity: -5 }, curveMaster: sCurve, curveRed: [{x:0,y:0}, {x:50,y:52}, {x:100,y:100}] }, 3),
    ...generateVariations("mood_melancholic", "Moods & Feelings", "Melancholic", { basic: { Exposure: -0.15, Contrast: 15, Highlights: -20, Shadows: -5, Blacks: 10, Temp: -5, Tint: -2, Vibrance: -25 }, grading: { Shadows: { h: 220, s: 10, l: -5 } }, curveMaster: moodyCurve }, 3),
    ...generateVariations("mood_energetic", "Moods & Feelings", "Energetic Vibe", { basic: { Exposure: 0.05, Contrast: 15, Highlights: -10, Shadows: 10, Temp: 2, Tint: 2, Vibrance: 30, Saturation: 5, Clarity: 10 }, curveMaster: popCurve }, 3),

    ...generateVariations("era_vintage_90s", "Eras & Vintage", "Vintage 90s", { basic: { Contrast: -5, Highlights: -15, Shadows: 20, Blacks: 15, Temp: 10, Tint: 5, Clarity: -5, Vignette: -10 }, curveMaster: [{x:0,y:10}, {x:30,y:30}, {x:70,y:70}, {x:100,y:90}], curveRed: [{x:0,y:2}, {x:50,y:50}, {x:100,y:100}] }, 3),
    ...generateVariations("era_retro_80s", "Eras & Vintage", "Retro 80s", { basic: { Contrast: 10, Temp: -2, Tint: 15, Vibrance: 20 }, curveMaster: sCurve, curveBlue: [{x:0,y:8}, {x:50,y:50}, {x:100,y:95}] }, 3),
    ...generateVariations("era_classic_bw", "Eras & Vintage", "B&W Noir", { basic: { Exposure: -0.15, Contrast: 35, Highlights: -25, Shadows: 15, Whites: -15, Blacks: -25, Saturation: -100, Clarity: 15 }, curveMaster: [{x:0,y:0}, {x:25,y:18}, {x:50,y:45}, {x:75,y:80}, {x:100,y:100}] }, 3),
    ...generateVariations("era_polaroid_70s", "Eras & Vintage", "70s Polaroid", { basic: { Contrast: -10, Highlights: -20, Shadows: 25, Blacks: 20, Temp: 15, Tint: 10, Vibrance: -5, Clarity: -10 }, curveMaster: fadedCurve, curveGreen: [{x:0,y:5}, {x:50,y:50}, {x:100,y:95}] }, 3),
    ...generateVariations("era_y2k_disposable", "Eras & Vintage", "Y2K Disposable", { basic: { Exposure: 0.15, Contrast: 20, Highlights: -10, Shadows: -5, Whites: 15, Temp: -2, Tint: 5, Saturation: 10, Clarity: 5 }, curveMaster: popCurve, curveBlue: [{x:0,y:5}, {x:50,y:48}, {x:100,y:100}] }, 3),
    ...generateVariations("era_sepia", "Eras & Vintage", "Sepia Antique", { basic: { Contrast: 10, Highlights: -10, Shadows: 10, Saturation: -100, Clarity: 5 }, grading: { Midtones: { h: 35, s: 20, l: 0 }, Shadows: { h: 30, s: 15, l: -2 } }, curveMaster: filmCurve }, 3),
    ...generateVariations("era_cine_nostalgia", "Eras & Vintage", "Cine Nostalgia", { basic: { Exposure: -0.05, Contrast: -2, Highlights: -15, Shadows: 15, Blacks: 10, Temp: 5, Vibrance: -10 }, curveMaster: matteCurve, curveBlue: [{x:0,y:8}, {x:50,y:50}, {x:100,y:90}] }, 3),

    ...generateVariations("time_golden", "Time & Seasons", "Golden Hour", { basic: { Contrast: 10, Highlights: -25, Shadows: 15, Temp: 15, Tint: 2, Vibrance: 20 }, grading: { Highlights: { h: 45, s: 15, l: 2 } }, curveMaster: sCurve }, 3),
    ...generateVariations("time_blue_hour", "Time & Seasons", "Blue Hour", { basic: { Contrast: 5, Shadows: 10, Temp: -15, Tint: -2, Vibrance: 15 }, grading: { Shadows: { h: 220, s: 15, l: 0 } } }, 3),
    ...generateVariations("time_night_neon", "Time & Seasons", "Night Neon", { basic: { Contrast: 15, Highlights: -10, Shadows: 10, Temp: -10, Tint: 10, Vibrance: 25, Clarity: 10 }, curveMaster: moodyCurve }, 3),
    ...generateVariations("time_dawn_mist", "Time & Seasons", "Dawn Mist", { basic: { Exposure: 0.1, Contrast: -5, Highlights: -10, Shadows: 20, Temp: -5, Tint: 2, Clarity: -10, Dehaze: -5 }, curveMaster: fadedCurve }, 3),
    ...generateVariations("time_high_noon", "Time & Seasons", "High Noon", { basic: { Contrast: 2, Highlights: -30, Shadows: 25, Whites: -5, Blacks: -2, Temp: -2, Vibrance: 10 }, curveMaster: [{x:0,y:0}, {x:25,y:30}, {x:50,y:50}, {x:75,y:70}, {x:100,y:100}] }, 3),
    ...generateVariations("time_autumn", "Time & Seasons", "Autumn Leaves", { basic: { Contrast: 10, Highlights: -15, Shadows: 15, Temp: 10, Tint: 2, Vibrance: 20 }, grading: { Highlights: { h: 35, s: 10, l: 0 } }, curveMaster: sCurve, curveGreen: [{x:0,y:0}, {x:50,y:45}, {x:100,y:100}] }, 3),
    ...generateVariations("time_winter", "Time & Seasons", "Winter Cold", { basic: { Exposure: 0.05, Contrast: 10, Highlights: -5, Shadows: 5, Whites: 10, Temp: -15, Tint: 2, Vibrance: 5, Saturation: -5 }, curveMaster: popCurve, curveBlue: [{x:0,y:0}, {x:50,y:52}, {x:100,y:100}] }, 3),

    ...generateVariations("photo_portrait", "Photography & Subjects", "Clean Portrait", { basic: { Exposure: 0.1, Contrast: 2, Highlights: -15, Shadows: 10, Temp: 4, Vibrance: 10, Clarity: -5, Texture: -5 }, curveMaster: [{x:0,y:2}, {x:25,y:26}, {x:50,y:50}, {x:75,y:76}, {x:100,y:98}] }, 3),
    ...generateVariations("photo_landscape", "Photography & Subjects", "Nature Pop", { basic: { Contrast: 10, Highlights: -30, Shadows: 25, Whites: 10, Blacks: -5, Vibrance: 25, Clarity: 10, Dehaze: 5 }, curveMaster: sCurve }, 3),
    ...generateVariations("photo_food", "Photography & Subjects", "Tasty Food", { basic: { Exposure: 0.1, Contrast: 12, Shadows: 10, Temp: 5, Vibrance: 20, Saturation: 2, Clarity: 8, Texture: 8 }, curveMaster: sCurve }, 3),
    ...generateVariations("photo_street", "Photography & Subjects", "Urban Street", { basic: { Contrast: 20, Highlights: -20, Shadows: 15, Blacks: -10, Vibrance: -5, Clarity: 15, Dehaze: 8, Vignette: -15 }, curveMaster: moodyCurve }, 3),
    ...generateVariations("photo_wedding", "Photography & Subjects", "Wedding Classic", { basic: { Exposure: 0.2, Contrast: 2, Highlights: -25, Shadows: 25, Temp: 2, Tint: 5, Vibrance: 10, Clarity: -2 }, curveMaster: [{x:0,y:5}, {x:30,y:32}, {x:70,y:72}, {x:100,y:95}] }, 3),
    ...generateVariations("photo_architecture", "Photography & Subjects", "Architecture", { basic: { Contrast: 15, Highlights: -25, Shadows: 20, Whites: 5, Blacks: -10, Saturation: -10, Clarity: 20, Texture: 10, Dehaze: 5 }, curveMaster: sCurve }, 3),
    ...generateVariations("photo_fashion", "Photography & Subjects", "Fashion", { basic: { Exposure: 0.05, Contrast: 15, Highlights: -10, Shadows: 5, Whites: 10, Blacks: -10, Vibrance: 10, Saturation: -5, Clarity: 5 }, grading: { Shadows: { h: 220, s: 5, l: 0 } }, curveMaster: popCurve }, 3),
    ...generateVariations("photo_macro", "Photography & Subjects", "Macro Nature", { basic: { Contrast: 8, Highlights: -15, Shadows: 15, Vibrance: 15, Clarity: 8, Texture: 15 }, curveMaster: sCurve }, 3),

    ...generateVariations("color_ruby_red", "Colors", "Ruby Red", { basic: { Contrast: 15, Vibrance: 20 }, grading: { Shadows: { h: 350, s: 15, l: 0 } }, curveRed: sCurve }, 3),
    ...generateVariations("color_emerald_green", "Colors", "Emerald Green", { basic: { Contrast: 10, Highlights: -20, Shadows: 10, Temp: -5, Tint: 5, Vibrance: 15 }, grading: { Shadows: { h: 140, s: 15, l: 0 } } }, 3),
    ...generateVariations("color_cobalt_blue", "Colors", "Cobalt Blue", { basic: { Contrast: 15, Temp: -15, Vibrance: 25 }, grading: { Shadows: { h: 220, s: 20, l: 0 } }, curveBlue: popCurve }, 3),
    ...generateVariations("color_golden_yellow", "Colors", "Golden Yellow", { basic: { Contrast: 5, Highlights: -15, Temp: 15, Tint: 5, Vibrance: 20 }, grading: { Highlights: { h: 45, s: 20, l: 0 } } }, 3),

    ...generateVariations("event_khmer_new_year", "Events", "Khmer New Year", { basic: { Exposure: 0.1, Contrast: 15, Highlights: -20, Shadows: 20, Temp: 10, Tint: 5, Vibrance: 25, Clarity: 10 }, curveMaster: popCurve }, 3),
    ...generateVariations("event_water_festival", "Events", "Water Festival", { basic: { Exposure: 0.05, Contrast: 20, Highlights: -30, Shadows: 15, Temp: -5, Vibrance: 30, Clarity: 15 }, curveMaster: sCurve }, 3),
    ...generateVariations("event_pchum_ben", "Events", "Pchum Ben", { basic: { Exposure: 0.1, Contrast: 5, Highlights: -15, Shadows: 25, Temp: 5, Vibrance: 15, Clarity: 5 }, curveMaster: filmCurve }, 3),
    ...generateVariations("event_christmas", "Events", "Christmas Vibes", { basic: { Contrast: 15, Highlights: -20, Shadows: 15, Temp: -5, Tint: 5, Vibrance: 20 }, grading: { Shadows: { h: 210, s: 15, l: -5 }, Highlights: { h: 350, s: 15, l: 5 } }, curveMaster: sCurve }, 3),
    ...generateVariations("event_halloween", "Events", "Spooky Halloween", { basic: { Exposure: -0.2, Contrast: 30, Highlights: -40, Shadows: -10, Whites: -10, Blacks: 20, Temp: 15, Tint: -15, Vibrance: -10, Clarity: 20 }, curveMaster: moodyCurve }, 3),
    ...generateVariations("event_valentine", "Events", "Valentine's Day", { basic: { Exposure: 0.15, Contrast: -5, Highlights: -15, Shadows: 15, Temp: 5, Tint: 15, Vibrance: 15, Clarity: -10 }, curveMaster: fadedCurve }, 3),
};

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
// 4. MAIN COMPONENTS
// ==========================================

const evaluateBasic = (xNorm, s) => {
    const b = s.blacks / 400;     
    const sh = s.shadows / 2000;    // <-- កែលេខ 400 ទៅ 800 នៅទីនេះ!
    const h = s.highlights / 800; 
    const w = s.whites / 400;
    let adjY = xNorm;
    if (xNorm < 0.25) { adjY += b * (1 - xNorm/0.25); }
    if (xNorm < 0.50) { adjY += sh * Math.sin(xNorm * Math.PI); }
    if (xNorm >= 0.50) { adjY += h * Math.sin((xNorm - 0.5) * Math.PI); }
    if (xNorm > 0.75) { adjY += w * ((xNorm - 0.75) / 0.25); }
    return Math.max(0, Math.min(1, adjY));
};

const evaluateSplineForFilter = (points, targetX) => {
    if (!points || points.length === 0) return targetX;
    if (targetX <= points[0].x) return points[0].y;
    if (targetX >= points[points.length - 1].x) return points[points.length - 1].y;
    
    let i = 0;
    while (i < points.length - 2 && targetX >= points[i + 1].x) i++;
    
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // បង្កើតចំណុចស្រមោល ដើម្បីឱ្យខ្សែកោងអាចបត់បាន (Rotate naturally)
    const p0 = i === 0 ? { x: p1.x - (p2.x - p1.x), y: p1.y - (p2.y - p1.y) } : points[i - 1];
    const p3 = i + 1 === points.length - 1 ? { x: p2.x + (p2.x - p1.x), y: p2.y + (p2.y - p1.y) } : points[i + 2];

    // Catmull-Rom Spline Tangents (ជួយឱ្យចំណុចកណ្តាលវិលបាន)
    const m1 = (p2.y - p0.y) / Math.max(1e-5, p2.x - p0.x);
    const m2 = (p3.y - p1.y) / Math.max(1e-5, p3.x - p1.x);

    const w = p2.x - p1.x;
    if (w === 0) return p1.y;
    
    const t = (targetX - p1.x) / w;
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const y = h00 * p1.y + h10 * w * m1 + h01 * p2.y + h11 * w * m2;
    return Math.max(0, Math.min(100, y));
};

const getChannelTable = (channelName, s) => {
    const numSamples = 30;
    const table = [];
    for(let i = 0; i <= numSamples; i++) {
        const x = i / numSamples;
        const basicOut = evaluateBasic(x, s);
        const masterOut = evaluateSplineForFilter(s.curveMaster, basicOut * 100) / 100;
        const finalOut = evaluateSplineForFilter(s[`curve${channelName}`], masterOut * 100) / 100;
        table.push(Math.max(0, Math.min(1, finalOut)).toFixed(3));
    }
    return table.join(' ');
};

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
  const [image, setImage] = useState("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1920&q=100");
  const [imageName, setImageName] = useState("Portrait");
  const [mode, setMode] = useState('manual');
  const fileInputRef = useRef(null);
  const curveSvgRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [gradingTab, setGradingTab] = useState('Shadows');
  const [gradingSync, setGradingSync] = useState(false);
  const [showBefore, setShowBefore] = useState(false); 
  const [showCurve, setShowCurve] = useState(false);
  const [activeCurveChannel, setActiveCurveChannel] = useState('Master');
  const [draggingPointIndex, setDraggingPointIndex] = useState(null);
  
  const initialCurve = [{x:0, y:0}, {x:100, y:100}];
  
  const defaultSettings = { 
      exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0, 
      redHue: 0, redSat: 0, redLum: 0, orangeHue: 0, orangeSat: 0, orangeLum: 0, yellowHue: 0, yellowSat: 0, yellowLum: 0, greenHue: 0, greenSat: 0, greenLum: 0, aquaHue: 0, aquaSat: 0, aquaLum: 0, blueHue: 0, blueSat: 0, blueLum: 0, purpleHue: 0, purpleSat: 0, purpleLum: 0, magentaHue: 0, magentaSat: 0, magentaLum: 0, 
      shadowHue: 0, shadowSat: 0, shadowLum: 0, midHue: 0, midSat: 0, midLum: 0, highlightHue: 0, highlightSat: 0, highlightLum: 0, gradingBlending: 50, gradingBalance: 0, 
      curveMaster: [...initialCurve], curveRed: [...initialCurve], curveGreen: [...initialCurve], curveBlue: [...initialCurve]
  };
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
        'ស្វាយ': 'purple', 'ផ្កាឈូក': 'pink', 'ស': 'white', 'ខ្មៅ': 'black', 'សោកសៅ': 'sad', 
        'កំសត់': 'sad', 'ឯកា': 'sad', 'សប្បាយ': 'happy', 'ញញឹម': 'happy', 'ស្រស់ស្រាយ': 'happy',
        'ស្រស់': 'fresh', 'ភ្លឺ': 'bright', 'ងងឹត': 'dark', 'អាហារ': 'food', 'យប់': 'night', 
        'ព្រឹក': 'morning', 'ព្រលឹម': 'morning', 'ថ្ងៃលិច': 'sunset', 'ធម្មជាតិ': 'nature', 
        'បុរាណ': 'vintage', 'អតីតកាល': 'vintage', 'សម័យមុន': 'retro', 'ហ្វីល': 'film', 
        'រោងការ': 'wedding', 'ការងារ': 'wedding', 'ទេសភាព': 'landscape', 'ផ្លូវ': 'street', 
        'ភាពយន្ត': 'cinematic', 'សមុទ្រ': 'teal', 'មេឃ': 'blue', 'ព្រៃ': 'forest',
        'សុបិន': 'dreamy', 'ទន់ភ្លន់': 'soft', 'អគារ': 'architecture', 'ឡាន': 'automotive', 
        'ម៉ូតូ': 'automotive', 'រដូវស្លឹកឈើជ្រុះ': 'autumn', 'រដូវរងា': 'winter', 
        'ត្រជាក់': 'winter', 'សិល្បៈ': 'art', 'រ៉ូមែនទិក': 'romantic', 'កក់ក្តៅ': 'warm',
        'ពណ៌ត្នោត': 'brown', 'កាហ្វេ': 'brown', 'មនុស្ស': 'portrait', 'ម៉ូដ': 'fashion',
        'ចូលឆ្នាំខ្មែរ': 'khmer new year', 'អុំទូក': 'water festival', 'ភ្ជុំបិណ្ឌ': 'pchum ben',
        'ណូអែល': 'christmas', 'បុណ្យណូអែល': 'christmas', 'នៃក្តីស្រលាញ់': 'valentine',
        'សង្សារ': 'valentine', 'ខ្មោច': 'halloween', 'បុណ្យ': 'event'
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
  
  // PERFORMANCE OPTIMIZATION: Memoize filter and color matrix
  // មុខងារជំនួយសម្រាប់បំប្លែង HSL ទៅជា RGB
  const hslToRgb = (h, s, l) => {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [f(0), f(8), f(4)];
  };
  const filterString = useMemo(() => {
      const exp = 100 + (settings.exposure * 10) - (settings.dehaze > 0 ? settings.dehaze * 0.1 : 0);
      const con = 100 + settings.contrast + (settings.clarity * 0.1) + (settings.dehaze * 0.2);
      const sat = 100 + settings.saturation + (settings.vibrance * 0.4);
      return `brightness(${exp}%) contrast(${con}%) saturate(${sat}%) url(#lr-adjustments)`;
  }, [settings.exposure, settings.dehaze, settings.contrast, settings.clarity, settings.saturation, settings.vibrance]);

  const colorMatrixValue = useMemo(() => {
      const temp = settings.temp / 100;
      const tint = settings.tint / 100;
      
      let r = 1 + (temp * 0.2) + (tint * 0.1);
      let g = 1 - (Math.abs(temp) * 0.05) - (tint * 0.15);
      let b = 1 - (temp * 0.2) + (tint * 0.1);

      // 1. Color Grading Simulation (ជាមួយ Blending និង Balance)
      // Balance: កំណត់ទម្ងន់រវាង Shadows និង Highlights (-100 ទៅ 100)
      const bal = settings.gradingBalance / 100;
      const shadowWeight = 1 - Math.max(0, bal);    // បើ Balance ទៅ + ឥទ្ធិពល Shadow ថយចុះ
      const highlightWeight = 1 + Math.min(0, bal); // បើ Balance ទៅ - ឥទ្ធិពល Highlight ថយចុះ
      
      // Blending: កំណត់ភាពរលាយចូលគ្នា (0 ដល់ 100)
      const blend = settings.gradingBlending / 100;
      
      if (settings.shadowSat > 0) {
          const [sr, sg, sb] = hslToRgb(settings.shadowHue, 100, 50);
          // គុណជាមួយ Weight និង Blending
          r += (sr - 0.5) * (settings.shadowSat / 100) * 0.8 * shadowWeight * (0.5 + blend * 0.5);
          g += (sg - 0.5) * (settings.shadowSat / 100) * 0.8 * shadowWeight * (0.5 + blend * 0.5);
          b += (sb - 0.5) * (settings.shadowSat / 100) * 0.8 * shadowWeight * (0.5 + blend * 0.5);
      }
      
      if (settings.highlightSat > 0) {
          const [hr, hg, hb] = hslToRgb(settings.highlightHue, 100, 50);
          // គុណជាមួយ Weight និង Blending
          r += (hr - 0.5) * (settings.highlightSat / 100) * 0.6 * highlightWeight * (0.5 + blend * 0.5);
          g += (hg - 0.5) * (settings.highlightSat / 100) * 0.6 * highlightWeight * (0.5 + blend * 0.5);
          b += (hb - 0.5) * (settings.highlightSat / 100) * 0.6 * highlightWeight * (0.5 + blend * 0.5);
      }

      // 2. Color Mix Basic Simulation
      let rOff = (settings.redSat + settings.orangeSat) * 0.001;
      let gOff = (settings.greenSat) * 0.001;
      let bOff = (settings.blueSat + settings.aquaSat) * 0.001;

      return `${r} 0 0 0 ${rOff}  0 ${g} 0 0 ${gOff}  0 0 ${b} 0 ${bOff}  0 0 0 1 0`;
  }, [
      settings.temp, settings.tint, 
      settings.shadowHue, settings.shadowSat, 
      settings.highlightHue, settings.highlightSat,
      settings.gradingBlending, settings.gradingBalance, // បន្ថែម Dependencies ថ្មី ២ នេះ
      settings.redSat, settings.orangeSat, settings.blueSat, settings.aquaSat, settings.greenSat
  ]);
  const tableRed = useMemo(() => getChannelTable('Red', settings), [settings.curveMaster, settings.curveRed, settings.blacks, settings.shadows, settings.highlights, settings.whites]);
  const tableGreen = useMemo(() => getChannelTable('Green', settings), [settings.curveMaster, settings.curveGreen, settings.blacks, settings.shadows, settings.highlights, settings.whites]);
  const tableBlue = useMemo(() => getChannelTable('Blue', settings), [settings.curveMaster, settings.curveBlue, settings.blacks, settings.shadows, settings.highlights, settings.whites]);

const handleDownload = () => { 
      const canvas = document.createElement('canvas'); 
      const ctx = canvas.getContext('2d'); 
      const img = new Image(); 
      img.crossOrigin = "anonymous"; 
      img.src = image; 
      img.onload = () => { 
          // 2. ការគ្រប់គ្រងទំហំរូបពេល Download (Canvas Memory Limits)
          const MAX_EDGE = 2048;
          let w = img.width;
          let h = img.height;
          if (w > MAX_EDGE || h > MAX_EDGE) {
              if (w > h) { h = Math.round((h * MAX_EDGE) / w); w = MAX_EDGE; } 
              else { w = Math.round((w * MAX_EDGE) / h); h = MAX_EDGE; }
          }
          canvas.width = w; 
          canvas.height = h; 
          
          // Apply the full filter (including SVG Tone Curve) so Download matches Preview exactly
          ctx.filter = filterString; // <--- ត្រូវប្រាកដថាប្រើឈ្មោះអថេរនេះ
          ctx.drawImage(img, 0, 0, w, h); 
          
          const link = document.createElement('a'); 
          link.download = `${imageName}_MD.jpg`; 
          link.href = canvas.toDataURL('image/jpeg', 1.0); 
          link.click(); 
      }; 
  };
  
  const handlePresetExport = () => { 
      const recipe = { 
          basic: { Exposure: settings.exposure, Contrast: settings.contrast, Highlights: settings.highlights, Shadows: settings.shadows, Whites: settings.whites, Blacks: settings.blacks, Temp: settings.temp, Tint: settings.tint, Vibrance: settings.vibrance, Saturation: settings.saturation, Texture: settings.texture, Clarity: settings.clarity, Dehaze: settings.dehaze, Vignette: settings.vignette }, 
          detail: { Sharpening: 40, Noise: 0, ColorNoise: 25 }, 
          colorMix: [ { color: 'Red', h: settings.redHue, s: settings.redSat, l: settings.redLum }, { color: 'Orange', h: settings.orangeHue, s: settings.orangeSat, l: settings.orangeLum }, { color: 'Yellow', h: settings.yellowHue, s: settings.yellowSat, l: settings.yellowLum }, { color: 'Green', h: settings.greenHue, s: settings.greenSat, l: settings.greenLum }, { color: 'Aqua', h: settings.aquaHue, s: settings.aquaSat, l: settings.aquaLum }, { color: 'Blue', h: settings.blueHue, s: settings.blueSat, l: settings.blueLum }, { color: 'Purple', h: settings.purpleHue, s: settings.purpleSat, l: settings.purpleLum }, { color: 'Magenta', h: settings.magentaHue, s: settings.magentaSat, l: settings.magentaLum } ], 
          grading: { Shadows: { h: settings.shadowHue, s: settings.shadowSat, l: settings.shadowLum }, Midtones: { h: settings.midHue, s: settings.midSat, l: settings.midLum }, Highlights: { h: settings.highlightHue, s: settings.highlightSat, l: settings.highlightLum }, Blending: settings.gradingBlending, Balance: settings.gradingBalance },
          curveMaster: settings.curveMaster,
          curveRed: settings.curveRed,
          curveGreen: settings.curveGreen,
          curveBlue: settings.curveBlue
      }; 
      const presetName = aiPrompt.trim() ? aiPrompt.trim() : "Custom_Preset";
      generateXMP(recipe, `${presetName}_MD`); 
  };
  
  const applyPresetToSettings = (presetData) => { 
      const b = presetData.basic; 
      const newSettings = { ...defaultSettings }; 
      if (b) { 
          if (b.Exposure !== undefined) newSettings.exposure = b.Exposure * 10; 
          if (b.Contrast !== undefined) newSettings.contrast = b.Contrast; 
          if (b.Highlights !== undefined) newSettings.highlights = b.Highlights; 
          if (b.Shadows !== undefined) newSettings.shadows = b.Shadows; 
          if (b.Whites !== undefined) newSettings.whites = b.Whites; 
          if (b.Blacks !== undefined) newSettings.blacks = b.Blacks; 
          if (b.Temp !== undefined) newSettings.temp = b.Temp; 
          if (b.Tint !== undefined) newSettings.tint = b.Tint; 
          if (b.Vibrance !== undefined) newSettings.vibrance = b.Vibrance; 
          if (b.Saturation !== undefined) newSettings.saturation = b.Saturation; 
          if (b.Clarity !== undefined) newSettings.clarity = b.Clarity; 
          if (b.Dehaze !== undefined) newSettings.dehaze = b.Dehaze; 
          if (b.Vignette !== undefined) newSettings.vignette = b.Vignette; 
      } 
      if (presetData.grading) { 
          if (presetData.grading.Shadows) { newSettings.shadowHue = presetData.grading.Shadows.h || 0; newSettings.shadowSat = presetData.grading.Shadows.s || 0; } 
          if (presetData.grading.Highlights) { newSettings.highlightHue = presetData.grading.Highlights.h || 0; newSettings.highlightSat = presetData.grading.Highlights.s || 0; } 
      }
      
      newSettings.curveMaster = presetData.curveMaster ? [...presetData.curveMaster] : [...initialCurve];
      newSettings.curveRed = presetData.curveRed ? [...presetData.curveRed] : [...initialCurve];
      newSettings.curveGreen = presetData.curveGreen ? [...presetData.curveGreen] : [...initialCurve];
      newSettings.curveBlue = presetData.curveBlue ? [...presetData.curveBlue] : [...initialCurve];
      
      setSettings(newSettings); 
  };
  const resetGroup = (items) => { const newSettings = { ...settings }; items.forEach(item => { newSettings[item.id] = 0; }); setSettings(newSettings); };

  // Fixed endpoints snapping + smoother render for the tone curve
  const activePoints = settings[`curve${activeCurveChannel}`];

  const getCurveCoords = (e) => {
      if (!curveSvgRef.current) return {x:0, y:0};
      const rect = curveSvgRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = 100 - (((clientY - rect.top) / rect.height) * 100);
      return { x, y };
  };

  const handleCurvePointerDown = (e) => {
      e.stopPropagation();
      const coords = getCurveCoords(e);
      const points = [...settings[`curve${activeCurveChannel}`]];
      
      let foundIndex = -1;
      let minDist = Infinity;
      // ឆែកមើលថាតើចុចប៉ះចំណុច (Points) ចាស់ៗដែលមានស្រាប់ឬទេ
      for (let i = 0; i < points.length; i++) {
          const dist = Math.hypot(points[i].x - coords.x, points[i].y - coords.y);
          const hitRadius = (i === 0 || i === points.length - 1) ? 35 : 20; 
          if (dist < hitRadius && dist < minDist) { 
              foundIndex = i;
              minDist = dist;
          }
      }

      if (foundIndex !== -1) {
          // បើចុចប៉ះចំណុចចាស់ អនុញ្ញាតឱ្យអូសវា
          setDraggingPointIndex(foundIndex);
      } else {
          // === នេះជាកន្លែងដែលកែប្រែថ្មី (Click on path only) ===
          
          // ១. គណនារកទីតាំងខ្សែ Y ពិតប្រាកដ នៅត្រង់អ័ក្ស X ដែលបងបានចុច
          const curveY = evaluateSplineForFilter(points, coords.x);
          
          // ២. ឆែកមើលថាទីតាំងដែលចុច (coords.y) គឺស្ថិតនៅក្បែរខ្សែ (គម្លាតមិនលើសពី 8 ឯកតា ដើម្បីងាយស្រួលចុចប៉ះដោយម្រាមដៃ)
          if (Math.abs(coords.y - curveY) <= 8 && coords.x > 2 && coords.x < 98) {
              
              // ៣. បន្ថែមចំណុចថ្មី ដោយបង្ខំវាឱ្យស្ថិតនៅចំកណ្តាលខ្សែ (curveY) ជានិច្ច
              points.push({x: coords.x, y: curveY});
              points.sort((a, b) => a.x - b.x);
              
              const newIndex = points.findIndex(p => p.x === coords.x && p.y === curveY);
              updateSetting(`curve${activeCurveChannel}`, points);
              setDraggingPointIndex(newIndex);
          }
      }
  };

  const handleCurvePointerMove = (e) => {
      if (draggingPointIndex === null) return;
      e.stopPropagation();
      const coords = getCurveCoords(e);
      const newPoints = [...settings[`curve${activeCurveChannel}`]];
      
      if (draggingPointIndex === 0) {
          if (coords.x > coords.y) {
              newPoints[0] = { x: Math.max(0, Math.min(newPoints[1].x - 1, coords.x)), y: 0 };
          } else {
              newPoints[0] = { x: 0, y: Math.max(0, Math.min(100, coords.y)) };
          }
      } else if (draggingPointIndex === newPoints.length - 1) {
          const distToTop = 100 - coords.y;
          const distToRight = 100 - coords.x;
          if (distToTop < distToRight) {
              newPoints[newPoints.length - 1] = { x: Math.max(newPoints[newPoints.length - 2].x + 1, Math.min(100, coords.x)), y: 100 };
          } else {
              newPoints[newPoints.length - 1] = { x: 100, y: Math.max(0, Math.min(100, coords.y)) };
          }
      } else {
          const minX = newPoints[draggingPointIndex - 1].x + 2;
          const maxX = newPoints[draggingPointIndex + 1].x - 2;
          newPoints[draggingPointIndex] = { 
              x: Math.max(minX, Math.min(maxX, coords.x)), 
              y: Math.max(0, Math.min(100, coords.y)) 
          };
      }
      updateSetting(`curve${activeCurveChannel}`, newPoints);
  };

  const handleCurvePointerUp = () => {
      setDraggingPointIndex(null);
  };

  const handleCurveDoubleClick = (e) => {
      e.stopPropagation();
      const coords = getCurveCoords(e);
      const points = [...settings[`curve${activeCurveChannel}`]]; // ទាញយកចំណុចនៃ Channel ត្រឹមត្រូវ
      
      for (let i = 1; i < points.length - 1; i++) { 
          const dist = Math.hypot(points[i].x - coords.x, points[i].y - coords.y);
          if (dist < 20) { 
              const newPoints = points.filter((_, idx) => idx !== i);
              updateSetting(`curve${activeCurveChannel}`, newPoints);
              break;
          }
      }
  };

  const renderSmoothCurve = () => {
      if (activePoints.length === 0) return "";
      if (activePoints.length === 1) return `M 0,${100 - activePoints[0].y} L 100,${100 - activePoints[0].y}`;

      let d = `M ${activePoints[0].x},${100 - activePoints[0].y}`;
      for (let i = 0; i < activePoints.length - 1; i++) {
          const p1 = activePoints[i];
          const p2 = activePoints[i + 1];
          const p0 = i === 0 ? { x: p1.x - (p2.x - p1.x), y: p1.y - (p2.y - p1.y) } : activePoints[i - 1];
          const p3 = i + 1 === activePoints.length - 1 ? { x: p2.x + (p2.x - p1.x), y: p2.y + (p2.y - p1.y) } : activePoints[i + 2];

          // ប្រើប្រាស់ Catmull-Rom Tangents គ្មានការ Clamp
          const m1 = (p2.y - p0.y) / Math.max(1e-5, p2.x - p0.x);
          const m2 = (p3.y - p1.y) / Math.max(1e-5, p3.x - p1.x);

          const w = p2.x - p1.x;
          const cp1x = p1.x + w / 3;
          const cp1y = p1.y + m1 * (w / 3);
          const cp2x = p2.x - w / 3;
          const cp2y = p2.y - m2 * (w / 3);

          d += ` C ${cp1x},${100 - cp1y} ${cp2x},${100 - cp2y} ${p2.x},${100 - p2.y}`;
      }
      
      if (activePoints[0].x > 0) d = `M 0,${100 - activePoints[0].y} L ` + d.substring(2);
      if (activePoints[activePoints.length - 1].x < 100) d += ` L 100,${100 - activePoints[activePoints.length - 1].y}`;
      return d;
  };

  const getCurveColor = () => {
      if (activeCurveChannel === 'Red') return '#EF4444';
      if (activeCurveChannel === 'Green') return '#22C55E';
      if (activeCurveChannel === 'Blue') return '#3B82F6';
      return isDarkMode ? '#E3E3E3' : '#1A1C1E'; 
  };
  
  const vignetteStyle = useMemo(() => { 
      const v = settings.vignette; 
      return v < 0 
          ? { background: `radial-gradient(circle, transparent ${60 + (v * 0.4)}%, rgba(0,0,0,${Math.abs(v)/100}))` } 
          : { background: `radial-gradient(circle, transparent ${60 - (v * 0.4)}%, rgba(255,255,255,${v/100}))` }; 
  }, [settings.vignette]);

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
  
  const sampleImages = [ 
      { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1920&q=100", label: "Portrait" }, 
      { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=100", label: "Golden Hour" }, 
      { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=100", label: "Night" }, 
      { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=100", label: "Nature" }, 
      { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1920&q=100", label: "Food" } 
  ];

  return (
    <div className={`rounded-3xl border flex flex-col h-full max-w-7xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6 relative z-0 ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 h-full overflow-hidden relative">
            <div className={`h-[50%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-4 shrink-0 px-2 pb-2 pt-2 lg:p-0 ${isDarkMode ? 'bg-[#121212]/40 lg:bg-transparent' : 'bg-[#FFFFFF]/40 lg:bg-transparent'}`}>
                <div 
                    className={`flex-1 rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center relative border group cursor-pointer touch-none select-none ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl' : 'bg-[#FFFFFF] border-[#E0E0E0] shadow-lg'}`}
                    onMouseDown={() => setShowBefore(true)}
                    onMouseUp={() => setShowBefore(false)}
                    onMouseLeave={() => setShowBefore(false)}
                    onTouchStart={() => setShowBefore(true)}
                    onTouchEnd={() => setShowBefore(false)}
                >
                    <div className="relative w-full h-full pointer-events-none">
                        <svg width="0" height="0" className="absolute pointer-events-none">
                            <filter id="lr-adjustments" colorInterpolationFilters="sRGB">
                                <feColorMatrix type="matrix" values={colorMatrixValue} />
                                <feComponentTransfer>
                                    <feFuncR type="table" tableValues={tableRed} />
                                    <feFuncG type="table" tableValues={tableGreen} />
                                    <feFuncB type="table" tableValues={tableBlue} />
                                </feComponentTransfer>
                            </filter>
                        </svg>
                        <img src={image} className="w-full h-full object-cover scale-110 transition-all duration-100 ease-linear" draggable="false" style={{ filter: showBefore ? 'none' : filterString }} />
                        <div className="absolute inset-0 pointer-events-none" style={showBefore ? {} : vignetteStyle}></div>
                    </div>
                    {showBefore && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md pointer-events-none animate-fade-in-up font-khmer">
                            រូបភាពដើម
                        </div>
                    )}
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
                                    <div className={`flex items-center justify-between pb-0 border-b ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-2 tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{group.icon} {group.group}</h4><button onClick={() => { if(group.group==='Light') { updateSetting('curveMaster', [...initialCurve]); updateSetting('curveRed', [...initialCurve]); updateSetting('curveGreen', [...initialCurve]); updateSetting('curveBlue', [...initialCurve]); } resetGroup(group.items); }} className={`text-[10px] transition-colors font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#FF8C33] hover:text-[#C65102]' : 'text-[#C65102] hover:text-[#A84502]'}`}>Reset</button></div>
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
                                        {group.group === 'Light' && (
    <div className="flex flex-col gap-3 mt-4">
        <button onClick={() => setShowCurve(!showCurve)} className={`w-full py-2.5 border rounded-xl text-xs font-bold font-khmer transition-all active:scale-95 flex items-center justify-between px-4 shadow-sm ${showCurve ? (isDarkMode ? 'bg-[#C65102]/20 border-[#C65102]/50 text-[#C65102]' : 'bg-[#C65102]/10 border-[#C65102]/30 text-[#C65102]') : (isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C] text-[#E3E3E3] hover:bg-[#3A3A3C]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#1A1C1E] hover:bg-[#E0E0E0]/50')}`}>
            <span className="flex items-center gap-2"><Activity size={14} className={showCurve ? "text-[#C65102]" : "text-[#C65102]"} /> ខ្សែកោង (Tone Curve)</span>
            {showCurve ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showCurve && (
            <div 
                className={`p-4 rounded-2xl border shadow-sm animate-fade-in-up ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}
                onMouseMove={draggingPointIndex !== null ? handleCurvePointerMove : undefined}
                onMouseUp={handleCurvePointerUp}
                onMouseLeave={handleCurvePointerUp}
                onTouchMove={draggingPointIndex !== null ? handleCurvePointerMove : undefined}
                onTouchEnd={handleCurvePointerUp}
            >
                <div className="flex justify-between items-center mb-3">
                    <p className={`text-[10px] font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>ចុចលើខ្សែដើម្បីបន្ថែម | ចុចពីរដងដើម្បីលុប</p>
                    <button onClick={() => updateSetting(`curve${activeCurveChannel}`, [...initialCurve])} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FAFAFA] text-[#5F6368] hover:text-[#1A1C1E]'}`} title="Reset Curve"><RotateCcw size={14}/></button>
                </div>
                <div className="flex gap-2 mb-4 justify-center relative z-20">
                    {['Master', 'Red', 'Green', 'Blue'].map(ch => (
                        <button 
                            key={ch} 
                            onClick={() => setActiveCurveChannel(ch)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${activeCurveChannel === ch ? 'bg-[#C65102] text-white shadow-md' : (isDarkMode ? 'bg-[#2C2C2E] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FAFAFA] border border-[#E0E0E0] text-[#5F6368] hover:text-[#1A1C1E]')}`}
                        >
                            <span className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${ch === 'Master' ? (isDarkMode ? 'bg-white' : 'bg-black') : (ch === 'Red' ? 'bg-[#EF4444]' : ch === 'Green' ? 'bg-[#22C55E]' : 'bg-[#3B82F6]')}`}></div>
                                {ch}
                            </span>
                        </button>
                    ))}
                </div>
                <div className={`w-full aspect-square rounded-xl border relative overflow-visible touch-none ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                   <svg 
                       ref={curveSvgRef}
                       width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
                       className="cursor-crosshair"
                       style={{ overflow: 'visible' }}
                       onPointerDown={handleCurvePointerDown}
                       onDoubleClick={handleCurveDoubleClick}
                   >
                       <rect x="-20" y="-20" width="140" height="140" fill="transparent" />
                       <line x1="25" y1="0" x2="25" y2="100" stroke={isDarkMode ? '#2C2C2E' : '#E0E0E0'} strokeWidth="0.5" />
                       <line x1="50" y1="0" x2="50" y2="100" stroke={isDarkMode ? '#2C2C2E' : '#E0E0E0'} strokeWidth="0.5" />
                       <line x1="75" y1="0" x2="75" y2="100" stroke={isDarkMode ? '#2C2C2E' : '#E0E0E0'} strokeWidth="0.5" />
                       <line x1="0" y1="25" x2="100" y2="25" stroke={isDarkMode ? '#2C2C2E' : '#E0E0E0'} strokeWidth="0.5" />
                       <line x1="0" y1="50" x2="100" y2="50" stroke={isDarkMode ? '#2C2C2E' : '#E0E0E0'} strokeWidth="0.5" />
                       <line x1="0" y1="75" x2="100" y2="75" stroke={isDarkMode ? '#2C2C2E' : '#E0E0E0'} strokeWidth="0.5" />
                       <line x1="0" y1="100" x2="100" y2="0" stroke={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth="0.5" strokeDasharray="4" />
                       <path d={renderSmoothCurve()} fill="none" stroke={getCurveColor()} strokeWidth="0.5" />
                       {activePoints.map((p, idx) => (
                           <circle 
                                key={idx} cx={p.x} cy={100 - p.y} r={draggingPointIndex === idx ? "3.5" : "2.8"}
                                fill={getCurveColor()} stroke={isDarkMode ? '#121212' : '#FFFFFF'} strokeWidth="1.5"
                                className="transition-all duration-100 ease-linear pointer-events-none drop-shadow-md"
               
                            />
                       ))}
                   </svg>
                </div>
            </div>
        )}
    </div>
)}
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
                                            <div className="grid grid-cols-2 gap-2">
                                                {PRESET_MOODS.map(s => (
                                                    <button key={s.id} onClick={() => { const presetToApply = BASE_PRESETS_DATA[s.id]; if (presetToApply) applyPresetToSettings(presetToApply); }} className={`relative h-12 border rounded-xl flex items-center justify-center overflow-hidden group transition-all duration-300 ease-spring active:scale-95 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#2C2C2C]/80 border-[#2C2C2C]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] border-[#E0E0E0]'}`}>
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${s.color} transition-opacity ${isDarkMode ? 'opacity-20 group-hover:opacity-30' : 'opacity-10 group-hover:opacity-20'}`}></div>
                                                        <span className={`capitalize text-[11px] font-bold z-10 tracking-wide font-khmer ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1"><h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}><ListIcon size={14} /> {aiPrompt ? 'Results' : 'Preset Mood Style'}</h4></div>
                                        
                                        {aiPrompt ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {filteredPresets.length > 0 ? (
                                                    filteredPresets.map((preset, idx) => (
                                                        <button key={preset.id || idx} onClick={() => applyPresetToSettings(preset)} className={`flex items-center justify-between p-3 border rounded-2xl transition-all duration-200 group active:scale-[0.98] text-left ${isDarkMode ? 'bg-[#2C2C2C]/50 hover:bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0]/50 border-[#E0E0E0]'}`}>
                                                            <div className="flex flex-col"><span className={`text-sm font-bold capitalize font-khmer ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{preset.name || preset.id.replace(/_/g, ' ')}</span><span className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{Object.keys(preset.grading || {}).length > 0 || preset.curveMaster ? 'Pro Grade' : 'Basic'}</span></div>
                                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br border flex items-center justify-center group-hover:border-[#C65102]/50 group-hover:shadow-[0_0_10px_rgba(198,81,2,0.3)] transition-all ${isDarkMode ? 'from-[#2C2C2C] to-[#1E1E1E] border-[#2C2C2C]' : 'from-[#FAFAFA] to-[#E0E0E0] border-[#E0E0E0]'}`}><div className={`w-2 h-2 rounded-full opacity-20 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-[#E3E3E3]' : 'bg-[#1A1C1E]'}`}></div></div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-10 opacity-50"><Filter className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} /><p className={`text-xs font-khmer ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>រកមិនឃើញ Presets សម្រាប់ "{aiPrompt}" ទេ</p></div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-6 pt-2">
                                                {Object.entries(
                                                    filteredPresets.reduce((acc, preset) => {
                                                        const cat = preset.category || 'General';
                                                        if (!acc[cat]) acc[cat] = [];
                                                        acc[cat].push(preset);
                                                        return acc;
                                                    }, {})
                                                ).map(([category, presets]) => (
                                                    <div key={category} className="space-y-2">
                                                        <h5 className={`text-[10px] font-bold uppercase tracking-widest pl-1 border-b pb-1 ${isDarkMode ? 'text-[#9AA0A6] border-[#2C2C2C]' : 'text-[#5F6368] border-[#E0E0E0]'}`}>{category}</h5>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {presets.map((preset, idx) => (
                                                                <button key={preset.id || idx} onClick={() => applyPresetToSettings(preset)} className={`flex items-center justify-between p-3 border rounded-2xl transition-all duration-200 group active:scale-[0.98] text-left ${isDarkMode ? 'bg-[#2C2C2C]/50 hover:bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0]/50 border-[#E0E0E0]'}`}>
                                                                    <div className="flex flex-col"><span className={`text-sm font-bold capitalize font-khmer ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{preset.name || preset.id.replace(/_/g, ' ')}</span><span className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{Object.keys(preset.grading || {}).length > 0 || preset.curveMaster ? 'Pro Grade' : 'Basic'}</span></div>
                                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br border flex items-center justify-center group-hover:border-[#C65102]/50 group-hover:shadow-[0_0_10px_rgba(198,81,2,0.3)] transition-all ${isDarkMode ? 'from-[#2C2C2C] to-[#1E1E1E] border-[#2C2C2C]' : 'from-[#FAFAFA] to-[#E0E0E0] border-[#E0E0E0]'}`}><div className={`w-2 h-2 rounded-full opacity-20 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-[#E3E3E3]' : 'bg-[#1A1C1E]'}`}></div></div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
      
      try {
          // Add slight natural delay
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
          
          let response = findAIResponse(msg);
          
          if (FALLBACK_RESPONSES.includes(response) && apiKey) {
              try {
                  const apiResponse = await callGemini(msg, "អ្នកគឺជាជំនួយការ AI របស់ My Design ជំនាញខាងកែរូបភាពជាមួយកម្មវិធី Lightroom។ សូមឆ្លើយតបជាភាសាខ្មែរយ៉ាងរួសរាយរាក់ទាក់ និងកម្រិតអាជីព។");
                  if (apiResponse) response = apiResponse;
              } catch (apiErr) {
                  throw apiErr; // បោះកំហុសទៅ Catch ខាងក្រោម
              }
          }
          
          setMessages(prev => [...prev, { role: 'model', text: response }]);
      } catch (error) {
          // នេះជាសារដែលលោតពេលមានបញ្ហា
          setMessages(prev => [...prev, { role: 'model', text: "សុំទោសបង! ប្រព័ន្ធអ៉ីនធឺណិតរាងខ្សោយបន្តិច ឬ API មានបញ្ហា សុំព្យាយាមម្ដងទៀត! 🌐⚠️" }]);
      } finally {
          setLoading(false);
      }
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
                <input type="search" value={input} onChange={e => setInput(e.target.value)} placeholder="សួរសំណួរ..." className={`flex-1 bg-transparent px-3 py-2.5 text-base outline-none h-full [&::-webkit-search-cancel-button]:hidden ${isDarkMode ? 'text-[#E3E3E3] placeholder:text-[#9AA0A6]' : 'text-[#1A1C1E] placeholder:text-[#5F6368]'}`} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" name="chat_input_unique_field_safe_v2" id="chat_input_unique_field_safe_v2" />
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