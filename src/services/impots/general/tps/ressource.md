Step 1 

De la meme maniere que nous avons fait le principe de calcule de la TPS en suivant les interface pour le l'envoie de donne au front et son principe de calcul, nous allons faire pareil avec IRF dans IRF.general.ts 


voici son principe de calcule 


import { TaxpayerData, TaxCalculationResult, TaxBreakdown } from '../types/tax';
import { formatCurrency } from '../utils/currency';


export function calculateIRF(data: TaxpayerData): TaxCalculationResult {
  const breakdown: TaxBreakdown[] = [];
  const details: string[] = [];
  const additionalInfo: string[] = [];
  let totalTax = 0;

  if (!data.rentalIncome || data.rentalIncome <= 0) {
    throw new Error('Revenu locatif invalide');
  }

  const rate = data.isAlreadyTaxed ? 0.10 : 0.12;
  const taxAmount = data.rentalIncome * rate;

  breakdown.push({
    name: 'Impôt sur les Revenus Fonciers (IRF)',
    amount: taxAmount,
    rate: `${rate * 100}%`,
    description: `Calculé sur le revenu locatif de ${formatCurrency(data.rentalIncome)}`,
  });
  totalTax += taxAmount;

  // Redevance ORTB
  breakdown.push({
    name: 'Redevance ORTB',
    amount: 4000,
    rate: 'N/A',
    description: 'Redevance audiovisuelle obligatoire',
  });
  totalTax += 4000;


  details.push(
    `Calcul de l'IRF pour un revenu locatif de ${formatCurrency(data.rentalIncome)}`,
    data.isAlreadyTaxed
      ? 'Taux réduit de 10% appliqué (revenu déjà soumis à IBA/IS)'
      : 'Taux standard de 12% appliqué',
    'Redevance ORTB de 4 000 FCFA appliquée',
  );

  additionalInfo.push(
    'L’IRF doit être déclaré et payé avant le 10 du mois suivant la perception des revenus locatifs',
    'Justificatifs à conserver pendant 5 ans',
  );

  return {
    totalTax: Math.round(totalTax),
    breakdown,
    regime: 'IRF',
    details: details.filter(d => d !== ''),
    additionalInfo,
  };
}



et ses obligation 

Obligations fiscales et échéances
Échéances de paiement :
30 avril : Déclaration annuelle et paiement.
Obligations principales :
Déclarer vos revenus fonciers annuellement avant le 30 avril.
Conservez vos justificatifs de paiement ou de déclaration.
Informations complémentaires
Centre d'impôts compétent :
Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial

Contact et assistance :
Pour toute information, contactez la Cellule de Services aux Contribuables (CSC) au 133.

Taxes supplémentaires à considérer :


STEP 2
 nous allons maintenant faire son controller dans IRF.general.controller.ts





Step 3
 nous allons maintenant faire la route  dans IRF.general.route.ts