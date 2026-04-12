import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface Summary3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── Tier A predictions (18 stars) ──
interface Prediction {
  name: string;
  value: string;
  pull: number;
  group: 'PMNS' | 'CKM' | 'EW' | 'Mass' | 'Fund';
  note?: string;
}

const GROUP_COLORS: Record<string, string> = {
  PMNS: '#D29922',
  CKM: '#58A6FF',
  EW: '#BC8CFF',
  Mass: '#3FB950',
  Fund: '#FF6B9D',
};

const PREDICTIONS: Prediction[] = [
  { name: 'sin2θ12', value: '4/13', pull: 0.17, group: 'PMNS' },
  { name: 'sin2θ23', value: '81/145', pull: -0.16, group: 'PMNS', note: 'IC23+SK' },
  { name: 'sin2θ13', value: '2/91', pull: 0.90, group: 'PMNS' },
  { name: 'sinδ_CP', value: '−1', pull: 0.0, group: 'PMNS' },
  { name: 'λ', value: '9/40', pull: -0.04, group: 'CKM' },
  { name: 'A', value: '3/√13', pull: 0.63, group: 'CKM' },
  { name: 'γ', value: 'arctan(9/4)', pull: -1.25, group: 'CKM' },
  { name: 'R_b', value: '√(3/20)', pull: 0.13, group: 'CKM' },
  { name: 'sin2θ_W', value: '3/13', pull: 1.9, group: 'EW' },
  { name: 'α^-1', value: '137.036...', pull: -1.20, group: 'Fund' },
  { name: 'μ = m_p/m_e', value: '6π5(1+...)', pull: 0.001, group: 'Fund' },
  { name: 'm_u/m_d', value: 'LD ratio', pull: 0.5, group: 'Mass' },
  { name: 'm_c/m_s', value: 'LD ratio', pull: 0.3, group: 'Mass' },
  { name: 'm_t/m_b', value: 'LD ratio', pull: 0.8, group: 'Mass' },
  { name: 'm_μ/m_e', value: 'g3·K_μ/K_e', pull: 0.2, group: 'Mass' },
  { name: 'm_τ/m_μ', value: 'g·K_τ/K_μ', pull: 0.4, group: 'Mass' },
  { name: 'G_F', value: 'from μ+α', pull: 0.3, group: 'Fund' },
  { name: 'σ_πN', value: 'm_p/d14', pull: 0.7, group: 'Mass' },
];

// Place stars in 3D around a sphere
const STAR_POSITIONS: [number, number, number][] = PREDICTIONS.map((_, i) => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const theta = Math.acos(1 - 2 * (i + 0.5) / PREDICTIONS.length);
  const phi = goldenAngle * i;
  const r = 7;
  return [
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(theta),
  ];
});

