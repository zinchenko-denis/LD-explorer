import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Stars } from '@react-three/drei';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LDMatrix3D } from '@/components/LDMatrix3D';
import { ParticleNetwork } from '@/components/ParticleNetwork';
import { KCipherVisualizer } from '@/components/KCipherVisualizer';
import { DessinGraph } from '@/components/DessinGraph';
import { LatticeCube } from '@/components/LatticeCube';
import { ParticleInfo } from '@/components/ParticleInfo';
import { CRTGrid } from '@/components/CRTGrid';
import { HeckeOrbit } from '@/components/HeckeOrbit';
import { KirchhoffGraph } from '@/components/KirchhoffGraph';
import { DessinCube } from '@/components/DessinCube';
import { RiemannSphere } from '@/components/RiemannSphere';
import { CayleySpectrum } from '@/components/CayleySpectrum';
import { PhiAmplitudes } from '@/components/PhiAmplitudes';
import { HeatKernel } from '@/components/HeatKernel';
import type { Particle } from '@/types/ld-model';
import './App.css';

const particles: Particle[] = [
  { name: 'e', n: 0, K: 1, mass: 0.511, type: 'lepton', anchor: true },
  { name: 'u', n: 1, K: 2/3, mass: 2.16, type: 'quark-up', generation: 1 },
  { name: 'd', n: 1, K: Math.sqrt(2), mass: 4.67, type: 'quark-down', generation: 1 },
  { name: 'μ', n: 3, K: 3/4, mass: 105.66, type: 'lepton', generation: 2 },
  { name: 's', n: 3, K: 2/3, mass: 93.4, type: 'quark-down', generation: 2 },
  { name: 'p', n: 4, K: 1, mass: 938.27, type: 'anchor', anchor: true },
  { name: 'c', n: 4, K: 4/3, mass: 1270, type: 'quark-up', generation: 2 },
  { name: 'τ', n: 4, K: 2, mass: 1776.86, type: 'lepton', generation: 3 },
  { name: 'b', n: 5, K: 2/3, mass: 4180, type: 'quark-down', generation: 3 },
  { name: 'W', n: 6, K: 2, mass: 80377, type: 'boson' },
  { name: 'H', n: 6, K: 3, mass: 125100, type: 'boson' },
  { name: 't', n: 7, K: 2/3, mass: 172690, type: 'quark-up', generation: 3 },
];

type ViewMode = 'matrix' | 'network' | 'kcipher' | 'dessin' | 'cube' | 'crt' | 'hecke' | 'kirchhoff' | 'dessincube' | 'sphere' | 'cayley' | 'phi' | 'heatkernel';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full text-[#58A6FF]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm">Loading 3D Scene...</p>
      </div>
    </div>
  );
}

