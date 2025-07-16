AIB -----

router.post('/simuler-aib', AIBController.simuler);
router.post('/verifier-exoneration', AIBController.verifierExoneration);
router.post('/estimer-avant-transaction', AIBController.estimerAvantTransaction);
router.post('/verifier-pour-declaration', AIBController.verifierPourDeclaration);
router.post('/simuler-retenue-negociation', AIBController.simulerRetenuePourNegociation);
router.post('/planifier-charges-fiscales', AIBController.planifierChargesFiscales);
router.post('/reconstituer-pour-controle', AIBController.reconstituerPourControle);



IBA -------

router.post('/calculer', IBAController.calculerIBA);
router.post('/estimer-proportionnel', IBAController.estimerIBAProportionnel);
router.post('/simuler-reduction', IBAController.simulerReduction);
router.post('/verifier-eligibilite-regime-reel', IBAController.verifierEligibiliteRegimeReel);
router.post('/simuler-business-plan', IBAController.simulerBusinessPlan);
router.post('/verifier-coherence-audit', IBAController.verifierCoherenceAudit);



IRCM ------
