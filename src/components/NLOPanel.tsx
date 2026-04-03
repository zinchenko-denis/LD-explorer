import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const NLO_DATA = [
  { name: 'u', n: 1, ell: 3, fs1: 6, h: 2/3,  dkNLO: -1.56, dkObs: -3.14, type: 'quark' },
  { name: 'd', n: 1, ell: 3, fs1: 3, h: 1,    dkNLO: -2.34, dkObs: -1.28, type: 'quark' },
  { name: 's', n: 3, ell: 3, fs1: 2, h: 9/4,  dkNLO: -1.46, dkObs: -2.26, type: 'quark' },
  { name: 'c', n: 4, ell: 3, fs1: 1, h: 2,    dkNLO: 1.49,  dkObs: 1.52,  type: 'quark' },
  { name: 'b', n: 5, ell: 3, fs1: 3, h: 1,    dkNLO: 1.71,  dkObs: 2.08,  type: 'quark' },
  { name: 't', n: 7, ell: 3, fs1: 6, h: 2/3,  dkNLO: -1.63, dkObs: -1.58, type: 'quark' },
  { name: 'μ', n: 3, ell: 7, fs1: 6, h: 2/3,  dkNLO: -2.60, dkObs: -1.71, type: 'lepton' },
  { name: 'τ', n: 4, ell: 7, fs1: 2, h: 9/4,  dkNLO: -5.64, dkObs: -5.31, type: 'lepton' },
  { name: 'W', n: 6, ell: 6, fs1: 6, h: 2/3,  dkNLO: -0.86, dkObs: -0.05, type: 'boson' },
  { name: 'H', n: 6, ell: 1, fs1: 3, h: 1,    dkNLO: 2.77,  dkObs: 3.84,  type: 'boson' },
];

const H_TABLE = [
  { face: 1, h: 2, mono: 'd₁', particles: 'c (σ₁→p)' },
  { face: 2, h: 9/4, mono: 'd₂²/d₁²', particles: 's (σ₁→W), τ (σ₁→H)' },
  { face: 3, h: 1, mono: '1', particles: 'd (σ₁→e), b (σ₁→μ), H (σ₁→τ)' },
  { face: 6, h: 2/3, mono: 'd₁/d₂', particles: 'u, t, μ, W' },
];

interface Props { isDarkMode: boolean; lang: 'en'|'ru'|'zh' }

