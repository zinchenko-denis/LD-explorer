import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface LatticeCubeProps {
  particles: Particle[];
  highlightedN: number | null;
  highlightedK: number | null;
  selectedParticle: Particle | null;
  onSelectParticle: (p: Particle) => void;
}

const B1_SET = [1/3, 1/2, 2/3, 3/4, 1, 4/3, 3/2, 2, 3, Math.sqrt(2)];
const N_VALUES = [-9, -8, 0, 1, 3, 4, 5, 6, 7];

export function LatticeCube({ particles, highlightedN, highlightedK, selectedParticle, onSelectParticle }: LatticeCubeProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Create all possible (n, K) combinations
  const allCells = useMemo(() => {
    const cells: { n: number; k: number; position: [number, number, number]; particle?: Particle }[] = [];
    
    N_VALUES.forEach((n, ni) => {
      B1_SET.forEach((k, ki) => {
        const particle = particles.find(p => p.n === n && Math.abs(p.K - k) < 0.01);
        cells.push({
          n,
          k,
          position: [(ni - 4) * 2.5, (ki - 4.5) * 2.5, 0],
          particle
        });
      });
    });
    
    return cells;
  }, [particles]);

  // Count statistics
  const stats = useMemo(() => {
    const total = N_VALUES.length * B1_SET.length;
    const occupied = particles.length;
    const empty = total - occupied;
    return { total, occupied, empty };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 14, 0]} fontSize={1.5} color="#58A6FF" anchorX="center" anchorY="middle">
        Lattice-K Parameter Space
      </Text>
      <Text position={[0, 12, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        {stats.occupied} occupied / {stats.empty} empty / {stats.total} total cells
      </Text>

      {/* Axis Labels */}
      <Text position={[-14, 0, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" rotation={[0, 0, Math.PI / 2]}>
        K Multiplier (B_1 Set)
      </Text>
      <Text position={[0, -14, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center">
        Lattice Node (n)
      </Text>

      {/* Column Labels (n values) */}
      {N_VALUES.map((n, i) => (
        <Text
          key={`n-${n}`}
          position={[(i - 4) * 2.5, 12, 0]}
          fontSize={0.6}
          color={highlightedN === n ? '#58A6FF' : '#E6EDF3'}
          anchorX="center"
          anchorY="bottom"
        >
          n={n}
        </Text>
      ))}

      {/* Row Labels (K values) */}
      {B1_SET.map((k, i) => (
        <Text
          key={`k-${i}`}
          position={[-14, (i - 4.5) * 2.5, 0]}
          fontSize={0.5}
          color={highlightedK === k ? '#F0883E' : '#E6EDF3'}
          anchorX="right"
          anchorY="middle"
        >
          {k === Math.sqrt(2) ? 'sqrt2' : k.toFixed(2)}
        </Text>
      ))}

      {/* Grid Cells */}
      {allCells.map((cell, idx) => {
        const isOccupied = !!cell.particle;
        const isHighlightedN = highlightedN === cell.n;
        const isSelected = selectedParticle?.name === cell.particle?.name;
        
        const color = isOccupied 
          ? (cell.particle?.type === 'quark-up' ? '#58A6FF' :
             cell.particle?.type === 'quark-down' ? '#3FB950' :
             cell.particle?.type === 'lepton' ? '#D29922' :
             cell.particle?.type === 'boson' ? '#F0883E' : '#A371F7')
          : '#30363D';

        return (
          <group key={idx} position={cell.position}>
            {/* Cell */}
            <mesh
              onClick={() => cell.particle && onSelectParticle(cell.particle)}
              onPointerOver={() => { document.body.style.cursor = cell.particle ? 'pointer' : 'default'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
              <boxGeometry args={[1.8, 1.8, isOccupied ? 0.8 : 0.2]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={isOccupied ? 0.95 : 0.3}
                emissive={color}
                emissiveIntensity={isSelected ? 0.9 : isOccupied ? 0.4 : 0}
              />
            </mesh>

            {/* Selection highlight */}
            {isSelected && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.1, 1.3, 32]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Highlight for N */}
            {isHighlightedN && !isOccupied && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1, 1.15, 32]} />
                <meshBasicMaterial color="#58A6FF" transparent opacity={0.5} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Highlight for K */}
            {highlightedK && Math.abs(highlightedK - cell.k) < 0.01 && !isOccupied && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1, 1.15, 32]} />
                <meshBasicMaterial color="#F0883E" transparent opacity={0.5} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Particle name */}
            {cell.particle && (
              <Text
                position={[0, 0, 0.5]}
                fontSize={0.7}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
              >
                {cell.particle?.name}
              </Text>
            )}
          </group>
        );
      })}

      {/* Statistics Display */}
      <group position={[0, -16, 0]}>
        <Text position={[-6, 0, 0]} fontSize={0.8} color="#3FB950" anchorX="center" anchorY="middle">
          {stats.occupied} occupied
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.8} color="#E6EDF3" anchorX="center" anchorY="middle">
          /
        </Text>
        <Text position={[6, 0, 0]} fontSize={0.8} color="#6E7681" anchorX="center" anchorY="middle">
          {stats.empty} empty
        </Text>
        <Text position={[0, -2, 0]} fontSize={0.5} color="#E6EDF3/60" anchorX="center" anchorY="middle">
          {((stats.occupied / stats.total) * 100).toFixed(1)}% occupancy
        </Text>
      </group>

      {/* Legend */}
      <group position={[16, 8, 0]}>
        <Text position={[0, 5, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Occupied Cells:</Text>
        
        <group position={[0, 4, 0]}>
          <mesh><boxGeometry args={[0.5, 0.5, 0.3]} /><meshStandardMaterial color="#58A6FF" /></mesh>
          <Text position={[1, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Quark Up</Text>
        </group>
        <group position={[0, 3, 0]}>
          <mesh><boxGeometry args={[0.5, 0.5, 0.3]} /><meshStandardMaterial color="#3FB950" /></mesh>
          <Text position={[1, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Quark Down</Text>
        </group>
        <group position={[0, 2, 0]}>
          <mesh><boxGeometry args={[0.5, 0.5, 0.3]} /><meshStandardMaterial color="#D29922" /></mesh>
          <Text position={[1, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Lepton</Text>
        </group>
        <group position={[0, 1, 0]}>
          <mesh><boxGeometry args={[0.5, 0.5, 0.3]} /><meshStandardMaterial color="#F0883E" /></mesh>
          <Text position={[1, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Boson</Text>
        </group>
        <group position={[0, 0, 0]}>
          <mesh><boxGeometry args={[0.5, 0.5, 0.3]} /><meshStandardMaterial color="#A371F7" /></mesh>
          <Text position={[1, 0, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Anchor</Text>
        </group>

        <group position={[0, -2, 0]}>
          <mesh><boxGeometry args={[0.5, 0.5, 0.1]} /><meshStandardMaterial color="#30363D" transparent opacity={0.5} /></mesh>
          <Text position={[1, 0, 0]} fontSize={0.5} color="#6E7681" anchorX="left">Empty</Text>
        </group>
      </group>

      {/* Formula */}
      <group position={[-16, -8, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.8} color="#58A6FF" anchorX="left" anchorY="middle">
          m_n = m_e * g^n * K
        </Text>
        <Text position={[0, -1.5, 0]} fontSize={0.5} color="#E6EDF3/60" anchorX="left" anchorY="middle">
          g = mu^1/^4 ~ 6.55
        </Text>
      </group>
    </group>
  );
}