function App() {
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [viewMode, setViewMode] = useState<ViewMode>('dessin');
  const [highlightedN] = useState<number | null>(null);
  const [highlightedK] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRu, setIsRu] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

  // Look up real particle by name (fixes dummy data from 3D clicks)
  const handleSelectParticle = (p: Particle) => {
    const real = particles.find(r => r.name === p.name || r.name === p.name.replace('mu', 'μ').replace('tau', 'τ'));
    setSelectedParticle(real || p);
  };

  // Dismiss particle card
  const handleDismiss = () => setSelectedParticle(null);

  // Show description briefly on view change
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setShowDescription(true);
    setSelectedParticle(null);
  };

  const VIEW_DESC: Record<ViewMode, { en: string; ru: string; title_en: string; title_ru: string }> = {
    matrix:      { title_en: 'Biadjacency Matrix', title_ru: 'Бисмежная матрица', en: 'The 4×6 matrix connecting 4 black vertices (particle types) to 6 white vertices (generation channels). Sum = 12 = index of Γ₀(6).', ru: 'Матрица 4×6 связывает 4 чёрные вершины (типы частиц) с 6 белыми (каналы поколений). Сумма = 12 = индекс Γ₀(6).' },
    network:     { title_en: 'Particle Network', title_ru: 'Сеть частиц', en: '12 particles arranged by mass (vertical) with connections showing the LD lattice structure n × K.', ru: '12 частиц по массе (вертикаль) со связями, показывающими решёточную структуру n × K.' },
    kcipher:     { title_en: 'K-Cipher', title_ru: 'K-шифр', en: 'Each particle mass multiplier K = 2^a₂ · 3^a₃ is fully determined by the dessin geometry. 11/11 rational + 1 EWSB (√2).', ru: 'Множитель массы K = 2^a₂ · 3^a₃ полностью определён геометрией дезина. 11/11 рациональных + 1 EWSB (√2).' },
    dessin:      { title_en: "Dessin d'Enfant", title_ru: 'Дезин-данфан', en: 'The bipartite graph of X₀(6): 4 black vertices (val 3), 6 white (val 2), 12 edges = 12 particles. Pulsing dots show information flow along edges.', ru: 'Двудольный граф X₀(6): 4 чёрные вершины (вал 3), 6 белых (вал 2), 12 рёбер = 12 частиц. Пульсирующие точки показывают поток информации.' },
    cube:        { title_en: 'Lattice-K Cube', title_ru: 'Решётка n-K', en: 'Parameter space: lattice node n vs multiplier K vs mass. Each particle sits at a unique (n, K) address.', ru: 'Пространство параметров: узел решётки n × множитель K × масса. Каждая частица на уникальном адресе (n, K).' },
    crt:         { title_en: 'CRT Grid', title_ru: 'CRT-сетка', en: 'Chinese Remainder Theorem: P¹(ℤ/6ℤ) ≅ P¹(𝔽₂) × P¹(𝔽₃). Each of 12 cells = one particle. Columns encode face type.', ru: 'Китайская теорема об остатках: P¹(ℤ/6ℤ) ≅ P¹(𝔽₂) × P¹(𝔽₃). 12 ячеек = 12 частиц. Столбцы кодируют тип грани.' },
    hecke:       { title_en: 'Hecke Orbit', title_ru: 'Орбита Гекке', en: 'B₁ = orbit of K=1 under Hecke operators T₂, T₃ within distance 3. MDL ≡ Hecke: one lattice, two names.', ru: 'B₁ = орбита K=1 под операторами Гекке T₂, T₃ на расстоянии ≤ 3. MDL ≡ Hecke: одна решётка, два имени.' },
    kirchhoff:   { title_en: 'Kirchhoff Graph', title_ru: 'Граф Кирхгофа', en: 'Bipartite graph with K=40 spanning trees. Anchor splits degeneracy → Cabibbo angle λ = 9/40.', ru: 'Двудольный граф, 40 остовных деревьев. Якорь расщепляет вырождение → угол Кабиббо λ = 9/40.' },
    dessincube:  { title_en: 'Dessin in 3D', title_ru: 'Дезин в 3D', en: '12 particles mapped into a 3D cube by face×BV×WV coordinates. 12 of 64 cells occupied.', ru: '12 частиц в 3D кубе по координатам грань×BV×WV. Заняты 12 из 64 ячеек.' },
    sphere:      { title_en: 'Riemann Sphere', title_ru: 'Сфера Римана', en: 'X₀(6) as punctured sphere with 4 cusps (widths 1,2,3,6). Particles placed by j-map preimages.', ru: 'X₀(6) как проколотая сфера с 4 каспами (ширины 1,2,3,6). Частицы на прообразах j-отображения.' },
    cayley:      { title_en: 'Cayley Spectrum', title_ru: 'Спектр Кэли', en: '12-vertex Cayley graph on P¹(ℤ/6ℤ). Laplacian spectrum has discriminants 21 = d₂L and 5 = N−1.', ru: '12-вершинный граф Кэли на P¹(ℤ/6ℤ). Дискриминанты спектра: 21 = d₂L и 5 = N−1.' },
    phi:         { title_en: 'φ-Amplitudes', title_ru: 'φ-Амплитуды', en: 'Golden ratio eigenvector: Z_φ = {p,c,u,t} exactly zero. Three tiers 1:φ:φ² with d-μ maximal.', ru: 'Собственный вектор золотого сечения: Z_φ = {p,c,u,t} точно ноль. Три яруса 1:φ:φ², d-μ максимальны.' },
    heatkernel:  { title_en: 'Heat Kernel', title_ru: 'Ядро теплопроводности', en: 'At diffusion time t=1/d₁, the heat kernel gives sin²θ₁₂ = 4/13 with 4.6 ppm precision.', ru: 'При t=1/d₁ ядро теплопроводности даёт sin²θ₁₂ = 4/13 с точностью 4.6 ppm.' },
  };

  const theme = isDarkMode ? {
    bg: 'bg-[#0D1117]',
    headerBg: 'bg-[#161B22]',
    sidebarBg: 'bg-[#161B22]',
    text: 'text-[#E6EDF3]',
    textMuted: 'text-[#E6EDF3]/60',
    border: 'border-[#30363D]',
    cardBg: 'bg-[#0D1117]',
    buttonBg: 'bg-[#161B22]',
    canvasBg: '#0D1117',
    gridColor: '#30363D',
  } : {
    bg: 'bg-gray-50',
    headerBg: 'bg-white',
    sidebarBg: 'bg-white',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
    cardBg: 'bg-gray-50',
    buttonBg: 'bg-white',
    canvasBg: '#f9fafb',
    gridColor: '#e5e7eb',
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col`}>
      {/* Header */}
      <header className={`${theme.headerBg} border-b ${theme.border} p-4`}>
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#58A6FF] to-[#3FB950] flex items-center justify-center">
              <span className="text-white font-bold text-lg">LD</span>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme.text}`}>LD Model 3D Explorer</h1>
              <p className={`text-xs ${theme.textMuted}`}>Discrete Scale Invariance & Particle Mass Spectrum</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRu(!isRu)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDarkMode 
                  ? 'bg-[#30363D] text-[#E6EDF3] hover:bg-[#3D444D]' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isRu ? 'RU 🇷🇺' : 'EN 🇬🇧'}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDarkMode 
                  ? 'bg-[#30363D] text-[#E6EDF3] hover:bg-[#3D444D]' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <span className={`text-xs font-mono ${isDarkMode ? 'text-[#8B949E]' : 'text-gray-500'}`}>
              Γ₀(6) · N=6 · (d₁,d₂)=(2,3)
            </span>
            <a 
              href="https://zenodo.org/records/19150365" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-xs font-mono transition-all ${isDarkMode ? 'text-[#58A6FF] hover:text-[#79C0FF]' : 'text-blue-600 hover:text-blue-800'}`}
            >
              DOI: 10.5281/zenodo.19150365
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <aside className={`w-80 ${theme.sidebarBg} border-r ${theme.border} p-4 overflow-y-auto flex-shrink-0`}>
          <div className="space-y-4">
            <Card className={`${theme.cardBg} ${theme.border} border`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${theme.text}`}>{isRu ? 'Визуализация' : 'Visualization'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  <button
                    onClick={() => handleViewChange('matrix')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'matrix' 
                        ? 'bg-[#58A6FF]/20 border border-[#58A6FF]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#58A6FF]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#58A6FF] font-mono font-bold">M</span>
                      <span className={theme.text}>Biadjacency Matrix</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>4x6 matrix structure</p>
                  </button>
                  
                  <button
                    onClick={() => handleViewChange('network')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'network' 
                        ? 'bg-[#3FB950]/20 border border-[#3FB950]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#3FB950]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#3FB950] font-mono font-bold">N</span>
                      <span className={theme.text}>Particle Network</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Mass spectrum connections</p>
                  </button>
                  
                  <button
                    onClick={() => handleViewChange('kcipher')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'kcipher' 
                        ? 'bg-[#F0883E]/20 border border-[#F0883E]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#F0883E]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#F0883E] font-mono font-bold">K</span>
                      <span className={theme.text}>K-Cipher Explorer</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Design cipher structure</p>
                  </button>
                  
                  <button
                    onClick={() => handleViewChange('dessin')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'dessin' 
                        ? 'bg-[#A371F7]/20 border border-[#A371F7]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#A371F7]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#A371F7] font-mono font-bold">D</span>
                      <span className={theme.text}>Dessin d&apos;Enfant</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Bipartite graph structure</p>
                  </button>
                  
                  <button
                    onClick={() => handleViewChange('cube')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'cube' 
                        ? 'bg-[#D29922]/20 border border-[#D29922]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#D29922]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#D29922] font-mono font-bold">L</span>
                      <span className={theme.text}>Lattice-K Cube</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Parameter space (9x10 grid)</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('crt')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'crt' 
                        ? 'bg-[#58A6FF]/20 border border-[#58A6FF]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#58A6FF]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#58A6FF] font-mono font-bold">C</span>
                      <span className={theme.text}>CRT Grid</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>P1(Z/6Z) = P1(F2) x P1(F3)</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('hecke')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'hecke' 
                        ? 'bg-[#F0883E]/20 border border-[#F0883E]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#F0883E]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#F0883E] font-mono font-bold">H</span>
                      <span className={theme.text}>Hecke Orbit</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>T2 and T3 action on B1</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('kirchhoff')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'kirchhoff' 
                        ? 'bg-[#3FB950]/20 border border-[#3FB950]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#3FB950]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#3FB950] font-mono font-bold">K</span>
                      <span className={theme.text}>Kirchhoff Graph</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>40 spanning trees</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('dessincube')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'dessincube' 
                        ? 'bg-[#A371F7]/20 border border-[#A371F7]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#A371F7]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#A371F7] font-mono font-bold">X</span>
                      <span className={theme.text}>Dessin Cube</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>4x4x4 = 64 cells, 12 occupied</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('sphere')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'sphere' 
                        ? 'bg-[#D29922]/20 border border-[#D29922]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#D29922]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#D29922] font-mono font-bold">S</span>
                      <span className={theme.text}>Riemann Sphere</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>X_0(6) with 4 cusps, 12 particles</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('cayley')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'cayley' 
                        ? 'bg-[#58A6FF]/20 border border-[#58A6FF]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#58A6FF]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#58A6FF] font-mono font-bold">C</span>
                      <span className={theme.text}>Cayley Spectrum</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>12V graph, Laplacian eigenvalues, disc {'{21, 5}'}</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('phi')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'phi' 
                        ? 'bg-[#BC8CFF]/20 border border-[#BC8CFF]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#BC8CFF]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#BC8CFF] font-mono font-bold">φ</span>
                      <span className={theme.text}>φ-Amplitudes</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>Golden ratio eigenvector, Z_φ zero theorem</p>
                  </button>

                  <button
                    onClick={() => handleViewChange('heatkernel')}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                      viewMode === 'heatkernel' 
                        ? 'bg-[#FF6B9D]/20 border border-[#FF6B9D]/40' 
                        : `${theme.buttonBg} border ${theme.border} hover:border-[#FF6B9D]`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF6B9D] font-mono font-bold">H</span>
                      <span className={theme.text}>Heat Kernel</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>sin²θ₁₂ = 4/13 at t = 1/d₁, DT mechanism</p>
                  </button>
                </CardContent>
              </Card>

              <Card className={`${theme.cardBg} ${theme.border} border`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${theme.text}`}>Display Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className={`text-sm ${theme.textMuted}`}>Show Connections</Label>
                    <Switch 
                      checked={showConnections} 
                      onCheckedChange={setShowConnections}
                      className="data-[state=checked]:bg-[#58A6FF]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className={`text-sm ${theme.textMuted}`}>Show Grid</Label>
                    <Switch 
                      checked={showGrid} 
                      onCheckedChange={setShowGrid}
                      className="data-[state=checked]:bg-[#3FB950]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-sm ${theme.textMuted}`}>Rotation Speed</Label>
                    <Slider
                      value={[rotationSpeed]}
                      onValueChange={([v]) => setRotationSpeed(v)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
          </div>

          <Separator className={`my-4 ${theme.border}`} />

          {/* Particle List */}
          <Card className={`${theme.cardBg} ${theme.border} border`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${theme.text}`}>Particles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
              {particles.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedParticle(p)}
                  className={`w-full p-2 rounded text-left text-xs transition-all ${
                    selectedParticle?.name === p.name
                      ? 'bg-[#58A6FF]/20 border border-[#58A6FF]/40'
                      : `${theme.buttonBg} border border-transparent hover:bg-[#30363D]/50`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${theme.text}`}>{p.name}</span>
                    <span className={theme.textMuted}>n={p.n}</span>
                  </div>
                  <div className={`${theme.textMuted} mt-1`}>
                    K={p.K === Math.sqrt(2) ? 'sqrt2' : p.K.toFixed(2)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Center - 3D Canvas */}
        <main className="flex-1 relative" style={{ backgroundColor: theme.canvasBg }}>
          <Suspense fallback={<LoadingFallback />}>
            <Canvas 
              className="w-full h-full"
              gl={{ antialias: true, alpha: true }}
              dpr={[1, 2]}
              onPointerMissed={handleDismiss}
            >
              <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
              <OrbitControls 
                enablePan={true} 
                enableZoom={true} 
                enableRotate={true}
                autoRotate={rotationSpeed > 0}
                autoRotateSpeed={rotationSpeed * 2}
                minDistance={5}
                maxDistance={50}
              />
              
              {showGrid && (
                <Grid 
                  infiniteGrid 
                  cellSize={2} 
                  cellThickness={0.5} 
                  sectionSize={10} 
                  sectionThickness={1} 
                  fadeDistance={100} 
                  fadeStrength={1}
                />
              )}
              
              {isDarkMode && <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />}
              
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#58A6FF" />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3FB950" />
              <pointLight position={[0, 10, -10]} intensity={0.3} color="#F0883E" />
              
              {viewMode === 'matrix' && (
                <LDMatrix3D 
                  showConnections={showConnections}
                />
              )}
              
              {viewMode === 'network' && (
                <ParticleNetwork 
                  particles={particles}
                  showConnections={showConnections}
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}
              
              {viewMode === 'kcipher' && (
                <KCipherVisualizer 
                  highlightedK={highlightedK}
                  selectedParticle={selectedParticle}
                />
              )}
              
              {viewMode === 'dessin' && (
                <DessinGraph 
                  showConnections={showConnections}
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}
              
              {viewMode === 'cube' && (
                <LatticeCube 
                  particles={particles}
                  highlightedN={highlightedN}
                  highlightedK={highlightedK}
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}

              {viewMode === 'crt' && (
                <CRTGrid 
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}

              {viewMode === 'hecke' && (
                <HeckeOrbit 
                  highlightedK={highlightedK}
                  selectedParticle={selectedParticle}
                />
              )}

              {viewMode === 'kirchhoff' && (
                <KirchhoffGraph 
                  selectedParticle={selectedParticle}
                />
              )}

              {viewMode === 'dessincube' && (
                <DessinCube 
                  particles={particles}
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}

              {viewMode === 'sphere' && (
                <RiemannSphere 
                  particles={particles}
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}

              {viewMode === 'cayley' && (
                <CayleySpectrum 
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}

              {viewMode === 'phi' && (
                <PhiAmplitudes 
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}

              {viewMode === 'heatkernel' && (
                <HeatKernel 
                  selectedParticle={selectedParticle}
                  onSelectParticle={handleSelectParticle}
                />
              )}
            </Canvas>
          </Suspense>

          {/* Overlay Info — dismissable */}
          {selectedParticle && (
            <div className="absolute top-4 right-4 w-80">
              <div className="relative">
                <button 
                  onClick={handleDismiss}
                  className={`absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDarkMode ? 'bg-[#30363D] text-[#E6EDF3] hover:bg-[#3D444D]' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >×</button>
                <ParticleInfo particle={selectedParticle} />
              </div>
            </div>
          )}

          {/* View Description Panel — top of canvas */}
          {showDescription && (
            <div className={`absolute top-4 left-4 right-4 max-w-lg transition-all z-10 ${
              isDarkMode ? 'bg-[#161B22]/95 border-[#30363D]' : 'bg-white/95 border-gray-200'
            } border rounded-xl p-3 shadow-xl`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-[#58A6FF]' : 'text-blue-600'}`}>
                    {isRu ? VIEW_DESC[viewMode].title_ru : VIEW_DESC[viewMode].title_en}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#8B949E]' : 'text-gray-600'}`}>
                    {isRu ? VIEW_DESC[viewMode].ru : VIEW_DESC[viewMode].en}
                  </p>
                </div>
                <button 
                  onClick={() => setShowDescription(false)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isDarkMode ? 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >×</button>
              </div>
            </div>
          )}

          {/* View Mode Indicator + Info toggle */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <Badge className={`${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'} ${theme.text}`}>
              Mode: {isRu ? VIEW_DESC[viewMode].title_ru : VIEW_DESC[viewMode].title_en}
            </Badge>
            {!showDescription && (
              <button
                onClick={() => setShowDescription(true)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
                  isDarkMode ? 'bg-[#30363D] text-[#58A6FF] hover:bg-[#3D444D]' : 'bg-gray-200 text-blue-600 hover:bg-gray-300'
                }`}
              >?</button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
