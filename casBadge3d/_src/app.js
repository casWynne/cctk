/* =====================================================================
   Badge Maker 2.0 — app.js
   Vanilla JS, no storage, no network calls. Safe for GitHub Pages.

   ── HOW TO EXTEND ────────────────────────────────────────────────────
   • Icons:        add entries to ICON_LIBRARY below (any category).
   • Decorations:  add entries to DECORATIONS, then give each shape a
                   default position in DECOR_DEFAULTS.
   • Colours:      add entries to COLOR_PRESETS.
   • Layout:       per-shape text positions / icon slots live in SHAPES.
   All positions use centre-origin coordinates: x → right, y → up.
   The badge canvas is 512 × 512 (centre = 0,0; edge ≈ ±256).
   ===================================================================== */

"use strict";

/* =====================================================================
   1. CONFIG — edit freely
   ===================================================================== */

const COLOR_PRESETS = {
  rainbow:{ label:"Rainbow", stops:[
    {color:"#ff5f6d",at:0},{color:"#ffa42b",at:18},{color:"#ffd23f",at:36},
    {color:"#3ddc84",at:55},{color:"#2f8df5",at:76},{color:"#8b5cf6",at:100}]},
  bronze:{ label:"Bronze", stops:[
    {color:"#5e3a1e",at:0},{color:"#cd7f32",at:35},{color:"#f1c189",at:60},{color:"#8c5a2b",at:100}]},
  silver:{ label:"Silver", stops:[
    {color:"#8e9aa9",at:0},{color:"#eef2f7",at:40},{color:"#a7b1c0",at:70},{color:"#dfe6ee",at:100}]},
  gold:{ label:"Gold", stops:[
    {color:"#8a6d1a",at:0},{color:"#ffd700",at:40},{color:"#fff3b0",at:65},{color:"#d4a017",at:100}]},
  red:{ label:"Red", stops:[{color:"#7f1d1d",at:0},{color:"#f87171",at:55},{color:"#b91c1c",at:100}]},
  orange:{ label:"Orange", stops:[{color:"#7c2d12",at:0},{color:"#fb923c",at:55},{color:"#c2410c",at:100}]},
  yellow:{ label:"Yellow", stops:[{color:"#854d0e",at:0},{color:"#fde047",at:55},{color:"#ca8a04",at:100}]},
  green:{ label:"Green", stops:[{color:"#14532d",at:0},{color:"#4ade80",at:55},{color:"#15803d",at:100}]},
  blue:{ label:"Blue", stops:[{color:"#1e3a8a",at:0},{color:"#60a5fa",at:55},{color:"#1d4ed8",at:100}]},
  indigo:{ label:"Indigo", stops:[{color:"#312e81",at:0},{color:"#818cf8",at:55},{color:"#4338ca",at:100}]},
  violet:{ label:"Violet", stops:[{color:"#4c1d95",at:0},{color:"#c084fc",at:55},{color:"#7e22ce",at:100}]},
};

