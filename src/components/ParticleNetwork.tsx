import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface ParticleNetworkProps {
  particles: Particle[];
  showConnections: boolean;
  selectedParticle: Particle | null;
  onSelectParticle: (p: Particle) => void;
}

const PARTICLE_COLORS: Record<string, string> = {
  'quark-up': '#58A6FF',
  'quark-down': '#3FB950',
  'lepton': '#D29922',
  'boson': '#F0883E',
  'anchor': '#A371F7',
};

export function ParticleNetwork({ particles, showConnections, selectedParticle, onSelectParticle }: ParticleNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);

  const nodePositions = useMemo(() => {
    return particles.map((p) => {
      const x = p.n * 3;
      const y = Math.log10(p.mass) * 3 - 12;
      const z = (p.K - 1) * 4;
      return { particle: p, position: [x, y, z] as [number, number, number] };
    });
  }, [particles]);

  const connections = useMemo(() => {
    const conns: { from: [number, number, number]; to: [number, number, number]; color: string }[] = [];
    
    if (!showConnections) return conns;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        
        if (p1.n === p2.n) {
          const pos1 = nodePositions[i].position;
          const pos2 = nodePositions[j].position;
          conns.push({ from: pos1, to: pos2, color: '#58A6FF' });
        }
        
        if (Math.abs(p1.K - p2.K) < 0.01) {
          const pos1 = nodePositions[i].position;
          const pos2 = nodePositions[j].position;
          conns.push({ from: pos1, to: pos2, color: '#F0883E' });
        }
        
        if (p1.generation && p2.generation && Math.abs(p1.generation - p2.generation) === 1 && p1.type === p2.type) {
          const pos1 = nodePositions[i].position;
          const pos2 = nodePositions[j].position;
          conns.push({ from: pos1, to: pos2, color: '#3FB950' });
        }
      }
    }
    return conns;
  }, [particles, showConnections, nodePositions]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Text position={[0, 14, 0]} fontSize={1.5} color="#58A6FF" anchorX="center" anchorY="middle">
        Particle Mass Spectrum
      </Text>

      <Text position={[-15, 0, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" rotation={[0, 0, Math.PI / 2]}>
        log_1_0(Mass/MeV)
      </Text>
      <Text position={[0, -16, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center">
        Lattice Node (n)
      </Text>
      <Text position={[0, 0, 10]} fontSize={0.7} color="#E6EDF3" anchorX="center" rotation={[0, Math.PI / 2, 0]}>
        K Multiplier
      </Text>

      {connections.map((conn, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([...conn.from, ...conn.to]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={conn.color} transparent opacity={0.4} linewidth={2} />
        </line>
      ))}

      {nodePositions.map(({ particle, position }) => {
        const color = PARTICLE_COLORS[particle.type] || '#FFFFFF';
        const isSelected = selectedParticle?.name === particle.name;
        const size = particle.anchor ? 1 : 0.6 + Math.log10(particle.mass) * 0.08;

        return (
          <group key={particle.name} position={position}>
            <mesh
              onClick={() => onSelectParticle(particle)}
              onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
              <sphereGeometry args={[size, 32, 32]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.9 : 0.4}
                transparent
                opacity={0.95}
              />
            </mesh>

            {isSelected && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[size + 0.2, size + 0.4, 64]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} side={THREE.DoubleSide} />
              </mesh>
            )}

            <Billboard follow lockX={false} lockY={false} lockZ={false}>
              <Text position={[0, size + 1, 0]} fontSize={0.8} color="#FFFFFF" anchorX="center" anchorY="bottom">
                {particle.name}
              </Text>

              <Text position={[0, -size - 0.8, 0]} fontSize={0.5} color="#E6EDF3" anchorX="center" anchorY="top">
                {particle.mass < 1000 
                  ? `${particle.mass.toFixed(1)} MeV` 
                  : `${(particle.mass / 1000).toFixed(2)} GeV`}
              </Text>
            </Billboard>
          </group>
        );
      })}

      <group position={[15, 10, 0]}>
        <Text position={[0, 5, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Particle Types:</Text>
        
        {Object.entries(PARTICLE_COLORS).map(([type, color], i) => (
          <group key={type} position={[0, 4 - i * 1.5, 0]}>
            <mesh>
              <sphereGeometry args={[0.4]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <Text position={[1, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">
              {type.replace('-', ' ')}
            </Text>
          </group>
        ))}
      </group>

      <group position={[0, -18, 0]}>
        <Text position={[0, 0, 0]} fontSize={1} color="#58A6FF" anchorX="center" anchorY="middle">
          m_n = m_e * mu^n/^4 * K(n)
        </Text>
        <Text position={[0, -1.8, 0]} fontSize={0.5} color="#E6EDF3" anchorX="center" anchorY="middle">
          mu = 1836.15, g = mu^1/^4 ~ 6.55
        </Text>
      </group>
    </group>
  );
}
