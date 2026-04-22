import { Request, Response } from 'express';
import { fiscalParametersRepository } from '@/repositories/fiscal-parameters/FiscalParametersRepository';
import { FiscalContributorType } from '@/types/fiscal-parameters';

export async function getAnneesDisponibles(_req: Request, res: Response): Promise<void> {
  try {
    const annees = await fiscalParametersRepository.getAnneesDisponibles();
    res.status(200).json({
      success: true,
      data: {
        annees,
        total: annees.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération des années.',
    });
  }
}

export async function getImpotsParAnneeEtType(req: Request, res: Response): Promise<void> {
  const { annee, typeContribuable } = req.body as {
    annee?: unknown;
    typeContribuable?: unknown;
  };

  if (!annee || typeof annee !== 'number' || !Number.isInteger(annee)) {
    res.status(400).json({ success: false, message: 'Le champ "annee" est requis (entier).' });
    return;
  }

  const typesValides: FiscalContributorType[] = ['ENTREPRISE', 'PARTICULIER'];
  if (!typeContribuable || !typesValides.includes(typeContribuable as FiscalContributorType)) {
    res.status(400).json({
      success: false,
      message: `Le champ "typeContribuable" est requis : "ENTREPRISE" ou "PARTICULIER".`,
    });
    return;
  }

  try {
    const impots = await fiscalParametersRepository.getAllByAnneeAndType(
      annee,
      typeContribuable as FiscalContributorType
    );

    res.status(200).json({
      success: true,
      data: {
        annee,
        typeContribuable,
        total: impots.length,
        impots,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération des impôts.',
    });
  }
}
