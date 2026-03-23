import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface PhiAmplitudesProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// Golden ratio φ-eigenvector (companion D.6, S90)
// Eigenvalue: λ = (5+√5)/2 = φ² + 2
// Z_φ = {p, c, u, t} — zero set = BV_anc ∪ σ₁(BV_anc)
// Three amplitude tiers: 0, 1/(φ√10), 1/√10, φ/√10
const PHI = (1 + Math.sqrt(5)) / 2;
const SQRT10 = Math.sqrt(10);

const PHI_DATA = [
  // name, amplitude, tier, face
  { name: 'u', amp: 0, tier: 0, face: 'Q', color: '#58A6FF' },
  { name: 'c', amp: 0, tier: 0, face: 'Q', color: '#58A6FF' },
  { name: 't', amp: 0, tier: 0, face: 'Q', color: '#58A6FF' },
  { name: 'p', amp: 0, tier: 0, face: 'A', color: '#FF6B9D' },
  { name: 'b', amp: 1 / (PHI * SQRT10), tier: 1, face: 'Q', color: '#3FB950' },
  { name: 'e', amp: 1 / (PHI * SQRT10), tier: 1, face: 'L', color: '#D29922' },
  { name: 's', amp: 1 / SQRT10, tier: 2, face: 'Q', color: '#3FB950' },
  { name: 'τ', amp: 1 / SQRT10, tier: 2, face: 'L', color: '#D29922' },
  { name: 'W', amp: 1 / SQRT10, tier: 2, face: 'B', color: '#F0883E' },
  { name: 'H', amp: 1 / SQRT10, tier: 2, face: 'B', color: '#A371F7' },
  { name: 'd', amp: PHI / SQRT10, tier: 3, face: 'Q', color: '#3FB950' },
  { name: 'μ', amp: PHI / SQRT10, tier: 3, face: 'L', color: '#D29922' },
];

// Sort by amplitude for display
const PHI_SORTED = [...PHI_DATA].sort((a, b) => a.amp - b.amp);

