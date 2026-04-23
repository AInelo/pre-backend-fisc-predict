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

export async function updateImpot(req: Request, res: Response): Promise<void> {
  const codeImpot = req.params.codeImpot?.toUpperCase();
  const { annee, typeContribuable, parametres } = req.body as {
    annee?: unknown;
    typeContribuable?: unknown;
    parametres?: unknown;
  };

  if (!codeImpot) {
    res.status(400).json({ success: false, message: 'Le paramètre "codeImpot" est requis dans l\'URL.' });
    return;
  }

  if (!annee || typeof annee !== 'number' || !Number.isInteger(annee)) {
    res.status(400).json({ success: false, message: 'Le champ "annee" est requis (entier).' });
    return;
  }

  const typesValides: FiscalContributorType[] = ['ENTREPRISE', 'PARTICULIER'];
  if (!typeContribuable || !typesValides.includes(typeContribuable as FiscalContributorType)) {
    res.status(400).json({
      success: false,
      message: 'Le champ "typeContribuable" est requis : "ENTREPRISE" ou "PARTICULIER".',
    });
    return;
  }

  if (!parametres || typeof parametres !== 'object' || Array.isArray(parametres)) {
    res.status(400).json({ success: false, message: 'Le champ "parametres" est requis (objet JSON).' });
    return;
  }

  try {
    const updated = await fiscalParametersRepository.updateParametres(
      codeImpot,
      typeContribuable as FiscalContributorType,
      annee,
      parametres as Record<string, unknown>
    );

    if (!updated) {
      res.status(404).json({
        success: false,
        message: `Aucun paramètre trouvé pour ${codeImpot} (${typeContribuable as string}) en ${annee}.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Paramètres de ${codeImpot} (${typeContribuable as string}) ${annee} mis à jour.`,
      data: { codeImpot, typeContribuable, annee },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour.',
    });
  }
}

export async function createImpot(req: Request, res: Response): Promise<void> {
  const { codeImpot, annee, typeContribuable, parametres, label } = req.body as {
    codeImpot?: unknown;
    annee?: unknown;
    typeContribuable?: unknown;
    parametres?: unknown;
    label?: unknown;
  };

  if (!codeImpot || typeof codeImpot !== 'string') {
    res.status(400).json({ success: false, message: 'Le champ "codeImpot" est requis (string).' });
    return;
  }

  if (!annee || typeof annee !== 'number' || !Number.isInteger(annee)) {
    res.status(400).json({ success: false, message: 'Le champ "annee" est requis (entier).' });
    return;
  }

  const typesValides: FiscalContributorType[] = ['ENTREPRISE', 'PARTICULIER'];
  if (!typeContribuable || !typesValides.includes(typeContribuable as FiscalContributorType)) {
    res.status(400).json({
      success: false,
      message: 'Le champ "typeContribuable" est requis : "ENTREPRISE" ou "PARTICULIER".',
    });
    return;
  }

  if (!parametres || typeof parametres !== 'object' || Array.isArray(parametres)) {
    res.status(400).json({ success: false, message: 'Le champ "parametres" est requis (objet JSON).' });
    return;
  }

  const metaLabel = typeof label === 'string' && label.trim()
    ? label.trim()
    : `${codeImpot.toUpperCase()} - ${typeContribuable as string} ${annee}`;

  try {
    const result = await fiscalParametersRepository.createParametres(
      codeImpot.toUpperCase(),
      typeContribuable as FiscalContributorType,
      annee,
      parametres as Record<string, unknown>,
      metaLabel
    );

    if (result === 'conflict') {
      res.status(409).json({
        success: false,
        message: `Les paramètres ${codeImpot.toUpperCase()} (${typeContribuable as string}) ${annee} existent déjà. Utilisez PUT pour les modifier.`,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: `Paramètres ${codeImpot.toUpperCase()} (${typeContribuable as string}) ${annee} créés.`,
      data: { codeImpot: codeImpot.toUpperCase(), typeContribuable, annee },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la création.',
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
