export type Domain = 'compute' | 'energy' | 'connectivity' | 'manufacturing' | 'biology';
export type Tier = 'historical' | 'active' | 'plausible' | 'speculative';
export type Status = 'accomplished' | 'evidence_emerging' | 'projected' | 'falsified';
export type EvidenceDirection = 'supports' | 'contradicts' | 'ambiguous';
export type SourceType = 'peer_reviewed' | 'government_data' | 'benchmark' | 'industry_data' | 'expert_analysis' | 'news' | 'patent' | 'preprint' | 'community' | 'social';
export type Archetype = 'breakthrough' | 'bottleneck' | 'sleeper' | 'convergence' | 'wildcard' | 'anchor';

export interface Evidence {
  id: string;
  source: string;
  type: SourceType;
  direction: EvidenceDirection;
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
  composite: number;
  delta_log_odds: number;
  date: string;
  summary: string;
}

export interface Milestone {
  id: string;
  title: string;
  year: number;
  domain: Domain;
  tier: Tier;
  status: Status;
  magnitude: number;
  prior: number;
  posterior: number;
  delta_log_odds: number;
  evidence: Evidence[];
  success_criteria: string;
  falsification: string;
  dependencies: string[];
  description: string;
  triageScore: number;
  archetype: Archetype;
}

export const archetypeConfig: Record<Archetype, { label: string; icon: string; color: string }> = {
  breakthrough: { label: 'Breakthrough', icon: '⚡', color: 'text-green-400' },
  bottleneck: { label: 'Bottleneck', icon: '⚠', color: 'text-amber-400' },
  sleeper: { label: 'Sleeper', icon: '🌙', color: 'text-blue-400' },
  convergence: { label: 'Convergence', icon: '🔗', color: 'text-purple-400' },
  wildcard: { label: 'Wildcard', icon: '🃏', color: 'text-rose-400' },
  anchor: { label: 'Anchor', icon: '⚓', color: 'text-chrome' },
};

const credibilityMap: Record<SourceType, number> = {
  peer_reviewed: 0.95, government_data: 0.90, benchmark: 0.88,
  industry_data: 0.85, expert_analysis: 0.80, news: 0.65,
  patent: 0.60, preprint: 0.55, community: 0.40, social: 0.30,
};

export const domainLabels: Record<Domain, string> = {
  compute: 'Compute', energy: 'Energy', connectivity: 'Connectivity',
  manufacturing: 'Manufacturing', biology: 'Biology',
};

export const statusLabels: Record<Status, string> = {
  accomplished: 'Accomplished', evidence_emerging: 'Evidence Emerging',
  projected: 'Projected', falsified: 'Falsified',
};

