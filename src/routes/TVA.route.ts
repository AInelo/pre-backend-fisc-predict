// Routes for TVA
import express from 'express';
import { TVAController } from '../controllers/reel/TVA.controller';

const router = express.Router();
const controller = new TVAController();

// TODO: define routes for TVA
// Example: router.get('/', controller.methodName);

router.post('/est-assujetti', TVAController.estAssujetti);
router.post('/obtenir-taux', TVAController.obtenirTaux);
router.post('/calculer-tva-operation', TVAController.calculerTVAOperation);
router.post('/calculer-prix-ttc', TVAController.calculerPrixTTC);
router.post('/calculer-tva-collectee', TVAController.calculerTVACollectee);
router.post('/calculer-tva-deductible', TVAController.calculerTVADeductible);
router.post('/calculer-tva-due', TVAController.calculerTVADue);
router.post('/calculer-penalites', TVAController.calculerPenalites);
router.post('/calculer-tva-facture', TVAController.calculerTVAFacture);
router.post('/calculer-prorata', TVAController.calculerProrata);
router.post('/ajuster-tva-deductible', TVAController.ajusterTVADeductible);
router.post('/verifier-territorialite', TVAController.verifierTerritorialite);
router.post('/est-declaration-obligatoire', TVAController.estDeclarationObligatoire);
router.post('/valider-coherence', TVAController.validerCoherence);
router.post('/calculer-taux-effectif', TVAController.calculerTauxEffectif);
router.post('/calculer-coefficient-recuperation', TVAController.calculerCoefficientRecuperation);
router.post('/calculer-tva-mensuelle', TVAController.calculerTVAMensuelle);
router.post('/calculer-tva-vente-simple', TVAController.calculerTVAVenteSimple);
router.post('/calculer-tva-deductible-avec-prorata', TVAController.calculerTVADeductibleAvecProrata);
router.post('/declarer-tva-mensuelle', TVAController.declarerTVAMensuelle);
router.post('/est-assujetti-selon-ca', TVAController.estAssujettiSelonCA);
router.post('/calculer-prix-ttc-avec-revenu-ht', TVAController.calculerPrixTTCAvecRevenuHT);

export default router;
