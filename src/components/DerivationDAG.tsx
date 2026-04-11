import { useState } from 'react';

interface DAGNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status: 'THM' | 'DER' | 'OBS' | 'CONJ' | 'POST';
  detail: string;
  pull?: string;
}

interface DAGEdge {
  from: string;
  to: string;
}

const NODES: DAGNode[] = [
  // Layer 0: Postulate
  { id: 'AF', label: 'A_F', x: 300, y: 30, status: 'POST', detail: 'Finite algebra ℂ⊕ℍ⊕M₃(ℂ) → coprime pair (2,3)' },
  // Layer 1: N=6
  { id: 'N6', label: 'N=6', x: 300, y: 100, status: 'THM', detail: 'Γ₀(N) with N = d₁·d₂ = 6, index = 12' },
  // Layer 2: Dessin structures
  { id: 'dessin', label: 'Dessin', x: 150, y: 170, status: 'THM', detail: '4 BV (val 3) + 6 WV (val 2), 12 edges' },
  { id: 'modform', label: 'Mod. forms', x: 450, y: 170, status: 'THM', detail: 'Hauptmodul, Eisenstein, η-quotients for Γ₀(6)' },
  // Layer 3: Core structures
  { id: 'sigma', label: 'σ₁, σ₀, σ∞', x: 100, y: 250, status: 'THM', detail: 'Monodromy permutations, σ₁·σ₀·σ∞ = id' },
  { id: 'graph', label: 'Bipartite G', x: 250, y: 250, status: 'THM', detail: 'K(G) = 40 spanning trees → λ = 9/40' },
  { id: 'CR', label: 'Cross-ratios', x: 400, y: 250, status: 'THM', detail: 'CR orbit on cusps → mixing angles' },
  { id: 'spectrum', label: 'Spectrum', x: 550, y: 250, status: 'THM', detail: 'Laplacian eigenvalues, discriminants 21, 5' },
  // Layer 4: Physics blocks
  { id: 'masses', label: 'Masses', x: 80, y: 340, status: 'DER', detail: 'm = mₑ·g^n·K, NLO R² = 0.89', pull: 'RMS 2.7% LO' },
  { id: 'CKM', label: 'CKM', x: 220, y: 340, status: 'DER', detail: 'UST → λ, A, γ, R_b; χ²/dof = 0.65', pull: 'max 1.25σ' },
  { id: 'PMNS', label: 'PMNS', x: 360, y: 340, status: 'DER', detail: 'CR + index → sin²θ₁₂ = 4/13, sinδ = −1', pull: 'Σ|pull| = 0.27' },
  { id: 'EW', label: 'sin²θ_W', x: 500, y: 340, status: 'DER', detail: '3/13 tree, NLO 0.23122', pull: '+1.9σ' },
  // Layer 5: Precision & advanced
  { id: 'alpha', label: 'α⁻¹', x: 80, y: 430, status: 'DER', detail: '137.035999202 from cusp + Hecke', pull: '−1.2σ' },
  { id: 'mu', label: 'μ = m_p/m_e', x: 220, y: 430, status: 'DER', detail: '6π⁵(1 + 10α²/(9π) + ...)', pull: '< 0.001σ' },
  { id: 'golden', label: 'Golden Bridge', x: 360, y: 430, status: 'THM', detail: 'q₅ = q_φ·q₃ − 3, Lucas ↔ LD' },
  { id: 'CRT', label: 'CRT Unification', x: 500, y: 430, status: 'THM', detail: 'L = 3I − A_dir − σ₀⁻¹' },
  // Layer 6: Predictions
  { id: 'neutrino', label: 'ν masses', x: 220, y: 510, status: 'CONJ', detail: 'm₁ = 7.7 meV, Σm = 69.8 meV (NO)' },
  { id: 'falsify', label: 'Falsification', x: 400, y: 510, status: 'DER', detail: 'JUNO: 4/13, DUNE: sinδ = −1, octant' },
];

