import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface LDMatrix3DProps {
  showConnections: boolean;
}

const BIADJACENCY_MATRIX = [
  [2, 1, 0, 0, 0, 0],  // BV0 (anchor): multi-edge {c,p} + u
  [0, 1, 1, 0, 1, 0],  // BV1 (index): b, t, e
  [0, 0, 1, 1, 0, 1],  // BV2 (star): s, μ, H — FIXED (was [0,0,0,1,1,0])
  [0, 0, 0, 1, 1, 1],  // BV3 (other): d, W, τ
];

const ROW_LABELS = ['Anchor', 'Gen 1', 'Gen 2', 'Gen 3'];
const COL_LABELS = ['BV1', 'BV2', 'BV3', 'BV4', 'BV5', 'BV6'];

export function LDMatrix3D({ showConnections }: LDMatrix3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const cells = useMemo(() => {
    const result: { row: number; col: number; value: number; position: [number, number, number] }[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 6; j++) {
        result.push({
          row: i,
          col: j,
          value: BIADJACENCY_MATRIX[i][j],
          position: [j * 2.5 - 6.25, (3 - i) * 2.5 - 3.75, 0],
        });
      }
    }
    return result;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Matrix Title */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.2}
        color="#58A6FF"
        anchorX="center"
        anchorY="middle"
      >
        Biadjacency Matrix B (4x6)
      </Text>

      {/* Row Labels */}
      {ROW_LABELS.map((label, i) => (
        <Text
          key={`row-${i}`}
          position={[-9, (3 - i) * 2.5 - 3.75, 0]}
          fontSize={0.5}
          color="#E6EDF3"
          anchorX="right"
          anchorY="middle"
        >
          {label}
        </Text>
      ))}

      {/* Column Labels */}
      {COL_LABELS.map((label, j) => (
        <Text
          key={`col-${j}`}
          position={[j * 2.5 - 6.25, 7, 0]}
          fontSize={0.5}
          color="#E6EDF3"
          anchorX="center"
          anchorY="bottom"
        >
          {label}
        </Text>
      ))}

      {/* Matrix Cells */}
      {cells.map((cell, idx) => {
        const isHighlighted = cell.value > 0;
        const color = cell.row === 0 ? '#A371F7' : cell.value === 2 ? '#58A6FF' : '#3FB950';
        
        return (
          <group key={idx} position={cell.position}>
            {/* Cell Background */}
            <mesh>
              <boxGeometry args={[2, 2, 0.3]} />
              <meshStandardMaterial 
                color={isHighlighted ? color : '#30363D'}
                transparent
                opacity={isHighlighted ? 0.9 : 0.4}
                emissive={isHighlighted ? color : '#000000'}
                emissiveIntensity={isHighlighted ? 0.4 : 0}
              />
            </mesh>
            
            {/* Cell Value */}
            <Text
              position={[0, 0, 0.2]}
              fontSize={0.8}
              color={isHighlighted ? '#FFFFFF' : '#6E7681'}
              anchorX="center"
              anchorY="middle"
            >
              {cell.value.toString()}
            </Text>

            {/* Connection Lines */}
            {showConnections && cell.value > 0 && cell.row > 0 && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([0, 0, -0.5, 0, -cell.row * 2.5, -3]), 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.3} />
              </line>
            )}
          </group>
        );
      })}

      {/* Kirchhoff Number Display */}
      <group position={[0, -8, 0]}>
        <Text
          position={[-4, 0, 0]}
          fontSize={0.6}
          color="#E6EDF3"
          anchorX="right"
          anchorY="middle"
        >
          Kirchhoff K =
        </Text>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1]} />
          <meshStandardMaterial color="#F0883E" emissive="#F0883E" emissiveIntensity={0.5} />
        </mesh>
        <Text
          position={[0, 0, 1.1]}
          fontSize={1}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          40
        </Text>
        <Text
          position={[4, 0, 0]}
          fontSize={0.5}
          color="#E6EDF3"
          anchorX="left"
          anchorY="middle"
        >
          = d_1^2 * |B_1| = 4 * 10
        </Text>
      </group>

      {/* Legend */}
      <group position={[10, 4, 0]}>
        <Text position={[0, 3, 0]} fontSize={0.6} color="#E6EDF3" anchorX="left">Legend:</Text>
        
        <group position={[0, 2, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshStandardMaterial color="#A371F7" />
          </mesh>
          <Text position={[1, 0, 0]} fontSize={0.4} color="#E6EDF3" anchorX="left">Anchor</Text>
        </group>
        
        <group position={[0, 1.2, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshStandardMaterial color="#58A6FF" />
          </mesh>
          <Text position={[1, 0, 0]} fontSize={0.4} color="#E6EDF3" anchorX="left">Value 2</Text>
        </group>
        
        <group position={[0, 0.4, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshStandardMaterial color="#3FB950" />
          </mesh>
          <Text position={[1, 0, 0]} fontSize={0.4} color="#E6EDF3" anchorX="left">Value 1</Text>
        </group>
      </group>

      {/* Stats */}
      <group position={[-12, -4, 0]}>
        <Text position={[0, 2, 0]} fontSize={0.5} color="#E6EDF3" anchorX="left">Matrix Stats:</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.4} color="#E6EDF3/80" anchorX="left">Rows: 4 (Black vertices)</Text>
        <Text position={[0, 0.6, 0]} fontSize={0.4} color="#E6EDF3/80" anchorX="left">Cols: 6 (White vertices)</Text>
        <Text position={[0, 0, 0]} fontSize={0.4} color="#E6EDF3/80" anchorX="left">Sum: 12 (Index)</Text>
        <Text position={[0, -0.8, 0]} fontSize={0.4} color="#58A6FF" anchorX="left">Row sums = d_2 = 3</Text>
        <Text position={[0, -1.4, 0]} fontSize={0.4} color="#3FB950" anchorX="left">Col sums = d_1 = 2</Text>
      </group>
    </group>
  );
}
