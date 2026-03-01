import { useState } from 'react';
import { trajectoryData, Domain, domainLabels } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const domainColors: Record<Domain, string> = {
  compute: 'hsl(190, 100%, 50%)',
  energy: 'hsl(38, 100%, 58%)',
  connectivity: 'hsl(270, 90%, 68%)',
  manufacturing: 'hsl(340, 80%, 62%)',
  biology: 'hsl(152, 80%, 50%)',
};

const allDomains: Domain[] = ['compute', 'energy', 'connectivity', 'manufacturing', 'biology'];
const timeRanges = [
  { label: 'ALL', start: 1900 },
  { label: '1960+', start: 1960 },
  { label: 'NOW', start: 2010 },
] as const;

export default function TracesPage() {
  const { isWonder } = useMode();
  const [activeDomains, setActiveDomains] = useState<Set<Domain>>(new Set(allDomains));
  const [timeRange, setTimeRange] = useState<number>(1900);

  const toggleDomain = (d: Domain) => {
    setActiveDomains(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  const data = trajectoryData.filter(p => p.year >= timeRange);

  return (
    <div>
      <div className="mb-6">
        <h1 className={`font-display text-2xl font-bold ${isWonder ? 'text-gold' : 'text-foreground'}`}>
          {isWonder ? '✦ Traces' : 'Traces'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Composite capability index (evidence-weighted, synthetic) — not a physical measurement.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {allDomains.map(d => (
            <button
              key={d}
              onClick={() => toggleDomain(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeDomains.has(d)
                  ? 'border-current/25 bg-current/8'
                  : 'border-chrome/10 text-muted-foreground/50 line-through'
              }`}
              style={{ color: activeDomains.has(d) ? domainColors[d] : undefined }}
            >
              {domainLabels[d]}
            </button>
          ))}
        </div>

        <div className="flex gap-1 glass-chrome rounded-lg p-1">
          {timeRanges.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.start)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                timeRange === r.start ? 'bg-gold/10 text-gold-solid' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-chrome rounded-xl p-6"
        style={{ boxShadow: 'inset 0 1px 0 hsla(220, 10%, 85%, 0.04)' }}
      >
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(228, 14%, 22%, 0.25)" />
            <XAxis
              dataKey="year"
              stroke="hsl(215, 15%, 50%)"
              fontSize={11}
              fontFamily="Space Mono"
              tickLine={false}
            />
            <YAxis
              stroke="hsl(215, 15%, 50%)"
              fontSize={11}
              fontFamily="Space Mono"
              tickLine={false}
              domain={[0, 1.2]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsla(228, 18%, 8%, 0.95)',
                border: '1px solid hsla(220, 10%, 72%, 0.15)',
                borderRadius: '10px',
                fontFamily: 'Space Mono',
                fontSize: '11px',
                boxShadow: '0 8px 32px -8px hsla(228, 20%, 5%, 0.8)',
              }}
              labelStyle={{ color: 'hsl(43, 96%, 56%)', fontFamily: 'DM Sans', fontWeight: 600 }}
            />
            <ReferenceLine
              x={2025}
              stroke="hsla(43, 96%, 56%, 0.4)"
              strokeDasharray="4 4"
              label={{ value: 'NOW', fill: 'hsl(43, 96%, 56%)', fontSize: 10, fontFamily: 'Space Mono' }}
            />
            {allDomains.map(d => (
              activeDomains.has(d) && (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={domainColors[d]}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: domainColors[d], strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: domainColors[d], strokeWidth: 2, fill: 'hsl(228, 20%, 5%)' }}
                  name={domainLabels[d]}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