export default function NLOPanel({ isDarkMode, lang }: Props) {
  const t = (en: string, ru: string, zh: string) => lang === 'ru' ? ru : lang === 'zh' ? zh : en;
  const card = isDarkMode ? '#161B22' : '#f9fafb';
  const border = isDarkMode ? '#30363D' : '#e5e7eb';
  const text = isDarkMode ? '#E6EDF3' : '#1f2937';
  const muted = isDarkMode ? '#8B949E' : '#6b7280';
  const accent = '#58A6FF';

  const TYPE_COLORS: Record<string, string> = { quark: '#58A6FF', lepton: '#D29922', boson: '#F0883E' };

  // Compute R²
  const meanObs = NLO_DATA.reduce((s, d) => s + d.dkObs, 0) / NLO_DATA.length;
  const ssTot = NLO_DATA.reduce((s, d) => s + (d.dkObs - meanObs) ** 2, 0);
  const ssRes = NLO_DATA.reduce((s, d) => s + (d.dkObs - d.dkNLO) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  const signs = NLO_DATA.filter(d => Math.sign(d.dkNLO) === Math.sign(d.dkObs)).length;

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6" style={{ background: isDarkMode ? '#0D1117' : '#fff', color: text }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
            NLO Mass Rule: δK
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {t(
              'δK/K = h(F_σ₁) · (α/2π) · [Φ(n) − Lℓ]. Multiplier h from weight-10 newform 6.10.a.a.',
              'δK/K = h(F_σ₁) · (α/2π) · [Φ(n) − Lℓ]. Множитель h из ньюформы 6.10.a.a веса 10.',
              'δK/K = h(F_σ₁) · (α/2π) · [Φ(n) − Lℓ]。乘子h来自权重10新形式6.10.a.a。'
            )}
          </p>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'R² (NLO)', value: r2.toFixed(2), color: accent },
            { label: 'R² (LO)', value: '0.68', color: muted },
            { label: t('Signs', 'Знаки', '符号匹配'), value: `${signs}/10`, color: '#3FB950' },
            { label: t('Free params', 'Параметры', '自由参数'), value: '0', color: '#3FB950' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="text-xs" style={{ color: muted }}>{s.label}</div>
              <div className="text-xl font-bold mt-1 font-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Scatter Plot */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('δK_NLO vs δK_obs (%)', 'δK_NLO vs δK_obs (%)', 'δK_NLO 对比 δK_obs (%)')}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis type="number" dataKey="dkNLO" name="NLO pred" domain={[-7, 4]} tick={{ fill: muted, fontSize: 11 }}
                label={{ value: 'δK_NLO (%)', position: 'insideBottom', offset: -5, fill: muted, fontSize: 11 }} />
              <YAxis type="number" dataKey="dkObs" name="Observed" domain={[-7, 5]} tick={{ fill: muted, fontSize: 11 }}
                label={{ value: 'δK_obs (%)', angle: -90, position: 'insideLeft', offset: 10, fill: muted, fontSize: 11 }} />
              <ReferenceLine segment={[{ x: -7, y: -7 }, { x: 5, y: 5 }]} stroke={accent} strokeDasharray="5 5" strokeWidth={1.5} />
              <Tooltip 
                contentStyle={{ background: card, border: `1px solid ${border}`, fontSize: 12 }}
                formatter={(v: number) => `${v.toFixed(2)}%`}
                labelFormatter={() => ''}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: card, border: `1px solid ${border}`, padding: 8, borderRadius: 8, fontSize: 12 }}>
                      <strong style={{ color: TYPE_COLORS[d.type] }}>{d.name}</strong>
                      <span style={{ color: muted }}> ({d.type})</span>
                      <br/>NLO: {d.dkNLO.toFixed(2)}% | Obs: {d.dkObs.toFixed(2)}%
                      <br/>h = {d.h} (F_σ₁ = {d.fs1})
                    </div>
                  );
                }}
              />
              <Scatter data={NLO_DATA} shape="circle">
                {NLO_DATA.map((d, i) => <Cell key={i} fill={TYPE_COLORS[d.type]} r={7} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs" style={{ color: muted }}>
            {Object.entries(TYPE_COLORS).map(([k, c]) => (
              <span key={k}><span style={{ color: c }}>●</span> {k === 'quark' ? t('quarks', 'кварки', '夸克') : k === 'lepton' ? t('leptons', 'лептоны', '轻子') : t('bosons', 'бозоны', '玻色子')}</span>
            ))}
            <span>— {t('diagonal = perfect', 'диагональ = идеал', '对角线 = 完美')}</span>
          </div>
        </div>

        {/* h-factor Table */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">
            {t('Multiplier h(F_σ₁) from trace formula chain', 'Множитель h(F_σ₁) из trace formula chain', '乘子 h(F_σ₁) 源自迹公式链')}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `2px solid ${border}` }}>
                {['F_σ₁', 'h', t('Monomial', 'Моном', '单项式'), t('Particles', 'Частицы', '粒子')].map(h => (
                  <th key={h} className="text-left py-2 px-2" style={{ color: muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {H_TABLE.map(r => (
                <tr key={r.face} style={{ borderBottom: `1px solid ${border}` }}>
                  <td className="py-2 px-2 font-mono font-bold">{r.face}</td>
                  <td className="py-2 px-2 font-mono" style={{ color: accent }}>{r.h}</td>
                  <td className="py-2 px-2 font-mono">{r.mono}</td>
                  <td className="py-2 px-2 text-xs" style={{ color: muted }}>{r.particles}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs mt-3" style={{ color: muted }}>
            ∏h = d₂ = 3. h(2) = tan γ_CKM = 9/4. Source: 6.10.a.a via W₂ = +1, W₃ = −1. Status: [DER] (k=10 selection).
          </p>
        </div>

        {/* Per-particle table */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('Full prediction table', 'Все 10 частиц', '全部10个粒子')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr style={{ borderBottom: `2px solid ${border}` }}>
                  {['', 'n', 'ℓ', 'F_σ₁', 'h', 'δK_LO%', 'δK_NLO%', 'δK_obs%', 'resid%'].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5" style={{ color: muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NLO_DATA.map(d => {
                  const phi = (d.n ** 3) * (1 - d.n / 7);
                  const dkLO = (1/137.036/(2*Math.PI)) * (phi - 7 * d.ell) * 100;
                  const resid = d.dkObs - d.dkNLO;
                  return (
                    <tr key={d.name} style={{ borderBottom: `1px solid ${border}` }}>
                      <td className="py-1.5 px-1.5 font-bold" style={{ color: TYPE_COLORS[d.type] }}>{d.name}</td>
                      <td className="py-1.5 px-1.5">{d.n}</td>
                      <td className="py-1.5 px-1.5">{d.ell}</td>
                      <td className="py-1.5 px-1.5">{d.fs1}</td>
                      <td className="py-1.5 px-1.5" style={{ color: accent }}>{d.h === 9/4 ? '9/4' : d.h === 2/3 ? '2/3' : d.h}</td>
                      <td className="py-1.5 px-1.5">{dkLO.toFixed(2)}</td>
                      <td className="py-1.5 px-1.5" style={{ color: accent }}>{d.dkNLO.toFixed(2)}</td>
                      <td className="py-1.5 px-1.5">{d.dkObs.toFixed(2)}</td>
                      <td className="py-1.5 px-1.5" style={{ color: Math.abs(resid) < 0.5 ? '#3FB950' : muted }}>
                        {resid > 0 ? '+' : ''}{resid.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
