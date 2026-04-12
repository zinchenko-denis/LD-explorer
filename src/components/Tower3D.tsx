import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface Tower3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── Tower data ──
const LEVELS = [
  {
    n: 0, label: 'MASS', labelRu: 'МАССЫ', labelZh: '质量',
    cn: 1, cnFrac: '1', sin2: 1/3, sin2Frac: '1/3',
    alien: null, alienLabel: '',
    color: '#3FB950', emissive: '#2D8040',
    status: 'Base level: no correction',
    particles: ['e','u','d','s','c','b','t','μ','τ','p','W','H'],
  },
  {
    n: 1, label: 'CKM', labelRu: 'CKM', labelZh: 'CKM',
    cn: 10/9, cnFrac: '10/9', sin2: 3/10, sin2Frac: '3/10',
    alien: 10, alienLabel: '10',
    color: '#58A6FF', emissive: '#3070CC',
    status: 'λ = 9/40 — Cabibbo angle',
    particles: ['u','d','s','c','b','t'],
  },
  {
    n: 2, label: 'PMNS', labelRu: 'PMNS', labelZh: 'PMNS',
    cn: 13/12, cnFrac: '13/12', sin2: 4/13, sin2Frac: '4/13',
    alien: 13, alienLabel: '13',
    color: '#D29922', emissive: '#997015',
    status: 'sin²θ₁₂ = 4/13 — solar angle',
    particles: ['e','μ','τ'],
  },
  {
    n: 3, label: 'HALT', labelRu: 'HALT', labelZh: 'HALT',
    cn: 17/15, cnFrac: '17/15', sin2: 5/17, sin2Frac: '5/17',
    alien: 17, alienLabel: '17 = d₁⁴+1',
    color: '#F85149', emissive: '#C03030',
    status: 'W₂ = +1 → Fermat wall',
    particles: [],
  },
];

const FLOOR_HEIGHT = 4.5;
const FLOOR_DEPTH = 0.4;
const BASE_WIDTH = 8;

