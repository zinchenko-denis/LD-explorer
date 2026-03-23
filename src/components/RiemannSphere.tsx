import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface RiemannSphereProps {
  particles: Particle[];
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// Map particle (n, K) to spherical coordinates
// n: -9 to 7 -> theta angle (longitude)
// K: 1/3 to 3 -> phi angle (latitude)
function particleToSpherical(n: number, K: number): { theta: number; phi: number } {
  // n range: -9 to 7 (total span 16)
  // Map to theta: -PI to PI
  const theta = ((n + 1) / 8) * Math.PI; // -9->-PI, 7->PI
  
  // K range: 0.33 to 3
  // Map to phi: 0.2*PI to 0.8*PI (avoid poles)
  const Kmin = 1/3;
  const Kmax = 3;
  const phi = 0.2 * Math.PI + ((K - Kmin) / (Kmax - Kmin)) * 0.6 * Math.PI;
  
  return { theta, phi };
}

// Convert spherical to cartesian
function sphericalToCartesian(r: number, theta: number, phi: number): [number, number, number] {
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

// EWSB point: tau = i, this is a special point on the modular surface
// In our parametrization, it's at the "equator" where symmetry is maximal
const EWSB_SPHERICAL = { theta: 0, phi: Math.PI / 2 }; // Equator

const PARTICLE_COLORS: Record<string, string> = {
  'e': '#D29922', 'u': '#58A6FF', 'd': '#3FB950',
  'mu': '#D29922', 's': '#3FB950', 'p': '#FF6B9D',
  'c': '#58A6FF', 'tau': '#D29922', 'b': '#3FB950',
  'W': '#F0883E', 'H': '#A371F7', 't': '#58A6FF',
};

// Dessin edges based on shared n or K values
const getEdges = (particles: Particle[]) => {
  const edges: { from: string; to: string; color: string }[] = [];
  
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      
      // Connect if same n or same K
      if (p1.n === p2.n || Math.abs(p1.K - p2.K) < 0.01) {
        edges.push({
          from: p1.name,
          to: p2.name,
          color: p1.n === p2.n ? '#58A6FF' : '#3FB950'
        });
      }
    }
  }
  
  return edges;
};

