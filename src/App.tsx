import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Stars } from '@react-three/drei';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const b1Set = [1, 1/3, 1/2, 2/3, 3/4, 4/3, 3/2, 2, 3, Math.sqrt(2)];

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
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [highlightedN, setHighlightedN] = useState<number | null>(null);
  const [highlightedK, setHighlightedK] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
          <div className="flex items-center gap-4">
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
            <Badge variant="outline" className="border-[#58A6FF]/40 text-[#58A6FF]">
              Gamma_0(6)
            </Badge>
            <Badge variant="outline" className="border-[#3FB950]/40 text-[#3FB950]">
              N = 6
            </Badge>
            <Badge variant="outline" className="border-[#F0883E]/40 text-[#F0883E]">
              (d1,d2) = (2,3)
            </Badge>
            <Badge variant="outline" className="border-[#A371F7]/40 text-[#A371F7]">
              v20
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <aside className={`w-80 ${theme.sidebarBg} border-r ${theme.border} p-4 overflow-y-auto flex-shrink-0`}>
          <Tabs defaultValue="view" className="w-full">
            <TabsList className={`w-full grid grid-cols-2 ${isDarkMode ? 'bg-[#0D1117]' : 'bg-gray-100'}`}>
              <TabsTrigger value="view" className="data-[state=active]:bg-[#58A6FF]/20">View</TabsTrigger>
              <TabsTrigger value="params" className="data-[state=active]:bg-[#58A6FF]/20">Params</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view" className="space-y-4 mt-4">
              <Card className={`${theme.cardBg} ${theme.border} border`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${theme.text}`}>Visualization Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  <button
                    onClick={() => setViewMode('matrix')}
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
                    onClick={() => setViewMode('network')}
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
                    onClick={() => setViewMode('kcipher')}
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
                    onClick={() => setViewMode('dessin')}
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
                    onClick={() => setViewMode('cube')}
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
                    onClick={() => setViewMode('crt')}
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
                    onClick={() => setViewMode('hecke')}
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
                    onClick={() => setViewMode('kirchhoff')}
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
                    onClick={() => setViewMode('dessincube')}
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
                    onClick={() => setViewMode('sphere')}
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
                    onClick={() => setViewMode('cayley')}
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
                    onClick={() => setViewMode('phi')}
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
                    onClick={() => setViewMode('heatkernel')}
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
            </TabsContent>
            
            <TabsContent value="params" className="space-y-4 mt-4">
              <Card className={`${theme.cardBg} ${theme.border} border`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${theme.text}`}>B1 Set Multipliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {b1Set.map((k, i) => (
                      <button
                        key={i}
                        onClick={() => setHighlightedK(highlightedK === k ? null : k)}
                        className={`p-2 rounded text-xs font-mono transition-all ${
                          highlightedK === k
                            ? 'bg-[#F0883E]/30 border border-[#F0883E]'
                            : `${theme.buttonBg} border ${theme.border} hover:border-[#F0883E]/40`
                        }`}
                      >
                        <span className={theme.text}>{k === Math.sqrt(2) ? 'sqrt2' : k.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`${theme.cardBg} ${theme.border} border`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${theme.text}`}>Lattice Nodes (n)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[-9, -8, 0, 1, 3, 4, 5, 6, 7].map((n) => (
                      <button
                        key={n}
                        onClick={() => setHighlightedN(highlightedN === n ? null : n)}
                        className={`w-10 h-10 rounded flex items-center justify-center text-xs font-mono transition-all ${
                          highlightedN === n
                            ? 'bg-[#58A6FF]/30 border border-[#58A6FF]'
                            : `${theme.buttonBg} border ${theme.border} hover:border-[#58A6FF]/40`
                        }`}
                      >
                        <span className={theme.text}>{n}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
                  onSelectParticle={setSelectedParticle}
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
                  onSelectParticle={setSelectedParticle}
                />
              )}
              
              {viewMode === 'cube' && (
                <LatticeCube 
                  particles={particles}
                  highlightedN={highlightedN}
                  highlightedK={highlightedK}
                  selectedParticle={selectedParticle}
                  onSelectParticle={setSelectedParticle}
                />
              )}

              {viewMode === 'crt' && (
                <CRTGrid 
                  selectedParticle={selectedParticle}
                  onSelectParticle={setSelectedParticle}
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
                  onSelectParticle={setSelectedParticle}
                />
              )}

              {viewMode === 'sphere' && (
                <RiemannSphere 
                  particles={particles}
                  selectedParticle={selectedParticle}
                  onSelectParticle={setSelectedParticle}
                />
              )}

              {viewMode === 'cayley' && (
                <CayleySpectrum 
                  selectedParticle={selectedParticle}
                  onSelectParticle={setSelectedParticle}
                />
              )}

              {viewMode === 'phi' && (
                <PhiAmplitudes 
                  selectedParticle={selectedParticle}
                  onSelectParticle={setSelectedParticle}
                />
              )}

              {viewMode === 'heatkernel' && (
                <HeatKernel 
                  selectedParticle={selectedParticle}
                  onSelectParticle={setSelectedParticle}
                />
              )}
            </Canvas>
          </Suspense>

          {/* Overlay Info */}
          <div className="absolute top-4 right-4 w-80 pointer-events-none">
            <div className="pointer-events-auto">
              <ParticleInfo particle={selectedParticle} />
            </div>
          </div>

          {/* View Mode Indicator */}
          <div className="absolute bottom-4 left-4">
            <Badge className={`${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'} ${theme.text}`}>
              Mode: {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
            </Badge>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
