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

  const domainPillColors: Record<string, { border: string; text: string }> = {
    compute: { border: 'hsla(190, 100%, 50%, 0.25)', text: 'hsl(190, 100%, 50%)' },
    energy: { border: 'hsla(38, 100%, 58%, 0.25)', text: 'hsl(38, 100%, 58%)' },
    connectivity: { border: 'hsla(270, 90%, 68%, 0.25)', text: 'hsl(270, 90%, 68%)' },
    manufacturing: { border: 'hsla(340, 80%, 62%, 0.25)', text: 'hsl(340, 80%, 62%)' },
    biology: { border: 'hsla(152, 80%, 50%, 0.25)', text: 'hsl(152, 80%, 50%)' },
  };

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
          {allDomains.map(d => {
            const active = activeDomains.has(d);
            const colors = domainPillColors[d];
            return (
              <button
                key={d}
                onClick={() => toggleDomain(d)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? `${colors.text.replace('hsl', 'hsla').replace(')', ', 0.08)')}` : 'hsla(230, 22%, 9%, 0.6)',
                  border: `1px solid ${active ? colors.border : 'hsla(220, 10%, 72%, 0.08)'}`,
                  color: active ? colors.text : 'hsl(215, 15%, 38%)',
                  textDecoration: active ? 'none' : 'line-through',
                  boxShadow: active ? `0 0 12px -4px ${colors.border}` : 'none',
                }}
              >
                {domainLabels[d]}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1 glass-chrome rounded-lg p-1">
          {timeRanges.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.start)}
              className="px-3 py-1 rounded-md text-xs font-mono transition-all"
              style={{
                background: timeRange === r.start ? 'hsla(43, 96%, 56%, 0.1)' : 'transparent',
                color: timeRange === r.start ? 'hsl(43, 96%, 56%)' : 'hsl(215, 15%, 48%)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-premium rounded-xl p-6">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(230, 16%, 20%, 0.2)" />
            <XAxis
              dataKey="year"
              stroke="hsl(215, 15%, 40%)"
              fontSize={11}
              fontFamily="Space Mono"
              tickLine={false}
            />
            <YAxis
              stroke="hsl(215, 15%, 40%)"
              fontSize={11}
              fontFamily="Space Mono"
              tickLine={false}
              domain={[0, 1.2]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsla(230, 22%, 6%, 0.95)',
                border: '1px solid hsla(220, 10%, 72%, 0.12)',
                borderRadius: '12px',
                fontFamily: 'Space Mono',
                fontSize: '11px',
                boxShadow: '0 12px 40px -8px hsla(230, 25%, 3%, 0.8)',
              }}
              labelStyle={{ color: 'hsl(43, 96%, 56%)', fontFamily: 'DM Sans', fontWeight: 600 }}
            />
            <ReferenceLine
              x={2025}
              stroke="hsla(43, 96%, 56%, 0.35)"
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
                  activeDot={{ r: 5, stroke: domainColors[d], strokeWidth: 2, fill: 'hsl(230, 25%, 3%)' }}
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
