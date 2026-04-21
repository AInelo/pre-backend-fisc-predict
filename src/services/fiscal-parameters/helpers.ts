import { CciRateBracket } from '@/types/fiscal-parameters';

export function findAmountFromRevenueBrackets(
  chiffreAffaire: number,
  brackets: CciRateBracket[]
): number {
  const matching = brackets.find(
    (bracket) => bracket.maxRevenue === null || chiffreAffaire <= bracket.maxRevenue
  );

  if (!matching) {
    throw new Error(`Aucune tranche trouvée pour le chiffre d'affaires ${chiffreAffaire}`);
  }

  return matching.amount;
}

export function describeRevenueBracket(
  chiffreAffaire: number,
  brackets: CciRateBracket[]
): string {
  const index = brackets.findIndex(
    (bracket) => bracket.maxRevenue === null || chiffreAffaire <= bracket.maxRevenue
  );

  if (index < 0) {
    return 'Échelon maximum du barème';
  }

  const current = brackets[index];
  const previous = index > 0 ? brackets[index - 1] : null;
  const minRevenue = previous?.maxRevenue === null ? 0 : (previous?.maxRevenue ?? 0) + 1;
  const maxRevenue =
    current.maxRevenue === null ? 'et plus' : current.maxRevenue.toLocaleString('fr-FR');

  return `Tranche ${Math.max(minRevenue, 0).toLocaleString('fr-FR')} - ${maxRevenue} FCFA`;
}
