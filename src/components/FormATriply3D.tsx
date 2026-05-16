import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface FormATriply3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── Layout ──
// Three "source" points in space; one central "sink" at Σ = -L = -7.
// Each source represents an independent mathematical route that fixes
// the self-energy normalisation Σ = -L. All three converge — this is
// what "Form A triply determined" means (S541 in companion).

const SINK = new THREE.Vector3(0, 0, 0); // Σ = -L

interface Route {
  id: string;
  source: THREE.Vector3;
  color: string;
  emissive: string;
  title: string;
  blockId: string;
  status: string;
  short: string;
  detail: string;
}

const ROUTES: Route[] = [
  {
    id: 'anchor',
    source: new THREE.Vector3(-6, 3.5, 1),
    color: '#58A6FF',
    emissive: '#1F6FEB',
    title: 'Anchor Fricke-pair',
    blockId: 'X.423',
    status: 'THM-arith ★4',
    short: 'Anchor-Pair Demarcation',
    detail: 'Anchor + Fricke-pair intersection: {-L, -N} narrowing on the (anchor-pair) layer.',
  },
  {
    id: 'grothendieck',
    source: new THREE.Vector3(6, 3.5, 1),
    color: '#7EE787',
    emissive: '#238636',
    title: 'Grothendieck whole-eigensummand',
    blockId: 'X.247c.cond',
    status: 'DER ★3',
    short: 'Object-identification (cond.)',
    detail: 'W6-odd eigensummand of f_* O_{X_0(6)} carries χ = -L = -7 via Atkin-Lehner splitting (conditional Costello/BV).',
  },
  {
    id: 'logres',
    source: new THREE.Vector3(0, -4.5, 1.5),
    color: '#F778BA',
    emissive: '#DA3633',
    title: 'Fricke-pair log-residue',
    blockId: 'G.10C',
    status: 'DER ★3',
    short: 'Cuspal residue sum',
    detail: 'Log-residue sum over the Fricke anchor pair equals -L. Closes the typing step in the narrowing chain.',
  },
];

// Curved path from source to sink (bezier via control point pulled toward origin)
function makeRouteCurve(src: THREE.Vector3): THREE.CubicBezierCurve3 {
  // control points: gently bowed toward the center, slight z-arc
  const ctrl1 = new THREE.Vector3(src.x * 0.6, src.y * 0.6, src.z * 0.4 + 0.5);
  const ctrl2 = new THREE.Vector3(src.x * 0.2, src.y * 0.2, 0.3);
  return new THREE.CubicBezierCurve3(src.clone(), ctrl1, ctrl2, SINK.clone());
}

// ── Animated convergence beam ──
function RouteBeam({ route, hovered, onHover, onUnhover }: {
  route: Route;
  hovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => makeRouteCurve(route.source), [route.source]);

  const tubeGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 80, 0.06, 12, false),
    [curve]
  );

  useFrame((state) => {
    if (pulseRef.current) {
      // Sliding pulse along the curve
      const t = (state.clock.elapsedTime * 0.25 + (route.id === 'anchor' ? 0 : route.id === 'grothendieck' ? 0.33 : 0.66)) % 1;
      const p = curve.getPoint(t);
      pulseRef.current.position.copy(p);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      pulseRef.current.scale.setScalar(pulse);
    }
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = hovered ? 1.0 : 0.45 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Beam tube */}
      <mesh
        ref={tubeRef}
        geometry={tubeGeo}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <meshStandardMaterial
          color={route.color}
          emissive={route.emissive}
          emissiveIntensity={0.5}
          transparent
          opacity={hovered ? 0.95 : 0.75}
        />
      </mesh>

      {/* Sliding pulse */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={route.color}
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Source node */}
      <mesh position={route.source}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial
          color={route.color}
          emissive={route.emissive}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Source label */}
      <Text
        position={[route.source.x, route.source.y + 0.7, route.source.z]}
        fontSize={0.32}
        color={route.color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.012}
        outlineColor="#000000"
      >
        {route.title}
      </Text>
      <Text
        position={[route.source.x, route.source.y + 0.35, route.source.z]}
        fontSize={0.21}
        color="#E6EDF3"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.008}
        outlineColor="#000000"
      >
        {route.blockId + '  ' + route.status}
      </Text>
    </group>
  );
}

// ── Central sink: Sigma = -L = -7 ──
function SinkCore({ hoveredRoute }: { hoveredRoute: string | null }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.08;
      coreRef.current.scale.setScalar(hoveredRoute ? 1.3 : pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.6;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -state.clock.elapsedTime * 0.4;
      ring2Ref.current.rotation.x = Math.PI / 2;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFA500"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.95, 0.04, 12, 80]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.25, 0.03, 12, 80]} />
        <meshStandardMaterial color="#FFC857" emissive="#FFC857" emissiveIntensity={0.6} />
      </mesh>

      <Text
        position={[0, 1.8, 0]}
        fontSize={0.55}
        color="#FFD700"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Sigma = -L = -7
      </Text>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.26}
        color="#E6EDF3"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.01}
        outlineColor="#000000"
        maxWidth={6}
      >
        Self-energy normalisation. Three independent routes converge.
      </Text>
    </group>
  );
}

// ── Main export ──
export function FormATriply3D({ selectedParticle: _sp, onSelectParticle: _op }: FormATriply3DProps) {
  void _sp; void _op;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 5]} intensity={1.2} color="#FFD700" />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      {/* Three convergence beams */}
      {ROUTES.map(route => (
        <RouteBeam
          key={route.id}
          route={route}
          hovered={hovered === route.id}
          onHover={() => setHovered(route.id)}
          onUnhover={() => setHovered(null)}
        />
      ))}

      {/* Central sink */}
      <SinkCore hoveredRoute={hovered} />

      {/* Faint background grid plane */}
      <gridHelper args={[20, 20, '#30363D', '#21262D']} position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Title */}
      <Text
        position={[0, 5.5, 0]}
        fontSize={0.42}
        color="#E6EDF3"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        Form A — Triply Determined
      </Text>
      <Text
        position={[0, 5.05, 0]}
        fontSize={0.22}
        color="#8B949E"
        anchorX="center"
        anchorY="bottom"
      >
        S541 closure · X.247c [CONJ HEADLINE] preserved
      </Text>
    </>
  );
}

export default FormATriply3D;
