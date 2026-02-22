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
      ThumbsUp, User, Activity, Cloud, Copy, ClipboardPaste, SplitSquareHorizontal, Maximize
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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

let app, auth, db, appId;
try {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (error) {
    console.warn("Firebase config not found, running local only.");
}

// Haptic Feedback Helper Function (Pro Feature)
const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); // ញ័រតិចៗ 10ms
    }
};

const responseCache = {};

// --- TIPS LIST ---
const TIPS_LIST = [
    "ប្រើ 'Auto' ជាចំណុចចាប់ផ្តើមដ៏ល្អ បន្ទាប់មកសឹមសារ៉េបន្ថែមតាមចំណូលចិត្ត។", 
    "ចុចសង្កត់លើរូបភាព ដើម្បីមើលរូបដើម (Before) និងរូបដែលកែរួច (After) យ៉ាងរហ័ស។", 
    "ចុចពីរដង (Double Tap) លើរង្វង់មូលនៃ Slider ណាមួយ ដើម្បី Reset វាត្រឡប់ទៅលេខ 0 វិញភ្លាមៗ។", 
    "ប្រើម្រាមដៃពីរចុចលើអេក្រង់ពេលអូស Slider (Whites/Blacks) ដើម្បីមើល Clipping (កន្លែងដែលបាត់ព័ត៌មានរូប)។", 
    "កុំភ្លេចបើក 'Lens Correction' ជានិច្ច ដើម្បីលុបបំបាត់ភាពកោង និងគែមខ្មៅពីកែវថតកាមេរ៉ា។",
    "ប្រើប្រាស់ Masking (Select Subject / Sky) ដើម្បីកែតែផ្នែកខ្លះនៃរូបភាព ដោយមិនប៉ះពាល់ផ្ទៃទាំងមូល។",
    "ប្រើ 'Healing Brush' ដើម្បីបំបាត់ស្នាមមុន ឬវត្ថុរំខានផ្សេងៗចេញពីរូបភាពយ៉ាងងាយស្រួល។",
    "ចង់ឱ្យស្បែកមុខម៉ត់រលោង? ទាញ Texture ចុះក្រោម (-10 ទៅ -20) ជៀសវាងទាញ Clarity ព្រោះវាធ្វើឱ្យរូបមើលទៅដូចជ័រ។",
    "ដើម្បីឱ្យមេឃខៀវដិតស្អាត ចូលទៅ Color Mix (HSL) រួចទាញ Luminance នៃពណ៌ Blue ចុះក្រោម។",
    "ប្រើមុខងារ Color Grading (Shadows=Teal, Highlights=Orange) ដើម្បីទទួលបានស្តាយកុន Cinematic។",
    "ថតរូបនៅកន្លែងងងឹតមានគ្រាប់ Noise ច្រើន? ប្រើមុខងារ AI Denoise ដើម្បីលុបវាចេញដោយមិនបាត់បង់ភាពច្បាស់។",
    "កុំទាញ Saturation ខ្លាំងពេក! គួរប្រើ Vibrance ជំនួសវិញ ព្រោះវាជួយការពារពណ៌ស្បែកមនុស្សមិនឱ្យទៅជាពណ៌ទឹកក្រូចខ្លាំង។",
    "ការទាញ Highlights ចុះ (-) អាចជួយសង្គ្រោះពពក ឬពន្លឺដែលឆេះឱ្យលេចចេញមកវិញបានយ៉ាងអស្ចារ្យ។",
    "ការទាញ Shadows ឡើង (+) ជួយឱ្យផ្ទៃមុខដែលថតបញ្ច្រាស់ពន្លឺ (ងងឹត) ត្រលប់មកភ្លឺច្បាស់វិញ។",
    "ចង់ឱ្យរូបភាពមានជម្រៅ (Depth)? សាកល្បងទាញ Blacks ចុះ (-) បន្តិចដើម្បីឱ្យកន្លែងងងឹតកាន់តែដិតល្អ។",
    "ប្រើប្រាស់ Tone Curve ទម្រង់រាងអក្សរ 'S' ដើម្បីបង្កើតកម្រិត Contrast ដ៏ស្រស់ស្អាតនិងទន់ភ្លន់បំផុតកម្រិតអាជីព។",
    "ចង់បានរូបភាពស្តាយ Vintage អតីតកាល? ប្រើ Tone Curve រួចទាញចំណុចខ្មៅបំផុត (ខាងឆ្វេងក្រោម) ឡើងលើបន្តិច។",
    "កុំភ្លេចបន្ថែមគ្រាប់ Grain តិចតួចនៅក្នុងផ្នែក Effects ដើម្បីឱ្យរូបភាពមើលទៅមានសិល្បៈដូចថតនឹងកាមេរ៉ាហ្វីល។",
    "ប្រសិនបើរូបភាពមើលទៅស្រអាប់ដោយសារអ័ព្ទ ឬផ្សែង មុខងារ Dehaze ទាញទៅស្តាំ (+) អាចជួយលុបវាចេញបានភ្លាមៗ។",
    "បើចង់ផ្តោតការចាប់អារម្មណ៍ទៅលើតួអង្គ សូមបន្ថយ Vignette ទៅរកលេខដក (-) ដើម្បីធ្វើឱ្យគែមរូបភាពងងឹតបន្តិច។",
    "ដើម្បីកែស្បែកមុខឱ្យភ្លឺស ចូលទៅ HSL > Orange រួចទាញ Luminance ឡើងលើ (+)។",
    "ពណ៌បៃតងនៃស្លឹកឈើមើលទៅស្រស់ពេក? ចូល HSL > Green រួចបន្ថយ Saturation និង Luminance ដើម្បីឱ្យវាប្រែជាពណ៌បៃតងចាស់។",
    "មុខងារ Sync Settings អនុញ្ញាតឱ្យអ្នក Copy ការកែពណ៌ពីរូបមួយ ទៅរូបរាប់រយសន្លឹកទៀតត្រឹមតែមួយប៉ព្រិចភ្នែក!",
    "ប្រើប្រាស់ Versions (ឬ Snapshot) ដើម្បីរក្សាទុកការកែពណ៌របស់អ្នក មុននឹងសាកល្បងលេងពណ៌ថ្មី។",
    "បើថតក្រោមដើមឈើហើយមុខជាប់ពណ៌បៃតង (Color Cast) សូមទាញ Tint ទៅរកពណ៌ Magenta (+) បន្តិចដើម្បីតម្រឹមពណ៌វិញ។",
    "ការប្រើប្រាស់ Linear Gradient Mask គឺស័ក្តិសមបំផុតសម្រាប់កែពន្លឺផ្ទៃមេឃ ឬដី ឱ្យងងឹតឬភ្លឺស្មើៗគ្នា។",
    "ចង់លុបមនុស្ស ឬវត្ថុធំៗចេញពីរូប? ប្រើមុខងារ Clone Stamp ដោយចម្លងផ្ទៃល្អក្បែរនោះមកបិទពីលើ។",
    "ពេល Export រូបផុសលើ Facebook គួរដាក់ Quality 100% និង Long Edge = 2048px ដើម្បីរក្សាភាពច្បាស់ម៉ត់ល្អ។",
    "ពេល Export រូបផុសលើ Instagram គួរតែកាត់រូប (Crop) ជាទំហំ 4:5 ព្រោះវាស៊ីទំហំអេក្រង់ទូរស័ព្ទពេញល្អបំផុត។",
    "ព្យាយាមថតរូបជា File 'RAW' ជានិច្ច! វាផ្ទុកព័ត៌មានពន្លឺនិងពណ៌ច្រើនជាង JPEG ងាយស្រួលយកមកកែទាញ Shadows មិនបែកគ្រាប់។"
];

const SUGGESTED_QUESTIONS = [
    "តើ Tone Curve ប្រើសម្រាប់ធ្វើអ្វី?", 
    "របៀបកែពណ៌ស្បែកមុខឱ្យសម៉ត់?", 
    "តើ Dehaze និង Clarity ខុសគ្នាយ៉ាងម៉េច?",
    "របៀបបង្កើតស្តាយពណ៌ Teal & Orange?", 
    "របៀបលុបស្នាមមុនដោយប្រើ Healing Brush?", 
    "តើមុខងារ HSL / Color Mix ប្រើសម្រាប់អ្វី?", 
    "របៀប Copy ពណ៌ពីរូបមួយទៅរូបមួយទៀត?", 
    "តើ Color Grading ប្រើដើម្បីអ្វី?", 
    "របៀបកែរូបងងឹតមុខឱ្យភ្លឺមកវិញ?", 
    "តើ Snapshot និង Versions មានប្រយោជន៍អ្វី?", 
    "របៀបប្រើប្រាស់ AI Denoise លុបគ្រាប់ Noise?", 
    "របៀបធ្វើឱ្យផ្ទៃមេឃពណ៌ខៀវដិតស្អាត?", 
    "របៀបកែពណ៌ស្លឹកឈើឱ្យទៅជាពណ៌លឿងអតីតកាល?", 
    "តើអ្វីទៅជា Range Masking នៅក្នុង Lightroom?", 
    "របៀប Export រូបឱ្យច្បាស់ល្អសម្រាប់ Facebook/IG?", 
    "របៀបកែរូបម្ដងច្រើនសន្លឹកដោយប្រើ Sync?", 
    "ពន្យល់ពីបច្ចេកទេស Dodge និង Burn លើផ្ទៃមុខ", 
    "តើការកំណត់ Lens Profile Correction ជួយអ្វីខ្លះ?", 
    "របៀបកាត់រូប (Crop) ជាទំហំ 4:5 សម្រាប់ Instagram?", 
    "តើ Whites និង Highlights ខុសគ្នាម៉េច?", 
    "របៀបកែរូបទេសភាព (Landscape) ឱ្យលេចធ្លោ?", 
    "របៀបបន្ថែមគ្រាប់ Grain ឱ្យមើលទៅដូចកាមេរ៉ាហ្វីល?", 
    "តើអ្វីទៅជា Rating (ផ្កាយ) និង Flag នៅក្នុង Lightroom?", 
    "របៀបជួសជុលបញ្ហាជាប់ពណ៌បៃតងលើស្បែក (Color Cast)?",
    "តើគួរទាញ Blacks យ៉ាងម៉េចដើម្បីឱ្យរូបមានជម្រៅ?",
    "របៀបកែរូបភាពបែប Dark & Moody?",
    "តើ Vibrance ខុសពី Saturation យ៉ាងដូចម្តេច?"
]

// --- HELPER FUNCTIONS ---
const callGemini = async (prompt, systemInstruction = "", jsonMode = false) => {
  const cacheKey = prompt + (jsonMode ? "_json" : "");
  if (responseCache[cacheKey]) return responseCache[cacheKey];
  
  if (!apiKey) return null;

  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
  };

  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("Network response was not ok"); 

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
      throw error; 
  } 
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
    crs:ColorGradeMidtoneHue="${grading.Midtones?.h || 0}" crs:ColorGradeMidtoneSat="${grading.Midtones?.s || 0}" crs:ColorGradeMidtoneLum="${grading.Midtones?.l || 0}" crs:ColorGradeShadowLum="${grading.Shadows?.l || 0}" crs:ColorGradeHighlightLum="${grading.Highlights?.l || 0}" crs:ColorGradeBlending="${grading.Blending || 50}" crs:ColorGradeGlobalHue="${grading.Global?.h || 0}" crs:ColorGradeGlobalSat="${grading.Global?.s || 0}" crs:ColorGradeGlobalLum="${grading.Global?.l || 0}"
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

const SHORT_FALLBACK_RESPONSES = [
    "សុំទោសបងបាទ! ពាក្យខ្លីពេកខ្ញុំអត់សូវយល់ទេ។ តើបងចង់សួរពី 'របៀបកែពណ៌' ឬ 'មុខងារ Tone Curve' មែនទេបាទ?",
    "ពាក្យនេះថ្មីសម្រាប់ខ្ញុំបាទ! 😅 សុំបងសរសេរជាប្រយោគពេញបន្តិចមក ឧទាហរណ៍៖ 'តើ Dehaze ប្រើសម្រាប់ធ្វើអ្វី?'",
    "អូហូ! ខ្លីប្លែកបាទ! តើបងចង់មានន័យថាម៉េចដែរ? បងអាចសួរខ្ញុំពីបញ្ហាកែរូប ដូចជា 'ហេតុអីថតរូបមកងងឹតមុខ?' បានណា៎បាទ!",
    "ហឺម... ខ្ញុំទាយអត់ត្រូវទេបាទ។ តើបងកំពុងស្វែងរក 'Preset ហាងកាហ្វេ' ឬចង់ដឹងពី 'ISO' មែនទេ?",
    "សូមបញ្ជាក់បន្ថែមបន្តិចទៀតមកបងបាទ! ឧទាហរណ៍បើចង់ដឹងពីពណ៌ បងអាចសួរថា 'តើពណ៌ក្រហមមានអត្ថន័យយ៉ាងណា?'។",
    "ខ្ញុំចាប់បានតែមួយពាក្យ អត់ច្បាស់ពីអត្ថន័យសរុបទេបាទ។ សាកសួរខ្ញុំពី 'បច្ចេកទេសថតរូប' មើលបាទ ខ្ញុំពន្យល់ឡើងកប់!",
    "សុំទោសបងបាទ! គ្រាន់តែប៉ុណ្ណឹងខ្ញុំជួយអត់ទាន់ត្រូវរឿងទេ។ តើបងចង់ដឹងពីក្បួន 'កែស្បែកមុខឱ្យម៉ត់' មែនទេ?",
    "ពាក្យនេះអត់មានក្នុងសៀវភៅខ្ញុំទេបាទ! 😂 សាកល្បងសួរពី 'របៀបប្រើ Healing Brush' វិញមើលបាទ ខ្ញុំឆ្លើយបានភ្លាម!",
    "តើបងអាចសួរជាសំណួរបានទេបាទ? ដូចជា 'តើអ្វីទៅជា Rating និង Flag?' ជាដើម ដើម្បីឱ្យខ្ញុំឆ្លើយចំគោលដៅ។",
    "អានតែប៉ុណ្ណឹង ខ្ញុំសុំលើកទង់សសិនបាទ! 🏳️ តែបើបងសួរ 'របៀបកែរូបបែប Cinematic' ខ្ញុំប្រាប់អស់គ្មានលាក់ម៉ង!"
];

const LONG_FALLBACK_RESPONSES = [
    "សំណួរនេះអេមមែនទែនបង! ប៉ុន្តែខួរក្បាលខ្ញុំមិនទាន់មានទិន្នន័យត្រង់ចំណុចនេះទេ។ ខ្ញុំនឹងអាប់ដេតឆាប់ៗនេះបាទ!",
    "សុំទោសបងមហាទម្ងន់! ខ្ញុំយល់ពីសំណួរ ប៉ុន្តែខ្ញុំមិនទាន់រៀនដល់មេរៀននេះនៅឡើយទេ។ ឱ្យខ្ញុំសុំជំពាក់សិនណា៎បាទ!",
    "វ៉ាវ! សួរយកតែពិន្ទុតែម្ដងបាទ! ខ្ញុំពិតជាមិនមានចម្លើយសម្រាប់សំណួរដ៏ស៊ីជម្រៅនេះទេ លុះត្រាតែបងសួរពីបច្ចេកទេស Lightroom ផ្សេងៗ។",
    "សំណួរនេះហួសពីសមត្ថភាពខ្ញុំបន្តិចហើយបាទ! 😅 តើបងមានសំណួរផ្សេងទាក់ទងនឹងការប្រើប្រាស់ឧបករណ៍ (Tools) ក្នុង Lightroom ទេ?",
    "ខ្ញុំបានស្រាវជ្រាវក្នុងប្រព័ន្ធរបស់ខ្ញុំហើយ តែរកមិនឃើញចម្លើយសោះបាទ! 🤖 សុំប្តូរទៅសួរពីទ្រឹស្តីពណ៌ ឬបច្ចេកទេសថតរូបវិញបានទេបាទ?",
    "សុំទោសបងបាទ! ខ្ញុំជា AI ដែលផ្តោតលើការកែរូបមូលដ្ឋាន និងស្តាយពណ៌ សំណួររបស់បងរាងកម្រិតខ្ពស់ពេកសម្រាប់ខ្ញុំពេលនេះ។",
    "ខ្ញុំកំពុងតែរៀនសូត្របន្ថែមជារៀងរាល់ថ្ងៃបាទ! សំណួររបស់បងនេះ ខ្ញុំសូមកត់ត្រាទុកសិនណា៎ ដើម្បីឆ្លើយនៅជំនាន់ក្រោយ។",
    "ហឺម... 🤔 សំណួរនេះវែងឆ្ងាយល្អណាស់ ប៉ុន្តែចម្លើយរបស់ខ្ញុំប្រហែលជាមិនអាចជួយបងបានទេ។ សុំទោសផងណា៎បងបាទ!",
    "Error 404: រកមិនឃើញចម្លើយទេបងបាទ! តើបងចង់ដឹងពី 'របៀបកែរូបកុំឱ្យមាន Noise' ជំនួសវិញទេ?",
    "សំណួរនេះពិតជាមានប្រយោជន៍ តែខ្ញុំមិនទាន់មានចម្លើយច្បាស់លាស់នៅឡើយទេ។ សាកសួរខ្ញុំពីការកែទម្រង់ពន្លឺវិញមើលបាទ!"
];

