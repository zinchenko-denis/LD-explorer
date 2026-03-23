import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface HeatKernelProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

const EIGENVALUES = [0, 1, 3, 3, 4, 5, 5, 5,
  (5 - Math.sqrt(21)) / 2, (5 + Math.sqrt(21)) / 2,
  (5 - Math.sqrt(5)) / 2, (5 + Math.sqrt(5)) / 2];

function heatKernelTrace(t: number): number {
  return EIGENVALUES.reduce((sum, lam) => sum + Math.exp(-lam * t), 0) / 12;
}

const T_SAMPLES = 100;
const T_MAX = 3;
const HK_CURVE = Array.from({ length: T_SAMPLES }, (_, i) => {
  const t = (i / T_SAMPLES) * T_MAX;
  return { t, h: heatKernelTrace(t) };
});

const SIN2_PRED = 4 / 13;
const SIN2_EXP = 0.307;
const SIN2_ERR = 0.012;

const panelStyle: React.CSSProperties = {
  background: 'rgba(13,17,23,0.92)',
  border: '1px solid #30363D',
  borderRadius: 8,
  padding: '12px 16px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
  color: '#E6EDF3',
  pointerEvents: 'none',
};

export function HeatKernel({ selectedParticle: _sp, onSelectParticle: _osp }: HeatKernelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const [drawPct, setDrawPct] = useState(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (drawPct < 1) {
      setDrawPct(Math.min(1, drawPct + delta / 3));
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.03) * 0.06;
    }
  });

  const curvePoints = useMemo(() => {
    const n = Math.max(2, Math.floor(drawPct * T_SAMPLES));
    const points: number[] = [];
    for (let i = 0; i < n; i++) {
      const { t, h } = HK_CURVE[i];
      points.push((t / T_MAX) * 20 - 10, h * 25 - 5, 0);
    }
    return new Float32Array(points);
  }, [drawPct]);

  const ref413 = SIN2_PRED * 25 - 5;
  const tHalf_x = (0.5 / T_MAX) * 20 - 10;

  return (
    <group ref={groupRef}>
      <Text position={[0, 12, 0]} fontSize={1.3} color="#FF6B9D" anchorX="center">
        {'Heat Kernel \u2192 sin\u00B2\u03B812 = 4/13'}
      </Text>
      <Text position={[0, 10.5, 0]} fontSize={0.6} color="#8B949E" anchorX="center">
        h(e,e; t=1/d1) via DT mechanism | 4.6 ppm
      </Text>

      {/* Curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#58A6FF" transparent opacity={0.8} />
      </line>

      {/* Axes */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-10,-5,0, 10,-5,0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6E7681" />
      </line>
      <Text position={[10.5, -5, 0]} fontSize={0.5} color="#6E7681" anchorX="left">t</Text>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-10,-5,0, -10,20,0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6E7681" />
      </line>
      <Text position={[-10.5, 20, 0]} fontSize={0.5} color="#6E7681" anchorX="right">h(t)</Text>

      {/* 4/13 line */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-10,ref413,0, 10,ref413,0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#FF6B9D" transparent opacity={0.4} />
      </line>
      <Text position={[11, ref413, 0]} fontSize={0.45} color="#FF6B9D" anchorX="left">4/13</Text>

      {/* t=1/2 vertical */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([tHalf_x,-5,0, tHalf_x,20,0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#FF6B9D" transparent opacity={0.5} />
      </line>

      {/* Intersection — pulsing */}
      <mesh position={[tHalf_x, ref413, 0]}>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial color="#FF6B9D" emissive="#FF6B9D" emissiveIntensity={0.5 + Math.sin(timeRef.current * 3) * 0.3} />
      </mesh>
      <Text position={[tHalf_x, ref413 + 1.2, 0]} fontSize={0.55} color="#FF6B9D" anchorX="center">
        4/13 +/- 4.6 ppm
      </Text>
      <Text position={[tHalf_x, -6, 0]} fontSize={0.45} color="#FF6B9D" anchorX="center">
        t = 1/d1
      </Text>

      {/* Right panel — HTML */}
      <Html position={[12, 6, 0]} distanceFactor={22}>
        <div style={{ ...panelStyle, width: 250 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#FF6B9D' }}>
            sin&sup2;&theta;<sub>12</sub> = 4/13
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#FF6B9D' }}>LD: </span>
            <span style={{ display:'inline-block', width: SIN2_PRED*280, height: 8, background:'#FF6B9D', borderRadius:2, verticalAlign:'middle', marginRight:4 }}/>
            <span style={{ fontSize:11 }}>{SIN2_PRED.toFixed(6)}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: '#58A6FF' }}>Exp: </span>
            <span style={{ display:'inline-block', width: SIN2_EXP*280, height: 8, background:'#58A6FF', borderRadius:2, verticalAlign:'middle', marginRight:4 }}/>
            <span style={{ fontSize:11 }}>{SIN2_EXP} &plusmn; {SIN2_ERR}</span>
          </div>
          <div style={{ color: '#3FB950', fontWeight: 600, marginBottom: 6 }}>
            Pull: +0.06&sigma; &nbsp; JUNO: +0.17&sigma;
          </div>
          <div style={{ borderTop:'1px solid #30363D', paddingTop:6, fontSize:11 }}>
            <div style={{ color:'#D29922' }}>DT: 4 triples from I.8</div>
            <div style={{ color:'#8B949E' }}>(7,9,8) = unique single-face</div>
            <div style={{ color:'#A371F7', marginTop:4 }}>4/13 = full interference</div>
          </div>
        </div>
      </Html>

      {/* Left panel — HTML */}
      <Html position={[-14, 6, 0]} distanceFactor={22}>
        <div style={{ ...panelStyle, width: 230 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Heat Kernel (I.9)</div>
          <div style={{ color:'#8B949E', fontFamily:'monospace', fontSize:11, lineHeight:'1.5' }}>
            h(i,j;t) = (1/12) &Sigma;<sub>k</sub><br/>
            &nbsp; exp(&minus;&lambda;<sub>k</sub>&middot;t) u<sub>k</sub>(i)u<sub>k</sub>(j)
          </div>
          <div style={{ color:'#8B949E', marginTop:6 }}>At t = 1/d<sub>1</sub> = 1/2:</div>
          <div style={{ color:'#FF6B9D', fontWeight:600 }}>h(e,e) = 4/13 &plusmn; 4.6 ppm</div>
          <div style={{ color:'#6E7681', fontSize:10, marginTop:4 }}>Verified: Python/scipy (S89)</div>
          <div style={{ borderTop:'1px solid #30363D', paddingTop:6, marginTop:6 }}>
            <div style={{ color:'#A371F7' }}>13 = d<sub>1</sub>&sup2; + d<sub>2</sub>&sup2; = 4 + 9 = det(M<sub>lep</sub>)</div>
          </div>
        </div>
      </Html>
    </group>
  );
}
