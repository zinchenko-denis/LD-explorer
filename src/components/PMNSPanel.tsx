import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const PMNS_DATA = [
  { 
    label: 'sin²θ₁₂', angle: 'Solar', 
    ld: 4/13, ldStr: '4/13', exp: 0.3088, sigma: 0.0067, source: 'NuFIT 6.1 IC23',
    tbm: 1/3, tbmStr: '1/3',
    channel: 'CR', formula: 'CR(−12,0;−9,−8) = d₁/d₂ = 2/3'
  },
  { 
    label: 'sin²θ₂₃', angle: 'Atmospheric',
    ld: 81/145, ldStr: '81/145', exp: 0.470, sigma: 0.017, source: 'NuFIT 6.1 IC23 NO',
    tbm: 0.5, tbmStr: '1/2',
    channel: 'CR', formula: 'CR(∞,0;−8,−9) = d₂²/d₁³ = 9/8'
  },
  { 
    label: 'sin²θ₁₃', angle: 'Reactor',
    ld: 2/91, ldStr: '2/91', exp: 0.02249, sigma: 0.00057, source: 'NuFIT 6.1 IC23',
    tbm: 0, tbmStr: '0',
    channel: 'Index', formula: 'index/(N·∏Φ₃(p)) = 12/546'
  },
];

const CYCLOTOMIC = [
  { p: 'd₁=2', phi2: 3, phi3: 7, phi4: 5 },
  { p: 'd₂=3', phi2: 4, phi3: 13, phi4: '—' },
];

interface Props { isDarkMode: boolean; lang: 'en'|'ru'|'zh' }