const KNOWLEDGE_BASE = [
    // ---------------------------------------------------------
    // ១. សំណួរណែនាំ (Suggested Questions) - ត្រូវតែនៅខាងលើគេជានិច្ច
    // ---------------------------------------------------------
    { keys: ['តើ tone curve ប្រើសម្រាប់ធ្វើអ្វី', 'tone curve'], answer: "📈 **Tone Curve** គឺជាអាវុធសម្ងាត់ដ៏មានឥទ្ធិពលបំផុតរបស់អ្នកកែរូបអាជីព (Pro Retoucher)!\n\nវាជួយគ្រប់គ្រងពន្លឺ និងពណ៌កម្រិតខ្ពស់។ ក្បួនដែលល្បីជាងគេគឺ ការទាញខ្សែកោងឱ្យចេញជារាង **អក្សរ S (S-Curve)** ៖ គឺគ្រាន់តែទាញចំណុច Highlights (ខាងលើ) ឡើងលើបន្តិច និងទាញ Shadows (ខាងក្រោម) ចុះក្រោមបន្តិច... បងនឹងទទួលបាន Contrast ដ៏ស្រស់ស្អាតនិងទន់ភ្លន់បំផុត! 🚀" },
    { keys: ['របៀបកែពណ៌ស្បែកមុខឱ្យសម៉ត់', 'សម៉ត់', 'smooth', 'skin retouch', 'មុខស', 'retouch'], answer: "✨ ដើម្បីកែស្បែកមុខឱ្យសម៉ត់រលោង (Skin Retouching) ក្នុង Lightroom នេះជាក្បួនសម្ងាត់៖\n\n១. ចូលទៅ **Color Mix > Orange**:\n   - បង្កើន Luminance (+) ដើម្បីឱ្យស្បែកភ្លឺស។\n   - បន្ថយ Saturation (-) បន្តិចកុំឱ្យស្បែកលឿងពេក។\n២. ចូលទៅ **Effects > Texture**:\n   - ទាញ Texture ចុះ (-10 ទៅ -20) ដើម្បីធ្វើឱ្យស្បែករលោង តែមិនបាត់បង់ភាពច្បាស់របស់ភ្នែកនិងសក់។ 💆‍♀️" },
    { keys: ['dehaze និង clarity', 'dehaze vs clarity', 'clarity និង dehaze'], answer: "💎 **ភាពខុសគ្នារវាង Dehaze និង Clarity**៖\n\n- **Clarity**: បង្កើន Contrast នៅកម្រិតកណ្តាល (Midtones) ធ្វើឱ្យរូបរឹងមាំ និងមុតស្រួច។ (ប្រយ័ត្នពេលប្រើលើមុខមនុស្សស្រី ព្រោះអាចធ្វើឱ្យឃើញគ្រើម)\n- **Dehaze**: ផ្ដោតលើការកម្ចាត់អ័ព្ទ ផ្សែង ឬធូលី ធ្វើឱ្យផ្ទៃមេឃស្រអាប់ក្លាយជាថ្លាឆ្វង់ និងដិតពណ៌មកវិញភ្លាមៗ។" },
    { keys: ['teal & orange', 'teal and orange', 'teal', 'orange'], answer: "🎬 ពណ៌ **Teal & Orange** គឺជាស្តាយកុនហូលីវូដ (Cinematic Look) ដ៏ល្បីល្បាញបំផុត!\n\nដើម្បីបង្កើតវា សូមអនុវត្តតាមនេះ៖\n១. ចូលទៅ **Color Grading (ឬ Split Toning)**:\n   - **Shadows (ងងឹត):** ដាក់ពណ៌ Teal (ខៀវទឹកប៊ិច Hue ខ្ទង់ 210-230)។\n   - **Highlights (ភ្លឺ):** ដាក់ពណ៌ Orange (ទឹកក្រូច Hue ខ្ទង់ 30-45)។\n២. បើកប្រើ **Tone Curve** ហើយទាញទម្រង់អក្សរ S ដើម្បីឱ្យមាន Contrast ខ្លាំង។ 🍿" },
    { keys: ['healing brush', 'លុបមុន', 'លុបមនុស្ស', 'ស្នាម'], answer: "🩹 បងមានបញ្ហារូបជាប់ស្នាម ឬជាប់មនុស្សមែនទេ?\n\n- **Healing Brush**: ល្អបំផុតសម្រាប់ **លុបមុន ឬស្នាម** លើស្បែក ដោយវាចម្លងយកទម្រង់ក្បែរៗនោះមកបិទពីលើ រួចតម្រឹមពណ៌ និងពន្លឺដោយស្វ័យប្រវត្តិ។\n- **Clone Stamp**: ចម្លងវត្ថុទាំងមូលពីកន្លែងមួយទៅកន្លែងមួយទៀតទាំងស្រុង ល្អសម្រាប់លុបវត្ថុរំខានធំៗចេញពីផ្ទៃខាងក្រោយ។ ✨" },
    { keys: ['hsl', 'color mix', 'លាយពណ៌', 'កែពណ៌ដាច់ដោយឡែក', 'hue', 'luminance'], answer: "🎛️ **HSL ឬ Color Mix** គឺជាបន្ទប់ពិសោធន៍វេទមន្តពណ៌របស់អ្នកកែរូប!\n\nពាក្យនេះមកពី៖\n- **H (Hue)**: ប្តូរប្រភេទពណ៌ (ឧ. ប្តូរពណ៌ស្លឹកឈើបៃតង ទៅជាពណ៌លឿង)\n- **S (Saturation)**: កំណត់ភាពដិត ឬភាពស្លេករបស់ពណ៌មួយនោះដាច់ដោយឡែក\n- **L (Luminance)**: កំណត់ភាពភ្លឺ ឬងងឹតរបស់ពណ៌នោះ (ឧ. ល្បិចធ្វើឱ្យស្បែកមុខភ្លឺស គឺប្រើ Orange Luminance ទាញឡើងបូក)។ 🖌️" },
    { keys: ['copy ពណ៌', 'copy setting', 'paste', 'ចម្លងការកែ'], answer: "📝 ក្នុងកម្មវិធី Lightroom បងអាចយកការកែប្រែពីរូបមួយ ទៅដាក់រូបមួយទៀតព្រមគ្នាបានរហ័ស៖\n\n១. ចូលទៅរូបដែលកែហើយ ចុចលើសញ្ញា **... (៣គ្រាប់)** > យក **Copy Settings**។\n២. ទៅកាន់រូបថ្មីដែលបងចង់កែ ចុចសញ្ញា **...** នោះដដែល រួចយក **Paste Settings**។ ⏱️⚡" },
    { keys: ['color grading', 'split toning', 'ចាក់ពណ៌', 'cinematic'], answer: "🎬 **Color Grading (កាលមុនគេហៅថា Split Toning)** គឺជាតិចនិកកំពូលធ្វើឱ្យរូបមានស្តាយភាពយន្ត (Cinematic Look) កម្រិតហូលីវូដ។\n\nវាអនុញ្ញាតឱ្យបងបាញ់ពណ៌ចូលទៅក្នុងតំបន់ ៣ ផ្សេងគ្នានៃរូបភាព៖\n- **Shadows (តំបន់ងងឹត)**: គេនិយមដាក់ពណ៌ Teal (ខៀវបៃតង) ឬ ខៀវទឹកប៊ិច ឱ្យត្រជាក់ភ្នែក។\n- **Highlights (តំបន់ភ្លឺ)**: គេនិយមដាក់ពណ៌ Orange (ទឹកក្រូច) ឬ លឿង ឱ្យមានភាពកក់ក្តៅ។ 🍿" },
    { keys: ['ងងឹតមុខ', 'underexposed', 'មុខងងឹត'], answer: "🌚 **បញ្ហាថតមកងងឹតមុខ (Underexposed)** អាចដោះស្រាយបានយ៉ាងងាយ៖\n\nវិធីទី ១៖ ចូល Basic ហើយទាញ **Shadows ឡើងបូក (+)** រហូតដល់មុខភ្លឺច្បាស់វិញ។\nវិធីទី ២ (Pro)៖ ប្រើមុខងារ **Masking > Radial Gradient** គូសរង្វង់ចំផ្ទៃមុខ រួចបង្កើន Exposure ឬ Shadows តែត្រង់រង្វង់នោះ។ មុខនឹងភ្លឺលេចធ្លោ ដោយមិនប៉ះពាល់ Background ទេបាទ! 💡" },
    { keys: ['snapshot', 'versions', 'រក្សាទុកការកែ', 'កត់ត្រា'], answer: "📸 **Snapshot (ឬ Versions លើទូរស័ព្ទ)** ជួយបងឱ្យ **រក្សាទុកដំណាក់កាលកែប្រែ (Save State)** នៅវិនាទីណាមួយ។ ពេលបងចង់ត្រលប់មកពណ៌ចាស់វិញ គ្រាន់តែចុចលើ Snapshot នោះ គឺមកវិញភ្លាម ដោយមិនបាច់ចុច Undo ហត់ទេ! 🙌" },
    { keys: ['ai denoise', 'enhance', 'លុប noise', 'គ្រាប់ noise'], answer: "🤖 **AI Denoise (ក្នុង Enhance)** គឺជាបច្ចេកវិទ្យាវេទមន្តថ្មីរបស់ Lightroom!\n\nជំនួសអោយការប្រើ Luminance Noise ធម្មតាដែលធ្វើអោយរូបព្រិលដូចជ័រ AI Denoise អាចលុបគ្រាប់ Noise ចេញរលីង តែនៅរក្សាសាច់រូបភាពអោយម៉ត់មុតស្រួច (Sharp) ដូចដើម។ ប្រើវាសម្រាប់រូបថតពេលយប់ ឬរូបថត ISO ខ្ពស់ ធានាថាភ្ញាក់ផ្អើល! 🌌✨" },
    { keys: ['មេឃ', 'ខៀវ', 'sky', 'blue sky', 'មេឃខៀវ'], answer: "☁️ **ចង់កែផ្ទៃមេឃពណ៌ខៀវឱ្យដិតស្អាត (Deep Blue Sky)** មែនទេបង?\n\nងាយៗ! សូមចូលទៅកាន់ **Color Mix (HSL) > ជ្រើសរើសពណ៌ Blue (ខៀវ)** រួច៖\n១. ទាញ **Luminance ចុះក្រោម (-)** (នេះជាគន្លឹះសំខាន់បំផុតធ្វើឱ្យមេឃក្រាស់)\n២. ទាញ **Saturation ឡើងបូក (+)** បន្តិចដើម្បីឱ្យពណ៌ស្រស់\n៣. បងក៏អាចប្រើ Linear Gradient Mask អូសពីលើមេឃចុះក្រោម រួចបន្ថយ Exposure បន្ថែមបានដែរ! ✈️" },
    { keys: ['ស្លឹកឈើ', 'បៃតងខ្មៅ', 'green', 'លឿងអតីតកាល'], answer: "🌿 **ចង់ប្តូរពណ៌ស្លឹកឈើ (Green) ឱ្យទៅជាបៃតងចាស់ ឬពណ៌លឿងអតីតកាល** ត្រូវទេបង?\n\nចូលទៅកាន់ **Color Mix (HSL) > ជ្រើសយកពណ៌ Green (បៃតង)** រួច៖\n១. ទាញ Hue ទៅខាងឆ្វេង (-) ប្រសិនបើចង់បានពណ៌លឿងរដូវស្លឹកឈើជ្រុះ។\n២. ទាញ Saturation ចុះក្រោម (-) ឱ្យស្លេកបន្តិច។\n៣. ទាញ Luminance ចុះក្រោម (-) ឱ្យពណ៌កាន់តែងងឹត។\nបងនឹងទទួលបានស្តាយព្រៃភ្នំបែប Cinematic ភ្លាមៗតែម្តង! 🌲" },
    { keys: ['range mask', 'range masking', 'luminance mask'], answer: "🎭 **Range Masking** នៅក្នុង Lightroom អនុញ្ញាតឱ្យបងជ្រើសរើស (Select) ផ្នែកណាមួយនៃរូបភាពដោយផ្អែកលើ **ពណ៌ (Color)** ឬ **ពន្លឺ (Luminance)**។ វាជាឧបករណ៍ដ៏មានឥទ្ធិពលបំផុតសម្រាប់អ្នកកែរូបអាជីព! 🪄" },
    { keys: ['export', 'facebook', 'ច្បាស់ល្អ', 'ផុសរូប', 'quality'], answer: "🚀 **របៀប Export រូបឱ្យច្បាស់ល្អសម្រាប់ Facebook/IG**៖\n\n១. ដាក់ Quality ត្រឹម 100%\n២. បើក Resize to Fit (Long Edge) ហើយកំណត់យក **2048 pixels** (នេះជាខ្នាតស្តង់ដារដែល FB មិនបង្រួមរូបបង)\n៣. Color Space កំណត់យក **sRGB**\n៤. Output Sharpening ជ្រើសរើស Screen (Standard)។ ធានាថាផុសទៅច្បាស់ម៉ត់កប់! 🖼️" },
    { keys: ['sync', 'auto sync', 'កែម្ដងច្រើន', 'batch edit'], answer: "⚡ បើបងមានរូបរាប់រយសន្លឹកក្នុងប្លង់តែមួយ ចង់កែអោយលឿន បងត្រូវប្រើមុខងារ **Sync Settings**!\n\nគ្រាន់តែកែរូបទី ១ អោយស្អាត រួច Select រូបផ្សេងទៀតទាំងអស់ ហើយចុចប៊ូតុង **Sync (ឬ Auto Sync)** នោះរាល់ការកែប្រែទាំងអស់ (ពន្លឺ, ពណ៌) នឹងហោះទៅចូលគ្រប់រូបភាពទាំងអស់ត្រឹម ១ វិនាទី! មិនបាច់អង្គុយកែមួយៗអោយហត់ទេបង! 🚀" },
    { keys: ['dodge', 'burn', 'គូសពន្លឺ'], answer: "🖌️ បច្ចេកទេស **Dodge & Burn** គឺជាក្បួនកែប្រែកម្រិតខ្ពស់តាំងពីសម័យលាងរូបក្នុងបន្ទប់ងងឹតមកម្ល៉េះ៖\n\n- **Dodge:** គឺការប្រើ Brush គូសបញ្ចេញពន្លឺអោយភ្លឺ (Brighten) លើកន្លែងសំខាន់ៗ ដូចជាកែវភ្នែក ឬឆ្អឹងថ្ពាល់។\n- **Burn:** គឺការគូសអោយងងឹត (Darken) នៅតាមគែមមុខ ឬស្រមោល ដើម្បីបង្កើតទម្រង់មុខអោយកាន់តែមានជម្រៅ និង 3D។ វាជាអាថ៌កំបាំងរូប Portrait របស់ Pro! 🗿" },
    { keys: ['lens profile', 'lens correction', 'កែកែវថត'], answer: "🔍 **Lens Profile Correction** គឺជាមុខងារសម្រាប់កែតម្រូវកំហុសរបស់កែវថត (Lens) ដូចជាភាពកោង (Distortion) និងគែមងងឹត (Vignette) ដែលកាមេរ៉ាបង្កើតឡើងដោយអចេតនា។ បងគួរតែបើកវាជានិច្ច (Enable Profile Corrections) គ្រប់ពេលកែរូបបាទ!" },
    { keys: ['aspect ratio', '4:5', 'ទំហំរូប ig', 'instagram', 'ផុស ig', 'ទំហំរូប', 'crop'], answer: "📱 **ទំហំរូបភាព (Aspect Ratio)** ដែលល្អបំផុតសម្រាប់ Social Media៖\n\n- **Instagram Feed:** គួរ Crop ទំហំ **4:5 (Portrait)** ព្រោះវាបង្ហាញពេញអេក្រង់ទូរស័ព្ទ ធ្វើឱ្យរូបភាពលេចធ្លោ និងមិនត្រូវ IG កាត់ចោល។\n- **Facebook:** អាចប្រើ 4:5 ឬ 2:3 សម្រាប់ការផុសបញ្ឈរ។\n- **YouTube/TV:** ប្រើទំហំ 16:9 (Landscape)។\nកុំភ្លេច Crop ឱ្យត្រូវទំហំមុននឹង Export ណា៎បង! 📏" },
    { keys: ['whites និង highlights', 'whites vs highlights'], answer: "☁️ បងប្រាកដជាឆ្ងល់ហើយថា **Highlights** និង **Whites** ខុសគ្នាម៉េចមែនទេ?\n\n- **Highlights**: គ្រប់គ្រងតែតំបន់ដែលភ្លឺខ្លាំង (ដូចជាមេឃ ឬពន្លឺថ្ងៃជះលើមុខ)។ ភាគច្រើនអ្នកជំនាញចូលចិត្តបន្ថយវា (-) ដើម្បីសង្គ្រោះពពក ឬពន្លឺដែលឆេះឱ្យលេចចេញមកវិញ។\n- **Whites**: កំណត់ចំណុច 'សបំផុត' នៅក្នុងរូបភាពទាំងមូល។ គេទាញវាឡើងបន្តិច (+) ដើម្បីឱ្យរូបភាពទាំងមូលមើលទៅស្រឡះ (Pop) និងមិនស្លេកស្លាំង។" },
    { keys: ['landscape', 'ទេសភាព', 'ធម្មជាតិ', 'ព្រៃភ្នំ'], answer: "🏞️ សម្រាប់ការថតទេសភាព (Landscape) ឱ្យលេចធ្លោ៖\n១. ទាញ Highlights ចុះដើម្បីឃើញពពកច្បាស់\n២. ទាញ Shadows ឡើងដើម្បីឃើញព័ត៌មានលើដី\n៣. បង្កើន Clarity និង Dehaze (+15 ទៅ +30) ឱ្យរូបរឹងមាំ និងមុតស្រួច\n៤. ទាញ Vibrance បន្តិចដើម្បីឱ្យពណ៌ស្រស់ស្អាត!" },
    { keys: ['grain', 'គ្រាប់', 'film', 'គ្រាប់អុចៗ'], answer: "🎞️ **Grain** គឺជាការបន្ថែមគ្រាប់អុចៗតូចៗទៅក្នុងរូបភាព ដើម្បីត្រាប់តាមកាមេរ៉ាហ្វីលជំនាន់មុន (Analog Film Look)។ វាជួយឱ្យរូបភាពមើលទៅមានលក្ខណៈសិល្បៈ បុរាណ (Vintage)។ 😉" },
    { keys: ['rating', 'flag', 'ផ្កាយ', 'ទង់', 'សម្គាល់រូប'], answer: "⭐️ **Rating (ដាក់ផ្កាយ)** និង 🚩 **Flag (ដាក់ទង់)** គឺជាឧបករណ៍ចាត់ចែងរូបភាពកម្រិតប្រូ (Professional Photo Culling)៖\n\n- **Flag**: ប្រើសម្រាប់សម្គាល់រូបដែលត្រូវយក (Pick) ឬ រូបត្រូវបោះចោល (Reject) អោយបានលឿន។\n- **Rating**: ប្រើសម្រាប់ដាក់ពិន្ទុ ១ ដល់ ៥ ផ្កាយ ដើម្បីងាយស្រួលរើសរូបណាដែលស្អាតដាច់គេ។ 📂" },
    { keys: ['color cast', 'ជាប់ពណ៌បៃតង', 'មុខបៃតង', 'ជាប់ពណ៌'], answer: "🤢 បើថតក្រោមដើមឈើហើយមុខមនុស្សជាប់ពណ៌បៃតង ហ្នឹងហើយគេហៅថា **Color Cast**!\n\nដើម្បីជួសជុល៖\n១. ប្រើប្រាស់ **Tint** ទាញទៅរកពណ៌ Magenta (+) បន្តិចដើម្បីស៊ីសងជាមួយពណ៌បៃតង។\n២. ចូល HSL > Green > បន្ថយ Saturation របស់វាចោលបន្តិចទៅ។ មុខនឹងត្រលប់មកពណ៌ធម្មតាវិញហើយ! 🧪" },
    { keys: ['blacks', 'black point', 'ចំណុចខ្មៅ', 'ជម្រៅ'], answer: "⚫ **Blacks**: កំណត់ចំណុច 'ខ្មៅបំផុត' ក្នុងរូប។ ការទាញ Blacks ចុះ (-) ជួយឱ្យរូបភាពមានជម្រៅ (Depth) មើលទៅមានទម្ងន់ មិនអណ្ដែត។" },
    { keys: ['dark & moody', 'dark and moody', 'moody'], answer: "🖤 ដើម្បីកែរូបស្តាយ **Dark & Moody**:\n១. បន្ថយ Exposure និងបង្កើន Contrast ឱ្យខ្លាំង\n២. ទាញ Highlights និង Whites ចុះក្រោម (-)\n៣. ចូលទៅ Tone Curve ទាញចំណុចខ្មៅ (Blacks) ឡើងលើបន្តិច ដើម្បីឱ្យស្រអាប់ (Faded Look)\n៤. បន្ថយ Saturation ពណ៌ផ្សេងៗ ទុកតែពណ៌ទឹកក្រូច (ស្បែក) និងពណ៌ក្រហមបន្តិចបានហើយ! 📸" },
    { keys: ['vibrance និង saturation', 'vibrance ខុសពី saturation', 'vibrance vs saturation', 'vibrance'], answer: "🎨 **Vibrance និង Saturation** គឺសម្រាប់បង្កើនភាពដិតនៃពណ៌ទាំងពីរ តែខុសគ្នាត្រង់៖\n\n- **Saturation**: ទាញពណ៌ទាំងអស់ឡើងស្មើគ្នា (បើទាញខ្លាំងពេក ស្បែកមនុស្សនឹងទៅជាលឿង ឬក្រហមឆ្អៅ)។\n- **Vibrance**: ជាឧបករណ៍ឆ្លាតវៃ! វាទាញតែពណ៌ណាដែលស្លេកឱ្យដិតឡើង ហើយវាជួយការពារពណ៌ស្បែកមនុស្សមិនឱ្យខូចសាច់នោះទេ។ សម្រាប់រូប Portrait គួរតែប្រើ Vibrance ជានិច្ចបាទ! 😉" },

    // ---------------------------------------------------------
    // ២. មុខងារ Tools មូលដ្ឋាន
    // ---------------------------------------------------------
    { keys: ['exposure', 'ពន្លឺរួម', 'ពន្លឺរូប', 'brightness'], answer: "💡 **Exposure** គឺជាឧបករណ៍សម្រាប់គ្រប់គ្រង **ពន្លឺរួម (Overall Light)** នៃរូបភាពទាំងមូលតែម្ដង។\n\n- បើទាញទៅស្ដាំ (+) រូបនឹងភ្លឺឡើង។\n- បើទាញទៅឆ្វេង (-) រូបនឹងងងឹត។\nវាជាជំហានទី ១ សំខាន់បំផុត ដែលបងត្រូវប៉ះមុនគេបង្អស់ ពេលចាប់ផ្តើមកែរូបមួយសន្លឹក! ☀️" },
    { keys: ['contrast', 'ភាពផ្ទុយ', 'កម្រិតពណ៌ផ្ទុយ', 'ភាពដិត'], answer: "🌗 **Contrast** គឺជាមេបញ្ជាការកំណត់គម្លាតរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។\n\n- បើបងដាក់ Contrast ខ្ពស់៖ កន្លែងងងឹតនឹងកាន់តែខ្មៅ កន្លែងភ្លឺកាន់តែភ្លឺ ធ្វើឱ្យរូបភាពមើលទៅរឹងមាំ (Punchy)។\n- បើបន្ថយវាទាប៖ រូបភាពនឹងមើលទៅស្រទន់បែបស្រអាប់ៗ (Faded/Vintage look) ដ៏សែនរ៉ូមែនទិក។ 🤔" },
    { keys: ['highlight', 'highlights', 'ផ្នែកភ្លឺ', 'ពន្លឺខ្លាំង', 'ឆេះ'], answer: "☁️ **Highlights**: គ្រប់គ្រងតែតំបន់ដែលភ្លឺខ្លាំង (ដូចជាមេឃ ឬពន្លឺថ្ងៃជះលើមុខ)។ ភាគច្រើនអ្នកជំនាញចូលចិត្តបន្ថយវា (-) ដើម្បីសង្គ្រោះពពក ឬពន្លឺដែលឆេះឱ្យលេចចេញមកវិញ។ ✨" },
    { keys: ['shadow', 'shadows', 'ផ្នែកងងឹត', 'ស្រមោល'], answer: "🌑 **Shadows**: ប៉ះពាល់តែតំបន់នៅក្នុងម្លប់ប៉ុណ្ណោះ។ បើបងថតបញ្ច្រាស់ថ្ងៃមុខតួអង្គខ្មៅងងឹត គ្រាន់តែទាញ Shadows បូក (+) មុខនឹងភ្លឺមកវិញវេទមន្តតែម្ដង! 🎩" },
    { keys: ['texture', 'វាយនភាព', 'គ្រើម'], answer: "💎 **Texture**: ផ្ដោតលើលម្អិតតូចៗ (Micro-details)។ បើទាញដក (-) វាធ្វើឱ្យស្បែកមុខម៉ត់រលោងស្អាតខ្លាំងណាស់ (Skin Smoothing) ដោយមិនប៉ះពាល់ភ្នែក ឬសក់ឱ្យព្រិលឡើយ។" },
    { keys: ['clarity', 'ភាពច្បាស់'], answer: "🔍 **Clarity**: បង្កើន Contrast នៅកម្រិត Midtones។ វាធ្វើឱ្យរូបភាពរឹងមាំ និងមុតស្រួច។ ល្អសម្រាប់ការថតសំណង់អគារ ទេសភាព ឬមនុស្សប្រុស តែបើទាញលើមុខមនុស្សស្រី អាចធ្វើឱ្យមើលទៅចាស់ ឬគ្រើមពេក! ប្រើដោយប្រុងប្រយ័ត្នណា៎បង! 🧑‍🎨" },
    { keys: ['dehaze', 'អ័ព្ទ', 'fog', 'កាត់អ័ព្ទ'], answer: "🌫️ **Dehaze** គឺជាឧបករណ៍កម្ចាត់អ័ព្ទដ៏មានឥទ្ធិពលបំផុត៖\n\n- ទាញទៅស្តាំ (+)៖ វាសម្លាប់អ័ព្ទ ផ្សែង ឬធូលី ធ្វើឱ្យរូបភាពទេសភាព ឬមេឃដែលស្រអាប់ ក្លាយជាថ្លាឆ្វង់ និងដិតពណ៌មកវិញភ្លាមៗ។\n- ទាញទៅឆ្វេង (-)៖ វាបន្ថែមអ័ព្ទចូលទៅក្នុងរូប បង្កើតជា Mood បែបយល់សប្តិ អាថ៌កំបាំង ឬរដូវរងា (Dreamy/Fairy tale)។ 🌄" },
    { keys: ['vignette', 'គែមងងឹត', 'គែមរូប', 'កាត់គែម'], answer: "⚫ **Vignette** គឺជាបែបផែនកាត់គែម ធ្វើឱ្យជុំវិញគែមរូបភាពទៅជាងងឹត (ឬស)។ មូលហេតុដែលអ្នកថតរូបចូលចិត្តប្រើវា គឺដើម្បីទាញចំណាប់អារម្មណ៍ភ្នែកអ្នកមើល ឱ្យផ្ដោតត្រង់ទៅចំណុចកណ្តាលនៃរូបភាព (Subject)។ 👁️" },
    { keys: ['sharp', 'sharpness', 'ច្បាស់', 'sharpening', 'មុត'], answer: "🔪 ដើម្បីធ្វើឱ្យរូបភាពកាន់តែច្បាស់មុតស្រួច (Sharp) បងអាចប្រើឧបករណ៍ **Sharpening** នៅក្នុងផ្នែក Detail។ ពេលទាញ Sharpening កុំភ្លេចប្រើមុខងារ **Masking** ដើម្បីកំណត់ឱ្យកម្មវិធីធ្វើឱ្យច្បាស់តែត្រង់គែមវត្ថុ ដោយរក្សាផ្ទៃស្បែកមុខឱ្យនៅរលោងដដែល។ 👁️✨" },

    // ---------------------------------------------------------
    // ៣. ការសន្ទនាទូទៅ
    // ---------------------------------------------------------
    { keys: ['ឈ្មោះអី', 'name', 'who are you', 'ជានរណា'], answer: "សួស្ដីបង! ខ្ញុំគឺជា 'My Design AI' 🤖 ជាជំនួយការឆ្លាតវៃដែលត្រូវបានបង្កើតឡើងដើម្បីជួយបងក្នុងវិស័យថតរូប និងកែរូបភាព។" },
    { keys: ['hello', 'hi', 'suesdey', 'សួស្តី', 'សួរ', 'bhat', 'jah'], answer: "សួស្ដីបាទ! 👋 ស្វាគមន៍មកកាន់ 'ម៉ាយឌីហ្សាញ' ។ តើថ្ងៃនេះបងចង់ឱ្យខ្ញុំជួយពន្យល់ពីឧបករណ៍ណា ឬ ចង់បានរូបមន្ត Preset ស្អាតៗដែរបាទ? 😊✨" },
    { keys: ['how to learn', 'learn', 'ចាប់ផ្ដើមពីណា', 'រៀនម៉េច', 'start'], answer: "សម្រាប់អ្នកទើបចាប់ផ្ដើម ខ្ញុំសូមណែនាំឱ្យរៀនតាមនេះជាមុនសិន៖\n១. **ពន្លឺ (Light):** រៀនពី Exposure, Contrast, Highlights, និង Shadows។\n២. **ពណ៌ (Color):** ស្វែងយល់ពី Temp/Tint និង HSL។\n៣. **Tone Curve:** ហាត់អូស Tone Curve រាងអក្សរ S ដើម្បីភាពទាក់ទាញ។" },
    { keys: ['help', 'ជួយ', 'របៀបប្រើ'], answer: "ខ្ញុំនៅទីនេះរង់ចាំជួយបងជានិច្ច! បងអាចសួរខ្ញុំបានរាល់ចម្ងល់ទាំងអស់ទាក់ទងនឹងការកែរូប ដូចជា៖ របៀបកែពណ៌ Cinematic, តើ Dehaze ប្រើសម្រាប់អ្វី, ឬ របៀបកែមុខងងឹតជាដើម។ គ្រាន់តែសរសេរសំណួរមក! 🚀" }
];

