import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface KCipherVisualizerProps {
  highlightedK: number | null;
  selectedParticle: Particle | null;
}

const B1_SET = [
  { value: 1, label: '1', dist: 0 },
  { value: 1/2, label: '1/2', dist: 1 },
  { value: 2, label: '2', dist: 1 },
  { value: 1/3, label: '1/3', dist: 1 },
  { value: 3, label: '3', dist: 1 },
  { value: 2/3, label: '2/3', dist: 2 },
  { value: 3/2, label: '3/2', dist: 2 },
  { value: 3/4, label: '3/4', dist: 3 },
  { value: 4/3, label: '4/3', dist: 3 },
  { value: Math.sqrt(2), label: 'sqrt2', dist: -1, special: true },
];

const PARTICLE_ASSIGNMENTS: Record<string, { k: number; n: number }> = {
  'e': { k: 1, n: 0 },
  'u': { k: 2/3, n: 1 },
  'd': { k: Math.sqrt(2), n: 1 },
  'mu': { k: 3/4, n: 3 },
  's': { k: 2/3, n: 3 },
  'p': { k: 1, n: 4 },
  'c': { k: 4/3, n: 4 },
  'tau': { k: 2, n: 4 },
  'b': { k: 2/3, n: 5 },
  'W': { k: 2, n: 6 },
  'H': { k: 3, n: 6 },
  't': { k: 2/3, n: 7 },
};