/* Icons are 24×24, Tabler-style strokes. `svg` is the inner markup.   */
const ICON_LIBRARY = {
  "Research Methods":{
    "qualitative":{ label:"Qualitative approaches", svg:'<path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10"/><path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2"/>' },
    "quantitative":{ label:"Quantitative approaches", svg:'<path d="M3 3v18h18"/><path d="M20 18v3"/><path d="M16 16v5"/><path d="M12 13v8"/><path d="M8 16v5"/><path d="M3 11c6 0 5 -5 9 -5s3 5 9 5"/>' },
    "participation":{ label:"Research participation", svg:'<path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1"/><path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M17 10h2a2 2 0 0 1 2 2v1"/><path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M3 13v-1a2 2 0 0 1 2 -2h2"/>' },
    "bell-curve":{ label:"Bell curve", svg:'<path d="M3 19h18"/><path d="M4 19c4.5 0 5-12 8-12s3.5 12 8 12"/>' },
    flask:{ label:"Flask", svg:'<path d="M10 3v6l-4.6 8.1A2 2 0 0 0 7.2 20h9.6a2 2 0 0 0 1.8-2.9L14 9V3"/><path d="M9 3h6"/><path d="M8.5 14h7"/>' },
  },
  "Academic Skills":{
    "referencing":{ label:"Referencing", svg:'<path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"/><path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"/>' },
    "support-services":{ label:"Support services", svg:'<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M15 15l3.35 3.35"/><path d="M9 15l-3.35 3.35"/><path d="M5.65 5.65l3.35 3.35"/><path d="M18.35 5.65l-3.35 3.35"/>' },
    "who-to-contact":{ label:"Who to contact", svg:'<path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5"/><path d="M9 4v13"/><path d="M15 7v5.5"/><path d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879"/><path d="M19 18v.01"/>' },
    award:{ label:"Award", svg:'<circle cx="12" cy="9" r="5"/><path d="M9.2 13.4L7.8 21l4.2-2.7L16.2 21l-1.4-7.6"/>' },
  },
  "Professional Identity":{
    "psychfest":{ label:"PsychFest attendance", svg:'<path d="M11 21h-5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3.5"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h11"/><path d="M17.8 20.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138"/>' },
    "future-planning":{ label:"Future planning", svg:'<path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4"/><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5"/>' },
    "volunteering":{ label:"Volunteering & community", svg:'<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/><path d="M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.81 .69 2.5 0l1 -1a3.182 3.182 0 0 1 4.5 0l2.25 2.25"/><path d="M12.5 15.5l2 2"/><path d="M15 13l2 2"/>' },
    briefcase:{ label:"Briefcase", svg:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>' },
  },
  "Digital Skills":{
    "university-setup":{ label:"University setup", svg:'<path d="M3 19l18 0"/><path d="M5 7a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -8"/>' },
    "ms-office":{ label:"MS Office", svg:'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1"/><path d="M20 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0"/><path d="M12.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5"/>' },
    "questionnaire":{ label:"Questionnaire building", svg:'<path d="M12 3a3 3 0 0 0 -3 3v12a3 3 0 0 0 3 3"/><path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3"/><path d="M13 7h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-7"/><path d="M5 7h-1a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h1"/><path d="M17 12h.01"/><path d="M13 12h.01"/>' },
    "email":{ label:"Email", svg:'<path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"/><path d="M3 7l9 6l9 -6"/>' },
  },
  "Communication Skills":{
    "presentation-skills":{ label:"Presentation skills", svg:'<path d="M3 4l18 0"/><path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10"/><path d="M12 16l0 4"/><path d="M9 20l6 0"/><path d="M8 12l3 -3l2 2l3 -3"/>' },
    "written-skills":{ label:"Written skills", svg:'<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/>' },
    "group-work":{ label:"Working in groups", svg:'<path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>' },
  },
};

/* Decorative elements. `fill:true` = solid shape, otherwise strokes.  */
const DECORATIONS = {
  "laurel-left":{ label:"Laurel (left)", svg:'<path d="M19 21C13 18.5 9.5 13.5 9.5 5"/><path d="M9.5 7C7.5 6.5 6.3 5 6 2.6 8.4 3 9.8 4.4 10.2 6.4"/><path d="M10 11C8 10.8 6.4 9.6 5.7 7.3 8.1 7.4 9.7 8.6 10.4 10.5"/><path d="M11.4 14.7C9.4 14.9 7.6 14 6.4 12 8.8 11.7 10.6 12.6 11.6 14.3"/><path d="M13.6 17.8C11.6 18.3 9.7 17.7 8.2 15.9 10.6 15.3 12.5 15.9 13.8 17.4"/>' },
  "laurel-right":{ label:"Laurel (right)", flip:true, svg:'<path d="M19 21C13 18.5 9.5 13.5 9.5 5"/><path d="M9.5 7C7.5 6.5 6.3 5 6 2.6 8.4 3 9.8 4.4 10.2 6.4"/><path d="M10 11C8 10.8 6.4 9.6 5.7 7.3 8.1 7.4 9.7 8.6 10.4 10.5"/><path d="M11.4 14.7C9.4 14.9 7.6 14 6.4 12 8.8 11.7 10.6 12.6 11.6 14.3"/><path d="M13.6 17.8C11.6 18.3 9.7 17.7 8.2 15.9 10.6 15.3 12.5 15.9 13.8 17.4"/>' },
  sparkle:{ label:"Sparkle", fill:true, svg:'<path d="M12 2c.8 4.8 2.9 7.4 8 8.2-5.1.8-7.2 3.4-8 8.2-.8-4.8-2.9-7.4-8-8.2 5.1-.8 7.2-3.4 8-8.2z"/>' },
  divider:{ label:"Divider", svg:'<path d="M2 12h7M15 12h7"/><path d="M12 9.6l2 2.4-2 2.4-2-2.4z"/>' },
  ribbon:{ label:"Ribbon banner", fill:true, svg:'<path d="M2 8h20l-2.6 4L22 16H2l2.6-4L2 8z"/>' },
  crown:{ label:"Crown", svg:'<path d="M4.5 16.5L3 8l5 3.5L12 5l4 6.5L21 8l-1.5 8.5z"/><path d="M5 20h14"/>' },
  dots:{ label:"Dot divider", fill:true, svg:'<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>' },
  burst:{ label:"Starburst", svg:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>' },
};

/* Default position / scale of each decoration, PER SHAPE.
   Edit these numbers to taste — x right, y up, from badge centre.     */
const DECOR_DEFAULTS = {
  circle:{
    "laurel-left":  { x:-92, y:-118, scale:2.1 },
    "laurel-right": { x: 92, y:-118, scale:2.1 },
    sparkle:        { x:  0, y:-122, scale:1.7 },
    divider:        { x:  0, y:  32, scale:3.2 },
    ribbon:         { x:  0, y:-146, scale:3.2 },
    crown:          { x:  0, y: 128, scale:1.7 },
    dots:           { x:  0, y: -80, scale:2.0 },
    burst:          { x:  0, y: 134, scale:1.5 },
  },
  square:{
    "laurel-left":  { x:-104, y:-128, scale:2.2 },
    "laurel-right": { x: 104, y:-128, scale:2.2 },
    sparkle:        { x:   0, y:-134, scale:1.8 },
    divider:        { x:   0, y:  34, scale:3.6 },
    ribbon:         { x:   0, y:-158, scale:3.6 },
    crown:          { x:   0, y: 140, scale:1.9 },
    dots:           { x:   0, y: -88, scale:2.2 },
    burst:          { x:   0, y: 146, scale:1.6 },
  },
  pentagon:{
    "laurel-left":  { x:-82, y:-96, scale:1.9 },
    "laurel-right": { x: 82, y:-96, scale:1.9 },
    sparkle:        { x:  0, y:-104, scale:1.6 },
    divider:        { x:  0, y:  26, scale:3.0 },
    ribbon:         { x:  0, y:-120, scale:2.9 },
    crown:          { x:  0, y: 96, scale:1.5 },
    dots:           { x:  0, y: -64, scale:1.8 },
    burst:          { x:  0, y: 102, scale:1.4 },
  },
  hexagon:{
    "laurel-left":  { x:-78, y:-104, scale:1.9 },
    "laurel-right": { x: 78, y:-104, scale:1.9 },
    sparkle:        { x:  0, y:-112, scale:1.6 },
    divider:        { x:  0, y:  30, scale:3.0 },
    ribbon:         { x:  0, y:-128, scale:2.8 },
    crown:          { x:  0, y: 114, scale:1.5 },
    dots:           { x:  0, y: -72, scale:1.8 },
    burst:          { x:  0, y: 120, scale:1.4 },
  },
};

/* Per-shape layout: text positions and the slots new icons drop into. */
const SHAPES = {
  circle:{ label:"Circle",
    title:   { y: 62, maxW:280 },
    subtitle:{ y: 14, maxW:260 },
    iconSlots:[ {x:-82,y:-48},{x:0,y:-48},{x:82,y:-48},{x:0,y:118} ],
    levelY: -92,
  },
  square:{ label:"Square",
    title:   { y: 72, maxW:320 },
    subtitle:{ y: 22, maxW:300 },
    iconSlots:[ {x:-92,y:-52},{x:0,y:-52},{x:92,y:-52},{x:0,y:128} ],
    levelY: -100,
  },
  pentagon:{ label:"Pentagon",
    title:   { y: 46, maxW:240 },
    subtitle:{ y: 4, maxW:220 },
    iconSlots:[ {x:-66,y:-36},{x:0,y:-36},{x:66,y:-36},{x:0,y:88} ],
    levelY: -74,
  },
  hexagon:{ label:"Hexagon",
    title:   { y: 56, maxW:250 },
    subtitle:{ y: 10, maxW:230 },
    iconSlots:[ {x:-70,y:-44},{x:0,y:-44},{x:70,y:-44},{x:0,y:104} ],
    levelY: -80,
  },
};

const MAX_EXPORT_BYTES = 256 * 1024;

/* Quick-alignment offsets for the L/C/R and T/M/B buttons on placed
   icons & decorations. EDIT ME to change the snap positions.         */
const ALIGN_STEP_X = 72;
const ALIGN_STEP_Y = 72;

/* =====================================================================
   2. STATE
   ===================================================================== */
const state = {
  shape:"circle",
  scallops:true, scallopCount:14, scallopDepth:9,
  borderWidth:46,
  preset:"rainbow",
  stops: COLOR_PRESETS.rainbow.stops.map(s=>({...s})),
  title:   { text:"RESEARCH", size:46, color:"#3b3f8c", x:0, y:62, arch:"none", archRadius:150, bevel:true, constrain:true },
  subtitle:{ text:"Skills Award", size:20, color:"#5a5f73", x:0, y:14, arch:"none", archRadius:158, bevel:true, constrain:true },
  icons:[],        // {uid, iconId, custom?, svg, label, x, y, scale, color|null}
  decorations:[],  // {uid, decorId, x, y, scale, color|null}
  grid:false,
  level:0,         // 0 = off, or 4 / 5 / 6 — shows a "LEVEL n" pill
  mode:"badge",    // "badge" (screen/Moodle, free) | "medal" (3D-print constrained)
  medalPreset:"pendant",
  // STL / 3D-print settings (mm). Round-tripped via serializeState().
  stl:{ medallionMM:50, baseThickness:3.0, raiseHeight:1.0, loop:true, loopOuter:12.0, loopHole:6.0,
        bevelMM:0.3, border:true, borderWidthMM:2.0, borderRaiseMM:1.0 },
};

/* Medal presets: intent-based sizes so users don't hand-tune five fields.
   Each carries the STL geometry defaults for that physical object.      */
const MEDAL_PRESETS = {
  keyring:{ label:"Keyring",     medallionMM:40,  baseThickness:3, raiseHeight:0.8, loop:true, loopOuter:10, loopHole:5, bevelMM:0.3 },
  pendant:{ label:"Pendant",     medallionMM:55,  baseThickness:3, raiseHeight:1.0, loop:true, loopOuter:12, loopHole:6, bevelMM:0.3 },
  medal:{   label:"Medal",       medallionMM:75,  baseThickness:4, raiseHeight:1.2, loop:true, loopOuter:14, loopHole:7, bevelMM:0.4 },
  large:{   label:"Large medal", medallionMM:100, baseThickness:4, raiseHeight:1.5, loop:true, loopOuter:16, loopHole:8, bevelMM:0.4 },
};
let uidCounter = 1;
const uid = () => "u" + (uidCounter++);

/* =====================================================================
   3. GEOMETRY
   ===================================================================== */
const CX = 256, CY = 256, R_OUT = 244;

/* Outline point at parameter t (0..1) for a shape of "radius" R.
   Returns {x,y} in SVG space, plus unit outward normal.               */
function outlinePoint(shape, t, R){
  const a = t * Math.PI * 2 - Math.PI/2;            // start at top
  if (shape === "circle"){
    return { x:CX + R*Math.cos(a), y:CY + R*Math.sin(a), nx:Math.cos(a), ny:Math.sin(a) };
  }
  if (shape === "square"){                          // squircle (superellipse n=4)
    const n = 4, c = Math.cos(a), s = Math.sin(a);
    const x = Math.sign(c)*Math.pow(Math.abs(c),2/n)*R;
    const y = Math.sign(s)*Math.pow(Math.abs(s),2/n)*R;
    const len = Math.hypot(x,y)||1;
    return { x:CX+x, y:CY+y, nx:x/len, ny:y/len };
  }
  // pentagon / hexagon: regular polygon.
  // Orient so the shape is symmetric about the vertical axis and sits
  // upright: pentagon points straight up (vertex at top), hexagon keeps
  // its original pointy-top orientation.
  const sides = shape === "pentagon" ? 5 : 6;
  const seg = (Math.PI*2) / sides;
  // Angle of the nearest vertex direction, measured from the top.
  // For both shapes a vertex sits at the top (a = -PI/2), so we measure
  // the angular distance to the closest vertex and use the standard
  // "distance from centre to a polygon edge" formula.
  const rel = a + Math.PI/2;                       // 0 = straight up
  const local = ((rel % seg) + seg) % seg - seg/2; // signed offset to nearest vertex
  const r = R * Math.cos(seg/2) / Math.cos(local);
  const x = r*Math.cos(a), y = r*Math.sin(a);
  const len = Math.hypot(x,y)||1;
  return { x:CX+x, y:CY+y, nx:x/len, ny:y/len };
}

/* Build a closed path, optionally with a scalloped (wavy) edge.       */
function shapePath(shape, R, scallops){
  const N = 240;
  let d = "";
  for (let i=0; i<=N; i++){
    const t = i/N;
    const p = outlinePoint(shape, t, R);
    let x = p.x, y = p.y;
    if (scallops){
      const wave = state.scallopDepth * Math.cos(t * Math.PI*2 * state.scallopCount);
      x += p.nx * wave; y += p.ny * wave;
    }
    d += (i? "L":"M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
}

/* Inner usable radius of the badge face (for auto-fit + counters).    */
const faceRadius = () => R_OUT - state.borderWidth - (state.scallops? state.scallopDepth:0) - 6;

/* =====================================================================
   4. RENDER BADGE
   ===================================================================== */
const stage   = document.getElementById("badge-holder");
const mini100 = document.getElementById("mini-100");
const mini60  = document.getElementById("mini-60");

function gradientDefs(){
  const stops = [...state.stops].sort((a,b)=>a.at-b.at)
    .map(s=>`<stop offset="${s.at}%" stop-color="${s.color}"/>`).join("");
  return `
  <defs>
    <linearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
    <linearGradient id="bm-metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
    </linearGradient>
    <radialGradient id="bm-face" cx="0.5" cy="0.38" r="0.75">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="78%" stop-color="#fbfaff"/>
      <stop offset="100%" stop-color="#eef0f7"/>
    </radialGradient>
    <radialGradient id="bm-plate" cx="0.5" cy="0.4" r="0.75">
      <stop offset="0%"  stop-color="#eef1f6"/>
      <stop offset="70%" stop-color="#dde1ea"/>
      <stop offset="100%" stop-color="#c8cdda"/>
    </radialGradient>
    <radialGradient id="bm-shine" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function iconMarkup(item, kind){
  const def = kind==="decor" ? DECORATIONS[item.decorId] : null;
  let inner = kind==="decor" ? def.svg : item.svg;
  const flip  = kind==="decor" && def.flip;
  // In 3D (medal) mode the print is a single solid colour and the badge
  // gradient is often near-white where a decoration sits, making it
  // invisible on the preview. So elements without an explicit colour get
  // a solid preview ink in 3D mode instead of the gradient.
  const previewInk = "#3a3f5c";
  const gradientPaint = state.mode==="medal" ? previewInk : "url(#bm-grad)";
  const colour = item.color || gradientPaint;
  // normalise any icon canvas (24, 256, 512…) to a 24-unit design size
  const w = item.w || 24, h = item.h || 24;
  const normal = 24 / Math.max(w, h);
  let paint;
  if (kind!=="decor" && item.isImage){
    inner = `<image href="${item.dataUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    paint = "";
  } else if (kind!=="decor" && item.selfPainted){
    // icon body carries its own fills/strokes (e.g. Material, Phosphor):
    // swap currentColor for the chosen paint and leave the rest alone
    inner = inner.replace(/currentColor/g, colour);
    paint = "";
  } else if (kind==="decor" && def.fill){
    paint = `fill="${colour}" stroke="none"`;
  } else {
    paint = `fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  }
  const s = item.scale * normal;
  const sx = (flip? -1:1) * s;
  const tx = (CX + item.x).toFixed(1), ty = (CY - item.y).toFixed(1);
  return `<g transform="translate(${tx} ${ty}) scale(${sx} ${s}) translate(${-w/2} ${-h/2})" ${paint}>${inner}</g>`;
}

/* Hanging loop (bail) drawn on the PREVIEW in 3D mode, matching where the
   STL loopGeometry builds it: a ring at the topmost outline point,
   overlapping into the plate so it reads as fused. Preview-only (the STL
   builds the real geometry); returns "" unless 3D mode + loop on. */
function loopMarkup(){
  if (state.mode !== "medal" || !state.stl || !state.stl.loop) return "";
  const mmU = mmPerUnit();
  const rO = (state.stl.loopOuter/2) / mmU;   // SVG units
  const rH = (state.stl.loopHole/2)  / mmU;
  // topmost outline point in SVG space
  const N = 480; let topSvgY = Infinity, topSvgX = CX;
  for (let i=0;i<N;i++){
    const t=i/N; const p=outlinePoint(state.shape,t,R_OUT);
    let x=p.x,y=p.y;
    if (state.scallops){ const wave=state.scallopDepth*Math.cos(t*Math.PI*2*state.scallopCount); x+=p.nx*wave; y+=p.ny*wave; }
    if (y < topSvgY){ topSvgY=y; topSvgX=x; }
  }
  const cx = topSvgX;
  const cy = topSvgY - rO*0.7;   // above the edge, overlapping down into it
  return `<g>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rO.toFixed(1)}" fill="url(#bm-plate)" stroke="#9aa3b5" stroke-opacity="0.6" stroke-width="1.2"/>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rH.toFixed(1)}" fill="#f4f6fa"/>
  </g>`;
}

/* "LEVEL n" pill (n = 4/5/6), a rounded rect with light text, sitting
   above the bottom decorations. Hidden when state.level is 0. In 3D mode
   it paints a solid ink (like decorations) so it's visible on the preview
   and traces cleanly into relief. */
function levelMarkup(L){
  if (!state.level) return "";
  const label = `LEVEL ${state.level}`;
  const size = 20, padX = 16, h = 30;
  const w = measureLevelWidth(label, size) + padX*2;
  const cx = CX, cy = CY - (L.levelY ?? -92);
  const x = cx - w/2, y = cy - h/2;
  const medal = state.mode === "medal";
  const pillFill = medal ? "#3a3f5c" : "url(#bm-grad)";
  const textFill = medal ? "#ffffff" : "#ffffff";
  return `<g data-bm-role="level">
    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="${h/2}"
          fill="${pillFill}" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.5"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
          font-family="'Sora','Inter',sans-serif" font-weight="700" font-size="${size}"
          letter-spacing="2" fill="${textFill}">${label}</text>
  </g>`;
}
/* Width of the pill's label at its fixed size (reuses the shared canvas
   context; letter-spacing of 2 matches the rendered text). */
function measureLevelWidth(label, size){
  _measureCtx.font = `700 ${size}px 'Sora','Inter',sans-serif`;
  return _measureCtx.measureText(label).width + Math.max(0, label.length-1)*2;
}

/* Inner frame ring drawn on the PREVIEW in 3D mode (so the preview shows
   what the STL borderGeometry will print). Smooth outline at the same
   inset the STL frame uses; drawn as a solid ink band via two stroked
   outlines. Returns "" when not in 3D mode or the frame is off.         */
function frameMarkup(){
  if (state.mode !== "medal" || !state.stl || !state.stl.border) return "";
  const mmU = mmPerUnit();
  const insetUnits = (state.borderWidth * 0.5) + (state.scallops ? state.scallopDepth : 0) + 8;
  const bandUnits  = state.stl.borderWidthMM / mmU;
  const rOuter = R_OUT - insetUnits;
  const rInner = rOuter - bandUnits;
  if (rInner <= 20) return "";
  const outerPath = shapePath(state.shape, rOuter, false);
  const innerPath = shapePath(state.shape, rInner, false);
  // filled band = outer minus inner, using even-odd fill. A mid-slate grey
  // reads as a raised frame sitting on the pale medal plate (both visible),
  // with a soft top highlight so it looks proud of the surface.
  return `<path d="${outerPath} ${innerPath}" fill="#6b7285" fill-rule="evenodd"/>
    <path d="${outerPath}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>`;
}

function gridMarkup(){
  if (!state.grid) return "";
  let g = '<g class="bm-grid" font-family="Inter,sans-serif" font-size="9">';
  for (let v=-224; v<=224; v+=32){
    const major = v % 64 === 0;
    const c = major? "#9aa6c0":"#c9d1e4";
    g += `<line x1="${CX+v}" y1="12" x2="${CX+v}" y2="500" stroke="${c}" stroke-width="${v===0?1.6:0.7}"/>`;
    g += `<line x1="12" y1="${CY+v}" x2="500" y2="${CY+v}" stroke="${c}" stroke-width="${v===0?1.6:0.7}"/>`;
    if (major && v!==0){
      g += `<text x="${CX+v+2}" y="${CY-3}" fill="#7c89a6">${v}</text>`;
      g += `<text x="${CX+3}" y="${CY-v-3}" fill="#7c89a6">${v}</text>`;
    }
  }
  g += `<text x="${CX+4}" y="${CY+11}" fill="#5a6478" font-weight="700">0,0</text></g>`;
  return g;
}

function badgeSVG({forExport=false} = {}){
  const sh = state.shape;
  const outer = shapePath(sh, R_OUT, state.scallops);
  const faceR = R_OUT - state.borderWidth;
  const face  = shapePath(sh, faceR, false);
  const rim   = shapePath(sh, faceR + 3, false);
  const L = SHAPES[sh];

  let text = "";
  const textEl = (k)=>{
    const t = state[k];
    if (!t.text) return "";
    const content = k==="subtitle" ? esc(t.text.toUpperCase()) : esc(t.text);
    const drawSize = t.arch === "none" ? fittedSize(k) : t.size;   // straight text auto-shrinks to fit
    const medalSub = state.mode==="medal" && k==="subtitle";
    const subWeight = medalSub ? 700 : 600;
    const subTrack  = medalSub ? 2 : 3;
    const fontAttrs = k==="title"
      ? `font-family="'Sora','Inter',sans-serif" font-weight="700" font-size="${drawSize}" letter-spacing="2" fill="${t.color}"`
      : `font-family="'Inter',sans-serif" font-weight="${subWeight}" font-size="${drawSize}" letter-spacing="${subTrack}" fill="${t.color}"`;
    const roleAttr = `data-bm-role="${k}"`;
    if (t.arch === "none"){
      return `<text ${roleAttr} x="${CX + t.x}" y="${CY - t.y}" text-anchor="middle" ${fontAttrs}>${content}</text>`;
    }
    // Arched text: a semicircular path centred on the badge; sweep=1 runs
    // over the top (text upright above), sweep=0 under the bottom.
    const r = t.archRadius;
    const sweep = t.arch === "up" ? 1 : 0;
    const pid = `bm-arc-${k}`;
    const d = `M ${CX - r} ${CY} A ${r} ${r} 0 0 ${sweep} ${CX + r} ${CY}`;
    return `<defs><path id="${pid}" d="${d}" fill="none"/></defs>
      <text ${roleAttr} text-anchor="middle" ${fontAttrs}><textPath href="#${pid}" startOffset="50%">${content}</textPath></text>`;
  };
  text += textEl("title");
  text += textEl("subtitle");

  const icons = state.icons.map(i=>iconMarkup(i,"icon")).join("");
  const decor = state.decorations.map(d=>iconMarkup(d,"decor")).join("");
  const level = levelMarkup(L);

  // In 3D (medal) mode the on-screen preview stands in for a single-colour
  // printed plate, so paint the WHOLE shape as a pale grey medallion body
  // (with a soft rim + shine for form) rather than the colourful badge
  // gradient. The raised inner frame is then drawn a distinct darker grey
  // on top, so you can see both the full medal shape AND the frame.
  // IMPORTANT: the pale-grey plate is PREVIEW-ONLY. For export (forExport),
  // medal mode must keep the original bm-grad/bm-face plate paths, because
  // the STL relief mask (reliefSVGText) identifies and removes the body by
  // its bm-grad/metal/face fills. If we painted bm-plate here for export,
  // the whole disc would survive into the relief mask and be traced as a
  // giant solid feature. So bm-plate is used only when !forExport.
  const medal = state.mode === "medal";
  const body = (medal && !forExport)
    ? `<path d="${outer}" fill="url(#bm-plate)"/>
  <path d="${outer}" fill="url(#bm-metal)"/>
  <path d="${rim}" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2.5"/>
  <path d="${outer}" fill="none" stroke="#9aa3b5" stroke-opacity="0.55" stroke-width="1.5"/>`
    : `<path d="${outer}" fill="url(#bm-grad)"/>
  <path d="${outer}" fill="url(#bm-metal)"/>
  <path d="${rim}" fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="2.5"/>
  <path d="${face}" fill="url(#bm-face)"/>
  <path d="${face}" fill="none" stroke="url(#bm-grad)" stroke-opacity="0.35" stroke-width="1.5"/>`;

  return `<svg class="badge" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Badge: ${esc(state.title.text)}">
  ${gradientDefs()}
  ${body}
  <ellipse cx="380" cy="105" rx="60" ry="26" transform="rotate(38 380 105)" fill="url(#bm-shine)" opacity="0.8"/>
  ${forExport? "":loopMarkup()}${forExport? "":frameMarkup()}${text}${icons}${decor}${level}${forExport? "":gridMarkup()}
  </svg>`;
}

const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ---- text fitting --------------------------------------------------
   Pixel-accurate width measurement (Canvas measureText) replaces the
   old glyph-width estimate, so any font/size/spacing fits correctly.
   Text renders at the chosen size, but auto-shrinks toward a readable
   floor if it would overflow. Input is only capped when even the floor
   size can't fit the text — and never below MIN_CHARS characters.    */
const MIN_CHARS   = 10;   // counter never caps below this
const TITLE_FLOOR = 24;   // smallest px size the title will shrink to (badge mode)
const SUB_FLOOR   = 13;   // smallest px size the subtitle will shrink to (badge mode)

/* Glyph stems are ~0.14 × font size (measured, stable across sizes and
   the Sora/Inter fallbacks). For a stem to survive extrusion it must be
   at least one nozzle wide, so the smallest PRINTABLE font size at the
   current medallion scale is nozzle / (0.14 × mm-per-unit).            */
const STEM_RATIO = 0.14;
function printableFloor(){
  // mmPerUnit()/STL_NOZZLE_MM are defined in the STL section; called only
  // at render/counter time, so they're available by then.
  const mmU = (typeof mmPerUnit === "function") ? mmPerUnit() : 50/(2*244);
  const nozzle = (typeof STL_NOZZLE_MM === "number") ? STL_NOZZLE_MM : 0.4;
  return Math.ceil(nozzle / (STEM_RATIO * mmU));
}
/* In medal mode both texts must clear the printable floor; the subtitle
   is the usual casualty, so it gets the full print floor. In badge mode
   the original screen floors apply.                                     */
const floorFor = which => {
  if (state.mode === "medal"){
    const pf = printableFloor();
    return which==="title" ? Math.max(TITLE_FLOOR, pf) : pf;
  }
  return which==="title" ? TITLE_FLOOR : SUB_FLOOR;
};

const _measureCanvas = document.createElement("canvas");
const _measureCtx = _measureCanvas.getContext("2d");
/* Width of `text` in SVG user units at a given size, including the
   per-letter tracking the badge applies (letter-spacing is added
   between glyphs: n-1 gaps). */
function measureTextWidth(text, which, size){
  if (!text) return 0;
  const medalSub = state.mode==="medal" && which==="subtitle";
  const spacing = which==="title" ? 2 : (medalSub ? 2 : 3);
  const family  = which==="title" ? "'Sora','Inter',sans-serif" : "'Inter',sans-serif";
  const weight  = which==="title" ? 700 : (medalSub ? 700 : 600);
  _measureCtx.font = `${weight} ${size}px ${family}`;
  const upper = which==="subtitle" ? text.toUpperCase() : text;
  const base = _measureCtx.measureText(upper).width;
  const gaps = Math.max(0, upper.length - 1) * spacing;
  return base + gaps;
}
/* Largest size <= the chosen size that fits the available width, but
   never below the readable floor. Used both to render and to fit.
   When this text's `constrain` is OFF, the user has opted out of the
   fit caps entirely, so we render at exactly the chosen size (no shrink,
   no floor) — in both badge and medal mode.                            */
function fittedSize(which){
  const t = state[which];
  if (t.constrain === false) return t.size;   // unconstrained: honour the raw size
  const maxW = maxWFor(which);
  const floor = floorFor(which);
  let size = t.size;
  while (size > floor && measureTextWidth(t.text, which, size) > maxW){
    size -= 1;
  }
  return Math.max(floor, Math.min(t.size, size));
}

function render(){
  capTextToLimits();                         // enforce char limits BEFORE drawing
  stage.innerHTML = badgeSVG();
  const mini = badgeSVG({forExport:true});   // grid-free copy for the minis
  mini100.innerHTML = mini;
  mini60.innerHTML = mini;
  updateCounters();
  updatePrintCheck();                        // live print-readiness panel (3D mode)
  snapshot();
}

/* Truncate title/subtitle to the current max-chars (which depends on mode,
   shape and medallion size) and reflect that into the input fields. Runs
   before the SVG is built so the preview always matches the fields — this
   is what stops the preview lagging when switching to 3D mode, where the
   printable floor is larger and the character cap is tighter. */
function capTextToLimits(){
  [["title",inputTitle],["subtitle",inputSubtitle]].forEach(([k,inp])=>{
    const max = maxChars(k);
    if (Number.isFinite(max) && state[k].text.length > max){
      state[k].text = state[k].text.slice(0, max);
      if (inp) inp.value = state[k].text;
    }
  });
}

/* =====================================================================
   PRINT CHECK — element bounds, collisions, decoration scaling
   ---------------------------------------------------------------------
   All geometry here is in the same centre-origin unit space as the badge
   (x → right, y → up, canvas 512, edge ≈ ±244). Bounding boxes are
   approximate (fast enough to recompute live) and used only to warn.    */

/* Half-extent (radius-ish) of an icon/decoration at its scale. Icons are
   ~24-unit art drawn at `scale`; the drawn size is roughly 12*scale each
   side. Decorations use the same convention.                            */
function itemHalfExtent(it){
  const base = 12;                    // half of the 24-unit icon box
  return base * (it.scale || 1);
}
/* Axis-aligned box {x0,y0,x1,y1} in centre-origin units for any element. */
function elementBox(kind, it){
  if (kind === "title" || kind === "subtitle"){
    const t = state[kind];
    if (!t.text) return null;
    const size = t.arch === "none" ? fittedSize(kind) : t.size;
    const w = measureTextWidth(t.text, kind, size);
    const h = size * 1.15;            // cap height + a little slack
    // arched text hugs a curve; approximate its box by the curve span
    if (t.arch !== "none"){
      const r = t.archRadius;
      const halfW = Math.min(w/2, r);
      const cy = t.arch === "up" ? r*0.5 : -r*0.5;
      return { x0:-halfW, y0:cy-h, x1:halfW, y1:cy+h, label: kind==="title"?"Title":"Subtitle" };
    }
    return { x0:t.x - w/2, y0:t.y - h/2, x1:t.x + w/2, y1:t.y + h/2, label: kind==="title"?"Title":"Subtitle" };
  }
  // icon or decoration
  const he = itemHalfExtent(it);
  return { x0:it.x - he, y0:it.y - he, x1:it.x + he, y1:it.y + he };
}
function boxesOverlap(a, b){
  if (!a || !b) return false;
  // small tolerance so touching edges don't count as a collision
  const t = 2;
  return !(a.x1 - t <= b.x0 || b.x1 - t <= a.x0 || a.y1 - t <= b.y0 || b.y1 - t <= a.y0);
}
/* Is the box fully inside the usable face (inside the frame if present)?  */
function boxInsideFace(box){
  if (!box) return true;
  const fr = faceRadius();
  // if a 3D inner frame is on, keep content inside it
  const inset = (state.mode==="medal" && state.stl && state.stl.border)
    ? state.stl.borderWidthMM / mmPerUnit() + 6 : 0;
  const limit = fr - inset;
  const corners = [[box.x0,box.y0],[box.x1,box.y0],[box.x0,box.y1],[box.x1,box.y1]];
  return corners.every(([x,y]) => Math.hypot(x,y) <= limit);
}

/* Build the full element list with computed boxes and issue flags. Used
   by the Print Check panel and by the canvas red-outline overlay.       */
function collectElements(){
  const els = [];
  if (state.title.text)    els.push({ kind:"title",    ref:state.title,    name:"Title",    box:elementBox("title") });
  if (state.subtitle.text) els.push({ kind:"subtitle", ref:state.subtitle, name:"Subtitle", box:elementBox("subtitle") });
  if (state.level){
    const L = SHAPES[state.shape];
    const label = `LEVEL ${state.level}`;
    const w = measureLevelWidth(label, 20) + 32, h = 30;
    const cy = (L.levelY ?? -92);   // centre-origin y (already "up")
    els.push({ kind:"level", ref:state, name:`Level ${state.level} pill`,
      box:{ x0:-w/2, y0:cy - h/2, x1:w/2, y1:cy + h/2 } });
  }
  state.icons.forEach((it,i)=> els.push({ kind:"icon", ref:it, idx:i,
    name: it.label || "Icon", box:elementBox("icon", it) }));
  state.decorations.forEach((it,i)=> els.push({ kind:"decor", ref:it, idx:i,
    name: (DECORATIONS[it.decorId] && DECORATIONS[it.decorId].label) || "Decoration", box:elementBox("decor", it) }));

  // flag issues: pairwise overlap + outside-face + too-thin-to-print
  els.forEach(e=>{ e.issues = []; });
  for (let i=0;i<els.length;i++){
    for (let j=i+1;j<els.length;j++){
      if (boxesOverlap(els[i].box, els[j].box)){
        els[i].issues.push(`overlaps ${els[j].name}`);
        els[j].issues.push(`overlaps ${els[i].name}`);
      }
    }
  }
  els.forEach(e=>{
    if (!boxInsideFace(e.box)) e.issues.push(state.stl && state.stl.border && state.mode==="medal" ? "outside frame" : "outside face");
  });
  return els;
}

/* Render the Print Check panel (3D mode only) and draw red bounding-box
   overlays on the main canvas for any flagged element. Live: called from
   render(), so it updates on every edit.                                */
const PC_STEP_XY = 8;      // fixed nudge step for X/Y buttons (units)
const PC_STEP_SC = 0.1;    // fixed scale step
function updatePrintCheck(){
  const panel = document.getElementById("print-check");
  if (!panel) return;
  const on = state.mode === "medal";
  panel.hidden = !on;
  // clear any existing canvas overlays
  const svg = stage.querySelector("svg.badge");
  svg?.querySelectorAll(".bm-collide").forEach(n=>n.remove());
  if (!on) return;

  const els = collectElements();
  const list = document.getElementById("print-check-list");
  const summary = document.getElementById("print-check-summary");
  list.innerHTML = "";

  // draw overlays + build rows
  let issues = 0;
  els.forEach((e)=>{
    const bad = e.issues.length > 0;
    if (bad) issues++;
    // red box on canvas
    if (bad && e.box && svg){
      const r = document.createElementNS("http://www.w3.org/2000/svg","rect");
      r.setAttribute("class","bm-collide");
      r.setAttribute("x", (CX + e.box.x0).toFixed(1));
      r.setAttribute("y", (CY - e.box.y1).toFixed(1));   // flip y
      r.setAttribute("width",  (e.box.x1 - e.box.x0).toFixed(1));
      r.setAttribute("height", (e.box.y1 - e.box.y0).toFixed(1));
      svg.appendChild(r);
    }
    // panel row
    const row = document.createElement("div");
    row.className = "pc-item " + (bad ? "bad" : "ok");
    const controls = (e.kind==="icon" || e.kind==="decor" || e.kind==="title" || e.kind==="subtitle")
      ? `<div class="pc-controls">
           <span class="grp">S<button class="pc-btn" data-act="s-">–</button><button class="pc-btn" data-act="s+">+</button></span>
           <span class="grp">X<button class="pc-btn" data-act="x-">–</button><button class="pc-btn" data-act="x+">+</button></span>
           <span class="grp">Y<button class="pc-btn" data-act="y-">–</button><button class="pc-btn" data-act="y+">+</button></span>
         </div>` : "";
    row.innerHTML = `
      <div class="pc-top">
        <span class="pc-badge">${bad ? "!" : "✓"}</span>
        <span class="pc-name" title="${e.name}">${e.name}</span>
      </div>
      ${bad ? `<p class="pc-reason">${e.issues.join("; ")}</p>` : ""}
      ${controls}`;
    // wire the nudge buttons to the element's ref
    row.querySelectorAll(".pc-btn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const ref = e.ref;
        const act = btn.dataset.act;
        if (act==="s+") ref.scale = clamp((ref.scale||1)+PC_STEP_SC, 0.3, 8);
        if (act==="s-") ref.scale = clamp((ref.scale||1)-PC_STEP_SC, 0.3, 8);
        if (act==="x+") ref.x = clamp((ref.x||0)+PC_STEP_XY, -240, 240);
        if (act==="x-") ref.x = clamp((ref.x||0)-PC_STEP_XY, -240, 240);
        if (act==="y+") ref.y = clamp((ref.y||0)+PC_STEP_XY, -240, 240);
        if (act==="y-") ref.y = clamp((ref.y||0)-PC_STEP_XY, -240, 240);
        // text scale maps to font size (title/subtitle have no .scale)
        if ((e.kind==="title"||e.kind==="subtitle") && (act==="s+"||act==="s-")){
          const d = act==="s+" ? 2 : -2;
          ref.size = clamp((ref.size||20)+d, 10, 72);
        }
        syncTextPositionInputs?.();
        buildPlacedLists();
        render();
      });
    });
    list.appendChild(row);
  });
  summary.textContent = issues === 0
    ? "All elements print-ready ✓"
    : `${issues} element${issues>1?"s":""} need${issues>1?"":"s"} attention — adjust below or in the lists.`;
}
const MEDAL_DECOR_BOOST = 1.35;
function scaleDecorationsForMedal(){
  [...state.icons, ...state.decorations].forEach(it=>{
    // unconstrained items keep their user-set scale (and wider cap)
    it.scale = it.constrain === false
      ? clamp((it.scale||1) * MEDAL_DECOR_BOOST, 0.05, 100)
      : clamp((it.scale||1) * MEDAL_DECOR_BOOST, 0.3, 8);
  });
  nudgeApartOnce();
}

/* One gentle pass: push any element that collides or sits outside the
   face back toward a safe spot. Deliberate-action only (mode/preset),
   never continuous, so it can't fight the user mid-edit.                */
function nudgeApartOnce(){
  const movable = collectElements().filter(e=> (e.kind==="icon" || e.kind==="decor") && e.ref.constrain !== false);
  const fr = faceRadius();
  movable.forEach(e=>{
    // pull inside the face first
    const cx = (e.box.x0+e.box.x1)/2, cy=(e.box.y0+e.box.y1)/2;
    const dist = Math.hypot(cx,cy);
    const he = itemHalfExtent(e.ref);
    const maxDist = fr - he - 8;
    if (dist > maxDist && dist > 0){
      const f = maxDist/dist;
      e.ref.x = Math.round(e.ref.x * f);
      e.ref.y = Math.round(e.ref.y * f);
    }
  });
  // one overlap-relief pass: nudge colliding movable items apart along the
  // vector between their centres
  for (let pass=0; pass<2; pass++){
    const els = collectElements();
    for (let i=0;i<els.length;i++){
      for (let j=i+1;j<els.length;j++){
        const a=els[i], b=els[j];
        if (!boxesOverlap(a.box,b.box)) continue;
        // only move icons/decorations (leave text anchored); and never move
        // an item whose constrain is off — the user placed it deliberately.
        const canMove = el => (el.kind==="icon"||el.kind==="decor") && el.ref.constrain !== false;
        const bMove = canMove(b) ? b : canMove(a) ? a : null;
        if (!bMove) continue;
        const other = bMove===b ? a : b;
        let dx = ((bMove.box.x0+bMove.box.x1)/2) - ((other.box.x0+other.box.x1)/2);
        let dy = ((bMove.box.y0+bMove.box.y1)/2) - ((other.box.y0+other.box.y1)/2);
        if (dx===0 && dy===0){ dx = 1; dy = 1; }
        const len = Math.hypot(dx,dy)||1;
        bMove.ref.x = Math.round(clamp(bMove.ref.x + (dx/len)*24, -240, 240));
        bMove.ref.y = Math.round(clamp(bMove.ref.y + (dy/len)*24, -240, 240));
      }
    }
  }
}
/* ---- undo history (in-memory only; resets on refresh) ----
   A snapshot of the design is kept after every change. Rapid edits
   (typing, slider drags) within 800 ms coalesce into one undo step. */
const HISTORY_LIMIT = 60;
let history = [];
let lastSnapTime = 0;
let restoring = false;

function snapshot(){
  if (restoring) return;
  const snap = JSON.stringify(serializeState());
  if (history[history.length-1] === snap) return;
  const now = Date.now();
  if (history.length > 1 && now - lastSnapTime < 800){
    history[history.length-1] = snap;        // coalesce with previous step
  } else {
    history.push(snap);
    if (history.length > HISTORY_LIMIT) history.shift();
  }
  lastSnapTime = now;
  updateUndoBtn();
}
function undo(){
  if (history.length < 2) return;
  history.pop();                             // discard the current state
  const prev = history[history.length-1];
  restoring = true;
  try{ applyImportedState(JSON.parse(prev)); }
  finally{ restoring = false; }
  lastSnapTime = 0;                          // next edit starts a fresh step
  updateUndoBtn();
}
function updateUndoBtn(){
  document.getElementById("btn-undo").disabled = history.length < 2;
}
document.getElementById("btn-undo").addEventListener("click", undo);
document.addEventListener("keydown", e=>{
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z"){
    // let native text-field undo work while typing; act everywhere else
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    e.preventDefault();
    undo();
  }
});