// ── Star component ──
function Star({ prediction, position, hovered, onHover, onUnhover }: {
  prediction: Prediction;
  position: [number, number, number];
  hovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = GROUP_COLORS[prediction.group];
  const brightness = prediction.pull === 0 ? 2.0 : Math.min(2.0, 1.0 / (Math.abs(prediction.pull) + 0.1));
  const baseRadius = 0.2 + brightness * 0.15;

  useFrame((state) => {
    if (meshRef.current) {
      const twinkle = 1 + Math.sin(state.clock.elapsedTime * 3 + position[0] * 5) * 0.15;
      meshRef.current.scale.setScalar(hovered ? 1.8 : twinkle);
    }
  });

  return (
    <group position={position}>
      {/* Star core */}
      <mesh
        ref={meshRef}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <sphereGeometry args={[baseRadius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : brightness * 0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[baseRadius * 2.5, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.12 : brightness * 0.04}
        />
      </mesh>

      {/* Label (always visible for hovered, faint otherwise) */}
      {hovered && (
        <>
          <Text
            position={[0, baseRadius + 0.5, 0]}
            fontSize={0.4}
            color={color}
            anchorX="center"
            fontWeight={700}
          >
            {prediction.name}
          </Text>
          <Html position={[0, baseRadius + 1.5, 0]}>
            <div style={{
              background: 'rgba(13,17,23,0.95)',
              border: `1px solid ${color}`,
              borderRadius: 8,
              padding: '8px 12px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 12,
              color: '#E6EDF3',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: `0 0 12px ${color}40`,
            }}>
              <div style={{ fontWeight: 700, color }}>{prediction.name}</div>
              <div style={{ color: '#8B949E', marginTop: 3, fontFamily: 'monospace' }}>
                LD: {prediction.value}
              </div>
              <div style={{ color: '#D29922', marginTop: 3, fontFamily: 'monospace' }}>
                pull: {prediction.pull === 0 ? 'exact' : `${prediction.pull > 0 ? '+' : ''}${prediction.pull}σ`}
              </div>
              {prediction.note && (
                <div style={{ color: '#6E7681', marginTop: 3, fontSize: 10 }}>
                  {prediction.note}
                </div>
              )}
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// ── Central "0" monument ──
function ZeroCenter() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={ref}>
      {/* Octahedron */}
      <mesh>
        <octahedronGeometry args={[1.0]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.4}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Inner solid */}
      <mesh>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* "0" label */}
      <Text position={[0, 1.5, 0]} fontSize={0.7} color="#FFD700" anchorX="center" fontWeight={700}>
        0
      </Text>
      <Text position={[0, -1.5, 0]} fontSize={0.3} color="#8B949E" anchorX="center">
        free parameters
      </Text>
    </group>
  );
}

// ── Connection lines from center to stars ──
function StarConnections({ starPositions }: { starPositions: [number, number, number][] }) {
  const lines = useMemo(() => {
    return starPositions.map(pos => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, ...pos], 3));
      const mat = new THREE.LineBasicMaterial({ color: '#30363D', transparent: true, opacity: 0.08 });
      return new THREE.Line(geo, mat);
    });
  }, [starPositions]);

  return (
    <>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </>
  );
}

// ── Main component ──
export function Summary3D({ selectedParticle: _sp, onSelectParticle: _osp }: Summary3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 12, 0]} fontSize={1.1} color="#FFD700" anchorX="center" fontWeight={700}>
        1728: Prediction Constellation
      </Text>
      <Text position={[0, 10.8, 0]} fontSize={0.5} color="#8B949E" anchorX="center">
        18 Tier A · 0 free · 58+ observables · Cosmonautics Day 2026
      </Text>

      {/* Central zero monument */}
      <ZeroCenter />

      {/* Faint connection lines */}
      <StarConnections starPositions={STAR_POSITIONS} />

      {/* Prediction stars */}
      {PREDICTIONS.map((pred, i) => (
        <Star
          key={pred.name}
          prediction={pred}
          position={STAR_POSITIONS[i]}
          hovered={hoveredStar === i}
          onHover={() => setHoveredStar(i)}
          onUnhover={() => setHoveredStar(null)}
        />
      ))}

      {/* Legend */}
      <Html position={[-14, 3, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 180,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Sectors</div>
          {Object.entries(GROUP_COLORS).map(([group, color]) => (
            <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
              <span style={{ color }}>{group}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #30363D', paddingTop: 6, marginTop: 6, color: '#8B949E', fontSize: 10 }}>
            Brightness proportional to 1/|pull|
          </div>
        </div>
      </Html>

      {/* Scorecard */}
      <Html position={[14, 3, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #FFD700',
          borderRadius: 10,
          padding: '14px 18px',
          width: 200,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#E6EDF3',
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(255,215,0,0.1)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#FFD700', fontSize: 14 }}>
            1728 Scorecard
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#3FB950', fontSize: 24, fontWeight: 700 }}>18</div>
              <div style={{ color: '#8B949E', fontSize: 10 }}>Tier A</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#FFD700', fontSize: 24, fontWeight: 700 }}>0</div>
              <div style={{ color: '#8B949E', fontSize: 10 }}>Free params</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#58A6FF', fontSize: 24, fontWeight: 700 }}>58+</div>
              <div style={{ color: '#8B949E', fontSize: 10 }}>Observables</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#BC8CFF', fontSize: 24, fontWeight: 700 }}>508</div>
              <div style={{ color: '#8B949E', fontSize: 10 }}>Checks</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #30363D', paddingTop: 6, marginTop: 8, color: '#8B949E', fontSize: 10, textAlign: 'center' }}>
            508/508 consistency checks
          </div>
        </div>
      </Html>
    </group>
  );
}
