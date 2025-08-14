// Test complet du contrôleur d'estimation globale avec tous les impôts
const { calculerEstimationGlobaleEntreprise } = require('./dist/services/impots/general/entreprise.general.estimation.js');

// Test avec TOUS les impôts disponibles
const testDataComplet = {
    dataImpot: {
        // AIB - Accompte sur l'Impôt sur les Bénéfices
        'AIB': {
            aibCollected: 1500000,
            aibGranted: 800000,
            periodeFiscale: '2025'
        },
        
        // IS - Impôt sur les Sociétés
        'IS': {
            chiffreAffaire: 75000000,
            charges: 45000000,
            secteur: 'industry',
            periodeFiscale: '2025'
        },
        
        // IBA - Impôt sur le Bénéfice d'Affaire
        'IBA': {
            chiffreAffaire: 25000000,
            charges: 15000000,
            secteur: 'real-estate',
            location: 'cotonou',
            periodeFiscale: '2025'
        },
        
        // IRF - Impôt sur les Revenus Fonciers
        'IRF': {
            revenuLocatif: 8000000,
            isAlreadyTaxed: false,
            periodeFiscale: '2025'
        },
        
        // ITS - Impôt sur les Traitements et Salaires
        'ITS': {
            salaireAnnuel: 350000,
            periodeFiscale: '2025'
        },
        
        // PATENTE - Patente
        'PATENTE': {
            chiffreAffaire: 120000000,
            location: 'cotonou',
            rentalValue: 5000000,
            isImporter: true,
            importExportAmount: 80000000,
            periodeFiscale: '2025'
        },
        
        // TFU - Taxe Foncière Urbaine
        'TFU': {
            possessionProprietes: true,
            NbrProprietes: 2,
            proprietes: [
                {
                    ville: 'cotonou',
                    valeurLocative: 3000000,
                    proprieteBatie: true,
                    tauxTfu: 12
                },
                {
                    ville: 'porto-novo',
                    valeurLocative: 2000000,
                    proprieteBatie: false,
                    tauxTfu: 10
                }
            ],
            periodeFiscale: '2025'
        },
        
        // TVM - Taxe sur les Véhicules à Moteur
        'TVM': {
            hasVehicles: true,
            vehicles: [
                {
                    vehicleType: 'company',
                    power: 8
                },
                {
                    vehicleType: 'private',
                    power: 12
                },
                {
                    vehicleType: 'public-persons',
                    capacity: 15
                }
            ],
            periodeFiscale: '2025'
        },
        
        // TPS - Taxe Professionnelle Synthétique
        'TPS': {
            chiffreAffaire: 15000000,
            periodeFiscale: '2025'
        }
    }
};

// Test avec quelques impôts seulement (pour comparaison)
const testDataSimple = {
    dataImpot: {
        'AIB': {
            aibCollected: 1000000,
            aibGranted: 500000,
            periodeFiscale: '2025'
        },
        'IS': {
            chiffreAffaire: 50000000,
            charges: 30000000,
            secteur: 'general',
            periodeFiscale: '2025'
        }
    }
};

console.log('🧪 ========================================');
console.log('🧪 TEST COMPLET DU CONTRÔLEUR D\'ESTIMATION GLOBALE');
console.log('🧪 ========================================');

// Test 1: Calcul simple avec 2 impôts
console.log('\n📊 TEST 1: Calcul simple (AIB + IS)');
console.log('📋 Données de test:', JSON.stringify(testDataSimple, null, 2));

try {
    const resultSimple = calculerEstimationGlobaleEntreprise(testDataSimple);
    console.log('✅ Résultat du calcul simple (BRUT):');
    console.log(JSON.stringify(resultSimple, null, 2));
} catch (error) {
    console.error('💥 Erreur lors du test simple:', error.message);
}

// Test 2: Calcul complet avec TOUS les impôts
console.log('\n📊 TEST 2: Calcul complet avec TOUS les impôts');
console.log('📋 Nombre d\'impôts à calculer:', Object.keys(testDataComplet.dataImpot).length);
console.log('📋 Impôts inclus:', Object.keys(testDataComplet.dataImpot).join(', '));

try {
    const resultComplet = calculerEstimationGlobaleEntreprise(testDataComplet);
    console.log('✅ Résultat du calcul complet (BRUT):');
    console.log(JSON.stringify(resultComplet, null, 2));
} catch (error) {
    console.error('💥 Erreur lors du test complet:', error.message);
}

// Test 3: Test avec des données invalides
console.log('\n📊 TEST 3: Test avec des données invalides');
const testDataInvalide = {
    dataImpot: {
        'INVALID_IMPOT': {
            invalidField: 'invalidValue',
            periodeFiscale: '2025'
        }
    }
};

try {
    const resultInvalide = calculerEstimationGlobaleEntreprise(testDataInvalide);
    console.log('✅ Résultat avec données invalides (BRUT):');
    console.log(JSON.stringify(resultInvalide, null, 2));
} catch (error) {
    console.error('💥 Erreur lors du test avec données invalides:', error.message);
}

console.log('\n🏁 ========================================');
console.log('🏁 TOUS LES TESTS TERMINÉS');
console.log('🏁 ========================================'); 