export const milestones: Milestone[] = [
  {
    id: 'print',
    title: 'Printing Press',
    year: 1440,
    domain: 'connectivity',
    tier: 'historical',
    status: 'accomplished',
    magnitude: 9,
    prior: 0.5, posterior: 1.0, delta_log_odds: Infinity,
    evidence: [],
    success_criteria: 'Movable type press enabling mass book production',
    falsification: 'N/A — historical',
    dependencies: [],
    description: 'Gutenberg\'s movable type printing press revolutionized information dissemination.',
    triageScore: 10,
    archetype: 'anchor',
  },
  {
    id: 'steam',
    title: 'Steam Engine',
    year: 1712,
    domain: 'energy',
    tier: 'historical',
    status: 'accomplished',
    magnitude: 9,
    prior: 0.5, posterior: 1.0, delta_log_odds: Infinity,
    evidence: [],
    success_criteria: 'Practical steam-driven mechanical power',
    falsification: 'N/A — historical',
    dependencies: [],
    description: 'Newcomen\'s atmospheric engine, later perfected by Watt.',
    triageScore: 8,
    archetype: 'anchor',
  },
  {
    id: 'transistor',
    title: 'Transistor',
    year: 1947,
    domain: 'compute',
    tier: 'historical',
    status: 'accomplished',
    magnitude: 10,
    prior: 0.5, posterior: 1.0, delta_log_odds: Infinity,
    evidence: [],
    success_criteria: 'Solid-state amplification and switching',
    falsification: 'N/A — historical',
    dependencies: [],
    description: 'Bell Labs invention that enabled all modern electronics.',
    triageScore: 9,
    archetype: 'anchor',
  },
  {
    id: 'agi',
    title: 'Artificial General Intelligence',
    year: 2035,
    domain: 'compute',
    tier: 'speculative',
    status: 'evidence_emerging',
    magnitude: 10,
    prior: 0.08, posterior: 0.234, delta_log_odds: 1.24,
    evidence: [
      { id: 'ev-agi-1', source: 'Nature Machine Intelligence', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.92, consensus: 0.6, criteria_match: 0.7, composite: 0.366, delta_log_odds: 0.48, date: '2025-11-14', summary: 'Novel architecture demonstrates cross-domain transfer learning surpassing prior benchmarks by 340%.' },
      { id: 'ev-agi-2', source: 'OpenAI Research Blog', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.95, consensus: 0.55, criteria_match: 0.65, composite: 0.289, delta_log_odds: 0.34, date: '2026-01-22', summary: 'GPT-6 internal evaluation shows emergent reasoning on novel physics problems.' },
      { id: 'ev-agi-3', source: 'IEEE Spectrum', type: 'expert_analysis', direction: 'contradicts', credibility: 0.80, recency: 0.88, consensus: 0.7, criteria_match: 0.5, composite: 0.246, delta_log_odds: -0.28, date: '2025-09-05', summary: 'Expert consensus survey: 72% of AI researchers consider 2035 AGI timeline "unlikely" without fundamental breakthroughs.' },
      { id: 'ev-agi-4', source: 'DeepMind', type: 'benchmark', direction: 'supports', credibility: 0.88, recency: 0.97, consensus: 0.48, criteria_match: 0.72, composite: 0.293, delta_log_odds: 0.35, date: '2026-02-10', summary: 'Gemini Ultra 2 achieves superhuman performance on ARC-AGI-2 challenge, solving 91% of tasks.' },
      { id: 'ev-agi-5', source: 'Epoch AI', type: 'preprint', direction: 'supports', credibility: 0.55, recency: 0.90, consensus: 0.42, criteria_match: 0.6, composite: 0.125, delta_log_odds: 0.12, date: '2025-12-03', summary: 'Compute scaling analysis projects sufficient hardware availability for AGI-class systems by 2032.' },
      { id: 'ev-agi-6', source: 'MIRI Technical Report', type: 'expert_analysis', direction: 'ambiguous', credibility: 0.80, recency: 0.85, consensus: 0.35, criteria_match: 0.55, composite: 0.131, delta_log_odds: 0.03, date: '2025-10-20', summary: 'Alignment challenges may delay deployment even if capability milestones are met. Impact on timeline unclear.' },
    ],
    success_criteria: 'System capable of performing any intellectual task that a human can, across all domains, with ability to learn and adapt.',
    falsification: 'No system by 2040 demonstrates domain-general reasoning equivalent to an average adult human.',
    dependencies: ['transistor'],
    description: 'Machine intelligence matching human-level reasoning across all cognitive domains.',
    triageScore: 94,
    archetype: 'breakthrough',
  },
  {
    id: 'fusion',
    title: 'Commercial Fusion Power',
    year: 2038,
    domain: 'energy',
    tier: 'plausible',
    status: 'evidence_emerging',
    magnitude: 9,
    prior: 0.12, posterior: 0.31, delta_log_odds: 1.12,
    evidence: [
      { id: 'ev-fus-1', source: 'Nature Energy', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.93, consensus: 0.72, criteria_match: 0.68, composite: 0.428, delta_log_odds: 0.62, date: '2025-08-15', summary: 'NIF achieves sustained ignition for 8 seconds with Q>5, demonstrating commercial viability pathway.' },
      { id: 'ev-fus-2', source: 'Commonwealth Fusion Systems', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.96, consensus: 0.5, criteria_match: 0.74, composite: 0.302, delta_log_odds: 0.36, date: '2026-01-08', summary: 'SPARC tokamak exceeds design parameters, HTS magnets performing above spec at 20T.' },
      { id: 'ev-fus-3', source: 'DOE Report', type: 'government_data', direction: 'ambiguous', credibility: 0.90, recency: 0.88, consensus: 0.65, criteria_match: 0.45, composite: 0.231, delta_log_odds: 0.05, date: '2025-06-20', summary: 'DOE fusion roadmap identifies 12 remaining engineering challenges; timeline contingent on materials breakthroughs.' },
      { id: 'ev-fus-4', source: 'ITER Update', type: 'government_data', direction: 'contradicts', credibility: 0.90, recency: 0.80, consensus: 0.78, criteria_match: 0.55, composite: 0.309, delta_log_odds: -0.37, date: '2025-04-12', summary: 'ITER first plasma delayed to 2030; cost overruns signal persistent engineering scale-up challenges.' },
    ],
    success_criteria: 'Grid-connected fusion power plant delivering >100MW net electricity commercially.',
    falsification: 'No net-energy-positive fusion reactor by 2045.',
    dependencies: ['steam'],
    description: 'Sustained nuclear fusion providing commercial-scale electricity to the grid.',
    triageScore: 87,
    archetype: 'bottleneck',
  },
  {
    id: 'bci',
    title: 'Consumer Brain-Computer Interface',
    year: 2032,
    domain: 'biology',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 8,
    prior: 0.15, posterior: 0.42, delta_log_odds: 1.35,
    evidence: [
      { id: 'ev-bci-1', source: 'Neuralink FDA Filing', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.98, consensus: 0.45, criteria_match: 0.82, composite: 0.308, delta_log_odds: 0.37, date: '2026-02-20', summary: 'Phase 2 clinical trial data shows 94% success rate in motor control restoration with N1 implant.' },
      { id: 'ev-bci-2', source: 'Science', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.91, consensus: 0.68, criteria_match: 0.75, composite: 0.439, delta_log_odds: 0.66, date: '2025-10-05', summary: 'Non-invasive ultrasound BCI achieves 95% typing accuracy at 60 WPM in healthy subjects.' },
      { id: 'ev-bci-3', source: 'The Lancet', type: 'peer_reviewed', direction: 'contradicts', credibility: 0.95, recency: 0.86, consensus: 0.80, criteria_match: 0.58, composite: 0.379, delta_log_odds: -0.51, date: '2025-07-18', summary: 'Long-term implant study shows signal degradation of 40% over 18 months due to glial scarring.' },
    ],
    success_criteria: 'FDA-approved consumer BCI device enabling thought-to-text at >90% accuracy, sold to general public.',
    falsification: 'No consumer BCI product on market by 2037.',
    dependencies: ['transistor'],
    description: 'Direct neural interfaces enabling thought-controlled computing for everyday consumers.',
    triageScore: 82,
    archetype: 'breakthrough',
  },
  {
    id: 'quantum',
    title: 'Fault-Tolerant Quantum Computing',
    year: 2030,
    domain: 'compute',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 9,
    prior: 0.20, posterior: 0.38, delta_log_odds: 0.85,
    evidence: [
      { id: 'ev-q-1', source: 'Google Quantum AI', type: 'benchmark', direction: 'supports', credibility: 0.88, recency: 0.97, consensus: 0.52, criteria_match: 0.80, composite: 0.360, delta_log_odds: 0.47, date: '2026-01-15', summary: 'Willow 2 processor demonstrates 1,000 logical qubits with error rates below threshold.' },
      { id: 'ev-q-2', source: 'Physical Review Letters', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.89, consensus: 0.65, criteria_match: 0.62, composite: 0.341, delta_log_odds: 0.43, date: '2025-09-28', summary: 'Novel topological qubit design shows 100x improvement in coherence time.' },
      { id: 'ev-q-3', source: 'MIT Tech Review', type: 'news', direction: 'contradicts', credibility: 0.65, recency: 0.92, consensus: 0.55, criteria_match: 0.48, composite: 0.158, delta_log_odds: -0.16, date: '2025-11-10', summary: 'Industry analysts note commercial quantum advantage remains elusive for practical applications.' },
    ],
    success_criteria: 'Quantum computer with >1M logical qubits solving commercially relevant problems faster than classical.',
    falsification: 'No fault-tolerant quantum computer with >10K logical qubits by 2035.',
    dependencies: ['transistor'],
    description: 'Quantum computers capable of solving problems beyond classical computational limits.',
    triageScore: 78,
    archetype: 'convergence',
  },
  {
    id: 'satnet',
    title: 'Global Satellite Internet',
    year: 2028,
    domain: 'connectivity',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 7,
    prior: 0.45, posterior: 0.72, delta_log_odds: 1.15,
    evidence: [
      { id: 'ev-sat-1', source: 'SpaceX Starlink Report', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.98, consensus: 0.70, criteria_match: 0.85, composite: 0.499, delta_log_odds: 0.86, date: '2026-02-01', summary: 'Starlink V3 satellites achieve 1Gbps to consumer terminals; 6,200 satellites operational.' },
      { id: 'ev-sat-2', source: 'ITU Report', type: 'government_data', direction: 'supports', credibility: 0.90, recency: 0.87, consensus: 0.75, criteria_match: 0.60, composite: 0.353, delta_log_odds: 0.46, date: '2025-05-22', summary: 'ITU designates LEO spectrum allocation supporting 3 competing constellation operators.' },
    ],
    success_criteria: 'Satellite internet available to 90%+ of global population with <50ms latency.',
    falsification: 'Coverage below 60% of populated areas by 2032.',
    dependencies: ['transistor'],
    description: 'Low-Earth orbit satellite constellations providing ubiquitous broadband internet.',
    triageScore: 65,
    archetype: 'sleeper',
  },
  {
    id: 'nanofab',
    title: 'Molecular Nanotechnology',
    year: 2045,
    domain: 'manufacturing',
    tier: 'speculative',
    status: 'projected',
    magnitude: 10,
    prior: 0.05, posterior: 0.09, delta_log_odds: 0.62,
    evidence: [
      { id: 'ev-nano-1', source: 'Nature Nanotechnology', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.84, consensus: 0.40, criteria_match: 0.55, composite: 0.177, delta_log_odds: 0.18, date: '2025-03-12', summary: 'DNA origami assembler demonstrates programmable molecular-scale construction with 85% yield.' },
    ],
    success_criteria: 'Programmable molecular assembler capable of constructing arbitrary macro-scale objects.',
    falsification: 'No demonstration of programmable molecular assembly beyond lab curiosity by 2050.',
    dependencies: ['quantum', 'agi'],
    description: 'Programmable molecular-scale manufacturing enabling atom-precise construction.',
    triageScore: 45,
    archetype: 'wildcard',
  },
  // --- NEW MILESTONES ---
  {
    id: 'longevity',
    title: 'Longevity Escape Velocity',
    year: 2040,
    domain: 'biology',
    tier: 'speculative',
    status: 'evidence_emerging',
    magnitude: 10,
    prior: 0.06, posterior: 0.14, delta_log_odds: 0.92,
    evidence: [
      { id: 'ev-lev-1', source: 'Cell', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.94, consensus: 0.45, criteria_match: 0.72, composite: 0.292, delta_log_odds: 0.35, date: '2025-12-08', summary: 'Yamanaka factor partial reprogramming extends mouse lifespan 44% in large-scale trial.' },
      { id: 'ev-lev-2', source: 'Altos Labs', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.96, consensus: 0.38, criteria_match: 0.65, composite: 0.201, delta_log_odds: 0.22, date: '2026-01-30', summary: 'First human epigenetic reprogramming trial shows 8-year biological age reversal sustained at 18 months.' },
    ],
    success_criteria: 'Medical interventions extend healthy lifespan faster than aging progresses (>1 year per year).',
    falsification: 'No human trial shows >5 year biological age reversal sustained >3 years by 2048.',
    dependencies: ['bci'],
    description: 'Medical science extends healthy human lifespan indefinitely through rejuvenation therapies.',
    triageScore: 72,
    archetype: 'wildcard',
  },
  {
    id: 'autonomous-fleet',
    title: 'Fully Autonomous Vehicle Fleet',
    year: 2029,
    domain: 'compute',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 7,
    prior: 0.30, posterior: 0.58, delta_log_odds: 1.18,
    evidence: [
      { id: 'ev-av-1', source: 'Waymo Safety Report', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.97, consensus: 0.62, criteria_match: 0.80, composite: 0.410, delta_log_odds: 0.55, date: '2026-02-14', summary: 'Waymo 6th-gen achieves 0 at-fault incidents per 10M miles across 14 US metro areas.' },
      { id: 'ev-av-2', source: 'NHTSA', type: 'government_data', direction: 'supports', credibility: 0.90, recency: 0.91, consensus: 0.70, criteria_match: 0.68, composite: 0.386, delta_log_odds: 0.50, date: '2025-11-20', summary: 'New federal framework pre-approves L4 autonomy for commercial passenger fleets.' },
    ],
    success_criteria: 'Commercial autonomous ride-hailing in 50+ cities with no human backup driver.',
    falsification: 'No city with >100K autonomous rides/month by 2033.',
    dependencies: ['transistor'],
    description: 'Self-driving vehicles operating commercially without human supervision at city scale.',
    triageScore: 68,
    archetype: 'sleeper',
  },
  {
    id: 'solid-state-battery',
    title: 'Solid-State Battery Mass Production',
    year: 2028,
    domain: 'energy',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 7,
    prior: 0.35, posterior: 0.62, delta_log_odds: 1.10,
    evidence: [
      { id: 'ev-ssb-1', source: 'Toyota R&D', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.98, consensus: 0.60, criteria_match: 0.82, composite: 0.411, delta_log_odds: 0.56, date: '2026-01-25', summary: 'Toyota announces mass production line for sulfide solid-state cells, 1,200 Wh/L density confirmed.' },
      { id: 'ev-ssb-2', source: 'Advanced Energy Materials', type: 'peer_reviewed', direction: 'contradicts', credibility: 0.95, recency: 0.88, consensus: 0.72, criteria_match: 0.55, composite: 0.328, delta_log_odds: -0.42, date: '2025-08-30', summary: 'Dendrite formation persists at fast-charge rates above 4C, limiting practical cycle life below 500 cycles.' },
    ],
    success_criteria: 'Solid-state batteries in >1M consumer vehicles annually with >800 Wh/L.',
    falsification: 'No OEM ships >100K vehicles with solid-state batteries by 2032.',
    dependencies: ['steam'],
    description: 'Next-gen solid-state batteries replacing lithium-ion in vehicles and grid storage.',
    triageScore: 60,
    archetype: 'bottleneck',
  },
  {
    id: 'space-tourism',
    title: 'Orbital Space Tourism',
    year: 2030,
    domain: 'manufacturing',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 6,
    prior: 0.25, posterior: 0.45, delta_log_odds: 0.88,
    evidence: [
      { id: 'ev-st-1', source: 'SpaceX Polaris', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.96, consensus: 0.55, criteria_match: 0.78, composite: 0.350, delta_log_odds: 0.45, date: '2026-02-05', summary: 'Starship achieves 50 consecutive successful orbital flights; ticket price drops to $250K.' },
    ],
    success_criteria: 'Regular orbital tourism flights (>50/year) accessible to non-astronaut civilians.',
    falsification: 'Fewer than 10 civilian orbital flights by 2035.',
    dependencies: [],
    description: 'Regular commercial flights to orbit for paying civilian passengers.',
    triageScore: 42,
    archetype: 'sleeper',
  },
  {
    id: 'synthetic-bio',
    title: 'Synthetic Biology Platform',
    year: 2031,
    domain: 'biology',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 8,
    prior: 0.22, posterior: 0.48, delta_log_odds: 1.22,
    evidence: [
      { id: 'ev-sb-1', source: 'Nature Biotechnology', type: 'peer_reviewed', direction: 'supports', credibility: 0.95, recency: 0.93, consensus: 0.62, criteria_match: 0.74, composite: 0.407, delta_log_odds: 0.54, date: '2025-11-28', summary: 'GPT-Bio designs novel protein therapeutics validated in human cell lines with 92% target efficacy.' },
      { id: 'ev-sb-2', source: 'Ginkgo Bioworks', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.95, consensus: 0.50, criteria_match: 0.70, composite: 0.283, delta_log_odds: 0.33, date: '2026-01-12', summary: 'Automated foundry designs and tests 10,000 organisms/month, 100x improvement over 2024.' },
    ],
    success_criteria: 'AI-driven platform designs novel organisms for industrial/medical use in <48 hours.',
    falsification: 'No FDA-approved synthetic biology therapeutic by 2036.',
    dependencies: ['agi'],
    description: 'AI-powered biological design platforms creating custom organisms and therapeutics.',
    triageScore: 74,
    archetype: 'convergence',
  },
  {
    id: '6g',
    title: '6G Network Standard',
    year: 2033,
    domain: 'connectivity',
    tier: 'plausible',
    status: 'projected',
    magnitude: 6,
    prior: 0.40, posterior: 0.55, delta_log_odds: 0.60,
    evidence: [
      { id: 'ev-6g-1', source: '3GPP Release 20', type: 'government_data', direction: 'supports', credibility: 0.90, recency: 0.90, consensus: 0.75, criteria_match: 0.65, composite: 0.395, delta_log_odds: 0.52, date: '2025-09-15', summary: 'ITU finalizes 6G IMT-2030 requirements: 1 Tbps peak, 0.1ms latency, integrated sensing-comms.' },
    ],
    success_criteria: 'Ratified 6G standard with commercial deployments in 3+ countries.',
    falsification: 'No ratified 6G standard by 2036.',
    dependencies: ['satnet'],
    description: 'Next-generation wireless standard with terabit speeds and sub-millisecond latency.',
    triageScore: 38,
    archetype: 'sleeper',
  },
  {
    id: 'carbon-capture',
    title: 'Gigaton-Scale Carbon Capture',
    year: 2040,
    domain: 'energy',
    tier: 'plausible',
    status: 'projected',
    magnitude: 9,
    prior: 0.10, posterior: 0.18, delta_log_odds: 0.67,
    evidence: [
      { id: 'ev-cc-1', source: 'Climeworks', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.94, consensus: 0.55, criteria_match: 0.60, composite: 0.267, delta_log_odds: 0.30, date: '2025-10-18', summary: 'Mammoth 2 DAC plant captures 100KT CO₂/year at $180/ton, 60% cost reduction from 2024.' },
    ],
    success_criteria: 'Direct air capture removes >1 GT CO₂/year at <$100/ton.',
    falsification: 'No DAC plant exceeds 10MT/year by 2045.',
    dependencies: ['fusion'],
    description: 'Industrial-scale atmospheric carbon dioxide removal to reverse climate change.',
    triageScore: 52,
    archetype: 'bottleneck',
  },
  {
    id: 'humanoid-robots',
    title: 'General-Purpose Humanoid Robots',
    year: 2032,
    domain: 'manufacturing',
    tier: 'active',
    status: 'evidence_emerging',
    magnitude: 8,
    prior: 0.18, posterior: 0.40, delta_log_odds: 1.08,
    evidence: [
      { id: 'ev-hr-1', source: 'Figure AI', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.98, consensus: 0.48, criteria_match: 0.78, composite: 0.318, delta_log_odds: 0.39, date: '2026-02-18', summary: 'Figure 03 operates 8-hour warehouse shifts autonomously; 500 units deployed across BMW facilities.' },
      { id: 'ev-hr-2', source: 'Tesla Optimus', type: 'industry_data', direction: 'supports', credibility: 0.85, recency: 0.97, consensus: 0.45, criteria_match: 0.72, composite: 0.278, delta_log_odds: 0.32, date: '2026-01-20', summary: 'Optimus Gen 3 priced at $25K, demonstrates household task completion with 87% success rate.' },
    ],
    success_criteria: 'Humanoid robots commercially available (<$50K) performing >20 household/industrial tasks.',
    falsification: 'No commercially deployed humanoid robot fleet >10K units by 2037.',
    dependencies: ['agi'],
    description: 'Versatile humanoid robots performing diverse physical tasks in homes and factories.',
    triageScore: 76,
    archetype: 'breakthrough',
  },
];

