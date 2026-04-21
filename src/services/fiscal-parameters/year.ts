export function extractFiscalYear(periodeFiscale: string): number {
  const anneeMatch = periodeFiscale.match(/(\d{4})/);
  if (!anneeMatch) {
    throw new Error(`Periode fiscale invalide: ${periodeFiscale}`);
  }

  return parseInt(anneeMatch[1], 10);
}
