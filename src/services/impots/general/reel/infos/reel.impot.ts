// ===== TYPES ET INTERFACES =====
// types/tax.ts
export type Location =
  | 'cotonou' | 'porto-novo' | 'ouidah' | 'abomey' | 'parakou'
  | 'other-zone1' | 'other-zone2' | 'alibori' | 'atacora'
  | 'borgou' | 'donga' | 'atlantique' | 'collines' | 'couffo'
  | 'littoral' | 'mono' | 'oueme' | 'plateau' | 'zou';

export type Sector = 'education' | 'industry' | 'real-estate' | 'construction' | 'gas-station' | 'general';

export interface PropertyDetails {
  value: number;
  location: string;
  isBuilt: boolean;
  tfuRate?: number;
}

export interface VehicleDetails {
  vehicleType: 'tricycle' | 'company' | 'private' | 'public-persons' | 'public-goods';
  power?: number;
  capacity?: number;
}

export interface TaxBreakdown {
  name: string;
  amount: number;
  rate: string;
  description: string;
}

export interface TaxCalculationResult {
  totalTax: number;
  breakdown: TaxBreakdown[];
  regime: string;
  details: string[];
  additionalInfo: string[];
}

export interface TaxpayerData {
  taxpayerType: 'individual' | 'entrepreneur-individual' | 'entrepreneur-company';
  revenue: number;
  charges?: number;
  location?: Location;
  sector?: Sector;
  isImporter?: boolean;
  importExportAmount?: number;
  hasGovernmentContracts?: boolean;
  contractAmount?: number;
  metering?: number;
  aibCollected?: number;
  aibGranted?: number;
  hasProperties?: boolean;
  propertyDetails?: PropertyDetails[];
  hasVehicles?: boolean;
  vehicleDetails?: VehicleDetails[];
  isArtisanWithFamily?: boolean;
  rentalValue?: number;
  establishments?: {
    location: Location;
    rentalValue: number;
    isOwned?: boolean;
  }[];
}

// ===== CONSTANTES =====
// constants/taxRates.ts
export const SECTOR_DISPLAY_NAMES: Record<Sector, string> = {
  education: 'Éducation',
  industry: 'Industrie',
  'real-estate': 'Immobilier',
  construction: 'BTP',
  'gas-station': 'Station-service',
  general: 'Général',
};

export const LOCATION_RATES = {
  cotonou: { zone: 1, patentFixedRate: 70000, proportionalRate: 17 },
  'porto-novo': { zone: 1, patentFixedRate: 70000, proportionalRate: 17 },
  ouidah: { zone: 1, patentFixedRate: 70000, proportionalRate: 18 },
  abomey: { zone: 1, patentFixedRate: 70000, proportionalRate: 14 },
  parakou: { zone: 2, patentFixedRate: 60000, proportionalRate: 25 },
  'other-zone1': { zone: 1, patentFixedRate: 70000, proportionalRate: 13 },
  'other-zone2': { zone: 2, patentFixedRate: 60000, proportionalRate: 15 },
};

export const CCI_BENIN_RATES = [
  { maxRevenue: 5000000, individual: 20000, company: 100000 },
  { maxRevenue: 25000000, individual: 50000, company: 200000 },
  { maxRevenue: 50000000, individual: 150000, company: 300000 },
  { maxRevenue: 400000000, individual: 400000, company: 400000 },
  { maxRevenue: 800000000, individual: 600000, company: 600000 },
  { maxRevenue: 1000000000, individual: 800000, company: 800000 },
  { maxRevenue: 2000000000, individual: 1200000, company: 1200000 },
  { maxRevenue: 4000000000, individual: 1600000, company: 1600000 },
  { maxRevenue: Infinity, individual: 2000000, company: 2000000 },
];

export const IMPORT_EXPORT_PATENT_RATES = [
  { maxAmount: 80000000, rate: 150000 },
  { maxAmount: 200000000, rate: 337500 },
  { maxAmount: 500000000, rate: 525000 },
  { maxAmount: 1000000000, rate: 675000 },
  { maxAmount: 2000000000, rate: 900000 },
  { maxAmount: 10000000000, rate: 1125000 },
  { maxAmount: Infinity, rate: 1125000, additionalPerBillion: 10000 },
];

