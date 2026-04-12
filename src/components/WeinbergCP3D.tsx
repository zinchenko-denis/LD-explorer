import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface WeinbergCP3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── Data ──
const SIN2_TW = 3 / 13;      // 0.23077 (tree)
// NLO: 0.23122 (displayed in pull summary)
const DELTA_CP = 270;          // degrees, sinδ = −1

// |U|2 matrix (CR PMNS)
const U2 = [
  [801/1183, 356/1183, 2/91],
  [24754/171535, 53064/171535, 7209/13195],
  [30636/171535, 66851/171535, 5696/13195],
];
const U2_FRAC = [
  ['801/1183', '356/1183', '2/91'],
  ['24754/171535', '53064/171535', '7209/13195'],
  ['30636/171535', '66851/171535', '5696/13195'],
];
const ROW_LABELS = ['e', 'μ', 'τ'];
const COL_LABELS = ['ν1', 'ν2', 'ν3'];
const ROW_COLORS = ['#D29922', '#A371F7', '#FF6B9D'];

// Jarlskog
const J_ABS = 0.0332;

// Pull data
const PULLS = [
  { param: 'sin2θ_W', frac: '3/13', nlo: 'NLO: 0.23122', pull: '+1.9σ', color: '#BC8CFF' },
  { param: 'sin2θ12', frac: '4/13', nlo: '0.30769', pull: '+0.17σ', color: '#D29922' },
  { param: 'sin2θ23', frac: '81/145', nlo: '0.55862', pull: '−0.16σ', color: '#D29922' },
  { param: 'sin2θ13', frac: '2/91', nlo: '0.02198', pull: '+0.90σ', color: '#D29922' },
  { param: 'sinδ', frac: '−1', nlo: 'δ = 270°', pull: 'maximal', color: '#F85149' },
];

// ── Bloch-style sphere showing (sin2θ_W, δ) ──
function WeinbergSphere() {
  const sphereRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Mesh>(null);

  // Map sin2θ_W to polar angle θ: θ_sphere = π * sin2θ_W (0→north, 0.5→equator)
  // Map δ_CP to azimuthal angle: φ = δ * π/180
  const theta = Math.PI * SIN2_TW; // ≈ 0.725 rad
  const phi = DELTA_CP * Math.PI / 180; // = 3π/2

  const R = 3;
  const markerX = R * Math.sin(theta) * Math.cos(phi);
  const markerY = R * Math.cos(theta);
  const markerZ = R * Math.sin(theta) * Math.sin(phi);

  useFrame((state) => {
    if (markerRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      markerRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={sphereRef} position={[-6, 2, 0]}>
      {/* Wireframe sphere */}
      <mesh>
        <sphereGeometry args={[R, 32, 24]} />
        <meshStandardMaterial
          color="#58A6FF"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Solid transparent sphere */}
      <mesh>
        <sphereGeometry args={[R - 0.01, 32, 24]} />
        <meshStandardMaterial
          color="#0D1117"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R - 0.02, R + 0.02, 64]} />
        <meshBasicMaterial color="#6E7681" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Meridian ring at δ = 270° */}
      <mesh rotation={[0, DELTA_CP * Math.PI / 180, 0]}>
        <ringGeometry args={[R - 0.02, R + 0.02, 64]} />
        <meshBasicMaterial color="#F85149" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* LD prediction marker */}
      <mesh ref={markerRef} position={[markerX, markerY, markerZ]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#BC8CFF"
          emissive="#BC8CFF"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Glow around marker */}
      <mesh position={[markerX, markerY, markerZ]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#BC8CFF" transparent opacity={0.1} />
      </mesh>

      {/* Axis labels */}
      <Text position={[0, R + 0.6, 0]} fontSize={0.3} color="#8B949E" anchorX="center">
        sin2θ_W = 0
      </Text>
      <Text position={[0, -R - 0.6, 0]} fontSize={0.3} color="#8B949E" anchorX="center">
        sin2θ_W = 1
      </Text>
      <Text position={[R + 0.5, -0.3, 0]} fontSize={0.25} color="#F85149" anchorX="left">
        δ = 0°
      </Text>
      <Text position={[0, -0.3, R + 0.5]} fontSize={0.25} color="#F85149" anchorX="left">
        δ = 90°
      </Text>

      {/* Sphere title */}
      <Text position={[0, R + 1.5, 0]} fontSize={0.5} color="#BC8CFF" anchorX="center" fontWeight={700}>
        EW + CP Sector
      </Text>

      {/* Marker label */}
      <Text position={[markerX + 0.5, markerY + 0.4, markerZ]} fontSize={0.25} color="#BC8CFF" anchorX="left">
        3/13, δ=270°
      </Text>
    </group>
  );
}

