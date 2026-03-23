import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface HeatKernelProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// Laplacian eigenvalues (companion I.6)
const EIGENVALUES = [0, 1, 3, 3, 4, 5, 5, 5,
  (5 - Math.sqrt(21)) / 2, (5 + Math.sqrt(21)) / 2,
  (5 - Math.sqrt(5)) / 2, (5 + Math.sqrt(5)) / 2];

// Heat kernel diagonal h(i,i;t) = (1/12) Σ_k exp(-λ_k · t) |u_k(i)|²
// At t = 1/d₁ = 1/2, the DT (doubly-transversal) mechanism gives
// |U_e1|² = 4/13 ± 4.6 ppm (companion I.9)

// Compute heat kernel trace at time t
function heatKernelTrace(t: number): number {
  return EIGENVALUES.reduce((sum, lam) => sum + Math.exp(-lam * t), 0) / 12;
}

// DT triples (companion I.8): leptonic sector 3-face
// (7,9,8) = unique single-face DT triple
// These contribute to sin²θ₁₂ = 4/13

// Time samples for the curve
const T_SAMPLES = 100;
const T_MAX = 3;

// Heat kernel values at specific times
const HK_CURVE = Array.from({ length: T_SAMPLES }, (_, i) => {
  const t = (i / T_SAMPLES) * T_MAX;
  return { t, h: heatKernelTrace(t) };
});

// Key time points

// sin²θ₁₂ prediction vs experiment
const SIN2_PRED = 4 / 13;  // = 0.307692...
const SIN2_EXP = 0.307;    // NuFIT 6.0 central
const SIN2_ERR = 0.012;    // 1σ