// ===== UTILITAIRES =====
// utils/taxUtils.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getProportionalRate = (location: Location): number => {
  const rates: Record<Location, number> = {
    cotonou: 17, 'porto-novo': 17, ouidah: 18, abomey: 14, parakou: 25,
    alibori: 15, borgou: 15, atacora: 15, donga: 15,
    mono: 12, couffo: 12,
    atlantique: 13.5, collines: 13.5, oueme: 13.5, plateau: 13.5, zou: 13.5,
    'other-zone1': 13.5, 'other-zone2': 13.5, littoral: 13.5,
  };
  return rates[location] || 13.5;
};

export const getLocationZone = (location: Location): 'first' | 'second' => {
  const firstZone: Location[] = ['cotonou', 'porto-novo', 'ouidah', 'abomey', 'other-zone1',
    'atlantique', 'collines', 'couffo', 'littoral', 'mono', 'oueme', 'plateau', 'zou'];
  return firstZone.includes(location) ? 'first' : 'second';
};

// ===== CALCULATEURS SPÉCIALISÉS =====
// calculators/aibCalculator.ts
export class AIBCalculator {
  static calculate(aibCollected: number, aibGranted: number): {
    amount: number;
    breakdown: TaxBreakdown;
    details: string;
  } {
    const aibNet = aibCollected - aibGranted;
    
    return {
      amount: Math.round(aibNet),
      breakdown: {
        name: 'AIB Net',
        amount: Math.round(aibNet),
        rate: '1% à 5%',
        description: `AIB collecté (${formatCurrency(aibCollected)}) - AIB acquitté (${formatCurrency(aibGranted)})`,
      },
      details: `AIB net calculé : ${formatCurrency(aibNet)}`
    };
  }
}

// calculators/incomeCalculator.ts
export class IncomeTaxCalculator {
  static calculate(data: TaxpayerData): {
    amount: number;
    breakdown: TaxBreakdown;
    details: string[];
    creditAIB: number;
  } {
    const revenue = data.revenue ?? 0;
    const charges = data.charges ?? 0;
    const taxableIncome = Math.max(0, revenue - charges);
    const details: string[] = [];
    
    // Détermination du taux
    const taxRate = this.getTaxRate(data);
    const minTaxAbsolute = data.taxpayerType === 'entrepreneur-company' ? 250000 : 500000;
    
    // Calcul des impôts minimums
    const minTaxRateBased = this.calculateMinimumTax(data, revenue);
    const minTaxStation = this.calculateStationTax(data);
    
    // Calcul de l'impôt brut
    let incomeTaxBrut = this.calculateGrossTax(taxableIncome, taxRate, minTaxAbsolute, 
      Math.max(minTaxRateBased, minTaxStation), details);
    
    // Réduction pour artisans
    if (data.taxpayerType === 'entrepreneur-individual' && data.isArtisanWithFamily) {
      incomeTaxBrut = incomeTaxBrut / 2;
      details.push('Réduction de 50% de l\'IBA pour artisan travaillant avec famille');
    }
    
    const incomeTaxNet = incomeTaxBrut;
    const creditAIB = incomeTaxNet < 0 ? -incomeTaxNet : 0;
    
    return {
      amount: Math.max(0, incomeTaxNet),
      breakdown: {
        name: data.taxpayerType === 'entrepreneur-company' ? 'Impôt sur les Sociétés (IS) Net' : 'Impôt sur le Bénéfice d\'affaire (IBA) Net',
        amount: Math.round(Math.max(0, incomeTaxNet)),
        rate: `${taxRate * 100}%`,
        description: `IBA/IS brut (${formatCurrency(incomeTaxBrut)})`,
      },
      details,
      creditAIB
    };
  }
  
  private static getTaxRate(data: TaxpayerData): number {
    return data.sector === 'education' || 
           (data.taxpayerType === 'entrepreneur-company' && data.sector === 'industry') ? 0.25 : 0.30;
  }
  
  private static calculateMinimumTax(data: TaxpayerData, revenue: number): number {
    if (data.sector === 'real-estate') return revenue * 0.10;
    if (data.sector === 'construction') return revenue * 0.03;
    return revenue * (data.taxpayerType === 'entrepreneur-company' ? 0.01 : 0.015);
  }
  
  private static calculateStationTax(data: TaxpayerData): number {
    if (data.sector === 'gas-station' && data.metering) {
      return data.metering * 0.6;
    }
    return 0;
  }
  