// ── |U|2 unitarity cube ──
function UnitarityCube({ hovered, onHover, onUnhover }: {
  hovered: number | null;
  onHover: (idx: number) => void;
  onUnhover: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const blockSize = 1.6;
  const gap = 0.15;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[5, 0, 0]}>
      <Text position={[0, 5.5, 0]} fontSize={0.5} color="#D29922" anchorX="center" fontWeight={700}>
        |U|2 PMNS Matrix
      </Text>
      <Text position={[0, 4.8, 0]} fontSize={0.3} color="#8B949E" anchorX="center">
        Height proportional to value
      </Text>

      {/* Column labels */}
      {COL_LABELS.map((label, j) => (
        <Text
          key={label}
          position={[(j - 1) * (blockSize + gap), 4.2, 0]}
          fontSize={0.3}
          color="#8B949E"
          anchorX="center"
        >
          {label}
        </Text>
      ))}

      {/* Row labels */}
      {ROW_LABELS.map((label, i) => (
        <Text
          key={label}
          position={[-1 * (blockSize + gap) - 1, (2 - i) * (blockSize + gap) + 0.5, 0]}
          fontSize={0.35}
          color={ROW_COLORS[i]}
          anchorX="center"
          fontWeight={700}
        >
          {label}
        </Text>
      ))}

      {/* 3×3 blocks */}
      {U2.map((row, i) =>
        row.map((val, j) => {
          const idx = i * 3 + j;
          const height = val * 4; // Scale height
          const x = (j - 1) * (blockSize + gap);
          const y = (2 - i) * (blockSize + gap);
          const isHovered = hovered === idx;

          return (
            <group key={idx} position={[x, y, 0]}>
              <mesh
                position={[0, height / 2 - 0.5, 0]}
                onPointerOver={() => onHover(idx)}
                onPointerOut={onUnhover}
              >
                <boxGeometry args={[blockSize * 0.9, height, blockSize * 0.9]} />
                <meshStandardMaterial
                  color={ROW_COLORS[i]}
                  emissive={ROW_COLORS[i]}
                  emissiveIntensity={isHovered ? 0.6 : 0.15}
                  transparent
                  opacity={isHovered ? 0.9 : 0.65}
                  roughness={0.3}
                  metalness={0.4}
                />
              </mesh>

              {/* Value label */}
              <Text
                position={[0, height - 0.3, blockSize * 0.5]}
                fontSize={0.18}
                color={isHovered ? '#FFFFFF' : '#8B949E'}
                anchorX="center"
              >
                {val.toFixed(3)}
              </Text>

              {/* Fraction tooltip */}
              {isHovered && (
                <Html position={[0, height + 0.5, 0]}>
                  <div style={{
                    background: 'rgba(13,17,23,0.95)',
                    border: `1px solid ${ROW_COLORS[i]}`,
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#E6EDF3',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    <div style={{ color: ROW_COLORS[i], fontWeight: 700 }}>
                      |U_{ROW_LABELS[i]}{COL_LABELS[j]}|2 = {U2_FRAC[i][j]}
                    </div>
                    <div style={{ color: '#8B949E', fontSize: 10, marginTop: 2 }}>
                      = {val.toFixed(6)}
                    </div>
                  </div>
                </Html>
              )}
            </group>
          );
        })
      )}

      {/* Jarlskog invariant marker */}
      <group position={[0, -2.5, 0]}>
        <mesh>
          <octahedronGeometry args={[0.4]} />
          <meshStandardMaterial
            color="#F85149"
            emissive="#F85149"
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
        <Text position={[0, -0.7, 0]} fontSize={0.3} color="#F85149" anchorX="center" fontWeight={700}>
          |J| = {J_ABS}
        </Text>
        <Text position={[0, -1.1, 0]} fontSize={0.2} color="#8B949E" anchorX="center">
          maximal CP: sinδ = −1
        </Text>
      </group>
    </group>
  );
}

// ── Main component ──
export function WeinbergCP3D({ selectedParticle: _sp, onSelectParticle: _osp }: WeinbergCP3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 10, 0]} fontSize={1.1} color="#BC8CFF" anchorX="center" fontWeight={700}>
        Electroweak + CP
      </Text>
      <Text position={[0, 8.8, 0]} fontSize={0.5} color="#8B949E" anchorX="center">
        sin2θ_W = 3/13 · sinδ = −1 · |U|2 from CR-PMNS
      </Text>

      {/* Weinberg sphere */}
      <WeinbergSphere />

      {/* Unitarity cube */}
      <UnitarityCube
        hovered={hoveredCell}
        onHover={setHoveredCell}
        onUnhover={() => setHoveredCell(null)}
      />

      {/* Pull summary panel */}
      <Html position={[-13, -3, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 220,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 11,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#BC8CFF', fontSize: 13 }}>
            Pull Summary
          </div>
          {PULLS.map(p => (
            <div key={p.param} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#8B949E' }}>{p.param}</span>
              <span style={{ color: p.color, fontWeight: 600, fontFamily: 'monospace' }}>{p.pull}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #30363D', paddingTop: 6, marginTop: 6, color: '#6E7681', fontSize: 10 }}>
            Master denom: 171535 = 5·7·132·29
          </div>
        </div>
      </Html>

      {/* Derivation panel */}
      <Html position={[13, -3, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 220,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 11,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#D29922', fontSize: 13 }}>
            Derivation Chain
          </div>
          <div style={{ color: '#8B949E', lineHeight: 1.6 }}>
            <div>sin2θ_W: cusp widths d2/det_M</div>
            <div>PMNS: CR of Hauptmodul J6</div>
            <div>sinδ = −1: U- = Levi-Civita</div>
            <div>|U|2: Schur complement of L</div>
          </div>
          <div style={{ borderTop: '1px solid #30363D', paddingTop: 6, marginTop: 6, color: '#3FB950', fontSize: 10 }}>
            0 continuous free parameters
          </div>
        </div>
      </Html>
    </group>
  );
}
