import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface CRTGridProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// P^1(F_2) = {inf, 0, 1} (3 points)
const P1_F2 = ['inf_2', '0_2', '1_2'];
// P^1(F_3) = {inf, 0, 1, 2} (4 points)
const P1_F_3 = ['inf_3', '0_3', '1_3', '2_3'];

// CRT isomorphism: 12 bijective cells (companion C.7)
// Each particle appears exactly once in the 3x4 grid
// Column sums (n): 6=N, 16=d₁⁴, 12=index, 10=|B₁|
// Row sums (n): 15=d₂(d₁+d₂), 11=dim M₁₀, 18=d₂·N
const CRT_CELLS = [
  // Row 0 (x₂ = ∞)
  { f2: 0, f3: 0, particle: 'u',   z6: '(∞,∞)', label: '(∞,∞)', color: '#58A6FF', n: 1 },
  { f2: 0, f3: 1, particle: 'H',   z6: '(∞,0)', label: '(∞,0)', color: '#A371F7', n: 6 },
  { f2: 0, f3: 2, particle: 'b',   z6: '(∞,1)', label: '(∞,1)', color: '#3FB950', n: 5 },
  { f2: 0, f3: 3, particle: 's',   z6: '(∞,2)', label: '(∞,2)', color: '#3FB950', n: 3 },
  // Row 1 (x₂ = 0)
  { f2: 1, f3: 0, particle: 'tau', z6: '(0,∞)', label: '(0,∞)', color: '#D29922', n: 4 },
  { f2: 1, f3: 1, particle: 'p',   z6: '(0,0)', label: '(0,0)', color: '#FF6B9D', n: 4 },
  { f2: 1, f3: 2, particle: 'e',   z6: '(0,1)', label: '(0,1)', color: '#D29922', n: 0 },
  { f2: 1, f3: 3, particle: 'mu',  z6: '(0,2)', label: '(0,2)', color: '#D29922', n: 3 },
  // Row 2 (x₂ = 1)
  { f2: 2, f3: 0, particle: 'd',   z6: '(1,∞)', label: '(1,∞)', color: '#3FB950', n: 1 },
  { f2: 2, f3: 1, particle: 'W',   z6: '(1,0)', label: '(1,0)', color: '#F0883E', n: 6 },
  { f2: 2, f3: 2, particle: 't',   z6: '(1,1)', label: '(1,1)', color: '#58A6FF', n: 7 },
  { f2: 2, f3: 3, particle: 'c',   z6: '(1,2)', label: '(1,2)', color: '#58A6FF', n: 4 },
];