  private static calculateGrossTax(taxableIncome: number, taxRate: number, 
    minTaxAbsolute: number, minTax: number, details: string[]): number {
    let incomeTaxBrut = taxableIncome * taxRate;
    
    if (incomeTaxBrut > 500000) {
      details.push(`Application directe du taux sectoriel (${taxRate * 100}%) sur le bénéfice imposable`);
    } else {
      if (incomeTaxBrut < minTaxAbsolute && taxableIncome < 500000) {
        incomeTaxBrut = minTaxAbsolute;
        details.push(`Application de l'impôt minimum de ${formatCurrency(minTaxAbsolute)}`);
      } else if (incomeTaxBrut < minTax) {
        incomeTaxBrut = minTax;
        details.push(`Application de l'impôt minimum de ${formatCurrency(minTax)}`);
      }
    }
    
    return incomeTaxBrut;
  }
}

// calculators/patentCalculator.ts
export class PatentCalculator {
  static calculate(data: TaxpayerData): {
    amount: number;
    breakdowns: TaxBreakdown[];
    details: string[];
  } {
    const establishments = data.establishments || 
      [{ location: data.location as Location, rentalValue: data.rentalValue || 0, isOwned: false }];
    
    let totalPatentTax = 0;
    const breakdowns: TaxBreakdown[] = [];
    const details: string[] = [];
    
    establishments.forEach((est, index) => {
      const result = this.calculateForEstablishment(est, data, index);
      totalPatentTax += result.amount;
      breakdowns.push(result.breakdown);
      details.push(...result.details);
    });
    
    return { amount: totalPatentTax, breakdowns, details };
  }
  
  private static calculateForEstablishment(establishment: any, data: TaxpayerData, index: number) {
    const zone = getLocationZone(establishment.location);
    const baseFixedRate = zone === 'first' ? 70000 : 60000;
    
    let patentFixedRate = this.adjustForRevenue(baseFixedRate, data.revenue);
    patentFixedRate = this.adjustForImportExport(patentFixedRate, data);
    
    const patentProportionalRate = this.calculateProportionalRate(establishment, patentFixedRate);
    const patentTax = patentFixedRate + patentProportionalRate;
    
    return {
      amount: patentTax,
      breakdown: {
        name: `Patente (Établissement ${index + 1} - ${establishment.location})`,
        amount: Math.round(patentTax),
        rate: `${patentFixedRate} FCFA (fixe)${establishment.rentalValue > 0 ? ` + ${getProportionalRate(establishment.location)}% de ${formatCurrency(establishment.rentalValue)}` : ''}`,
        description: `Taxe basée sur la localisation (${establishment.location})${establishment.rentalValue > 0 ? ` et valeur locative (${formatCurrency(establishment.rentalValue)} FCFA)` : ''}`,
      },
      details: []
    };
  }
  
  private static adjustForRevenue(baseRate: number, revenue: number): number {
    if (revenue > 1000000000) {
      const additionalBillions = Math.floor(revenue / 1000000000);
      return baseRate + additionalBillions * 10000;
    }
    return baseRate;
  }
  
  private static adjustForImportExport(rate: number, data: TaxpayerData): number {
    if (!data.isImporter || !data.importExportAmount) return rate;
    
    const amount = data.importExportAmount;
    if (amount <= 80000000) return 150000;
    if (amount <= 200000000) return 337500;
    if (amount <= 500000000) return 525000;
    if (amount <= 1000000000) return 675000;
    if (amount <= 2000000000) return 900000;
    if (amount <= 10000000000) return 1125000;
    
    return 1125000 + Math.floor((amount - 10000000000) / 1000000000) * 10000;
  }
  
  private static calculateProportionalRate(establishment: any, fixedRate: number): number {
    if (establishment.rentalValue <= 0 && !establishment.isOwned) return 0;
    
    const proportionalRate = getProportionalRate(establishment.location);
    let rate = establishment.rentalValue * (proportionalRate / 100);
    const minProportional = fixedRate / 3;
    
    return Math.max(rate, minProportional);
  }
}

// calculators/tfu.ts
export function calculateTFU(data: TaxpayerData): number {
  if (!data.hasProperties || !data.propertyDetails || data.propertyDetails.length === 0) {
    return 0;
  }
  
  let totalTFU = 0;
  for (const property of data.propertyDetails) {
    if (property.value <= 0 || !property.location) continue;
    
    const defaultRate = property.isBuilt ? 0.06 : 0.05;
    const rate = property.tfuRate !== undefined ? property.tfuRate / 100 : defaultRate;
    totalTFU += property.value * rate;
  }
  
  return Math.round(totalTFU);
}

