import { useState } from 'react';
import { trajectoryData, Domain, domainLabels } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine, chromeTopLine } from '@/lib/glass-styles';

const domainColors: Record<Domain, string> = {
  compute: 'hsl(192, 100%, 52%)',
  energy: 'hsl(36, 100%, 56%)',
  connectivity: 'hsl(268, 90%, 68%)',
  manufacturing: 'hsl(342, 82%, 62%)',
  biology: 'hsl(155, 82%, 48%)',
};

const domainGlows: Record<Domain, string> = {
  compute: 'hsla(192, 100%, 52%, 0.5)',
  energy: 'hsla(36, 100%, 56%, 0.5)',
  connectivity: 'hsla(268, 90%, 68%, 0.5)',
  manufacturing: 'hsla(342, 82%, 62%, 0.5)',
  biology: 'hsla(155, 82%, 48%, 0.5)',
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all relative overflow-hidden shine-sweep"
                style={{
                  background: active
                    ? `linear-gradient(145deg, ${color.replace('hsl', 'hsla').replace(')', ', 0.14)')}, rgba(8, 10, 28, 0.82))`
                    : 'linear-gradient(168deg, rgba(14, 17, 38, 0.72), rgba(8, 10, 28, 0.82))',
                  border: `1px solid ${active ? `${color.replace('hsl', 'hsla').replace(')', ', 0.3)')}` : 'hsla(220, 12%, 70%, 0.1)'}`,
                  color: active ? color : 'hsl(218, 15%, 38%)',
                  textDecoration: active ? 'none' : 'line-through',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: active
                    ? `0 0 24px -4px ${glow}, inset 0 1px 0 hsla(220, 14%, 88%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.45)`
                    : 'inset 0 1px 0 hsla(220, 14%, 88%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
                  textShadow: active ? `0 0 10px ${glow}` : 'none',
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
          style={glassInner}
        >
          {timeRanges.map(r => (
            <motion.button
              key={r.label}
              onClick={() => setTimeRange(r.start)}
              className="px-3 py-1 rounded-md text-xs font-mono transition-all"
              style={{
                background: timeRange === r.start ? 'hsla(43, 96%, 56%, 0.12)' : 'transparent',
                color: timeRange === r.start ? 'hsl(43, 96%, 56%)' : 'hsl(218, 15%, 46%)',
                boxShadow: timeRange === r.start
                  ? 'inset 0 1px 0 hsla(43, 96%, 56%, 0.12), 0 0 12px -4px hsla(43, 96%, 56%, 0.2)'
                  : 'none',
                textShadow: timeRange === r.start ? '0 0 8px hsla(43, 96%, 56%, 0.3)' : 'none',
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
        style={glassPanelStrong}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top gold highlight */}
        <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
        {/* Specular top reflection */}
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />

        <ResponsiveContainer width="100%" height={isWonder ? 520 : 440}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray={isWonder ? '4 6' : '2 4'}
              stroke="hsla(220, 12%, 70%, 0.07)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              stroke="hsl(220, 14%, 55%)"
              fontSize={10}
              fontFamily="Space Mono"
              tickLine={false}
              axisLine={{ stroke: 'hsla(220, 14%, 70%, 0.22)', strokeWidth: 1 }}
            />
            <YAxis
              stroke="hsl(220, 14%, 55%)"
              fontSize={10}
              fontFamily="Space Mono"
              tickLine={false}
              axisLine={{ stroke: 'hsla(220, 14%, 70%, 0.22)', strokeWidth: 1 }}
              domain={[0, 1.3]}
            />
            <Tooltip
              contentStyle={{
                ...glassPanelStrong,
                border: '1px solid hsla(43, 96%, 56%, 0.22)',
                borderRadius: '12px',
                fontFamily: 'Space Mono',
                fontSize: '10px',
              }}
              labelStyle={{ color: 'hsl(43, 96%, 56%)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: '11px' }}
              itemStyle={{ fontFamily: 'Space Mono', fontSize: '10px' }}
            />
            <ReferenceLine
              x={2025}
              stroke="hsla(43, 96%, 56%, 0.5)"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: '▸ NOW',
                fill: 'hsl(43, 96%, 56%)',
                fontSize: 9,
                fontFamily: 'Space Mono',
                fontWeight: 700,
              }}
            />
            {allDomains.map(d => (
              activeDomains.has(d) && (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={domainColors[d]}
                  strokeWidth={isWonder ? 3 : 2.5}
                  dot={{ r: isWonder ? 2.5 : 1.5, fill: domainColors[d], strokeWidth: 0 }}
                  activeDot={{
                    r: 7,
                    stroke: domainColors[d],
                    strokeWidth: 2,
                    fill: 'hsl(232, 30%, 2%)',
                    style: { filter: `drop-shadow(0 0 12px ${domainGlows[d]})` },
                  }}
                  name={domainLabels[d]}
                  style={{ filter: `drop-shadow(0 0 8px ${domainGlows[d]})` }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3 pt-3 relative z-10" style={{ borderTop: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
          {allDomains.filter(d => activeDomains.has(d)).map(d => (
            <div key={d} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{
                background: domainColors[d],
                boxShadow: `0 0 10px ${domainGlows[d]}, 0 0 3px ${domainColors[d]}`,
              }} />
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{domainLabels[d]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
