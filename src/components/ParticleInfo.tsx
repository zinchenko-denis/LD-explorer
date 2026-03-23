import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Particle } from '@/types/ld-model';

interface ParticleInfoProps {
  particle: Particle | null;
  onDismiss?: () => void;
}

const PARTICLE_COLORS: Record<string, string> = {
  'quark-up': 'bg-[#58A6FF]/20 text-[#58A6FF] border-[#58A6FF]/40',
  'quark-down': 'bg-[#3FB950]/20 text-[#3FB950] border-[#3FB950]/40',
  'lepton': 'bg-[#D29922]/20 text-[#D29922] border-[#D29922]/40',
  'boson': 'bg-[#F0883E]/20 text-[#F0883E] border-[#F0883E]/40',
  'anchor': 'bg-[#A371F7]/20 text-[#A371F7] border-[#A371F7]/40',
};

const TYPE_NAMES: Record<string, string> = {
  'quark-up': 'Up-type Quark',
  'quark-down': 'Down-type Quark',
  'lepton': 'Lepton',
  'boson': 'Boson',
  'anchor': 'Anchor',
};

export function ParticleInfo({ particle, onDismiss }: ParticleInfoProps) {
  if (!particle) {
    return null;
  }

  const colorClass = PARTICLE_COLORS[particle.type] || 'bg-[#30363D] text-[#E6EDF3] border-[#30363D]';
  
  const me = 0.51099895;
  const mu = 1836.15267343;
  const g = Math.pow(mu, 1/4);
  const predictedMass = me * Math.pow(g, particle.n) * particle.K;
  const deltaK = ((particle.mass - predictedMass) / predictedMass * 100);
  const isAnchor = particle.type === 'anchor';

  const fmtK = (k: number) => {
    if (k === Math.sqrt(2)) return '\u221A2';
    const fracs: Record<string, string> = { '0.667':'2/3', '0.750':'3/4', '1.333':'4/3', '1.500':'3/2' };
    const key = k.toFixed(3);
    return fracs[key] || (k % 1 === 0 ? String(k) : k.toFixed(3));
  };

  return (
    <Card className="bg-[#0D1117]/85 backdrop-blur-md border-[#30363D]/60 shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-[#E6EDF3]">{particle.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={colorClass}>
              {TYPE_NAMES[particle.type]}
            </Badge>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors text-lg leading-none px-1"
              >
                ×
              </button>
            )}
          </div>
        </div>
        {isAnchor && (
          <Badge className="mt-2 bg-[#A371F7]/20 text-[#A371F7] border-[#A371F7]/40">
            ANCHOR (fixed point of sigma-inf)
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-[#58A6FF] uppercase tracking-wide">Formula Parameters</h4>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            <div className="p-2 bg-[#161B22]/80 rounded">
              <span className="text-[#8B949E] text-xs">n =</span>
              <span className="float-right font-mono text-[#58A6FF]">{particle.n}</span>
            </div>
            <div className="p-2 bg-[#161B22]/80 rounded">
              <span className="text-[#8B949E] text-xs">K =</span>
              <span className="float-right font-mono text-[#F0883E]">{fmtK(particle.K)}</span>
            </div>
          </div>
          {particle.generation && (
            <div className="p-2 bg-[#161B22]/80 rounded text-sm">
              <span className="text-[#8B949E] text-xs">Generation</span>
              <span className="float-right font-mono text-[#E6EDF3]">{particle.generation}</span>
            </div>
          )}
        </div>

        <Separator className="bg-[#30363D]/60" />

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-[#3FB950] uppercase tracking-wide">Mass</h4>
          <div className="space-y-1.5 text-sm">
            <div className="p-2 bg-[#161B22]/80 rounded">
              <span className="text-[#8B949E] text-xs">Experimental</span>
              <span className="float-right font-mono text-[#E6EDF3]">
                {particle.mass < 1000 
                  ? `${particle.mass.toFixed(2)} MeV` 
                  : `${(particle.mass / 1000).toFixed(3)} GeV`}
              </span>
            </div>
            <div className="p-2 bg-[#161B22]/80 rounded">
              <span className="text-[#8B949E] text-xs">LO prediction</span>
              <span className="float-right font-mono text-[#58A6FF]">
                {predictedMass < 1000 
                  ? `${predictedMass.toFixed(2)} MeV` 
                  : `${(predictedMass / 1000).toFixed(3)} GeV`}
              </span>
            </div>
            {!isAnchor && (
              <div className="p-2 bg-[#161B22]/80 rounded">
                <span className="text-[#8B949E] text-xs">dK/K</span>
                <span className={`float-right font-mono ${deltaK > 0 ? 'text-[#F0883E]' : 'text-[#3FB950]'}`}>
                  {deltaK > 0 ? '+' : ''}{deltaK.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#6E7681] italic">
            LO = me · g^n · K, no dK correction. RMS ~ 1.45%
          </p>
        </div>

        {particle.K === Math.sqrt(2) && (
          <div className="p-2.5 bg-[#F0883E]/10 border border-[#F0883E]/30 rounded text-xs text-[#F0883E]">
            <strong>EWSB:</strong> Unique irrational K = sqrt(d1). Triple anomaly (Hecke + W6 + p-adic).
          </div>
        )}
        {isAnchor && (
          <div className="p-2.5 bg-[#A371F7]/10 border border-[#A371F7]/30 rounded text-xs text-[#A371F7]">
            <strong>Anchor:</strong> Composite (n=d1^2, K=1, l=0). Ring insensitive to dK.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
