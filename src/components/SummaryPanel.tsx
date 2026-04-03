import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const ALL_PULLS = [
  // PMNS
  { name: 'sin²θ₁₂', value: '4/13', pull: -0.06, group: 'PMNS', color: '#D29922' },
  { name: 'sin²θ₂₃', value: '81/145', pull: 0.16, group: 'PMNS', color: '#D29922' },
  { name: 'sin²θ₁₃', value: '2/91', pull: -0.06, group: 'PMNS', color: '#D29922' },
  // CKM
  { name: 'λ', value: '9/40', pull: -0.04, group: 'CKM', color: '#58A6FF' },
  { name: 'A', value: '3/√13', pull: 0.63, group: 'CKM', color: '#58A6FF' },
  { name: 'γ', value: 'arctan(9/4)', pull: -1.25, group: 'CKM', color: '#58A6FF' },
  { name: 'R_b', value: '√(3/20)', pull: 0.17, group: 'CKM', color: '#58A6FF' },
  { name: 'J', value: '3.10×10⁻⁵', pull: -0.15, group: 'CKM', color: '#58A6FF' },
  // L1
  { name: 'α⁻¹', value: '137.035999202', pull: -1.20, group: 'L1', color: '#3FB950' },
];

const HIERARCHY = [
  { level: 'L0', desc: 'Γ₀(6)', status: 'POSTULATE', detail: 'A_F = ℂ⊕ℍ⊕M₃(ℂ) → (2,3) → N=6' },
  { level: 'L1', desc: 'α, μ', status: 'CLOSED', detail: 'Form A: α⁻¹ = 137.035999202 (−1.2σ)' },
  { level: 'L1b', desc: 'G', status: 'OPEN', detail: 'G_pred = 6.67407×10⁻¹¹ (−35 ppm, nuclear input)' },
  { level: 'L2', desc: 'Masses', status: 'DER', detail: 'NLO R²=0.89, h from 6.10.a.a. Gap 3 CLOSED.' },
  { level: 'L3a', desc: 'CKM', status: 'DER', detail: 'UST → 4 Wolfenstein, χ²/dof = 0.66' },
  { level: 'L3b', desc: 'PMNS', status: 'DER', detail: 'CR + index → 3 angles, Σ|pull| = 0.27' },
];

interface Props { isDarkMode: boolean; isRu: boolean }

export default function SummaryPanel({ isDarkMode, isRu }: Props) {
  const card = isDarkMode ? '#161B22' : '#f9fafb';
  const border = isDarkMode ? '#30363D' : '#e5e7eb';
  const text = isDarkMode ? '#E6EDF3' : '#1f2937';
  const muted = isDarkMode ? '#8B949E' : '#6b7280';

  const maxAbsPull = Math.max(...ALL_PULLS.map(d => Math.abs(d.pull)));

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6" style={{ background: isDarkMode ? '#0D1117' : '#fff', color: text }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#E6EDF3' }}>
            {isRu ? 'Все предсказания LD' : 'All LD Predictions'}
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {isRu 
              ? '9 предсказаний, 0 непрерывных свободных параметров. Все в пределах 1.25σ.'
              : '9 predictions, 0 continuous free parameters. All within 1.25σ.'}
          </p>
        </div>

        {/* Grand scorecard */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: isRu ? 'Макс. пулл' : 'Max |pull|', value: maxAbsPull.toFixed(2) + 'σ', color: '#D29922' },
            { label: isRu ? 'Параметры' : 'Free params', value: '0', color: '#3FB950' },
            { label: isRu ? 'Предсказания' : 'Predictions', value: '9', color: '#58A6FF' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="text-xs" style={{ color: muted }}>{s.label}</div>
              <div className="text-2xl font-bold mt-1 font-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Forest Plot */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{isRu ? 'Все пуллы (exp−theory)/σ' : 'All pulls (exp−theory)/σ'}</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={ALL_PULLS} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis type="number" domain={[-2, 1]} tick={{ fill: muted, fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: text, fontSize: 11, fontFamily: 'monospace' }} width={70} />
              <ReferenceLine x={0} stroke={text} strokeWidth={1.5} />
              <ReferenceLine x={-1} stroke={border} strokeDasharray="5 5" />
              <ReferenceLine x={1} stroke={border} strokeDasharray="5 5" />
              <Tooltip 
                contentStyle={{ background: card, border: `1px solid ${border}`, fontSize: 12 }}
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}σ`, 'Pull']}
              />
              <Bar dataKey="pull" radius={[0, 4, 4, 0]} barSize={16}>
                {ALL_PULLS.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs" style={{ color: muted }}>
            <span><span style={{ color: '#D29922' }}>●</span> PMNS</span>
            <span><span style={{ color: '#58A6FF' }}>●</span> CKM</span>
            <span><span style={{ color: '#3FB950' }}>●</span> L1 (α)</span>
            <span>| ±1σ bands</span>
          </div>
        </div>

        {/* Hierarchy */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{isRu ? 'Иерархия предсказаний' : 'Prediction Hierarchy'}</h3>
          <div className="space-y-2">
            {HIERARCHY.map(h => {
              const statusColor = h.status === 'CLOSED' || h.status === 'DER' ? '#3FB950' 
                : h.status === 'OPEN' ? '#D29922' : '#8B949E';
              return (
                <div key={h.level} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${border}` }}>
                  <span className="font-mono font-bold text-sm w-10" style={{ color: statusColor }}>{h.level}</span>
                  <span className="font-semibold text-sm w-16">{h.desc}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                    background: `${statusColor}20`, color: statusColor
                  }}>{h.status}</span>
                  <span className="text-xs flex-1" style={{ color: muted }}>{h.detail}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key numbers */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{isRu ? 'Ключевые числа' : 'Key Numbers'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { k: 'N', v: '6' }, { k: 'd₁, d₂', v: '2, 3' }, { k: 'index', v: '12' }, { k: 'L', v: '7' },
              { k: '|B₁|', v: '10' }, { k: 'K', v: '40' }, { k: '|Mon|', v: '72' }, { k: 'j(i)', v: '1728' },
              { k: isRu ? 'Пути' : 'Paths', v: '≥44' }, { k: isRu ? 'Кластеры' : 'Clusters', v: '11' },
              { k: isRu ? 'Dead' : 'Dead dirs', v: '90+' }, { k: isRu ? 'Барьеры' : 'Barriers', v: '10' },
            ].map(item => (
              <div key={item.k} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${border}` }}>
                <span style={{ color: muted }}>{item.k}</span>
                <span style={{ color: text }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="rounded-xl p-4 text-center" style={{ background: `#3FB95010`, border: `1px solid #3FB95030` }}>
          <p className="text-sm font-mono" style={{ color: '#3FB950' }}>
            {isRu ? 'Входные данные:' : 'Inputs:'} m_e, A_F = ℂ⊕ℍ⊕M₃(ℂ), Γ₀ {isRu ? 'семейство' : 'family'}
          </p>
          <p className="text-xs mt-1" style={{ color: muted }}>
            + (m_n, B_d) {isRu ? 'для G' : 'for G'} · {isRu ? '~85% THM/DER' : '~85% THM/DER'}
          </p>
        </div>
      </div>
    </div>
  );
}
