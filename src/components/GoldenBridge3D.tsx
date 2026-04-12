import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface GoldenBridge3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── Constants ──
const PHI = (1 + Math.sqrt(5)) / 2;   // 1.6180339...
const PSI = -1 / PHI;                  // -0.6180339...

// Polynomials
const q5 = (x: number) => x**5 - 3*x**3 - 2*x**2 + 3*x - 1;
const qphi = (x: number) => x*x - x - 1;
const q3 = (x: number) => x**3 + x**2 - x - 2;
const product = (x: number) => qphi(x) * q3(x); // = q5(x) + 3

// Real root of q5 (only 1; disc(q5) has 4 complex roots)
const Q5_REAL_ROOT = (() => {
  let lo = 1.5, hi = 2.0; // q5(1.5)<0, q5(2)>0
  for (let j = 0; j < 60; j++) {
    const mid = (lo + hi) / 2;
    if (q5(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
})();

// Special points on the curves (from X.263a):
// q₅(φ) = q₅(ψ) = −d₂ — golden ratio points where q_φ vanishes
// q₅(0) = −1, q₅(1) = −d₁, q₅(−1) = −d₁², q₅(2) = N−1
interface SpecialPoint {
  x: number;
  yq5: number;
  label: string;
  detail: string;
  color: string;
  isGolden: boolean;
  isRoot: boolean;
}

const SPECIAL_POINTS: SpecialPoint[] = [
  { x: Q5_REAL_ROOT, yq5: 0, label: `x₀ ≈ ${Q5_REAL_ROOT.toFixed(3)}`, detail: 'q₅(x₀) = 0 (unique real root)', color: '#C0C0C0', isGolden: false, isRoot: true },
  { x: PHI, yq5: -3, label: 'φ', detail: 'q₅(φ) = −d₂ = −3 (q_φ vanishes)', color: '#FFD700', isGolden: true, isRoot: false },
  { x: PSI, yq5: -3, label: 'ψ = −1/φ', detail: 'q₅(ψ) = −d₂ = −3 (q_φ vanishes)', color: '#FFD700', isGolden: true, isRoot: false },
  { x: 0, yq5: -1, label: '0', detail: 'q₅(0) = −1', color: '#8B949E', isGolden: false, isRoot: false },
  { x: 2, yq5: 5, label: 'd₁ = 2', detail: 'q₅(d₁) = N−1 = 5 → q₃·q₅(d₁)=K=40', color: '#58A6FF', isGolden: false, isRoot: false },
];

// Lucas dictionary
const LUCAS = [
  { k: 0, Lk: 2, ld: 'd₁', color: '#58A6FF' },
  { k: 1, Lk: 1, ld: '1', color: '#8B949E' },
  { k: 2, Lk: 3, ld: 'd₂', color: '#F0883E' },
  { k: 3, Lk: 4, ld: 'd₁²', color: '#58A6FF' },
  { k: 4, Lk: 7, ld: 'L', color: '#3FB950' },
  { k: 5, Lk: 11, ld: 'dim M₁₀', color: '#BC8CFF' },
];

// Ω₃ eigenvalues
const EIGENVALUES = [
  { label: '0', value: 0, color: '#8B949E' },
  { label: '−φ', value: -PHI, color: '#FFD700' },
  { label: '1/φ', value: 1 / PHI, color: '#3FB950' },
];

// ── Tube curve ──
function CurveTube({ fn, xMin, xMax, color, emissive, scale, yScale, radius = 0.06 }: {
  fn: (x: number) => number;
  xMin: number;
  xMax: number;
  color: string;
  emissive: string;
  scale: number;
  yScale: number;
  radius?: number;
}) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = xMin + (xMax - xMin) * t;
      const y = fn(x) * yScale;
      pts.push(new THREE.Vector3(x * scale, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 300, radius, 8, false);
  }, [fn, xMin, xMax, scale, yScale, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

// ── Animated particle along curve ──
function FlowingParticle({ fn, xMin, xMax, scale, yScale, color, speed, offset }: {
  fn: (x: number) => number;
  xMin: number; xMax: number;
  scale: number; yScale: number;
  color: string; speed: number; offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = ((state.clock.elapsedTime * speed + offset) % 1 + 1) % 1;
    const x = xMin + (xMax - xMin) * t;
    const y = fn(x) * yScale;
    if (ref.current) {
      ref.current.position.set(x * scale, y, 0);
    }
    if (glowRef.current) {
      glowRef.current.position.set(x * scale, y, 0);
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3 + offset * 10) * 0.3);
    }
  });

  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// ── Bridge struts (vertical bars showing gap = 3) ──
function BridgeStruts({ xMin, xMax, scale, yScale, count }: {
  xMin: number; xMax: number;
  scale: number; yScale: number;
  count: number;
}) {
  const struts = useMemo(() => {
    const result: { x: number; yBot: number; yTop: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = xMin + (xMax - xMin) * t;
      const yBot = q5(x) * yScale;
      const yTop = product(x) * yScale;
      result.push({ x: x * scale, yBot, yTop });
    }
    return result;
  }, [xMin, xMax, scale, yScale, count]);

  return (
    <group>
      {struts.map((s, i) => {
        const height = s.yTop - s.yBot;
        return (
          <mesh key={i} position={[s.x, s.yBot + height / 2, 0]}>
            <boxGeometry args={[0.02, height, 0.02]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.15}
              transparent
              opacity={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Bridge surface (translucent plane between curves) ──
function BridgeSurface({ xMin, xMax, scale, yScale }: {
  xMin: number; xMax: number;
  scale: number; yScale: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const steps = 200;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = xMin + (xMax - xMin) * t;
      const yBot = q5(x) * yScale;
      const yTop = product(x) * yScale;
      const px = x * scale;
      positions.push(px, yBot, 0);  // bottom
      positions.push(px, yTop, 0);  // top

      if (i < steps) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [xMin, xMax, scale, yScale]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={0.05}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Special point marker ──
function PointMarker({ point, scale, yScale, hovered, onHover, onUnhover }: {
  point: SpecialPoint;
  scale: number;
  yScale: number;
  hovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const y = point.yq5 * yScale;

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * (point.isGolden ? 1.5 : 0.5);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      ringRef.current.scale.setScalar(hovered ? 1.5 : pulse);
    }
  });

  return (
    <group position={[point.x * scale, y, 0]}>
      {/* Core sphere */}
      <mesh
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <sphereGeometry args={[hovered ? 0.25 : 0.18, 20, 20]} />
        <meshStandardMaterial
          color={point.color}
          emissive={point.color}
          emissiveIntensity={hovered ? 1.2 : (point.isGolden ? 0.8 : 0.3)}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshBasicMaterial
          color={point.color}
          transparent
          opacity={point.isGolden ? 0.5 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow for golden points */}
      {point.isGolden && (
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={hovered ? 0.15 : 0.07}
          />
        </mesh>
      )}

      {/* Vertical dashed line to zero plane for root */}
      {point.isRoot && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, -y, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={point.color} transparent opacity={0.3} />
        </line>
      )}

      {/* Label */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.28}
        color={point.color}
        anchorX="center"
        anchorY="top"
        fontWeight={700}
      >
        {point.label}
      </Text>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 0.8, 0]}>
          <div style={{
            background: 'rgba(13,17,23,0.95)',
            border: `1px solid ${point.color}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            color: '#E6EDF3',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: `0 0 12px ${point.color}40`,
          }}>
            <div style={{ fontWeight: 700, color: point.color }}>
              x = {point.label}
            </div>
            <div style={{ color: '#8B949E', marginTop: 4 }}>
              {point.detail}
            </div>
            <div style={{ color: '#8B949E' }}>
              q_φ·q₃({point.label}) = {(point.yq5 + 3).toFixed(0)}
            </div>
            {point.isGolden && (
              <div style={{ color: '#FFD700', marginTop: 4 }}>
                At golden ratio: q_φ = 0 → gap = d₂ = 3
              </div>
            )}
            {point.x === 2 && (
              <div style={{ color: '#58A6FF', marginTop: 4 }}>
                q₃(2)·q₅(2) = 8·5 = 40 = K
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Gap label "= 3" ──
function GapLabel({ x, scale, yScale }: { x: number; scale: number; yScale: number }) {
  const ref = useRef<THREE.Group>(null);
  const yBot = q5(x) * yScale;
  const yTop = product(x) * yScale;
  const yMid = (yBot + yTop) / 2;

  useFrame((state) => {
    if (ref.current) {
      // Gently pulse
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref} position={[x * scale, yMid, 0.3]}>
      {/* Arrow up */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -0.3, 0, 0, 0.3, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FFD700" transparent opacity={0.6} />
      </line>
      <Text
        fontSize={0.3}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        = d₂
      </Text>
    </group>
  );
}

// ── Zero plane ──
function ZeroPlane({ scale, xMin, xMax }: { scale: number; xMin: number; xMax: number }) {
  const width = (xMax - xMin) * scale;
  return (
    <mesh position={[(xMin + xMax) / 2 * scale, 0, 0]} rotation={[0, 0, 0]}>
      <planeGeometry args={[width * 1.1, 0.005]} />
      <meshBasicMaterial color="#6E7681" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Main component ──
export function GoldenBridge3D({ selectedParticle: _selectedParticle, onSelectParticle: _onSelectParticle }: GoldenBridge3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredRoot, setHoveredRoot] = useState<number | null>(null);

  const xMin = -2.2;
  const xMax = 2.2;
  const scale = 4;     // x stretching
  const yScale = 0.5;  // y compression (polynomials get large)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.06) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 9.5, 0]} fontSize={1.1} color="#FFD700" anchorX="center" fontWeight={700}>
        Golden Bridge
      </Text>
      <Text position={[0, 8.3, 0]} fontSize={0.5} color="#8B949E" anchorX="center">
        q₅ = q_φ · q₃ − d₂ {'  '}(X.267 ★★★★★)
      </Text>

      {/* Coordinate shift: center vertically */}
      <group position={[0, -1, 0]}>
        {/* Zero plane */}
        <ZeroPlane scale={scale} xMin={xMin} xMax={xMax} />
        <Text position={[xMax * scale + 0.8, 0.2, 0]} fontSize={0.25} color="#6E7681" anchorX="left">
          y = 0
        </Text>

        {/* Bridge surface */}
        <BridgeSurface xMin={xMin} xMax={xMax} scale={scale} yScale={yScale} />

        {/* Bridge struts */}
        <BridgeStruts xMin={xMin} xMax={xMax} scale={scale} yScale={yScale} count={40} />

        {/* Lower curve: q₅ (silver) */}
        <CurveTube
          fn={q5}
          xMin={xMin} xMax={xMax}
          color="#A8B8C8"
          emissive="#7090B0"
          scale={scale} yScale={yScale}
          radius={0.07}
        />

        {/* Upper curve: q_φ · q₃ (gold) */}
        <CurveTube
          fn={product}
          xMin={xMin} xMax={xMax}
          color="#FFD700"
          emissive="#CC9900"
          scale={scale} yScale={yScale}
          radius={0.07}
        />

        {/* Curve labels */}
        <Text position={[xMax * scale + 0.5, q5(xMax) * yScale, 0]} fontSize={0.3} color="#A8B8C8" anchorX="left">
          q₅
        </Text>
        <Text position={[xMax * scale + 0.5, product(xMax) * yScale, 0]} fontSize={0.3} color="#FFD700" anchorX="left">
          q_φ · q₃
        </Text>

        {/* Gap labels at select positions */}
        <GapLabel x={0} scale={scale} yScale={yScale} />
        <GapLabel x={1.5} scale={scale} yScale={yScale} />
        <GapLabel x={-1.5} scale={scale} yScale={yScale} />

        {/* Special point markers */}
        {SPECIAL_POINTS.map((point, i) => (
          <PointMarker
            key={i}
            point={point}
            scale={scale}
            yScale={yScale}
            hovered={hoveredRoot === i}
            onHover={() => setHoveredRoot(i)}
            onUnhover={() => setHoveredRoot(null)}
          />
        ))}

        {/* Flowing particles along gold curve */}
        {[0, 0.25, 0.5, 0.75].map((offset, i) => (
          <FlowingParticle
            key={`gold-${i}`}
            fn={product}
            xMin={xMin} xMax={xMax}
            scale={scale} yScale={yScale}
            color="#FFD700"
            speed={0.08}
            offset={offset}
          />
        ))}

        {/* Flowing particles along silver curve */}
        {[0.125, 0.375, 0.625, 0.875].map((offset, i) => (
          <FlowingParticle
            key={`silver-${i}`}
            fn={q5}
            xMin={xMin} xMax={xMax}
            scale={scale} yScale={yScale}
            color="#A8B8C8"
            speed={0.06}
            offset={offset}
          />
        ))}
      </group>

      {/* ── Lucas Dictionary panel (left) ── */}
      <Html position={[-13, 3, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 230,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#FFD700', fontSize: 13 }}>
            Lucas Dictionary
          </div>
          <div style={{ color: '#8B949E', marginBottom: 6, fontSize: 11 }}>
            Tr(Ω₃ᵏ) = (−1)ᵏ L_k
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #30363D' }}>
                <th style={{ padding: '3px 4px', textAlign: 'center', color: '#8B949E' }}>k</th>
                <th style={{ padding: '3px 4px', textAlign: 'center', color: '#8B949E' }}>L_k</th>
                <th style={{ padding: '3px 4px', textAlign: 'left', color: '#8B949E' }}>LD</th>
              </tr>
            </thead>
            <tbody>
              {LUCAS.map(row => (
                <tr key={row.k} style={{ borderBottom: '1px solid #21262D' }}>
                  <td style={{ padding: '3px 4px', textAlign: 'center', color: '#8B949E' }}>{row.k}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 700, color: row.color }}>{row.Lk}</td>
                  <td style={{ padding: '3px 4px', color: row.color }}>{row.ld}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Html>

      {/* ── Eigenvalues + Identity panel (right) ── */}
      <Html position={[13, 3, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 230,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#BC8CFF', fontSize: 13 }}>
            Ω₃ Eigenvalues
          </div>
          {EIGENVALUES.map(ev => (
            <div key={ev.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: ev.color, display: 'inline-block',
              }} />
              <span style={{ color: ev.color, fontWeight: 600, fontFamily: 'monospace' }}>
                {ev.label}
              </span>
              <span style={{ color: '#6E7681', fontFamily: 'monospace', fontSize: 10 }}>
                = {ev.value.toFixed(4)}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #30363D' }}>
            <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              The Identity
            </div>
            <div style={{ color: '#E6EDF3', fontFamily: 'monospace', fontSize: 11 }}>
              q₅(x) = q_φ(x)·q₃(x) − 3
            </div>
            <div style={{ color: '#8B949E', fontSize: 10, marginTop: 4 }}>
              Gap ≡ d₂ = 3 for all x ∈ ℝ
            </div>
          </div>

          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #30363D' }}>
            <div style={{ color: '#8B949E', fontSize: 10 }}>
              q₅ coefficients:
            </div>
            <div style={{ color: '#D29922', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>
              [1, 0, −d₂, −d₁, d₂, −1]
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
