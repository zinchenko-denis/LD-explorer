import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Particle } from '@/types/ld-model';

interface ParticleInfoProps {
  particle: Particle | null;
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

export function ParticleInfo({ particle }: ParticleInfoProps) {
  if (!particle) {
    return null;
  }

  const colorClass = PARTICLE_COLORS[particle.type] || 'bg-[#30363D] text-[#E6EDF3] border-[#30363D]';
  
  // Calculate predicted mass
  const me = 0.511; // electron mass in MeV
  const mu = 1836.15; // proton/electron ratio
  const g = Math.pow(mu, 1/4); // ~6.55
  const predictedMass = me * Math.pow(g, particle.n) * particle.K;
  const deltaK = ((particle.mass - predictedMass) / predictedMass * 100).toFixed(2);

  return (
    <Card className="bg-[#0D1117] border-[#30363D]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-[#E6EDF3]">{particle.name}</CardTitle>
          <Badge variant="outline" className={colorClass}>
            {TYPE_NAMES[particle.type]}
          </Badge>
        </div>
        {particle.anchor && (
          <Badge className="mt-2 bg-[#3FB950]/20 text-[#3FB950] border-[#3FB950]/40">
            ANCHOR PARTICLE
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mass Formula Parameters */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#58A6FF]">Mass Formula Parameters</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-[#161B22] rounded">
              <span className="text-[#E6EDF3]/60">Lattice node (n):</span>
              <span className="float-right font-mono text-[#58A6FF]">{particle.n}</span>
            </div>
            <div className="p-2 bg-[#161B22] rounded">
              <span className="text-[#E6EDF3]/60">Multiplier (K):</span>
              <span className="float-right font-mono text-[#F0883E]">
                {particle.K === Math.sqrt(2) ? 'sqrt2' : particle.K.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-[#30363D]" />

        {/* Mass Values */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#3FB950]">Mass Values</h4>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-[#161B22] rounded">
              <span className="text-[#E6EDF3]/60">Experimental:</span>
              <span className="float-right font-mono text-[#E6EDF3]">
                {particle.mass < 1000 
                  ? `${particle.mass.toFixed(2)} MeV` 
                  : `${(particle.mass / 1000).toFixed(3)} GeV`}
              </span>
            </div>
            <div className="p-2 bg-[#161B22] rounded">
              <span className="text-[#E6EDF3]/60">Predicted:</span>
              <span className="float-right font-mono text-[#58A6FF]">
                {predictedMass < 1000 
                  ? `${predictedMass.toFixed(2)} MeV` 
                  : `${(predictedMass / 1000).toFixed(3)} GeV`}
              </span>
            </div>
            {!particle.anchor && (
              <div className="p-2 bg-[#161B22] rounded">
                <span className="text-[#E6EDF3]/60">deltaK:</span>
                <span className={`float-right font-mono ${parseFloat(deltaK) > 0 ? 'text-[#F0883E]' : 'text-[#3FB950]'}`}>
                  {parseFloat(deltaK) > 0 ? '+' : ''}{deltaK}%
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-[#30363D]" />

        {/* Additional Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#A371F7]">Properties</h4>
          <div className="space-y-1 text-sm">
            {particle.generation && (
              <div className="flex items-center justify-between p-2 bg-[#161B22] rounded">
                <span className="text-[#E6EDF3]/60">Generation:</span>
                <span className="font-mono text-[#E6EDF3]">{particle.generation}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-2 bg-[#161B22] rounded">
              <span className="text-[#E6EDF3]/60">g^n factor:</span>
              <span className="font-mono text-[#E6EDF3]">{Math.pow(6.55, particle.n).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#161B22] rounded">
              <span className="text-[#E6EDF3]/60">Full formula:</span>
              <span className="font-mono text-xs text-[#E6EDF3]">
                m_e x {Math.pow(6.55, particle.n).toFixed(2)} x {particle.K === Math.sqrt(2) ? 'sqrt2' : particle.K.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Special Notes */}
        {particle.K === Math.sqrt(2) && (
          <div className="p-3 bg-[#F0883E]/10 border border-[#F0883E]/30 rounded">
            <p className="text-xs text-[#F0883E]">
              <strong>sqrt2 Anomaly:</strong> This is the only particle with irrational K-factor, 
              required for ring closure. Originates from EWSB (v/sqrt2).
            </p>
          </div>
        )}

        {particle.anchor && (
          <div className="p-3 bg-[#3FB950]/10 border border-[#3FB950]/30 rounded">
            <p className="text-xs text-[#3FB950]">
              <strong>Anchor:</strong> Mass is fixed as reference point. 
              K = 1 by definition.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
