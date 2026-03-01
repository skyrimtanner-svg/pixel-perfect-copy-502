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
  accomplished: 'text-gold-solid',
  evidence_emerging: 'text-gold-solid',
  projected: 'text-primary',
  falsified: 'text-red-400',
};

export const statusBgClass: Record<Status, string> = {
  accomplished: 'bg-green-400/10 text-green-400 border-green-400/20',
  evidence_emerging: 'bg-gold/10 text-gold-solid border-gold/20',
  projected: 'bg-primary/10 text-primary border-primary/20',
  falsified: 'bg-red-400/10 text-red-400 border-red-400/20',
};
