import { useState } from 'react';
import { trajectoryData, Domain, domainLabels } from '@/data/milestones';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const domainColors: Record<Domain, string> = {
  compute: 'hsl(190, 90%, 50%)',
  energy: 'hsl(38, 92%, 55%)',
  connectivity: 'hsl(270, 80%, 65%)',
  manufacturing: 'hsl(152, 70%, 48%)',
  biology: 'hsl(340, 75%, 60%)',
};

const allDomains: Domain[] = ['compute', 'energy', 'connectivity', 'manufacturing', 'biology'];
const timeRanges = [
  { label: 'ALL', start: 1900 },
  { label: '1960+', start: 1960 },
  { label: 'NOW', start: 2010 },
] as const;

export default function TracesPage() {
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
        <h1 className="font-display text-2xl font-bold text-foreground">Traces</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Composite capability index (evidence-weighted, synthetic) — not a physical measurement.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        {/* Domain toggles */}
        <div className="flex gap-2">
          {allDomains.map(d => (
            <button
              key={d}
              onClick={() => toggleDomain(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeDomains.has(d)
                  ? 'border-current/30 bg-current/10'
                  : 'border-border/30 text-muted-foreground/50 line-through'
              }`}
              style={{ color: activeDomains.has(d) ? domainColors[d] : undefined }}
            >
              {domainLabels[d]}
            </button>
          ))}
        </div>

        {/* Time range */}
        <div className="flex gap-1 glass rounded-lg p-1">
          {timeRanges.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.start)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                timeRange === r.start ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="glass rounded-xl p-6 border border-border/30">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(222, 20%, 25%, 0.3)" />
            <XAxis
              dataKey="year"
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              fontFamily="Space Mono"
              tickLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              fontFamily="Space Mono"
              tickLine={false}
              domain={[0, 1.2]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsla(222, 40%, 10%, 0.95)',
                border: '1px solid hsla(222, 20%, 25%, 0.5)',
                borderRadius: '8px',
                fontFamily: 'Space Mono',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(210, 40%, 92%)', fontFamily: 'DM Sans', fontWeight: 600 }}
            />
            <ReferenceLine x={2025} stroke="hsl(215, 20%, 55%)" strokeDasharray="4 4" label={{ value: 'NOW', fill: 'hsl(215, 20%, 55%)', fontSize: 10, fontFamily: 'Space Mono' }} />
            {allDomains.map(d => (
              activeDomains.has(d) && (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={domainColors[d]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: domainColors[d] }}
                  activeDot={{ r: 5 }}
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
