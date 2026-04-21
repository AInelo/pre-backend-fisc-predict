# Améliorations récentes du calcul TPS

## 2025-11-08

- Ajout du champ optionnel `dateCreation` dans `TPSInput` pour connaître l’année de création de l’entreprise, conformément à la documentation (`annee creation = annee courante → dispense d’acomptes`).
- Détermination automatique de la première année d’activité à partir de `dateCreation` et de la période fiscale, avec stockage dans `estPremiereAnnee`.
- Adaptation des obligations et informations retournées :
  - Première année : affichage d’une dispense d’acomptes et rappel que seul le solde du 30 avril N+1 est dû.
  - Années suivantes : maintien des échéances classiques (acomptes du 10 février et du 10 juin, solde au 30 avril).
- Mise à jour des sections `obligationEcheance` et `infosSupplementaires` pour refléter ces cas, en s’alignant sur les prescriptions de `docs/modelisation_mathematique/REGIME_TPS/TPS.md`.

Ces modifications harmonisent la logique applicative avec la documentation fiscale et clarifient les obligations communiquées à l’utilisateur.

