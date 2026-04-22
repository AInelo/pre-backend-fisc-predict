Notes importantes pour le backend :

Impôt	chiffreAffaire auto-injecté	Champs conditionnels
TPS, TVA, AIB, IBA, PATENTE, IS	✅ oui	—
IBA	✅	nbrLitreAnnee si secteur=stations-services / conditionsReduction si secteur=artisanat
IS	✅	nbrLitreParAn si secteur=gas-station
PATENTE	✅	importExportAmount si isImporter=true
TFU	❌	tableau proprietes[] si possessionProprietes=true
TVM	❌	tableau vehicles[] si hasVehicles=true
IRCM	❌	aucun champ formulaire