export function PhiAmplitudes({ selectedParticle, onSelectParticle: _onSelectParticle }: PhiAmplitudesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.08;
    }
  });

  // 3D bar chart: particles on x, amplitude on y, face on z
  return (
    <group ref={groupRef}>
      <Text position={[0, 11, 0]} fontSize={1.3} color="#BC8CFF" anchorX="center">
        φ-Eigenvector Amplitudes
      </Text>
      <Text position={[0, 9.5, 0]} fontSize={0.6} color="#8B949E" anchorX="center">
        Golden ratio hierarchy: 0 : 1/φ : 1 : φ | Norm = √|B₁| = √10
      </Text>

      {/* Amplitude bars */}
      {PHI_SORTED.map((p, i) => {
        const x = (i - PHI_SORTED.length / 2 + 0.5) * 1.8;
        const barHeight = p.amp * 18;
        const isHighlighted = hoveredBar === p.name || selectedParticle?.name === p.name;
        const isZero = p.tier === 0;

        return (
          <group key={p.name} position={[x, 0, 0]}>
            {/* Bar */}
            {!isZero ? (
              <mesh
                position={[0, barHeight / 2 - 3, 0]}
                onPointerOver={() => setHoveredBar(p.name)}
                onPointerOut={() => setHoveredBar(null)}
              >
                <boxGeometry args={[1.2, barHeight, 1.2]} />
                <meshStandardMaterial
                  color={p.color}
                  emissive={p.color}
                  emissiveIntensity={isHighlighted ? 0.5 : 0.15}
                  transparent
                  opacity={isHighlighted ? 1 : 0.8}
                />
              </mesh>
            ) : (
              /* Zero marker */
              <group position={[0, -3, 0]}>
                <mesh
                  onPointerOver={() => setHoveredBar(p.name)}
                  onPointerOut={() => setHoveredBar(null)}
                >
                  <sphereGeometry args={[0.4]} />
                  <meshStandardMaterial
                    color="#6E7681"
                    emissive={isHighlighted ? '#6E7681' : '#000000'}
                    emissiveIntensity={0.3}
                  />
                </mesh>
                {/* Pulsing ring for zero nodes */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.5, 0.6 + Math.sin(timeRef.current * 2) * 0.1, 32]} />
                  <meshBasicMaterial color="#6E7681" transparent opacity={0.4} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}

            {/* Particle name */}
            <Text position={[0, -4.5, 0]} fontSize={0.7} color={isZero ? '#6E7681' : '#FFFFFF'} anchorX="center">
              {p.name}
            </Text>

            {/* Amplitude value */}
            <Text position={[0, barHeight - 2.5, 0]} fontSize={0.35} color="#8B949E" anchorX="center">
              {isZero ? '0' : p.amp.toFixed(3)}
            </Text>

            {/* Tooltip */}
            {hoveredBar === p.name && (
              <Html position={[0, barHeight - 1, 0]}>
                <div className="bg-[#161B22] border border-[#30363D] rounded px-2 py-1 text-xs whitespace-nowrap">
                  <div className="text-[#E6EDF3] font-bold">{p.name}</div>
                  <div className="text-[#8B949E]">|v| = {isZero ? '0 (Z_φ)' : p.amp.toFixed(4)}</div>
                  <div className="text-[#58A6FF]">Tier {p.tier}: {
                    p.tier === 0 ? '0' :
                    p.tier === 1 ? '1/(φ√10)' :
                    p.tier === 2 ? '1/√10' : 'φ/√10'
                  }</div>
                  <div className="text-[#6E7681]">Face: {p.face}</div>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Tier lines (horizontal reference) */}
      {[
        { tier: 1, y: (1 / (PHI * SQRT10)) * 18 - 3, label: '1/(φ√10)', color: '#3FB950' },
        { tier: 2, y: (1 / SQRT10) * 18 - 3, label: '1/√10', color: '#D29922' },
        { tier: 3, y: (PHI / SQRT10) * 18 - 3, label: 'φ/√10', color: '#FF6B9D' },
      ].map((tier) => (
        <group key={tier.tier}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-12, tier.y, 0, 12, tier.y, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={tier.color} transparent opacity={0.3} />
          </line>
          <Text position={[13, tier.y, 0]} fontSize={0.45} color={tier.color} anchorX="left">
            {tier.label}
          </Text>
        </group>
      ))}

      {/* Zero baseline */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-12, -3, 0, 12, -3, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#6E7681" transparent opacity={0.5} />
      </line>

      {/* Info panel: left */}
      <group position={[-14, 5, 0]}>
        <Text position={[0, 2.5, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">φ-Zero Theorem (D.6):</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Z_φ = BV₀ ∪ σ₁(BV₀)</Text>
        <Text position={[0, 1.1, 0]} fontSize={0.45} color="#6E7681" anchorX="left">= {'{p, c, u, t}'} exactly</Text>
        <Text position={[0, 0.3, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Proof: all neighbors of</Text>
        <Text position={[0, -0.3, 0]} fontSize={0.45} color="#6E7681" anchorX="left">{'{p,c,u}'} ∈ Z_φ; for t:</Text>
        <Text position={[0, -0.9, 0]} fontSize={0.45} color="#6E7681" anchorX="left">v(b)+v(e) = 0 forced.</Text>
      </group>

      {/* Info panel: right */}
      <group position={[14, 5, 0]}>
        <Text position={[0, 2.5, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Golden Hierarchy:</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Ratios: 1 : φ : φ²</Text>
        <Text position={[0, 1.1, 0]} fontSize={0.45} color="#3FB950" anchorX="left">{'{b,e}'} : {'{s,τ,W,H}'} : {'{d,μ}'}</Text>
        <Text position={[0, 0.3, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">d-μ = max amplitude</Text>
        <Text position={[0, -0.3, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">→ EWSB + c-μ mirror</Text>
        <Text position={[0, -1.1, 0]} fontSize={0.45} color="#A371F7" anchorX="left">4/13 = full interference</Text>
        <Text position={[0, -1.7, 0]} fontSize={0.45} color="#A371F7" anchorX="left">(no partial sum works)</Text>
      </group>
    </group>
  );
}
