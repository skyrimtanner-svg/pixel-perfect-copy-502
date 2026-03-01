import { Domain, Status } from '@/data/milestones';

export const domainColorClass: Record<Domain, string> = {
  compute: 'text-domain-compute',
  energy: 'text-domain-energy',
  connectivity: 'text-domain-connectivity',
  manufacturing: 'text-domain-manufacturing',
  biology: 'text-domain-biology',
};

export const domainBgClass: Record<Domain, string> = {
  compute: 'bg-domain-compute',
  energy: 'bg-domain-energy',
  connectivity: 'bg-domain-connectivity',
  manufacturing: 'bg-domain-manufacturing',
  biology: 'bg-domain-biology',
};

export const domainGlowClass: Record<Domain, string> = {
  compute: 'domain-glow-compute',
  energy: 'domain-glow-energy',
  connectivity: 'domain-glow-connectivity',
  manufacturing: 'domain-glow-manufacturing',
  biology: 'domain-glow-biology',
};

export const statusColorClass: Record<Status, string> = {
  accomplished: 'text-green-400',
  evidence_emerging: 'text-amber-400',
  projected: 'text-cyan-400',
  falsified: 'text-red-400',
};

export const statusBgClass: Record<Status, string> = {
  accomplished: 'bg-green-400/15 text-green-400 border-green-400/30',
  evidence_emerging: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  projected: 'bg-cyan-400/15 text-cyan-400 border-cyan-400/30',
  falsified: 'bg-red-400/15 text-red-400 border-red-400/30',
};