export function KCipherVisualizer({ highlightedK, selectedParticle }: KCipherVisualizerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const heckeOrbit = useMemo(() => {
    return B1_SET.filter(k => !k.special);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text
        position={[0, 12, 0]}
        fontSize={1.5}
        color="#F0883E"
        anchorX="center"
        anchorY="middle"
      >
        K-Cipher: Design Structure
      </Text>
      <Text
        position={[0, 10, 0]}
        fontSize={0.7}
        color="#E6EDF3"
        anchorX="center"
        anchorY="middle"
      >
        B_1 = Hecke Orbit + sqrt2
      </Text>

      {/* Central Hub (K=1) */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1.5]} />
          <meshStandardMaterial 
            color="#58A6FF" 
            emissive="#58A6FF" 
            emissiveIntensity={0.6}
            transparent
            opacity={0.95}
          />
        </mesh>
        <Text
          position={[0, 0, 1.6]}
          fontSize={1}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          1
        </Text>
        <Text
          position={[0, -2.5, 0]}
          fontSize={0.5}
          color="#E6EDF3"
          anchorX="center"
          anchorY="top"
        >
          Center (dist=0)
        </Text>
      </group>

      {/* Distance 1 Ring */}
      <group>
        {heckeOrbit
          .filter(k => k.dist === 1)
          .map((k, i, arr) => {
            const angle = (i / arr.length) * Math.PI * 2;
            const x = Math.cos(angle) * 6;
            const z = Math.sin(angle) * 6;
            const isHighlighted = highlightedK === k.value;
            const isSelected = selectedParticle && PARTICLE_ASSIGNMENTS[selectedParticle.name]?.k === k.value;

            return (
              <group key={k.label} position={[x, 0, z]}>
                {/* Connection to center */}
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array([0, 0, 0, -x, 0, -z]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#3FB950" transparent opacity={0.4} />
                </line>

                {/* Node */}
                <mesh>
                  <sphereGeometry args={[0.9]} />
                  <meshStandardMaterial 
                    color={isSelected ? '#F0883E' : '#3FB950'}
                    emissive={isSelected ? '#F0883E' : '#3FB950'}
                    emissiveIntensity={isHighlighted || isSelected ? 0.9 : 0.4}
                  />
                </mesh>

                {/* Label */}
                <Text
                  position={[0, 1.8, 0]}
                  fontSize={0.7}
                  color="#FFFFFF"
                  anchorX="center"
                  anchorY="bottom"
                >
                  {k.label}
                </Text>

                {/* Particles using this K */}
                {Object.entries(PARTICLE_ASSIGNMENTS)
                  .filter(([_, v]) => Math.abs(v.k - k.value) < 0.01)
                  .map(([name], pi) => (
                    <Text
                      key={name}
                      position={[1, 0.6 - pi * 0.6, 0]}
                      fontSize={0.4}
                      color="#E6EDF3"
                      anchorX="left"
                    >
                      {name}
                    </Text>
                  ))}
              </group>
            );
          })}
      </group>

      {/* Distance 2 Ring */}
      <group>
        {heckeOrbit
          .filter(k => k.dist === 2)
          .map((k, i, arr) => {
            const angle = (i / arr.length) * Math.PI * 2 + Math.PI / 4;
            const x = Math.cos(angle) * 11;
            const z = Math.sin(angle) * 11;
            const isHighlighted = highlightedK === k.value;
            const isSelected = selectedParticle && PARTICLE_ASSIGNMENTS[selectedParticle.name]?.k === k.value;

            return (
              <group key={k.label} position={[x, 0, z]}>
                {/* Connection to center */}
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array([0, 0, 0, -x, 0, -z]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#D29922" transparent opacity={0.3} />
                </line>

                {/* Node */}
                <mesh>
                  <sphereGeometry args={[0.8]} />
                  <meshStandardMaterial 
                    color={isSelected ? '#F0883E' : '#D29922'}
                    emissive={isSelected ? '#F0883E' : '#D29922'}
                    emissiveIntensity={isHighlighted || isSelected ? 0.9 : 0.4}
                  />
                </mesh>

                {/* Label */}
                <Text
                  position={[0, 1.6, 0]}
                  fontSize={0.6}
                  color="#FFFFFF"
                  anchorX="center"
                  anchorY="bottom"
                >
                  {k.label}
                </Text>

                {/* Particles */}
                {Object.entries(PARTICLE_ASSIGNMENTS)
                  .filter(([_, v]) => Math.abs(v.k - k.value) < 0.01)
                  .map(([name], pi) => (
                    <Text
                      key={name}
                      position={[0.8, 0.5 - pi * 0.5, 0]}
                      fontSize={0.35}
                      color="#E6EDF3"
                      anchorX="left"
                    >
                      {name}
                    </Text>
                  ))}
              </group>
            );
          })}
      </group>

      {/* Distance 3 Ring */}
      <group>
        {heckeOrbit
          .filter(k => k.dist === 3)
          .map((k, i, arr) => {
            const angle = (i / arr.length) * Math.PI * 2 + Math.PI / 6;
            const x = Math.cos(angle) * 16;
            const z = Math.sin(angle) * 16;
            const isHighlighted = highlightedK === k.value;
            const isSelected = selectedParticle && PARTICLE_ASSIGNMENTS[selectedParticle.name]?.k === k.value;

            return (
              <group key={k.label} position={[x, 0, z]}>
                {/* Connection to center */}
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array([0, 0, 0, -x, 0, -z]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#A371F7" transparent opacity={0.2} />
                </line>

                {/* Node */}
                <mesh>
                  <sphereGeometry args={[0.7]} />
                  <meshStandardMaterial 
                    color={isSelected ? '#F0883E' : '#A371F7'}
                    emissive={isSelected ? '#F0883E' : '#A371F7'}
                    emissiveIntensity={isHighlighted || isSelected ? 0.9 : 0.4}
                  />
                </mesh>

                {/* Label */}
                <Text
                  position={[0, 1.4, 0]}
                  fontSize={0.55}
                  color="#FFFFFF"
                  anchorX="center"
                  anchorY="bottom"
                >
                  {k.label}
                </Text>

                {/* Particles */}
                {Object.entries(PARTICLE_ASSIGNMENTS)
                  .filter(([_, v]) => Math.abs(v.k - k.value) < 0.01)
                  .map(([name], pi) => (
                    <Text
                      key={name}
                      position={[0.7, 0.4 - pi * 0.4, 0]}
                      fontSize={0.3}
                      color="#E6EDF3"
                      anchorX="left"
                    >
                      {name}
                    </Text>
                  ))}
              </group>
            );
          })}
      </group>

      {/* sqrt2 Special Element */}
      <group position={[0, 8, 0]}>
        <mesh>
          <sphereGeometry args={[1.2]} />
          <meshStandardMaterial 
            color="#F0883E" 
            emissive="#F0883E" 
            emissiveIntensity={selectedParticle?.name === 'd' ? 1 : 0.6}
            transparent
            opacity={0.95}
          />
        </mesh>
        <Text
          position={[0, 0, 1.4]}
          fontSize={1}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          sqrt2
        </Text>
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.5}
          color="#F0883E"
          anchorX="center"
          anchorY="bottom"
        >
          EWSB (d-quark only)
        </Text>
        <Text
          position={[2, 0, 0]}
          fontSize={0.45}
          color="#E6EDF3"
          anchorX="left"
        >
          d
        </Text>
      </group>

      {/* Legend */}
      <group position={[-18, 6, 0]}>
        <Text position={[0, 6, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Distance Rings:</Text>
        
        <group position={[0, 5, 0]}>
          <mesh>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial color="#58A6FF" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.45} color="#E6EDF3" anchorX="left">dist = 0 (center)</Text>
        </group>
        
        <group position={[0, 4, 0]}>
          <mesh>
            <sphereGeometry args={[0.35]} />
            <meshStandardMaterial color="#3FB950" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.45} color="#E6EDF3" anchorX="left">dist = 1 (4 elements)</Text>
        </group>
        
        <group position={[0, 3, 0]}>
          <mesh>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#D29922" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.45} color="#E6EDF3" anchorX="left">dist = 2 (2 elements)</Text>
        </group>
        
        <group position={[0, 2, 0]}>
          <mesh>
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial color="#A371F7" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.45} color="#E6EDF3" anchorX="left">dist = 3 (2 elements)</Text>
        </group>
        
        <group position={[0, 0.8, 0]}>
          <mesh>
            <sphereGeometry args={[0.35]} />
            <meshStandardMaterial color="#F0883E" />
          </mesh>
          <Text position={[0.8, 0, 0]} fontSize={0.45} color="#E6EDF3" anchorX="left">sqrt2 (EWSB)</Text>
        </group>
      </group>

      {/* Stats */}
      <group position={[15, -8, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">B_1 Statistics:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">|B_1| = 10 elements</Text>
        <Text position={[0, 1.6, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Rational: 9 (Hecke orbit)</Text>
        <Text position={[0, 1, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Irrational: 1 (sqrt2)</Text>
        <Text position={[0, 0.2, 0]} fontSize={0.5} color="#3FB950" anchorX="left">MDL = Hecke: one lattice, two names</Text>
      </group>
    </group>
  );
}