// calculators/tvm.ts
export function calculateTVM(data: TaxpayerData): number {
  if (!data.hasVehicles || !data.vehicleDetails || data.vehicleDetails.length === 0) {
    return 0;
  }
  
  let totalTVM = 0;
  const rateMap = {
    tricycle: () => 15000,
    company: (vehicle: VehicleDetails) => (vehicle.power ?? 0) <= 7 ? 150000 : 200000,
    private: (vehicle: VehicleDetails) => {
      const power = vehicle.power ?? 0;
      if (power <= 7) return 20000;
      if (power <= 10) return 30000;
      if (power <= 15) return 40000;
      return 60000;
    },
    'public-persons': (vehicle: VehicleDetails) => {
      const capacity = vehicle.capacity ?? 0;
      if (capacity <= 9) return 38000;
      if (capacity <= 20) return 59800;
      return 86800;
    },
    'public-goods': (vehicle: VehicleDetails) => {
      const capacity = vehicle.capacity ?? 0;
      if (capacity <= 2.5) return 49500;
      if (capacity <= 5) return 68200;
      if (capacity <= 10) return 102300;
      return 136400;
    }
  };
  
  for (const vehicle of data.vehicleDetails) {
    const calculator = rateMap[vehicle.vehicleType];
    if (typeof calculator === 'function') {
      totalTVM += calculator(vehicle);
    } else {
      // Si le type de véhicule n'est pas reconnu, on ignore ce véhicule
      continue;
    }
  }

  return Math.round(totalTVM);
}

// ===== CALCULATEUR PRINCIPAL REFACTORISÉ =====
// calculators/reelRegimeCalculator.ts
export class REELRegimeCalculator {
  private breakdown: TaxBreakdown[] = [];
  private details: string[] = [];
  private additionalInfo: string[] = [];
  private totalTax = 0;

  constructor(private data: TaxpayerData) {
    this.validateData();
  }

  calculate(): TaxCalculationResult {
    this.calculateAIB();
    this.calculateIncomeTax();
    this.calculateTVA();
    this.calculatePatent();
    this.calculateCCIContribution();
    this.calculateORTBFee();
    this.calculateSpecialTaxes();
    this.calculatePropertyTaxes();
    this.addCalculationDetails();
    this.addAdditionalInfo();

    return {
      totalTax: Math.round(this.totalTax),
      breakdown: this.breakdown,
      regime: this.data.taxpayerType === 'entrepreneur-company' ? 'IS' : 'REEL',
      details: this.details.filter(d => d !== ''),
      additionalInfo: this.additionalInfo.filter(info => info !== ''),
    };
  }

  private validateData(): void {
    const revenue = this.data.revenue ?? 0;
    const charges = this.data.charges ?? 0;
    
    if (revenue <= 0 || charges < 0) {
      throw new Error('Données invalides pour le régime réel');
    }
  }

  private calculateAIB(): void {
    const aibCollected = this.data.aibCollected ?? 0;
    const aibGranted = this.data.aibGranted ?? 0;
    
    if (aibCollected > 0 || aibGranted > 0) {
      const result = AIBCalculator.calculate(aibCollected, aibGranted);
      this.breakdown.push(result.breakdown);
      this.details.push(result.details);
      this.totalTax += result.amount;
    }
  }

  private calculateIncomeTax(): void {
    const result = IncomeTaxCalculator.calculate(this.data);
    this.breakdown.push(result.breakdown);
    this.details.push(...result.details);
    this.totalTax += result.amount;
    
    if (result.creditAIB > 0) {
      this.breakdown.push({
        name: 'Crédit d\'AIB',
        amount: Math.round(result.creditAIB),
        rate: 'N/A',
        description: 'Crédit d\'AIB imputable sur l\'impôt de l\'année suivante',
      });
    }
  }

  private calculateTVA(): void {
    const tvaAmount = this.data.revenue * 0.18;
    this.breakdown.push({
      name: 'TVA',
      amount: Math.round(tvaAmount),
      rate: '18%',
      description: 'Taxe sur la Valeur Ajoutée (à titre informatif, non incluse dans le total)',
    });
  }

  private calculatePatent(): void {
    const result = PatentCalculator.calculate(this.data);
    this.breakdown.push(...result.breakdowns);
    this.details.push(...result.details);
    this.totalTax += result.amount;
  }

