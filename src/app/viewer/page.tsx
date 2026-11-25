/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import Link from 'next/link';
import { AdvancedBook3D, createEditorialCoverDataUrl } from '@/components/3d/AdvancedBook3D';
import { RealisticPlantPot3D } from '@/components/3d/RealisticPlantPot3D';
import { RealisticSmallFlowerPot3D } from '@/components/3d/RealisticSmallFlowerPot3D';
import { RealisticTallBananaPlant3D } from '@/components/3d/RealisticTallBananaPlant3D';
import { RealisticTallFiddleFig3D } from '@/components/3d/RealisticTallFiddleFig3D';
import { RealisticLamp3D } from '@/components/3d/RealisticLamp3D';
import { RealisticModernWhiteBookshelf3D } from '@/components/3d/RealisticModernWhiteBookshelf3D';
import { RealisticGlassWindow3D } from '@/components/3d/RealisticGlassWindow3D';

useGLTF.preload('/models/advanced_book_realistic.glb');

const COVER_PRESET_SPECS = [
  {
    id: 'alchemist',
    name: '☀️ The Alchemist',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    subtitle: '25th Anniversary Hardcover',
    bgTop: '#7c3626',
    bgBottom: '#3e1810',
    accent: '#eac067',
    spineColor: '#4e1f15',
    motif: 'sun' as const,
  },
  {
    id: 'meditations',
    name: '🏛️ Meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    subtitle: 'Annotated Classic Edition',
    bgTop: '#1f2b3d',
    bgBottom: '#101824',
    accent: '#e2c069',
    spineColor: '#192332',
    motif: 'arch' as const,
  },
  {
    id: 'cosmos',
    name: '🌌 Cosmos',
    title: 'Cosmos',
    author: 'Carl Sagan',
    subtitle: 'Illustrated Collector Volume',
    bgTop: '#121933',
    bgBottom: '#090d1c',
    accent: '#9ec5ff',
    spineColor: '#131b35',
    motif: 'cosmos' as const,
  },
  {
    id: 'botanica',
    name: '🌿 Botanica',
    title: 'Botanica',
    author: 'Alexander Humboldt',
    subtitle: 'Natural History Archive',
    bgTop: '#183629',
    bgBottom: '#0c2017',
    accent: '#d8be73',
    spineColor: '#152e23',
    motif: 'botanical' as const,
  },
  {
    id: 'swiss',
    name: '◼️ Design Systems',
    title: 'Form & Space',
    author: 'Dieter Rams',
    subtitle: 'Architectural Monograph',
    bgTop: '#ece7dd',
    bgBottom: '#dbd3c5',
    accent: '#c2412c',
    textColor: '#1c1c1e',
    spineColor: '#3a3835',
    motif: 'swiss' as const,
  },
];

function BookViewerModel({
  autoRotate,
  coverUrl,
  title,
  author,
  spineColor,
}: {
  autoRotate: boolean;
  coverUrl?: string;
  title: string;
  author: string;
  spineColor: string;
}) {
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.42;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.01, 0]} rotation={[0.06, -0.35, 0.02]}>
      <AdvancedBook3D
        coverUrl={coverUrl}
        title={title}
        author={author}
        spineColor={spineColor}
        interactive={false}
        scale={1.08}
      />
    </group>
  );
}

type ModelKey =
  | 'plant'
  | 'flower'
  | 'banana'
  | 'fig'
  | 'window_left'
  | 'window_right'
  | 'bookshelf'
  | 'lamp'
  | 'book';

