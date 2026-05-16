import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface FourRoutes3DProps {
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// ── Layout ──
// Four arches in 3D, each starting from a different "axis" (different
// mathematical world), all landing on the same central pair (d1, d2) = (2, 3).
// Arches sit on a circle around the central sink, rotated by 90° each.
//
// Source-arc convention: each route starts at angle phi on a ring of radius R,
// goes up through a peak, comes down at (2, 3, 0) at the center.

const SINK_RADIUS = 0.65;       // central plinth radius
const ARC_RADIUS = 5.5;          // source ring radius
const ARC_PEAK_HEIGHT = 3.2;     // how high arches rise

interface Route {
  id: string;
  angle: number;            // around the central axis (rad)
  color: string;
  emissive: string;
  title: string;
  equation: string;
  blockId: string;
  status: string;
  detail: string;
}

const ROUTES: Route[] = [
  {
    id: 'catalan',
    angle: 0,
    color: '#FFD700',
    emissive: '#B8860B',
    title: 'Catalan',
    equation: 'd2 − d1 = 1',
    blockId: 'X.339h / X.354a',
    status: 'THM-arith ★5',
    detail: 'Catalan-Mihailescu bridge: consecutive prime-power difference 1 forces (d1,d2)=(2,3) among primes.',
  },
  {
    id: 'ncg',
    angle: Math.PI / 2,
    color: '#58A6FF',
    emissive: '#1F6FEB',
    title: 'NCG / Connes',
    equation: 'Connes algebra A_F',
    blockId: 'A.1',
    status: 'DER ★4',
    detail: 'Connes finite-spectrum geometry: A_F = C ⊕ H ⊕ M_3(C) → algebra dimensions (1, d1, d2^2).',
  },
  {
    id: 'ihara',
    angle: Math.PI,
    color: '#7EE787',
    emissive: '#238636',
    title: 'Ihara zeta',
    equation: 'd1^3 = N + 2',
    blockId: 'X.358c',
    status: 'THM-arith ★4',
    detail: 'Ihara discriminant of Q_b on L_Cayley equals −L; uniqueness via 2^3 = 8 = 6+2.',
  },
  {
    id: 'mihailescu',
    angle: 3 * Math.PI / 2,
    color: '#F778BA',
    emissive: '#DA3633',
    title: 'Mihailescu',
    equation: 'd2^2 − d1^3 = 1',
    blockId: 'X.358b',
    status: 'THM-arith ★4',
    detail: 'Yukawa → Mihailescu: 9 − 8 = 1, the only nontrivial solution of x^p − y^q = 1 for p,q ≥ 2.',
  },
];

// Build an arch curve from (cos(angle)*R, 0, sin(angle)*R) up over to origin
function makeArchCurve(angle: number): THREE.CubicBezierCurve3 {
  const sx = Math.cos(angle) * ARC_RADIUS;
  const sz = Math.sin(angle) * ARC_RADIUS;
  const start = new THREE.Vector3(sx, 0.4, sz);
  const end = new THREE.Vector3(0, SINK_RADIUS + 0.3, 0);
  // Control points lift the arch high above
  const ctrl1 = new THREE.Vector3(sx * 0.7, ARC_PEAK_HEIGHT * 0.9, sz * 0.7);
  const ctrl2 = new THREE.Vector3(sx * 0.25, ARC_PEAK_HEIGHT * 1.0, sz * 0.25);
  return new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
}

// ── Single arch ──
function Arch({ route, hovered, onHover, onUnhover, phaseOffset }: {
  route: Route;
  hovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
  phaseOffset: number;
}) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const beadRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => makeArchCurve(route.angle), [route.angle]);
  const tubeGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 100, 0.08, 16, false),
    [curve]
  );

  useFrame((state) => {
    // Sliding bead along the arch
    if (beadRef.current) {
      const t = (state.clock.elapsedTime * 0.22 + phaseOffset) % 1;
      const p = curve.getPoint(t);
      beadRef.current.position.copy(p);
    }
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = hovered ? 1.1 : 0.5 + Math.sin(state.clock.elapsedTime * 1.2 + phaseOffset * Math.PI * 2) * 0.12;
    }
  });

  // Source pillar position
  const sx = Math.cos(route.angle) * ARC_RADIUS;
  const sz = Math.sin(route.angle) * ARC_RADIUS;

  return (
    <group>
      {/* Source pillar (small platform) */}
      <mesh position={[sx, 0.2, sz]} onPointerOver={onHover} onPointerOut={onUnhover}>
        <cylinderGeometry args={[0.5, 0.55, 0.4, 24]} />
        <meshStandardMaterial
          color={route.color}
          emissive={route.emissive}
          emissiveIntensity={hovered ? 0.6 : 0.25}
        />
      </mesh>

      {/* Arch tube */}
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
          opacity={hovered ? 0.95 : 0.78}
        />
      </mesh>

      {/* Sliding bead */}
      <mesh ref={beadRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={route.color}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      {/* Labels at pillar — radial-out direction */}
      <Text
        position={[sx * 1.18, 1.5, sz * 1.18]}
        fontSize={0.36}
        color={route.color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.014}
        outlineColor="#000000"
      >
        {route.title}
      </Text>
      <Text
        position={[sx * 1.18, 1.15, sz * 1.18]}
        fontSize={0.24}
        color="#E6EDF3"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {route.equation}
      </Text>
      <Text
        position={[sx * 1.18, 0.85, sz * 1.18]}
        fontSize={0.18}
        color="#8B949E"
        anchorX="center"
        anchorY="bottom"
      >
        {route.blockId}
      </Text>
    </group>
  );
}