export default function PMNSPanel({ isDarkMode, lang }: Props) {
  const t = (en: string, ru: string, zh: string) => lang === 'ru' ? ru : lang === 'zh' ? zh : en;
  const bg = isDarkMode ? '#0D1117' : '#ffffff';
  const card = isDarkMode ? '#161B22' : '#f9fafb';
  const border = isDarkMode ? '#30363D' : '#e5e7eb';
  const text = isDarkMode ? '#E6EDF3' : '#1f2937';
  const muted = isDarkMode ? '#8B949E' : '#6b7280';
  const accent = '#58A6FF';
  const gold = '#D29922';

  const pullData = PMNS_DATA.map(d => {
    const pull_ld = (d.exp - d.ld) / d.sigma;
    const pull_tbm = (d.exp - d.tbm) / d.sigma;
    return { ...d, pull_ld, pull_tbm };
  });

  const sumPullLD = pullData.reduce((s, d) => s + Math.abs(d.pull_ld), 0);
  const sumPullTBM = pullData.reduce((s, d) => s + Math.abs(d.pull_tbm), 0);

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6" style={{ background: bg, color: text }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
            PMNS Mixing Angles
          </h2>
          <p className="text-sm mt-1" style={{ color: muted }}>
            {t(
              'Three neutrino mixing angles from projective invariants of X₀(6). 0 free parameters.',
              'Три угла нейтринного смешивания из проективных инвариантов X₀(6). 0 свободных параметров.',
              '三个中微子混合角源自X₀(6)的射影不变量。零自由参数。'
            )}
          </p>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Σ|pull| LD', value: sumPullLD.toFixed(2) + 'σ', color: accent },
            { label: 'Σ|pull| TBM', value: sumPullTBM.toFixed(1) + 'σ', color: '#da3633' },
            { label: t('Free params', 'Параметры', '自由参数'), value: '0', color: '#3FB950' },
            { label: t('LD vs TBM', 'Улучшение', 'LD对比TBM'), value: '×' + (sumPullTBM / sumPullLD).toFixed(0), color: gold },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="text-xs font-medium" style={{ color: muted }}>{s.label}</div>
              <div className="text-xl font-bold mt-1 font-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pull Chart */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('Pulls: LD (blue) vs TBM (gold)', 'Пуллы: LD vs TBM', '拉力值：LD（蓝）vs TBM（金）')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pullData} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis type="number" domain={[-8, 5]} tick={{ fill: muted, fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fill: text, fontSize: 12, fontFamily: 'monospace' }} width={70} />
              <ReferenceLine x={0} stroke={muted} />
              <ReferenceLine x={-1} stroke={border} strokeDasharray="5 5" />
              <ReferenceLine x={1} stroke={border} strokeDasharray="5 5" />
              <Tooltip 
                contentStyle={{ background: card, border: `1px solid ${border}`, fontSize: 12 }}
                formatter={(v: number, name: string) => [`${v.toFixed(2)}σ`, name === 'pull_ld' ? 'LD' : 'TBM']}
              />
              <Bar dataKey="pull_ld" name="LD" radius={[0, 4, 4, 0]} barSize={14}>
                {pullData.map((_, i) => <Cell key={i} fill={accent} />)}
              </Bar>
              <Bar dataKey="pull_tbm" name="TBM" radius={[0, 4, 4, 0]} barSize={14}>
                {pullData.map((_, i) => <Cell key={i} fill={gold} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-2" style={{ color: muted }}>
            ±1σ bands shown. TBM bars truncated (θ₁₃: +39σ). {t('Data: NuFIT 6.1 IC23 NO.', 'Данные: NuFIT 6.1 IC23 NO.', '数据：NuFIT 6.1 IC23 NO。')}
          </p>
        </div>

        {/* Predictions Table */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('Predictions', 'Предсказания', '预测值')}</h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="text-sm" style={{ minWidth: 580 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${border}` }}>
                  {[
                    t('Angle', 'Угол', '角度'),
                    t('LD value', 'LD значение', 'LD值'),
                    t('Decimal', 'Десятичное', '十进制'),
                    t('Experiment', 'Эксперимент', '实验值'),
                    t('Pull', 'Пулл', '拉力'),
                    t('Channel', 'Канал', '通道')
                  ].map(h => (
                    <th key={h} className="text-left py-2 px-2 font-medium" style={{ color: muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pullData.map(d => (
                  <tr key={d.label} style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="py-2 px-2 font-mono font-bold">{d.label}</td>
                    <td className="py-2 px-2 font-mono" style={{ color: accent }}>{d.ldStr}</td>
                    <td className="py-2 px-2 font-mono">{d.ld.toFixed(5)}</td>
                    <td className="py-2 px-2 font-mono">{d.exp} ± {d.sigma}</td>
                    <td className="py-2 px-2 font-mono font-bold" style={{ color: Math.abs(d.pull_ld) < 1 ? '#3FB950' : gold }}>
                      {d.pull_ld > 0 ? '+' : ''}{d.pull_ld.toFixed(2)}σ
                    </td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ 
                        background: d.channel === 'CR' ? '#58A6FF20' : '#3FB95020',
                        color: d.channel === 'CR' ? accent : '#3FB950'
                      }}>
                        {d.channel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Rule */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: accent }}>
              {t('CR Channel (cross-ratio)', 'CR-канал (кросс-отношение)', 'CR通道（交比）')}
            </h3>
            <div className="space-y-2 text-xs font-mono" style={{ color: muted }}>
              <p><span style={{ color: text }}>θ₁₂:</span> CR(−12, 0; −9, −8) = d₁/d₂ = <span style={{ color: accent }}>2/3</span></p>
              <p className="pl-4">→ tan θ₁₂ = 2/3 → sin²θ₁₂ = 4/13</p>
              <p className="mt-2"><span style={{ color: text }}>θ₂₃:</span> CR(∞, 0; −8, −9) = d₂²/d₁³ = <span style={{ color: accent }}>9/8</span></p>
              <p className="pl-4">→ tan θ₂₃ = 9/8 → sin²θ₂₃ = 81/145</p>
              <p className="mt-2 pt-2" style={{ borderTop: `1px solid ${border}`, color: text }}>
                {t('4 cusps of X₀(6), no selection.', '4 каспа X₀(6), без выбора.', 'X₀(6)的4个尖点，无需选择。')}
              </p>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#3FB950' }}>
              {t('Index Channel (formula)', 'Индекс-канал (формула)', '指标通道（公式）')}
            </h3>
            <div className="space-y-2 text-xs font-mono" style={{ color: muted }}>
              <p><span style={{ color: text }}>θ₁₃:</span> sin²θ₁₃ = index / (N · ∏Φ₃(p))</p>
              <p className="pl-4">= 12 / (6 · 7 · 13) = <span style={{ color: '#3FB950' }}>2/91</span></p>
              <p className="mt-2"><span style={{ color: text }}>{t('Euler product:', 'Эйлеров продукт:', 'Euler乘积：')}</span></p>
              <p className="pl-4">∏ Φ₂(p)/(p·Φ₃(p)) = (3/14)(4/39) = 2/91</p>
              <p className="mt-2 pt-2" style={{ borderTop: `1px solid ${border}`, color: text }}>
                {t('Channels unique (X.130): θ₁₃ inaccessible to CR.', 'Каналы уникальны (X.130): θ₁₃ недоступен CR.', '通道唯一（X.130）：θ₁₃无法通过CR获得。')}
              </p>
            </div>
          </div>
        </div>

        {/* Cyclotomic Table */}
        <div className="rounded-xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold mb-3">{t('Cyclotomic Unification (X.129c)', 'Циклотомическая таблица (X.129c)', '分圆统一表 (X.129c)')}</h3>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr style={{ borderBottom: `2px solid ${border}` }}>
                {['p', 'Φ₂(p)', 'Φ₃(p)', 'Φ₄(p)', 'PMNS link'].map(h => (
                  <th key={h} className="text-left py-2 px-3" style={{ color: muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <td className="py-2 px-3 font-bold">d₁ = 2</td>
                <td className="py-2 px-3" style={{ color: accent }}>3</td>
                <td className="py-2 px-3" style={{ color: accent }}>7 = L</td>
                <td className="py-2 px-3">5 = N−1</td>
                <td className="py-2 px-3 text-xs" style={{ color: muted }}>θ₁₂: Φ₂(d₂)/Φ₃(d₂) = 4/13</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold">d₂ = 3</td>
                <td className="py-2 px-3" style={{ color: accent }}>4 = d₁²</td>
                <td className="py-2 px-3" style={{ color: accent }}>13 = det M_lep</td>
                <td className="py-2 px-3" style={{ color: muted }}>—</td>
                <td className="py-2 px-3 text-xs" style={{ color: muted }}>θ₁₃: d₁/(Φ₃(d₁)·Φ₃(d₂)) = 2/91</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs mt-3" style={{ color: muted }}>
            Catalan bridge: d₁² + d₂² = Φ₃(d₂) = 13. {t('Unique for (2,3).', 'Единственно для (2,3).', '对(2,3)唯一。')}
          </p>
        </div>

        {/* CKM-PMNS complementarity */}
        <div className="rounded-xl p-4 text-center" style={{ background: `${accent}10`, border: `1px solid ${accent}30` }}>
          <p className="text-sm font-mono" style={{ color: accent }}>
            A²(CKM) + sin²θ₁₂(PMNS) = 9/13 + 4/13 = <strong>1</strong>
          </p>
          <p className="text-xs mt-1" style={{ color: muted }}>
            {t('Common origin: UST probabilities P_triple and ΔP (§V.6)', 'Единый источник: UST-вероятности P_triple и ΔP (§V.6)', '共同起源：UST概率 P_triple 与 ΔP（§V.6）')}
          </p>
        </div>

        <p className="text-xs text-center pb-4" style={{ color: muted }}>
          Paper DOI: 10.5281/zenodo.19520240 · {t('Data', 'Данные', '数据')}: NuFIT 6.1 IC23 NO
        </p>
      </div>
    </div>
  );
}