export default function ModelViewerPage() {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('book');
  const [autoRotate, setAutoRotate] = useState(false);
  const [lampLightLevel, setLampLightLevel] = useState<0 | 1>(0); // Light OFF by default; toggles minimal soft glow
  const [activePresetId, setActivePresetId] = useState<string>(COVER_PRESET_SPECS[0].id);
  const [customCoverUrl, setCustomCoverUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [presetUrls, setPresetUrls] = useState<Record<string, string>>({});

  // Generate crisp 2:3 editorial cover art on mount for built-in presets
  useEffect(() => {
    const generated: Record<string, string> = {};
    for (const spec of COVER_PRESET_SPECS) {
      generated[spec.id] = createEditorialCoverDataUrl({
        title: spec.title,
        author: spec.author,
        subtitle: spec.subtitle,
        bgTop: spec.bgTop,
        bgBottom: spec.bgBottom,
        accent: spec.accent,
        textColor: spec.textColor,
        motif: spec.motif,
      });
    }
    setPresetUrls(generated);
  }, []);

  const activePreset = COVER_PRESET_SPECS.find((p) => p.id === activePresetId) || COVER_PRESET_SPECS[0];
  const resolvedCoverUrl = customCoverUrl || presetUrls[activePreset.id] || '';

  const modelInfo = {
    plant: {
      name: 'Photorealistic Trailing Pothos Planter',
      fileName: 'plant_pot_realistic.glb',
      fileSize: 'Peak PBR Botanical Detailing',
      subTitle: 'Normal-Mapped Veins • Golden Variegation • Glazed Stoneware Pot • Organic Soil & Stones',
      cameraPos: [0, 0.145, 0.58] as [number, number, number],
      cameraFov: 38,
      shadowPos: [0, -0.02, 0] as [number, number, number],
      shadowScale: 0.42,
      shadowOpacity: 0.6,
      minDistance: 0.2,
      maxDistance: 1.6,
      target: [0, 0.095, 0] as [number, number, number],
      isBotanical: true,
      hint: 'Click & drag to rotate 360° • Scroll to inspect photographic leaves & ceramic finish',
    },
    flower: {
      name: 'Small Ceramic Tabletop Flower Planter',
      fileName: 'flower_pot_small_realistic.glb',
      fileSize: 'Peak PBR Botanical & Floral Detailing',
      subTitle: 'Lanceolate Leaves • Sculpted Ivory Blooms • Golden Spadix • Fluted Stoneware Pot',
      cameraPos: [0, 0.165, 0.62] as [number, number, number],
      cameraFov: 38,
      shadowPos: [0, -0.02, 0] as [number, number, number],
      shadowScale: 0.42,
      shadowOpacity: 0.58,
      minDistance: 0.2,
      maxDistance: 1.6,
      target: [0, 0.125, 0] as [number, number, number],
      isBotanical: true,
      hint: 'Drag 360° • Zoom in to inspect fluted stoneware pot, lanceolate leaves & sculpted flowers',
    },
    banana: {
      name: 'Tall Corridor Giant Banana Leaf Planter',
      fileName: 'tall_banana_plant_realistic.glb',
      fileSize: 'Peak Corridor Botanical PBR',
      subTitle: 'Fibrous Pseudostems • Split Banana Paddle Leaves • Matte White Corridor Pot',
      cameraPos: [0, 0.36, 2.80] as [number, number, number],
      cameraFov: 40,
      shadowPos: [0, -0.76, 0] as [number, number, number],
      shadowScale: 1.6,
      shadowOpacity: 0.55,
      minDistance: 0.6,
      maxDistance: 5.5,
      target: [0, 0.08, 0] as [number, number, number],
      isBotanical: true,
      hint: 'Drag 360° • Sized (~1.55m) for flanking corridor bookshelves • Parallel-veined split leaves',
    },
    fig: {
      name: 'Tall Corridor Fiddle-Leaf Fig Planter',
      fileName: 'tall_fiddle_fig_realistic.glb',
      fileSize: 'Peak Corridor Botanical PBR',
      subTitle: 'Woody Branching Trunk • Leathery Lyre Leaves • 36-Flute Warm Limestone Pot',
      cameraPos: [0, 0.38, 2.98] as [number, number, number],
      cameraFov: 40,
      shadowPos: [0, -0.78, 0] as [number, number, number],
      shadowScale: 1.5,
      shadowOpacity: 0.55,
      minDistance: 0.6,
      maxDistance: 5.5,
      target: [0, 0.11, 0] as [number, number, number],
      isBotanical: true,
      hint: 'Drag 360° • Sized (~1.68m) for corridor display • Fissured Ficus bark & fluted limestone pot',
    },
    window_left: {
      name: 'Left Wall Glass Casement Window (Updated Sky & Grass)',
      fileName: 'window_glass_outdoor_realistic.glb',
      fileSize: 'Peak Architectural Glazing PBR',
      subTitle: 'Double-Glazed Reflective Glass • White Timber Frame • Fresh Outdoor Sky & Lawn View',
      cameraPos: [0, 0.04, 3.25] as [number, number, number],
      cameraFov: 40,
      shadowPos: [0, -0.92, 0] as [number, number, number],
      shadowScale: 3.0,
      shadowOpacity: 0.45,
      minDistance: 0.8,
      maxDistance: 6.0,
      target: [0, 0.0, 0] as [number, number, number],
      isBotanical: false,
      hint: 'Left wall window • Look through reflective glass onto freshly generated outdoor sky, sunlit trees & green grass',
    },
    window_right: {
      name: 'Right Wall Glass Casement Window (Sea & Clouds View)',
      fileName: 'window_glass_sea_realistic.glb',
      fileSize: 'Peak Architectural Glazing PBR',
      subTitle: 'Double-Glazed Reflective Glass • White Timber Frame • Ocean Sea & Clouds Outside',
      cameraPos: [0, 0.04, 3.25] as [number, number, number],
      cameraFov: 40,
      shadowPos: [0, -0.92, 0] as [number, number, number],
      shadowScale: 3.0,
      shadowOpacity: 0.45,
      minDistance: 0.8,
      maxDistance: 6.0,
      target: [0, 0.0, 0] as [number, number, number],
      isBotanical: false,
      hint: 'Right wall window • Look through crystal glass onto sunlit open sea ocean waves & cumulus clouds',
    },
    bookshelf: {
      name: 'Modern White Illuminated Wall Bookshelf',
      fileName: 'bookshelf_minimal_white.glb',
      fileSize: 'Empty Luxury Fluted & LED Built-In',
      subTitle: 'Rounded Portal & Champagne Trim • Knife-Edge White Shelves • Fluted Off-White Back • Bright LEDs',
      cameraPos: [0, 0.06, 2.85] as [number, number, number],
      cameraFov: 40,
      shadowPos: [0, -0.76, 0] as [number, number, number],
      shadowScale: 3.4,
      shadowOpacity: 0.45,
      minDistance: 1.0,
      maxDistance: 6.0,
      target: [0, 0.02, 0] as [number, number, number],
      isBotanical: false,
      hint: 'Modern white wall-mounted shelf kept 100% empty • Fluted off-white back panel, champagne inlay & brighter warm compartment LEDs',
    },
    lamp: {
      name: 'Fluted Travertine & Linen Table Lamp',
      fileName: 'table_lamp_realistic.glb',
      fileSize: 'Peak Architectural PBR',
      subTitle: '32-Flute Honed Travertine • Woven Oatmeal Linen Shade • Brass Harp & Filament Bulb',
      cameraPos: [0, 0.08, 0.62] as [number, number, number],
      cameraFov: 38,
      shadowPos: [0, -0.14, 0] as [number, number, number],
      shadowScale: 0.56,
      shadowOpacity: 0.55,
      minDistance: 0.25,
      maxDistance: 1.8,
      target: [0, 0.015, 0] as [number, number, number],
      isBotanical: false,
      hint: 'Light defaults OFF • Click lamp or Light button for subtle minimal glow • Wireless fluted travertine & linen',
    },
    book: {
      name: 'Advanced Realistic 3D Hardcover Book',
      fileName: 'advanced_book_realistic.glb',
      fileSize: 'Custom Image UV Map',
      subTitle: 'Concave Fore-Edge • Beveled Hardcover Boards • Debossed French Groove • Convex Spine',
      cameraPos: [0, 0.06, 0.62] as [number, number, number],
      cameraFov: 38,
      shadowPos: [0, -0.17, 0] as [number, number, number],
      shadowScale: 0.65,
      shadowOpacity: 0.6,
      minDistance: 0.25,
      maxDistance: 2.2,
      target: [0, 0, 0] as [number, number, number],
      isBotanical: false,
      hint: 'Drag anywhere to orbit full 360° (including top & bottom) • Pick a preset or upload your real cover on the left',
    },
  }[selectedModel];

  return (
    <div className="w-full h-screen bg-[#111113] text-neutral-100 flex flex-col relative overflow-hidden select-none font-sans">
      {/* Top Header & Controls */}
      <header className="absolute top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between gap-2 bg-neutral-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            className="w-8 h-8 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white transition-colors"
          >
            ←
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider uppercase text-white font-serif whitespace-nowrap">
                3D Model Studio
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-amber-400 font-mono truncate max-w-[180px] xl:max-w-[220px]">
              {modelInfo.fileName} ({modelInfo.subTitle})
            </p>
          </div>
        </div>

        {/* Model Switcher Tabs & Live Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Model Switcher */}
          <div className="flex items-center bg-neutral-900/90 p-1 rounded-full border border-white/15">
            <button
              onClick={() => setSelectedModel('plant')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'plant'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌿 Pothos
            </button>
            <button
              onClick={() => setSelectedModel('flower')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'flower'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌸 Flower
            </button>
            <button
              onClick={() => setSelectedModel('banana')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'banana'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌴 Banana
            </button>
            <button
              onClick={() => setSelectedModel('fig')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'fig'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌳 Fiddle Fig
            </button>
            <button
              onClick={() => setSelectedModel('window_left')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'window_left'
                  ? 'bg-sky-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🪟 L Window
            </button>
            <button
              onClick={() => setSelectedModel('window_right')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'window_right'
                  ? 'bg-cyan-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌊 R Window
            </button>
            <button
              onClick={() => setSelectedModel('bookshelf')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'bookshelf'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              📚 Shelf
            </button>
            <button
              onClick={() => setSelectedModel('lamp')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'lamp'
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              💡 Lamp
            </button>
            <button
              onClick={() => setSelectedModel('book')}
              className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedModel === 'book'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              📖 Book
            </button>
          </div>

          {selectedModel === 'bookshelf' && (
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
              <span className="text-neutral-300 font-mono font-semibold">Modern LED Wall-Mount</span>
            </div>
          )}

          {selectedModel === 'lamp' && (
            <button
              onClick={() => setLampLightLevel((prev) => (prev === 0 ? 1 : 0))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-xs transition-colors cursor-pointer"
              title="Click to toggle subtle minimal lamp glow"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  lampLightLevel === 1
                    ? 'bg-amber-300/85 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                    : 'bg-neutral-600'
                }`}
              />
              <span className="text-neutral-400">Light:</span>
              <span className="text-amber-300 font-mono font-semibold">
                {lampLightLevel === 1 ? 'Minimal Glow' : 'OFF'}
              </span>
            </button>
          )}

          {selectedModel === 'book' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-neutral-400">Cover:</span>
              <span className="text-emerald-300 font-mono font-semibold">Custom Image UV</span>
            </div>
          )}

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-bold'
                : 'bg-neutral-900 text-neutral-300 border-white/15 hover:bg-white/10'
            }`}
          >
            {autoRotate ? 'Rotating ON' : 'Auto Rotate'}
          </button>

          <a
            href={`/models/${modelInfo.fileName}`}
            download={modelInfo.fileName}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-white text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
          >
            Download .GLB
          </a>
        </div>
      </header>

      {/* Side-Docked Custom Cover Studio Panel for 3D Book (Unobstructed Center Book View!) */}
      {selectedModel === 'book' && (
        <aside className="absolute left-5 top-24 z-30 w-64 flex flex-col gap-2.5 p-3.5 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-white/15 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎨</span> Cover Studio
            </span>
            <span className="text-[10px] font-mono text-neutral-400">2:3 Hardcover UV</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {COVER_PRESET_SPECS.map((preset) => {
              const isSelected = !customCoverUrl && activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setCustomCoverUrl('');
                    setActivePresetId(preset.id);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-neutral-300'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-2.5 flex flex-col gap-2">
            <label className="w-full px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white transition-colors cursor-pointer text-center shadow-md">
              📁 Upload Real Cover Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const objectUrl = URL.createObjectURL(file);
                  setCustomCoverUrl(objectUrl);
                }}
              />
            </label>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Or paste image URL..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputUrl.trim()) {
                    setCustomCoverUrl(inputUrl.trim());
                  }
                }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-neutral-900 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 flex-1 min-w-0 font-mono"
              />
              <button
                onClick={() => {
                  if (inputUrl.trim()) setCustomCoverUrl(inputUrl.trim());
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors cursor-pointer shrink-0"
              >
                Apply
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 3D Viewport with OrbitControls */}
      <div className="w-full h-full">
        <Canvas
          key={selectedModel}
          camera={{ position: modelInfo.cameraPos, fov: modelInfo.cameraFov, near: 0.04, far: 50 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Studio Lighting (balanced contrast so white sculptural bookshelf & warm LEDs shine) */}
          <ambientLight
            intensity={selectedModel === 'bookshelf' ? 0.92 : modelInfo.isBotanical ? 1.05 : 1.0}
            color="#fffcf7"
          />
          <directionalLight
            position={[2.0, 3.5, 2.5]}
            intensity={modelInfo.isBotanical ? 1.5 : selectedModel === 'bookshelf' ? 0.85 : 0.75}
            color="#fffdf5"
            castShadow
          />
          <directionalLight
            position={[-2.5, 2.0, 1.0]}
            intensity={modelInfo.isBotanical ? 0.75 : selectedModel === 'bookshelf' ? 0.65 : 0.65}
            color="#f4f8ff"
          />
          <directionalLight
            position={[-1.5, 2.5, -2.5]}
            intensity={selectedModel === 'book' || selectedModel === 'bookshelf' ? 0.72 : 0.45}
            color="#fff7e8"
          />
          <directionalLight
            position={[0, -1.0, 2.0]}
            intensity={0.35}
            color="#fffbeb"
          />

          <Suspense fallback={null}>
            {selectedModel === 'plant' ? (
              <RealisticPlantPot3D autoRotate={autoRotate} />
            ) : selectedModel === 'flower' ? (
              <RealisticSmallFlowerPot3D autoRotate={autoRotate} />
            ) : selectedModel === 'banana' ? (
              <RealisticTallBananaPlant3D autoRotate={autoRotate} />
            ) : selectedModel === 'fig' ? (
              <RealisticTallFiddleFig3D autoRotate={autoRotate} />
            ) : selectedModel === 'window_left' ? (
              <RealisticGlassWindow3D key="win-left" autoRotate={autoRotate} variant="left" />
            ) : selectedModel === 'window_right' ? (
              <RealisticGlassWindow3D key="win-right" autoRotate={autoRotate} variant="right" />
            ) : selectedModel === 'bookshelf' ? (
              <RealisticModernWhiteBookshelf3D autoRotate={autoRotate} />
            ) : selectedModel === 'lamp' ? (
              <RealisticLamp3D
                autoRotate={autoRotate}
                lightLevel={lampLightLevel}
                onToggleLight={() => setLampLightLevel((prev) => (prev === 0 ? 1 : 0))}
              />
            ) : (
              <BookViewerModel
                autoRotate={autoRotate}
                coverUrl={resolvedCoverUrl}
                title={activePreset.title}
                author={activePreset.author}
                spineColor={activePreset.spineColor}
              />
            )}

            {/* Soft drop shadow strictly on floor plane */}
            <ContactShadows
              position={modelInfo.shadowPos}
              opacity={modelInfo.shadowOpacity}
              scale={modelInfo.shadowScale}
              blur={1.8}
              far={1.0}
              color="#000000"
            />
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={modelInfo.minDistance}
            maxDistance={modelInfo.maxDistance}
            target={modelInfo.target}
            minPolarAngle={0.02}
            maxPolarAngle={Math.PI - 0.02}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-neutral-400 text-xs flex items-center gap-2 pointer-events-none shadow-2xl">
        <span className="text-amber-400">✦</span>
        <span>{modelInfo.hint}</span>
      </div>
    </div>
  );
}
