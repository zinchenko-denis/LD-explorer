import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

// |U|² matrix — CR PMNS at cosδ=0 (paper eq. U2)
// Master denominator: 171535 = 5·7·13²·29
const U_MATRIX = [
  ['801/1183',    '356/1183',    '2/91'],
  ['24754/171535','53064/171535', '7209/13195'],
  ['30636/171535','66851/171535', '5696/13195'],
];
const U_DECIMAL = [
  [801/1183, 356/1183, 2/91],
  [24754/171535, 53064/171535, 7209/13195],
  [30636/171535, 66851/171535, 5696/13195],
];
const ROW_LABELS = ['e', 'μ', 'τ'];
const COL_LABELS = ['ν₁', 'ν₂', 'ν₃'];

const PULL_DATA = [
  { name: 'sin²θ_W (NLO)', value: 0.23122, ld: '3/13', pull: 1.9, color: '#BC8CFF' },
  { name: 'sin²θ₁₂', value: 0.30769, ld: '4/13', pull: 0.17, color: '#D29922' },
  { name: 'sin²θ₂₃', value: 0.55862, ld: '81/145', pull: -0.16, color: '#D29922' },
  { name: 'sin²θ₁₃', value: 0.02198, ld: '2/91', pull: 0.90, color: '#D29922' },
];

interface Props { isDarkMode: boolean; lang: 'en'|'ru'|'zh' }

