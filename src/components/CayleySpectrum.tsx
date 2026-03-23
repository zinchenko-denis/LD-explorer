import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface CayleySpectrumProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// Cayley graph on P¹(ℤ/6ℤ), generators {σ₀, σ₀⁻¹, σ₁}, 3-regular
// 12 vertices = 12 particles, 18 edges
// Monodromy (companion O.1):
// σ∞ = (c u b s d t)(e τ μ)(W H)(p)  — face permutation
// σ₁ = (u t)(c p)(b μ)(d e)(s W)(τ H) — involution  
// σ₀ = (c u p)(b t e)(s μ H)(d W τ)   — 3-cycles

// Laplacian eigenvalues (companion I.6):
// char(L) = x(x-1)(x-3)²(x-4)(x-5)³(x²-5x+1)(x²-5x+5)
const EIGENVALUES = [
  { value: 0, mult: 1, label: '0', color: '#58A6FF', type: 'rational' },
  { value: 1, mult: 1, label: '1', color: '#3FB950', type: 'rational' },
  { value: 3, mult: 2, label: '3', color: '#F0883E', type: 'rational' },
  { value: 4, mult: 1, label: '4', color: '#D29922', type: 'rational' },
  { value: 5, mult: 3, label: '5', color: '#FF6B9D', type: 'rational' },
  { value: (5 - Math.sqrt(21)) / 2, mult: 1, label: '(5−√21)/2', color: '#A371F7', type: 'irrational', disc: 21 },
  { value: (5 + Math.sqrt(21)) / 2, mult: 1, label: '(5+√21)/2', color: '#A371F7', type: 'irrational', disc: 21 },
  { value: (5 - Math.sqrt(5)) / 2, mult: 1, label: '(5−√5)/2', color: '#BC8CFF', type: 'irrational', disc: 5 },
  { value: (5 + Math.sqrt(5)) / 2, mult: 1, label: '(5+√5)/2', color: '#BC8CFF', type: 'irrational', disc: 5 },
];

// Monodromy-derived edges (σ₀ action = Cayley generator)
const SIGMA0: Record<string, string> = {
  'c': 'u', 'u': 'p', 'p': 'c',
  'b': 't', 't': 'e', 'e': 'b',
  's': 'μ', 'μ': 'H', 'H': 's',
  'd': 'W', 'W': 'τ', 'τ': 'd',
};

const SIGMA1: Record<string, string> = {
  'u': 't', 't': 'u',
  'c': 'p', 'p': 'c',
  'b': 'μ', 'μ': 'b',
  'd': 'e', 'e': 'd',
  's': 'W', 'W': 's',
  'τ': 'H', 'H': 'τ',
};

const PARTICLE_NAMES = ['u', 'd', 'c', 's', 't', 'b', 'e', 'μ', 'τ', 'W', 'H', 'p'];

const PARTICLE_COLORS: Record<string, string> = {
  'u': '#58A6FF', 'd': '#3FB950', 'c': '#58A6FF', 's': '#3FB950',
  't': '#58A6FF', 'b': '#3FB950', 'e': '#D29922', 'μ': '#D29922',
  'τ': '#D29922', 'W': '#F0883E', 'H': '#A371F7', 'p': '#FF6B9D',
};

