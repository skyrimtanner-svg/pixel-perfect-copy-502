import { useState } from 'react';
import { trajectoryData, Domain, domainLabels } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

const domainColors: Record<Domain, string> = {
  compute: 'hsl(192, 100%, 52%)',
  energy: 'hsl(36, 100%, 56%)',
  connectivity: 'hsl(268, 90%, 68%)',
  manufacturing: 'hsl(342, 82%, 62%)',
  biology: 'hsl(155, 82%, 48%)',
};

const domainGlows: Record<Domain, string> = {
  compute: 'hsla(192, 100%, 52%, 0.4)',
  energy: 'hsla(36, 100%, 56%, 0.4)',
  connectivity: 'hsla(268, 90%, 68%, 0.4)',
  manufacturing: 'hsla(342, 82%, 62%, 0.4)',
  biology: 'hsla(155, 82%, 48%, 0.4)',
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
    <motion.div
      key={isWonder ? 'wonder' : 'analyst'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-5">
        <h1 className={`font-display font-bold ${isWonder ? 'text-gold text-2xl' : 'text-foreground text-xl'}`}>
          {isWonder ? '✦ Traces' : 'Traces'}
        </h1>
        <p className={`mt-1 ${isWonder ? 'text-xs text-muted-foreground' : 'text-[10px] font-mono text-chrome'}`}>
          {isWonder
            ? 'Watch how different technologies grow and evolve over time — each line is a domain of human capability!'
            : 'Composite capability index (evidence-weighted, synthetic) | not physical measurement'}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {allDomains.map(d => {
            const active = activeDomains.has(d);
            const color = domainColors[d];
            const glow = domainGlows[d];
            return (
              <motion.button
                key={d}
                onClick={() => toggleDomain(d)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden"
                style={{
                  background: active ? `${color.replace('hsl', 'hsla').replace(')', ', 0.08)')}` : 'hsla(232, 26%, 8%, 0.6)',
                  border: `1px solid ${active ? `${color.replace('hsl', 'hsla').replace(')', ', 0.25)')}` : 'hsla(220, 12%, 70%, 0.08)'}`,
                  color: active ? color : 'hsl(218, 15%, 38%)',
                  textDecoration: active ? 'none' : 'line-through',
                  boxShadow: active
                    ? `0 0 14px -4px ${glow}, inset 0 1px 0 hsla(220, 14%, 88%, 0.05)`
                    : 'inset 0 1px 0 hsla(220, 14%, 88%, 0.03)',
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {domainLabels[d]}
              </motion.button>
            );
          })}
        </div>

        <div
          className="flex gap-0.5 rounded-lg p-0.5"
          style={{
            background: 'hsla(232, 26%, 8%, 0.6)',
            border: '1px solid hsla(220, 12%, 70%, 0.1)',
            boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
          }}
        >
          {timeRanges.map(r => (
            <motion.button
              key={r.label}
              onClick={() => setTimeRange(r.start)}
              className="px-3 py-1 rounded-md text-xs font-mono transition-all"
              style={{
                background: timeRange === r.start ? 'hsla(43, 96%, 56%, 0.1)' : 'transparent',
                color: timeRange === r.start ? 'hsl(43, 96%, 56%)' : 'hsl(218, 15%, 46%)',
                boxShadow: timeRange === r.start ? 'inset 0 1px 0 hsla(43, 96%, 56%, 0.08)' : 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {r.label}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.82), hsla(232, 22%, 5%, 0.72))',
          border: '1px solid hsla(220, 12%, 70%, 0.1)',
          backdropFilter: 'blur(32px)',
          boxShadow: [
            'inset 0 1px 0 hsla(220, 14%, 88%, 0.06)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
            '0 8px 40px -12px hsla(232, 30%, 2%, 0.8)',
          ].join(', '),
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top highlight */}
        <div className="absolute top-0 left-8 right-8 h-px" style={{
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.06), transparent)',
        }} />

        <ResponsiveContainer width="100%" height={isWonder ? 520 : 440}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray={isWonder ? '4 6' : '2 4'}
              stroke="hsla(220, 12%, 70%, 0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              stroke="hsl(220, 12%, 45%)"
              fontSize={10}
              fontFamily="Space Mono"
              tickLine={false}
              axisLine={{ stroke: 'hsla(220, 12%, 70%, 0.15)', strokeWidth: 1 }}
            />
            <YAxis
              stroke="hsl(220, 12%, 45%)"
              fontSize={10}
              fontFamily="Space Mono"
              tickLine={false}
              axisLine={{ stroke: 'hsla(220, 12%, 70%, 0.15)', strokeWidth: 1 }}
              domain={[0, 1.3]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsla(232, 26%, 5%, 0.96)',
                border: '1px solid hsla(43, 96%, 56%, 0.15)',
                borderRadius: '10px',
                fontFamily: 'Space Mono',
                fontSize: '10px',
                boxShadow: '0 12px 40px -8px hsla(232, 30%, 2%, 0.9), 0 0 20px -6px hsla(43, 96%, 56%, 0.08)',
                backdropFilter: 'blur(20px)',
              }}
              labelStyle={{ color: 'hsl(43, 96%, 56%)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '11px' }}
              itemStyle={{ fontFamily: 'Space Mono', fontSize: '10px' }}
            />
            <ReferenceLine
              x={2025}
              stroke="hsla(43, 96%, 56%, 0.3)"
              strokeDasharray="4 4"
              label={{
                value: 'NOW',
                fill: 'hsl(43, 96%, 56%)',
                fontSize: 9,
                fontFamily: 'Space Mono',
              }}
            />
            {allDomains.map(d => (
              activeDomains.has(d) && (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={domainColors[d]}
                  strokeWidth={isWonder ? 3 : 2}
                  dot={{ r: isWonder ? 2.5 : 1.5, fill: domainColors[d], strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    stroke: domainColors[d],
                    strokeWidth: 2,
                    fill: 'hsl(232, 30%, 2%)',
                    style: { filter: `drop-shadow(0 0 8px ${domainGlows[d]})` },
                  }}
                  name={domainLabels[d]}
                  style={{ filter: `drop-shadow(0 0 4px ${domainGlows[d]})` }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3 pt-3" style={{ borderTop: '1px solid hsla(220, 12%, 70%, 0.06)' }}>
          {allDomains.filter(d => activeDomains.has(d)).map(d => (
            <div key={d} className="flex items-center gap-1.5">
              <div className="w-2.5 h-0.5 rounded-full" style={{
                background: domainColors[d],
                boxShadow: `0 0 6px ${domainGlows[d]}`,
              }} />
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{domainLabels[d]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
