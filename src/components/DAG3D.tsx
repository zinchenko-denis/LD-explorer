import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface DAG3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── DAG data ──
type Status = 'THM' | 'DER' | 'OBS' | 'CONJ' | 'POST';
interface Node {
  id: string;
  label: string;
  pos: [number, number, number]; // 3D position
  status: Status;
  detail: string;
  pull?: string;
}

interface Edge {
  from: string;
  to: string;
}

const STATUS_COLORS: Record<Status, string> = {
  POST: '#BC8CFF',
  THM: '#3FB950',
  DER: '#58A6FF',
  OBS: '#D29922',
  CONJ: '#8B949E',
};

const STATUS_LABELS: Record<Status, string> = {
  POST: 'Postulate',
  THM: 'Theorem',
  DER: 'Derived',
  OBS: 'Observed',
  CONJ: 'Conjecture',
};

// Nodes laid out as a 3D tree growing upward from A_F root
const NODES: Node[] = [
  // Layer 0: Root
  { id: 'AF', label: 'A_F', pos: [0, -6, 0], status: 'POST', detail: 'Finite algebra ℂ⊕ℍ⊕M3(ℂ) → coprime pair (2,3)' },
  // Layer 1
  { id: 'N6', label: 'N = 6', pos: [0, -3, 0], status: 'THM', detail: 'Γ0(N), N = d1·d2 = 6, index = 12' },
  // Layer 2: Dessin structures
  { id: 'dessin', label: 'Dessin', pos: [-4, 0, -1], status: 'THM', detail: '4 BV (val 3) + 6 WV (val 2), 12 edges' },
  { id: 'modform', label: 'Mod forms', pos: [4, 0, 1], status: 'THM', detail: 'Hauptmodul, Eisenstein, η-quotients for Γ0(6)' },
  // Layer 3: Core
  { id: 'sigma', label: 'σ1σ0σ∞', pos: [-7, 3, -2], status: 'THM', detail: 'Monodromy, σ1·σ0·σ∞ = id' },
  { id: 'graph', label: 'Graph G', pos: [-3, 3, -3], status: 'THM', detail: 'K(G) = 40 spanning trees → λ = 9/40' },
  { id: 'CR', label: 'Cross-ratios', pos: [3, 3, 3], status: 'THM', detail: 'CR orbit on cusps → mixing angles' },
  { id: 'spectrum', label: 'Spectrum', pos: [7, 3, 2], status: 'THM', detail: 'Laplacian eigenvalues, disc 21, 5' },
  // Layer 4: Physics
  { id: 'masses', label: 'Masses', pos: [-8, 6, -4], status: 'DER', detail: 'm = me·g^n·K, NLO R2 = 0.89', pull: '2.7% LO' },
  { id: 'CKM', label: 'CKM', pos: [-3, 6, -1], status: 'DER', detail: 'UST → λ, A, γ, R_b; χ2/dof = 0.65', pull: 'max 1.25σ' },
  { id: 'PMNS', label: 'PMNS', pos: [3, 6, 1], status: 'DER', detail: 'CR + index → sin2θ12 = 4/13, sinδ = −1', pull: '0.27' },
  { id: 'EW', label: 'sin2θ_W', pos: [8, 6, 4], status: 'DER', detail: '3/13 tree, NLO 0.23122', pull: '+1.9σ' },
  // Layer 5: Advanced
  { id: 'alpha', label: 'α^-1', pos: [-8, 9, 0], status: 'DER', detail: '137.036... from cusp + Hecke', pull: '−1.2σ' },
  { id: 'mu', label: 'μ = m_p/m_e', pos: [-3, 9, -3], status: 'DER', detail: '6π5(1 + 10α2/(9π) + ...)', pull: '<0.001σ' },
  { id: 'golden', label: 'Golden Bridge', pos: [3, 9, 3], status: 'THM', detail: 'q5 = q_φ·q3 − 3, Lucas ↔ LD' },
  { id: 'CRT', label: 'CRT Unification', pos: [8, 9, 0], status: 'THM', detail: 'L = 3I − A_dir − σ0^-1' },
  // Layer 6: Predictions
  { id: 'neutrino', label: 'ν masses', pos: [-2, 12, 2], status: 'CONJ', detail: 'm1 = 7.7 meV, Σm = 69.8 meV (NO)' },
  { id: 'falsify', label: 'Falsification', pos: [4, 12, -1], status: 'DER', detail: 'JUNO: 4/13, DUNE: sinδ = −1' },
];

const EDGES: Edge[] = [
  { from: 'AF', to: 'N6' },
  { from: 'N6', to: 'dessin' }, { from: 'N6', to: 'modform' },
  { from: 'dessin', to: 'sigma' }, { from: 'dessin', to: 'graph' },
  { from: 'modform', to: 'CR' }, { from: 'modform', to: 'spectrum' },
  { from: 'sigma', to: 'masses' }, { from: 'graph', to: 'CKM' },
  { from: 'CR', to: 'PMNS' }, { from: 'spectrum', to: 'EW' },
  { from: 'sigma', to: 'alpha' }, { from: 'graph', to: 'mu' },
  { from: 'spectrum', to: 'golden' }, { from: 'sigma', to: 'CRT' },
  { from: 'PMNS', to: 'neutrino' }, { from: 'PMNS', to: 'falsify' },
  { from: 'EW', to: 'falsify' }, { from: 'CKM', to: 'falsify' },
  { from: 'CR', to: 'EW' }, { from: 'graph', to: 'masses' },
];