const EDGES: DAGEdge[] = [
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

const STATUS_COLORS: Record<string, string> = {
  THM: '#3FB950',
  DER: '#58A6FF',
  OBS: '#D29922',
  CONJ: '#8B949E',
  POST: '#BC8CFF',
};

interface Props { isDarkMode: boolean; lang: 'en'|'ru'|'zh' }

export default function DerivationDAG({ isDarkMode, lang }: Props) {
  const t = (en: string, ru: string, zh: string) => lang === 'ru' ? ru : lang === 'zh' ? zh : en;
  const card = isDarkMode ? '#161B22' : '#f9fafb';
  const border = isDarkMode ? '#30363D' : '#e5e7eb';
  const text = isDarkMode ? '#E6EDF3' : '#1f2937';
  const muted = isDarkMode ? '#8B949E' : '#6b7280';

  const [selected, setSelected] = useState<DAGNode | null>(null);

  const nodeMap = new Map(NODES.map(n => [n.id, n]));

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6" style={{ background: isDarkMode ? '#0D1117' : '#fff', color: text }}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: text }}>
            {t('Derivation Graph', 'Граф деривации', '推导图')}
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {t(
              'Click a node to see its status and pull. A_F → N=6 → dessin → 18 outputs.',
              'Кликни на узел для статуса и пулла. A_F → N=6 → дезин → 18 выходов.',
              '点击节点查看状态和拉力。A_F → N=6 → dessin → 18个输出。'
            )}
          </p>
        </div>

        {/* DAG SVG */}
        <div className="rounded-xl p-2 overflow-x-auto" style={{ background: card, border: `1px solid ${border}` }}>
          <svg viewBox="0 0 620 560" className="w-full" style={{ minWidth: 500, maxHeight: 500 }}>
            {/* Edges */}
            {EDGES.map((e, i) => {
              const from = nodeMap.get(e.from);
              const to = nodeMap.get(e.to);
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x} y1={from.y + 14}
                  x2={to.x} y2={to.y - 14}
                  stroke={border}
                  strokeWidth="1.5"
                  opacity="0.5"
                  markerEnd="url(#arrow)"
                />
              );
            })}
            {/* Arrow marker */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={border} />
              </marker>
            </defs>
            {/* Nodes */}
            {NODES.map(node => {
              const color = STATUS_COLORS[node.status] || muted;
              const isSelected = selected?.id === node.id;
              const w = Math.max(node.label.length * 9, 60);
              return (
                <g key={node.id} onClick={() => setSelected(isSelected ? null : node)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={node.x - w/2} y={node.y - 14}
                    width={w} height={28}
                    rx={6}
                    fill={isSelected ? `${color}30` : (isDarkMode ? '#0D1117' : '#fff')}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={node.x} y={node.y + 4}
                    textAnchor="middle"
                    fill={color}
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${STATUS_COLORS[selected.status]}40` }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold font-mono" style={{ color: STATUS_COLORS[selected.status] }}>
                {selected.label}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                background: `${STATUS_COLORS[selected.status]}20`,
                color: STATUS_COLORS[selected.status],
              }}>
                [{selected.status}]
              </span>
              {selected.pull && (
                <span className="text-xs font-mono" style={{ color: muted }}>
                  Pull: {selected.pull}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: text }}>{selected.detail}</p>
          </div>
        )}

        {/* Legend */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-2">{t('Legend', 'Легенда', '图例')}</h3>
          <div className="flex gap-4 flex-wrap text-xs">
            {[
              { status: 'POST', label: t('Postulate', 'Постулат', '公设') },
              { status: 'THM', label: t('Theorem', 'Теорема', '定理') },
              { status: 'DER', label: t('Derived', 'Выведено', '推导') },
              { status: 'OBS', label: t('Observed', 'Наблюдение', '观测') },
              { status: 'CONJ', label: t('Conjecture', 'Гипотеза', '猜想') },
            ].map(item => (
              <div key={item.status} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: STATUS_COLORS[item.status] }} />
                <span style={{ color: muted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('Nodes', 'Узлы', '节点'), value: NODES.length.toString(), color: '#58A6FF' },
            { label: t('Edges', 'Рёбра', '边'), value: EDGES.length.toString(), color: '#3FB950' },
            { label: t('THM+DER', 'THM+DER', 'THM+DER'), value: NODES.filter(n => n.status === 'THM' || n.status === 'DER').length.toString(), color: '#D29922' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="text-xs" style={{ color: muted }}>{s.label}</div>
              <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