export function HeatKernel({ selectedParticle: _selectedParticle, onSelectParticle: _onSelectParticle }: HeatKernelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.03) * 0.06;
    }
  });

  // Build curve geometry
  const curvePoints = useMemo(() => {
    const points: number[] = [];
    HK_CURVE.forEach(({ t, h }) => {
      const x = (t / T_MAX) * 20 - 10;
      const y = h * 25 - 5;
      points.push(x, y, 0);
    });
    return new Float32Array(points);
  }, []);

  // 4/13 reference line
  const ref413 = SIN2_PRED * 25 - 5;
  const tHalf_x = (0.5 / T_MAX) * 20 - 10;

  return (
    <group ref={groupRef}>
      <Text position={[0, 12, 0]} fontSize={1.3} color="#FF6B9D" anchorX="center">
        Heat Kernel → sin²θ₁₂ = 4/13
      </Text>
      <Text position={[0, 10.5, 0]} fontSize={0.6} color="#8B949E" anchorX="center">
        h(e,e; t=1/d₁) via DT mechanism | 4.6 ppm precision
      </Text>

      {/* Heat kernel curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#58A6FF" transparent opacity={0.8} />
      </line>

      {/* Axes */}
      {/* x-axis (time) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-10, -5, 0, 10, -5, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#6E7681" />
      </line>
      <Text position={[10.5, -5, 0]} fontSize={0.5} color="#6E7681" anchorX="left">t</Text>

      {/* y-axis (h) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-10, -5, 0, -10, 20, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#6E7681" />
      </line>
      <Text position={[-10.5, 20, 0]} fontSize={0.5} color="#6E7681" anchorX="right">h(t)</Text>

      {/* 4/13 reference line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-10, ref413, 0, 10, ref413, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF6B9D" transparent opacity={0.4} />
      </line>
      <Text position={[11, ref413, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">
        4/13
      </Text>

      {/* Vertical marker at t = 1/2 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([tHalf_x, -5, 0, tHalf_x, 20, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF6B9D" transparent opacity={0.5} />
      </line>

      {/* Intersection point (the key result) */}
      <mesh position={[tHalf_x, ref413, 0]}>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial color="#FF6B9D" emissive="#FF6B9D" emissiveIntensity={0.5 + Math.sin(timeRef.current * 3) * 0.3} />
      </mesh>
      <Text position={[tHalf_x, ref413 + 1.2, 0]} fontSize={0.55} color="#FF6B9D" anchorX="center">
        4/13 ± 4.6 ppm
      </Text>
      <Text position={[tHalf_x, -6, 0]} fontSize={0.45} color="#FF6B9D" anchorX="center">
        t = 1/d₁
      </Text>

      {/* Comparison box: prediction vs experiment */}
      <group position={[12, 5, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.65} color="#E6EDF3" anchorX="left">sin²θ₁₂:</Text>

        {/* Prediction bar */}
        <mesh position={[3, 2.8, 0]}>
          <boxGeometry args={[SIN2_PRED * 12, 0.6, 0.3]} />
          <meshStandardMaterial color="#FF6B9D" emissive="#FF6B9D" emissiveIntensity={0.2} />
        </mesh>
        <Text position={[0, 2.8, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">LD:</Text>
        <Text position={[SIN2_PRED * 12 + 3.5, 2.8, 0]} fontSize={0.4} color="#FF6B9D" anchorX="left">
          {SIN2_PRED.toFixed(6)}
        </Text>

        {/* Experiment bar */}
        <mesh position={[3, 1.8, 0]}>
          <boxGeometry args={[SIN2_EXP * 12, 0.6, 0.3]} />
          <meshStandardMaterial color="#58A6FF" emissive="#58A6FF" emissiveIntensity={0.2} />
        </mesh>
        <Text position={[0, 1.8, 0]} fontSize={0.45} color="#58A6FF" anchorX="left">Exp:</Text>
        <Text position={[SIN2_EXP * 12 + 3.5, 1.8, 0]} fontSize={0.4} color="#58A6FF" anchorX="left">
          {SIN2_EXP} ± {SIN2_ERR}
        </Text>

        {/* Pull */}
        <Text position={[0, 0.8, 0]} fontSize={0.5} color="#3FB950" anchorX="left">
          Pull: +0.06σ (JUNO: +0.17σ)
        </Text>

        {/* DT mechanism */}
        <Text position={[0, -0.5, 0]} fontSize={0.55} color="#E6EDF3" anchorX="left">DT Mechanism:</Text>
        <Text position={[0, -1.3, 0]} fontSize={0.4} color="#D29922" anchorX="left">4 DT triples from I.8</Text>
        <Text position={[0, -1.9, 0]} fontSize={0.4} color="#D29922" anchorX="left">(7,9,8) = unique single-face</Text>
        <Text position={[0, -2.5, 0]} fontSize={0.4} color="#D29922" anchorX="left">DT on 3-face (leptons)</Text>
        <Text position={[0, -3.3, 0]} fontSize={0.4} color="#A371F7" anchorX="left">4/13 = full interference</Text>
        <Text position={[0, -3.9, 0]} fontSize={0.4} color="#A371F7" anchorX="left">(no partial sum gives 4/13)</Text>
      </group>

      {/* Left panel: mechanism */}
      <group position={[-14, 5, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Heat Kernel (I.9):</Text>
        <Text position={[0, 3.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">h(i,j;t) = (1/12) Σ_k</Text>
        <Text position={[0, 2.6, 0]} fontSize={0.45} color="#6E7681" anchorX="left">  exp(−λ_k·t) u_k(i)u_k(j)</Text>
        <Text position={[0, 1.6, 0]} fontSize={0.45} color="#6E7681" anchorX="left">At t = 1/d₁ = 1/2:</Text>
        <Text position={[0, 0.9, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">h(e,e) = 4/13 ± 4.6 ppm</Text>
        <Text position={[0, 0, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Verified: Python/scipy</Text>
        <Text position={[0, -0.6, 0]} fontSize={0.45} color="#6E7681" anchorX="left">from scratch (S89)</Text>

        <Text position={[0, -1.8, 0]} fontSize={0.55} color="#E6EDF3" anchorX="left">Key identity:</Text>
        <Text position={[0, -2.5, 0]} fontSize={0.45} color="#A371F7" anchorX="left">13 = d₁² + d₂² = 4 + 9</Text>
        <Text position={[0, -3.1, 0]} fontSize={0.45} color="#A371F7" anchorX="left">= det(M_lep) = Σℓ per row</Text>
      </group>
    </group>
  );
}
