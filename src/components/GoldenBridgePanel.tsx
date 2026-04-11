const PHI = (1 + Math.sqrt(5)) / 2;

const LUCAS = [
  { k: 0, Lk: 2, ld: 'd₁', color: '#58A6FF' },
  { k: 1, Lk: 1, ld: '1', color: '#8B949E' },
  { k: 2, Lk: 3, ld: 'd₂', color: '#D29922' },
  { k: 3, Lk: 4, ld: 'd₁²', color: '#58A6FF' },
  { k: 4, Lk: 7, ld: 'L', color: '#3FB950' },
  { k: 5, Lk: 11, ld: 'dim M₁₀', color: '#BC8CFF' },
];

const EIGENVALUES = [
  { label: '0', value: 0, color: '#8B949E' },
  { label: '−φ', value: -PHI, color: '#D29922' },
  { label: '1/φ', value: 1/PHI, color: '#3FB950' },
];

interface Props { isDarkMode: boolean; lang: 'en'|'ru'|'zh' }

export default function GoldenBridgePanel({ isDarkMode, lang }: Props) {
  const t = (en: string, ru: string, zh: string) => lang === 'ru' ? ru : lang === 'zh' ? zh : en;
  const card = isDarkMode ? '#161B22' : '#f9fafb';
  const border = isDarkMode ? '#30363D' : '#e5e7eb';
  const text = isDarkMode ? '#E6EDF3' : '#1f2937';
  const muted = isDarkMode ? '#8B949E' : '#6b7280';

  // Golden spiral SVG parameters
  const cx = 150, cy = 120;

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6" style={{ background: isDarkMode ? '#0D1117' : '#fff', color: text }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: text }}>
            {t('Golden Bridge', 'Золотой мост', '黄金桥')}
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {t(
              'The quintic q₅ factors through the golden ratio polynomial — X.267 ★★★★★',
              'Квинтика q₅ факторизуется через полином золотого сечения — X.267 ★★★★★',
              '五次多项式q₅通过黄金比例多项式因式分解 — X.267 ★★★★★'
            )}
          </p>
        </div>

        {/* Central equation */}
        <div className="rounded-xl p-6 text-center" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="text-sm mb-2" style={{ color: muted }}>
            {t('The Golden Bridge Identity', 'Тождество Золотого моста', '黄金桥恒等式')}
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono" style={{ color: '#D29922' }}>
            q₅ = q<sub>φ</sub> · q₃ − d₂
          </div>
          <div className="mt-3 text-xs font-mono space-y-1" style={{ color: muted }}>
            <div>q₅ = x⁵ − 3x³ − 2x² + 3x − 1</div>
            <div>q<sub>φ</sub> = x² − x − 1 {t('(golden ratio polynomial)', '(полином золотого сечения)', '(黄金比例多项式)')}</div>
            <div>q₃ = x³ + x² − x − 2</div>
            <div>d₂ = 3</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ω₃ eigenvalues */}
          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-3">
              Ω₃ {t('Eigenvalues', 'Собственные значения', '特征值')}
            </h3>
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 300 240" width="280" height="220">
                {/* Number line */}
                <line x1="30" y1="120" x2="270" y2="120" stroke={border} strokeWidth="2" />
                {/* Ticks and labels */}
                {[
                  { x: 30, label: '−2' },
                  { x: 90, label: '−1' },
                  { x: 150, label: '0' },
                  { x: 210, label: '1' },
                  { x: 270, label: '2' },
                ].map(tick => (
                  <g key={tick.label}>
                    <line x1={tick.x} y1={115} x2={tick.x} y2={125} stroke={muted} strokeWidth="1.5" />
                    <text x={tick.x} y={140} textAnchor="middle" fill={muted} fontSize="10">{tick.label}</text>
                  </g>
                ))}
                {/* Eigenvalue dots */}
                {/* 0 at x=150 */}
                <circle cx={cx} cy={cy} r="10" fill="#8B949E" opacity="0.3" />
                <circle cx={cx} cy={cy} r="5" fill="#8B949E" />
                <text x={cx} y={cy - 18} textAnchor="middle" fill="#8B949E" fontSize="12" fontWeight="bold">0</text>
                {/* -φ ≈ -1.618 at x = 150 + (-1.618)*60 = 52.9 */}
                <circle cx={150 + (-PHI)*60} cy={cy} r="10" fill="#D29922" opacity="0.3" />
                <circle cx={150 + (-PHI)*60} cy={cy} r="5" fill="#D29922" />
                <text x={150 + (-PHI)*60} y={cy - 18} textAnchor="middle" fill="#D29922" fontSize="12" fontWeight="bold">−φ</text>
                {/* 1/φ ≈ 0.618 at x = 150 + 0.618*60 = 187.1 */}
                <circle cx={150 + (1/PHI)*60} cy={cy} r="10" fill="#3FB950" opacity="0.3" />
                <circle cx={150 + (1/PHI)*60} cy={cy} r="5" fill="#3FB950" />
                <text x={150 + (1/PHI)*60} y={cy - 18} textAnchor="middle" fill="#3FB950" fontSize="12" fontWeight="bold">1/φ</text>
                {/* Label */}
                <text x={150} y={170} textAnchor="middle" fill={muted} fontSize="10">
                  φ = (1+√5)/2 ≈ {PHI.toFixed(4)}
                </text>
                <text x={150} y={185} textAnchor="middle" fill={muted} fontSize="10">
                  0 + (−φ) + 1/φ = −1 = Tr(Ω₃) − rank
                </text>
              </svg>
            </div>
            <div className="space-y-1 text-xs font-mono" style={{ color: muted }}>
              {EIGENVALUES.map(ev => (
                <div key={ev.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: ev.color }} />
                  <span>{ev.label} = {ev.value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Golden spiral + φ */}
          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-3">
              {t('Golden Ratio Connection', 'Связь с золотым сечением', '黄金比例联系')}
            </h3>
            <div className="flex justify-center mb-3">
              <svg viewBox="0 0 200 200" width="180" height="180">
                {/* Golden spiral approximation using quarter-circle arcs */}
                <path
                  d={`
                    M 100 100
                    A 62 62 0 0 1 162 100
                    A 38 38 0 0 1 124 62
                    A 24 24 0 0 1 100 86
                    A 15 15 0 0 1 115 100
                    A 9 9 0 0 1 106 109
                    A 6 6 0 0 1 100 103
                  `}
                  fill="none"
                  stroke="#D29922"
                  strokeWidth="2.5"
                  opacity="0.7"
                />
                {/* Golden rectangle outline */}
                <rect x="38" y="38" width="124" height="124" fill="none" stroke={border} strokeWidth="1" strokeDasharray="4 4" />
                <rect x="38" y="62" width="62" height="100" fill="none" stroke={border} strokeWidth="0.5" strokeDasharray="2 2" />
                {/* Center label */}
                <text x="100" y="185" textAnchor="middle" fill="#D29922" fontSize="14" fontWeight="bold">
                  φ = {PHI.toFixed(6)}...
                </text>
              </svg>
            </div>
            <div className="text-xs text-center" style={{ color: muted }}>
              {t(
                'The golden ratio appears as eigenvalue of Ω₃ and connects the directed adjacency to the Cayley spectrum.',
                'Золотое сечение — собственное значение Ω₃, связывающее направленную смежность со спектром Кэли.',
                '黄金比例作为Ω₃的特征值，连接有向邻接矩阵和Cayley谱。'
              )}
            </div>
          </div>
        </div>

        {/* Lucas dictionary */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">
            {t('Lucas Dictionary', 'Словарь Люка', 'Lucas字典')}: Tr(Ω₃ᵏ) = (−1)ᵏ L<sub>k</sub>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['k', 'L_k', t('LD parameter', 'LD параметр', 'LD参数')].map(h => (
                    <th key={h} className="p-2 text-center" style={{ border: `1px solid ${border}`, color: muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LUCAS.map(row => (
                  <tr key={row.k}>
                    <td className="p-2 text-center" style={{ border: `1px solid ${border}`, color: text }}>{row.k}</td>
                    <td className="p-2 text-center font-bold" style={{ border: `1px solid ${border}`, color: row.color }}>{row.Lk}</td>
                    <td className="p-2 text-center" style={{ border: `1px solid ${border}`, color: row.color }}>{row.ld}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-2" style={{ color: muted }}>
            {t(
              'Every Lucas number L_k for k = 0..5 is a fundamental LD parameter. This is the content of the Golden Bridge.',
              'Каждое число Люка L_k для k = 0..5 — фундаментальный LD-параметр. Это содержание Золотого моста.',
              '每个Lucas数L_k (k=0..5) 都是基本LD参数。这就是黄金桥的内容。'
            )}
          </p>
        </div>

        {/* Polynomial coefficients */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">
            q₅ {t('coefficients', 'коэффициенты', '系数')}
          </h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {[
              { coeff: '1', power: 'x⁵', color: text },
              { coeff: '0', power: 'x⁴', color: muted },
              { coeff: '−d₂', power: 'x³', color: '#D29922' },
              { coeff: '−d₁', power: 'x²', color: '#58A6FF' },
              { coeff: 'd₂', power: 'x¹', color: '#D29922' },
              { coeff: '−1', power: 'x⁰', color: text },
            ].map((c, i) => (
              <div key={i} className="rounded-lg p-3 text-center min-w-[60px]" style={{ background: isDarkMode ? '#0D1117' : '#fff', border: `1px solid ${border}` }}>
                <div className="text-lg font-bold font-mono" style={{ color: c.color }}>{c.coeff}</div>
                <div className="text-xs" style={{ color: muted }}>{c.power}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: muted }}>
            [1, 0, −d₂, −d₁, d₂, −1] — {t('all coefficients are LD parameters', 'все коэффициенты — LD параметры', '所有系数都是LD参数')}
          </p>
        </div>
      </div>
    </div>
  );
}