  private calculateCCIContribution(): void {
    const cciRate = CCI_BENIN_RATES.find(rate => this.data.revenue <= rate.maxRevenue);
    const cciAmount = cciRate
      ? this.data.taxpayerType === 'entrepreneur-company' ? cciRate.company : cciRate.individual
      : 2000000;

    this.breakdown.push({
      name: 'Contribution CCI Bénin',
      amount: Math.round(cciAmount),
      rate: 'Variable (selon le barème CCI Bénin)',
      description: 'Contribution annuelle à la Chambre de Commerce et d\'Industrie du Bénin',
    });
    this.totalTax += cciAmount;
  }

  private calculateORTBFee(): void {
    const ortbAmount = 4000;
    this.breakdown.push({
      name: 'Redevance ORTB',
      amount: ortbAmount,
      rate: 'Montant fixe',
      description: 'Contribution annuelle à l\'Office de Radiodiffusion et Télévision du Bénin',
    });
    this.totalTax += ortbAmount;
  }

  private calculateSpecialTaxes(): void {
    this.calculateImportExportTax();
    this.calculateGovernmentContractTax();
  }

  private calculateImportExportTax(): void {
    if (!this.data.isImporter || !this.data.importExportAmount) return;
    
    const rateEntry = IMPORT_EXPORT_PATENT_RATES.find(rate => 
      this.data.importExportAmount! <= rate.maxAmount);
    let importTax = rateEntry?.rate ?? 1000000;
    
    if (rateEntry?.additionalPerBillion && this.data.importExportAmount > 10000000000) {
      const additionalBillions = Math.floor((this.data.importExportAmount - 10000000000) / 1000000000);
      importTax += additionalBillions * rateEntry.additionalPerBillion;
    }
    
    this.breakdown.push({
      name: 'Taxe sur Import/Export',
      amount: Math.round(importTax),
      rate: 'Variable (1% à 5%)',
      description: `Taxe sur le montant des importations/exportations`,
    });
    this.totalTax += importTax;
  }

  private calculateGovernmentContractTax(): void {
    if (!this.data.hasGovernmentContracts || !this.data.contractAmount) return;
    
    const contractTax = this.data.contractAmount * 0.01;
    this.breakdown.push({
      name: 'Taxe sur les marchés publics',
      amount: Math.round(contractTax),
      rate: '1%',
      description: `Taxe sur le montant des marchés publics`,
    });
    this.totalTax += contractTax;
  }

  private calculatePropertyTaxes(): void {
    if (this.data.hasProperties && this.data.propertyDetails?.length) {
      const tfuAmount = calculateTFU(this.data);
      this.breakdown.push({
        name: 'Taxe Foncière Unique (TFU)',
        amount: Math.round(tfuAmount),
        rate: '3% à 8%',
        description: 'Taxe sur les propriétés bâties et non bâties',
      });
      this.totalTax += tfuAmount;
    }

    if (this.data.hasVehicles && this.data.vehicleDetails?.length) {
      const tvmAmount = calculateTVM(this.data);
      this.breakdown.push({
        name: 'Taxe sur les Véhicules à Moteur (TVM)',
        amount: Math.round(tvmAmount),
        rate: 'Variable',
        description: 'Taxe sur les véhicules à moteur',
      });
      this.totalTax += tvmAmount;
    }
  }

  private addCalculationDetails(): void {
    const taxableIncome = Math.max(0, this.data.revenue - (this.data.charges ?? 0));
    
    this.details.push(
      `Calcul régime réel pour un chiffre d'affaires de ${formatCurrency(this.data.revenue)}`,
      `Bénéfice imposable : ${formatCurrency(taxableIncome)}`,
      `Secteur : ${this.data.sector ? SECTOR_DISPLAY_NAMES[this.data.sector] : 'non spécifié'}`
    );
  }

  private addAdditionalInfo(): void {
    this.additionalInfo.push(
      'Le régime réel inclut l\'impôt sur les bénéfices (IBA/IS), la patente, la redevance ORTB, la TVA, et d\'autres taxes spécifiques.',
      'Acomptes IS/IBA : 10 mars, 10 juin, 10 septembre, 10 décembre ; solde au 30 avril.',
      'Déclarations mensuelles (TVA, AIB) obligatoires avant le 10 du mois suivant.',
      'Déclaration annuelle (bilan OHADA) avant le 30 avril.',
      'Paiements supérieurs à 100 000 FCFA doivent être effectués par voie bancaire.'
    );
  }
}

// ===== FONCTION PRINCIPALE SIMPLIFIÉE =====
export function calculateREELRegime(data: TaxpayerData): TaxCalculationResult {
  const calculator = new REELRegimeCalculator(data);
  return calculator.calculate();
}