export default function WeinbergCPPanel({ isDarkMode, lang }: Props) {
  const t = (en: string, ru: string, zh: string) => lang === 'ru' ? ru : lang === 'zh' ? zh : en;
  const card = isDarkMode ? '#161B22' : '#f9fafb';
  const border = isDarkMode ? '#30363D' : '#e5e7eb';
  const text = isDarkMode ? '#E6EDF3' : '#1f2937';
  const muted = isDarkMode ? '#8B949E' : '#6b7280';

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6" style={{ background: isDarkMode ? '#0D1117' : '#fff', color: text }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: text }}>
            {t('Electroweak + CP Violation', 'Электрослабый сектор + CP', '电弱 + CP破坏')}
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {t(
              'Weinberg angle and CP phase from the dessin — 0 free parameters',
              'Угол Вайнберга и фаза CP из дезина — 0 свободных параметров',
              'Weinberg角和CP相位来自dessin — 零自由参数'
            )}
          </p>
        </div>

        {/* Top cards: θ_W and δ_CP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weinberg angle */}
          <div className="rounded-xl p-5" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#BC8CFF' }}>
              {t('Weinberg Angle', 'Угол Вайнберга', 'Weinberg角')}
            </h3>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold font-mono" style={{ color: '#BC8CFF' }}>
                sin²θ<sub>W</sub> = 3/13
              </div>
              <div className="text-sm mt-1 font-mono" style={{ color: muted }}>
                = 0.23077 (tree) → 0.23122 (NLO)
              </div>
              <div className="text-xs mt-2" style={{ color: muted }}>
                PDG: 0.23122 ± 0.00003 · Pull: +1.9σ (NLO)
              </div>
            </div>
            <div className="rounded-lg p-3 text-xs font-mono" style={{ background: isDarkMode ? '#0D1117' : '#fff', border: `1px solid ${border}` }}>
              <div style={{ color: muted }}>
                {t('Derivation:', 'Вывод:', '推导：')} 3 = d₂ (cusp widths), 13 = det M_lep
              </div>
              <div className="mt-1" style={{ color: muted }}>
                NLO: α_s(M_Z) correction from RGE running
              </div>
            </div>
          </div>

          {/* CP phase dial */}
          <div className="rounded-xl p-5" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#D29922' }}>
              {t('CP Phase', 'CP-фаза', 'CP相位')}
            </h3>
            <div className="flex justify-center mb-3">
              <svg viewBox="0 0 160 160" width="140" height="140">
                {/* Clock face */}
                <circle cx="80" cy="80" r="65" fill="none" stroke={border} strokeWidth="2" />
                {/* Tick marks at 0°, 90°, 180°, 270° */}
                {[0, 90, 180, 270].map(deg => {
                  const rad = (deg - 90) * Math.PI / 180;
                  const x1 = 80 + 58 * Math.cos(rad), y1 = 80 + 58 * Math.sin(rad);
                  const x2 = 80 + 65 * Math.cos(rad), y2 = 80 + 65 * Math.sin(rad);
                  return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={muted} strokeWidth="2" />;
                })}
                {/* Labels */}
                <text x="80" y="10" textAnchor="middle" fill={muted} fontSize="10">0°</text>
                <text x="150" y="84" textAnchor="middle" fill={muted} fontSize="10">90°</text>
                <text x="80" y="155" textAnchor="middle" fill={muted} fontSize="10">180°</text>
                <text x="10" y="84" textAnchor="middle" fill={muted} fontSize="10">270°</text>
                {/* Needle pointing at 270° = down */}
                <line x1="80" y1="80" x2="80" y2="140" stroke="#D29922" strokeWidth="3" strokeLinecap="round" />
                <circle cx="80" cy="80" r="4" fill="#D29922" />
                {/* Label */}
                <text x="80" y="80" textAnchor="middle" dy="-12" fill="#D29922" fontSize="12" fontWeight="bold">δ = 270°</text>
              </svg>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono" style={{ color: '#D29922' }}>sinδ = −1</div>
              <div className="text-xs mt-1" style={{ color: muted }}>
                {t('Maximal CP violation — exact', 'Максимальное CP-нарушение — точно', '最大CP破坏 — 精确')}
              </div>
              <div className="text-xs mt-1 font-mono" style={{ color: muted }}>
                X.224 [DER]: δ = 3π/2 from CR orbit
              </div>
            </div>
          </div>
        </div>

        {/* Pull bars */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('Mixing angle pulls', 'Пуллы углов смешивания', '混合角拉力')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PULL_DATA} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis type="number" domain={[-1.5, 2.5]} tick={{ fill: muted, fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: text, fontSize: 11, fontFamily: 'monospace' }} width={90} />
              <ReferenceLine x={0} stroke={text} strokeWidth={1.5} />
              <ReferenceLine x={-1} stroke={border} strokeDasharray="5 5" />
              <ReferenceLine x={1} stroke={border} strokeDasharray="5 5" />
              <Tooltip 
                contentStyle={{ background: card, border: `1px solid ${border}`, fontSize: 12 }}
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}σ`, 'Pull']}
              />
              <Bar dataKey="pull" radius={[0, 4, 4, 0]} barSize={16}>
                {PULL_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* |U|² Matrix */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">
            |U|² {t('matrix (CR PMNS, cosδ = 0)', 'матрица (CR PMNS, cosδ = 0)', '矩阵（CR PMNS, cosδ = 0）')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="p-2" style={{ border: `1px solid ${border}`, color: muted }}></th>
                  {COL_LABELS.map(c => (
                    <th key={c} className="p-2 text-center" style={{ border: `1px solid ${border}`, color: '#58A6FF' }}>{c}</th>
                  ))}
                  <th className="p-2 text-center" style={{ border: `1px solid ${border}`, color: muted }}>Σ</th>
                </tr>
              </thead>
              <tbody>
                {ROW_LABELS.map((r, i) => (
                  <tr key={r}>
                    <td className="p-2 text-center font-bold" style={{ border: `1px solid ${border}`, color: '#D29922' }}>{r}</td>
                    {U_MATRIX[i].map((val, j) => (
                      <td key={j} className="p-2 text-center" style={{ border: `1px solid ${border}`, color: text }}>
                        <div>{val}</div>
                        <div className="text-xs" style={{ color: muted }}>{U_DECIMAL[i][j].toFixed(4)}</div>
                      </td>
                    ))}
                    <td className="p-2 text-center" style={{ border: `1px solid ${border}`, color: '#3FB950' }}>1</td>
                  </tr>
                ))}
                <tr>
                  <td className="p-2 text-center" style={{ border: `1px solid ${border}`, color: muted }}>Σ</td>
                  {[0, 1, 2].map(j => (
                    <td key={j} className="p-2 text-center" style={{ border: `1px solid ${border}`, color: '#3FB950' }}>1</td>
                  ))}
                  <td className="p-2 text-center" style={{ border: `1px solid ${border}`, color: '#3FB950' }}>3</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-2" style={{ color: muted }}>
            {t('CR PMNS at cosδ=0. Master denominator 171535 = 5·7·13²·29. Doubly stochastic.',
               'CR PMNS при cosδ=0. Мастер-знаменатель 171535 = 5·7·13²·29. Двойная стохастичность.',
               'CR PMNS在cosδ=0时。主分母171535 = 5·7·13²·29。双随机。')}
          </p>
        </div>

        {/* Jarlskog */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('Jarlskog Invariant (PMNS)', 'Инвариант Ярлског (PMNS)', 'Jarlskog不变量（PMNS）')}</h3>
          <div className="text-center font-mono">
            <div className="text-lg" style={{ color: text }}>
              J² = 2⁹ · 3⁶ · 89² / (5² · 7³ · 13⁵ · 29²)
            </div>
            <div className="text-sm mt-1" style={{ color: muted }}>
              |J| = 3.32 × 10⁻²
            </div>
            <div className="text-xs mt-2" style={{ color: muted }}>
              {t('Master denominator 171535 = 5·7·13²·29 (four LD gears)',
                 'Мастер-знаменатель 171535 = 5·7·13²·29 (четыре LD-шестерни)',
                 '主分母 171535 = 5·7·13²·29（四个LD齿轮）')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
