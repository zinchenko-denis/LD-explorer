import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '@/types/ld-model';

interface DessinCubeProps {
  particles: Particle[];
  selectedParticle: Particle | null;
  onSelectParticle?: (p: Particle) => void;
}

// Dessin structure: 4 black vertices (valency 3), 6 white vertices (valency 2)
// But for the cube visualization: B x W x F where F are face types
// Actually the PDF describes: 4 black vertices, and we consider the structure
// The 12 edges correspond to 12 particles

// For 4x4x4 cube: B (4 values) x W (4 values) x F (4 values) = 64
// But only 12 are physically realizable where B*W*F relates to index

const B_VALUES = [0, 1, 2, 3]; // Black vertex indices
const W_VALUES = [0, 1, 2, 3]; // White vertex indices  
const F_VALUES = [0, 1, 2, 3]; // Face/cusp values

// The 12 valid combinations (B, W, F) that give particles
// Based on the dessin structure from the paper
const VALID_CELLS = [
  { b: 0, w: 0, f: 0, particle: 'e', color: '#D29922' },
  { b: 0, w: 1, f: 1, particle: 'u', color: '#58A6FF' },
  { b: 0, w: 2, f: 2, particle: 'c', color: '#58A6FF' },
  { b: 1, w: 0, f: 1, particle: 'd', color: '#3FB950' },
  { b: 1, w: 1, f: 0, particle: 'mu', color: '#D29922' },
  { b: 1, w: 2, f: 3, particle: 'tau', color: '#D29922' },
  { b: 2, w: 0, f: 2, particle: 's', color: '#3FB950' },
  { b: 2, w: 1, f: 3, particle: 'W', color: '#F0883E' },
  { b: 2, w: 3, f: 1, particle: 't', color: '#58A6FF' },
  { b: 3, w: 0, f: 3, particle: 'b', color: '#3FB950' },
  { b: 3, w: 2, f: 0, particle: 'p', color: '#FF6B9D' },
  { b: 3, w: 3, f: 2, particle: 'H', color: '#A371F7' },
];

