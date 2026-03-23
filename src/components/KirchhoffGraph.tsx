import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface KirchhoffGraphProps {
  selectedParticle: Particle | null;
}

// Bipartite graph of X₀(6) dessin (companion C.1, O.1)
// B1=BV₀(anchor), B2=BV₁(index), B3=BV₂(star), B4=BV₃(other)
// W1-W6 = σ₁-pairs: {c,p},{u,t},{b,μ},{s,W},{d,e},{τ,H}
const VERTICES = [
  { id: 0, label: 'BV0', type: 'black', x: 0, y: 3 },
  { id: 1, label: 'BV1', type: 'black', x: -3, y: 0 },
  { id: 2, label: 'BV2', type: 'black', x: 3, y: 0 },
  { id: 3, label: 'BV3', type: 'black', x: 0, y: -3 },
  { id: 4, label: 'W0', type: 'white', x: -2, y: 3 },
  { id: 5, label: 'W1', type: 'white', x: 2, y: 2 },
  { id: 6, label: 'W2', type: 'white', x: -3, y: 1.5 },
  { id: 7, label: 'W3', type: 'white', x: 2.5, y: -1 },
  { id: 8, label: 'W4', type: 'white', x: -2.5, y: -2 },
  { id: 9, label: 'W5', type: 'white', x: 1, y: -3 },
];

const ALL_EDGES = [
  // Verified: companion O.1 σ₁-pairs × biadjacency C.1
  { id: 0,  from: 0, to: 4, particle: 'c' },    // BV₀-W₀ multi-edge 1
  { id: 1,  from: 0, to: 4, particle: 'p' },    // BV₀-W₀ multi-edge 2
  { id: 2,  from: 0, to: 5, particle: 'u' },    // BV₀-W₁ bridge (FORCED)
  { id: 3,  from: 1, to: 5, particle: 't' },    // BV₁-W₁ bridge (FORCED)
  { id: 4,  from: 1, to: 6, particle: 'b' },    // BV₁-W₂ interior
  { id: 5,  from: 2, to: 6, particle: 'mu' },   // BV₂-W₂ interior
  { id: 6,  from: 2, to: 7, particle: 's' },    // BV₂-W₃ far-end
  { id: 7,  from: 3, to: 7, particle: 'W' },    // BV₃-W₃ far-end
  { id: 8,  from: 1, to: 8, particle: 'e' },    // BV₁-W₄ interior
  { id: 9,  from: 3, to: 8, particle: 'd' },    // BV₃-W₄ interior
  { id: 10, from: 2, to: 9, particle: 'H' },   // BV₂-W₅ far-end
  { id: 11, from: 3, to: 9, particle: 'tau' },  // BV₃-W₅ far-end
];

const PARTICLE_COLORS: Record<string, string> = {
  'u': '#58A6FF', 'c': '#58A6FF', 't': '#58A6FF',
  'd': '#3FB950', 's': '#3FB950', 'b': '#3FB950',
  'e': '#D29922', 'mu': '#D29922', 'tau': '#D29922',
  'W': '#F0883E', 'H': '#A371F7', 'p': '#FF6B9D',
};

// 5 of 40 verified spanning trees (companion E.8)
// E.8: FORCED={u(2),t(3)}, BOUNDARY={c⊕p}×{s⊕W}×{τ⊕H}, RESIDUAL=d₂²=9
// Total: K=40 (Matrix Tree Theorem, D.4)
const SPANNING_TREES = [
  { id: 1, edges: [0, 2, 3, 4, 5, 6, 8, 9, 10], name: 'Ground (c,s,H)' },
  { id: 2, edges: [1, 2, 3, 4, 5, 6, 8, 9, 10], name: 'Ground (p,s,H)' },
  { id: 3, edges: [0, 2, 3, 4, 5, 7, 8, 9, 10], name: 'Excitation (c,W,H)' },
  { id: 4, edges: [1, 2, 3, 4, 5, 7, 9, 10, 11], name: 'Alt (p,W,tau)' },
  { id: 5, edges: [0, 2, 3, 5, 6, 7, 8, 9, 11], name: 'Mixed (c,s+W,tau)' },
];

