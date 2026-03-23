import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface DessinGraphProps {
  showConnections: boolean;
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// Black vertices (valency 3 each) - 4 vertices
const BLACK_VERTICES = [
  { id: 'B1', position: [0, 8, 0] as [number, number, number], label: 'B1' },
  { id: 'B2', position: [-7, 2, 0] as [number, number, number], label: 'B2' },
  { id: 'B3', position: [7, 2, 0] as [number, number, number], label: 'B3' },
  { id: 'B4', position: [0, -6, 0] as [number, number, number], label: 'B4' },
];

// White vertices (valency 2 each) - 6 vertices
const WHITE_VERTICES = [
  { id: 'W1', position: [-4, 6, 3] as [number, number, number], label: 'W1' },
  { id: 'W2', position: [4, 6, 3] as [number, number, number], label: 'W2' },
  { id: 'W3', position: [-8, -1, -3] as [number, number, number], label: 'W3' },
  { id: 'W4', position: [0, 0, 4] as [number, number, number], label: 'W4' },
  { id: 'W5', position: [8, -1, -3] as [number, number, number], label: 'W5' },
  { id: 'W6', position: [0, -8, 0] as [number, number, number], label: 'W6' },
];

// Faces (different from black vertices!)
// 6-face (quarks), 3-face (leptons), 2-face (bosons), 1-face (anchor)
const FACES = [
  { id: 'F6', position: [0, 12, 0] as [number, number, number], label: '6-face', type: 'quark', color: '#58A6FF', desc: 'Quarks (u,d,c,s,t,b)' },
  { id: 'F3', position: [-10, 6, 0] as [number, number, number], label: '3-face', type: 'lepton', color: '#D29922', desc: 'Leptons (e,μ,τ)' },
  { id: 'F2', position: [10, 6, 0] as [number, number, number], label: '2-face', type: 'boson', color: '#F0883E', desc: 'Bosons (W,H)' },
  { id: 'F1', position: [0, -10, 0] as [number, number, number], label: '1-face', type: 'anchor', color: '#FF6B9D', desc: 'Anchor (p)' },
];

// Edges connecting black and white vertices (12 edges = 12 particles)
const EDGES = [
  { from: 'B1', to: 'W1', particle: 'u', generation: 1, face: 'F6' },
  { from: 'B1', to: 'W2', particle: 'c', generation: 2, face: 'F6' },
  { from: 'B2', to: 'W1', particle: 'mu', generation: 2, face: 'F3' },
  { from: 'B2', to: 'W3', particle: 'e', generation: 1, face: 'F3' },
  { from: 'B2', to: 'W4', particle: 'tau', generation: 3, face: 'F3' },
  { from: 'B3', to: 'W2', particle: 'W', generation: null, face: 'F2' },
  { from: 'B3', to: 'W4', particle: 'H', generation: null, face: 'F2' },
  { from: 'B3', to: 'W5', particle: 't', generation: 3, face: 'F6' },
  { from: 'B4', to: 'W3', particle: 'd', generation: 1, face: 'F6' },
  { from: 'B4', to: 'W5', particle: 'b', generation: 3, face: 'F6' },
  { from: 'B4', to: 'W6', particle: 's', generation: 2, face: 'F6' },
  { from: 'B1', to: 'W6', particle: 'p', generation: null, face: 'F1' },
];

const PARTICLE_COLORS: Record<string, string> = {
  'u': '#58A6FF', 'c': '#58A6FF', 't': '#58A6FF',
  'd': '#3FB950', 's': '#3FB950', 'b': '#3FB950',
  'e': '#D29922', 'mu': '#D29922', 'tau': '#D29922',
  'W': '#F0883E', 'H': '#A371F7', 'p': '#FF6B9D',
};

// Animated dot travelling along an edge (pulsation)
function PulseDot({ from, to, color, speed, phase, size }: {
  from: [number,number,number]; to: [number,number,number];
  color: string; speed: number; phase: number; size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const raw = ((state.clock.elapsedTime * speed + phase) % 2) / 2;
    const p = raw < 0.5 ? raw * 2 : 2 - raw * 2; // ping-pong 0→1→0
    if (ref.current) {
      ref.current.position.set(
        from[0] + (to[0] - from[0]) * p,
        from[1] + (to[1] - from[1]) * p,
        from[2] + (to[2] - from[2]) * p,
      );
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

export function DessinGraph({ showConnections, selectedParticle, onSelectParticle }: DessinGraphProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const showFaces = true;

  const vertexMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    BLACK_VERTICES.forEach(v => map.set(v.id, v.position));
    WHITE_VERTICES.forEach(v => map.set(v.id, v.position));
    return map;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.1;
    }
  });

  const getConnectedParticles = (vertexId: string) => {
    return EDGES.filter(e => e.from === vertexId || e.to === vertexId).map(e => e.particle);
  };

  const isEdgeHighlighted = (edgeParticle: string) => {
    if (!selectedParticle && !hoveredEdge) return false;
    if (hoveredEdge === edgeParticle) return true;
    if (selectedParticle?.name === edgeParticle) return true;
    return false;
  };

  const isVertexHighlighted = (vertexId: string) => {
    if (hoveredVertex === vertexId) return true;
    if (!selectedParticle) return false;
    const connected = getConnectedParticles(vertexId);
    return connected.includes(selectedParticle.name);
  };

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 16, 0]} fontSize={1.5} color="#A371F7" anchorX="center" anchorY="middle">
        Dessin d&apos;Enfant: X_0(6)
      </Text>
      <Text position={[0, 14, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        4 Black (valency 3) × 6 White (valency 2) = 12 Edges
      </Text>

      {/* Faces (shown separately from vertices) */}
      {showFaces && FACES.map((face) => (
        <group key={face.id} position={face.position}>
          {/* Face indicator - larger translucent sphere */}
          <mesh>
            <sphereGeometry args={[1.5]} />
            <meshStandardMaterial 
              color={face.color} 
              transparent 
              opacity={0.15}
              emissive={face.color}
              emissiveIntensity={0.1}
            />
          </mesh>
          {/* Face label */}
          <Text position={[0, 2, 0]} fontSize={0.7} color={face.color} anchorX="center" anchorY="middle">
            {face.label}
          </Text>
          <Text position={[0, -2, 0]} fontSize={0.5} color="#6E7681" anchorX="center" anchorY="middle">
            {face.desc}
          </Text>
        </group>
      ))}

      {/* Black Vertices */}
      {BLACK_VERTICES.map((v) => {
        const isHovered = hoveredVertex === v.id;
        const isHighlighted = isVertexHighlighted(v.id);
        const connectedParticles = getConnectedParticles(v.id);
        
        return (
          <group key={v.id} position={v.position}>
            {/* Glow effect */}
            {(isHovered || isHighlighted) && (
              <mesh>
                <sphereGeometry args={[2.2]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} />
              </mesh>
            )}
            
            {/* Main sphere */}
            <mesh
              onPointerOver={() => setHoveredVertex(v.id)}
              onPointerOut={() => setHoveredVertex(null)}
              onClick={() => {
                const firstParticle = connectedParticles[0];
                if (firstParticle && onSelectParticle) {
                  const p: Particle = {
                    name: firstParticle,
                    n: 0,
                    K: 1,
                    mass: 0,
                    type: 'quark-up',
                  };
                  onSelectParticle(p);
                }
              }}
            >
              <sphereGeometry args={[1.5]} />
              <meshStandardMaterial 
                color="#1F2328" 
                emissive={isHovered || isHighlighted ? '#58A6FF' : '#000000'} 
                emissiveIntensity={isHovered || isHighlighted ? 0.4 : 0.1} 
              />
            </mesh>
            
            {/* Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.6, 1.8, 32]} />
              <meshBasicMaterial 
                color={isHovered || isHighlighted ? '#58A6FF' : '#FFFFFF'} 
                side={THREE.DoubleSide} 
              />
            </mesh>
            
            {/* Label */}
            <Text position={[0, 0, 2]} fontSize={1} color="#FFFFFF" anchorX="center" anchorY="middle">
              {v.label}
            </Text>
            <Text position={[0, -2.5, 0]} fontSize={0.5} color="#6E7681" anchorX="center">
              valency 3
            </Text>

            {/* Hover tooltip */}
            {isHovered && (
              <Html position={[2, 2, 0]}>
                <div className="bg-[#161B22] border border-[#30363D] rounded px-2 py-1 text-xs whitespace-nowrap">
                  <span className="text-[#E6EDF3]">Connected: </span>
                  <span className="text-[#58A6FF]">{connectedParticles.join(', ')}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* White Vertices */}
      {WHITE_VERTICES.map((v) => {
        const isHovered = hoveredVertex === v.id;
        const isHighlighted = isVertexHighlighted(v.id);
        const connectedParticles = getConnectedParticles(v.id);
        
        return (
          <group key={v.id} position={v.position}>
            {/* Glow effect */}
            {(isHovered || isHighlighted) && (
              <mesh>
                <sphereGeometry args={[1.6]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} />
              </mesh>
            )}
            
            <mesh
              onPointerOver={() => setHoveredVertex(v.id)}
              onPointerOut={() => setHoveredVertex(null)}
              onClick={() => {
                const firstParticle = connectedParticles[0];
                if (firstParticle && onSelectParticle) {
                  const p: Particle = {
                    name: firstParticle,
                    n: 0,
                    K: 1,
                    mass: 0,
                    type: 'quark-up',
                  };
                  onSelectParticle(p);
                }
              }}
            >
              <sphereGeometry args={[1]} />
              <meshStandardMaterial 
                color="#FFFFFF" 
                emissive={isHovered || isHighlighted ? '#3FB950' : '#FFFFFF'} 
                emissiveIntensity={isHovered || isHighlighted ? 0.5 : 0.2} 
              />
            </mesh>
            
            <Text position={[0, 0, 1.2]} fontSize={0.6} color="#1F2328" anchorX="center" anchorY="middle">
              {v.label}
            </Text>
            <Text position={[0, -1.5, 0]} fontSize={0.4} color="#6E7681" anchorX="center">
              valency 2
            </Text>

            {/* Hover tooltip */}
            {isHovered && (
              <Html position={[1.5, 1.5, 0]}>
                <div className="bg-[#161B22] border border-[#30363D] rounded px-2 py-1 text-xs whitespace-nowrap">
                  <span className="text-[#E6EDF3]">Connected: </span>
                  <span className="text-[#3FB950]">{connectedParticles.join(', ')}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Edges with pulsation animation */}
      {showConnections && EDGES.map((edge, idx) => {
        const fromPos = vertexMap.get(edge.from);
        const toPos = vertexMap.get(edge.to);
        if (!fromPos || !toPos) return null;

        const color = PARTICLE_COLORS[edge.particle] || '#E6EDF3';
        const isHighlighted = isEdgeHighlighted(edge.particle);
        const isSelected = selectedParticle?.name === edge.particle;

        // Pulsation: travelling dot along edge
        // Phase offset by face type for sequential animation
        const faceSpeed = edge.face === 'F6' ? 0.8 : edge.face === 'F3' ? 1.2 : edge.face === 'F2' ? 1.5 : 0.5;
        const phaseOffset = idx * 0.5;

        return (
          <group key={idx}>
            {/* Main edge line */}
            <line
              onPointerOver={() => setHoveredEdge(edge.particle)}
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
                opacity={isSelected ? 1 : isHighlighted ? 0.9 : 0.5} 
              />
            </line>

            {/* Glow line for highlighted edges */}
            {(isHighlighted || isSelected) && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([...fromPos, ...toPos]), 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.3} />
              </line>
            )}
            
            {/* Travelling pulse dot */}
            <PulseDot
              from={fromPos}
              to={toPos}
              color={color}
              speed={faceSpeed}
              phase={phaseOffset}
              size={isHighlighted ? 0.35 : 0.2}
            />

            {/* Particle label */}
            <Text
              position={[
                (fromPos[0] + toPos[0]) / 2,
                (fromPos[1] + toPos[1]) / 2 + 0.8,
                (fromPos[2] + toPos[2]) / 2
              ]}
              fontSize={isHighlighted ? 0.9 : 0.7}
              color={color}
              anchorX="center"
              anchorY="bottom"
            >
              {edge.particle}
            </Text>

            {/* Generation indicator */}
            {edge.generation && (
              <Text
                position={[
                  (fromPos[0] + toPos[0]) / 2 + 0.5,
                  (fromPos[1] + toPos[1]) / 2 + 0.8,
                  (fromPos[2] + toPos[2]) / 2
                ]}
                fontSize={0.4}
                color="#E6EDF3"
                anchorX="left"
                anchorY="bottom"
              >
                G{edge.generation}
              </Text>
            )}
          </group>
        );
      })}

      {/* Legend — HTML overlay */}
      <Html position={[15, 6, 0]} distanceFactor={24}>
        <div style={{ background:'rgba(13,17,23,0.92)', border:'1px solid #30363D', borderRadius:8, padding:'12px 16px', width:200, fontFamily:'system-ui, sans-serif', fontSize:12, color:'#E6EDF3', pointerEvents:'none' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Vertices</div>
          <div><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:'#1F2328', border:'1px solid #fff', verticalAlign:'middle', marginRight:6 }}/> Black (val 3)</div>
          <div><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:'#fff', verticalAlign:'middle', marginRight:6 }}/> White (val 2)</div>
          
          <div style={{ fontWeight:700, marginTop:10, marginBottom:6 }}>Faces</div>
          <div style={{ color:'#58A6FF' }}>6-face = Quarks</div>
          <div style={{ color:'#D29922' }}>3-face = Leptons</div>
          <div style={{ color:'#F0883E' }}>2-face = Bosons</div>
          <div style={{ color:'#FF6B9D' }}>1-face = Anchor</div>
          
          <div style={{ borderTop:'1px solid #30363D', paddingTop:8, marginTop:8, fontSize:11, color:'#8B949E' }}>
            |V|=10 |E|=12 |F|=4<br/>
            &chi;=10-12+4=2 (g=0)
          </div>
        </div>
      </Html>
    </group>
  );
}