const findAIResponse = (input) => {
    const query = input.toLowerCase().trim();
    const match = KNOWLEDGE_BASE.find(item => item.keys.some(key => query.includes(key.toLowerCase())));
    if (match) return match.answer;

    const refusedTopics = ['video', 'song', 'music', 'game', 'hack', 'money', 'crypto'];
    if (refusedTopics.some(t => query.includes(t))) {
        return "សូមអភ័យទោសបង! 🚫 ខ្ញុំគឺជា AI ដែលបណ្ដុះបណ្ដាលឡើងពិសេសសម្រាប់តែការកែរូបភាពក្នុងកម្មវិធី Lightroom ប៉ុណ្ណោះ។\nបើបងមានចម្ងល់ពីការទាញពណ៌ ប្រើប្រាស់ឧបករណ៍នានា ឬស្វែងរក Preset ស្អាតៗ បងអាចសួរខ្ញុំបានជានិច្ចណា៎! 😊";
    }

    // គណនាចំនួនពាក្យ (ប្រើ space ដើម្បីរាប់)
    const wordsCount = input.trim().split(/\s+/).length;
    let randomFallback;

    // បើពាក្យតិចជាង ឬស្មើ ២ ចាត់ទុកថាជា Short Word
    if (wordsCount <= 2) {
        randomFallback = SHORT_FALLBACK_RESPONSES[Math.floor(Math.random() * SHORT_FALLBACK_RESPONSES.length)];
    } else {
        // បើវែងជាង ២ ពាក្យ ចាត់ទុកថាជាសំណួរ (Long Phrase)
        randomFallback = LONG_FALLBACK_RESPONSES[Math.floor(Math.random() * LONG_FALLBACK_RESPONSES.length)];
    }
    
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
    { 
        tool: 'Exposure', 
        khmer: 'ការប៉ះពន្លឺ', 
        shortDesc: 'កំណត់ពន្លឺរួមនៃរូបភាពទាំងមូល។ វាជាជំហានដំបូងក្នុងការកែ។',
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
        slider: { min: -5, max: 5, step: 0.1, default: 0, type: 'exposure', actionText: (v) => v > 0 ? `🌞 ភ្លឺឡើង (+${v.toFixed(1)})` : v < 0 ? `🌚 ងងឹតចុះ (${v.toFixed(1)})` : 'ចំនុចកណ្តាល 0' },
        desc: 'Exposure គឺជាឧបករណ៍សម្រាប់គ្រប់គ្រងពន្លឺរួម (Overall Light) នៃរូបភាពទាំងមូលតែម្ដង។\n\n⬅️ ទាញទៅឆ្វេង (-): ធ្វើឱ្យរូបភាពទាំងមូលងងឹតចុះ (ល្អសម្រាប់រូបដែលថតមកភ្លឺឆេះពេក)\n➡️ ទាញទៅស្តាំ (+): ធ្វើឱ្យរូបភាពទាំងមូលភ្លឺឡើង (ល្អសម្រាប់រូបដែលថតមកងងឹត)', 
        tip: 'ឧទាហរណ៍៖ រូបថតពេលល្ងាចងងឹតបន្តិច ដាក់ +0.50 ទៅ +1.00។' 
    }, 
    { 
        tool: 'Contrast', 
        khmer: 'ភាពផ្ទុយ', 
        shortDesc: 'កំណត់គម្លាតរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។ Contrast ខ្ពស់ធ្វើឱ្យរូបដិត។',
        image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'contrast', actionText: (v) => v > 0 ? `បង្កើនភាពផ្ទុយ៖ រូបដិតរឹងមាំ (+${v})` : v < 0 ? `បន្ថយភាពផ្ទុយ៖ រូបស្រទន់បែប Vintage (${v})` : '0 (ដើម)' },
        desc: 'Contrast កំណត់គម្លាតរវាងកន្លែងភ្លឺ និងកន្លែងងងឹត។\n\n⬅️ ទាញទៅឆ្វេង (-): បន្ថយគម្លាតពន្លឺ ធ្វើឱ្យកន្លែងខ្មៅរាងប្រផេះ ហើយកន្លែងភ្លឺរាងស្រអាប់។ បង្កើតបានជាស្តាយស្រទន់បែបកូរ៉េ ឬ Vintage។\n➡️ ទាញទៅស្តាំ (+): បង្កើនគម្លាត ធ្វើឱ្យខ្មៅកាន់តែខ្មៅ ភ្លឺកាន់តែភ្លឺ។ ល្អសម្រាប់ការថតទេសភាពឱ្យមើលទៅរឹងមាំ (Punchy)។', 
        tip: 'ឧទាហរណ៍៖ រូបស្លេកៗ ដាក់ +20។ កុំឱ្យលើស +50 ប្រយ័ត្នបែកពណ៌។' 
    }, 
    { 
        tool: 'Highlights', 
        khmer: 'ផ្នែកភ្លឺ', 
        shortDesc: 'គ្រប់គ្រងតំបន់ដែលភ្លឺខ្លាំងបំផុត (ដូចជាមេឃ ឬពន្លឺថ្ងៃ)។',
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'highlights', actionText: (v) => v > 0 ? `ភ្លឺចាំងខ្លាំង (+${v})` : v < 0 ? `សង្គ្រោះពពកមិនឱ្យឆេះ (${v})` : 'ដើម' },
        desc: 'Highlights ផ្តោតទៅលើតែតំបន់ដែលមានពន្លឺភ្លឺខ្លាំងប៉ុណ្ណោះ ដោយមិនប៉ះពាល់ដល់តំបន់ងងឹតឡើយ។\n\n⬅️ ទាញទៅឆ្វេង (-): បន្ថយពន្លឺកន្លែងដែលឆេះ ជួយសង្គ្រោះព័ត៌មាន (ដូចជាពពក ឬពន្លឺជះលើមុខ) ឱ្យលេចចេញមកវិញ។\n➡️ ទាញទៅស្តាំ (+): ធ្វើឱ្យកន្លែងភ្លឺ កាន់តែភ្លឺខ្លាំងឡើង និងចាំងផ្លាត។', 
        tip: 'ឧទាហរណ៍៖ បើថតមេឃហើយបាត់ពពក ដាក់ -80 ដល់ -100 ដើម្បីសង្គ្រោះពពកមកវិញ។' 
    }, 
    { 
        tool: 'Shadows', 
        khmer: 'ផ្នែកងងឹត', 
        shortDesc: 'គ្រប់គ្រងតែតំបន់ដែលស្ថិតនៅក្នុងម្លប់ ឬកន្លែងងងឹតប៉ុណ្ណោះ។',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'shadows', actionText: (v) => v > 0 ? `បំភ្លឺស្រមោល/មុខ (+${v})` : v < 0 ? `បន្ថយស្រមោលឱ្យខ្មៅដិត (${v})` : 'ដើម' },
        desc: 'Shadows គឺជាវីរបុរសសម្រាប់សង្គ្រោះរូបភាពដែលថតបញ្ច្រាសពន្លឺ!\n\n⬅️ ទាញទៅឆ្វេង (-): ធ្វើឱ្យតំបន់ស្រមោលកាន់តែខ្មៅងងឹត បង្កើតបានជាសិល្បៈបែប Silhouette ឬផ្តល់ភាពអាថ៌កំបាំង។\n➡️ ទាញទៅស្តាំ (+): ទាញតំបន់ងងឹតឱ្យភ្លឺច្បាស់មកវិញ (ល្អបំផុតសម្រាប់បំភ្លឺផ្ទៃមុខដែលងងឹត ព្រោះថតបញ្ច្រាសពន្លឺព្រះអាទិត្យ)។', 
        tip: 'ពេលថតបញ្ច្រាសថ្ងៃហើយមុខតួអង្គខ្មៅ គ្រាន់តែទាញ Shadows ឡើងបូក (+) ប្រហែល 40 ទៅ 60 មុខនឹងភ្លឺមកវិញភ្លាមៗ!' 
    }, 
    { 
        tool: 'Whites', 
        khmer: 'ពណ៌ស', 
        shortDesc: 'កំណត់ចំណុចសបំផុតនៅក្នុងរូបភាព ដើម្បីឱ្យរូបស្រឡះ។',
        image: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'whites', actionText: (v) => v > 0 ? `សក្បុស ស្រឡះល្អ (+${v})` : v < 0 ? `បន្ថយភាពស (${v})` : 'ដើម' },
        desc: 'Whites ប្រើសម្រាប់កំណត់ចំណុចចុងសងខាងនៃពន្លឺផ្នែកភ្លឺ (White Point)៖\n\n➡️ ទាញស្តាំ (+): ធ្វើឱ្យរូបភាពស្រឡះសក្បុស ភ្លឺច្បាស់ ប៉ុន្តែប្រយ័ត្នឆេះ (Clipping) បាត់បង់ព័ត៌មាន។\n⬅️ ទាញឆ្វេង (-): បន្ថយភាពសក្បុស ធ្វើឱ្យរូបភាពរាងស្រអាប់បន្តិច និងកាត់បន្ថយភាពចាំងផ្លាតពេក។', 
        tip: 'ចុចម្រាមដៃពីរលើអេក្រង់ពេលអូស Whites ដើម្បីមើលកន្លែងដែលភ្លឺឆេះពេក (Clipping)។' 
    },
    { 
        tool: 'Blacks', 
        khmer: 'ពណ៌ខ្មៅ', 
        shortDesc: 'កំណត់ចំណុចខ្មៅបំផុតនៃរូបភាព ដើម្បីឱ្យមានជម្រៅ (Depth)។',
        image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'blacks', actionText: (v) => v > 0 ? `ខ្មៅស្លេកបែប Vintage (+${v})` : v < 0 ? `ខ្មៅដិតមានជម្រៅ (${v})` : 'ដើម' },
        desc: 'Blacks ប្រើសម្រាប់កំណត់ចំណុចចុងសងខាងនៃពន្លឺផ្នែកងងឹត (Black Point)៖\n\n⬅️ ទាញឆ្វេង (-): ធ្វើឱ្យចំណុចខ្មៅកាន់តែដិត ផ្តល់ឱ្យរូបភាពមានទម្ងន់ និងជម្រៅ (Depth) មិនហាក់ដូចជាអណ្តែត។\n➡️ ទាញស្តាំ (+): ធ្វើឱ្យកន្លែងខ្មៅប្រែជាប្រផេះ (ស្លេក) ដែលគេនិយមប្រើសម្រាប់ស្តាយកូរ៉េ ឬ Vintage។', 
        tip: 'ប្រើវាគួបផ្សំជាមួយ Shadows ជានិច្ច ដើម្បីគ្រប់គ្រងតំបន់ងងឹតប្រកបដោយប្រសិទ្ធភាពខ្ពស់បំផុត។' 
    }
  ] },
  { 
    id: 'color', 
    title: 'ពណ៌ (Color)', 
    icon: <Droplet className="w-6 h-6 text-cyan-400" />, 
    description: 'ការកែសម្រួលពណ៌កម្រិតខ្ពស់ Color Mix & Grading', 
    content: [
      { 
          tool: 'Temp & Tint (White Balance)', 
          khmer: 'សីតុណ្ហភាព & ពណ៌លាំ', 
          shortDesc: 'កំណត់តុល្យភាពពណ៌នៃរូបភាពទាំងមូលឱ្យក្តៅ (លឿង) ឬត្រជាក់ (ខៀវ)។',
          image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80',
          sliders: [
              { id: 'temp', label: 'Temp (សីតុណ្ហភាព)', min: -100, max: 100, step: 1, default: 0 },
              { id: 'tint', label: 'Tint (ពណ៌លាំ)', min: -100, max: 100, step: 1, default: 0 }
          ],
          desc: 'ឧបករណ៍នេះប្រើសម្រាប់កំណត់តុល្យភាពពណ៌នៃរូបភាពទាំងមូល៖\n\n🌡️ Temp (Temperature): \n⬅️ ទាញទៅឆ្វេង (-): រូបភាពនឹងប្រែជាពណ៌ខៀវ ត្រជាក់ (ដូចពេលព្រឹកព្រលឹម)\n➡️ ទាញទៅស្តាំ (+): រូបភាពនឹងប្រែជាពណ៌លឿង កក់ក្តៅ (ដូចពេលថ្ងៃលិច)\n\n🧪 Tint: \n- ទាញស្តាំ (+): បន្ថែមពណ៌ស្វាយ (Magenta)\n- ទាញឆ្វេង (-): បន្ថែមពណ៌បៃតង (Green)។', 
          tip: '💡 ឧទាហរណ៍៖ បើថតក្នុងហាងកាហ្វេហើយភ្លើងលឿងពេក សូមទាញ Temp ទៅរកពណ៌ខៀវ (-) បន្តិចដើម្បីតម្រឹមពណ៌អោយត្រូវវិញ។' 
      }, 
      { 
          tool: 'Vibrance vs Saturation', 
          khmer: 'ភាពរស់រវើក និង កម្រិតពណ៌', 
          shortDesc: 'បង្កើនភាពស្រស់នៃពណ៌ ប៉ុន្តែ Vibrance ការពារស្បែកមនុស្សមិនឱ្យខូច។',
          image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
          sliders: [
              { id: 'vibrance', label: 'Vibrance (ឆ្លាតវៃ)', min: -100, max: 100, step: 1, default: 0 },
              { id: 'saturation', label: 'Saturation (ទាំងអស់)', min: -100, max: 100, step: 1, default: 0 }
          ],
          desc: 'ឧបករណ៍ទាំងពីរនេះប្រើសម្រាប់បង្កើនភាពស្រស់នៃពណ៌ ប៉ុន្តែវាមានភាពខុសគ្នាខ្លាំង៖\n\n🎨 Saturation:\n⬅️ ទាញឆ្វេង (-): ធ្វើឱ្យរូបប្រែជាស-ខ្មៅ (Black & White)។\n➡️ ទាញស្តាំ (+): បង្កើនភាពដិតពណ៌ "ទាំងអស់" ស្មើៗគ្នា។ បើទាញវាខ្លាំងពេក ស្បែកមនុស្សនឹងទៅជាលឿង ឬក្រហមឆ្អៅ។\n\n✨ Vibrance (ឆ្លាតវៃជាង):\n➡️ ទាញស្តាំ (+): វាទាញបង្កើនភាពដិតតែពណ៌ណាដែល "ស្លេក" ប៉ុណ្ណោះ ហើយវាឆ្លាតវៃអាចការពាមិនឱ្យប៉ះពាល់ដល់ពណ៌ស្បែកមនុស្សឡើយ។', 
          tip: '💡 សម្រាប់រូប Portrait នារីៗ គួរប្រើប្រាស់ Vibrance ជានិច្ច (+15 ទៅ +30) ហើយជៀសវាងការប្រើប្រាស់ Saturation បើមិនចាំបាច់។' 
      }, 
      { 
          tool: 'Color Mix (HSL)', 
          khmer: 'លាយពណ៌ (កែពណ៌ដាច់ដោយឡែក)', 
          shortDesc: 'គ្រប់គ្រងពណ៌នីមួយៗដាច់ដោយឡែកពីគ្នា (Hue, Saturation, Luminance)។',
          image: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80',
          advancedUI: 'color_mix',
          desc: 'HSL គឺជាឧបករណ៍ដ៏មានឥទ្ធិពលបំផុតសម្រាប់អ្នកកែរូប ព្រោះវាអនុញ្ញាតឱ្យយើងជ្រើសរើសកែពណ៌នីមួយៗ (ក្នុងចំណោម ៨ពណ៌) ដាច់ដោយឡែកពីគ្នា៖\n\n⬅️ ទាញទៅឆ្វេង (-): ប្តូរពណ៌ទៅលាំពណ៌មួយទៀត (ឧទាហរណ៍៖ ទាញពណ៌បៃតងទៅឆ្វេង ឱ្យស្លឹកឈើទៅជាពណ៌លឿង)\n➡️ ទាញទៅស្តាំ (+): ប្តូរពណ៌ទៅលាំផ្ទុយគ្នា (ឧទាហរណ៍៖ ទាញពណ៌បៃតងទៅស្តាំ ឱ្យស្លឹកឈើទៅជាពណ៌ខៀវ)', 
          tip: '💡 គន្លឹះធ្វើឱ្យស្បែកមុខតួអង្គភ្លឺសរលោង៖ សូមជ្រើសរើសពណ៌ Orange (ទឹកក្រូច) រួចទាញ Luminance ឡើងបូក (+) ឱ្យភ្លឺ និងបន្ថយ Saturation ដក (-) បន្តិចកុំឱ្យមុខលឿងពេក។' 
      },
      { 
          tool: 'Color Grading', 
          khmer: 'ចាក់ពណ៌ (ស្តាយកុន)', 
          shortDesc: 'ចាក់ពណ៌ចូលរង្វង់ទាំង ៤ (Shadows, Midtones, Highlights, Global) និងកំណត់ Blending/Balance។',
          image: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=800&q=80',
          advancedUI: 'color_grading',
          desc: 'Color Grading ក្នុង Lightroom Mobile មានរង្វង់ពណ៌ចំនួន ៤ និង Slider សំខាន់ៗចំនួន ៣ សម្រាប់បង្កើត Mood ភាពយន្ត៖\n\n' +
                '🎯 រង្វង់ពណ៌ទាំង ៤ (Color Wheels)៖\n' +
                '១. 🌑 Shadows (ស្រមោល): ចាក់ពណ៌ចូលតែតំបន់ងងឹត។ និយមប្រើពណ៌ Teal ឬ ខៀវទឹកប៊ិច។\n' +
                '២. 🌗 Midtones (កណ្តាល): ចាក់ពណ៌ចូលតំបន់កណ្តាល (ប៉ះពាល់ដល់ពណ៌ស្បែកមនុស្សខ្លាំងជាងគេ)។\n' +
                '៣. 🌕 Highlights (ផ្នែកភ្លឺ): ចាក់ពណ៌ចូលកន្លែងភ្លឺបំផុត។ និយមប្រើពណ៌ Orange ឬ លឿង។\n' +
                '៤. 🌍 Global (រួម): ចាក់ពណ៌តែមួយស្រោបពីលើរូបភាពទាំងមូល។\n\n' +
                '🎚️ ឧបករណ៍បញ្ជាបន្ថែម (Sliders)៖\n' +
                '• 💡 Luminance: ប្រើសម្រាប់ទាញតំបន់នោះឱ្យភ្លឺឡើង (+) ឬងងឹតចុះ (-)\n' +
                '• 🌫️ Blending: កំណត់ភាពរលាយចូលគ្នារវាងពណ៌រង្វង់ទាំង ៣។ លេខកាន់តែធំ ពណ៌កាន់តែរលាយចូលគ្នាទន់ល្អ\n' +
                '• ⚖️ Balance: កំណត់ទម្ងន់ពណ៌។ អូសទៅឆ្វេង (-) លម្អៀងទៅ Shadows ច្រើនជាង។ អូសទៅស្តាំ (+) លម្អៀងទៅ Highlights។', 
          tip: '🎬 រូបមន្ត Teal & Orange: ដាក់ពណ៌ Teal ក្នុងរង្វង់ Shadows, ពណ៌ Orange ក្នុង Highlights រួចទាញ Blending ទៅ 100 និងទាញ Balance ទៅឆ្វេងបន្តិច ដើម្បីឱ្យស៊ីពណ៌គ្នាឥតខ្ចោះ!' 
      }
    ] 
  },
  { id: 'effects', title: 'បែបផែន (Effects)', icon: <Aperture className="w-6 h-6 text-purple-400" />, description: 'Texture, Clarity, Dehaze', content: [
    { 
        tool: 'Texture', 
        khmer: 'វាយនភាព', 
        shortDesc: 'កែផ្ទៃអោយគ្រើម (ឃើញលម្អិត) ឬរលោង។ ល្អសម្រាប់កែស្បែកមុខ។',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'texture', actionText: (v) => v > 0 ? `លម្អិតច្បាស់គ្រើម (+${v})` : v < 0 ? `ស្បែកម៉ត់រលោង (${v})` : 'ដើម' },
        desc: 'Texture ផ្តោតលើភាពលម្អិតតូចៗ (Micro-details) នៃរូបភាព។\n\n⬅️ ទាញទៅឆ្វេង (-): ធ្វើឱ្យផ្ទៃរូបភាពរលោង។ ល្អបំផុតសម្រាប់ធ្វើឱ្យស្បែកមុខម៉ត់រលោង (Skin Smoothing) ដោយមិនធ្វើឱ្យភ្នែកឬសក់ព្រិលឡើយ។\n➡️ ទាញទៅស្តាំ (+): បង្កើនភាពច្បាស់ និងភាពគ្រើមនៃសាច់រូប ល្អសម្រាប់រូបថតទេសភាព ឬសម្លៀកបំពាក់។', 
        tip: 'ឧទាហរណ៍៖ ដាក់ -15 ទៅ -25 សម្រាប់ធ្វើឱ្យស្បែកមុខម៉ត់រលោង។' 
    }, 
    { 
        tool: 'Clarity', 
        khmer: 'ភាពច្បាស់', 
        shortDesc: 'បង្កើន Contrast នៅតំបន់កណ្តាល (Midtones) ធ្វើឱ្យរូបមើលទៅរឹងមាំ។',
        image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'clarity', actionText: (v) => v > 0 ? `រឹងមាំ មុតស្រួច (+${v})` : v < 0 ? `ស្រទន់ យល់សប្តិ (${v})` : 'ដើម' },
        desc: 'Clarity បង្កើនភាពផ្ទុយ (Contrast) តែនៅត្រង់តំបន់កណ្តាលៗ (Midtones) ប៉ុណ្ណោះ។\n\n⬅️ ទាញទៅឆ្វេង (-): ធ្វើឱ្យរូបភាពស្រទន់ មើលទៅដូចសុបិន (Dreamy/Glow effect)។\n➡️ ទាញទៅស្តាំ (+): ធ្វើឱ្យរូបភាពមើលទៅរឹងមាំ មុតស្រួច និងដិតខ្លាំង។', 
        tip: 'ប្រយ័ត្ន៖ កុំប្រើ Clarity បូកច្រើនលើមុខមនុស្សស្រី ព្រោះវាធ្វើឱ្យឃើញស្នាមជ្រីវជ្រួញច្បាស់ និងមើលទៅចាស់! ល្អសម្រាប់រូបថត Street ឬ Landscape (+20 ទៅ +30)។' 
    }, 
    { 
        tool: 'Dehaze', 
        khmer: 'កាត់អ័ព្ទ', 
        shortDesc: 'លុបអ័ព្ទ ឬផ្សែងដើម្បីធ្វើឱ្យរូបថ្លា ឬបន្ថែមអ័ព្ទសម្រាប់អារម្មណ៍ Cinematic។',
        image: 'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?auto=format&fit=crop&w=800&q=80',
        slider: { min: -100, max: 100, step: 1, default: 0, type: 'dehaze', actionText: (v) => v > 0 ? `លុបអ័ព្ទ ថ្លាឆ្វង់ (+${v})` : v < 0 ? `បន្ថែមអ័ព្ទ (${v})` : 'ដើម' },
        desc: 'Dehaze គឺជាឧបករណ៍ដ៏មានឥទ្ធិពលបំផុតសម្រាប់រូបថតទេសភាព!\n\n⬅️ ទាញទៅឆ្វេង (-): បន្ថែមអ័ព្ទពណ៌សចូលទៅក្នុងរូបភាព បង្កើតជាបរិយាកាសអាថ៌កំបាំង ឬរដូវរងា។\n➡️ ទាញទៅស្តាំ (+): លុបអ័ព្ទ ផ្សែង ឬធូលី ធ្វើឱ្យមេឃដែលស្រអាប់ ក្លាយជាថ្លាឆ្វង់ និងដិតពណ៌មកវិញភ្លាមៗ។', 
        tip: 'ឧទាហរណ៍៖ ថតទេសភាពមេឃស្រអាប់នៅពេលថ្ងៃ ដាក់ Dehaze +15 ទៅ +25 ធ្វើឱ្យមេឃដិតនិងស្រឡះ។' 
    }
  ] },
  { id: 'detail', title: 'ភាពលម្អិត (Detail)', icon: <Triangle className="w-6 h-6 text-pink-400" />, description: 'Sharpening & Noise', content: [
    { 
        tool: 'Sharpening', 
        khmer: 'ភាពមុត', 
        shortDesc: 'ធ្វើអោយគែមនៃវត្ថុក្នុងរូបកាន់តែច្បាស់ និងមុតស្រួច។',
        image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80',
        slider: { min: 0, max: 100, step: 1, default: 0, type: 'sharpening', actionText: (v) => v > 0 ? `គែមវត្ថុមុតស្រួច (+${v})` : 'ធម្មតា (ដើម)' },
        desc: 'Sharpening បង្កើនភាពច្បាស់ (Sharpness) ដោយស្វែងរកគែមនៃវត្ថុ ហើយបង្កើនពន្លឺរបស់វា។\n\n➡️ ទាញទៅស្តាំ (+): ធ្វើឱ្យរូបភាពកាន់តែមុតស្រួច (Sharp)។\n\n💡 អ្វីដែលសំខាន់បំផុតគឺមុខងារ Masking ដែលនៅពីក្រោមវា៖\n- បើបងអូស Masking ទៅស្តាំ (ចុច Alt ជាប់ដើម្បីមើល) វានឹងធ្វើឱ្យច្បាស់តែត្រង់គែមវត្ថុ (សក់ ភ្នែក) ប៉ុណ្ណោះ ដោយរក្សាផ្ទៃស្បែកឱ្យនៅរលោងដដែល។', 
        tip: 'តែងតែប្រើ Sharpening អមជាមួយ Masking កម្រិត 50 ទៅ 70 ដើម្បីកុំឱ្យស្បែកមុខមនុស្សឡើងគ្រើម!' 
    }, 
    { 
        tool: 'Noise Reduction', 
        khmer: 'កាត់បន្ថយគ្រាប់', 
        shortDesc: 'លុបគ្រាប់ Noise ដែលកើតឡើងដោយសារថតយប់ ឬប្រើ ISO ខ្ពស់។',
        image: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=800&q=80',
        slider: { min: 0, max: 100, step: 1, default: 0, type: 'noise', actionText: (v) => v > 0 ? `រូបម៉ត់រលោង លុប Noise (+${v})` : 'មានគ្រាប់ Noise (ដើម)' },
        desc: 'ពេលបងថតរូបនៅកន្លែងងងឹតដោយប្រើ ISO ខ្ពស់ រូបភាពនឹងលេចចេញនូវគ្រាប់អុចៗ (Noise)។\n\n➡️ ទាញ Luminance Noise Reduction ទៅស្តាំ (+): វានឹងធ្វើការលុបបំបាត់គ្រាប់ទាំងនោះ ធ្វើឱ្យរូបភាពត្រលប់មកម៉ត់វិញ។\n\n⚠️ ការព្រមាន៖ បើទាញវាកាន់តែខ្លាំង រូបភាពនឹងបាត់បង់ភាពច្បាស់ ហើយមើលទៅព្រិលៗដូចជ័រ។ ដូច្នេះគួរទាញត្រឹម +20 ទៅ +40 បានហើយ។', 
        tip: 'បច្ចុប្បន្ន Lightroom មានមុខងារ AI Denoise ដែលអាចលុប Noise បាន 100% ដោយមិនព្រិលរូប ប៉ុន្តែវាស៊ីកម្លាំងកុំព្យូទ័រខ្លាំង។' 
    }
  ] },
  { id: 'crop', title: 'កាត់រូប (Crop)', icon: <Crop className="w-6 h-6 text-green-500" />, description: 'កាត់ទំហំ និងតម្រង់រូបភាព', content: [
      { 
          tool: 'Aspect Ratio', 
          khmer: 'ទំហំរូប', 
          shortDesc: 'កាត់រូបភាពឱ្យត្រូវនឹងខ្នាតស្តង់ដារបណ្តាញសង្គម។',
          advancedUI: 'ratio_graphic',
          desc: 'ការកាត់ទំហំរូបភាពគឺជារឿងសំខាន់បំផុតមុននឹងផុសរូប! \n\n- ទំហំ 4:5 (Portrait): ល្អបំផុតសម្រាប់ Instagram Feed ព្រោះវាបង្ហាញពេញអេក្រង់ទូរស័ព្ទ។\n- ទំហំ 16:9 (Landscape): សម្រាប់ YouTube ទូរទស្សន៍ ឬ Facebook ផ្តេក។\n- 1:1 (Square): សម្រាប់ Profile Picture។', 
          tip: '💡 ប្រើខ្នាត 4:5 ជានិច្ចពេលផុស IG ដើម្បីកុំឱ្យគេកាត់រូបបងចោល!' 
      },
      { 
          tool: 'Straighten (តម្រង់ប្លង់)', 
          khmer: 'តម្រង់រូប', 
          shortDesc: 'បង្វិលរូបភាពដែលថតមកវៀច ឱ្យត្រង់ស្អាតវិញ។',
          image: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=800&q=80',
          advancedUI: 'straighten_before_after',
          desc: 'គ្មានអ្នកណាចង់មើលរូបភាពដែលថតវៀចទឹករលក ឬវៀចជើងមេឃនោះទេ!\n\nប្រើប្រាស់មុខងារ Straighten ឬអូសនៅខាងក្រៅប្រអប់កាត់រូប ដើម្បីបង្វិលរូបភាពឱ្យអគារ ឬខ្សែជើងមេឃត្រង់ភ្លឹង ៩០ ដឺក្រេវិញ។', 
          tip: '💡 នៅក្នុង Lightroom បងអាចចុចប៊ូតុង "Auto" ក្នុងប្រអប់ Crop ដើម្បីឱ្យ AI ជួយតម្រង់រូបដោយស្វ័យប្រវត្តិ។' 
      }
  ] },
  { id: 'optics', title: 'កែវថត (Optics)', icon: <Aperture className="w-6 h-6 text-blue-400" />, description: 'កែតម្រូវកំហុសកែវថត', content: [
      { 
          tool: 'Lens Profile Correction', 
          khmer: 'កែកែវថត', 
          shortDesc: 'លុបភាពកោង (Distortion) និងគែមខ្មៅ (Vignette) ពីកាមេរ៉ា។',
          image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
          advancedUI: 'lens_switch',
          desc: 'កែវថត (Lens) ភាគច្រើន ពិសេស Lens Wide-angle តែងតែធ្វើឱ្យរូបភាពមានសភាពកោងប៉ោង និងមានគែមងងឹត (Vignette) ដោយអចេតនា។\n\n➡️ ចុចបើក "Enable Profile Corrections": កម្មវិធីនឹងស្គាល់ម៉ាកកាមេរ៉ារបស់បង រួចធ្វើការទាញរូបឱ្យត្រង់ និងភ្លឺគែមមកវិញភ្លាមៗដោយស្វ័យប្រវត្តិ។', 
          tip: '💡 នេះជាជំហានដែល Pro Retoucher តែងតែបើកវាជានិច្ច (១០០%) មុននឹងចាប់ផ្តើមកែពណ៌អ្វីទាំងអស់!' 
      },
      { 
          tool: 'Chromatic Aberration', 
          khmer: 'លុបពណ៌តាមគែម', 
          shortDesc: 'លុបពណ៌ស្វាយ ឬបៃតងដែលហៀរចេញនៅតាមគែមវត្ថុ។',
          image: 'https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?auto=format&fit=crop&w=800&q=80',
          advancedUI: 'chromatic_graphic',
          desc: 'នៅពេលថតរូបដែលមានពន្លឺកាត់គ្នាខ្លាំង (ឧទាហរណ៍ ថតស្លឹកឈើទល់នឹងមេឃស) វានឹងមានហៀរពណ៌ស្វាយ (Purple fringing) ឬបៃតង នៅតាមគែមវត្ថុ។\n\nគ្រាន់តែធីកយកពាក្យ "Remove Chromatic Aberration" ពណ៌ដែលរំខានទាំងនោះនឹងបាត់រលីង។', 
          tip: '💡 បើកវាជានិច្ច ដើម្បីឱ្យរូបភាពបងមើលទៅម៉ត់ និងមានគុណភាពខ្ពស់ដូចថតនឹងកែវថតថ្លៃៗ។' 
      }
  ] }
];