// ── Build parent map for chain highlighting ──
function buildParentMap(edges: Edge[]): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const e of edges) {
    const p = parents.get(e.to) || [];
    p.push(e.from);
    parents.set(e.to, p);
  }
  return parents;
}

function getAncestorChain(nodeId: string, parentMap: Map<string, string[]>): Set<string> {
  const chain = new Set<string>();
  const stack = [nodeId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    chain.add(id);
    for (const p of parentMap.get(id) || []) {
      if (!chain.has(p)) stack.push(p);
    }
  }
  return chain;
}

// ── DAG Node sphere ──
function DAGNode3D({ node, highlighted, selected, onSelect, onHover, onUnhover, hovered }: {
  node: Node;
  highlighted: boolean;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
  onUnhover: () => void;
  hovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = STATUS_COLORS[node.status];
  const isRoot = node.id === 'AF';
  const radius = isRoot ? 0.6 : (selected ? 0.5 : 0.35);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = highlighted ? 0.6 : 0.15;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = pulse + Math.sin(state.clock.elapsedTime * 2 + node.pos[0]) * 0.05;
    }
  });

  return (
    <group position={node.pos}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={onSelect}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Outer glow */}
      {(highlighted || selected) && (
        <mesh>
          <sphereGeometry args={[radius * 2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, -radius - 0.35, 0]}
        fontSize={0.35}
        color={highlighted ? '#FFFFFF' : color}
        anchorX="center"
        fontWeight={highlighted ? 700 : 500}
      >
        {node.label}
      </Text>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, radius + 1, 0]}>
          <div style={{
            background: 'rgba(13,17,23,0.95)',
            border: `1px solid ${color}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            color: '#E6EDF3',
            maxWidth: 250,
            pointerEvents: 'none',
            boxShadow: `0 0 12px ${color}40`,
          }}>
            <div style={{ fontWeight: 700, color }}>
              {node.label} [{STATUS_LABELS[node.status]}]
            </div>
            <div style={{ color: '#8B949E', marginTop: 4, lineHeight: 1.4 }}>
              {node.detail}
            </div>
            {node.pull && (
              <div style={{ color: '#D29922', marginTop: 4, fontFamily: 'monospace' }}>
                Pull: {node.pull}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Edge line ──
function DAGEdge3D({ from, to, highlighted }: {
  from: [number, number, number];
  to: [number, number, number];
  highlighted: boolean;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...from, ...to], 3));
    return geo;
  }, [from, to]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: highlighted ? '#FFD700' : '#6E7681',
    transparent: true,
    opacity: highlighted ? 0.8 : 0.15,
  }), [highlighted]);

  const lineObj = useMemo(() => {
    const l = new THREE.Line(geometry, material);
    return l;
  }, [geometry, material]);

  return <primitive object={lineObj} />;
}

// ── Main component ──
export function DAG3D({ selectedParticle: _sp, onSelectParticle: _osp }: DAG3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodeMap = useMemo(() => new Map(NODES.map(n => [n.id, n])), []);
  const parentMap = useMemo(() => buildParentMap(EDGES), []);

  const highlightedChain = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return getAncestorChain(selectedNode, parentMap);
  }, [selectedNode, parentMap]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 15, 0]} fontSize={1.1} color="#3FB950" anchorX="center" fontWeight={700}>
        Derivation Crystal
      </Text>
      <Text position={[0, 13.8, 0]} fontSize={0.5} color="#8B949E" anchorX="center">
        A_F → N=6 → Dessin → 18 outputs · Click node to trace chain
      </Text>

      {/* Edges */}
      {EDGES.map((e, i) => {
        const fromNode = nodeMap.get(e.from);
        const toNode = nodeMap.get(e.to);
        if (!fromNode || !toNode) return null;
        const highlighted = highlightedChain.has(e.from) && highlightedChain.has(e.to);
        return (
          <DAGEdge3D
            key={i}
            from={fromNode.pos}
            to={toNode.pos}
            highlighted={highlighted}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map(node => (
        <DAGNode3D
          key={node.id}
          node={node}
          highlighted={highlightedChain.has(node.id)}
          selected={selectedNode === node.id}
          onSelect={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
          onHover={() => setHoveredNode(node.id)}
          onUnhover={() => setHoveredNode(null)}
          hovered={hoveredNode === node.id}
        />
      ))}

      {/* Legend */}
      <Html position={[-13, 5, 0]} distanceFactor={22}>
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
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Legend</div>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ color }}>{STATUS_LABELS[status as Status]}</span>
            </div>
          ))}
        </div>
      </Html>

      {/* Stats panel */}
      <Html position={[13, 5, 0]} distanceFactor={22}>
        <div style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363D',
          borderRadius: 10,
          padding: '14px 18px',
          width: 200,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          color: '#E6EDF3',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#58A6FF', fontSize: 13 }}>
            LD Project Stats
          </div>
          <div style={{ color: '#8B949E', lineHeight: 1.8 }}>
            <div>58+ observables predicted</div>
            <div style={{ color: '#3FB950' }}>18 Tier A (≤2σ)</div>
            <div style={{ color: '#FFD700' }}>0 free parameters</div>
            <div>508/508 consistency checks</div>
          </div>
        </div>
      </Html>
    </group>
  );
}
