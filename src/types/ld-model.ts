export interface Particle {
  name: string;
  n: number;
  K: number;
  mass: number;
  type: 'quark-up' | 'quark-down' | 'lepton' | 'boson' | 'anchor';
  anchor?: boolean;
  generation?: number;
}

export interface LDData {
  N: number;
  d1: number;
  d2: number;
  index: number;
  mu: number;
  g: number;
  b1Set: number[];
  particles: Particle[];
}

export interface MatrixCell {
  row: number;
  col: number;
  value: number;
  particle?: Particle;
}

export interface GraphNode {
  id: string;
  position: [number, number, number];
  color: string;
  size: number;
  label?: string;
  particle?: Particle;
}

export interface GraphEdge {
  from: string;
  to: string;
  color: string;
  width: number;
}

//          W0 W1 W2 W3 W4 W5
// σ₁-pairs: {c,p} {u,t} {b,μ} {s,W} {d,e} {τ,H}
export const BIADJACENCY_MATRIX = [
  [2, 1, 0, 0, 0, 0],  // BV0 (anchor): multi-edge {c,p} at W0 + u at W1
  [0, 1, 1, 0, 1, 0],  // BV1 (index): t at W1 + b at W2 + e at W4
  [0, 0, 1, 1, 0, 1],  // BV2 (star): μ at W2 + s at W3 + H at W5
  [0, 0, 0, 1, 1, 1],  // BV3 (other): W at W3 + d at W4 + τ at W5
];

export const PARTICLE_COLORS = {
  'quark-up': '#58A6FF',
  'quark-down': '#3FB950',
  'lepton': '#D29922',
  'boson': '#F0883E',
  'anchor': '#A371F7',
};

export const B1_SET = [1, 1/3, 1/2, 2/3, 3/4, 4/3, 3/2, 2, 3, Math.sqrt(2)];