// ── Floor platform ──
function FloorPlatform({ level, y, hovered, onHover, onUnhover }: {
  level: typeof LEVELS[0];
  y: number;
  hovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const width = BASE_WIDTH * level.cn;
  const isHalt = level.n === 3;

  useFrame((state) => {
    if (meshRef.current) {
      const glow = hovered ? 0.4 : 0.15;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = glow + Math.sin(state.clock.elapsedTime * 1.5 + level.n) * 0.05;
    }
  });

  return (
    <group position={[0, y, 0]}>
      {/* Platform slab */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <boxGeometry args={[width, FLOOR_DEPTH, 5]} />
        <meshStandardMaterial
          color={level.color}
          emissive={level.emissive}
          emissiveIntensity={0.15}
          transparent
          opacity={hovered ? 0.9 : 0.7}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Floor label (front face) */}
      <Text
        position={[0, FLOOR_DEPTH / 2 + 0.15, 2.7]}
        fontSize={0.6}
        color={level.color}
        anchorX="center"
        fontWeight={700}
      >
        {level.label}
      </Text>

      {/* C_n value */}
      <Text
        position={[-width / 2 - 0.4, FLOOR_DEPTH / 2 + 0.15, 0]}
        fontSize={0.35}
        color="#8B949E"
        anchorX="right"
        fontWeight={500}
      >
        {`C${level.n} = ${level.cnFrac}`}
      </Text>

      {/* sin²θ₁₂ */}
      <Text
        position={[width / 2 + 0.4, FLOOR_DEPTH / 2 + 0.15, 0]}
        fontSize={0.35}
        color="#8B949E"
        anchorX="left"
        fontWeight={500}
      >
        {`sin²θ = ${level.sin2Frac}`}
      </Text>

      {/* Alien prime (floating, glowing) */}
      {level.alien && (
        <group position={[width / 2 + 1.5, 1.5, 0]}>
          <Text
            fontSize={1.0}
            color="#F0883E"
            anchorX="center"
            fontWeight={700}
          >
            {level.alienLabel}
          </Text>
          {/* Glow sphere behind alien number */}
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#F0883E" transparent opacity={0.06} />
          </mesh>
        </group>
      )}

      {/* HALT barrier at top */}
      {isHalt && (
        <group>
          {/* Ceiling/barrier */}
          <mesh position={[0, FLOOR_HEIGHT - 0.5, 0]}>
            <boxGeometry args={[width * 1.1, 0.2, 5.5]} />
            <meshStandardMaterial
              color="#F85149"
              emissive="#F85149"
              emissiveIntensity={0.3}
              transparent
              opacity={0.5}
            />
          </mesh>
          {/* HALT cross bars */}
          {[-2, 0, 2].map(z => (
            <mesh key={z} position={[0, FLOOR_HEIGHT * 0.5, z]}>
              <boxGeometry args={[width * 1.1, 0.08, 0.08]} />
              <meshStandardMaterial color="#F85149" emissive="#F85149" emissiveIntensity={0.5} />
            </mesh>
          ))}
          <Text
            position={[0, FLOOR_HEIGHT - 0.8, 2.8]}
            fontSize={0.5}
            color="#F85149"
            anchorX="center"
            fontWeight={700}
          >
            W₂ = +1 → FERMAT WALL
          </Text>
        </group>
      )}

      {/* Pillars to next floor (except HALT) */}
      {!isHalt && (
        <>
          {[[-width/2 + 0.3, -2], [-width/2 + 0.3, 2], [width/2 - 0.3, -2], [width/2 - 0.3, 2]].map(([px, pz], i) => (
            <mesh key={i} position={[px, FLOOR_HEIGHT / 2, pz]}>
              <cylinderGeometry args={[0.06, 0.06, FLOOR_HEIGHT - FLOOR_DEPTH, 8]} />
              <meshStandardMaterial
                color={level.color}
                emissive={level.emissive}
                emissiveIntensity={0.1}
                transparent
                opacity={0.3}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 2.5, 3]}>
          <div style={{
            background: 'rgba(13,17,23,0.95)',
            border: `1px solid ${level.color}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            color: '#E6EDF3',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: `0 0 15px ${level.color}40`,
          }}>
            <div style={{ fontWeight: 700, color: level.color, fontSize: 14 }}>
              Level n = {level.n}: {level.label}
            </div>
            <div style={{ color: '#8B949E', marginTop: 4 }}>
              C_{level.n} = {level.cnFrac} = {level.cn.toFixed(6)}
            </div>
            <div style={{ color: '#8B949E' }}>
              sin²θ₁₂({level.n}) = {level.sin2Frac} = {level.sin2.toFixed(6)}
            </div>
            {level.alien && (
              <div style={{ color: '#F0883E', marginTop: 4 }}>
                Alien prime: {level.alienLabel}
              </div>
            )}
            <div style={{ color: '#6E7681', marginTop: 4, fontSize: 11 }}>
              {level.status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Particle sphere on a level ──
function LevelParticle({ name, position, color }: { name: string; position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0] * 2) * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      <Text
        position={[position[0], position[1] - 0.35, position[2]]}
        fontSize={0.22}
        color={color}
        anchorX="center"
        fontWeight={600}
      >
        {name}
      </Text>
    </group>
  );
}

// ── Vertical sin²θ scale ──
function SinScale({ levels }: { levels: typeof LEVELS }) {
  const xPos = -7;
  return (
    <group position={[xPos, 0, 0]}>
      {/* Vertical line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -1, 0, 0, levels.length * FLOOR_HEIGHT + 1, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#6E7681" transparent opacity={0.4} />
      </line>

      {/* Scale label */}
      <Text position={[0, levels.length * FLOOR_HEIGHT + 2, 0]} fontSize={0.35} color="#8B949E" anchorX="center">
        sin²θ₁₂(n)
      </Text>

      {/* Tick marks for each level */}
      {levels.map((lv, i) => {
        const y = i * FLOOR_HEIGHT + FLOOR_DEPTH / 2 + 0.3;
        // Map sin²θ to horizontal position
        const barLen = lv.sin2 * 6;
        return (
          <group key={lv.n} position={[0, y, 0]}>
            <mesh position={[barLen / 2, 0, 0]}>
              <boxGeometry args={[barLen, 0.15, 0.15]} />
              <meshStandardMaterial
                color={lv.color}
                emissive={lv.emissive}
                emissiveIntensity={0.3}
              />
            </mesh>
            <Text position={[barLen + 0.3, 0, 0]} fontSize={0.25} color={lv.color} anchorX="left">
              {lv.sin2Frac}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ── Particle color mapping ──
function particleColor(name: string): string {
  const map: Record<string, string> = {
    u: '#58A6FF', d: '#3FB950', s: '#3FB950', c: '#58A6FF', b: '#3FB950', t: '#58A6FF',
    e: '#D29922', μ: '#D29922', τ: '#D29922',
    W: '#F0883E', H: '#A371F7', p: '#FF6B9D',
  };
  return map[name] || '#8B949E';
}

// ── Main component ──
export function Tower3D({ selectedParticle: _sp, onSelectParticle: _osp }: Tower3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, LEVELS.length * FLOOR_HEIGHT + 3, 0]} fontSize={1.1} color="#D29922" anchorX="center" fontWeight={700}>
        Correction Tower
      </Text>
      <Text position={[0, LEVELS.length * FLOOR_HEIGHT + 1.8, 0]} fontSize={0.5} color="#8B949E" anchorX="center">
        C_n = {'{'} 1, 10/9, 13/12, 17/15 {'}'} — Catalan staircase
      </Text>

      {/* Floor platforms */}
      {LEVELS.map((level, i) => (
        <FloorPlatform
          key={level.n}
          level={level}
          y={i * FLOOR_HEIGHT}
          hovered={hoveredLevel === i}
          onHover={() => setHoveredLevel(i)}
          onUnhover={() => setHoveredLevel(null)}
        />
      ))}

      {/* Particles floating on CKM level */}
      {LEVELS[1].particles.map((name, j) => {
        const angle = (j / LEVELS[1].particles.length) * Math.PI * 2;
        const r = 2.5;
        return (
          <LevelParticle
            key={`ckm-${name}`}
            name={name}
            position={[Math.cos(angle) * r, 1 * FLOOR_HEIGHT + 1.2, Math.sin(angle) * r]}
            color={particleColor(name)}
          />
        );
      })}

      {/* Particles floating on PMNS level */}
      {LEVELS[2].particles.map((name, j) => {
        const angle = (j / LEVELS[2].particles.length) * Math.PI * 2 + 0.5;
        const r = 2;
        return (
          <LevelParticle
            key={`pmns-${name}`}
            name={name}
            position={[Math.cos(angle) * r, 2 * FLOOR_HEIGHT + 1.2, Math.sin(angle) * r]}
            color={particleColor(name)}
          />
        );
      })}

      {/* sin²θ vertical scale */}
      <SinScale levels={LEVELS} />

      {/* Info panels */}
      <Html position={[7, 6, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 220,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#D29922', fontSize: 13 }}>
            Tower Ratios
          </div>
          <div style={{ color: '#8B949E', marginBottom: 4 }}>
            θ₁₃: L / d₁² = 7/4
          </div>
          <div style={{ color: '#8B949E', marginBottom: 8 }}>
            θ₁₂: det²_M / (d₁d₂(N−1)²) = 169/150
          </div>
          <div style={{ borderTop: '1px solid #30363D', paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: '#F0883E', fontWeight: 600, fontSize: 11 }}>
              Alien primes at Fermat positions
            </div>
            <div style={{ color: '#8B949E', fontSize: 11, marginTop: 4 }}>
              10 = 2·5, 13 = det_M, 17 = d₁⁴+1
            </div>
            <div style={{ color: '#F85149', fontSize: 11, marginTop: 4 }}>
              17 = last Fermat prime reachable
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