const LessonItem = ({ id, item, isExpanded, onToggle, isDarkMode }) => {
    const [sliderValue, setSliderValue] = useState(item.slider ? item.slider.default : 0);
    const [multiSliders, setMultiSliders] = useState(item.sliders ? item.sliders.reduce((acc, s) => ({...acc, [s.id]: s.default}), {}) : {});
    const [isSwitchedOn, setIsSwitchedOn] = useState(false);

    const [activeMixColor, setActiveMixColor] = useState('Orange');
    const [mixSettings, setMixSettings] = useState({
        Red: {h:0,s:0,l:0}, Orange: {h:0,s:0,l:0}, Yellow: {h:0,s:0,l:0}, Green: {h:0,s:0,l:0},
        Aqua: {h:0,s:0,l:0}, Blue: {h:0,s:0,l:0}, Purple: {h:0,s:0,l:0}, Magenta: {h:0,s:0,l:0}
    });

    const [activeWheel, setActiveWheel] = useState('Shadows');
    const [gradingSettings, setGradingSettings] = useState({
        Shadows: {h:220, s:0, l:0}, Midtones: {h:45, s:0, l:0}, Highlights: {h:35, s:0, l:0}, Global: {h:0, s:0, l:0},
        Blending: 50, Balance: 0
    });
    
    const [activeRatio, setActiveRatio] = useState('4:5'); // បន្ថែម State សម្រាប់មុខងារ Crop Simulator

    const colorsList = [
        { name: 'Red', hex: '#FF0000' }, { name: 'Orange', hex: '#FF6600' },
        { name: 'Yellow', hex: '#FFCC00' }, { name: 'Green', hex: '#00FF00' },
        { name: 'Aqua', hex: '#00FFFF' }, { name: 'Blue', hex: '#0000FF' },
        { name: 'Purple', hex: '#9900FF' }, { name: 'Magenta', hex: '#FF00FF' }
    ];

    const hslToRgb = (h, s, l) => {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [f(0), f(8), f(4)];
    };

    const getMatrixValue = () => {
        if (item.advancedUI === 'color_grading') {
            let r = 1, g = 1, b = 1;
            const blend = gradingSettings.Blending / 100;
            const bal = gradingSettings.Balance / 100;
            const shadowWeight = 1 - Math.max(0, bal);
            const highlightWeight = 1 + Math.min(0, bal);

            const applyColor = (wKey, weight) => {
                if (gradingSettings[wKey].s > 0) {
                    const [cr, cg, cb] = hslToRgb(gradingSettings[wKey].h, 100, 50);
                    r += (cr - 0.5) * (gradingSettings[wKey].s / 100) * weight * (0.5 + blend * 0.5);
                    g += (cg - 0.5) * (gradingSettings[wKey].s / 100) * weight * (0.5 + blend * 0.5);
                    b += (cb - 0.5) * (gradingSettings[wKey].s / 100) * weight * (0.5 + blend * 0.5);
                }
            };

            applyColor('Shadows', 0.8 * shadowWeight);
            applyColor('Highlights', 0.6 * highlightWeight);
            if (gradingSettings.Global.s > 0) {
                const [gr, gg, gb] = hslToRgb(gradingSettings.Global.h, 100, 50);
                r += (gr - 0.5) * (gradingSettings.Global.s / 100) * 0.5;
                g += (gg - 0.5) * (gradingSettings.Global.s / 100) * 0.5;
                b += (gb - 0.5) * (gradingSettings.Global.s / 100) * 0.5;
            }
            return `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
        }
        if (item.advancedUI === 'color_mix') {
            let rOff = (mixSettings.Red.s + mixSettings.Orange.s) * 0.001;
            let gOff = mixSettings.Green.s * 0.001;
            let bOff = (mixSettings.Blue.s + mixSettings.Aqua.s) * 0.001;
            return `1 0 0 0 ${rOff}  0 1 0 0 ${gOff}  0 0 1 0 ${bOff}  0 0 0 1 0`;
        }
        if (item.sliders && item.tool.includes('Temp')) {
            const temp = multiSliders.temp || 0;
            const tint = multiSliders.tint || 0;
            let r = 1 + (temp/100 * 0.2) + (tint/100 * 0.1);
            let g = 1 - (Math.abs(temp/100) * 0.05) - (tint/100 * 0.15);
            let b = 1 - (temp/100 * 0.2) + (tint/100 * 0.1);
            return `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
        }
        return `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0`;
    };

    const getFilterStyle = () => {
        if (item.advancedUI === 'color_grading' || item.advancedUI === 'color_mix' || (item.sliders && item.tool.includes('Temp'))) {
            let filter = `url(#filter-${item.tool.replace(/[^a-zA-Z]/g, '')})`;
            if (item.advancedUI === 'color_mix') {
                filter += ` saturate(${100 + mixSettings[activeMixColor].s}%) brightness(${100 + (mixSettings[activeMixColor].l * 0.5)}%) hue-rotate(${mixSettings[activeMixColor].h}deg)`;
            }
            if (item.advancedUI === 'color_grading') {
                filter += ` brightness(${100 + (gradingSettings[activeWheel].l * 0.5)}%)`;
            }
            return filter;
        }
        if (item.sliders && item.tool.includes('Vibrance')) {
            const vib = multiSliders.vibrance || 0;
            const sat = multiSliders.saturation || 0;
            return `saturate(${100 + sat + (vib * 0.8)}%)`;
        }
        if (!item.slider) return 'none';
        let val = sliderValue;
        switch(item.slider.type) {
            case 'exposure': return `brightness(${100 + (val * 20)}%)`;
            case 'contrast': return `contrast(${100 + val}%)`;
            case 'highlights': return `brightness(${100 + (val * 0.4)}%) contrast(${100 + (val * 0.2)}%)`;
            case 'shadows': return `brightness(${100 + (val * 0.5)}%) contrast(${100 - (val * 0.2)}%)`;
            case 'whites': return `brightness(${100 + (val * 0.5)}%) contrast(${100 + (val * 0.1)}%)`;
            case 'blacks': return `brightness(${100 + (val * 0.4)}%) contrast(${100 + (val * 0.3)}%)`;
            case 'saturation': return `saturate(${100 + val}%)`;
            case 'vibrance': return `saturate(${100 + (val * 0.8)}%)`;
            case 'temp': return `sepia(50%) hue-rotate(${val > 0 ? -30 : 180}deg) saturate(${100 + Math.abs(val)}%)`;
            case 'texture': return val < 0 ? `blur(${Math.abs(val) * 0.04}px)` : `contrast(${100 + val * 0.4}%)`;
            case 'clarity': return `contrast(${100 + val * 0.8}%)`;
            case 'dehaze': return `contrast(${100 + val * 0.6}%) saturate(${100 + val * 0.5}%) brightness(${100 - val * 0.1}%)`;
            case 'hue': return `hue-rotate(${val}deg)`;
            case 'grading_sim': return `sepia(${Math.abs(val)}%) hue-rotate(${val > 0 ? -30 : 180}deg)`;
            case 'rotate': return `rotate(${val}deg) scale(1.4)`;
            case 'lens_sim': return `contrast(${100 - (val * 0.2)}%) brightness(${100 + (val * 0.2)}%)`;
            case 'sharpening': return `contrast(${100 + val * 0.6}%)`;
            case 'noise': return `blur(${val * 0.03}px) contrast(${100 - (val * 0.1)}%)`;
            default: return 'none';
        }
    };

    return (
        <div id={id} onClick={onToggle} className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 ease-spring group cursor-pointer ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] hover:border-[#C65102]/50' : 'bg-[#FFFFFF] border-[#E0E0E0] hover:border-[#C65102]/50'}`}>
            <div className="flex justify-between items-center mb-3 gap-3">
                <div className="flex items-center gap-2 flex-1">
                    <span className={`font-bold text-lg group-hover:text-[#C65102] transition-colors ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{item.tool}</span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg font-khmer border whitespace-nowrap ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6] border-[#2C2C2C]' : 'bg-[#FAFAFA] text-[#5F6368] border-[#E0E0E0]'}`}>{item.khmer}</span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180 text-[#C65102]' : (isDarkMode ? 'text-[#5F6368]' : 'text-[#9AA0A6]')}`} />
            </div>
            
            {/* Short Description */}
            <p className={`text-sm font-khmer leading-relaxed line-clamp-2 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
                {item.shortDesc || item.desc.split('\n')[0]}
            </p>
            
            {/* 💡 រើ Tip មកខាងក្រៅ ដើម្បីឱ្យឃើញជានិច្ច 💡 */}
            {item.tip && (
                <div className={`mt-4 pt-3 border-t flex items-start space-x-2 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}>
                    <span className="text-[13px] mt-0.5">💡</span>
                    <p className={`text-xs font-khmer font-medium leading-relaxed ${isDarkMode ? 'text-yellow-500/90' : 'text-[#C65102]'}`}>
                        {item.tip}
                    </p>
                </div>
            )}
            
            {isExpanded && (
                <div className="mt-5 pt-5 border-t border-[#C65102]/10 animate-fade-in-up cursor-default" onClick={(e) => e.stopPropagation()}>
                    
                    {/* UI: Slider ធម្មតា តែមួយ */}
                    {item.slider && item.image && !item.advancedUI && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            <div className="w-full h-48 sm:h-64 overflow-hidden rounded-xl mb-4 relative">
                                <img src={item.image} crossOrigin="anonymous" alt={item.tool} className="w-full h-full object-cover transition-all duration-100" style={{ filter: getFilterStyle() }} />
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                    {sliderValue > 0 ? `+${sliderValue.toFixed(item.slider.step < 1 ? 1 : 0)}` : sliderValue.toFixed(item.slider.step < 1 ? 1 : 0)}
                                </div>
                            </div>
                            
                            <input 
                                type="range" 
                                min={item.slider.min} max={item.slider.max} step={item.slider.step} 
                                value={sliderValue} 
                                onChange={(e) => setSliderValue(Number(e.target.value))} 
                                className="w-full appearance-none cursor-pointer outline-none"
                            />
                            
                            {item.slider.actionText && (
                                <p className={`mt-3 text-sm font-khmer font-bold text-center ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>
                                    {item.slider.actionText(sliderValue)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* UI: សម្រាប់ Multi Sliders (Temp/Tint, Vibrance/Sat) */}
                    {item.sliders && item.image && !item.advancedUI && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            <div className="w-full h-48 sm:h-64 overflow-hidden rounded-xl mb-6 relative">
                                {item.tool.includes('Temp') && (
                                    <svg width="0" height="0" className="absolute pointer-events-none">
                                        <filter id={`filter-${item.tool.replace(/[^a-zA-Z]/g, '')}`} colorInterpolationFilters="sRGB">
                                            <feColorMatrix type="matrix" values={getMatrixValue()} />
                                        </filter>
                                    </svg>
                                )}
                                <img src={item.image} crossOrigin="anonymous" alt={item.tool} className="w-full h-full object-cover transition-all duration-100" style={{ filter: getFilterStyle() }} />
                            </div>
                            <div className="space-y-3 px-2">
                            {item.sliders.map(s => (
                                <div key={s.id} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between">
                                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{s.label}</label>
                                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>{multiSliders[s.id] > 0 ? `+${multiSliders[s.id]}` : multiSliders[s.id]}</span>
                                    </div>
                                    <input 
                                        type="range" min={s.min} max={s.max} step={s.step} 
                                        value={multiSliders[s.id]} 
                                        onChange={(e) => setMultiSliders({...multiSliders, [s.id]: Number(e.target.value)})} 
                                        className={`w-full appearance-none cursor-pointer outline-none ${s.id === 'temp' ? 'grad-temp' : s.id === 'tint' ? 'grad-tint' : ''}`}
                                    />
                                </div>
                            ))}
                            </div>
                        </div>
                    )}

                    {/* UI: Advanced Color Mix (HSL) */}
                    {item.advancedUI === 'color_mix' && item.image && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            <div className="w-full h-48 sm:h-64 overflow-hidden rounded-xl mb-6 relative">
                                <svg width="0" height="0" className="absolute pointer-events-none">
                                    <filter id={`filter-${item.tool.replace(/[^a-zA-Z]/g, '')}`} colorInterpolationFilters="sRGB">
                                        <feColorMatrix type="matrix" values={getMatrixValue()} />
                                    </filter>
                                </svg>
                                <img src={item.image} crossOrigin="anonymous" alt={item.tool} className="w-full h-full object-cover transition-all duration-100" style={{ filter: getFilterStyle() }} />
                            </div>
                            <div className="flex justify-between gap-1 mb-5 px-1">
                                {colorsList.map(c => (
                                    <button key={c.name} onClick={() => setActiveMixColor(c.name)} style={{ backgroundColor: c.hex }} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${activeMixColor === c.name ? (isDarkMode ? 'border-[#E3E3E3] scale-110 shadow-lg ring-2 ring-[#2C2C2C]' : 'border-[#1A1C1E] scale-110 shadow-lg ring-2 ring-[#E0E0E0]') : 'border-transparent opacity-80 hover:opacity-100'} transition-all duration-300 ease-spring`} />
                                ))}
                            </div>
                            <div className="space-y-2 px-2">
                                {['Hue', 'Sat', 'Lum'].map((type) => { 
                                    const key = type.toLowerCase().charAt(0);
                                    return (
                                        <div key={type} className="flex items-center gap-3">
                                            <label className={`text-[10px] font-bold uppercase w-8 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{type}</label>
                                            <input type="range" min={type==='Hue'?'-180':'-100'} max={type==='Hue'?'180':'100'} value={mixSettings[activeMixColor][key]} onChange={(e)=>setMixSettings({...mixSettings, [activeMixColor]: {...mixSettings[activeMixColor], [key]: Number(e.target.value)}})} className={`flex-1 appearance-none cursor-pointer outline-none ${type === 'Hue' ? 'grad-hue' : type === 'Sat' ? 'grad-sat' : 'grad-lum'}`} />
                                            <span className={`w-6 text-right text-xs font-bold ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{mixSettings[activeMixColor][key]}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* UI: សម្រាប់ Interactive Crop Simulator (Aspect Ratio) */}
                    {item.advancedUI === 'ratio_graphic' && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            {/* កន្លែងបង្ហាញរូប និងប្រអប់កាត់ */}
                            <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden mb-5 flex items-center justify-center bg-black/10">
                                <img src={item.image || "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80"} alt="Crop Sample" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                
                                {/* ផ្ទាំងកាត់រូប (Crop Window) */}
                                <div 
                                    className="relative border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.6)] transition-all duration-500 ease-spring flex items-center justify-center z-10"
                                    style={{
                                        width: activeRatio === '16:9' ? '90%' : activeRatio === '1:1' ? '80%' : '72%',
                                        height: activeRatio === '16:9' ? '50.625%' : activeRatio === '1:1' ? '80%' : '90%',
                                    }}
                                >
                                    {/* បន្ទាត់ Rule of Thirds */}
                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                                        <div className="border-r border-b border-white"></div>
                                        <div className="border-r border-b border-white"></div>
                                        <div className="border-b border-white"></div>
                                        <div className="border-r border-b border-white"></div>
                                        <div className="border-r border-b border-white"></div>
                                        <div className="border-b border-white"></div>
                                        <div className="border-r border-white"></div>
                                        <div className="border-r border-white"></div>
                                        <div></div>
                                    </div>
                                </div>
                            </div>

                            {/* ប៊ូតុងបញ្ជា */}
                            <div className={`flex justify-around w-full p-1.5 rounded-xl ${isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#E0E0E0]'}`}>
                                {['16:9', '1:1', '4:5'].map(r => (
                                    <button 
                                        key={r} 
                                        onClick={() => setActiveRatio(r)} 
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ease-spring ${activeRatio === r ? 'bg-[#C65102] text-white shadow-md' : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}
                                    >
                                        {r}
                                        <span className={`block text-[9px] font-normal font-khmer mt-0.5 ${activeRatio === r ? 'opacity-90' : 'opacity-60'}`}>
                                            {r === '16:9' ? 'YouTube/FB' : r === '1:1' ? 'Profile' : 'IG Feed'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* UI: សម្រាប់ Straighten Before & After */}
                    {item.advancedUI === 'straighten_before_after' && item.image && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Before: Crooked Image (Zoomed to hide edges) */}
                                <div className="flex flex-col gap-2">
                                    <div className="w-full aspect-[4/5] rounded-xl overflow-hidden relative border border-red-500/30">
                                        <img src={item.image} alt="Before" className="w-full h-full object-cover transform -rotate-[12deg] scale-[1.35]" />
                                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                                            <div className="w-full h-[1.5px] bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.8)] transform rotate-[12deg]"></div>
                                        </div>
                                        <span className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-md backdrop-blur-md font-khmer">ថតវៀច</span>
                                    </div>
                                </div>
                                {/* After: Straight Image (Same Zoom to match result) */}
                                <div className="flex flex-col gap-2">
                                    <div className="w-full aspect-[4/5] rounded-xl overflow-hidden relative border border-[#34C759]/40">
                                        <img src={item.image} alt="After" className="w-full h-full object-cover scale-[1.35]" />
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                                            <div className="border-r border-b border-white"></div>
                                            <div className="border-r border-b border-white"></div>
                                            <div className="border-b border-white"></div>
                                            <div className="border-r border-b border-white"></div>
                                            <div className="border-r border-b border-white"></div>
                                            <div className="border-b border-white"></div>
                                            <div className="border-r border-white"></div>
                                            <div className="border-r border-white"></div>
                                            <div></div>
                                        </div>
                                        <span className="absolute top-2 left-2 bg-[#34C759]/90 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-md backdrop-blur-md font-khmer">តម្រង់រួច</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UI: សម្រាប់ Lens Profile Correction (Switch Button) */}
                    {item.advancedUI === 'lens_switch' && item.image && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            <div className="w-full h-48 sm:h-64 rounded-xl mb-5 relative overflow-hidden bg-black border border-white/5">
                                <img
                                    src={item.image}
                                    alt={item.tool}
                                    className={`w-full h-full object-cover transition-all duration-700 ease-out ${isSwitchedOn ? 'scale-100' : 'scale-[1.08]'}`}
                                    style={{ filter: isSwitchedOn ? 'contrast(100%) brightness(100%)' : 'contrast(105%) brightness(90%)' }}
                                />
                                {/* Simulated Vignette for OFF state */}
                                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${isSwitchedOn ? 'opacity-0' : 'opacity-100'}`} style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 120%)' }}></div>
                                
                                <span className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded-md font-bold shadow-md backdrop-blur-md font-khmer transition-all ${isSwitchedOn ? 'bg-[#34C759]/90 text-white' : 'bg-black/60 text-white border border-white/20'}`}>
                                    {isSwitchedOn ? 'កែតម្រូវរួចរាល់' : 'រូបដើមពីកាមេរ៉ា (មានគែមខ្មៅ)'}
                                </span>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-xl border shadow-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] hover:bg-[#2C2C2E]' : 'bg-[#FFFFFF] border-[#E0E0E0] hover:bg-[#FAFAFA]'}`} onClick={() => { setIsSwitchedOn(!isSwitchedOn); if(typeof triggerHaptic !== 'undefined') triggerHaptic(); }}>
                                <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>Enable Profile Corrections</span>
                                <button
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${isSwitchedOn ? 'bg-[#34C759]' : (isDarkMode ? 'bg-[#3A3A3C]' : 'bg-[#D1D5DB]')}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ease-spring shadow-sm`} style={{ transform: isSwitchedOn ? 'translateX(26px)' : 'translateX(2px)' }}></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* UI: Advanced Color Grading */}
                    {item.advancedUI === 'color_grading' && item.image && (
                        <div className={`mb-6 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                            <div className="w-full h-48 sm:h-64 overflow-hidden rounded-xl mb-5 relative">
                                <svg width="0" height="0" className="absolute pointer-events-none">
                                    <filter id={`filter-${item.tool.replace(/[^a-zA-Z]/g, '')}`} colorInterpolationFilters="sRGB">
                                        <feColorMatrix type="matrix" values={getMatrixValue()} />
                                    </filter>
                                </svg>
                                <img src={item.image} crossOrigin="anonymous" alt={item.tool} className="w-full h-full object-cover transition-all duration-100" style={{ filter: getFilterStyle() }} />
                            </div>
                            
                            <div className={`flex justify-around mb-5 p-1 rounded-xl ${isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#E0E0E0]'}`}>
                                {['Shadows', 'Midtones', 'Highlights', 'Global'].map(t => (
                                    <button key={t} onClick={() => setActiveWheel(t)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeWheel === t ? (isDarkMode ? 'bg-[#1E1E1E] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>{t}</button>
                                ))}
                            </div>
                            
                            <div className="flex flex-col items-center">
                                <div className="pointer-events-auto mb-6">
                                    <ColorWheel hue={gradingSettings[activeWheel].h} sat={gradingSettings[activeWheel].s} onChange={(h, s) => setGradingSettings({...gradingSettings, [activeWheel]: {...gradingSettings[activeWheel], h, s}})} size={140} isDarkMode={isDarkMode} />
                                </div>
                                
                                <div className="w-full space-y-3 px-2">
                                    <div className="flex items-center gap-3">
                                        <label className={`text-[10px] font-bold uppercase w-14 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Lum</label>
                                        <input type="range" min="-100" max="100" value={gradingSettings[activeWheel].l} onChange={(e)=>setGradingSettings({...gradingSettings, [activeWheel]: {...gradingSettings[activeWheel], l: Number(e.target.value)}})} className="flex-1 appearance-none cursor-pointer outline-none" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className={`text-[10px] font-bold uppercase w-14 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Blend</label>
                                        <input type="range" min="0" max="100" value={gradingSettings.Blending} onChange={(e)=>setGradingSettings({...gradingSettings, Blending: Number(e.target.value)})} className="flex-1 appearance-none cursor-pointer outline-none" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className={`text-[10px] font-bold uppercase w-14 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Balance</label>
                                        <input type="range" min="-100" max="100" value={gradingSettings.Balance} onChange={(e)=>setGradingSettings({...gradingSettings, Balance: Number(e.target.value)})} className="flex-1 appearance-none cursor-pointer outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!item.slider && !item.sliders && !item.advancedUI && item.image && (
                        <div className={`mb-6 w-full overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}>
                            <img src={item.image} crossOrigin="anonymous" alt={item.tool} className="w-full h-auto object-cover max-h-[250px]" loading="lazy" />
                        </div>
                    )}
                    
                    <p className={`text-[15px] font-khmer leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{item.desc}</p>
                </div>
            )}
        </div>
    );
};

const initialQuestionBank = [
    { id: 1, question: "ឧបករណ៍មួយណាសម្រាប់កែពន្លឺរួមនៃរូបភាព?", options: ["Contrast", "Exposure", "Highlights", "Shadows"], correct: 1, level: "beginner" },
    { id: 2, question: "Contrast មានតួនាទីអ្វី?", options: ["កែពន្លឺ", "កែភាពច្បាស់", "កំណត់គម្លាតពន្លឺ/ងងឹត", "កែពណ៌"], correct: 2, level: "beginner" },
    { id: 3, question: "Highlights គ្រប់គ្រងអ្វី?", options: ["តំបន់ងងឹត", "តំបន់ភ្លឺខ្លាំង", "ពណ៌", "សីតុណ្ហភាព"], correct: 1, level: "beginner" },
    { id: 4, question: "Shadows គ្រប់គ្រងអ្វី?", options: ["តំបន់ភ្លឺ", "តំបន់ងងឹត", "ពណ៌ស", "ពណ៌ខ្មៅ"], correct: 1, level: "beginner" },
    { id: 5, question: "Temp ប្រើសម្រាប់អ្វី?", options: ["កែពណ៌បៃតង", "កែសីតុណ្ហភាព (លឿង/ខៀវ)", "កែពន្លឺ", "កែភាពច្បាស់"], correct: 1, level: "beginner" },
    { id: 6, question: "Tint ប្រើសម្រាប់អ្វី?", options: ["កែពណ៌បៃតង/ស្វាយ", "កែពន្លឺ", "កែសីតុណ្ហភាព", "កែ Contrast"], correct: 0, level: "beginner" },
    { id: 7, question: "Vibrance ខុសពី Saturation ដូចម្តេច?", options: ["ដូចគ្នា", "Vibrance ការពារពណ៌ស្បែក", "Vibrance ធ្វើឱ្យរូបខ្មៅ", "Saturation ល្អជាង"], correct: 1, level: "beginner" },
    { id: 8, question: "Dehaze ប្រើពេលណា?", options: ["ពេលរូបច្បាស់", "ពេលមានអ័ព្ទ", "ពេលរូបងងឹត", "ពេលរូបភ្លឺ"], correct: 1, level: "beginner" },
    { id: 9, question: "Vignette គឺអ្វី?", options: ["ធ្វើឱ្យរូបភ្លឺ", "ធ្វើឱ្យគែមងងឹត", "ធ្វើឱ្យរូបច្បាស់", "ប្តូរពណ៌"], correct: 1, level: "beginner" },
    { id: 10, question: "Noise Reduction ប្រើពេលណា?", options: ["ពេលរូបច្បាស់", "ពេលរូបមានគ្រាប់ Noise", "ពេលរូបងងឹត", "ពេលរូបភ្លឺ"], correct: 1, level: "beginner" },
    { id: 11, question: "Clarity ធ្វើអ្វី?", options: ["ធ្វើឱ្យរូបរលោង", "បង្កើន Contrast កណ្តាល", "ប្តូរពណ៌", "កាត់រូប"], correct: 1, level: "beginner" },
    { id: 12, question: "Texture ធ្វើអ្វី?", options: ["ធ្វើឱ្យរូបរលោង", "បង្កើនលម្អិតតូចៗ", "ប្តូរពណ៌", "កាត់រូប"], correct: 1, level: "beginner" },
    { id: 13, question: "Tone Curve គឺជាអ្វី?", options: ["កាត់រូប", "កែពន្លឺ/ពណ៌កម្រិតខ្ពស់", "ដាក់អក្សរ", "លុបមុន"], correct: 1, level: "beginner" },
    { id: 14, question: "HSL មកពីពាក្យអ្វី?", options: ["Hue Sat Light", "Hue Saturation Luminance", "High Standard Light", "Hue Shade Light"], correct: 1, level: "beginner" },
    { id: 15, question: "Split Toning ប្រើធ្វើអ្វី?", options: ["ដាក់ពណ៌ក្នុង Shadows/Highlights", "កែ Exposure", "កែ WB", "កែ Lens"], correct: 0, level: "beginner" },
    { id: 16, question: "Grain ប្រើធ្វើអ្វី?", options: ["ធ្វើឱ្យរូបច្បាស់", "បន្ថែមគ្រាប់បែប Film", "លុបអ័ព្ទ", "កែពណ៌"], correct: 1, level: "beginner" },
    { id: 17, question: "Sharpening ធ្វើអ្វី?", options: ["ធ្វើឱ្យរូបព្រិល", "ធ្វើឱ្យគែមវត្ថុច្បាស់", "ប្តូរពណ៌", "កែពន្លឺ"], correct: 1, level: "beginner" },
    { id: 18, question: "Masking ប្រើធ្វើអ្វី?", options: ["កែរូបទាំងមូល", "កែតែផ្នែកខ្លះ", "Export", "Import"], correct: 1, level: "beginner" },
    { id: 19, question: "Lens Correction ជួយអ្វី?", options: ["កែពណ៌", "កែការពត់កោងកែវថត", "កែពន្លឺ", "កែ Sharpness"], correct: 1, level: "beginner" },
    { id: 20, question: "Geometry ប្រើពេលណា?", options: ["តម្រង់អគារ", "កែពណ៌", "កែពន្លឺ", "លុបមុន"], correct: 0, level: "beginner" },
    
    { id: 21, question: "Aspect Ratio 4:5 សម្រាប់អ្វី?", options: ["Facebook", "Instagram Feed", "Youtube", "TV"], correct: 1, level: "intermediate" },
    { id: 22, question: "Aspect Ratio 16:9 សម្រាប់អ្វី?", options: ["Instagram Story", "Profile", "YouTube/TV", "Print"], correct: 2, level: "intermediate" },
    { id: 23, question: "RAW file ល្អជាង JPG ត្រង់ណា?", options: ["រូបតូច", "រក្សាទុកព័ត៌មានច្រើន", "រូបស្អាតស្រាប់", "បង្ហោះលឿន"], correct: 1, level: "intermediate" },
    { id: 24, question: "Preset គឺជាអ្វី?", options: ["ការកំណត់ដែលបានរក្សាទុក", "ការកែថ្មី", "រូបភាព", "កាមេរ៉ា"], correct: 0, level: "intermediate" },
    { id: 25, question: "Histogram បង្ហាញអ្វី?", options: ["ពន្លឺក្នុងរូប", "ពណ៌", "ទំហំ", "ទីតាំង"], correct: 0, level: "intermediate" },
    { id: 26, question: "White Balance គឺអ្វី?", options: ["កែពន្លឺ", "កែពណ៌សឱ្យត្រូវពន្លឺពិត", "កែ Contrast", "កែ Saturation"], correct: 1, level: "intermediate" },
    { id: 27, question: "Invert Mask គឺអ្វី?", options: ["លុប Mask", "ជ្រើសរើសតំបន់ផ្ទុយ", "កែពណ៌ផ្ទុយ", "បង្វិលរូប"], correct: 1, level: "intermediate" },
    { id: 28, question: "Radial Gradient ប្រើពេលណា?", options: ["កែទាំងមូល", "កែចំណុចកណ្តាល/មូល", "កែពណ៌", "កែពន្លឺ"], correct: 1, level: "intermediate" },
    { id: 29, question: "Linear Gradient ប្រើពេលណា?", options: ["កែទាំងមូល", "កែជាលក្ខណៈបន្ទាត់ (មេឃ/ដី)", "កែពណ៌", "កែពន្លឺ"], correct: 1, level: "intermediate" },
    { id: 30, question: "Color Grading គឺអ្វី?", options: ["ដាក់ពណ៌", "កែពន្លឺ", "កែ WB", "កែ Lens"], correct: 0, level: "intermediate" },
    { id: 31, question: "Calibration ប្រើធ្វើអ្វី?", options: ["កែពណ៌គោល (RGB)", "កែពន្លឺ", "កែ Contrast", "កែ Saturation"], correct: 0, level: "intermediate" },
    { id: 32, question: "Select Subject ប្រើធ្វើអ្វី?", options: ["ជ្រើសរើសមេឃ", "ជ្រើសរើសតួអង្គ", "ជ្រើសរើសកន្លែងភ្លឺ", "ជ្រើសរើសកន្លែងងងឹត"], correct: 1, level: "intermediate" },
    { id: 33, question: "Select Sky ប្រើធ្វើអ្វី?", options: ["ជ្រើសរើសដី", "ជ្រើសរើសមេឃ", "ជ្រើសរើសទឹក", "ជ្រើសរើសមនុស្ស"], correct: 1, level: "intermediate" },
    { id: 34, question: "Healing Brush ប្រើធ្វើអ្វី?", options: ["គូររូប", "លុបមុន/វត្ថុ", "កែពណ៌", "កែពន្លឺ"], correct: 1, level: "intermediate" },
    { id: 35, question: "Clone Stamp ប្រើធ្វើអ្វី?", options: ["ចម្លងរូប", "ចម្លងផ្នែកមួយទៅដាក់មួយទៀត", "កែពណ៌", "កែពន្លឺ"], correct: 1, level: "intermediate" },
    { id: 36, question: "Snapshot ក្នុង Lightroom គឺអ្វី?", options: ["រូបថត", "ការរក្សាទុកដំណាក់កាលកែ", "Preset", "Filter"], correct: 1, level: "intermediate" },
    { id: 37, question: "Versions ប្រើធ្វើអ្វី?", options: ["Export", "រក្សាទុកការកែផ្សេងគ្នា", "Share", "Delete"], correct: 1, level: "intermediate" },
    { id: 38, question: "Rating (ផ្កាយ) ប្រើធ្វើអ្វី?", options: ["ដាក់ពិន្ទុ", "លុប", "កែ", "Share"], correct: 0, level: "intermediate" },
    { id: 39, question: "Flag (ទង់) ប្រើធ្វើអ្វី?", options: ["សម្គាល់រូប (Pick/Reject)", "ដាក់ពិន្ទុ", "កែ", "Share"], correct: 0, level: "intermediate" },
    { id: 40, question: "Export Quality គួរដាក់ប៉ុន្មាន?", options: ["100%", "50%", "10%", "0%"], correct: 0, level: "intermediate" },
    
    { id: 41, question: "Resize Long Edge សម្រាប់ FB?", options: ["1080px", "2048px", "4000px", "Original"], correct: 1, level: "advanced" },
    { id: 42, question: "Sharpen for Screen ប្រើពេលណា?", options: ["ពេលផុស Facebook/IG", "ពេលព្រីនខ្នាតធំ", "ពេលរក្សាទុក", "មិនប្រើទាល់តែសោះ"], correct: 0, level: "advanced" },
    { id: 43, question: "Copy Settings ប្រើធ្វើអ្វី?", options: ["ចម្លងរូប", "ចម្លងការកែ (Settings)", "ចម្លងពណ៌", "ចម្លងពន្លឺ"], correct: 1, level: "advanced" },
    { id: 44, question: "Paste Settings ប្រើធ្វើអ្វី?", options: ["បិទភ្ជាប់រូប", "បិទភ្ជាប់ការកែ", "បិទភ្ជាប់ពណ៌", "បិទភ្ជាប់ពន្លឺ"], correct: 1, level: "advanced" },
    { id: 45, question: "Reset ប្រើធ្វើអ្វី?", options: ["លុបរូប", "ត្រឡប់ទៅដើម", "Save", "Export"], correct: 1, level: "advanced" },
    { id: 46, question: "Before/After មើលម៉េច?", options: ["ចុចពីរដង", "ចុចសង្កត់", "អូសឆ្វេង", "អូសស្តាំ"], correct: 1, level: "advanced" },
    { id: 47, question: "Chromatic Aberration គឺអ្វី?", options: ["ពណ៌ខុសតាមគែម", "ពន្លឺខុស", "Noise", "Blur"], correct: 0, level: "advanced" },
    { id: 48, question: "Profile Correction គឺអ្វី?", options: ["កែ Lens", "កែពណ៌", "កែពន្លឺ", "កែ Noise"], correct: 0, level: "advanced" },
    { id: 49, question: "Auto Settings ល្អទេ?", options: ["ល្អ", "មិនល្អ", "មធ្យម", "អាក្រក់"], correct: 0, level: "advanced" },
    { id: 50, question: "Luminance Noise Reduction គឺអ្វី?", options: ["លុបគ្រាប់ពណ៌", "លុបគ្រាប់ពន្លឺ (Grain)", "បង្កើនពណ៌", "បង្កើនពន្លឺ"], correct: 1, level: "advanced" }
];

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

const Header = ({ activeTab, setActiveTab, isDarkMode, setIsDarkMode, isSynced, setShowCloudModal }) => {
  return (
    <header className={`${(activeTab === 'lab' || activeTab === 'ai') ? 'hidden md:block' : ''} backdrop-blur-xl sticky top-0 z-50 border-b transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/80 text-[#E3E3E3] border-[#2C2C2C]' : 'bg-[#FFFFFF]/80 text-[#1A1C1E] border-[#E0E0E0]'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('learn')}>
          <div className={`w-12 h-12 relative rounded-2xl overflow-hidden shadow-lg flex-shrink-0 group-hover:shadow-[#C65102]/20 transition-all duration-500 ease-spring group-hover:scale-105 p-1 border ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className={`text-xl font-bold font-khmer tracking-tight group-hover:opacity-80 transition-opacity ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>ម៉ាយឌីហ្សាញ</h1>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setShowCloudModal(true)} className={`p-2 rounded-full transition-colors relative ${isDarkMode ? 'hover:bg-[#2C2C2C] text-[#9AA0A6]' : 'hover:bg-[#FAFAFA] text-[#5F6368]'}`} title="Cloud Sync / Sign In">
                <Cloud size={20} className={isSynced ? "text-green-500" : ""} />
                {!isSynced && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1E1E1E]"></span>}
            </button>
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
  const [expandedItem, setExpandedItem] = useState(null);
  const modalRef = useRef(null);
  const dragStartY = useRef(null);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  const handleClose = () => { setClosing(true); setTimeout(onClose, 300); };

  useEffect(() => {
      if (expandedItem !== null) {
          setTimeout(() => {
              const el = document.getElementById(`lesson-item-${expandedItem}`);
              if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
          }, 150);
      }
  }, [expandedItem]);

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
          <div ref={modalRef} className={`relative w-full max-w-3xl rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[96vh] sm:h-auto sm:max-h-[90vh] transition-transform duration-500 ease-spring ring-1 ${isDarkMode ? 'bg-[#1E1E1E] ring-[#2C2C2C]' : 'bg-[#FFFFFF] ring-[#E0E0E0]'} ${closing ? 'translate-y-full' : 'translate-y-0'}`} style={{ transform: `translateY(${closing ? '100%' : `${dragOffset}px`})`, transition: dragOffset > 0 ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
             <div className="w-full flex justify-center pt-2.5 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing sm:hidden" onClick={handleClose}>
                 <div className={`w-12 h-1.5 rounded-full opacity-50 ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`}></div>
             </div>
             <div className={`border-b px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 shrink-0 rounded-t-[32px] backdrop-blur-xl ${isDarkMode ? 'bg-[#1E1E1E]/95 border-[#2C2C2C]' : 'bg-[#FFFFFF]/95 border-[#E0E0E0]'}`}>
                <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-[#C65102]/10 rounded-xl text-[#C65102] border border-[#C65102]/20 [&>svg]:w-5 [&>svg]:h-5">{lesson.icon}</div>
                    <h2 className={`text-xl font-bold font-khmer tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{lesson.title}</h2>
                </div>
                <button onClick={handleClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#3A3A3C] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#5F6368] hover:text-[#1A1C1E]'}`}>
                    <XCircle className="w-6 h-6 opacity-80" />
                </button>
             </div>
             <div className={`scroll-content flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain ${isDarkMode ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`}>
                {lesson.content.map((item, idx) => (
                    <LessonItem 
                        key={idx} 
                        id={`lesson-item-${idx}`}
                        item={item} 
                        isExpanded={expandedItem === idx} 
                        onToggle={() => { setExpandedItem(expandedItem === idx ? null : idx); triggerHaptic(); }} 
                        isDarkMode={isDarkMode} 
                    />
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

const PhotoLab = ({ isDarkMode, user, isSynced, syncDataToCloud }) => {
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [expandedGroup, setExpandedGroup] = useState('Light'); // បន្ថែម State សម្រាប់ Accordion
  const [isFullscreen, setIsFullscreen] = useState(false); // បន្ថែម State សម្រាប់ Fullscreen
  
  // បន្ថែមមុខងារ Scroll ទៅលើពេលបើក Menu (Accordion)
  useEffect(() => {
      if (expandedGroup && mode === 'manual') {
          setTimeout(() => {
              const el = document.getElementById(`group-${expandedGroup.replace(/\s+/g, '-')}`);
              if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
          }, 150); // រង់ចាំអោយ UI បើកសិនសឹមអូស
      }
  }, [expandedGroup, mode]);

  // បន្ថែមមុខងារចុចប៊ូតុង Esc ដើម្បីបិទផ្ទាំង Fullscreen
  useEffect(() => {
      const handleEsc = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
      if (isFullscreen) window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);
  
  const initialCurve = [{x:0, y:0}, {x:100, y:100}];
  
  const defaultSettings = { 
      exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0, 
      redHue: 0, redSat: 0, redLum: 0, orangeHue: 0, orangeSat: 0, orangeLum: 0, yellowHue: 0, yellowSat: 0, yellowLum: 0, greenHue: 0, greenSat: 0, greenLum: 0, aquaHue: 0, aquaSat: 0, aquaLum: 0, blueHue: 0, blueSat: 0, blueLum: 0, purpleHue: 0, purpleSat: 0, purpleLum: 0, magentaHue: 0, magentaSat: 0, magentaLum: 0, 
      shadowHue: 0, shadowSat: 0, shadowLum: 0, midHue: 0, midSat: 0, midLum: 0, highlightHue: 0, highlightSat: 0, highlightLum: 0, globalHue: 0, globalSat: 0, globalLum: 0, gradingBlending: 50, gradingBalance: 0, 
      curveMaster: [...initialCurve], curveRed: [...initialCurve], curveGreen: [...initialCurve], curveBlue: [...initialCurve]
  };
  const [settings, setSettings] = useState(defaultSettings);
  const [activeColor, setActiveColor] = useState('Orange'); 
  const [filteredPresets, setFilteredPresets] = useState([]);
  const [suggestedMoods, setSuggestedMoods] = useState([]);
  const [userPresets, setUserPresets] = useState(() => {
      const saved = localStorage.getItem('myDesignUserPresets');
      return saved ? JSON.parse(saved) : [];
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customPresetName, setCustomPresetName] = useState("My Preset");
  
  useEffect(() => {
      if (mode !== 'preset') return;
      const query = aiPrompt.toLowerCase().trim();
      const allPresets = [...userPresets, ...Object.values(BASE_PRESETS_DATA)];
      if (!query) {
        setFilteredPresets(allPresets.filter(p => p.id.endsWith('_1') || p.id.startsWith('user_'))); 
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
  }, [aiPrompt, mode, userPresets]);

  const updateSetting = (key, value) => {
      setSettings(prev => ({...prev, [key]: value}));
      triggerHaptic();
  };
  
  const resetSettings = () => {
      setSettings(defaultSettings);
      triggerHaptic();
  };

  const handleCopySettings = () => {
      localStorage.setItem('myDesignCopiedSettings', JSON.stringify(settings));
      triggerHaptic();
  };

  const handlePasteSettings = () => {
      const copied = localStorage.getItem('myDesignCopiedSettings');
      if (copied) {
          setSettings(JSON.parse(copied));
          triggerHaptic();
      }
  };
  
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
      
      // ១. បន្ថែម Texture ទៅក្នុងការគណនា Contrast (Micro-contrast)
      const con = 100 + settings.contrast + (settings.clarity * 0.15) + (settings.texture * 0.1) + (settings.dehaze * 0.2);
      const sat = 100 + settings.saturation + (settings.vibrance * 0.4);
      
      // ២. បង្កើត Effect រលោង (Skin Smoothing) ពេលទាញ Texture ចុះក្រោម (-)
      const blurVal = settings.texture < 0 ? Math.abs(settings.texture) * 0.01 : 0;
      
      let filter = `brightness(${exp}%) contrast(${con}%) saturate(${sat}%)`;
      if (blurVal > 0) {
          filter += ` blur(${blurVal}px)`;
      }
      filter += ` url(#lr-adjustments)`;
      
      return filter;
  }, [settings.exposure, settings.dehaze, settings.contrast, settings.clarity, settings.texture, settings.saturation, settings.vibrance]); 
  // ^ កុំភ្លេចណា៎ ត្រង់នេះយើងបានបន្ថែម settings.texture ទៅក្នុង Dependency Array

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
      
      if (settings.globalSat > 0) {
          const [gr, gg, gb] = hslToRgb(settings.globalHue, 100, 50);
          r += (gr - 0.5) * (settings.globalSat / 100) * 0.5;
          g += (gg - 0.5) * (settings.globalSat / 100) * 0.5;
          b += (gb - 0.5) * (settings.globalSat / 100) * 0.5;
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
      settings.globalHue, settings.globalSat,
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
          grading: { Shadows: { h: settings.shadowHue, s: settings.shadowSat, l: settings.shadowLum }, Midtones: { h: settings.midHue, s: settings.midSat, l: settings.midLum }, Highlights: { h: settings.highlightHue, s: settings.highlightSat, l: settings.highlightLum }, Global: { h: settings.globalHue, s: settings.globalSat, l: settings.globalLum }, Blending: settings.gradingBlending, Balance: settings.gradingBalance },
          curveMaster: settings.curveMaster,
          curveRed: settings.curveRed,
          curveGreen: settings.curveGreen,
          curveBlue: settings.curveBlue
      }; 
      const presetName = aiPrompt.trim() ? aiPrompt.trim() : "Custom_Preset";
      generateXMP(recipe, `${presetName}_MD`); 
  };

  const handleSaveCustomPreset = () => {
      setCustomPresetName("My Preset");
      setShowSaveModal(true);
  };

  const confirmSavePreset = () => {
      if (!customPresetName.trim()) return;
      
      const newPreset = {
          id: `user_${Date.now()}`,
          name: customPresetName.trim(),
          category: 'My Presets',
          basic: { Exposure: settings.exposure / 10, Contrast: settings.contrast, Highlights: settings.highlights, Shadows: settings.shadows, Whites: settings.whites, Blacks: settings.blacks, Temp: settings.temp, Tint: settings.tint, Vibrance: settings.vibrance, Saturation: settings.saturation, Texture: settings.texture, Clarity: settings.clarity, Dehaze: settings.dehaze, Vignette: settings.vignette },
          grading: { Shadows: { h: settings.shadowHue, s: settings.shadowSat, l: settings.shadowLum }, Midtones: { h: settings.midHue, s: settings.midSat, l: settings.midLum }, Highlights: { h: settings.highlightHue, s: settings.highlightSat, l: settings.highlightLum }, Global: { h: settings.globalHue, s: settings.globalSat, l: settings.globalLum }, Blending: settings.gradingBlending, Balance: settings.gradingBalance },
          curveMaster: [...settings.curveMaster], curveRed: [...settings.curveRed], curveGreen: [...settings.curveGreen], curveBlue: [...settings.curveBlue]
      };

      const updatedPresets = [newPreset, ...userPresets];
      setUserPresets(updatedPresets);
      localStorage.setItem('myDesignUserPresets', JSON.stringify(updatedPresets));
      setShowSaveModal(false);
      
      if (isSynced && user) syncDataToCloud(user);
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
          if (presetData.grading.Global) { newSettings.globalHue = presetData.grading.Global.h || 0; newSettings.globalSat = presetData.grading.Global.s || 0; }
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
          const hitRadius = (i === 0 || i === points.length - 1) ? 15 : 8; 
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
          if (Math.abs(coords.y - curveY) <= 12 && coords.x > 2 && coords.x < 98) {
              
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
          if (dist < 30) { 
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

  const updateGrading = (tone, hue, sat) => { let targetHueKey = tone === 'Shadows' ? 'shadowHue' : tone === 'Midtones' ? 'midHue' : tone === 'Highlights' ? 'highlightHue' : 'globalHue'; let targetSatKey = tone === 'Shadows' ? 'shadowSat' : tone === 'Midtones' ? 'midSat' : tone === 'Highlights' ? 'highlightSat' : 'globalSat'; const newSettings = { ...settings }; newSettings[targetHueKey] = hue; newSettings[targetSatKey] = sat; if (gradingSync && (tone === 'Shadows' || tone === 'Highlights')) { const otherTone = tone === 'Shadows' ? 'Highlights' : 'Shadows'; const otherHueKey = otherTone === 'Shadows' ? 'shadowHue' : 'highlightHue'; const otherSatKey = otherTone === 'Shadows' ? 'shadowSat' : 'highlightSat'; newSettings[otherHueKey] = (hue + 180) % 360; newSettings[otherSatKey] = sat; } setSettings(newSettings); };

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
    <div className={`rounded-t-3xl rounded-b-none md:rounded-3xl border border-b-0 md:border-b flex flex-col h-full max-w-7xl mx-auto overflow-hidden shadow-2xl p-0 md:p-6 relative z-0 ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 h-full overflow-hidden relative">
            <div className={`h-[50%] lg:h-full lg:flex-1 flex flex-col gap-2 lg:gap-4 shrink-0 px-2 pb-2 pt-2 lg:p-0 ${isDarkMode ? 'bg-[#121212]/40 lg:bg-transparent' : 'bg-[#FFFFFF]/40 lg:bg-transparent'}`}>
                <div 
                    className={`flex-1 rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center relative border group cursor-pointer ${splitMode ? 'touch-pan-y' : 'touch-none'} select-none ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl' : 'bg-[#FFFFFF] border-[#E0E0E0] shadow-lg'}`}
                    onMouseDown={() => !splitMode && setShowBefore(true)}
                    onMouseUp={() => !splitMode && setShowBefore(false)}
                    onMouseLeave={() => !splitMode && setShowBefore(false)}
                    onTouchStart={() => !splitMode && setShowBefore(true)}
                    onTouchEnd={() => !splitMode && setShowBefore(false)}
                >
                    <div className="relative w-full h-full pointer-events-none">
                        <svg width="0" height="0" className="absolute pointer-events-none">
                            <filter id="lr-adjustments" colorInterpolationFilters="sRGB">
                                {/* 1. ដំបូង: អនុវត្តការកែពណ៌ពី Matrix សិន រួចរក្សាទុកលទ្ធផលចូលក្នុង in="matrixOut" */}
                                <feColorMatrix type="matrix" values={colorMatrixValue} result="matrixOut" />

                                {/* 2. បន្ទាប់មក: យកលទ្ធផលពី Matrix (in="matrixOut") មកគណនាជាមួយ Tone Curve បន្ត */}
                                <feComponentTransfer in="matrixOut">
                                    <feFuncR type="table" tableValues={tableRed} />
                                    <feFuncG type="table" tableValues={tableGreen} />
                                    <feFuncB type="table" tableValues={tableBlue} />
                                </feComponentTransfer>
                            </filter>
                        </svg>
                        <img 
                            src={image} 
                            onDoubleClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); triggerHaptic(); }}
                            className={`w-full h-full object-cover transition-transform duration-300 ease-spring ${isZoomed ? 'scale-[2.5] cursor-zoom-out' : 'scale-110 cursor-zoom-in'}`} 
                            draggable="false" 
                            style={{ filter: showBefore ? 'none' : filterString }} 
                        />
                        {splitMode && (
                            <div 
                                className="absolute inset-0 z-10 pointer-events-none border-r-2 border-white/50 shadow-[2px_0_10px_rgba(0,0,0,0.5)]"
                                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                            >
                                <img src={image} className={`w-full h-full object-cover transition-transform duration-300 ease-spring ${isZoomed ? 'scale-[2.5]' : 'scale-110'}`} style={{ filter: 'none' }} />
                            </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none" style={showBefore ? {} : vignetteStyle}></div>
                    </div>
                    {splitMode && (
                        <input 
                            type="range" min="0" max="100" value={splitPos} 
                            onChange={(e) => setSplitPos(e.target.value)}
                            onTouchMove={(e) => e.stopPropagation()}
                            className="absolute inset-0 w-full h-full opacity-[0.01] cursor-ew-resize z-20 touch-pan-y m-0" 
                            style={{ pointerEvents: 'auto', WebkitAppearance: 'none' }}
                        />
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); triggerHaptic(); }}
                        className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white z-30 transition-all active:scale-95 shadow-lg border border-white/10"
                        title="Full Screen View"
                    >
                        <Maximize size={16} />
                    </button>
                    {showBefore && !splitMode && (
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
            <div className={`flex-1 lg:w-96 xl:w-[400px] lg:flex-none flex flex-col h-full rounded-t-3xl border border-b-0 overflow-hidden relative z-10 ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] shadow-2xl' : 'bg-[#FFFFFF] border-[#E0E0E0] shadow-xl'}`}>
                 <div className={`w-full h-14 border-b flex items-center px-2 gap-2 shrink-0 z-20 ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                    <div className={`flex-1 flex p-1 rounded-xl ${isDarkMode ? 'bg-[#121212]' : 'bg-[#E0E0E0]/50'}`}>
                        <button onClick={() => setMode('manual')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-khmer uppercase tracking-wider transition-all duration-200 ${mode === 'manual' ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>កែដោយដៃ</button>
                        <button onClick={() => setMode('preset')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-khmer uppercase tracking-wider transition-all duration-200 ${mode === 'preset' ? (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>Preset</button>
                    </div>
                    {mode === 'manual' && (
                        <>
                            <button onClick={handleCopySettings} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-[#1A1C1E] hover:bg-[#E0E0E0]'}`} title="Copy Settings"><Copy size={16}/></button>
                            <button onClick={handlePasteSettings} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-[#1A1C1E] hover:bg-[#E0E0E0]'}`} title="Paste Settings"><ClipboardPaste size={16}/></button>
                            <button onClick={() => { setSplitMode(!splitMode); setSplitPos(50); triggerHaptic(); }} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${splitMode ? 'bg-[#C65102]/20 text-[#C65102]' : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-[#1A1C1E] hover:bg-[#E0E0E0]')}`} title="Split View"><SplitSquareHorizontal size={16}/></button>
                        </>
                    )}
                    <button onClick={handleSaveCustomPreset} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'text-[#9AA0A6] hover:text-green-400 hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-green-500 hover:bg-[#E0E0E0]'}`} title="Save Custom Preset"><Save size={16}/></button>
                    <button onClick={resetSettings} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'text-[#9AA0A6] hover:text-red-400 hover:bg-[#2C2C2C]' : 'text-[#5F6368] hover:text-red-500 hover:bg-[#E0E0E0]'}`} title="Reset All"><RotateCcw size={16}/></button>
                 </div>
                 <div className={`flex-1 flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-[#FFFFFF]'}`}>
                    {mode === 'manual' ? (
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3 pb-24 lg:pb-10">
                             {toolsGroups.map((group, gIdx) => (
                                <div key={gIdx} id={`group-${group.group.replace(/\s+/g, '-')}`} className={`rounded-2xl border transition-all duration-300 ease-spring overflow-hidden ${isDarkMode ? 'bg-[#121212]/50 border-[#2C2C2C]' : 'bg-[#FAFAFA]/50 border-[#E0E0E0]'}`}>
                                    <button onClick={() => { setExpandedGroup(expandedGroup === group.group ? null : group.group); triggerHaptic(); }} className="w-full flex items-center justify-between p-4 focus:outline-none">
                                        <h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-3 tracking-wider ${isDarkMode ? (expandedGroup === group.group ? 'text-[#E3E3E3]' : 'text-[#9AA0A6]') : (expandedGroup === group.group ? 'text-[#1A1C1E]' : 'text-[#5F6368]')}`}>
                                            {group.icon} {group.group}
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <span onClick={(e) => { e.stopPropagation(); if(group.group==='Light') { updateSetting('curveMaster', [...initialCurve]); updateSetting('curveRed', [...initialCurve]); updateSetting('curveGreen', [...initialCurve]); updateSetting('curveBlue', [...initialCurve]); } resetGroup(group.items); triggerHaptic(); }} className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 border rounded-lg transition-colors active:scale-95 ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FFFFFF] border-[#E0E0E0] text-[#5F6368] hover:text-[#1A1C1E]'}`}>Reset</span>
                                            <ChevronDown size={18} className={`transition-transform duration-300 ${expandedGroup === group.group ? 'rotate-180 text-[#C65102]' : (isDarkMode ? 'text-[#5F6368]' : 'text-[#9AA0A6]')}`} />
                                        </div>
                                    </button>
                                    
                                    {expandedGroup === group.group && (
                                        <div className="px-4 pb-4 pt-1 space-y-3 animate-fade-in-up border-t border-transparent">
                                            {group.items.map(t => (
                                                <div key={t.id} className="group/item">
                                                    <div className="flex justify-between mb-1.5 items-center">
                                                        <label className={`text-xs font-bold font-khmer cursor-pointer transition-colors ${isDarkMode ? 'text-[#E3E3E3] hover:text-[#C65102]/90' : 'text-[#1A1C1E] hover:text-[#C65102]'}`} onDoubleClick={() => updateSetting(t.id, 0)}>{t.label}</label>
                                                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-[#1E1E1E] text-[#FF8C33]' : 'bg-[#FFFFFF] text-[#C65102]'}`}>{settings[t.id].toFixed(t.step < 1 ? 1 : 0)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => updateSetting(t.id, settings[t.id] - (t.step || 1))} className={`p-1 rounded-full transition-colors active:scale-90 ${isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#1E1E1E]' : 'text-[#5F6368] hover:text-[#1A1C1E] hover:bg-[#FFFFFF]'}`}><Minus size={14}/></button>
                                                        <input 
                                                            type="range" min={t.min} max={t.max} step={t.step || 1} 
                                                            value={settings[t.id]} 
                                                            onChange={(e) => updateSetting(t.id, Number(e.target.value))} 
                                                            className={`flex-1 appearance-none cursor-pointer outline-none ${t.id === 'temp' ? 'grad-temp' : ''} ${t.id === 'tint' ? 'grad-tint' : ''}`} 
                                                        />
                                                        <button onClick={() => updateSetting(t.id, settings[t.id] + (t.step || 1))} className={`p-1 rounded-full transition-colors active:scale-90 ${isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#1E1E1E]' : 'text-[#5F6368] hover:text-[#1A1C1E] hover:bg-[#FFFFFF]'}`}><Plus size={14}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {group.group === 'Light' && (
                                                <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-[#C65102]/10">
                                                    <button onClick={() => setShowCurve(!showCurve)} className={`w-full py-3 border rounded-xl text-[11px] uppercase tracking-wider font-bold font-khmer transition-all active:scale-95 flex items-center justify-between px-4 shadow-sm ${showCurve ? (isDarkMode ? 'bg-[#C65102]/20 border-[#C65102]/50 text-[#C65102]' : 'bg-[#C65102]/10 border-[#C65102]/30 text-[#C65102]') : (isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C] text-[#E3E3E3] hover:bg-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0] text-[#1A1C1E] hover:bg-[#FAFAFA]')}`}>
                                                        <span className="flex items-center gap-2"><Activity size={16} className={showCurve ? "text-[#C65102]" : "text-[#C65102]"} /> ខ្សែកោង (Tone Curve)</span>
                                                        {showCurve ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                    
                                                    {showCurve && (
                                                        <div 
                                                            className={`p-4 rounded-2xl border shadow-inner animate-fade-in-up ${isDarkMode ? 'bg-[#1A1C1E] border-[#2C2C2C]' : 'bg-[#F5F5F5] border-[#E0E0E0]'}`}
                                                            onMouseMove={draggingPointIndex !== null ? handleCurvePointerMove : undefined}
                                                            onMouseUp={handleCurvePointerUp}
                                                            onMouseLeave={handleCurvePointerUp}
                                                            onTouchMove={draggingPointIndex !== null ? handleCurvePointerMove : undefined}
                                                            onTouchEnd={handleCurvePointerUp}
                                                        >
                                                            <div className="flex justify-between items-center mb-4">
                                                                <p className={`text-xs font-khmer opacity-70 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>ចុចលើខ្សែដើម្បីបន្ថែម | ២ដងដើម្បីលុប</p>
                                                                <button onClick={() => updateSetting(`curve${activeCurveChannel}`, [...initialCurve])} className={`p-2 rounded-full border shadow-sm transition-colors active:scale-90 ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FFFFFF] border-[#E0E0E0] text-[#5F6368] hover:text-[#1A1C1E]'}`} title="Reset Curve"><RotateCcw size={14}/></button>
                                                            </div>
                                                            <div className="flex gap-2 mb-5 justify-center relative z-20">
                                                                {['Master', 'Red', 'Green', 'Blue'].map(ch => (
                                                                    <button 
                                                                        key={ch} 
                                                                        onClick={() => setActiveCurveChannel(ch)}
                                                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${activeCurveChannel === ch ? 'bg-[#C65102] text-white' : (isDarkMode ? 'bg-[#2C2C2E] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FFFFFF] border border-[#E0E0E0] text-[#5F6368] hover:text-[#1A1C1E]')}`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <div className={`w-2 h-2 rounded-full shadow-inner ${ch === 'Master' ? (isDarkMode ? 'bg-white' : 'bg-black') : (ch === 'Red' ? 'bg-[#EF4444]' : ch === 'Green' ? 'bg-[#22C55E]' : 'bg-[#3B82F6]')}`}></div>
                                                                            {ch}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className={`w-[90%] sm:w-[80%] mx-auto aspect-square rounded-xl border relative overflow-visible touch-none shadow-md ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
                                                               <svg 
                                                                   ref={curveSvgRef}
                                                                   width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
                                                                   className="cursor-crosshair"
                                                                   style={{ overflow: 'visible' }}
                                                                   onPointerDown={handleCurvePointerDown}
                                                                   onDoubleClick={handleCurveDoubleClick}
                                                               >
                                                                   <rect x="-3" y="-3" width="105" height="105" fill="transparent" />
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
                                    )}
                                </div>
                            ))}
                            
                            <div id="group-Color-Mix" className={`rounded-2xl border transition-all duration-300 ease-spring overflow-hidden ${isDarkMode ? 'bg-[#121212]/50 border-[#2C2C2C]' : 'bg-[#FAFAFA]/50 border-[#E0E0E0]'}`}>
                                <button onClick={() => { setExpandedGroup(expandedGroup === 'Color Mix' ? null : 'Color Mix'); triggerHaptic(); }} className="w-full flex items-center justify-between p-4 focus:outline-none">
                                    <h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-3 tracking-wider ${isDarkMode ? (expandedGroup === 'Color Mix' ? 'text-[#E3E3E3]' : 'text-[#9AA0A6]') : (expandedGroup === 'Color Mix' ? 'text-[#1A1C1E]' : 'text-[#5F6368]')}`}>
                                        <Palette size={16}/> Color Mix
                                    </h4>
                                    <ChevronDown size={18} className={`transition-transform duration-300 ${expandedGroup === 'Color Mix' ? 'rotate-180 text-[#C65102]' : (isDarkMode ? 'text-[#5F6368]' : 'text-[#9AA0A6]')}`} />
                                </button>
                                {expandedGroup === 'Color Mix' && (
                                    <div className="px-4 pb-4 pt-1 space-y-4 animate-fade-in-up border-t border-transparent">
                                        <div className="flex justify-between gap-2 mb-4 px-1">
                                            {colors.map(c => (
                                                <button key={c.id} onClick={() => setActiveColor(c.name)} style={{ backgroundColor: c.hex }} className={`w-8 h-8 rounded-full border-2 ${activeColor === c.name ? (isDarkMode ? 'border-[#E3E3E3] scale-110 shadow-lg ring-2 ring-[#2C2C2C]' : 'border-[#1A1C1E] scale-110 shadow-lg ring-2 ring-[#E0E0E0]') : 'border-transparent opacity-80 hover:opacity-100'} transition-all duration-300 ease-spring`} />
                                            ))}
                                        </div>
                                        <div className="space-y-3 px-2">
                                            {['Hue', 'Sat', 'Lum'].map((type) => { 
                                                const key = `${activeColor.toLowerCase()}${type}`; 
                                                return (
                                                    <div key={key} className="flex items-center gap-1">
                                                        <label className={`text-[10px] font-bold font-khmer w-8 uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{type}</label>
                                                        <input type="range" min="-100" max="100" value={settings[key]} onChange={(e) => updateSetting(key, Number(e.target.value))} className={`flex-1 appearance-none cursor-pointer outline-none ${type === 'Hue' ? 'grad-hue' : type === 'Sat' ? 'grad-sat' : 'grad-lum'}`} />
                                                        <span className={`w-8 text-[11px] font-mono font-bold text-center px-1 py-0.5 rounded-md ${isDarkMode ? 'bg-[#1E1E1E] text-[#FF8C33]' : 'bg-[#FFFFFF] text-[#C65102]'}`}>{settings[key]}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div id="group-Color-Grading" className={`rounded-2xl border transition-all duration-300 ease-spring overflow-hidden ${isDarkMode ? 'bg-[#121212]/50 border-[#2C2C2C]' : 'bg-[#FAFAFA]/50 border-[#E0E0E0]'}`}>
                                <button onClick={() => { setExpandedGroup(expandedGroup === 'Color Grading' ? null : 'Color Grading'); triggerHaptic(); }} className="w-full flex items-center justify-between p-4 focus:outline-none">
                                    <h4 className={`text-xs font-bold font-khmer uppercase flex items-center gap-3 tracking-wider ${isDarkMode ? (expandedGroup === 'Color Grading' ? 'text-[#E3E3E3]' : 'text-[#9AA0A6]') : (expandedGroup === 'Color Grading' ? 'text-[#1A1C1E]' : 'text-[#5F6368]')}`}>
                                        <SplitSquareHorizontal size={16}/> Color Grading
                                    </h4>
                                    <ChevronDown size={18} className={`transition-transform duration-300 ${expandedGroup === 'Color Grading' ? 'rotate-180 text-[#C65102]' : (isDarkMode ? 'text-[#5F6368]' : 'text-[#9AA0A6]')}`} />
                                </button>
                                {expandedGroup === 'Color Grading' && (
                                    <div className="px-4 pb-4 pt-1 space-y-4 animate-fade-in-up border-t border-transparent">
                                        <div className={`flex justify-around mb-2 p-1 rounded-xl ${isDarkMode ? 'bg-[#2C2C2C]' : 'bg-[#E0E0E0]'}`}>
                                            {['Shadows', 'Midtones', 'Highlights', 'Global'].map(t => (
                                                <button key={t} onClick={() => setGradingTab(t)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${gradingTab === t ? (isDarkMode ? 'bg-[#1E1E1E] text-[#E3E3E3] shadow-sm' : 'bg-[#FFFFFF] text-[#1A1C1E] shadow-sm') : (isDarkMode ? 'text-[#9AA0A6] hover:text-[#E3E3E3]' : 'text-[#5F6368] hover:text-[#1A1C1E]')}`}>{t}</button>
                                            ))}
                                        </div>
                                        {(() => {
                                            const hKey = gradingTab === 'Shadows' ? 'shadowHue' : gradingTab === 'Midtones' ? 'midHue' : gradingTab === 'Highlights' ? 'highlightHue' : 'globalHue';
                                            const sKey = gradingTab === 'Shadows' ? 'shadowSat' : gradingTab === 'Midtones' ? 'midSat' : gradingTab === 'Highlights' ? 'highlightSat' : 'globalSat';
                                            const lKey = gradingTab === 'Shadows' ? 'shadowLum' : gradingTab === 'Midtones' ? 'midLum' : gradingTab === 'Highlights' ? 'highlightLum' : 'globalLum';
                                            return (
                                                <div className="p-1 space-y-3">
                                                    <div className="flex justify-center py-2 relative z-10">
                                                        <ColorWheel hue={settings[hKey]} sat={settings[sKey]} onChange={(h, s) => updateGrading(gradingTab, h, s)} size={180} isDarkMode={isDarkMode} />
                                                    </div>
                                                    <div className={`rounded-2xl p-4 border shadow-sm space-y-2 ${isDarkMode ? 'bg-[#1A1C1E] border-[#2C2C2C]' : 'bg-[#F5F5F5] border-[#E0E0E0]'}`}>
                                                        <div className="flex justify-between items-center px-1 mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-[#5F6368] uppercase tracking-wider font-bold mb-1">Selected</span>
                                                                <span className={`text-xs font-bold flex items-center gap-2 ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>
                                                                    <div className="w-3 h-3 rounded-full border shadow-inner" style={{backgroundColor: `hsl(${settings[hKey]}, ${settings[sKey]}%, 50%)`, borderColor: isDarkMode ? '#2C2C2C' : '#E0E0E0'}}></div>
                                                                    {getColorName(settings[hKey], settings[sKey])}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] text-[#5F6368] uppercase tracking-wider font-bold mb-1">Complementary</span>
                                                                <span className={`text-xs font-bold flex items-center gap-2 flex-row-reverse ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
                                                                    <div className="w-3 h-3 rounded-full border shadow-inner opacity-80" style={{backgroundColor: `hsl(${(settings[hKey] + 180) % 360}, 60%, 50%)`, borderColor: isDarkMode ? '#2C2C2C' : '#E0E0E0'}}></div>
                                                                    {getColorName((settings[hKey] + 180) % 360)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Hue</label>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <input type="range" min="0" max="360" value={settings[hKey]} onChange={(e) => updateGrading(gradingTab, Number(e.target.value), settings[sKey])} className="flex-1 appearance-none cursor-pointer outline-none grad-hue" />
                                                                <span className={`w-8 text-[11px] font-mono font-bold text-center px-1 py-0.5 rounded-md ${isDarkMode ? 'bg-[#1E1E1E] text-[#FF8C33]' : 'bg-[#FFFFFF] text-[#C65102]'}`}>{Math.round(settings[hKey])}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Saturation</label>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <input type="range" min="0" max="100" value={settings[sKey]} onChange={(e) => updateGrading(gradingTab, settings[hKey], Number(e.target.value))} className="flex-1 appearance-none cursor-pointer outline-none grad-sat" />
                                                                <span className={`w-8 text-[11px] font-mono font-bold text-center px-1 py-0.5 rounded-md ${isDarkMode ? 'bg-[#1E1E1E] text-[#FF8C33]' : 'bg-[#FFFFFF] text-[#C65102]'}`}>{Math.round(settings[sKey])}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Luminance</label>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <input type="range" min="-100" max="100" value={settings[lKey]} onChange={(e) => updateSetting(lKey, Number(e.target.value))} className="flex-1 appearance-none cursor-pointer outline-none grad-lum" />
                                                                <span className={`w-8 text-[11px] font-mono font-bold text-center px-1 py-0.5 rounded-md ${isDarkMode ? 'bg-[#1E1E1E] text-[#FF8C33]' : 'bg-[#FFFFFF] text-[#C65102]'}`}>{settings[lKey]}</span>
                                                            </div>
                                                        </div>
                                                        {gradingTab !== 'Global' && (
                                                        <div className={`pt-4 border-t space-y-4 px-1 mt-4 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex justify-between">
                                                                    <label className={`text-[10px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Blending</label>
                                                                    <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>{settings.gradingBlending}</span>
                                                                </div>
                                                                <input type="range" min="0" max="100" value={settings.gradingBlending} onChange={(e) => updateSetting('gradingBlending', Number(e.target.value))} className="flex-1 appearance-none cursor-pointer outline-none" />
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex justify-between">
                                                                    <label className={`text-[10px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Balance</label>
                                                                    <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-[#FF8C33]' : 'text-[#C65102]'}`}>{settings.gradingBalance}</span>
                                                                </div>
                                                                <input type="range" min="-100" max="100" value={settings.gradingBalance} onChange={(e) => updateSetting('gradingBalance', Number(e.target.value))} className="flex-1 appearance-none cursor-pointer outline-none" />
                                                            </div>
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
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
        
        {showSaveModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 transition-all">
                <div className={`w-full max-w-sm p-6 rounded-[24px] border shadow-2xl animate-fade-in-up ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
                    <h3 className={`text-xl font-bold font-khmer mb-4 tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>រក្សាទុក Preset របស់អ្នក</h3>
                    <input 
                        value={customPresetName}
                        onChange={(e) => setCustomPresetName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border mb-6 outline-none font-khmer font-bold transition-colors ${isDarkMode ? 'bg-[#121212] border-[#2C2C2C] text-[#E3E3E3] focus:border-[#C65102]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#1A1C1E] focus:border-[#C65102]'}`}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowSaveModal(false)} className={`px-5 py-2.5 rounded-xl font-khmer font-bold text-sm transition-colors ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6] hover:bg-[#3A3A3C]' : 'bg-[#E0E0E0] text-[#5F6368] hover:bg-[#D1D5DB]'}`}>បោះបង់</button>
                        <button onClick={confirmSavePreset} className="px-5 py-2.5 rounded-xl font-khmer font-bold text-sm bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF] shadow-lg shadow-[#C65102]/20 active:scale-95 transition-all">រក្សាទុក</button>
                    </div>
                </div>
            </div>
        )}

        {/* Fullscreen Image View Modal */}
        {isFullscreen && (
            <div className="fixed inset-0 z-[300] bg-[#000000] flex items-center justify-center transition-all animate-fade-in-up touch-none">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }} 
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="absolute top-6 right-6 md:top-8 md:right-8 p-3 md:p-4 rounded-full bg-black/60 hover:bg-red-600 backdrop-blur-md text-white z-[500] transition-colors active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20 group flex items-center justify-center"
                    title="បិទ (Close) - ចុច Esc"
                >
                    <X size={28} className="group-hover:scale-110 transition-transform" />
                </button>
                <div 
                    className="relative w-full h-full flex items-center justify-center p-0 md:p-12 cursor-pointer select-none"
                    onMouseDown={() => setShowBefore(true)}
                    onMouseUp={() => setShowBefore(false)}
                    onMouseLeave={() => setShowBefore(false)}
                    onTouchStart={() => setShowBefore(true)}
                    onTouchEnd={() => setShowBefore(false)}
                >
                    <img 
                        src={image} 
                        className="w-full h-full object-contain drop-shadow-2xl" 
                        style={{ filter: showBefore ? 'none' : filterString }} 
                        draggable="false"
                        alt="Full Screen Edit"
                    />
                    {showBefore ? (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/20 text-white text-sm font-bold px-6 py-2 rounded-full backdrop-blur-md pointer-events-none font-khmer shadow-2xl border border-white/30">
                            រូបភាពដើម (Before)
                        </div>
                    ) : (
                         <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/40 text-white/80 text-[11px] px-5 py-2 rounded-full backdrop-blur-md pointer-events-none font-khmer border border-white/10 animate-pulse">
                            ចុចសង្កត់ដើម្បីមើលរូបដើម
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

const Quiz = ({ isDarkMode, user, isSynced, syncDataToCloud }) => {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState(initialQuestionBank);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizConfig, setQuizConfig] = useState({ level: 'beginner', amount: 10 });
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('myDesignHighScore')) || 0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]); // <-- បន្ថែម State ថ្មីសម្រាប់ផ្ទុកចម្លើយ

  const startQuiz = () => { let filtered = initialQuestionBank.filter(q => quizConfig.level === 'all' || q.level === quizConfig.level); if (filtered.length < quizConfig.amount) filtered = initialQuestionBank; const shuffled = [...filtered].sort(() => 0.5 - Math.random()); setQuestions(shuffled.slice(0, quizConfig.amount)); setCurrentQuestion(0); setScore(0); setIsAnswered(false); setSelectedOption(null); setIsNewRecord(false); setUserAnswers([]); setGameState('playing'); };

  if (gameState === 'menu') return (
    <div className="flex h-full items-center justify-center p-4">
      <div className={`p-8 text-center rounded-[32px] border shadow-2xl max-w-lg w-full animate-fade-in-up ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
          <div className="w-20 h-20 bg-[#C65102]/10 rounded-full flex items-center justify-center mx-auto mb-6"><Award className="text-[#C65102]" size={40} /></div>
          <h2 className="text-2xl font-bold font-khmer mb-2">ការធ្វើតេស្ត</h2>
          <p className="font-khmer text-sm mb-6 opacity-60">ពិន្ទុខ្ពស់បំផុត៖ {highScore}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="text-left">
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block pl-1 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>កម្រិតសំណួរ</label>
                  <select 
                      value={quizConfig.level} 
                      onChange={e => setQuizConfig({...quizConfig, level: e.target.value})} 
                      className={`w-full p-3 rounded-xl border outline-none font-khmer text-sm cursor-pointer ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C] text-[#E3E3E3]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#1A1C1E]'}`}
                  >
                      <option value="beginner">ងាយស្រួល</option>
                      <option value="intermediate">មធ្យម</option>
                      <option value="advanced">កម្រិតខ្ពស់</option>
                      <option value="all">លាយគ្នាទាំងអស់</option>
                  </select>
              </div>
              <div className="text-left">
                  <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block pl-1 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>ចំនួនសំណួរ</label>
                  <select 
                      value={quizConfig.amount} 
                      onChange={e => setQuizConfig({...quizConfig, amount: Number(e.target.value)})} 
                      className={`w-full p-3 rounded-xl border outline-none font-khmer text-sm cursor-pointer ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C] text-[#E3E3E3]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#1A1C1E]'}`}
                  >
                      <option value={10}>10 សំណួរ</option>
                      <option value={20}>20 សំណួរ</option>
                      <option value={50}>50 សំណួរ</option>
                  </select>
              </div>
          </div>

          <div className="space-y-4">
              <button onClick={startQuiz} className="w-full py-4 rounded-2xl bg-[#C65102] text-white font-bold font-khmer shadow-lg active:scale-95 transition-transform">ចាប់ផ្ដើម</button>
          </div>
      </div>
    </div>
  );

  if (gameState === 'review') {
      return (
          <div className="flex h-full flex-col p-4 max-w-3xl mx-auto w-full animate-fade-in-up">
              <div className={`p-5 rounded-[24px] border shadow-xl mb-4 shrink-0 flex justify-between items-center ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
                  <h2 className={`text-lg font-bold font-khmer ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>ការត្រួតពិនិត្យ & ការណែនាំ</h2>
                  <button onClick={() => setGameState('result')} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6] hover:text-[#E3E3E3]' : 'bg-[#FAFAFA] text-[#5F6368] hover:text-[#1A1C1E]'}`}><XCircle size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-20 px-1">
                  <div className={`p-5 rounded-2xl border ${score/questions.length >= 0.8 ? (isDarkMode ? 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]' : 'bg-[#34C759]/10 border-[#34C759]/30 text-green-700') : (isDarkMode ? 'bg-[#FFD60A]/10 border-[#FFD60A]/20 text-[#FFD60A]' : 'bg-[#FFD60A]/10 border-[#FFD60A]/30 text-yellow-700')}`}>
                      <h3 className="font-bold mb-2 flex items-center gap-2"><Lightbulb size={18}/> ការណែនាំសម្រាប់អ្នក៖</h3>
                      <p className="text-sm font-khmer leading-relaxed">
                          {score/questions.length >= 0.8 
                              ? "អ្នកយល់ដឹងពី Lightroom បានល្អខ្លាំងណាស់! 🎉 សូមសាកល្បងបង្កើត Preset ផ្ទាល់ខ្លួន ឬកែរូបភាពកម្រិតខ្ពស់នៅក្នុងផ្ទាំង Lab ។" 
                              : "អ្នកគួរតែចំណាយពេលអាន 'មេរៀន' បន្ថែមបន្តិចទៀត ជាពិសេសទាក់ទងនឹងការគ្រប់គ្រងពន្លឺ និងពណ៌។ កុំបារម្ភ ការហាត់អនុវត្តញឹកញាប់នឹងធ្វើឱ្យអ្នកពូកែ! 💪"}
                      </p>
                  </div>
                  {userAnswers.map((ans, idx) => {
                      const qInfo = questions[ans.qId];
                      return (
                          <div key={idx} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
                              <p className={`font-bold text-[15px] mb-4 font-khmer leading-relaxed ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>{idx + 1}. {qInfo.question}</p>
                              <div className="space-y-2.5">
                                  {qInfo.options.map((opt, i) => {
                                      let isUserChoice = ans.selected === i;
                                      let isCorrectChoice = qInfo.correct === i;
                                      let btnClass = isDarkMode ? 'bg-[#2C2C2C]/30 border-transparent text-[#9AA0A6]' : 'bg-[#FAFAFA]/50 border-transparent text-[#5F6368]';
                                      if (isCorrectChoice) btnClass = 'bg-[#34C759]/10 border-[#34C759] text-[#34C759] font-bold';
                                      else if (isUserChoice && !isCorrectChoice) btnClass = 'bg-[#FF453A]/10 border-[#FF453A] text-[#FF453A] line-through opacity-80';
                                      return (
                                          <div key={i} className={`p-3.5 text-sm rounded-xl border flex items-center gap-3 font-khmer ${btnClass}`}>
                                              {(isCorrectChoice) ? <CheckCircle size={16}/> : (isUserChoice && !isCorrectChoice) ? <XCircle size={16}/> : <div className="w-4 h-4 rounded-full border border-current opacity-30"/>}
                                              {opt}
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )
  }

  if (gameState === 'result') {
      const percentage = Math.round((score / questions.length) * 100);
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className={`p-10 text-center rounded-[32px] border shadow-2xl max-w-md w-full ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
              <div className="text-5xl font-black mb-4 tracking-tighter">{percentage}%</div>
              <h2 className="text-xl font-bold font-khmer mb-2">{percentage > 80 ? "អស្ចារ្យណាស់!" : "ព្យាយាមទៀត!"}</h2>
              {isNewRecord && <div className="text-[#C65102] text-xs font-bold mb-4 animate-bounce">🎉 កំណត់ត្រាថ្មី!</div>}
              <p className="font-khmer mb-8 opacity-70">អ្នកឆ្លើយត្រូវ {score} / {questions.length}</p>
              
              <div className="space-y-3">
                  <button onClick={() => setGameState('review')} className={`w-full py-3 rounded-2xl font-bold font-khmer transition-all shadow-sm text-sm border flex items-center justify-center gap-2 ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#3A3A3C] border-[#2C2C2C] text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] border-[#E0E0E0] text-[#1A1C1E]'}`}><ListIcon size={16}/> មើលចម្លើយ និង ការណែនាំ</button>
                  <button onClick={() => setGameState('menu')} className="w-full py-3 rounded-2xl bg-[#C65102] text-white font-bold font-khmer flex items-center justify-center gap-2"><RotateCcw size={16}/> សាកល្បងម្តងទៀត</button>
              </div>
          </div>
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
            <button key={`${currentQuestion}-${i}`} onClick={() => { 
                if (!isAnswered) { 
                    setSelectedOption(i); 
                    setIsAnswered(true); 
                    const isCorrect = i === q.correct;
                    if (isCorrect) setScore(score + 1); 
                    
                    setUserAnswers(prev => [...prev, { qId: currentQuestion, selected: i, isCorrect }]);
                    
                    // Auto-Next ដំណើរការដោយស្វ័យប្រវត្តិនៅទីនេះ
                    setTimeout(() => {
                        const next = currentQuestion + 1; 
                        if (next < questions.length) { 
                            setCurrentQuestion(next); 
                            setIsAnswered(false); 
                            setSelectedOption(null); 
                        } else { 
                            setGameState('result'); 
                            const finalScore = score + (isCorrect ? 1 : 0);
                            if (finalScore > highScore) { 
                                setHighScore(finalScore); 
                                localStorage.setItem('myDesignHighScore', finalScore); 
                                setIsNewRecord(true); 
                                if (isSynced && user) syncDataToCloud(user);
                            } 
                        }
                    }, 1200); // រង់ចាំ 1.2 វិនាទី
                } 
            }} className={`p-4 text-left rounded-2xl border transition-all duration-300 ease-spring font-khmer text-sm relative overflow-hidden group ${isAnswered ? (i === q.correct ? 'bg-[#34C759]/10 border-[#34C759] text-[#34C759]' : (i === selectedOption ? 'bg-[#FF453A]/10 border-[#FF453A] text-[#FF453A]' : (isDarkMode ? 'bg-[#2C2C2C]/30 border-transparent text-[#9AA0A6] opacity-50' : 'bg-[#FAFAFA]/50 border-transparent text-[#5F6368] opacity-50'))) : (isDarkMode ? 'bg-[#2C2C2C]/50 border-transparent text-[#E3E3E3] hover:bg-[#3A3A3C]' : 'bg-[#FAFAFA] border-transparent text-[#1A1C1E] hover:bg-[#E0E0E0]/50')}`}><span className={`inline-flex w-6 h-6 items-center justify-center rounded-full mr-3 text-[10px] font-bold ${isAnswered && i === q.correct ? 'bg-[#34C759] text-[#FFFFFF]' : (isDarkMode ? 'bg-[#3A3A3C] text-[#9AA0A6] group-hover:bg-[#E3E3E3] group-hover:text-[#121212]' : 'bg-[#E0E0E0] text-[#5F6368] group-hover:bg-[#1A1C1E] group-hover:text-[#FFFFFF]')}`}>{String.fromCharCode(65 + i)}</span>{opt}</button>
          ))}
        </div>
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
      const msg = typeof text === 'string' ? text : input; // Ensure text is a string
      if (!msg.trim()) return; 
      
      const currentInput = msg;

      setInput(''); 

      setMessages(prev => [...prev, { role: 'user', text: currentInput }]); 
      setLoading(true);
      
      try {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
          
          let response = "";

          response = findAIResponse(msg);
          const isFallback = SHORT_FALLBACK_RESPONSES.includes(response) || LONG_FALLBACK_RESPONSES.includes(response);
          
          if (isFallback && apiKey) {
              try {
                  const apiResponse = await callGemini(msg, "អ្នកគឺជាជំនួយការ AI ជាមនុស្សប្រុសរបស់ My Design ជំនាញខាងកែរូបភាព។ ឆ្លើយតបជាភាសាខ្មែរយ៉ាងរួសរាយរាក់ទាក់ កម្រិតអាជីព និងប្រើពាក្យ 'បាទ'។ សំខាន់៖ សូមកុំប្រើពាក្យស្វាគមន៍ (ដូចជា សួស្ដីបង, ជម្រាបសួរ) នៅដើមប្រយោគឱ្យសោះ ព្រោះនេះជាការសន្ទនាបន្ត។");
                  if (apiResponse) response = apiResponse;
              } catch (apiErr) {
                  console.warn("API Error:", apiErr);
                  response = "សុំទោសបងបាទ! ពេលនេះមុខងារ AI ឆ្លាតវៃកំពុងផ្អាកដំណើរការ (Offline)។ ប៉ុន្តែបងអាចសួរខ្ញុំពីគន្លឹះសំខាន់ៗដែលមានស្រាប់ដូចជា៖ 'Tone Curve', 'Exposure', 'Teal & Orange', ឬ 'Dark & Moody' បានណា៎! 🧠💡";
              }
          } else if (isFallback && !apiKey) {
              response = "សុំទោសបងបាទ! ពេលនេះមុខងារ AI ឆ្លាតវៃកំពុងផ្អាកដំណើរការ (Offline)។ ប៉ុន្តែបងអាចសួរខ្ញុំពីគន្លឹះសំខាន់ៗដែលមានស្រាប់ដូចជា៖ 'Tone Curve', 'Exposure', 'Teal & Orange', ឬ 'Dark & Moody' បានណា៎! 🧠💡";
          }
          
          setMessages(prev => [...prev, { role: 'model', text: response }]);
      } catch (error) {
          setMessages(prev => [...prev, { role: 'model', text: "សុំទោសបងបាទ! មានបញ្ហាបច្ចេកទេសបន្តិចបន្តួច។ សូមសាកល្បងម្ដងទៀត! 🛠️" }]);
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
        {messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                {m.role === 'model' && (<div className={`w-6 h-6 rounded-full bg-gradient-to-tr flex items-center justify-center mr-2 shrink-0 mt-auto ${isDarkMode ? 'from-[#C65102]/90 to-[#E86A10]/90' : 'from-[#C65102] to-[#E86A10]'}`}><Bot size={12} className="text-[#FFFFFF]" /></div>)}
                <div className={`max-w-[80%] flex flex-col gap-2`}>
                    {m.text && (
                        <div className={`px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm border ${m.role === 'user' ? (isDarkMode ? 'bg-gradient-to-r from-[#C65102]/90 to-[#E86A10]/90 text-[#FFFFFF] rounded-[18px] rounded-br-none border-transparent' : 'bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF] rounded-[18px] rounded-br-none border-transparent') : (isDarkMode ? 'bg-[#2C2C2C] text-[#E3E3E3] rounded-[18px] rounded-bl-none border-[#2C2C2C]' : 'bg-[#FFFFFF] text-[#1A1C1E] rounded-[18px] rounded-bl-none border-[#E0E0E0]')}`}>
                            {m.text}
                        </div>
                    )}
                </div>
            </div>
        ))}
        {loading && (<div className="flex justify-start items-end"><div className={`w-6 h-6 rounded-full bg-gradient-to-tr flex items-center justify-center mr-2 ${isDarkMode ? 'from-[#C65102]/90 to-[#E86A10]/90' : 'from-[#C65102] to-[#E86A10]'}`}><Bot size={12} className="text-[#FFFFFF]" /></div><div className={`px-4 py-3 rounded-[18px] rounded-bl-none border flex gap-1 ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}><div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`} style={{animationDelay: '0ms'}}></div><div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`} style={{animationDelay: '150ms'}}></div><div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#9AA0A6]' : 'bg-[#5F6368]'}`} style={{animationDelay: '300ms'}}></div></div></div>)}
        <div ref={messagesEndRef} className="h-2" />
      </div>
      <div className={`backdrop-blur-xl border-t pb-safe transition-colors flex flex-col ${isDarkMode ? 'bg-[#1E1E1E]/90 border-[#2C2C2C]' : 'bg-[#FFFFFF]/90 border-[#E0E0E0]'}`}>
         <div className={`flex items-center border-b pl-2 ${isDarkMode ? 'border-[#2C2C2C]' : 'border-[#E0E0E0]'}`}><button onClick={() => { const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random()); setCurrentSuggestions(shuffled.slice(0, 3)); }} className={`p-2 transition-colors active:scale-90 ${isDarkMode ? 'text-[#FF8C33] hover:text-[#E3E3E3]' : 'text-[#C65102] hover:text-[#E86A10]'}`}><RefreshCw size={14} /></button><div className="flex gap-2 overflow-x-auto pb-3 pt-3 px-2 no-scrollbar">{currentSuggestions.map((q, i) => (<button key={i} onClick={() => handleSend(q)} className={`shrink-0 px-3 py-1.5 text-[11px] rounded-full border active:scale-95 transition-all whitespace-nowrap ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#3A3A3C] text-[#FF8C33] border-[#C65102]/20' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#C65102] border-[#C65102]/20'}`}>{q}</button>))}</div></div>
         <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-3 flex gap-2 items-center" autoComplete="off">
            <div className={`flex-1 rounded-[24px] border flex items-center px-1 focus-within:border-[#C65102]/50 transition-colors ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'bg-[#FAFAFA] border-[#E0E0E0]'}`}>
                <input type="search" value={input} onChange={e => setInput(e.target.value)} placeholder="សួរសំណួរ..." className={`flex-1 bg-transparent px-4 py-3 text-base outline-none h-full [&::-webkit-search-cancel-button]:hidden ${isDarkMode ? 'text-[#E3E3E3] placeholder:text-[#9AA0A6]' : 'text-[#1A1C1E] placeholder:text-[#5F6368]'}`} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" name="chat_input_unique_field_safe_v2" id="chat_input_unique_field_safe_v2" />
            </div>
            <button type="submit" disabled={!input.trim()} className={`p-3 rounded-full transition-all active:scale-90 shadow-lg ${input.trim() ? (isDarkMode ? 'bg-gradient-to-r from-[#C65102]/90 to-[#E86A10]/90 text-[#FFFFFF]' : 'bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF]') : (isDarkMode ? 'bg-[#2C2C2C] text-[#9AA0A6]' : 'bg-[#E0E0E0] text-[#5F6368]')}`}><Send size={18} /></button>
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
  
  // Cloud Sync States
  const [user, setUser] = useState(null);
  const [isSynced, setIsSynced] = useState(() => localStorage.getItem('myDesignCloudSync') === 'true');
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // ១. រៀបចំ Authentication អោយរត់តែម្តងគត់ពេលបើក App
  useEffect(() => {
      if (!auth) return;
      const initAuth = async () => {
          try {
              if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                  await signInWithCustomToken(auth, __initial_auth_token);
              } else {
                  await signInAnonymously(auth);
              }
          } catch (err) {
              console.warn("Auth initialization failed", err);
          }
      };
      initAuth();
      
      const unsubscribe = onAuthStateChanged(auth, (u) => {
          setUser(u);
      });
      return () => unsubscribe();
  }, []); // <--- អារ៉េទទេ (Empty Array) ការពារការហៅ Auth ច្រើនដង

  // ២. ទាញយកទិន្នន័យពី Cloud ពេល User លោតចូល ឬបើក Sync
  useEffect(() => {
      if (user && isSynced && db) {
          const fetchCloudData = async () => {
              try {
                  const snap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'));
                  if (snap.exists()) {
                      const data = snap.data();
                      if (data.highScore !== undefined) localStorage.setItem('myDesignHighScore', data.highScore);
                      if (data.presets) localStorage.setItem('myDesignUserPresets', JSON.stringify(data.presets));
                  }
              } catch (err) { console.warn("Failed to load cloud data", err); }
          };
          fetchCloudData();
      }
  }, [user, isSynced]); // <--- ស្តាប់ការប្រែប្រួលរបស់ User និង Sync នៅទីនេះ

  const syncDataToCloud = async (currentUser) => {
      if (!db || !currentUser) return;
      const hScore = parseInt(localStorage.getItem('myDesignHighScore')) || 0;
      const presets = JSON.parse(localStorage.getItem('myDesignUserPresets') || '[]');
      try {
          await setDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'data'), {
              highScore: hScore,
              presets: presets,
              lastSync: Date.now()
          }, { merge: true });
      } catch (error) {
          console.error("Cloud Sync failed", error);
      }
  };

  const handleEnableCloudSync = async () => {
      setSyncLoading(true);
      try {
          let currentUser = user;
          // បើសិនជាកម្មវិធីបាត់បង់ User, ព្យាយាម Sign In ជាថ្មីដោយស្វ័យប្រវត្តិ
          if (!currentUser && auth) {
              const cred = await signInAnonymously(auth);
              currentUser = cred.user;
              setUser(currentUser);
          }
          if (currentUser) {
              await syncDataToCloud(currentUser);
              setIsSynced(true);
              localStorage.setItem('myDesignCloudSync', 'true');
          }
      } catch (error) {
          console.error("Failed to enable sync", error);
      }
      setSyncLoading(false);
      setShowCloudModal(false);
  };

  // ១. ទាញយកប្រវត្តិឆាតពី LocalStorage មកបង្ហាញ ឬ លោតសារស្វាគមន៍បើជាការចូលប្រើលើកដំបូងបំផុត
  const [chatMessages, setChatMessages] = useState(() => {
      const savedChat = localStorage.getItem('myDesignChatHistory');
      if (savedChat) {
          const parsed = JSON.parse(savedChat);
          // ការពារករណី Chat ទទេស្អាត (Empty Array)
          if (parsed && parsed.length > 0) return parsed;
      }
      return [{ role: 'model', text: 'សួស្ដីបងបាទ! 👋 ខ្ញុំជាគ្រូជំនួយ AI ផ្ទាល់ខ្លួនរបស់បង。\n\nតើបងចង់ដឹងពីក្បួនកែរូបអ្វីខ្លះនៅថ្ងៃនេះ? បងអាចសួរខ្ញុំបានពីអត្ថន័យនៃពណ៌ របៀបប្រើប្រាស់មុខងារផ្សេងៗ ឬ ស្វែងរក Preset ស្អាតៗក៏បានដែរណា៎! ធានាថារៀនជាមួយខ្ញុំមិនធុញទេបាទ! 😊✨' }];
  });

  const [sessionAiGreeted, setSessionAiGreeted] = useState(false);

  // Auto Greeting: ផ្ញើសារស្វាគមន៍រាល់ពេលចុចចូល AI លើកដំបូងក្នុង Session នីមួយៗ
  useEffect(() => {
      if (activeTab === 'ai' && !sessionAiGreeted) {
          setSessionAiGreeted(true);
          setChatMessages(prev => {
              // បើមានតែសារស្វាគមន៍ដើម (Default) មិនបាច់ថែមសារថ្មីទេ
              if (prev.length <= 1 && prev[0]?.text.includes("ខ្ញុំជាគ្រូជំនួយ")) {
                  return prev; 
              }
              
              const greetings = [
                  "សួស្ដីបងម្ដងទៀតបាទ! 👋 ថ្ងៃនេះមានរូបចង់កែពណ៌ទេបាទ? 😊",
                  "ស្វាគមន៍ត្រលប់មកវិញបង! 🚀 តើមានចម្ងល់អ្វីទាក់ទងនឹងការកែរូបអាចសួរខ្ញុំបានណា៎!",
                  "សួស្ដីបាទ! 🎨 ខ្ញុំត្រៀមខ្លួនរួចរាល់ហើយ តើបងចង់រៀនពីមុខងារអ្វីដែរថ្ងៃនេះ?"
              ];
              const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
              
              // បើសារចុងក្រោយបំផុតមិនមែនជាការស្វាគមន៍ស្រាប់ ទើបបញ្ចូលសារថ្មីនេះ
              if (prev[prev.length - 1]?.text !== randomGreet && !greetings.includes(prev[prev.length - 1]?.text)) {
                  return [...prev, { role: 'model', text: randomGreet }];
              }
              return prev;
          });
      }
  }, [activeTab, sessionAiGreeted]);

  // ២. រក្សាទុកប្រវត្តិឆាតទៅក្នុង LocalStorage ដោយស្វ័យប្រវត្តិ រាល់ពេលមានការសួរឆ្លើយថ្មីៗ
  useEffect(() => {
      localStorage.setItem('myDesignChatHistory', JSON.stringify(chatMessages));
  }, [chatMessages]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) document.head.removeChild(existingMeta);
    document.head.appendChild(meta);

    // --- ៤. កូដប្រែក្លាយជា PWA (Progressive Web App) ដោយស្វ័យប្រវត្តិ ---
    // បង្កើត Manifest ភ្លាមៗ (Dynamic Manifest)
    const manifest = {
      "short_name": "ម៉ាយឌីហ្សាញ",
      "name": "My Design Lightroom Master",
      "icons": [
        { "src": "/logo.svg", "type": "image/svg+xml", "sizes": "192x192" },
        { "src": "/logo.svg", "type": "image/svg+xml", "sizes": "512x512" }
      ],
      "start_url": ".",
      "display": "standalone",
      "theme_color": isDarkMode ? "#121212" : "#FAFAFA",
      "background_color": isDarkMode ? "#121212" : "#FAFAFA"
    };
    
    // បំប្លែង Object ទៅជា Data URL ជំនួសឱ្យការប្រើ File ខាងក្រៅ
    const manifestString = JSON.stringify(manifest);
    const manifestUrl = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(manifestString);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;

    // បន្ថែម Support សម្រាប់ iOS (Apple Touch Icon និង Status Bar)
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = '/logo.svg'; // ទាញយក Logo ដែលមានស្រាប់
      document.head.appendChild(appleIcon);
    }
    
    let appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusMeta) {
      appleStatusMeta = document.createElement('meta');
      appleStatusMeta.name = 'apple-mobile-web-app-status-bar-style';
      appleStatusMeta.content = 'black-translucent';
      document.head.appendChild(appleStatusMeta);
    }
  }, [isDarkMode]);

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col font-khmer overflow-hidden touch-pan-x touch-pan-y transition-colors duration-300 ${isDarkMode ? 'bg-[#121212] text-[#E3E3E3]' : 'bg-[#FAFAFA] text-[#1A1C1E]'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@100..700&display=swap'); 
        body, html { overscroll-behavior: none; } 
        .font-khmer { font-family: 'Kantumruy Pro', sans-serif; } 
        .no-scrollbar::-webkit-scrollbar { display: none; } 
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } 
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        
        /* Premium Lightroom Sliders */
        :root {
            --track-bg: ${isDarkMode ? '#3A3A3C' : '#E0E0E0'};
            --thumb-bg: ${isDarkMode ? '#E3E3E3' : '#FFFFFF'};
            --thumb-border: ${isDarkMode ? '#1E1E1E' : '#D1D5DB'};
        }
        input[type=range] { -webkit-appearance: none; background: transparent; pointer-events: none; width: 100%; margin: 8px 0; } 
        input[type=range]:focus { outline: none; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; cursor: pointer; background: var(--track-bg); border-radius: 2px; } 
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: var(--thumb-bg); border: 1px solid var(--thumb-border); box-shadow: 0 2px 6px rgba(0,0,0,0.3); margin-top: -7px; cursor: grab; pointer-events: auto; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); } 
        input[type=range]::-webkit-slider-thumb:active { transform: scale(1.3); cursor: grabbing; background: #C65102; border-color: #C65102; box-shadow: 0 4px 12px rgba(198,81,2,0.4); }
        .grad-hue::-webkit-slider-runnable-track { background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red) !important; } 
        .grad-sat::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--track-bg), var(--thumb-bg)) !important; } 
        .grad-lum::-webkit-slider-runnable-track { background: linear-gradient(to right, #000000, var(--track-bg), #FFFFFF) !important; } 
        .grad-temp::-webkit-slider-runnable-track { background: linear-gradient(to right, #3B82F6, var(--track-bg), #F59E0B) !important; }
        .grad-tint::-webkit-slider-runnable-track { background: linear-gradient(to right, #10B981, var(--track-bg), #EC4899) !important; }
      `}</style>
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} isSynced={isSynced} setShowCloudModal={setShowCloudModal} />
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
        {activeTab === 'lab' && <PhotoLab isDarkMode={isDarkMode} user={user} isSynced={isSynced} syncDataToCloud={syncDataToCloud} />}
        {activeTab === 'quiz' && <Quiz isDarkMode={isDarkMode} user={user} isSynced={isSynced} syncDataToCloud={syncDataToCloud} />}
        {activeTab === 'ai' && <div className="h-full md:h-[650px] max-w-2xl mx-auto w-full relative"><ChatBot messages={chatMessages} setMessages={setChatMessages} isDarkMode={isDarkMode} /></div>}
      </main>

      <nav className={`md:hidden backdrop-blur-xl border-t flex justify-around p-3 pb-safe z-50 transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/90 border-[#2C2C2C]' : 'bg-[#FFFFFF]/90 border-[#E0E0E0]'}`}>
        {['learn', 'quiz', 'lab', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === t ? 'text-[#C65102] scale-110' : (isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]')}`}>{t === 'learn' && <BookOpen size={22}/>}{t === 'quiz' && <Award size={22}/>}{t === 'lab' && <Sliders size={22}/>}{t === 'ai' && <Bot size={22}/>}<span className="text-[10px] font-bold uppercase">{t === 'learn' ? 'មេរៀន' : t === 'quiz' ? 'តេស្ត' : t === 'lab' ? 'Lab' : 'AI'}</span></button>
        ))}
      </nav>

      {/* Cloud Sync Modal */}
      {showCloudModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 transition-all">
              <div className={`w-full max-w-sm p-8 rounded-[32px] border shadow-2xl animate-fade-in-up text-center ${isDarkMode ? 'bg-[#1E1E1E] border-[#2C2C2C]' : 'bg-[#FFFFFF] border-[#E0E0E0]'}`}>
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner border ${isSynced ? 'bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759]' : (isDarkMode ? 'bg-[#C65102]/10 border-[#C65102]/20 text-[#C65102]' : 'bg-[#C65102]/5 border-[#C65102]/20 text-[#C65102]')}`}>
                      <Cloud size={40} />
                  </div>
                  <h3 className={`text-2xl font-bold font-khmer mb-3 tracking-tight ${isDarkMode ? 'text-[#E3E3E3]' : 'text-[#1A1C1E]'}`}>
                      {isSynced ? 'Cloud Synced' : 'គណនី Cloud Sync'}
                  </h3>
                  <p className={`text-sm font-khmer leading-relaxed mb-8 ${isDarkMode ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
                      {isSynced 
                          ? "ទិន្នន័យ (Preset និងពិន្ទុ) របស់អ្នកត្រូវបានរក្សាទុកដោយសុវត្ថិភាពនៅលើ Cloud រួចរាល់ហើយបាទ! ☁️✨" 
                          : "កម្មវិធីនេះអាចប្រើប្រាស់ដោយសេរី (អត់ចាំបាច់មានគណនី)។ ប៉ុន្តែអ្នកអាចបើក Cloud Sync ដើម្បីរក្សាទុក Preset និងពិន្ទុរបស់អ្នកកុំឱ្យបាត់បង់ពេលក្រោយ!"}
                  </p>
                  
                  {isSynced ? (
                      <button onClick={() => setShowCloudModal(false)} className={`w-full py-3.5 rounded-2xl font-bold font-khmer transition-all shadow-md text-sm ${isDarkMode ? 'bg-[#2C2C2C] hover:bg-[#3A3A3C] text-[#E3E3E3]' : 'bg-[#FAFAFA] hover:bg-[#E0E0E0] text-[#1A1C1E]'}`}>បិទផ្ទាំង</button>
                  ) : (
                      <div className="flex gap-3">
                          <button onClick={() => setShowCloudModal(false)} className={`flex-1 py-3.5 rounded-2xl font-bold font-khmer transition-all text-sm border ${isDarkMode ? 'bg-[#2C2C2C] border-[#2C2C2C] text-[#9AA0A6] hover:bg-[#3A3A3C]' : 'bg-[#FAFAFA] border-[#E0E0E0] text-[#5F6368] hover:bg-[#E0E0E0]'}`}>មិនអីទេ</button>
                          <button onClick={handleEnableCloudSync} disabled={syncLoading} className="flex-1 py-3.5 rounded-2xl font-bold font-khmer bg-gradient-to-r from-[#C65102] to-[#E86A10] text-[#FFFFFF] shadow-lg shadow-[#C65102]/30 active:scale-95 transition-all text-sm flex justify-center items-center gap-2">
                              {syncLoading ? <Loader2 size={18} className="animate-spin" /> : "បើក Sync"}
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}