import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface HeckeOrbitProps {
  highlightedK: number | null;
  selectedParticle: Particle | null;
}

// B1_SET: 10 elements (9 rational + sqrt2)
// Distance from center (K=1): d=0,1,2,3
// T2 edges (×2): 6 edges
// T3 edges (×3): 4 edges
// EWSB: 1 edge
const B1_SET = [
  { value: 1,    label: '1',   distance: 0, orbit: 'center' },
  // Distance 1 (T2)
  { value: 1/2,  label: '1/2', distance: 1, orbit: 'T2' },
  { value: 2,    label: '2',   distance: 1, orbit: 'T2' },
  // Distance 1 (T3)
  { value: 1/3,  label: '1/3', distance: 1, orbit: 'T3' },
  { value: 3,    label: '3',   distance: 1, orbit: 'T3' },
  // Distance 2 (mixed T2∘T3 or T3∘T2)
  { value: 2/3,  label: '2/3', distance: 2, orbit: 'mixed' },
  { value: 3/2,  label: '3/2', distance: 2, orbit: 'mixed' },
  // Distance 3 (T2∘mixed or T3∘mixed)
  { value: 4/3,  label: '4/3', distance: 3, orbit: 'deep' },
  { value: 3/4,  label: '3/4', distance: 3, orbit: 'deep' },
  // EWSB (outside rational orbit)
  { value: Math.sqrt(2), label: '√2', distance: -1, orbit: 'EWSB', special: true },
];

// Hecke operators T_2 and T_3 act on B_1
// Total: 11 edges = 6 (T2) + 4 (T3) + 1 (EWSB)
const HECKE_ACTIONS = [
  // T2 edges (multiply/divide by 2) — 6 edges
  { from: 1/2, to: 1,   operator: 'T_2', label: '×2' },
  { from: 1,   to: 2,   operator: 'T_2', label: '×2' },
  { from: 1/3, to: 2/3, operator: 'T_2', label: '×2' },
  { from: 2/3, to: 4/3, operator: 'T_2', label: '×2' },
  { from: 3/4, to: 3/2, operator: 'T_2', label: '×2' },
  { from: 3/2, to: 3,   operator: 'T_2', label: '×2' },
  
  // T3 edges (multiply/divide by 3) — 4 edges
  { from: 1/3, to: 1,   operator: 'T_3', label: '×3' },
  { from: 1,   to: 3,   operator: 'T_3', label: '×3' },
  { from: 1/2, to: 3/2, operator: 'T_3', label: '×3' },
  { from: 2/3, to: 2,   operator: 'T_3', label: '×3' },
  
  // EWSB connection — 1 edge
  { from: Math.sqrt(2), to: 1, operator: 'EWSB', label: 'v/√2' },
];

const ORBIT_COLORS: Record<string, string> = {
  'center': '#58A6FF',
  'T2': '#3FB950',
  'T3': '#F0883E',
  'mixed': '#D29922',
  'deep': '#FF6B9D',
  'EWSB': '#A371F7',
};

const OPERATOR_COLORS: Record<string, string> = {
  'T_2': '#3FB950',
  'T_3': '#F0883E',
  'EWSB': '#A371F7',
};

