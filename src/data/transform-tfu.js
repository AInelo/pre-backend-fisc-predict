const fs = require('fs');
const path = require('path');

// Fonction utilitaire pour créer des slugs
// function createSlug(text) {
//   return text
//     .toLowerCase()
//     .normalize("NFD") // Décompose les caractères accentués
//     .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
//     .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères spéciaux
//     .trim()
//     .replace(/\s+/g, "-") // Remplace les espaces par des tirets
//     .replace(/-+/g, "-"); // Supprime les tirets multiples
// }

// function createSlug(text) {
//   return text
//     .toLowerCase()
//     .normalize("NFD")                     // Décompose les accents
//     .replace(/[\u0300-\u036f]/g, "")     // Supprime les accents restants
//     .replace(/[^a-z0-9\s]/g, "")         // Supprime les caractères spéciaux
//     .trim()
//     .replace(/\s+/g, "_")                // Remplace les espaces par des _
//     .replace(/_+/g, "_");                // Réduit les multiples _ en un seul
// }


function createSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")                     // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "")     // Supprime les accents
    .replace(/-/g, "_")                  // Remplace explicitement les tirets par des underscores
    .replace(/[^a-z0-9\s_]/g, "")        // Supprime les caractères spéciaux (sauf underscore)
    .trim()
    .replace(/\s+/g, "_")                // Remplace les espaces par des underscores
    .replace(/_+/g, "_");                // Réduit les underscores multiples
}



// Fonction pour transformer les données existantes
function transformDataWithSlugs(originalData) {
  const transformedData = {
    departements: []
  };

  originalData.departements.forEach((dept) => {
    const transformedDept = {
      nom: dept.nom,
      slug: createSlug(dept.nom),
      communes: []
    };

    dept.communes.forEach((commune) => {
      const transformedCommune = {
        nom: commune.nom,
        slug: createSlug(commune.nom),
        arrondissements: []
      };

      commune.arrondissements.forEach((arr) => {
        const transformedArr = {
          nom: arr.nom,
          slug: createSlug(arr.nom),
          tarifs: {}
        };

        // Transformer les tarifs
        Object.keys(arr.tarifs).forEach((categorieKey) => {
          const categorie = arr.tarifs[categorieKey];
          transformedArr.tarifs[categorieKey] = {
            // nom_categorie: categorie.nom_categorie,
            // slug_categorie: createSlug(categorie.nom_categorie),
            description: categorie.description,
            slug_description: createSlug(categorie.description),
            tfu_par_m2: categorie.tfu_par_m2,
            tfu_minimum: categorie.tfu_minimum
          };
        });

        transformedCommune.arrondissements.push(transformedArr);
      });

      transformedDept.communes.push(transformedCommune);
    });

    transformedData.departements.push(transformedDept);
  });

  return transformedData;
}

// Fonction pour calculer les statistiques
function getTransformationStats(data) {
  let communes = 0;
  let arrondissements = 0;
  let categories = 0;
  
  data.departements.forEach(dept => {
    communes += dept.communes.length;
    dept.communes.forEach(commune => {
      arrondissements += commune.arrondissements.length;
      commune.arrondissements.forEach(arr => {
        categories += Object.keys(arr.tarifs).length;
      });
    });
  });
  
  return {
    departements: data.departements.length,
    communes,
    arrondissements,
    categories
  };
}

// Fonction utilitaire pour prévisualiser les slugs générés
function previewSlugs(data, limit = 5) {
  console.log('\n🔍 Aperçu des slugs générés:');
  
  let count = 0;
  for (const dept of data.departements) {
    if (count >= limit) break;
    console.log(`   Département: "${dept.nom}" → "${dept.slug}"`);
    
    for (const commune of dept.communes) {
      if (count >= limit) break;
      console.log(`   Commune: "${commune.nom}" → "${commune.slug}"`);
      
      for (const arr of commune.arrondissements) {
        if (count >= limit) break;
        console.log(`   Arrondissement: "${arr.nom}" → "${arr.slug}"`);
        count++;
      }
    }
  }
}

// Fonction principale pour exécuter la transformation
async function main() {
  try {
    console.log('🚀 Début de la transformation des données TFU...');
    
    // Chemin vers le fichier JSON d'origine
    const inputFilePath = path.join(__dirname, 'tfu_data_final.json');
    const outputFilePath = path.join(__dirname, 'tfu_data_with_slugs.json');
    
    // Vérifier si le fichier d'entrée existe
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Le fichier ${inputFilePath} n'existe pas.`);
    }
    
    console.log(`📖 Lecture du fichier: ${inputFilePath}`);
    
    // Lire le fichier JSON original
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const originalData = JSON.parse(rawData);
    
    console.log('✨ Transformation des données en cours...');
    
    // Transformer les données
    const transformedData = transformDataWithSlugs(originalData);
    
    console.log('💾 Sauvegarde du fichier transformé...');
    
    // Sauvegarder le nouveau fichier avec slugs
    fs.writeFileSync(
      outputFilePath, 
      JSON.stringify(transformedData, null, 2), 
      'utf8'
    );
    
    console.log(`✅ Transformation terminée avec succès !`);
    console.log(`📄 Fichier de sortie: ${outputFilePath}`);
    
    // Afficher quelques statistiques
    const stats = getTransformationStats(transformedData);
    console.log('\n📊 Statistiques de transformation:');
    console.log(`   - Départements: ${stats.departements}`);
    console.log(`   - Communes: ${stats.communes}`);
    console.log(`   - Arrondissements: ${stats.arrondissements}`);
    console.log(`   - Catégories de tarifs: ${stats.categories}`);
    
    // Prévisualiser quelques slugs
    previewSlugs(transformedData, 3);
    
  } catch (error) {
    console.error('❌ Erreur lors de la transformation:', error.message);
    process.exit(1);
  }
}

// Exporter les fonctions pour une utilisation externe
module.exports = {
  createSlug,
  transformDataWithSlugs,
  getTransformationStats,
  previewSlugs
};

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}