/* =====================================================================
   5. PANEL — build + events
   ===================================================================== */

/* ---- shape ---- */
document.querySelectorAll(".shape-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".shape-opt").forEach(b=>b.setAttribute("aria-pressed","false"));
    btn.setAttribute("aria-pressed","true");
    state.shape = btn.dataset.shape;
    // re-seat decorations and text on their per-shape defaults
    state.decorations.forEach(d=>{
      const def = DECOR_DEFAULTS[state.shape][d.decorId];
      if (def) Object.assign(d, def);
    });
    state.title.x = 0;    state.title.y = SHAPES[state.shape].title.y;
    state.subtitle.x = 0; state.subtitle.y = SHAPES[state.shape].subtitle.y;
    syncTextPositionInputs();
    buildPlacedLists(); render();
  });
});
bindNumber("adv-scallop-count","scallopCount");
bindNumber("adv-scallop-depth","scallopDepth");
bindNumber("adv-border-width","borderWidth");
document.getElementById("adv-scallops").checked = state.scallops;
document.getElementById("adv-scallops").addEventListener("change", e=>{
  state.scallops = e.target.checked; render();
});

function bindNumber(id, key, obj=state, unclamp=null){
  const el = document.getElementById(id);
  el.value = obj[key];
  el.addEventListener("input", ()=>{
    const v = Number(el.value);
    if (!Number.isNaN(v)) {
      // when `unclamp` says this field is currently unconstrained, take the
      // raw value (still guarded to a sane absolute range); otherwise clamp
      // to the input's own min/max as before.
      obj[key] = (unclamp && unclamp())
        ? clamp(v, -100000, 100000)
        : clamp(v, Number(el.min)||-999, Number(el.max)||999);
      render();
    }
  });
}
const clamp = (v,lo,hi)=>Math.min(hi,Math.max(lo,v));

/* ---- colour swatches ---- */
const swatchGrid = document.getElementById("swatch-grid");
Object.entries(COLOR_PRESETS).forEach(([key,p])=>{
  const b = document.createElement("button");
  b.className = "swatch";
  b.title = p.label;
  b.setAttribute("aria-label", p.label);
  b.setAttribute("aria-pressed", key===state.preset ? "true":"false");
  b.style.background = `linear-gradient(135deg, ${p.stops.map(s=>`${s.color} ${s.at}%`).join(",")})`;
  const lab = document.createElement("span"); lab.textContent = p.label; b.appendChild(lab);
  b.addEventListener("click", ()=>{
    state.preset = key;
    state.stops = p.stops.map(s=>({...s}));
    swatchGrid.querySelectorAll(".swatch").forEach(s=>s.setAttribute("aria-pressed","false"));
    b.setAttribute("aria-pressed","true");
    buildStopList(); render();
  });
  swatchGrid.appendChild(b);
});

/* ---- gradient stop editor ---- */
const stopList = document.getElementById("stop-list");
function buildStopList(){
  stopList.innerHTML = "";
  state.stops.forEach((s,i)=>{
    const row = document.createElement("div");
    row.className = "stop-row";
    row.innerHTML = `
      <input type="color" value="${s.color}" aria-label="Colour point ${i+1}">
      <span class="pos-label">at</span>
      <input type="number" min="0" max="100" step="1" value="${s.at}" aria-label="Position % of point ${i+1}">
      <span class="pos-label">%</span>
      <button class="del" title="Remove this colour point" ${state.stops.length<=2? "disabled":""}>🗑</button>`;
    const inputs = row.querySelectorAll("input");
    const col = inputs[0], num = inputs[1];
    col.addEventListener("input", ()=>{ s.color = col.value; render(); });
    num.addEventListener("input", ()=>{ s.at = clamp(Number(num.value)||0,0,100); render(); });
    row.querySelector(".del").addEventListener("click", ()=>{
      if (state.stops.length>2){ state.stops.splice(i,1); buildStopList(); render(); }
    });
    stopList.appendChild(row);
  });
}
document.getElementById("btn-add-stop").addEventListener("click", ()=>{
  state.stops.push({ color:"#888888", at:50 });
  buildStopList(); render();
});
buildStopList();

/* ---- text ---- */
const inputTitle = document.getElementById("input-title");
const inputSubtitle = document.getElementById("input-subtitle");
inputTitle.value = state.title.text;
inputSubtitle.value = state.subtitle.text;

/* Usable text width: straight texts use the per-shape limit; arched
   texts get ~58% of their semicircle's length as a safe maximum.     */
function maxWFor(which){
  const t = state[which];
  return t.arch !== "none" ? Math.PI * t.archRadius * 0.58 : SHAPES[state.shape][which].maxW;
}
/* How many characters can fit before even the floor size overflows.
   Measured at the floor size (the smallest we'll shrink to), so the
   badge can always display up to this many. Never below MIN_CHARS. */