export function RiemannSphere({ particles, selectedParticle, onSelectParticle }: RiemannSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hoveredParticle, setHoveredParticle] = useState<string | null>(null);
  const [showEdges, setShowEdges] = useState(true);
  const [showCusps, setShowCusps] = useState(true);
  const [pulsePhase, setPulsePhase] = useState(0);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
    
    // Pulsing animation for EWSB point
    setPulsePhase(state.clock.elapsedTime * 2);
    
    // Pulsing sphere surface
    if (sphereRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      sphereRef.current.scale.setScalar(scale);
    }
  });

  // Generate particle positions based on their (n, K) values
  const particlePositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {};
    
    particles.forEach(p => {
      const { theta, phi } = particleToSpherical(p.n, p.K);
      positions[p.name] = sphericalToCartesian(5, theta, phi);
    });
    
    return positions;
  }, [particles]);

  // EWSB position
  const ewsbPosition = useMemo(() => {
    return sphericalToCartesian(5.3, EWSB_SPHERICAL.theta, EWSB_SPHERICAL.phi);
  }, []);

  const edges = useMemo(() => getEdges(particles), [particles]);

  // Generate sphere surface dots
  const surfaceDots = useMemo(() => {
    const dots = [];
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const theta = (i / 20) * Math.PI * 2;
        const phi = (j / 20) * Math.PI;
        dots.push(sphericalToCartesian(5, theta, phi));
      }
    }
    return dots;
  }, []);

  // 4 Cusps at special points (like poles and equator points)
  const cusps = useMemo(() => [
    { pos: sphericalToCartesian(5.2, 0, 0.3), label: 'inf' },
    { pos: sphericalToCartesian(5.2, Math.PI, 0.3), label: '0' },
    { pos: sphericalToCartesian(5.2, Math.PI/2, Math.PI - 0.3), label: '1/3' },
    { pos: sphericalToCartesian(5.2, -Math.PI/2, Math.PI - 0.3), label: '1/2' },
  ], []);

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 12, 0]} fontSize={1.5} color="#A371F7" anchorX="center" anchorY="middle">
        Riemann Sphere X_0(6)
      </Text>
      <Text position={[0, 10, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        Particles positioned by (n, K) values
      </Text>

      {/* Pulsing sphere surface */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial
          color="#0a1628"
          transparent
          opacity={0.25}
          emissive="#1a2744"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe */}
      <mesh>
        <sphereGeometry args={[5.02, 32, 32]} />
        <meshBasicMaterial
          color="#30363D"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>

      {/* Surface dots */}
      {surfaceDots.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06]} />
          <meshStandardMaterial color="#1a365d" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* EWSB point (j=1728) - the mummification point */}
      <group position={ewsbPosition}>
        {/* Pulsing rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6 + Math.sin(pulsePhase) * 0.1, 0.7 + Math.sin(pulsePhase) * 0.1, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, pulsePhase * 0.5, 0]}>
          <ringGeometry args={[0.8, 0.85, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Core */}
        <mesh>
          <sphereGeometry args={[0.35]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.9}
          />
        </mesh>
        {/* Label */}
        <Text position={[0, 1.2, 0]} fontSize={0.5} color="#FFD700" anchorX="center">
          j=1728
        </Text>
        <Text position={[0, -1.2, 0]} fontSize={0.4} color="#6E7681" anchorX="center">
          EWSB
        </Text>
      </group>

      {/* Cusps */}
      {showCusps && cusps.map((cusp, i) => (
        <group key={i} position={cusp.pos}>
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="#000000" emissive="#1a1a2e" emissiveIntensity={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.75, 32]} />
            <meshBasicMaterial color="#FF6B9D" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <Text position={[0, 1.3, 0]} fontSize={0.5} color="#FF6B9D" anchorX="center">
            {cusp.label}
          </Text>
        </group>
      ))}

      {/* Edges */}
      {showEdges && edges.map((edge, idx) => {
        const fromPos = particlePositions[edge.from];
        const toPos = particlePositions[edge.to];
        if (!fromPos || !toPos) return null;

        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([...fromPos, ...toPos]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={edge.color} transparent opacity={0.4} />
          </line>
        );
      })}

      {/* Particles */}
      {particles.map((p) => {
        const pos = particlePositions[p.name];
        if (!pos) return null;
        
        const isHovered = hoveredParticle === p.name;
        const isSelected = selectedParticle?.name === p.name;
        const color = PARTICLE_COLORS[p.name] || '#E6EDF3';

        return (
          <group key={p.name} position={pos}>
            {/* Glow */}
            {(isHovered || isSelected) && (
              <mesh>
                <sphereGeometry args={[0.55]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.25} />
              </mesh>
            )}

            {/* Particle sphere */}
            <mesh
              onClick={() => onSelectParticle && onSelectParticle(p)}
              onPointerOver={() => setHoveredParticle(p.name)}
              onPointerOut={() => setHoveredParticle(null)}
            >
              <sphereGeometry args={[0.32]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 1 : isHovered ? 0.7 : 0.4}
              />
            </mesh>

            {/* Label */}
            <Text position={[0, 0.7, 0]} fontSize={0.45} color="#FFFFFF" anchorX="center">
              {p.name}
            </Text>

            {/* Info on hover */}
            {(isHovered || isSelected) && (
              <Text position={[0, -0.7, 0]} fontSize={0.3} color="#6E7681" anchorX="center">
                n={p.n} K={p.K < 1 ? p.K.toFixed(2) : p.K}
              </Text>
            )}
          </group>
        );
      })}

      {/* Legend */}
      <group position={[-12, 7, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Riemann Sphere X_0(6):</Text>
        <Text position={[0, 3.2, 0]} fontSize={0.5} color="#6E7681" anchorX="left">Genus g = 0</Text>
        <Text position={[0, 2.6, 0]} fontSize={0.5} color="#6E7681" anchorX="left">4 Cusps (holes)</Text>
        <Text position={[0, 2, 0]} fontSize={0.5} color="#6E7681" anchorX="left">12 Particles</Text>
        
        <Text position={[0, 1.2, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Position:</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">Angle = n (lattice)</Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color="#3FB950" anchorX="left">Height = K (multiplier)</Text>
        
        <Text position={[0, -0.8, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">EWSB Point:</Text>
        <Text position={[0, -1.4, 0]} fontSize={0.5} color="#FFD700" anchorX="left">j = 1728 (tau = i)</Text>
        <Text position={[0, -2, 0]} fontSize={0.5} color="#6E7681" anchorX="left">Where continuous</Text>
        <Text position={[0, -2.6, 0]} fontSize={0.5} color="#6E7681" anchorX="left">becomes discrete</Text>
      </group>

      {/* Controls */}
      <group position={[12, 7, 0]}>
        <Text position={[0, 4, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Controls:</Text>
        <mesh position={[0, 3.2, 0]} onClick={() => setShowEdges(!showEdges)}>
          <boxGeometry args={[0.4, 0.4, 0.1]} />
          <meshStandardMaterial color={showEdges ? '#3FB950' : '#30363D'} />
        </mesh>
        <Text position={[0.6, 3.2, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">
          Toggle Edges
        </Text>
        <mesh position={[0, 2.6, 0]} onClick={() => setShowCusps(!showCusps)}>
          <boxGeometry args={[0.4, 0.4, 0.1]} />
          <meshStandardMaterial color={showCusps ? '#3FB950' : '#30363D'} />
        </mesh>
        <Text position={[0.6, 2.6, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">
          Toggle Cusps
        </Text>
      </group>

      {/* Bottom info */}
      <group position={[0, -12, 0]}>
        <Text position={[-6, 0, 0]} fontSize={0.6} color="#58A6FF" anchorX="center">
          Continuous: Sphere Surface
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color="#6E7681" anchorX="center">
          |
        </Text>
        <Text position={[6, 0, 0]} fontSize={0.6} color="#D29922" anchorX="center">
          Discrete: 12 Points
        </Text>
      </group>

      {/* Animation note */}
      <group position={[12, -6, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Animation:</Text>
        <Text position={[0, 2.4, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Sphere pulses = vacuum</Text>
        <Text position={[0, 1.8, 0]} fontSize={0.45} color="#6E7681" anchorX="left">fluctuations</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.45} color="#FFD700" anchorX="left">Gold point = EWSB</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.45} color="#FFD700" anchorX="left">(symmetry breaking)</Text>
      </group>
    </group>
  );
}
