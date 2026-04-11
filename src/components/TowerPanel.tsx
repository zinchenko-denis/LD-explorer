import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TOWER_LEVELS = [
  { n: 0, label: 'Mass', cn: '1', cnVal: 1.0, sin2: '1/3', sin2Val: 1/3, alien: '—', status: 'Base' },
  { n: 1, label: 'CKM', cn: '10/9', cnVal: 10/9, sin2: '3/10', sin2Val: 3/10, alien: '10', status: 'λ = 9/40' },
  { n: 2, label: 'PMNS', cn: '13/12', cnVal: 13/12, sin2: '4/13', sin2Val: 4/13, alien: '13', status: 'sin²θ₁₂' },
  { n: 3, label: 'HALT', cn: '17/15', cnVal: 17/15, sin2: '5/17', sin2Val: 5/17, alien: '17', status: 'W₂ = +1' },
];

const CATALAN_DATA = TOWER_LEVELS.map(lv => ({
  name: `n=${lv.n}`,
  cn: lv.cnVal,
  sin2: lv.sin2Val,
}));

interface Props { isDarkMode: boolean; lang: 'en'|'ru'|'zh' }

export default function TowerPanel({ isDarkMode, lang }: Props) {
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
            {t('Correction Tower', 'Башня поправок', '修正塔')}
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {t(
              'Four levels n = 0..3: Mass → CKM → PMNS → HALT. Catalan staircase with Fermat filtration.',
              'Четыре уровня n = 0..3: Массы → CKM → PMNS → HALT. Лестница Каталана с фильтрацией Ферма.',
              '四层 n=0..3：质量→CKM→PMNS→HALT。Catalan阶梯与Fermat过滤。'
            )}
          </p>
        </div>

        {/* Tower visualization */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-4">{t('Tower Structure', 'Структура башни', '塔结构')}</h3>
          <div className="space-y-0">
            {[...TOWER_LEVELS].reverse().map((lv, idx) => {
              const isHalt = lv.n === 3;
              const borderColor = isHalt ? '#F85149' : idx === 1 ? '#D29922' : idx === 2 ? '#58A6FF' : '#3FB950';
              return (
                <div key={lv.n} className="relative">
                  <div
                    className="rounded-lg p-4 mb-2"
                    style={{
                      background: isDarkMode ? '#0D1117' : '#fff',
                      borderLeft: `4px solid ${borderColor}`,
                      border: `1px solid ${border}`,
                      borderLeftWidth: 4,
                      borderLeftColor: borderColor,
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold font-mono" style={{ color: borderColor }}>
                          n={lv.n}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: text }}>{lv.label}</span>
                        {isHalt && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#F8514920', color: '#F85149' }}>
                            HALT
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs font-mono" style={{ color: muted }}>
                        <span>C<sub>{lv.n}</sub> = {lv.cn}</span>
                        <span>sin²θ = {lv.sin2}</span>
                        {lv.alien !== '—' && (
                          <span style={{ color: '#F0883E' }}>alien: {lv.alien}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs mt-1" style={{ color: muted }}>{lv.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C_n bar chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-3">
              C<sub>n</sub> {t('correction factors', 'поправочные коэффициенты', '修正因子')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CATALAN_DATA} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="name" tick={{ fill: muted, fontSize: 11 }} />
                <YAxis domain={[0.95, 1.2]} tick={{ fill: muted, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: card, border: `1px solid ${border}`, fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(4), 'C_n']}
                />
                <Bar dataKey="cn" radius={[4, 4, 0, 0]} barSize={30}>
                  {CATALAN_DATA.map((_, i) => (
                    <Cell key={i} fill={['#3FB950', '#58A6FF', '#D29922', '#F85149'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-3">
              sin²θ₁₂(n) {t('evolution', 'эволюция', '演化')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CATALAN_DATA} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="name" tick={{ fill: muted, fontSize: 11 }} />
                <YAxis domain={[0.25, 0.4]} tick={{ fill: muted, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: card, border: `1px solid ${border}`, fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(5), 'sin²θ₁₂']}
                />
                <Bar dataKey="sin2" radius={[4, 4, 0, 0]} barSize={30}>
                  {CATALAN_DATA.map((_, i) => (
                    <Cell key={i} fill={['#3FB950', '#58A6FF', '#D29922', '#F85149'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Catalan staircase */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">
            {t('Catalan Staircase Aliens', 'Alien простые лестницы Каталана', 'Catalan阶梯外来素数')}
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { p: '1', source: 'C₀ = 1', color: '#3FB950' },
              { p: '10', source: 'C₁ = 10/9', color: '#58A6FF' },
              { p: '13', source: 'C₂ = 13/12', color: '#D29922' },
              { p: '17', source: 'C₃ = 17/15', color: '#F85149' },
            ].map(a => (
              <div key={a.p} className="rounded-lg p-3" style={{ background: isDarkMode ? '#0D1117' : '#fff', border: `1px solid ${border}` }}>
                <div className="text-2xl font-bold font-mono" style={{ color: a.color }}>{a.p}</div>
                <div className="text-xs mt-1 font-mono" style={{ color: muted }}>{a.source}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-center" style={{ color: muted }}>
            {t(
              '17 = d₁⁴ + 1 — last reachable Fermat prime within 4 cusps. W₂ = +1 → HALT.',
              '17 = d₁⁴ + 1 — последнее достижимое простое Ферма в 4 каспах. W₂ = +1 → HALT.',
              '17 = d₁⁴ + 1 — 4个尖点内最后可达的Fermat素数。W₂ = +1 → HALT。'
            )}
          </div>
        </div>

        {/* Correction factor formulas */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">
            {t('Tower Correction Ratios', 'Формулы башенных поправок', '塔修正比率')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
            <div className="rounded-lg p-3" style={{ background: isDarkMode ? '#0D1117' : '#fff', border: `1px solid ${border}` }}>
              <div style={{ color: '#D29922' }}>θ₁₃ {t('ratio', 'отношение', '比率')}</div>
              <div className="text-lg mt-1" style={{ color: text }}>L / d₁² = 7/4</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: isDarkMode ? '#0D1117' : '#fff', border: `1px solid ${border}` }}>
              <div style={{ color: '#D29922' }}>θ₁₂ {t('ratio', 'отношение', '比率')}</div>
              <div className="text-lg mt-1" style={{ color: text }}>det_M² / (d₁d₂(N−1)²) = 169/150</div>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: muted }}>
            {t('Both ratios are pure LD monomials — confirmed as tower correction factors.',
               'Оба отношения — чистые LD-мономиалы, подтверждены как башенные поправки.',
               '两个比率都是纯LD单项式，确认为塔修正因子。')}
          </p>
        </div>
      </div>
    </div>
  );
}