export function CRTGrid({ selectedParticle, onSelectParticle }: CRTGridProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [waveCell, setWaveCell] = useState(-1);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
    }
    // Sequential cell highlight wave
    const idx = Math.floor(state.clock.elapsedTime / 0.5) % (CRT_CELLS.length + 4);
    if (idx !== waveCell) setWaveCell(idx);
  });

  const isCellHighlighted = (cellParticle: string) => {
    return selectedParticle?.name === cellParticle;
  };

  const isCellWave = (idx: number) => idx === waveCell || idx === waveCell - 1;

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 12, 0]} fontSize={1.5} color="#58A6FF" anchorX="center" anchorY="middle">
        CRT Decomposition
      </Text>
      <Text position={[0, 10, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        P^1(Z/6Z) ≅ P^1(F_2) × P^1(F_3)
      </Text>
      <Text position={[0, 8.5, 0]} fontSize={0.6} color="#6E7681" anchorX="center" anchorY="middle">
        12 bijective cells (3×4 grid)
      </Text>

      {/* Grid */}
      <group position={[-5, -3, 0]}>
        {/* Column headers (P^1(F_3)) */}
        {P1_F_3.map((f3, j) => (
          <Text
            key={`col-${j}`}
            position={[j * 3 + 1.5, 10, 0]}
            fontSize={0.7}
            color="#F0883E"
            anchorX="center"
            anchorY="middle"
          >
            {f3}
          </Text>
        ))}

        {/* Row headers (P^1(F_2)) */}
        {P1_F2.map((f2, i) => (
          <Text
            key={`row-${i}`}
            position={[-2, (2 - i) * 3 + 1.5, 0]}
            fontSize={0.7}
            color="#3FB950"
            anchorX="center"
            anchorY="middle"
          >
            {f2}
          </Text>
        ))}

        {/* Grid cells - 12 bijective cells */}
        {CRT_CELLS.map((cell, idx) => {
          const x = cell.f3 * 3 + 1.5;
          const y = (2 - cell.f2) * 3 + 1.5;
          const isHighlighted = isCellHighlighted(cell.particle);
          const isHovered = hoveredCell === `${cell.f2}-${cell.f3}`;
          const isWave = isCellWave(idx);

          return (
            <group key={idx} position={[x, y, 0]}>
              {/* Cell background */}
              <mesh
                onPointerOver={() => setHoveredCell(`${cell.f2}-${cell.f3}`)}
                onPointerOut={() => setHoveredCell(null)}
                onClick={() => {
                  if (onSelectParticle) {
                    const p: Particle = {
                      name: cell.particle,
                      n: parseInt(cell.z6) || 0,
                      K: 1,
                      mass: 0,
                      type: cell.color === '#58A6FF' ? 'quark-up' : 
                            cell.color === '#3FB950' ? 'quark-down' :
                            cell.color === '#D29922' ? 'lepton' :
                            cell.color === '#F0883E' ? 'boson' :
                            cell.color === '#A371F7' ? 'boson' : 'anchor',
                    };
                    onSelectParticle(p);
                  }
                }}
              >
                <boxGeometry args={[2.5, 2.5, 0.3]} />
                <meshStandardMaterial
                  color={cell.color}
                  emissive={isHighlighted || isHovered || isWave ? cell.color : '#000000'}
                  emissiveIntensity={isHighlighted ? 0.6 : isWave ? 0.5 : isHovered ? 0.4 : 0.2}
                  transparent
                  opacity={0.95}
                />
              </mesh>

              {/* Z/6Z label */}
              <Text
                position={[0, 0.6, 0.2]}
                fontSize={0.7}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
              >
                {cell.label}
              </Text>

              {/* Particle name */}
              <Text
                position={[0, -0.4, 0.2]}
                fontSize={0.6}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
              >
                {cell.particle}
              </Text>

              {/* Highlight border */}
              {(isHighlighted || isHovered) && (
                <mesh position={[0, 0, 0.2]}>
                  <ringGeometry args={[1.3, 1.4, 32]} />
                  <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} />
                </mesh>
              )}

              {/* Tooltip */}
              {isHovered && (
                <Html position={[1.5, 1.5, 0]}>
                  <div className="bg-[#161B22] border border-[#30363D] rounded px-2 py-1 text-xs">
                    <div className="text-[#E6EDF3]">Particle: {cell.particle}</div>
                    <div className="text-[#58A6FF]">P^1(Z/6Z): {cell.z6}</div>
                    <div className="text-[#3FB950]">P^1(F_2): {P1_F2[cell.f2]}</div>
                    <div className="text-[#F0883E]">P^1(F_3): {P1_F_3[cell.f3]}</div>
                  </div>
                </Html>
              )}
            </group>
          );
        })}

        {/* Grid lines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={`h-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, i * 3, 0, 12, i * 3, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#30363D" transparent opacity={0.3} />
          </line>
        ))}
        {Array.from({ length: 5 }).map((_, j) => (
          <line key={`v-${j}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([j * 3, 0, 0, j * 3, 9, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#30363D" transparent opacity={0.3} />
          </line>
        ))}
      </group>

      {/* Legend */}
      <group position={[10, 7, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">CRT Isomorphism:</Text>
        <Text position={[0, 3.2, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Z/6Z ≅ Z/2Z × Z/3Z</Text>
        <Text position={[0, 2.5, 0]} fontSize={0.5} color="#6E7681" anchorX="left">(Chinese Remainder Theorem)</Text>
        
        <Text position={[0, 1.5, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Grid Size:</Text>
        <Text position={[0, 0.8, 0]} fontSize={0.5} color="#3FB950" anchorX="left">|P^1(F_2)| = 3</Text>
        <Text position={[0, 0.2, 0]} fontSize={0.5} color="#F0883E" anchorX="left">|P^1(F_3)| = 4</Text>
        <Text position={[0, -0.4, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">Total: 3 × 4 = 12 cells</Text>
        <Text position={[0, -1.2, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Each particle: exactly 1 cell</Text>
      </group>

      {/* Particle type legend */}
      <group position={[10, 0, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Particle Types:</Text>
        <Text position={[0, 3.2, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">■ Quarks (u, c, t)</Text>
        <Text position={[0, 2.6, 0]} fontSize={0.5} color="#3FB950" anchorX="left">■ Quarks (d, s, b)</Text>
        <Text position={[0, 2, 0]} fontSize={0.5} color="#D29922" anchorX="left">■ Leptons (e, μ, τ)</Text>
        <Text position={[0, 1.4, 0]} fontSize={0.5} color="#F0883E" anchorX="left">■ Bosons (W)</Text>
        <Text position={[0, 0.8, 0]} fontSize={0.5} color="#A371F7" anchorX="left">■ Bosons (H)</Text>
        <Text position={[0, 0.2, 0]} fontSize={0.5} color="#FF6B9D" anchorX="left">■ Anchor (p)</Text>
      </group>

      {/* Mathematical note */}
      <group position={[-12, -10, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Column Sums (n):</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">Col 0: 9, Col 1: 10, Col 2: 12, Col 3: 13</Text>
        <Text position={[0, 1.5, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Row Sums (ℓ):</Text>
        <Text position={[0, 0.7, 0]} fontSize={0.5} color="#3FB950" anchorX="left">All rows = 13 = d₁² + d₂²</Text>
        <Text position={[0, 0, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Each particle maps to exactly one cell</Text>
      </group>
    </group>
  );
}
