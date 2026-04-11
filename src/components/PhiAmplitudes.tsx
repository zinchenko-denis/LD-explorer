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
// Eigenvalue: λ = (5+√5)/2 = φ + 2 = φ² + 1
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

export function PhiAmplitudes({ selectedParticle, onSelectParticle }: PhiAmplitudesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const timeRef = useRef(0);

  const handleClick = (name: string) => {
    if (onSelectParticle) {
      onSelectParticle({ name, n: 0, K: 1, mass: 0, type: 'quark-up' });
    }
  };

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
        Golden ratio hierarchy: 0 : 1/phi : 1 : phi | Norm = sqrt(|B1|) = sqrt(10)
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
                onClick={() => handleClick(p.name)}
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
                  onClick={() => handleClick(p.name)}
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
                    p.tier === 1 ? '1/(phi*sqrt10)' :
                    p.tier === 2 ? '1/sqrt10' : 'phi/sqrt10'
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
        { tier: 1, y: (1 / (PHI * SQRT10)) * 18 - 3, label: '1/(phi*sqrt10)', color: '#3FB950' },
        { tier: 2, y: (1 / SQRT10) * 18 - 3, label: '1/sqrt10', color: '#D29922' },
        { tier: 3, y: (PHI / SQRT10) * 18 - 3, label: 'phi/sqrt10', color: '#FF6B9D' },
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

      {/* Info panel: left — HTML */}
      <Html position={[-14, 5, 0]} distanceFactor={22}>
        <div style={{ background:'rgba(13,17,23,0.92)', border:'1px solid #30363D', borderRadius:8, padding:'12px 16px', width:220, fontFamily:'system-ui, sans-serif', fontSize:12, color:'#E6EDF3', pointerEvents:'none' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>&phi;-Zero Theorem (D.6)</div>
          <div style={{ color:'#8B949E' }}>Z<sub>&phi;</sub> = BV<sub>0</sub> &cup; &sigma;<sub>1</sub>(BV<sub>0</sub>)</div>
          <div style={{ color:'#8B949E' }}>= &#123;p, c, u, t&#125; exactly</div>
          <div style={{ color:'#6E7681', marginTop:6, fontSize:11 }}>All neighbors of &#123;p,c,u&#125; &isin; Z<sub>&phi;</sub>; for t: v(b)+v(e)=0 forced.</div>
        </div>
      </Html>

      {/* Info panel: right — HTML */}
      <Html position={[14, 5, 0]} distanceFactor={22}>
        <div style={{ background:'rgba(13,17,23,0.92)', border:'1px solid #30363D', borderRadius:8, padding:'12px 16px', width:220, fontFamily:'system-ui, sans-serif', fontSize:12, color:'#E6EDF3', pointerEvents:'none' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Golden Hierarchy</div>
          <div style={{ color:'#8B949E' }}>Ratios: 1 : &phi; : &phi;&sup2;</div>
          <div style={{ color:'#3FB950' }}>&#123;b,e&#125; : &#123;s,&tau;,W,H&#125; : &#123;d,&mu;&#125;</div>
          <div style={{ color:'#FF6B9D', marginTop:4 }}>d-&mu; = max amplitude</div>
          <div style={{ color:'#FF6B9D' }}>&rarr; EWSB + c-&mu; mirror</div>
          <div style={{ color:'#A371F7', marginTop:4 }}>4/13 = full interference</div>
        </div>
      </Html>
    </group>
  );
}