export function HeckeOrbit({ highlightedK, selectedParticle }: HeckeOrbitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.06) * 0.1;
    }
  });

  // Position nodes by distance from center (concentric rings)
  const nodePositions = useMemo(() => {
    const positions: Record<number, [number, number, number]> = {};
    
    // Center (d=0): K=1
    positions[1] = [0, 0, 0];
    
    // Ring d=1: {1/2, 2, 1/3, 3} — 4 nodes
    const ring1 = [1/2, 2, 1/3, 3];
    ring1.forEach((k, i) => {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
      positions[k] = [Math.cos(angle) * 4, Math.sin(angle) * 4, 0];
    });
    
    // Ring d=2: {2/3, 3/2} — 2 nodes
    const ring2 = [2/3, 3/2];
    ring2.forEach((k, i) => {
      const angle = (i / 2) * Math.PI * 2 + Math.PI / 2;
      positions[k] = [Math.cos(angle) * 7, Math.sin(angle) * 7, 0];
    });
    
    // Ring d=3: {4/3, 3/4} — 2 nodes (dead ends)
    const ring3 = [4/3, 3/4];
    ring3.forEach((k, i) => {
      const angle = (i / 2) * Math.PI * 2;
      positions[k] = [Math.cos(angle) * 10, Math.sin(angle) * 10, 0];
    });
    
    // EWSB (outside rational orbit)
    positions[Math.sqrt(2)] = [0, 9, 0];
    
    return positions;
  }, []);

  const isNodeHighlighted = (k: number) => {
    if (highlightedK !== null && Math.abs(highlightedK - k) < 0.01) return true;
    if (hoveredNode === k) return true;
    if (selectedParticle && Math.abs(selectedParticle.K - k) < 0.01) return true;
    return false;
  };

  const isEdgeHighlighted = (action: typeof HECKE_ACTIONS[0]) => {
    if (hoveredEdge === `${action.from}-${action.to}`) return true;
    if (hoveredNode === action.from || hoveredNode === action.to) return true;
    if (highlightedK !== null && (Math.abs(highlightedK - action.from) < 0.01 || Math.abs(highlightedK - action.to) < 0.01)) return true;
    return false;
  };

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 12, 0]} fontSize={1.5} color="#F0883E" anchorX="center" anchorY="middle">
        Hecke Orbit of B_1
      </Text>
      <Text position={[0, 10, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        Action of T_2 and T_3 on the Multiplier Set
      </Text>

      {/* Connection lines (edges) */}
      {HECKE_ACTIONS.map((action, idx) => {
        const fromPos = nodePositions[action.from];
        const toPos = nodePositions[action.to];
        if (!fromPos || !toPos) return null;

        const isHighlighted = isEdgeHighlighted(action);
        const color = OPERATOR_COLORS[action.operator];

        return (
          <group key={idx}>
            <line
              onPointerOver={() => setHoveredEdge(`${action.from}-${action.to}`)}
              onPointerOut={() => setHoveredEdge(null)}
            >
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([...fromPos, ...toPos]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color={color} 
                transparent 
                opacity={isHighlighted ? 1 : 0.4}
                linewidth={isHighlighted ? 2 : 1}
              />
            </line>

            {/* Operator label */}
            <Text
              position={[
                (fromPos[0] + toPos[0]) / 2,
                (fromPos[1] + toPos[1]) / 2 + 0.5,
                (fromPos[2] + toPos[2]) / 2
              ]}
              fontSize={0.5}
              color={color}
              anchorX="center"
              anchorY="bottom"
            >
              {action.label}
            </Text>
          </group>
        );
      })}

      {/* Nodes */}
      {B1_SET.map((node) => {
        const position = nodePositions[node.value];
        if (!position) return null;

        const isHighlighted = isNodeHighlighted(node.value);
        const color = ORBIT_COLORS[node.orbit];

        return (
          <group key={node.label} position={position}>
            {/* Glow effect */}
            {isHighlighted && (
              <mesh>
                <sphereGeometry args={[1.2]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
              </mesh>
            )}

            {/* Main sphere */}
            <mesh
              onPointerOver={() => setHoveredNode(node.value)}
              onPointerOut={() => setHoveredNode(null)}
            >
              <sphereGeometry args={[node.special ? 0.8 : 0.6]} />
              <meshStandardMaterial
                color={color}
                emissive={isHighlighted ? color : '#000000'}
                emissiveIntensity={isHighlighted ? 0.5 : 0.2}
              />
            </mesh>

            {/* Special ring for sqrt2 */}
            {node.special && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.0, 32]} />
                <meshBasicMaterial color="#A371F7" side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Label */}
            <Text
              position={[0, node.special ? 1.5 : 1.2, 0]}
              fontSize={node.special ? 0.8 : 0.6}
              color="#FFFFFF"
              anchorX="center"
              anchorY="bottom"
            >
              {node.label}
            </Text>

            {/* Value */}
            <Text
              position={[0, -1.2, 0]}
              fontSize={0.4}
              color="#6E7681"
              anchorX="center"
              anchorY="top"
            >
              {node.value.toFixed(3)}
            </Text>

            {/* Tooltip */}
            {hoveredNode === node.value && (
              <Html position={[1, 1, 0]}>
                <div className="bg-[#161B22] border border-[#30363D] rounded px-2 py-1 text-xs whitespace-nowrap">
                  <div className="text-[#E6EDF3]">K = {node.label}</div>
                  <div className="text-[#6E7681]">Value: {node.value.toFixed(4)}</div>
                  <div className="text-[#58A6FF]">Orbit: {node.orbit}</div>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Legend */}
      <group position={[-14, 6, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Distance Rings:</Text>
        
        <group position={[0, 3, 0]}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#58A6FF" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">d=0: K=1 (center)</Text>
        </group>
        
        <group position={[0, 2.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#3FB950" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">d=1: T2/T3 orbit</Text>
        </group>
        
        <group position={[0, 1.4, 0]}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#D29922" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">d=2: mixed</Text>
        </group>
        
        <group position={[0, 0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#FF6B9D" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">d=3: dead ends</Text>
        </group>
        
        <group position={[0, -0.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#A371F7" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">EWSB: √2</Text>
        </group>
      </group>

      {/* Operators info */}
      <group position={[14, 6, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Hecke Operators:</Text>
        <Text position={[0, 3.2, 0]} fontSize={0.5} color="#3FB950" anchorX="left">T_2: ×2 or ÷2 (6 edges)</Text>
        <Text position={[0, 2.6, 0]} fontSize={0.5} color="#F0883E" anchorX="left">T_3: ×3 or ÷3 (4 edges)</Text>
        <Text position={[0, 2, 0]} fontSize={0.5} color="#A371F7" anchorX="left">EWSB: 1 edge</Text>
        
        <Text position={[0, 1.2, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Structure:</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">|B_1| = 10 elements</Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">|Edges| = 11 total</Text>
        <Text position={[0, -0.6, 0]} fontSize={0.5} color="#FF6B9D" anchorX="left">Dead ends: 4/3, 3/4</Text>
      </group>

      {/* Mathematical description */}
      <group position={[-14, -8, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Edge Condition:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">{'{K, K·p} or {K, K/p}'}</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">for p ∈ {'{2,3}'}, both</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">ends in B_1 ∩ [1/3,3]</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Verified by exhaustive</Text>
        <Text position={[0, 0.1, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Python/fractions check.</Text>
      </group>

      {/* EWSB note */}
      <group position={[14, -8, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#A371F7" anchorX="left">EWSB (√2):</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Outside rational orbit.</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Connects to K=1 via</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">v/√2 relation.</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Special vertex in the</Text>
        <Text position={[0, 0.1, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Hecke graph structure.</Text>
      </group>
    </group>
  );
}
