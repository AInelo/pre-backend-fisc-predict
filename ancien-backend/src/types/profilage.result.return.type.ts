// import { type LucideIcon } from 'lucide-react';

export interface TaxProfile {
  typeContribuableEntreprise: string;
  annualRevenue: number;
  regime: string;
}

export interface ProfilingData {
  profile: TaxProfile;
  taxes: ApplicableTax[];
}


export interface ApplicableTax {
  name: string;
  category: string;
  code : string;
  applicability: string;
  frequency: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  required: boolean;
  icon: string;
  typeContribuableOnly?: string[];
}


