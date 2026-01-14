import express, { Request, Response } from 'express';
import { ImpotRepository } from '../../repositories/impot.repository';
import { ConstantesFiscalesService } from '../../services/impots/constantes-fiscales.service';

const router = express.Router();
const repository = new ImpotRepository();
const constantesService = new ConstantesFiscalesService();

/**
 * GET /api/admin/impots
 * Liste tous les impôts
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const impots = await repository.findAll();
    res.json({ success: true, data: impots });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des impôts'
    });
  }
});

/**
 * GET /api/admin/impots/:code/:annee
 * Récupère un impôt spécifique
 */
router.get('/:code/:annee', async (req: Request, res: Response) => {
  try {
    const { code, annee } = req.params;
    const anneeFiscale = parseInt(annee, 10);

    if (isNaN(anneeFiscale)) {
      return res.status(400).json({
        success: false,
        error: 'Année fiscale invalide'
      });
    }

    const impot = await repository.findByCodeAndYear(code.toUpperCase(), anneeFiscale);

    if (!impot) {
      return res.status(404).json({
        success: false,
        error: `Impot ${code} pour l'année ${anneeFiscale} introuvable`
      });
    }

    res.json({ success: true, data: impot });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'impôt'
    });
  }
});

/**
 * GET /api/admin/impots/:code/:annee/constantes
 * Récupère toutes les constantes d'un impôt
 */
router.get('/:code/:annee/constantes', async (req: Request, res: Response) => {
  try {
    const { code, annee } = req.params;
    const anneeFiscale = parseInt(annee, 10);

    if (isNaN(anneeFiscale)) {
      return res.status(400).json({
        success: false,
        error: 'Année fiscale invalide'
      });
    }

    const constantes = await constantesService.getConstantes(code.toUpperCase(), anneeFiscale);
    res.json({ success: true, data: constantes });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des constantes'
    });
  }
});

/**
 * GET /api/admin/impots/:code/:annee/constantes/:constanteCode
 * Récupère une constante spécifique
 */
router.get('/:code/:annee/constantes/:constanteCode', async (req: Request, res: Response) => {
  try {
    const { code, annee, constanteCode } = req.params;
    const anneeFiscale = parseInt(annee, 10);

    if (isNaN(anneeFiscale)) {
      return res.status(400).json({
        success: false,
        error: 'Année fiscale invalide'
      });
    }

    const valeur = await constantesService.getConstante(
      code.toUpperCase(),
      anneeFiscale,
      constanteCode.toUpperCase()
    );

    res.json({ success: true, data: { code: constanteCode, valeur } });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Constante introuvable'
    });
  }
});

/**
 * PUT /api/admin/impots/:code/:annee/constantes/:constanteCode
 * Met à jour une constante spécifique
 */
router.put('/:code/:annee/constantes/:constanteCode', async (req: Request, res: Response) => {
  try {
    const { code, annee, constanteCode } = req.params;
    const { valeur, description, unite } = req.body;
    const anneeFiscale = parseInt(annee, 10);

    if (isNaN(anneeFiscale)) {
      return res.status(400).json({
        success: false,
        error: 'Année fiscale invalide'
      });
    }

    if (valeur === undefined) {
      return res.status(400).json({
        success: false,
        error: 'La valeur de la constante est requise'
      });
    }

    // Déterminer le type de la valeur
    let type: 'number' | 'array' | 'object' = 'number';
    if (Array.isArray(valeur)) {
      type = 'array';
    } else if (typeof valeur === 'object' && valeur !== null) {
      type = 'object';
    }

    const constante = {
      code: constanteCode.toUpperCase(),
      valeur,
      type,
      description: description || undefined,
      unite: unite || undefined
    };

    const impot = await repository.upsertConstante(
      code.toUpperCase(),
      anneeFiscale,
      constante
    );

    if (!impot) {
      return res.status(404).json({
        success: false,
        error: `Impot ${code} pour l'année ${anneeFiscale} introuvable`
      });
    }

    // Vider le cache pour cette année fiscale
    constantesService.clearCache(code.toUpperCase(), anneeFiscale);

    res.json({ success: true, data: impot });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la constante'
    });
  }
});

/**
 * GET /api/admin/impots/annee/:annee
 * Liste tous les impôts pour une année fiscale
 */
router.get('/annee/:annee', async (req: Request, res: Response) => {
  try {
    const { annee } = req.params;
    const anneeFiscale = parseInt(annee, 10);

    if (isNaN(anneeFiscale)) {
      return res.status(400).json({
        success: false,
        error: 'Année fiscale invalide'
      });
    }

    const impots = await repository.findByYear(anneeFiscale);
    res.json({ success: true, data: impots });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des impôts'
    });
  }
});

export default router;