// Trajectory data for Traces view
export interface TrajectoryPoint {
  year: number;
  compute: number;
  energy: number;
  connectivity: number;
  manufacturing: number;
  biology: number;
}

export const trajectoryData: TrajectoryPoint[] = [
  { year: 1900, compute: 0.02, energy: 0.15, connectivity: 0.08, manufacturing: 0.12, biology: 0.03 },
  { year: 1920, compute: 0.03, energy: 0.20, connectivity: 0.12, manufacturing: 0.18, biology: 0.05 },
  { year: 1940, compute: 0.05, energy: 0.28, connectivity: 0.18, manufacturing: 0.25, biology: 0.08 },
  { year: 1950, compute: 0.12, energy: 0.32, connectivity: 0.22, manufacturing: 0.30, biology: 0.10 },
  { year: 1960, compute: 0.20, energy: 0.38, connectivity: 0.30, manufacturing: 0.36, biology: 0.14 },
  { year: 1970, compute: 0.30, energy: 0.42, connectivity: 0.38, manufacturing: 0.40, biology: 0.18 },
  { year: 1980, compute: 0.42, energy: 0.45, connectivity: 0.48, manufacturing: 0.44, biology: 0.22 },
  { year: 1990, compute: 0.55, energy: 0.48, connectivity: 0.58, manufacturing: 0.48, biology: 0.28 },
  { year: 2000, compute: 0.68, energy: 0.52, connectivity: 0.70, manufacturing: 0.52, biology: 0.35 },
  { year: 2010, compute: 0.78, energy: 0.56, connectivity: 0.82, manufacturing: 0.55, biology: 0.42 },
  { year: 2020, compute: 0.88, energy: 0.60, connectivity: 0.90, manufacturing: 0.58, biology: 0.50 },
  { year: 2025, compute: 0.93, energy: 0.64, connectivity: 0.93, manufacturing: 0.61, biology: 0.55 },
  { year: 2030, compute: 0.97, energy: 0.70, connectivity: 0.96, manufacturing: 0.66, biology: 0.62 },
  { year: 2040, compute: 1.05, energy: 0.82, connectivity: 1.00, manufacturing: 0.75, biology: 0.74 },
  { year: 2050, compute: 1.12, energy: 0.95, connectivity: 1.04, manufacturing: 0.86, biology: 0.85 },
  { year: 2060, compute: 1.18, energy: 1.08, connectivity: 1.08, manufacturing: 0.95, biology: 0.94 },
];