function maxChars(which){
  if (state[which].constrain === false) return Infinity;   // unconstrained: no character cap
  const maxW = maxWFor(which);
  const floor = floorFor(which);
  // widen a representative average-width string until it overflows
  const sample = which==="title" ? "N" : "M";   // wide-ish caps
  let n = 0;
  while (n < 60 && measureTextWidth(sample.repeat(n+1), which, floor) <= maxW) n++;
  return Math.max(MIN_CHARS, n);
}
function updateCounters(){
  [["title",inputTitle,"count-title"],["subtitle",inputSubtitle,"count-subtitle"]].forEach(([k,inp,cid])=>{
    const max = maxChars(k);
    const unconstrained = !Number.isFinite(max);
    // maxLength must be a finite integer; remove the attribute when unconstrained
    if (unconstrained) inp.removeAttribute("maxLength");
    else { inp.maxLength = max; if (state[k].text.length > max){ state[k].text = state[k].text.slice(0,max); inp.value = state[k].text; } }
    const c = document.getElementById(cid);
    if (unconstrained){
      // no cap: just show the count, and note that fit is off
      c.textContent = `${state[k].text.length} · unconstrained`;
      c.classList.remove("over","print-warn");
      return;
    }
    const shrunk = state[k].arch === "none" && state[k].text && fittedSize(k) < state[k].size;
    let label = shrunk
      ? `${state[k].text.length}/${max} · fit ${fittedSize(k)}px`
      : `${state[k].text.length}/${max}`;
    // Medal mode: flag when the text is at the printable-length limit, so
    // the user sees the print constraint while typing rather than at export.
    let nearLimit = false;
    if (state.mode === "medal" && state[k].text){
      if (state[k].text.length >= max){ label += " · print max"; nearLimit = true; }
    }
    c.textContent = label;
    c.classList.toggle("over", state[k].text.length >= max);
    c.classList.toggle("print-warn", nearLimit);
  });
}
inputTitle.addEventListener("input", ()=>{ state.title.text = inputTitle.value; render(); });
inputSubtitle.addEventListener("input", ()=>{ state.subtitle.text = inputSubtitle.value; render(); });
bindNumber("adv-title-size","size",state.title, ()=>state.title.constrain===false);
bindNumber("adv-subtitle-size","size",state.subtitle, ()=>state.subtitle.constrain===false);
bindColor("adv-title-color", state.title);
bindColor("adv-subtitle-color", state.subtitle);
// arch (curve) controls
[["title-arch","title"],["subtitle-arch","subtitle"]].forEach(([id,k])=>{
  const el = document.getElementById(id);
  el.value = state[k].arch;
  el.addEventListener("change", ()=>{ state[k].arch = el.value; render(); });
});
bindNumber("title-arch-r","archRadius",state.title);
bindNumber("subtitle-arch-r","archRadius",state.subtitle);
// per-text bevel toggles (3D mode only; harmless otherwise)
[["title-bevel","title"],["subtitle-bevel","subtitle"]].forEach(([id,k])=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = state[k].bevel !== false;
  el.addEventListener("change", ()=>{
    state[k].bevel = el.checked;
    snapshot();
    if (typeof exportBackdrop !== "undefined" && !exportBackdrop.hidden && typeof window.__refreshSTL === "function") window.__refreshSTL();
  });
});
// per-text constrain toggles: when OFF, size/length caps and auto-fit are
// lifted for that text (badge and medal alike). Default ON.
[["title-constrain","title"],["subtitle-constrain","subtitle"]].forEach(([id,k])=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = state[k].constrain !== false;
  el.addEventListener("change", ()=>{
    state[k].constrain = el.checked;
    // widen/tighten the size input's own min/max hint so the field lets the
    // user type larger values when unconstrained (the clamp is bypassed in
    // bindNumber, but the browser's spinner should allow it too).
    const sizeEl = document.getElementById(k==="title" ? "adv-title-size" : "adv-subtitle-size");
    if (sizeEl){
      if (el.checked){ sizeEl.min = k==="title" ? 18 : 10; sizeEl.max = k==="title" ? 72 : 40; }
      else { sizeEl.min = 1; sizeEl.max = 400; }
    }
    render();
    snapshot();
  });
});
// text position controls + align buttons
bindNumber("adv-title-x","x",state.title);
bindNumber("adv-title-y","y",state.title);
bindNumber("adv-subtitle-x","x",state.subtitle);
bindNumber("adv-subtitle-y","y",state.subtitle);

function syncTextPositionInputs(){
  document.getElementById("adv-title-x").value = state.title.x;
  document.getElementById("adv-title-y").value = state.title.y;
  document.getElementById("adv-subtitle-x").value = state.subtitle.x;
  document.getElementById("adv-subtitle-y").value = state.subtitle.y;
}

document.querySelectorAll(".text-align").forEach(holder=>{
  const k = holder.dataset.target;            // "title" | "subtitle"
  holder.innerHTML = `
    <span class="align-label">Align</span>
    <span class="align-group" role="group" aria-label="Align ${k} horizontally">
      <button class="alg" data-x="${-ALIGN_STEP_X}" title="Align left">L</button>
      <button class="alg" data-x="0" title="Centre horizontally">C</button>
      <button class="alg" data-x="${ALIGN_STEP_X}" title="Align right">R</button>
    </span>
    <span class="align-group" role="group" aria-label="Align ${k} vertically">
      <button class="alg" data-y="${ALIGN_STEP_Y}" title="Align top">T</button>
      <button class="alg" data-y="0" title="Centre vertically">M</button>
      <button class="alg" data-y="${-ALIGN_STEP_Y}" title="Align bottom">B</button>
    </span>`;
  holder.querySelectorAll(".alg").forEach(b=>{
    b.addEventListener("click", ()=>{
      if (b.dataset.x !== undefined) state[k].x = Number(b.dataset.x);
      if (b.dataset.y !== undefined) state[k].y = Number(b.dataset.y);
      syncTextPositionInputs();
      render();
    });
  });
});
function bindColor(id, obj){
  const el = document.getElementById(id);
  el.value = obj.color;
  el.addEventListener("input", ()=>{ obj.color = el.value; render(); });
}

/* ---- icon library tiles ---- */
/* ---- icon library: collapsed accordions, one per category ----
   New categories/icons added to ICON_LIBRARY appear here automatically;
   tile grids wrap to new rows however many icons a category holds.   */
const catWrap = document.getElementById("icon-categories");
Object.entries(ICON_LIBRARY).forEach(([cat, icons])=>{
  const sec = document.createElement("details");
  sec.className = "icon-cat";
  const summary = document.createElement("summary");
  summary.innerHTML = `<span>${cat}</span><span class="cat-count">${Object.keys(icons).length}</span>`;
  sec.appendChild(summary);
  const grid = document.createElement("div"); grid.className = "tile-grid";
  Object.entries(icons).forEach(([id, ic])=>{
    const t = document.createElement("button");
    t.className = "tile"; t.title = `Add ${ic.label}`;
    t.innerHTML = `<svg viewBox="0 0 24 24">${ic.svg}</svg>`;
    t.addEventListener("click", ()=>addIcon(id, ic));
    grid.appendChild(t);
  });
  sec.appendChild(grid); catWrap.appendChild(sec);
});

function addIcon(id, ic){
  const slots = SHAPES[state.shape].iconSlots;
  const slot = slots[state.icons.length % slots.length];
  state.icons.push({
    uid:uid(), iconId:id, svg:ic.svg, label:ic.label,
    w:ic.w||24, h:ic.h||24, selfPainted:!!ic.selfPainted,
    x:slot.x, y:slot.y, scale:1.9, color:null, constrain:true
  });
  buildPlacedLists(); render();
}

/* ---- icon search (all open sets via the free Iconify API) ----
   api.iconify.design is free, keyless and CORS-enabled.
   ── EDIT ME: add/remove entries to change the set-filter dropdown.
   Keys are Iconify prefixes (see icon-sets.iconify.design).         */
const ICON_SET_FILTERS = {
  "":                 "All icon sets",
  "tabler":           "Tabler",
  "material-symbols": "Material Symbols",
  "ph":               "Phosphor",
  "lucide":           "Lucide",
  "bi":               "Bootstrap",
  "noto":             "Noto Emoji (colour)",
};
const SEARCH_FETCH_LIMIT = 256;   // how many matches to pull from the API
const SEARCH_PAGE_SIZE   = 24;    // how many tiles to show per "page"

const ICONIFY = "https://api.iconify.design";
const searchInput   = document.getElementById("icon-search-input");
const searchBtn     = document.getElementById("btn-icon-search");
const searchResults = document.getElementById("icon-search-results");
const searchMsg     = document.getElementById("icon-search-msg");
const setFilter     = document.getElementById("icon-set-filter");
const moreBtn       = document.getElementById("btn-more-icons");

Object.entries(ICON_SET_FILTERS).forEach(([value,label])=>{
  const o = document.createElement("option");
  o.value = value; o.textContent = label;
  setFilter.appendChild(o);
});

let pendingIcons = [];     // "prefix:name" strings not yet rendered
let totalFound   = 0;
let shownCount   = 0;
let setNamesCache = {};

searchBtn.addEventListener("click", searchIcons);
moreBtn.addEventListener("click", renderMoreResults);
searchInput.addEventListener("keydown", e=>{ if (e.key==="Enter"){ e.preventDefault(); searchIcons(); } });