// ── Central sink: the pair (d1, d2) = (2, 3) ──
function CentralPair({ pulseUp }: { pulseUp: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
      const lift = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      groupRef.current.position.y = SINK_RADIUS + 0.3 + lift + pulseUp;
    }
  });

  return (
    <group>
      {/* Base plinth */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.3, 1.4, 0.4, 32]} />
        <meshStandardMaterial color="#161B22" emissive="#0D1117" emissiveIntensity={0.2} />
      </mesh>

      {/* (d1, d2) = (2, 3) sphere pair, rotating */}
      <group ref={groupRef}>
        {/* d1 = 2 */}
        <group position={[-0.6, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.38, 24, 24]} />
            <meshStandardMaterial
              color="#58A6FF"
              emissive="#1F6FEB"
              emissiveIntensity={0.7}
            />
          </mesh>
          <Text
            position={[0, 0.55, 0]}
            fontSize={0.28}
            color="#58A6FF"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.012}
            outlineColor="#000000"
          >
            d1 = 2
          </Text>
        </group>
        {/* d2 = 3 */}
        <group position={[0.6, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.46, 24, 24]} />
            <meshStandardMaterial
              color="#7EE787"
              emissive="#238636"
              emissiveIntensity={0.7}
            />
          </mesh>
          <Text
            position={[0, 0.65, 0]}
            fontSize={0.28}
            color="#7EE787"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.012}
            outlineColor="#000000"
          >
            d2 = 3
          </Text>
        </group>
      </group>

      {/* Sink label */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.32}
        color="#FFD700"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.013}
        outlineColor="#000000"
      >
        (d1, d2) = (2, 3)
      </Text>
      <Text
        position={[0, -0.78, 0]}
        fontSize={0.2}
        color="#8B949E"
        anchorX="center"
        anchorY="top"
        maxWidth={6}
      >
        N = d1 · d2 = 6  ·  index = (d1+1)(d2+1) = 12
      </Text>
    </group>
  );
}

// ── Main export ──
export function FourRoutes3D({ selectedParticle: _sp, onSelectParticle: _op }: FourRoutes3DProps) {
  void _sp; void _op;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 4, 0]} intensity={1.3} color="#FFD700" />
      <directionalLight position={[6, 6, 6]} intensity={0.6} />
      <directionalLight position={[-6, 6, -6]} intensity={0.3} />

      {ROUTES.map((route, i) => (
        <Arch
          key={route.id}
          route={route}
          hovered={hovered === route.id}
          onHover={() => setHovered(route.id)}
          onUnhover={() => setHovered(null)}
          phaseOffset={i / ROUTES.length}
        />
      ))}

      <CentralPair pulseUp={hovered ? 0.12 : 0} />

      {/* Ground grid */}
      <gridHelper args={[14, 14, '#30363D', '#21262D']} position={[0, 0, 0]} />

      {/* Title */}
      <Text
        position={[0, 5.4, 0]}
        fontSize={0.42}
        color="#E6EDF3"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        Four Independent Routes to (d1, d2) = (2, 3)
      </Text>
      <Text
        position={[0, 4.95, 0]}
        fontSize={0.21}
        color="#8B949E"
        anchorX="center"
        anchorY="bottom"
      >
        Not a fit — the unique pair satisfying four independent equations
      </Text>
    </>
  );
}

export default FourRoutes3D;