export function KirchhoffGraph({ selectedParticle }: KirchhoffGraphProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [selectedTree, setSelectedTree] = useState<number>(1);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.05;
    }
    // Auto-cycle through trees every 1.5s
    if (autoPlay) {
      const treeIdx = Math.floor(state.clock.elapsedTime / 1.5) % SPANNING_TREES.length;
      const newId = SPANNING_TREES[treeIdx].id;
      if (newId !== selectedTree) setSelectedTree(newId);
    }
  });

  const currentTree = SPANNING_TREES.find(t => t.id === selectedTree) || SPANNING_TREES[0];
  
  const isEdgeInTree = (edgeId: number) => currentTree.edges.includes(edgeId);
  
  const isEdgeHighlighted = (edge: typeof ALL_EDGES[0]) => {
    if (hoveredEdge === edge.id) return true;
    if (selectedParticle?.name === edge.particle) return true;
    return false;
  };

  return (
    <group ref={groupRef}>
      <Text position={[0, 14, 0]} fontSize={1.5} color="#3FB950" anchorX="center" anchorY="middle">
        Kirchhoff = 40
      </Text>
      <Text position={[0, 12, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        Spanning Trees: FORCED &#123;u,t&#125; + BOUNDARY 2³ + RESIDUAL d2^2
      </Text>

      <group position={[0, 0, 0]}>
        {ALL_EDGES.map((edge) => {
          const fromV = VERTICES[edge.from];
          const toV = VERTICES[edge.to];
          const inTree = isEdgeInTree(edge.id);
          const isHighlighted = isEdgeHighlighted(edge);
          const color = PARTICLE_COLORS[edge.particle] || '#E6EDF3';

          return (
            <group key={edge.id}>
              <line
                onPointerOver={() => setHoveredEdge(edge.id)}
                onPointerOut={() => setHoveredEdge(null)}
              >
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([
                      fromV.x * 2, fromV.y * 2, 0,
                      toV.x * 2, toV.y * 2, 0
                    ]), 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={color}
                  transparent
                  opacity={inTree ? (isHighlighted ? 1 : 0.7) : 0.15}
                />
              </line>

              {inTree && (
                <Text
                  position={[(fromV.x + toV.x), (fromV.y + toV.y) + 0.5, 0]}
                  fontSize={isHighlighted ? 0.7 : 0.5}
                  color={color}
                  anchorX="center"
                  anchorY="bottom"
                >
                  {edge.particle}
                </Text>
              )}

              {isHighlighted && inTree && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array([
                        fromV.x * 2, fromV.y * 2, 0,
                        toV.x * 2, toV.y * 2, 0
                      ]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color={color} transparent opacity={0.3} />
                </line>
              )}
            </group>
          );
        })}

        {VERTICES.map((v) => (
          <group key={v.id} position={[v.x * 2, v.y * 2, 0]}>
            <mesh>
              <sphereGeometry args={[v.type === 'black' ? 0.5 : 0.35]} />
              <meshStandardMaterial
                color={v.type === 'black' ? '#1F2328' : '#FFFFFF'}
                emissive={v.type === 'black' ? '#000000' : '#FFFFFF'}
                emissiveIntensity={v.type === 'black' ? 0.1 : 0.3}
              />
            </mesh>
            {v.type === 'black' && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.55, 0.6, 16]} />
                <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} />
              </mesh>
            )}
            <Text
              position={[0, v.type === 'black' ? 0.9 : 0.7, 0]}
              fontSize={0.5}
              color="#E6EDF3"
              anchorX="center"
              anchorY="bottom"
            >
              {v.label}
            </Text>
          </group>
        ))}
      </group>

      <group position={[-12, 8, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Spanning Trees:</Text>
        {SPANNING_TREES.map((tree, i) => (
          <group key={tree.id} position={[0, 3 - i * 0.9, 0]}>
            <mesh onClick={() => { setAutoPlay(false); setSelectedTree(tree.id); }}>
              <boxGeometry args={[0.4, 0.4, 0.1]} />
              <meshStandardMaterial
                color={selectedTree === tree.id ? '#3FB950' : '#30363D'}
                emissive={selectedTree === tree.id ? '#3FB950' : '#000000'}
                emissiveIntensity={selectedTree === tree.id ? 0.3 : 0}
              />
            </mesh>
            <Text
              position={[0.7, 0, 0]}
              fontSize={0.5}
              color={selectedTree === tree.id ? '#3FB950' : '#E6EDF3'}
              anchorX="left"
              anchorY="middle"
            >
              {tree.name}
            </Text>
          </group>
        ))}
      </group>

      <group position={[12, 8, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Kirchhoff&apos;s Theorem:</Text>
        <Text position={[0, 3.2, 0]} fontSize={0.5} color="#6E7681" anchorX="left">tau(G) = det(L&apos;)</Text>
        <Text position={[0, 2.6, 0]} fontSize={0.5} color="#6E7681" anchorX="left">where L is Laplacian</Text>
        
        <Text position={[0, 1.8, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">For X_0(6):</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">|V| = 10</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">|E| = 12</Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color="#3FB950" anchorX="left">tau(G) = 40 trees</Text>
      </group>

      <group position={[12, 2, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Current Tree:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.6} color="#3FB950" anchorX="left">{currentTree.name}</Text>
        <Text position={[0, 1.6, 0]} fontSize={0.5} color="#6E7681" anchorX="left">Edges: {currentTree.edges.length}</Text>
        <Text position={[0, 1, 0]} fontSize={0.5} color="#6E7681" anchorX="left">(9 edges for 10 vertices)</Text>
      </group>

      <group position={[-12, -8, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Matrix-Tree Theorem:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">The number of spanning</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">trees equals any cofactor</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">of the Laplacian matrix.</Text>
        <Text position={[0, 0.5, 0]} fontSize={0.45} color="#58A6FF" anchorX="left">For dessin: K = 40</Text>
      </group>

      <group position={[12, -8, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Physical Meaning:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Each spanning tree</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">represents a distinct</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">way to connect all</Text>
        <Text position={[0, 0.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">vertices without cycles.</Text>
      </group>

      <group position={[0, -12, 0]}>
        <Text position={[-6, 0, 0]} fontSize={0.6} color="#E6EDF3" anchorX="center">
          Kirchhoff Number: K = 40
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color="#6E7681" anchorX="center">
          |
        </Text>
        <Text position={[6, 0, 0]} fontSize={0.6} color="#3FB950" anchorX="center">
          Index of Gamma_0(6)
        </Text>
      </group>
    </group>
  );
}