async function searchIcons(){
  const q = searchInput.value.trim();
  if (!q) { searchInput.focus(); return; }
  searchResults.innerHTML = "";
  moreBtn.hidden = true;
  pendingIcons = []; totalFound = 0; shownCount = 0;
  searchMsg.textContent = "Searching…";
  searchBtn.disabled = true;
  try{
    const prefix = setFilter.value ? `&prefix=${encodeURIComponent(setFilter.value)}` : "";
    const res = await fetch(`${ICONIFY}/search?query=${encodeURIComponent(q)}&limit=${SEARCH_FETCH_LIMIT}${prefix}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    pendingIcons = data.icons || [];
    totalFound = data.total ?? pendingIcons.length;
    setNamesCache = data.collections || {};
    if (!pendingIcons.length){
      searchMsg.textContent = `No icons found for “${q}” — try a simpler or more general word, or switch the set filter back to “All icon sets”.`;
      return;
    }
    await renderMoreResults();
  }catch{
    searchMsg.textContent = "Couldn't reach the icon library — check your internet connection. The built-in icons above still work offline.";
  }finally{
    searchBtn.disabled = false;
  }
}

async function renderMoreResults(){
  moreBtn.disabled = true;
  const batch = pendingIcons.splice(0, SEARCH_PAGE_SIZE);
  // group by icon set so each set's bodies arrive in one request
  const bySet = {};
  batch.forEach(full=>{
    const [prefix, name] = full.split(":");
    if (prefix && name) (bySet[prefix] ||= []).push(name);
  });
  try{
    await Promise.all(Object.entries(bySet).map(async ([prefix, names])=>{
      const r = await fetch(`${ICONIFY}/${prefix}.json?icons=${names.join(",")}`);
      if (!r.ok) return;
      const set = await r.json();
      names.forEach(name=>{
        const ic = set.icons?.[name];
        if (!ic || !ic.body) return;
        const w = ic.width  || set.width  || 24;
        const h = ic.height || set.height || 24;
        const body = sanitizeSVGFragment(ic.body);
        if (!body) return;
        const setLabel = setNamesCache[prefix]?.name || prefix;
        const label = name.replace(/-/g, " ");
        const t = document.createElement("button");
        t.className = "tile"; t.title = `Add “${label}” (${setLabel})`;
        t.innerHTML = `<svg viewBox="0 0 ${w} ${h}">${body.replace(/currentColor/g, "#1c2330")}</svg>`;
        t.addEventListener("click", ()=>addIcon(`${prefix}:${name}`,
          { label, svg: body, w, h, selfPainted: true }));
        searchResults.appendChild(t);
        shownCount++;
      });
    }));
    moreBtn.hidden = pendingIcons.length === 0;
    const moreNote = totalFound > shownCount + pendingIcons.length
      ? ` (of ${totalFound} matches — refine your search to see the rest)` : "";
    searchMsg.textContent = shownCount
      ? `Showing ${shownCount} of ${shownCount + pendingIcons.length} loaded results${moreNote}. Click an icon to add it; hover a tile to see its icon set.`
      : "No usable icons in these results — try another word.";
  }catch{
    searchMsg.textContent = "Some results couldn't be loaded — check your connection and try again.";
  }finally{
    moreBtn.disabled = false;
  }
}

/* ---- Tabler import ---- */
document.getElementById("btn-import-icon").addEventListener("click", ()=>{
  const box = document.getElementById("import-svg");
  const msg = document.getElementById("import-msg");
  try{
    const doc = new DOMParser().parseFromString(box.value, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error("no svg");
    svg.querySelectorAll("script,style,foreignObject,image").forEach(n=>n.remove());
    svg.querySelectorAll("*").forEach(n=>{
      [...n.attributes].forEach(a=>{
        if (/^on/i.test(a.name) || a.value.includes("javascript:")) n.removeAttribute(a.name);
      });
    });
    // read the icon's canvas size so any set (24, 256, 512 units) scales correctly
    const vb = (svg.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number);
    const w = (vb.length===4 && vb[2]>0) ? vb[2] : (Number(svg.getAttribute("width"))||24);
    const h = (vb.length===4 && vb[3]>0) ? vb[3] : (Number(svg.getAttribute("height"))||24);
    state.icons.push({
      uid:uid(), iconId:"custom", svg:svg.innerHTML, label:"Imported icon",
      w, h, selfPainted:true,
      ...SHAPES[state.shape].iconSlots[state.icons.length % 4], scale:1.9, color:null, constrain:true
    });
    box.value = ""; msg.textContent = "Icon added to the badge ✓";
    buildPlacedLists(); render();
  }catch{
    msg.textContent = "That didn't look like SVG code. Use “Copy SVG” on tabler.io/icons and paste the whole snippet.";
  }
});

/* ---- image upload (PNG/JPG embedded into the badge) ----
   Opinionated importer: validates type & size, auto-shrinks large
   images, and warns when an upload may hurt quality or file size.   */
const uploadInput = document.getElementById("upload-image");
const uploadMsg   = document.getElementById("upload-msg");
const UPLOAD_MAX_DIM   = 320;          // longest side after auto-resize (px)
const UPLOAD_HARD_KB   = 2048;         // reject anything larger outright
const UPLOAD_RESIZE_KB = 120;          // resize trigger
const UPLOAD_WARN_KB   = 180;          // warn that export may exceed 256 KB

uploadInput.addEventListener("change", ()=>{
  const file = uploadInput.files[0];
  uploadInput.value = "";
  if (!file) return;
  uploadMsg.textContent = "";
  if (!/^image\/(png|jpeg)$/.test(file.type)){
    uploadMsg.textContent = "Please choose a PNG or JPG image — other formats can't be embedded reliably.";
    return;
  }
  if (file.size > UPLOAD_HARD_KB * 1024){
    uploadMsg.textContent = `That image is ${Math.round(file.size/1024)} KB — far too large for a badge. Please use an image under ${UPLOAD_HARD_KB/2} KB (around 200–300 px square is ideal).`;
    return;
  }
  const objUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    URL.revokeObjectURL(objUrl);
    let w = img.naturalWidth, h = img.naturalHeight;
    const warnings = [];
    if (Math.max(w,h) < 96) warnings.push("it's quite small, so it may look blurry on the badge");
    if (Math.abs(w-h) > Math.max(w,h)*0.25) warnings.push("it isn't square, so it will sit as a rectangle (a square image usually looks better)");
    const finish = (dataUrl, fw, fh)=>{
      const kb = Math.round(dataUrl.length * 0.75 / 1024);
      if (kb > UPLOAD_WARN_KB) warnings.push(`the embedded image is ~${kb} KB, so the exported badge may exceed the 256 KB limit — check the size in the export window`);
      const slot = SHAPES[state.shape].iconSlots[state.icons.length % 4];
      state.icons.push({
        uid:uid(), iconId:"image", isImage:true, dataUrl, svg:"",
        label:(file.name || "Image").slice(0,24), w:fw, h:fh, selfPainted:false,
        x:slot.x, y:slot.y, scale:2.2, color:null, constrain:true
      });
      buildPlacedLists(); render();
      uploadMsg.textContent = `Image added (~${kb} KB)` + (warnings.length? `. Note: ${warnings.join("; ")}.` : ".");
    };
    if (Math.max(w,h) > UPLOAD_MAX_DIM || file.size > UPLOAD_RESIZE_KB * 1024){
      const f = Math.min(1, UPLOAD_MAX_DIM / Math.max(w,h));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w*f));
      c.height = Math.max(1, Math.round(h*f));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = file.type === "image/png"
        ? c.toDataURL("image/png")
        : c.toDataURL("image/jpeg", 0.85);
      warnings.push(`it was resized to ${c.width}×${c.height} px to keep the badge file small`);
      finish(dataUrl, c.width, c.height);
    } else {
      const r = new FileReader();
      r.onload  = ()=>finish(r.result, w, h);
      r.onerror = ()=>{ uploadMsg.textContent = "That image couldn't be read — please try another file."; };
      r.readAsDataURL(file);
    }
  };
  img.onerror = ()=>{
    URL.revokeObjectURL(objUrl);
    uploadMsg.textContent = "That image couldn't be read — please try another file.";
  };
  img.src = objUrl;
});

/* ---- decoration tiles ---- */
const decorTiles = document.getElementById("decor-tiles");
Object.entries(DECORATIONS).forEach(([id, d])=>{
  const t = document.createElement("button");
  t.className = "tile"; t.title = `Add ${d.label}`;
  t.innerHTML = `<svg viewBox="0 0 24 24" ${d.fill? 'style="fill:#1c2330;stroke:none"':""}>${d.svg}</svg>`;
  t.addEventListener("click", ()=>{
    const def = DECOR_DEFAULTS[state.shape][id] || {x:0,y:0,scale:2};
    state.decorations.push({ uid:uid(), decorId:id, ...def, color:null, constrain:true });
    buildPlacedLists(); render();
  });
  decorTiles.appendChild(t);
});

/* ---- level marker (Off / 4 / 5 / 6) ---- */
const levelOpts = document.getElementById("level-opts");
levelOpts.querySelectorAll(".lvl").forEach(b=>{
  b.addEventListener("click", ()=>{
    state.level = Number(b.dataset.level) || 0;
    syncLevelButtons();
    render();
  });
});
function syncLevelButtons(){
  levelOpts.querySelectorAll(".lvl").forEach(b=>
    b.setAttribute("aria-pressed", Number(b.dataset.level) === state.level ? "true" : "false"));
}

/* ---- placed item editors (icons + decorations) ---- */
function buildPlacedLists(){
  buildPlaced("placed-icons", state.icons, (it)=>it.label,
    (it)=> it.isImage
      ? `<svg viewBox="0 0 ${it.w||24} ${it.h||24}"><image href="${it.dataUrl}" width="${it.w||24}" height="${it.h||24}"/></svg>`
      : `<svg viewBox="0 0 ${it.w||24} ${it.h||24}">${String(it.svg).replace(/currentColor/g,"#1c2330")}</svg>`);
  buildPlaced("placed-decor", state.decorations, (it)=>DECORATIONS[it.decorId].label,
    (it)=>`<svg viewBox="0 0 24 24" ${DECORATIONS[it.decorId].fill? 'style="fill:#1c2330;stroke:none"':""}>${DECORATIONS[it.decorId].svg}</svg>`);
}
function buildPlaced(containerId, list, nameFn, thumbFn){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  list.forEach((it, idx)=>{
    const card = document.createElement("div");
    card.className = "placed";
    const colourBits = it.isImage ? "" : `
        <label>Colour <input class="f-col" type="color" value="${it.color || "#888888"}"></label>
        <button class="btn tiny f-style" title="Use the badge colour style">↺ style</button>`;
    card.innerHTML = `
      <div class="placed-top">${thumbFn(it)}<span class="name">${nameFn(it)}</span>
        <button class="del" title="Remove">🗑</button></div>
      <div class="placed-fields">
        <label>X <input class="f-x" type="number" step="2" value="${it.x}"></label>
        <label>Y <input class="f-y" type="number" step="2" value="${it.y}"></label>
        <label>Scale <input class="f-scale" type="number" step="0.1" min="${it.constrain===false?0.05:0.3}" max="${it.constrain===false?100:8}" value="${it.scale}"></label>
        ${colourBits}
      </div>
      <label class="toggle small placed-constrain">
        <input class="f-constrain" type="checkbox" ${it.constrain!==false?"checked":""}>
        <span class="toggle-track"></span>
        <span class="toggle-label">Constrain scale</span>
      </label>
      <div class="placed-align">
        <span class="align-label">Align</span>
        <span class="align-group" role="group" aria-label="Align horizontally">
          <button class="alg" data-x="${-ALIGN_STEP_X}" title="Align left">L</button>
          <button class="alg" data-x="0" title="Centre horizontally">C</button>
          <button class="alg" data-x="${ALIGN_STEP_X}" title="Align right">R</button>
        </span>
        <span class="align-group" role="group" aria-label="Align vertically">
          <button class="alg" data-y="${ALIGN_STEP_Y}" title="Align top">T</button>
          <button class="alg" data-y="0" title="Centre vertically">M</button>
          <button class="alg" data-y="${-ALIGN_STEP_Y}" title="Align bottom">B</button>
        </span>
      </div>`;
    const nx = card.querySelector(".f-x"), ny = card.querySelector(".f-y"), ns = card.querySelector(".f-scale");
    nx.addEventListener("input", ()=>{ it.x = Number(nx.value)||0; render(); });
    ny.addEventListener("input", ()=>{ it.y = Number(ny.value)||0; render(); });
    ns.addEventListener("input", ()=>{
      const v = Number(ns.value)||1;
      // unconstrained items may scale beyond the 0.3–8 range (still guarded
      // to a sane absolute cap); constrained items keep the printable range.
      it.scale = it.constrain === false ? clamp(v, 0.05, 100) : clamp(v, .3, 8);
      render();
    });
    const nc = card.querySelector(".f-col");
    if (nc){
      nc.addEventListener("input", ()=>{ it.color = nc.value; render(); });
      card.querySelector(".f-style").addEventListener("click", ()=>{ it.color = null; nc.value = "#888888"; render(); });
    }
    const ncon = card.querySelector(".f-constrain");
    if (ncon){
      ncon.addEventListener("change", ()=>{
        it.constrain = ncon.checked;
        // widen/tighten the scale input's own min/max so its spinner allows
        // the larger range when unconstrained.
        if (ncon.checked){ ns.min = 0.3; ns.max = 8; it.scale = clamp(it.scale, .3, 8); ns.value = it.scale; }
        else { ns.min = 0.05; ns.max = 100; }
        render();
      });
    }
    card.querySelectorAll(".alg").forEach(b=>{
      b.addEventListener("click", ()=>{
        if (b.dataset.x !== undefined){ it.x = Number(b.dataset.x); nx.value = it.x; }
        if (b.dataset.y !== undefined){ it.y = Number(b.dataset.y); ny.value = it.y; }
        render();
      });
    });
    card.querySelector(".del").addEventListener("click", ()=>{ list.splice(idx,1); buildPlacedLists(); render(); });
    wrap.appendChild(card);
  });
}

/* ---- grid toggle ---- */
document.getElementById("toggle-grid").addEventListener("change", e=>{
  state.grid = e.target.checked; render();
});

/* ---- auto-fit ---- */
document.getElementById("btn-autofit").addEventListener("click", ()=>{
  const fr = faceRadius();
  // commit each straight text to the size that actually fits (measured).
  // Unconstrained text opts out of fitting, so leave its size untouched
  // (fittedSize already returns the raw size for it, but skip to be explicit).
  ["title","subtitle"].forEach(k=>{
    if (state[k].constrain === false) return;
    if (state[k].arch === "none" && state[k].text){
      state[k].size = fittedSize(k);
    }
  });
  document.getElementById("adv-title-size").value = state.title.size;
  document.getElementById("adv-subtitle-size").value = state.subtitle.size;
  // pull icons/decorations inside the face — but leave unconstrained items
  // where the user put them (they've opted out of the size/position caps).
  [...state.icons, ...state.decorations].forEach(it=>{
    if (it.constrain === false) return;
    const half = 12 * it.scale;
    const dist = Math.hypot(it.x, it.y);
    const maxDist = fr - half - 8;
    if (dist > maxDist && dist > 0){
      const f = maxDist / dist;
      it.x = Math.round(it.x * f); it.y = Math.round(it.y * f);
    }
  });
  buildPlacedLists(); render();
});

/* =====================================================================
   6. HELP MODALS
   ===================================================================== */
const HELP = {
  shape:{ title:"Badge shape", body:`
    <p>Pick the overall outline of your badge. All other settings carry over when you switch shapes.</p>
    <ul>
      <li><strong>Scalloped edge</strong> (in advanced settings) adds a rosette-style wavy border — like a quality seal.</li>
      <li><strong>Border width</strong> changes how thick the coloured rim is.</li>
    </ul>`},
  colour:{ title:"Colour style", body:`
    <p>Choose a preset style for the badge border. <strong>Bronze, silver and gold</strong> work well for tiered awards; <strong>rainbow</strong> suits celebration badges.</p>
    <ul>
      <li>In advanced settings you can fine-tune every colour point of the gradient.</li>
      <li>Use <strong>＋ Add colour point</strong> for richer blends; a minimum of 2 points is required.</li>
    </ul>`},
  text:{ title:"Badge text", body:`
    <p>Every badge needs a <strong>title</strong> — keep it short and bold (e.g. RESEARCH). The <strong>subtitle</strong> is optional and sits underneath.</p>
    <ul>
      <li>Straight text <strong>auto-shrinks to fit</strong>: type freely and, if the text is longer than fits at your chosen size, it scales down just enough to fit (down to a readable minimum) — so short titles stay big and long ones still fit. The counter shows the current fitted size (e.g. "fit 38px") whenever this happens. At least 10 characters always fit; the counter's cap adjusts to the shape and is more generous when text is arched (a curve holds more letters than a straight line).</li>
      <li><strong>Advanced settings</strong> hold each text's size, colour, X/Y position with quick <strong>Align</strong> buttons (L/C/R and T/M/B), and the <strong>Curve</strong> option, which bends text into an arch over the top or under the bottom of the badge — the classic seal look. Curve radius moves the arch nearer to (smaller) or further from (larger) the centre.</li>
      <li>X/Y and Align apply to straight text; arched text is positioned by its curve radius instead. Switching shape resets text to that shape's standard positions, so badges stay consistent across a module.</li>
    </ul>`},
  icons:{ title:"Icons", body:`
    <p>Icons live in collapsible categories — click a category name to open it, then click any tile to add that icon to the badge. New icons drop into sensible slots; fine-tune them in the list at the bottom of this card.</p>
    <ul>
      <li><strong>X / Y</strong> move the icon (X: left–right, Y: down–up, from the badge centre). Turn on the <strong>positioning grid</strong> above the preview to see the coordinates.</li>
      <li><strong>Colour</strong> recolours the icon; <strong>↺ style</strong> returns it to the badge's gradient colours.</li>
      <li><strong>Search for more icons</strong> covers 200,000+ free icons. Use the dropdown to stay within one icon set (for a consistent style) or leave it on “All icon sets”, and click <strong>Show more results</strong> to page through long lists. This needs an internet connection; the built-in icons always work.</li>
      <li><strong>Align buttons</strong> (L / C / R and T / M / B) snap an item to common positions in one click — handy for tidy rows.</li>
      <li><strong>Upload your own image</strong> embeds a PNG or JPG. A square, transparent-background PNG around 200–300 px works best; big images are shrunk automatically and you'll be warned if a file risks breaking the 256 KB limit.</li>
      <li>Prefer to browse? Visit icon-sets.iconify.design (linked under the search box), or copy an icon from Tabler's website via the import section.</li>
    </ul>`},
  decor:{ title:"Decorations", body:`
    <p>Decorations are flourishes — laurels, sparkles and dividers — that give the badge a finished, award-like feel.</p>
    <ul>
      <li>Each decoration lands in a default spot for the current shape (laurels at the bottom, sparkle at the base, divider under the title).</li>
      <li>Adjust position, scale and colour in the list below the tiles, exactly like icons.</li>
    </ul>`},
};
const helpBackdrop = document.getElementById("help-backdrop");
document.querySelectorAll(".help-btn").forEach(b=>{
  b.addEventListener("click", ()=>{
    const h = HELP[b.dataset.help];
    document.getElementById("help-title").textContent = h.title;
    document.getElementById("help-body").innerHTML = h.body;
    helpBackdrop.hidden = false;
    document.getElementById("help-close").focus();
  });
});
document.getElementById("help-close").addEventListener("click", ()=>helpBackdrop.hidden = true);
helpBackdrop.addEventListener("click", e=>{ if (e.target===helpBackdrop) helpBackdrop.hidden = true; });

/* ---- user guide modal ---- */
const guideBackdrop = document.getElementById("guide-backdrop");
document.getElementById("btn-help-guide").addEventListener("click", ()=>{
  guideBackdrop.hidden = false;
  document.getElementById("guide-close").focus();
});
document.getElementById("guide-close").addEventListener("click", ()=>guideBackdrop.hidden = true);
guideBackdrop.addEventListener("click", e=>{ if (e.target===guideBackdrop) guideBackdrop.hidden = true; });

/* =====================================================================
   7. EXPORT
   ===================================================================== */
const exportBackdrop = document.getElementById("export-backdrop");
const fmtKB = b => (b/1024).toFixed(1) + " KB";
let jpgBlob = null;
let pngBlob = null;

document.getElementById("btn-export").addEventListener("click", async ()=>{
  if (!state.title.text.trim()){
    alert("Please add a title before exporting — every badge needs one.");
    inputTitle.focus(); return;
  }
  exportBackdrop.hidden = false;
  const warn = document.getElementById("export-warn");
  warn.textContent = "";

  // --- SVG size ---
  const svgText = exportSVGText();
  const svgBytes = new Blob([svgText], {type:"image/svg+xml"}).size;
  setPill("size-svg", svgBytes);

  // --- PNG size (transparent, rendered at up to 1024px, scaled to fit) ---
  document.getElementById("size-png").textContent = "estimating…";
  pngBlob = null;
  makePNG(svgText).then(b=>{
    pngBlob = b;
    setPill("size-png", b.size);
    if (b.size > MAX_EXPORT_BYTES)
      warn.textContent = "The PNG couldn't be squeezed under 256 KB — try JPG, or simplify the badge (fewer or smaller embedded images).";
  }).catch(()=>{
    document.getElementById("size-png").textContent = "unavailable";
    warn.textContent = "PNG preview failed in this browser — JPG still works.";
  });

  // --- JPG size (rendered at 1024px, quality stepped to fit 256 KB) ---
  document.getElementById("size-jpg").textContent = "estimating…";
  jpgBlob = null;
  try{
    jpgBlob = await makeJPG(svgText);
    setPill("size-jpg", jpgBlob.size);
    if (jpgBlob.size > MAX_EXPORT_BYTES)
      warn.textContent = "The JPG could not be compressed under 256 KB — try PNG, or simplify the badge.";
  }catch{
    document.getElementById("size-jpg").textContent = "unavailable";
    warn.textContent = "JPG preview failed in this browser — try PNG instead.";
  }
});
function setPill(id, bytes){
  const el = document.getElementById(id);
  el.textContent = fmtKB(bytes);
  el.classList.toggle("over", bytes > MAX_EXPORT_BYTES);
}
document.getElementById("export-close").addEventListener("click", ()=>exportBackdrop.hidden = true);
exportBackdrop.addEventListener("click", e=>{ if (e.target===exportBackdrop) exportBackdrop.hidden = true; });

function exportSVGText(){
  // Embed the design as metadata so the SVG can be re-imported and edited.
  // (Plain JSON inside a <metadata> tag — ignored by browsers and Moodle.)
  const designJSON = esc(JSON.stringify(serializeState()));
  const meta = `<metadata id="badge-maker-state">${designJSON}</metadata>`;
  return badgeSVG({forExport:true})
    .replace('class="badge" ','')
    .replace("</svg>", meta + "</svg>");
}
function serializeState(){
  const { grid, ...rest } = state;
  return { version:2, ...JSON.parse(JSON.stringify(rest)) };
}
function makeJPG(svgText){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText], {type:"image/svg+xml"}));
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,1024,1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const tryQ = (q)=>{
        c.toBlob(b=>{
          if (!b) return reject();
          if (b.size <= MAX_EXPORT_BYTES || q <= 0.4) resolve(b);
          else tryQ(q - 0.1);
        }, "image/jpeg", q);
      };
      tryQ(0.92);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}
/* PNG keeps the badge's transparency (no white background). PNG has no
   quality setting, so to fit the 256 KB limit we step the pixel size
   down (1024 → 768 → 640 → 512) until it fits or we run out of sizes. */
function makePNG(svgText){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText], {type:"image/svg+xml"}));
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      const sizes = [1024, 768, 640, 512];
      const trySize = (i)=>{
        const dim = sizes[i];
        const c = document.createElement("canvas");
        c.width = c.height = dim;
        c.getContext("2d").drawImage(img, 0, 0, dim, dim);   // transparent bg preserved
        c.toBlob(b=>{
          if (!b) return reject();
          if (b.size <= MAX_EXPORT_BYTES || i === sizes.length-1) resolve(b);
          else trySize(i+1);
        }, "image/png");
      };
      trySize(0);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}
function download(blob, name){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
const fileStem = ()=> (state.title.text.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-") || "badge");
document.getElementById("btn-dl-svg").addEventListener("click", ()=>{
  download(new Blob([exportSVGText()], {type:"image/svg+xml"}), fileStem()+".svg");
});
document.getElementById("btn-dl-png").addEventListener("click", async ()=>{
  if (!pngBlob) pngBlob = await makePNG(exportSVGText());
  download(pngBlob, fileStem()+".png");
});
document.getElementById("btn-dl-jpg").addEventListener("click", async ()=>{
  if (!jpgBlob) jpgBlob = await makeJPG(exportSVGText());
  download(jpgBlob, fileStem()+".jpg");
});

/* =====================================================================
   7b. IMPORT A PREVIOUSLY EXPORTED BADGE
   ===================================================================== */
const importBadgeInput = document.getElementById("import-badge-file");
document.getElementById("btn-import-badge").addEventListener("click", ()=>importBadgeInput.click());
importBadgeInput.addEventListener("change", ()=>{
  const file = importBadgeInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    importBadgeInput.value = "";          // allow re-importing the same file
    try{
      const doc = new DOMParser().parseFromString(reader.result, "image/svg+xml");
      const meta = doc.getElementById("badge-maker-state");
      if (!meta) throw new Error("no-meta");
      applyImportedState(JSON.parse(meta.textContent));
    }catch(err){
      alert(err.message === "no-meta"
        ? "This SVG wasn't exported from Badge Maker, so it can't be re-opened for editing.\n\nTip: badges exported here carry their design inside the file — export from Badge Maker and you can always import them again later."
        : "That file couldn't be read as a badge. Please choose an SVG exported from Badge Maker.");
    }
  };
  reader.readAsText(file);
});

function applyImportedState(s){
  // Validate + merge cautiously, so a hand-edited file can't break the app.
  if (!s || typeof s !== "object" || !s.title) throw new Error("Invalid badge data.");
  state.shape        = SHAPES[s.shape] ? s.shape : "circle";
  state.scallops     = !!s.scallops;
  state.scallopCount = clamp(Number(s.scallopCount)||14, 6, 40);
  state.scallopDepth = clamp(Number(s.scallopDepth)||9, 2, 20);
  state.borderWidth  = clamp(Number(s.borderWidth)||46, 20, 80);
  state.preset       = COLOR_PRESETS[s.preset] ? s.preset : "rainbow";
  state.stops        = Array.isArray(s.stops) && s.stops.length>=2
    ? s.stops.map(p=>({ color:safeColor(p.color), at:clamp(Number(p.at)||0,0,100) }))
    : COLOR_PRESETS[state.preset].stops.map(p=>({...p}));
  const safeArch = v => ["none","up","down"].includes(v) ? v : "none";
  // read each text's constrain flag first (default true); when false, size is
  // not clamped to the normal range so oversized text round-trips intact.
  const tCon = s.title.constrain === undefined ? true : !!s.title.constrain;
  const sCon = s.subtitle?.constrain === undefined ? true : !!s.subtitle.constrain;
  const tSize = tCon ? clamp(Number(s.title.size)||46,12,72) : (Number(s.title.size)||46);
  const sSize = sCon ? clamp(Number(s.subtitle?.size)||20,10,40) : (Number(s.subtitle?.size)||20);
  Object.assign(state.title,    { text:tCon ? String(s.title.text||"").slice(0,60) : String(s.title.text||""),    size:tSize,    color:safeColor(s.title.color,"#3b3f8c"),
    x:num(s.title.x ?? 0), y:(s.title.y !== undefined ? num(s.title.y) : SHAPES[state.shape].title.y),
    arch:safeArch(s.title.arch),    archRadius:clamp(Number(s.title.archRadius)||150,60,220),
    bevel: s.title.bevel === undefined ? true : !!s.title.bevel, constrain: tCon });
  Object.assign(state.subtitle, { text:sCon ? String(s.subtitle?.text||"").slice(0,60) : String(s.subtitle?.text||""), size:sSize, color:safeColor(s.subtitle?.color,"#5a5f73"),
    x:num(s.subtitle?.x ?? 0), y:(s.subtitle?.y !== undefined ? num(s.subtitle.y) : SHAPES[state.shape].subtitle.y),
    arch:safeArch(s.subtitle?.arch), archRadius:clamp(Number(s.subtitle?.archRadius)||158,60,220),
    bevel: s.subtitle?.bevel === undefined ? true : !!s.subtitle.bevel, constrain: sCon });
  state.icons = (Array.isArray(s.icons)? s.icons:[]).map(i=>{
    const iCon = i.constrain === undefined ? true : !!i.constrain;
    const iScale = iCon ? clamp(Number(i.scale)||1.9,.3,8) : clamp(Number(i.scale)||1.9, 0.05, 100);
    const base = {
      uid:uid(), iconId:String(i.iconId||"custom"), label:String(i.label||"Icon").slice(0,40),
      w:clamp(Number(i.w)||24,1,2048), h:clamp(Number(i.h)||24,1,2048),
      x:num(i.x), y:num(i.y), scale:iScale,
      color:i.color? safeColor(i.color):null, constrain:iCon,
    };
    if (i.isImage){
      // only accept well-formed PNG/JPG data URLs of sane length
      const ok = typeof i.dataUrl === "string"
        && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(i.dataUrl)
        && i.dataUrl.length < 900000;
      if (!ok) return null;
      return { ...base, isImage:true, dataUrl:i.dataUrl, svg:"", selfPainted:false };
    }
    return { ...base, isImage:false, dataUrl:"", svg:sanitizeSVGFragment(String(i.svg||"")), selfPainted:!!i.selfPainted };
  }).filter(Boolean);
  state.decorations = (Array.isArray(s.decorations)? s.decorations:[])
    .filter(d=>DECORATIONS[d.decorId])
    .map(d=>{
      const dCon = d.constrain === undefined ? true : !!d.constrain;
      const dScale = dCon ? clamp(Number(d.scale)||2,.3,8) : clamp(Number(d.scale)||2, 0.05, 100);
      return { uid:uid(), decorId:d.decorId, x:num(d.x), y:num(d.y),
               scale:dScale, color:d.color? safeColor(d.color):null, constrain:dCon };
    });
  state.level = [4,5,6].includes(Number(s.level)) ? Number(s.level) : 0;
  // STL / 3D-print settings (validated; falls back to sane defaults)
  const st = s.stl || {};
  state.stl = {
    medallionMM:   clamp(Number(st.medallionMM)||STL_MEDALLION_MM, 20, 150),
    baseThickness: clamp(Number(st.baseThickness)||3.0, 0.6, 12),
    raiseHeight:   clamp(Number.isFinite(Number(st.raiseHeight)) ? Number(st.raiseHeight) : 1.0, -4, 6),
    loop:          st.loop === undefined ? true : !!st.loop,
    loopOuter:     clamp(Number(st.loopOuter)||12.0, 4, 30),
    loopHole:      clamp(Number(st.loopHole)|| 6.0, 1, 24),
    bevelMM:       clamp(Number(st.bevelMM)||0.3, 0.1, 0.8),
    border:        st.border === undefined ? true : !!st.border,
    borderWidthMM: clamp(Number(st.borderWidthMM)||2.0, 0.6, 6),
    borderRaiseMM: clamp(Number(st.borderRaiseMM)||1.0, 0.2, 4),
  };
  state.mode        = s.mode === "medal" ? "medal" : "badge";
  state.medalPreset = MEDAL_PRESETS[s.medalPreset] ? s.medalPreset : "pendant";
  syncPanel();
  if (typeof syncStlPanel === "function") syncStlPanel();
  if (typeof window.__syncModeUI === "function") window.__syncModeUI();
  render();
}
const num = v => clamp(Number(v)||0, -256, 256);
const safeColor = (v, fallback="#888888") => /^#[0-9a-fA-F]{3,8}$/.test(String(v)) ? v : fallback;

/* Strip anything executable from stored icon markup before re-injecting. */
function sanitizeSVGFragment(fragment){
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${fragment}</svg>`, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return "";
  svg.querySelectorAll("script,style,foreignObject,image,use").forEach(n=>n.remove());
  svg.querySelectorAll("*").forEach(n=>{
    [...n.attributes].forEach(a=>{
      if (/^on/i.test(a.name) || /javascript:|data:/i.test(a.value)) n.removeAttribute(a.name);
      if (a.name === "href" || a.name === "xlink:href") n.removeAttribute(a.name);
    });
  });
  return svg.innerHTML;
}

/* Push current state back into every panel control after an import. */
function syncPanel(){
  document.querySelectorAll(".shape-opt").forEach(b=>
    b.setAttribute("aria-pressed", b.dataset.shape===state.shape ? "true":"false"));
  document.getElementById("adv-scallops").checked = state.scallops;
  document.getElementById("adv-scallop-count").value = state.scallopCount;
  document.getElementById("adv-scallop-depth").value = state.scallopDepth;
  document.getElementById("adv-border-width").value = state.borderWidth;
  swatchGrid.querySelectorAll(".swatch").forEach(s=>
    s.setAttribute("aria-pressed", s.title===COLOR_PRESETS[state.preset].label ? "true":"false"));
  buildStopList();
  inputTitle.value = state.title.text;
  inputSubtitle.value = state.subtitle.text;
  document.getElementById("adv-title-size").value = state.title.size;
  document.getElementById("adv-title-color").value = state.title.color;
  document.getElementById("adv-subtitle-size").value = state.subtitle.size;
  document.getElementById("adv-subtitle-color").value = state.subtitle.color;
  document.getElementById("title-arch").value = state.title.arch;
  document.getElementById("title-arch-r").value = state.title.archRadius;
  document.getElementById("subtitle-arch").value = state.subtitle.arch;
  document.getElementById("subtitle-arch-r").value = state.subtitle.archRadius;
  const tb = document.getElementById("title-bevel"); if (tb) tb.checked = state.title.bevel !== false;
  const sb = document.getElementById("subtitle-bevel"); if (sb) sb.checked = state.subtitle.bevel !== false;
  // constrain toggles + size-input ranges (so unconstrained values re-show)
  [["title","adv-title-size","title-constrain",18,72],["subtitle","adv-subtitle-size","subtitle-constrain",10,40]].forEach(([k,sizeId,conId,lo,hi])=>{
    const con = state[k].constrain !== false;
    const cEl = document.getElementById(conId); if (cEl) cEl.checked = con;
    const sizeEl = document.getElementById(sizeId);
    if (sizeEl){ if (con){ sizeEl.min=lo; sizeEl.max=hi; } else { sizeEl.min=1; sizeEl.max=400; } sizeEl.value = state[k].size; }
  });
  syncTextPositionInputs();
  syncLevelButtons();
  buildPlacedLists();
}

/* =====================================================================
   8b. TINY ZIP WRITER (store method, no compression)
   =====================================================================
   The STL download is bundled as a .zip that also contains the editable
   .svg (the STL itself carries no design data, so it can't be re-opened;
   the SVG can). This writer is ~60 lines, needs no library and no network,
   so it keeps the app's "works fully offline" guarantee. Files are stored
   uncompressed (method 0) — an STL/SVG pair is tiny and this avoids
   pulling in a DEFLATE implementation.
   ===================================================================== */

/* CRC-32 (IEEE) with a lazily-built lookup table. */
const _crcTable = (()=>{
  const t = new Uint32Array(256);
  for (let n=0; n<256; n++){
    let c = n;
    for (let k=0; k<8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes){
  let c = 0xFFFFFFFF;
  for (let i=0; i<bytes.length; i++) c = _crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
/* Build a ZIP Blob from [{name, bytes:Uint8Array}]. Store method only. */
function makeZip(files){
  const enc = new TextEncoder();
  const chunks = [];       // body: local headers + data
  const central = [];      // central directory records
  let offset = 0;
  const u16 = v => { const b = new Uint8Array(2); b[0]=v&0xFF; b[1]=(v>>>8)&0xFF; return b; };
  const u32 = v => { const b = new Uint8Array(4); b[0]=v&0xFF; b[1]=(v>>>8)&0xFF; b[2]=(v>>>16)&0xFF; b[3]=(v>>>24)&0xFF; return b; };
  const push = (arr, b)=>{ arr.push(b); return b.length; };

  files.forEach(f=>{
    const nameBytes = enc.encode(f.name);
    const data = f.bytes;
    const crc = crc32(data);
    // local file header
    let n = 0;
    n += push(chunks, u32(0x04034b50));  // signature
    n += push(chunks, u16(20));          // version needed
    n += push(chunks, u16(0));           // flags
    n += push(chunks, u16(0));           // method: store
    n += push(chunks, u16(0));           // mod time
    n += push(chunks, u16(0x21));        // mod date (arbitrary valid date)
    n += push(chunks, u32(crc));
    n += push(chunks, u32(data.length)); // compressed size
    n += push(chunks, u32(data.length)); // uncompressed size
    n += push(chunks, u16(nameBytes.length));
    n += push(chunks, u16(0));           // extra len
    n += push(chunks, nameBytes);
    n += push(chunks, data);
    // central directory record
    const c = [];
    push(c, u32(0x02014b50));
    push(c, u16(20)); push(c, u16(20)); push(c, u16(0)); push(c, u16(0));
    push(c, u16(0)); push(c, u16(0x21));
    push(c, u32(crc));
    push(c, u32(data.length)); push(c, u32(data.length));
    push(c, u16(nameBytes.length)); push(c, u16(0)); push(c, u16(0));
    push(c, u16(0)); push(c, u16(0)); push(c, u32(0));
    push(c, u32(offset));
    push(c, nameBytes);
    central.push({ parts:c });
    offset += n;
  });

  const cdStart = offset;
  let cdSize = 0;
  central.forEach(rec=>{ rec.parts.forEach(p=>{ chunks.push(p); cdSize += p.length; }); });
  // end of central directory
  chunks.push(u32(0x06054b50));
  chunks.push(u16(0)); chunks.push(u16(0));
  chunks.push(u16(files.length)); chunks.push(u16(files.length));
  chunks.push(u32(cdSize)); chunks.push(u32(cdStart));
  chunks.push(u16(0));
  return new Blob(chunks, { type:"application/zip" });
}

/* =====================================================================
   9. STL EXPORT — relief medallion for 3D printing
   =====================================================================
   Pipeline (deliberately NOT the SVGLoader route):

   THREE.SVGLoader ignores <text> and <textPath> entirely, so feeding it
   the export SVG would produce a medallion with a blank face — the whole
   point of the badge (its lettering) would vanish. Instead we let the
   browser render the export SVG (which draws text, stroke icons, filled
   icons and raster uploads all correctly) to a high-resolution canvas,
   turn the face content into a binary mask, trace that mask into polygon
   contours (marching squares + hole nesting), and extrude those contours
   as the raised relief. The base plate and hanging loop are built from
   the true outline geometry so their edges stay crisp.

   Consequences of this choice (documented for honesty):
   • Every visible element becomes relief — stroke-only library icons and
     raster images now WORK rather than being skipped. The brief allowed
     skipping them; tracing pixels gets them for free.
   • Relief edges are polygonised from pixels, so at low trace resolution
     fine serifs can look slightly stepped. We trace at high res and
     simplify, which keeps glyphs clean at a 50 mm medallion size.
   • Colours/gradients are irrelevant in 3D: we extrude by opacity/area.

   three.js + STLExporter load on demand the first time STL is used, so
   PNG/JPG/SVG stay 100% offline. Everything lives in state so it
   round-trips through exported/imported SVGs.
   ===================================================================== */

/* ---- tunables (safe to edit) -------------------------------------- */
const STL_MEDALLION_MM   = 50;     // DEFAULT printed diameter (mm); user-adjustable in the STL settings
const STL_TRACE_RES      = 1400;   // px per side of the mask canvas (higher = crisper relief, slower)
const STL_ALPHA_CUTOFF   = 40;     // 0–255: opacity above this counts as "solid" relief
const STL_SIMPLIFY_EPS   = 0.8;    // Douglas–Peucker tolerance in mask pixels
const STL_MIN_CONTOUR    = 12;     // drop traced islands with fewer points than this (noise)
const STL_CURVE_SEGMENTS = 64;     // torus/loop smoothness
const STL_STROKE_FATTEN  = 6;      // stroke width (icon-local units) applied to stroke-only art so it prints
const STL_DILATE_PX      = 2;      // grow the mask by this many px so thin glyphs/strokes stay printable (0 = off)
const STL_NOZZLE_MM      = 0.4;    // printer nozzle diameter; features narrower than this can't print
const STL_MIN_FEATURE_MM = STL_NOZZLE_MM; // a raised feature must be at least this wide to survive

/* mm-per-SVG-unit: the badge spans 2*R_OUT (=488) units across its outer
   points; map that to the CURRENT requested medallion size. Read live so
   the size control takes effect without touching constants elsewhere.  */
function mmPerUnit(){
  const mm = (state.stl && state.stl.medallionMM) || STL_MEDALLION_MM;
  return mm / (2 * R_OUT);
}

/* STL config lives in state (added in the state patch). Defaults in mm. */
function ensureStlState(){
  if (!state.stl){
    state.stl = {
      medallionMM:   STL_MEDALLION_MM, // overall printed diameter (mm)
      baseThickness: 3.0,   // mm
      raiseHeight:   1.0,   // mm  (negative => engraved, allowed)
      loop:          true,
      loopOuter:     12.0,  // mm outer diameter of the bail
      loopHole:      6.0,   // mm hole diameter
      bevelMM:       0.3,   // global bevel size in mm (per-text on/off lives on title/subtitle)
      border:        true,  // raised inner frame ring (on by default)
      borderWidthMM: 2.0,   // thickness of the border ring band
      borderRaiseMM: 1.0,   // how high the border sits above the base
    };
  }
  if (state.stl.medallionMM === undefined) state.stl.medallionMM = STL_MEDALLION_MM;
  // back-fill new fields on designs saved before they existed
  const d = state.stl;
  if (d.bevelMM === undefined)       d.bevelMM = 0.3;
  if (d.border === undefined)        d.border = true;
  if (d.borderWidthMM === undefined) d.borderWidthMM = 2.0;
  if (d.borderRaiseMM === undefined) d.borderRaiseMM = 1.0;
  return state.stl;
}

/* three.js loads once, on demand. Uses the artifact-allowed CDN. */
let _threePromise = null;
function loadThree(){
  if (_threePromise) return _threePromise;
  _threePromise = (async ()=>{
    // jsdelivr's /+esm endpoints ship browser-ready ESM with the addons'
    // bare `from 'three'` specifiers already resolved, so no import map is
    // needed when loading from a plain <script>.
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/+esm");
    const { STLExporter } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/exporters/STLExporter.js/+esm");
    const { mergeGeometries } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js/+esm");
    return { THREE, STLExporter, mergeGeometries };
  })();
  return _threePromise;
}

/* ---- 1. render the export SVG to an alpha mask --------------------
   Returns { data:Uint8Array(res*res) of 0/1, res }.  We render the
   FACE CONTENT ONLY (text + icons + decorations), not the coloured
   base plate, because the base is built separately from true geometry.

   `select` controls WHICH content survives, so the caller can trace the
   text and the non-text (icons/decorations) into SEPARATE masks — this
   is what lets text be bevelled while icons/laurels stay flat:
     • "all"      — everything (default)
     • {textRoles:[...]} — only <text> whose data-bm-role is in the list
     • "nontext"  — everything EXCEPT text                                */
function reliefSVGText(select="all"){
  const full = badgeSVG({forExport:true});
  const doc = new DOMParser().parseFromString(full, "image/svg+xml");
  const svg = doc.querySelector("svg");

  // --- content selection: drop the categories we don't want in this mask
  if (select === "nontext"){
    svg.querySelectorAll('text[data-bm-role]').forEach(t=>t.remove());
  } else if (select && select.textRoles){
    // keep only the listed text roles; remove all other text
    svg.querySelectorAll('text[data-bm-role]').forEach(t=>{
      if (!select.textRoles.includes(t.getAttribute("data-bm-role"))) t.remove();
    });
    // and remove every non-text relief element (icons, decorations)
    // — anything that isn't one of our kept text nodes or structural.
    svg.querySelectorAll('g').forEach(g=>g.remove());   // icon/decor groups
  }

  // 1. Remove the base-plate visuals: any path painted with the badge
  //    body gradients, or the rim/face outlines (fill:none strokes), plus
  //    the shine ellipse. These are the medallion body, built separately.
  svg.querySelectorAll("path").forEach(p=>{
    const f = p.getAttribute("fill") || "";
    const s = p.getAttribute("stroke") || "";
    if (/url\(#bm-(grad|metal|face)\)/.test(f)) p.remove();
    else if (f === "none" && /url\(#bm-grad\)|#ffffff/.test(s)) p.remove(); // rim/face outline strokes
  });
  svg.querySelectorAll("ellipse").forEach(e=>e.remove());

  // 2. Remove the invisible arched-text GUIDE paths (the semicircle a
  //    <textPath> rides on). They live in <defs> and must never relief —
  //    this is the stray line seen in prints when a title/subtitle arches.
  svg.querySelectorAll('path[id^="bm-arc-"]').forEach(p=>p.remove());

  // 2b. Remove the positioning-grid group outright. badgeSVG omits it for
  //     export already, but strip it here too so the axis lines can NEVER
  //     leak into the relief even if that changes — this was the stray
  //     vertical Y-axis mark seen in early prints.
  svg.querySelectorAll('.bm-grid, [class="bm-grid"]').forEach(g=>g.remove());
  svg.querySelectorAll('line').forEach(l=>l.remove()); // grid is the only line art

  // 3. Neutralise the gradients: redefine them (and the metal/face defs)
  //    as flat black so ANY element still referencing url(#bm-grad) —
  //    including group fills on filled decorations like the sparkle —
  //    paints solid black instead of a sampled colour.
  const defs = svg.querySelector("defs");
  if (defs){
    defs.innerHTML =
      '<linearGradient id="bm-grad"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#000"/></linearGradient>' +
      '<linearGradient id="bm-metal"><stop offset="0%" stop-color="#000"/></linearGradient>' +
      '<radialGradient id="bm-face"><stop offset="0%" stop-color="#000"/></radialGradient>' +
      '<radialGradient id="bm-shine"><stop offset="0%" stop-color="#000" stop-opacity="0"/></radialGradient>';
  }

  // 4. Belt-and-braces: force every element's own explicit paint to solid
  //    black (opaque), on groups and leaves alike, so nothing renders as a
  //    thin coloured hairline. Fills that were "none" stay none (outlines).
  //    Also FATTEN strokes: a hairline stroke has ~zero printable width, so
  //    we widen every stroke and round its joins/caps. This is what lets
  //    stroke-based library icons and decorations survive as real relief.
  svg.querySelectorAll("*").forEach(n=>{
    const f = n.getAttribute("fill");
    const s = n.getAttribute("stroke");
    if (f && f !== "none") n.setAttribute("fill", "#000");
    if (s && s !== "none"){
      n.setAttribute("stroke", "#000");
      n.setAttribute("stroke-width", String(STL_STROKE_FATTEN));
      n.setAttribute("stroke-linecap", "round");
      n.setAttribute("stroke-linejoin", "round");
    }
    n.removeAttribute("fill-opacity");
    n.removeAttribute("stroke-opacity");
    n.removeAttribute("opacity");
  });

  return new XMLSerializer().serializeToString(svg);
}

/* Morphological dilation: grow solid regions by `r` pixels so thin glyph
   stems and stroke art don't fall below a printable width. Fast separable
   two-pass (horizontal then vertical) grow.                             */
function dilateMask(mask, res, r){
  if (!r || r < 1) return mask;
  r = Math.round(r);
  const tmp = new Uint8Array(res*res);
  for (let y=0; y<res; y++){
    const row = y*res;
    for (let x=0; x<res; x++){
      let on = 0;
      for (let dx=-r; dx<=r; dx++){
        const xx = x+dx;
        if (xx>=0 && xx<res && mask[row+xx]){ on = 1; break; }
      }
      tmp[row+x] = on;
    }
  }
  const out = new Uint8Array(res*res);
  for (let x=0; x<res; x++){
    for (let y=0; y<res; y++){
      let on = 0;
      for (let dy=-r; dy<=r; dy++){
        const yy = y+dy;
        if (yy>=0 && yy<res && tmp[yy*res+x]){ on = 1; break; }
      }
      out[y*res+x] = on;
    }
  }
  return out;
}

function renderMask(select="all"){
  return new Promise((resolve, reject)=>{
    const svgText = reliefSVGText(select);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText], {type:"image/svg+xml"}));
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      const res = STL_TRACE_RES;
      const c = document.createElement("canvas");
      c.width = c.height = res;
      const ctx = c.getContext("2d");
      ctx.clearRect(0,0,res,res);
      ctx.drawImage(img, 0, 0, res, res);
      let px;
      try { px = ctx.getImageData(0,0,res,res).data; }
      catch(e){ return reject(new Error("tainted-canvas")); }
      const mask = new Uint8Array(res*res);
      for (let i=0, p=3; i<mask.length; i++, p+=4){
        mask[i] = px[p] > STL_ALPHA_CUTOFF ? 1 : 0;
      }
      resolve({ data: dilateMask(mask, res, STL_DILATE_PX), res });
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error("svg-render-failed")); };
    img.src = url;
  });
}

/* ---- 2. marching-squares contour tracing --------------------------
   Moore-neighbour boundary tracing over the binary mask. Returns an
   array of rings (each an array of {x,y} in mask-pixel space). Outer
   rings are CCW, holes CW — THREE.Shape/holes handles nesting after we
   classify by containment.                                            */
function traceContours(mask, res){
  const at = (x,y)=> (x<0||y<0||x>=res||y>=res) ? 0 : mask[y*res+x];
  const visited = new Uint8Array(res*res);
  const rings = [];

  // 8-neighbour offsets clockwise starting from "west"
  const NB = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]];

  for (let y=0; y<res; y++){
    for (let x=0; x<res; x++){
      // start of an unvisited boundary: solid pixel with empty to the left
      if (at(x,y) && !at(x-1,y) && !visited[y*res+x]){
        const ring = mooreTrace(x, y, at, res, visited);
        if (ring.length >= STL_MIN_CONTOUR) rings.push(ring);
      }
    }
  }
  return rings;
}

function mooreTrace(sx, sy, at, res, visited){
  const ring = [];
  // Moore boundary tracing
  let cx = sx, cy = sy;
  let bx = sx-1, by = sy; // we came from the west (background)
  const start = sx+","+sy;
  let steps = 0, max = res*res*4;
  const NB = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]];
  do{
    ring.push({x:cx, y:cy});
    visited[cy*res+cx] = 1;
    // direction index from current pixel to the background pixel we came from
    let dx = bx-cx, dy = by-cy;
    let dir = NB.findIndex(d=>d[0]===dx && d[1]===dy);
    // scan clockwise from the backtrack direction for the next solid pixel
    let found = false;
    for (let k=1; k<=8; k++){
      const nd = NB[(dir+k)%8];
      const nx = cx+nd[0], ny = cy+nd[1];
      if (at(nx,ny)){
        // the background pixel just before this one becomes new backtrack
        const pd = NB[(dir+k-1+8)%8];
        bx = cx+pd[0]; by = cy+pd[1];
        cx = nx; cy = ny;
        found = true;
        break;
      }
    }
    if (!found) break;               // isolated pixel
    if (++steps > max) break;        // safety
  } while (!(cx===sx && cy===sy));
  return ring;
}

/* Douglas–Peucker simplification to cut vertex count without losing shape. */
function simplify(points, eps){
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length-1] = 1;
  const stack = [[0, points.length-1]];
  while (stack.length){
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const ax = points[a].x, ay = points[a].y, bx = points[b].x, by = points[b].y;
    const dx = bx-ax, dy = by-ay;
    const len2 = dx*dx+dy*dy || 1;
    for (let i=a+1; i<b; i++){
      const t = ((points[i].x-ax)*dx + (points[i].y-ay)*dy)/len2;
      const px = ax+t*dx, py = ay+t*dy;
      const d = Math.hypot(points[i].x-px, points[i].y-py);
      if (d > maxD){ maxD = d; idx = i; }
    }
    if (maxD > eps && idx !== -1){
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out = [];
  for (let i=0; i<points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

function pointInRing(pt, ring){
  let inside = false;
  for (let i=0, j=ring.length-1; i<ring.length; j=i++){
    const xi=ring[i].x, yi=ring[i].y, xj=ring[j].x, yj=ring[j].y;
    if (((yi>pt.y)!==(yj>pt.y)) && (pt.x < (xj-xi)*(pt.y-yi)/(yj-yi)+xi)) inside = !inside;
  }
  return inside;
}

/* polygon area (shoelace) and perimeter in the given point space. */
function polyArea(ring){
  let a = 0;
  for (let i=0,n=ring.length; i<n; i++){ const p=ring[i], q=ring[(i+1)%n]; a += p.x*q.y - q.x*p.y; }
  return Math.abs(a/2);
}
function polyPerim(ring){
  let L = 0;
  for (let i=0,n=ring.length; i<n; i++){ const p=ring[i], q=ring[(i+1)%n]; L += Math.hypot(q.x-p.x, q.y-p.y); }
  return L;
}
/* Hydraulic width (2·area/perimeter) is a good proxy for the mean
   thickness of a ribbon/stroke/glyph-stem: a long thin stroke has a
   small value, a chunky letter a large one. Computed in mm.          */
function featureWidthMM(outerRing, holeRings){
  const k = mmPerUnit() * (512/STL_TRACE_RES); // mask-px → mm
  let area = polyArea(outerRing);
  let perim = polyPerim(outerRing);
  holeRings.forEach(h=>{ area -= polyArea(h); perim += polyPerim(h); });
  if (perim <= 0) return 0;
  const widthPx = 2*area/perim;
  return widthPx * k;
}

/* Convert traced rings (mask space) into THREE.Shape[] with holes.
   Mask pixel (mx,my) → SVG unit (sx,sy) → medallion mm (X,Y).
   SVG y is down; medallion +Y is up, so flip.
   Returns { shapes, widths } where widths[i] is the mm width of shapes[i];
   if `dropBelow` is set, features narrower than it are omitted entirely. */
function ringsToShapes(THREE, rings, res, dropBelow=0){
  const toMM = (p)=>{
    const sx = p.x / res * 512;         // mask px → SVG units (0..512)
    const sy = p.y / res * 512;
    const X = (sx - CX) * mmPerUnit();   // centre-origin, mm
    const Y = (CY - sy) * mmPerUnit();   // flip y
    return new THREE.Vector2(X, Y);
  };
  const simplified = rings.map(r=>simplify(r, STL_SIMPLIFY_EPS)).filter(r=>r.length>=3);
  const depths = simplified.map(r=>
    simplified.reduce((d,other)=> other!==r && pointInRing(r[0], other) ? d+1 : d, 0));

  const shapes = [], widths = [];
  simplified.forEach((ring, i)=>{
    if (depths[i] % 2 !== 0) return;                 // holes handled below
    const myHoles = simplified.filter((h,j)=>
      depths[j] % 2 === 1 && depths[j] === depths[i] + 1 && pointInRing(h[0], ring));
    const w = featureWidthMM(ring, myHoles);
    if (dropBelow && w < dropBelow) return;          // too thin to print — omit
    const shape = new THREE.Shape(ring.map(toMM));
    myHoles.forEach(h=> shape.holes.push(new THREE.Path(h.map(toMM))));
    shapes.push(shape);
    widths.push(w);
  });
  return { shapes, widths };
}

/* ---- 3. base-plate + loop geometry from true outline -------------- */
/* Sample the shape outline at radius R (SVG units) as an array of mm
   Vector2s. `scallop` toggles the wavy edge (base uses it; the border
   frame is smooth).                                                    */
function outlinePointsMM(THREE, R, scallop){
  const N = 240;
  const pts = [];
  for (let i=0; i<N; i++){
    const t = i/N;
    const p = outlinePoint(state.shape, t, R);
    let x = p.x, y = p.y;
    if (scallop){
      const wave = state.scallopDepth * Math.cos(t * Math.PI*2 * state.scallopCount);
      x += p.nx*wave; y += p.ny*wave;
    }
    pts.push(new THREE.Vector2((x - CX) * mmPerUnit(), (CY - y) * mmPerUnit()));
  }
  return pts;
}

/* Build a THREE.Shape of the badge outer outline (with scallops).      */
function baseShape(THREE){
  return new THREE.Shape(outlinePointsMM(THREE, R_OUT, state.scallops));
}

/* Raised inner border ring — a smooth frame that follows the shape,
   inset from the outline, extruded on top of the base. Prints as one
   fused body with the plate. Widths/heights are configurable (mm).    */
function borderGeometry(THREE, ExtrudeGeo){
  const cfg = state.stl;
  const mmU = mmPerUnit();
  // inset the frame in from the outer edge; band width & inset in mm→units
  const insetUnits = (state.borderWidth * 0.5) + (state.scallops ? state.scallopDepth : 0) + 8;
  const bandUnits  = cfg.borderWidthMM / mmU;
  const rOuter = R_OUT - insetUnits;
  const rInner = rOuter - bandUnits;
  if (rInner <= 20) return new THREE.BufferGeometry(); // too small to bother
  const outer = new THREE.Shape(outlinePointsMM(THREE, rOuter, false));
  const holePts = outlinePointsMM(THREE, rInner, false).reverse(); // hole winds opposite
  outer.holes.push(new THREE.Path(holePts));
  const raise = Math.max(0.2, cfg.borderRaiseMM);
  const geo = new ExtrudeGeo(outer, { depth: raise, bevelEnabled:false, curveSegments: STL_CURVE_SEGMENTS });
  geo.translate(0, 0, cfg.baseThickness);   // sit on the base top face
  return geo;
}

/* Topmost outline point (in mm) for the current shape, so the loop
   sits correctly on circle/square/pentagon/hexagon.                   */
function topOutlineMM(){
  const N = 480;
  let topY = -Infinity, topX = 0;
  for (let i=0; i<N; i++){
    const t = i/N;
    const p = outlinePoint(state.shape, t, R_OUT);
    let x = p.x, y = p.y;
    if (state.scallops){
      const wave = state.scallopDepth * Math.cos(t * Math.PI*2 * state.scallopCount);
      x += p.nx*wave; y += p.ny*wave;
    }
    const Y = (CY - y) * mmPerUnit();
    if (Y > topY){ topY = Y; topX = (x - CX) * mmPerUnit(); }
  }
  return { x:topX, y:topY };
}

/* Coplanar ring (bail) as a 2D shape-with-hole, extruded to loop
   thickness, then positioned so it overlaps the top edge and fuses
   with the base plate into one watertight-enough body for slicing.    */
function loopGeometry(THREE, ExtrudeGeo){
  const cfg = state.stl;
  const rO = cfg.loopOuter/2, rH = cfg.loopHole/2;
  const top = topOutlineMM();
  // centre the ring just above the top edge, overlapping by ~30% so it
  // fuses with the plate (no floating bail).
  const cx = top.x;
  const cy = top.y + rO*0.7;      // overlap into the plate
  const ring = new THREE.Shape();
  ring.absarc(cx, cy, rO, 0, Math.PI*2, false);
  const hole = new THREE.Path();
  hole.absarc(cx, cy, rH, 0, Math.PI*2, true);
  ring.holes.push(hole);
  const geo = new ExtrudeGeo(ring, {
    depth: cfg.baseThickness, bevelEnabled:false, curveSegments: STL_CURVE_SEGMENTS,
  });
  return geo; // sits z:0..baseThickness, same as base
}

/* ---- 4. assemble the medallion ------------------------------------ */
async function buildMedallionGeometry(){
  const { THREE, mergeGeometries } = await loadThree();
  const { ExtrudeGeometry } = THREE;
  const cfg = ensureStlState();
  const parts = [];

  // Bevel only applies in 3D (medal) mode and only to TEXT, per each
  // text's own toggle. Icons, laurels, sparkle, etc. always extrude flat.
  const medal = state.mode === "medal";
  const absRaise = Math.abs(cfg.raiseHeight);
  const raise = cfg.raiseHeight;
  const globalBevel = (medal && cfg.bevelMM > 0)
    ? Math.min(cfg.bevelMM, Math.max(0, absRaise - 0.05)) : 0;
  const bevelRoles = [];
  const flatRoles  = [];
  if (medal){
    if (state.title.text)    (state.title.bevel    ? bevelRoles : flatRoles).push("title");
    if (state.subtitle.text) (state.subtitle.bevel ? bevelRoles : flatRoles).push("subtitle");
  }

  // (a) base plate
  parts.push(new ExtrudeGeometry(baseShape(THREE), {
    depth: cfg.baseThickness, bevelEnabled:false, curveSegments: STL_CURVE_SEGMENTS }));
  // (b) hanging loop
  if (cfg.loop) parts.push(loopGeometry(THREE, ExtrudeGeometry));
  // (b2) inner border frame
  if (cfg.border) parts.push(borderGeometry(THREE, ExtrudeGeometry));

  const minFeature = STL_MIN_FEATURE_MM;
  let reliefShapeCount = 0, contourCount = 0, thinDropped = 0;
  let thinnestKept = null;

  // Trace one mask (a content subset) and extrude its shapes, optionally
  // bevelled. Accumulates into `parts` and the running tallies.
  async function addRelief(select, bevelOn){
    if (raise === 0) return;
    const { data, res } = await renderMask(select);
    // skip if the mask is empty (nothing of this category present)
    let any = false; for (let i=0;i<data.length;i++){ if (data[i]){ any = true; break; } }
    if (!any) return;
    const rings = traceContours(data, res);
    contourCount += rings.length;
    const measured = ringsToShapes(THREE, rings, res, 0);
    measured.widths.forEach(w=>{
      if (w < minFeature) thinDropped++;
      else thinnestKept = thinnestKept===null ? w : Math.min(thinnestKept, w);
    });
    const { shapes, widths } = ringsToShapes(THREE, rings, res, minFeature);
    reliefShapeCount += shapes.length;
    shapes.forEach((shape, i)=>{
      const wCap = Math.max(0, widths[i]*0.45);
      const b = bevelOn && globalBevel > 0
        ? Math.min(globalBevel, Math.max(0, absRaise - 0.05), wCap) : 0;
      const opts = b > 0.02
        ? { depth: Math.max(0.05, absRaise - b), bevelEnabled:true,
            bevelThickness:b, bevelSize:b, bevelSegments:2, curveSegments:8 }
        : { depth: absRaise, bevelEnabled:false, curveSegments:8 };
      const g = new ExtrudeGeometry(shape, opts);
      g.translate(0, 0, raise > 0 ? cfg.baseThickness : cfg.baseThickness - absRaise);
      parts.push(g);
    });
  }

  // (c) relief, split so text can bevel while icons/decorations stay flat.
  if (medal){
    await addRelief("nontext", false);                       // icons/decor: flat
    if (bevelRoles.length) await addRelief({textRoles:bevelRoles}, true);  // bevelled text
    if (flatRoles.length)  await addRelief({textRoles:flatRoles},  false); // un-bevelled text
  } else {
    await addRelief("all", false);                           // badge mode: all flat
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return {
    THREE, geometry: merged,
    reliefShapeCount, contourCount, thinDropped,
    thinnestKeptMM: thinnestKept,
    bevelApplied: globalBevel,
  };
}

async function makeSTL(){
  const { THREE, STLExporter, mergeGeometries } = await loadThree();
  const { geometry, reliefShapeCount, contourCount, thinDropped, thinnestKeptMM } = await buildMedallionGeometry();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const exporter = new STLExporter();
  const stlString = exporter.parse(mesh, { binary:false });
  const triangles = geometry.index
    ? geometry.index.count/3
    : geometry.attributes.position.count/3;
  const blob = new Blob([stlString], {type:"model/stl"});
  return { blob, triangles, reliefShapeCount, contourCount, thinDropped, thinnestKeptMM };
}

/* Push STL state back into the panel inputs (after an import/undo). */
function syncStlPanel(){
  const cfg = state.stl; if (!cfg) return;
  const set = (id, v)=>{ const el = document.getElementById(id); if (el) el.value = v; };
  set("stl-size", cfg.medallionMM);
  set("stl-base", cfg.baseThickness);
  set("stl-raise", cfg.raiseHeight);
  set("stl-loop-outer", cfg.loopOuter);
  set("stl-loop-hole", cfg.loopHole);
  set("stl-bevel-mm", cfg.bevelMM);
  set("stl-border-mm", cfg.borderWidthMM);
  const lt = document.getElementById("stl-loop"); if (lt) lt.checked = cfg.loop;
  const bd = document.getElementById("stl-border"); if (bd) bd.checked = cfg.border;
}

/* ---- 5. wire up the STL card -------------------------------------- */
(function initStlCard(){
  ensureStlState();
  const cfg = state.stl;

  // bind the config inputs
  const bindStl = (id, key, lo, hi)=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.value = cfg[key];
    el.addEventListener("input", ()=>{
      const v = Number(el.value);
      if (!Number.isNaN(v)) cfg[key] = clamp(v, lo, hi);
      snapshot();
    });
  };
  bindStl("stl-size",  "medallionMM",   20, 150);
  bindStl("stl-base",  "baseThickness", 0.6, 12);
  bindStl("stl-raise", "raiseHeight",  -4,   6);
  bindStl("stl-loop-outer", "loopOuter", 4, 30);
  bindStl("stl-loop-hole",  "loopHole",  1, 24);
  bindStl("stl-bevel-mm",   "bevelMM",   0.1, 0.8);
  bindStl("stl-border-mm",  "borderWidthMM", 0.6, 6);

  const loopToggle = document.getElementById("stl-loop");
  if (loopToggle){
    loopToggle.checked = cfg.loop;
    loopToggle.addEventListener("change", ()=>{ cfg.loop = loopToggle.checked; snapshot(); });
  }
  const borderToggle = document.getElementById("stl-border");
  if (borderToggle){
    borderToggle.checked = cfg.border;
    borderToggle.addEventListener("change", ()=>{ cfg.border = borderToggle.checked; snapshot(); if (!exportBackdrop.hidden) refreshSTL(); });
  }

  const pill  = document.getElementById("size-stl");
  const warn  = document.getElementById("stl-warn");
  const btn   = document.getElementById("btn-dl-stl");
  let stlBlob = null;

  async function refreshSTL(){
    if (!btn) return;
    pill.textContent = "building…";
    pill.classList.remove("over");
    warn.textContent = "";
    stlBlob = null;
    btn.disabled = true;
    try{
      const notes = [];
      if (state.icons.some(i=>i.isImage))
        notes.push("uploaded images become flat raised silhouettes (no photo detail)");
      if (cfg.raiseHeight > 0 && cfg.raiseHeight < 0.4)
        notes.push("raise height is below 0.4 mm, so raised features may not print distinctly");

      const { blob, triangles, reliefShapeCount, thinDropped, thinnestKeptMM } = await makeSTL();
      stlBlob = blob;
      const kb = blob.size/1024;
      pill.textContent = `${triangles.toLocaleString()} tris · ${kb.toFixed(0)} KB`;

      // Real printability check: features measured below the nozzle width
      // were dropped from the model rather than sliced into broken lumps.
      if (thinDropped > 0){
        notes.unshift(`${thinDropped} fine feature${thinDropped>1?"s were":" was"} too thin to print at ${cfg.medallionMM} mm and ${thinDropped>1?"were":"was"} left off — small text like a subtitle is the usual cause. Increase the medallion size or shorten/enlarge that text to keep ${thinDropped>1?"them":"it"}.`);
      } else if (thinnestKeptMM !== null && thinnestKeptMM < STL_NOZZLE_MM * 1.5){
        notes.push(`the finest feature is about ${thinnestKeptMM.toFixed(2)} mm wide — close to the ${STL_NOZZLE_MM} mm nozzle limit, so it may print faintly. A larger medallion prints more reliably.`);
      }
      if (reliefShapeCount === 0)
        notes.unshift("no printable relief was detected — the medallion will be a plain plate. Add text or icons, or increase the medallion size.");

      warn.textContent = notes.length ? "Note: " + notes.join(" ") : "";
      btn.disabled = false;
    }catch(err){
      pill.textContent = "unavailable";
      warn.textContent = err.message === "tainted-canvas"
        ? "The 3D preview needs to read the badge pixels, which this browser blocked (a tainted-canvas security restriction, sometimes caused by an embedded image). Try removing uploaded images, or use a different browser."
        : "Couldn't build the 3D model — three.js may have failed to load (it needs a one-time internet connection). PNG/JPG/SVG still work offline.";
    }
  }

  // build STL sizing when the export modal opens (alongside PNG/JPG/SVG)
  window.__refreshSTL = refreshSTL;
  const exportBtn = document.getElementById("btn-export");
  if (exportBtn) exportBtn.addEventListener("click", ()=>{ if (state.title.text.trim()) refreshSTL(); });
  // rebuild when a control changes while the modal is open
  ["stl-size","stl-base","stl-raise","stl-loop","stl-loop-outer","stl-loop-hole","stl-bevel-mm","stl-border-mm"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", ()=>{ if (!exportBackdrop.hidden) refreshSTL(); });
  });

  if (btn) btn.addEventListener("click", async ()=>{
    if (!stlBlob){
      btn.disabled = true;
      try { stlBlob = (await makeSTL()).blob; } catch { return; } finally { btn.disabled = false; }
    }
    // Bundle the STL together with the editable SVG. The STL is geometry
    // only and can't be re-opened here; the SVG carries the full design in
    // its metadata, so pairing them means the download is both printable
    // AND re-importable for future edits. A short README explains the two.
    try{
      const stem = fileStem();
      const enc  = new TextEncoder();
      const stlBytes = new Uint8Array(await stlBlob.arrayBuffer());
      const svgBytes = enc.encode(exportSVGText());
      const readme =
`${stem} — CasBadge 3D medal export
================================================

This zip contains two files:

  • ${stem}.stl  — the 3D model. Send this to your slicer
                   (Cura, PrusaSlicer, Bambu Studio, …) and print it.
                   The STL is geometry only: it holds no colours and no
                   editable design data.

  • ${stem}.svg  — the editable design. Open CasBadge and use
                   “⬆ Import badge” to re-open THIS file and change the
                   text, icons, size or 3D settings, then re-export.
                   (The .stl cannot be re-imported — always keep this .svg
                   if you may want to edit the medal later.)

Nothing is stored by the app, so this .svg is your save file.
`;
      const zip = makeZip([
        { name: stem + ".stl", bytes: stlBytes },
        { name: stem + ".svg", bytes: svgBytes },
        { name: "README.txt",  bytes: enc.encode(readme) },
      ]);
      download(zip, stem + "-medal.zip");
    }catch(err){
      // if zipping ever fails, fall back to the plain STL so the user
      // still gets their printable model.
      download(stlBlob, fileStem()+".stl");
    }
  });
})();


/* =====================================================================
   7c. DESIGN MODE — Badge (screen/Moodle) vs Medal (3D-print)
   ===================================================================== */
(function initModeSwitch(){
  ensureStlState();
  const badgeBtn  = document.getElementById("mode-badge");
  const medalBtn  = document.getElementById("mode-medal");
  const presetRow = document.getElementById("medal-preset-row");
  const presetBtns= document.getElementById("preset-btns");
  if (!badgeBtn || !medalBtn) return;

  // build preset buttons from MEDAL_PRESETS
  Object.entries(MEDAL_PRESETS).forEach(([key,p])=>{
    const b = document.createElement("button");
    b.className = "preset-btn";
    b.dataset.preset = key;
    b.textContent = `${p.label} · ${p.medallionMM}mm`;
    b.setAttribute("aria-pressed", key===state.medalPreset ? "true":"false");
    b.addEventListener("click", ()=>{ applyPreset(key); });
    presetBtns.appendChild(b);
  });

  // shape-card heading: reflect the preset in 3D mode so users know what
  // they're shaping ("Keyring shape" etc.); plain "Badge shape" otherwise.
  const shapeHeading = document.querySelector("#card-shape .card-head h2");
  function updateShapeCardTitle(){
    if (!shapeHeading) return;
    const label = state.mode === "medal" && MEDAL_PRESETS[state.medalPreset]
      ? `${MEDAL_PRESETS[state.medalPreset].label} shape`
      : "Badge shape";
    shapeHeading.innerHTML = `<span class="step">1</span> ${label}`;
  }

  function applyPreset(key){
    const p = MEDAL_PRESETS[key]; if (!p) return;
    state.medalPreset = key;
    Object.assign(state.stl, {
      medallionMM:p.medallionMM, baseThickness:p.baseThickness,
      raiseHeight:p.raiseHeight, loop:p.loop, loopOuter:p.loopOuter, loopHole:p.loopHole,
      bevelMM:p.bevelMM !== undefined ? p.bevelMM : state.stl.bevelMM,
    });
    presetBtns.querySelectorAll(".preset-btn").forEach(b=>
      b.setAttribute("aria-pressed", b.dataset.preset===key ? "true":"false"));
    if (typeof syncStlPanel === "function") syncStlPanel();
    updateShapeCardTitle();
    render();          // floors are size-driven, so re-fit text to the new scale
    snapshot();
  }

  function setMode(mode){
    const wasBadge = state.mode !== "medal";
    state.mode = mode;
    badgeBtn.setAttribute("aria-pressed", mode==="badge" ? "true":"false");
    medalBtn.setAttribute("aria-pressed", mode==="medal" ? "true":"false");
    presetRow.hidden = mode !== "medal";
    document.body.dataset.mode = mode;   // drives medal-only / colour-hidden CSS
    if (mode==="medal"){
      if (wasBadge) scaleDecorationsForMedal();   // one-time bump on entering 3D
      applyPreset(state.medalPreset || "pendant");
      buildPlacedLists();                         // reflect new scales/positions
    } else {
      updateShapeCardTitle(); render(); snapshot();
    }
  }

  badgeBtn.addEventListener("click", ()=>setMode("badge"));
  medalBtn.addEventListener("click", ()=>setMode("medal"));

  // expose for import/undo to reflect restored mode into the UI
  window.__syncModeUI = ()=>{
    badgeBtn.setAttribute("aria-pressed", state.mode==="badge" ? "true":"false");
    medalBtn.setAttribute("aria-pressed", state.mode==="medal" ? "true":"false");
    presetRow.hidden = state.mode !== "medal";
    document.body.dataset.mode = state.mode;
    presetBtns.querySelectorAll(".preset-btn").forEach(b=>
      b.setAttribute("aria-pressed", b.dataset.preset===state.medalPreset ? "true":"false"));
    updateShapeCardTitle();
  };
  // initialise body mode attribute on load
  document.body.dataset.mode = state.mode;
  updateShapeCardTitle();
})();


/* =====================================================================
   8. FIRST PAINT — a friendly starting badge
   ===================================================================== */
(function seed(){
  // a starter layout echoing the CPD Day badge: icons row + laurels + sparkle
  ["laurel-left","laurel-right","sparkle"].forEach(id=>{
    state.decorations.push({ uid:uid(), decorId:id, ...DECOR_DEFAULTS.circle[id], color:null, constrain:true });
  });
  buildPlacedLists();
  render();
  // Text fitting relies on measureText, which needs the web fonts (Sora,
  // Inter) loaded to be pixel-accurate. Re-render once they're ready so
  // the first paint corrects any fallback-font mismeasurement.
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(()=>{
      restoring = true;                 // don't create an undo step for this
      try { render(); } finally { restoring = false; }
    });
  }
})();