export function CayleySpectrum({ selectedParticle, onSelectParticle: _onSelectParticle }: CayleySpectrumProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
  

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.15;
    }
  });

  // Position 12 vertices on a circle in 3D
  const vertexPositions = useMemo(() => {
    const pos: Record<string, [number, number, number]> = {};
    // Arrange by σ∞ face structure
    const faces = [
      { particles: ['c', 'u', 'b', 's', 'd', 't'], y: 0, r: 6, label: 'Q-face (6)' },
      { particles: ['e', 'τ', 'μ'], y: 4, r: 3, label: 'L-face (3)' },
      { particles: ['W', 'H'], y: -3, r: 2, label: 'B-face (2)' },
      { particles: ['p'], y: -6, r: 0, label: 'A-face (1)' },
    ];

    faces.forEach(face => {
      face.particles.forEach((p, i) => {
        if (face.r === 0) {
          pos[p] = [0, face.y, 0];
        } else {
          const angle = (i / face.particles.length) * Math.PI * 2 - Math.PI / 2;
          pos[p] = [Math.cos(angle) * face.r, face.y, Math.sin(angle) * face.r];
        }
      });
    });
    return pos;
  }, []);

  // Build edges from σ₀ and σ₁
  const edges = useMemo(() => {
    const edgeSet = new Set<string>();
    const result: { from: string; to: string; type: string }[] = [];

    // σ₀ edges (12 directed = 12 edges, but as undirected pairs)
    for (const [from, to] of Object.entries(SIGMA0)) {
      const key = [from, to].sort().join('-');
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        result.push({ from, to, type: 'σ₀' });
      }
    }
    // σ₁ edges (6 transpositions)
    for (const [from, to] of Object.entries(SIGMA1)) {
      if (from < to) {
        const key = [from, to].sort().join('-');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          result.push({ from, to, type: 'σ₁' });
        }
      }
    }
    return result;
  }, []);

  return (
    <group ref={groupRef}>
      <Text position={[0, 10, 0]} fontSize={1.3} color="#58A6FF" anchorX="center">
        Cayley Graph — Laplacian Spectrum
      </Text>
      <Text position={[0, 8.5, 0]} fontSize={0.6} color="#8B949E" anchorX="center">
        P¹(ℤ/6ℤ), 12V × 18E, 3-regular | det' = 22500 = N²(N−1)⁴
      </Text>

      {/* Graph view: vertices + edges */}
      {/* Edges */}
      {edges.map((edge, idx) => {
        const fromPos = vertexPositions[edge.from];
        const toPos = vertexPositions[edge.to];
        if (!fromPos || !toPos) return null;

        const isHighlighted = hoveredVertex === edge.from || hoveredVertex === edge.to ||
          selectedParticle?.name === edge.from || selectedParticle?.name === edge.to;

        return (
          <line key={`edge-${idx}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([...fromPos, ...toPos]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={edge.type === 'σ₁' ? '#F0883E' : '#3FB950'}
              transparent
              opacity={isHighlighted ? 0.9 : 0.25}
            />
          </line>
        );
      })}

      {/* Vertices */}
      {PARTICLE_NAMES.map((name) => {
        const pos = vertexPositions[name];
        if (!pos) return null;

        const isHighlighted = hoveredVertex === name || selectedParticle?.name === name;
        const color = PARTICLE_COLORS[name];

        return (
          <group key={name} position={pos}>
            {isHighlighted && (
              <mesh>
                <sphereGeometry args={[0.9]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
              </mesh>
            )}
            <mesh
              onPointerOver={() => setHoveredVertex(name)}
              onPointerOut={() => setHoveredVertex(null)}
            >
              <sphereGeometry args={[0.5]} />
              <meshStandardMaterial
                color={color}
                emissive={isHighlighted ? color : '#000000'}
                emissiveIntensity={isHighlighted ? 0.6 : 0.2}
              />
            </mesh>
            <Text position={[0, 0.9, 0]} fontSize={0.55} color="#FFFFFF" anchorX="center">
              {name}
            </Text>
          </group>
        );
      })}

      {/* Spectrum bar chart on the right */}
      <group position={[12, -2, 0]}>
        <Text position={[0, 8, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">
          Eigenvalues of L:
        </Text>

        {EIGENVALUES.map((ev, i) => {
          const barHeight = ev.value * 1.2;
          const y = i * 1.1;

          return (
            <group key={i} position={[0, 6.5 - y, 0]}>
              {/* Bar */}
              <mesh position={[barHeight / 2 + 1.5, 0, 0]}>
                <boxGeometry args={[barHeight || 0.05, 0.4, 0.2]} />
                <meshStandardMaterial
                  color={ev.color}
                  emissive={ev.color}
                  emissiveIntensity={0.3}
                />
              </mesh>
              {/* Label */}
              <Text position={[0, 0, 0]} fontSize={0.4} color={ev.color} anchorX="left">
                {ev.label}
              </Text>
              {/* Multiplicity */}
              {ev.mult > 1 && (
                <Text position={[barHeight + 2, 0, 0]} fontSize={0.35} color="#6E7681" anchorX="left">
                  ×{ev.mult}
                </Text>
              )}
            </group>
          );
        })}

        {/* Discriminants */}
        <Text position={[0, -4.5, 0]} fontSize={0.5} color="#A371F7" anchorX="left">
          Discriminants: 21 = d₂·L, 5 = N−1
        </Text>
        <Text position={[0, -5.3, 0]} fontSize={0.5} color="#BC8CFF" anchorX="left">
          Both: x² − 5x + p, p ∈ {'{1, 5}'}
        </Text>
      </group>

      {/* Edge legend */}
      <group position={[-12, -4, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Generators:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.45} color="#3FB950" anchorX="left">σ₀: 3-cycles (12 edges)</Text>
        <Text position={[0, 1.5, 0]} fontSize={0.45} color="#F0883E" anchorX="left">σ₁: transpositions (6 edges)</Text>
        <Text position={[0, 0.5, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Face structure (σ∞):</Text>
        <Text position={[0, -0.2, 0]} fontSize={0.45} color="#58A6FF" anchorX="left">Q: (c u b s d t) — 6-cycle</Text>
        <Text position={[0, -0.9, 0]} fontSize={0.45} color="#D29922" anchorX="left">L: (e τ μ) — 3-cycle</Text>
        <Text position={[0, -1.6, 0]} fontSize={0.45} color="#F0883E" anchorX="left">B: (W H) — 2-cycle</Text>
        <Text position={[0, -2.3, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">A: (p) — fixed point</Text>
      </group>
    </group>
  );
}