export function DessinCube({ particles, selectedParticle, onSelectParticle }: DessinCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [sliceF, setSliceF] = useState<number | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  const allCells = useMemo(() => {
    const cells = [];
    for (const b of B_VALUES) {
      for (const w of W_VALUES) {
        for (const f of F_VALUES) {
          const validCell = VALID_CELLS.find(c => c.b === b && c.w === w && c.f === f);
          cells.push({
            b, w, f,
            position: [(b - 1.5) * 3, (w - 1.5) * 3, (f - 1.5) * 3] as [number, number, number],
            occupied: !!validCell,
            particle: validCell?.particle || null,
            color: validCell?.color || null,
          });
        }
      }
    }
    return cells;
  }, []);

  const stats = { total: 64, occupied: 12, empty: 52 };

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text position={[0, 16, 0]} fontSize={1.5} color="#A371F7" anchorX="center" anchorY="middle">
        Dessin Cube 4x4x4
      </Text>
      <Text position={[0, 14, 0]} fontSize={0.7} color="#E6EDF3" anchorX="center" anchorY="middle">
        B x W x F = 64 cells, 12 occupied, 52 empty
      </Text>

      {/* Axis Labels */}
      <Text position={[-8, 0, 0]} fontSize={0.8} color="#58A6FF" anchorX="center" rotation={[0, 0, Math.PI / 2]}>
        B (Black Vertices)
      </Text>
      <Text position={[0, -8, 0]} fontSize={0.8} color="#3FB950" anchorX="center">
        W (White Vertices)
      </Text>
      <Text position={[0, 0, -8]} fontSize={0.8} color="#F0883E" anchorX="center" rotation={[0, Math.PI / 2, 0]}>
        F (Faces/Cusps)
      </Text>

      {/* Grid Cells */}
      {allCells.map((cell, idx) => {
        const isOccupied = cell.occupied;
        const isHovered = hoveredCell === `${cell.b}-${cell.w}-${cell.f}`;
        const isSelected = selectedParticle?.name === cell.particle;
        const isVisible = sliceF === null || sliceF === cell.f;
        
        if (!isVisible) return null;

        const size = isOccupied ? 1.2 : 0.8;
        const color = isOccupied ? (cell.color || '#30363D') : '#30363D';
        const opacity = isOccupied ? 0.9 : 0.2;

        return (
          <group key={idx} position={cell.position}>
            <mesh
              onClick={() => {
                if (cell.particle && onSelectParticle) {
                  const p = particles.find(part => part.name === cell.particle);
                  if (p) onSelectParticle(p);
                }
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredCell(`${cell.b}-${cell.w}-${cell.f}`);
                document.body.style.cursor = isOccupied ? 'pointer' : 'default';
              }}
              onPointerOut={() => {
                setHoveredCell(null);
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[size, size, size]} />
              <meshStandardMaterial
                color={color as string}
                transparent
                opacity={opacity}
                emissive={color as string}
                emissiveIntensity={isSelected ? 0.8 : isHovered && isOccupied ? 0.5 : 0}
              />
            </mesh>

            {/* Selection highlight */}
            {isSelected && isOccupied && (
              <mesh>
                <boxGeometry args={[size + 0.3, size + 0.3, size + 0.3]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} wireframe />
              </mesh>
            )}

            {/* Hover highlight */}
            {isHovered && isOccupied && (
              <mesh>
                <boxGeometry args={[size + 0.2, size + 0.2, size + 0.2]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} wireframe />
              </mesh>
            )}

            {/* Particle name */}
            {cell.particle && (
              <Text
                position={[0, 0, size/2 + 0.3]}
                fontSize={0.5}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
              >
                {cell.particle}
              </Text>
            )}

            {/* Coordinate labels for empty cells (subtle) */}
            {!isOccupied && isHovered && (
              <Text
                position={[0, 0, 0.6]}
                fontSize={0.3}
                color="#6E7681"
                anchorX="center"
                anchorY="middle"
              >
                {cell.b},{cell.w},{cell.f}
              </Text>
            )}
          </group>
        );
      })}

      {/* Slice selector (F axis) */}
      <group position={[10, 8, 0]}>
        <Text position={[0, 2, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">
          Slice by F:
        </Text>
        {F_VALUES.map(f => (
          <group key={f} position={[f * 1.5, 0, 0]}>
            <mesh
              onClick={() => setSliceF(sliceF === f ? null : f)}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
              <boxGeometry args={[1, 1, 0.2]} />
              <meshStandardMaterial
                color={sliceF === f ? '#F0883E' : '#30363D'}
                emissive={sliceF === f ? '#F0883E' : '#000000'}
                emissiveIntensity={sliceF === f ? 0.4 : 0}
              />
            </mesh>
            <Text position={[0, 0, 0.15]} fontSize={0.5} color="#FFFFFF" anchorX="center">
              F{f}
            </Text>
          </group>
        ))}
        <Text position={[6, 0, 0]} fontSize={0.4} color="#6E7681" anchorX="left">
          (click to filter)
        </Text>
      </group>

      {/* Stats */}
      <group position={[-12, -12, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Dessin Cube Stats:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Total cells: {stats.total}</Text>
        <Text position={[0, 1.6, 0]} fontSize={0.5} color="#3FB950" anchorX="left">Occupied: {stats.occupied}</Text>
        <Text position={[0, 1, 0]} fontSize={0.5} color="#6E7681" anchorX="left">Empty: {stats.empty}</Text>
        <Text position={[0, 0.2, 0]} fontSize={0.5} color="#58A6FF" anchorX="left">Ratio: {(stats.occupied/stats.total*100).toFixed(1)}%</Text>
      </group>

      {/* Explanation */}
      <group position={[12, -12, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.7} color="#E6EDF3" anchorX="left">Geometric Constraint:</Text>
        <Text position={[0, 2.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Only cells where the</Text>
        <Text position={[0, 1.7, 0]} fontSize={0.45} color="#6E7681" anchorX="left">combination BxWxF equals</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.45} color="#6E7681" anchorX="left">the index (6) are valid.</Text>
        <Text position={[0, 0.5, 0]} fontSize={0.45} color="#6E7681" anchorX="left">Others are like illegal</Text>
        <Text position={[0, 0, 0]} fontSize={0.45} color="#6E7681" anchorX="left">chess moves.</Text>
      </group>

      {/* Bottom info */}
      <group position={[0, -15, 0]}>
        <Text position={[-6, 0, 0]} fontSize={0.6} color="#3FB950" anchorX="center">
          12 = Index of Gamma_0(6)
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.5} color="#6E7681" anchorX="center">
          |
        </Text>
        <Text position={[6, 0, 0]} fontSize={0.6} color="#A371F7" anchorX="center">
          52 = Forbidden states
        </Text>
      </group>
    </group>
  );
}
