import * as fs from 'fs';
import * as path from 'path';

// Interface pour une catégorie de tarif avec slug
interface Categorie {
  nom_categorie: string;
  slug_categorie: string; // Nouveau champ slug
  description: string;
  slug_description: string; // Nouveau champ slug pour la description
  tfu_par_m2: number;
  tfu_minimum: number;
}

// Interface pour les tarifs d'un arrondissement
interface Tarifs {
  [key: string]: Categorie;
}

// Interface pour un arrondissement avec slug
interface Arrondissement {
  nom: string;
  slug: string; // Nouveau champ slug
  tarifs: Tarifs;
}

// Interface pour une commune avec slug
interface Commune {
  nom: string;
  slug: string; // Nouveau champ slug
  arrondissements: Arrondissement[];
}

// Interface pour un département avec slug
interface Departement {
  nom: string;
  slug: string; // Nouveau champ slug
  communes: Commune[];
}

// Interface racine pour la structure complète
interface StructureTarification {
  departements: Departement[];
}

// Fonction utilitaire pour créer des slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/-+/g, "-"); // Supprime les tirets multiples
}

// Fonction pour transformer les données existantes
function transformDataWithSlugs(originalData: any): StructureTarification {
  const transformedData: StructureTarification = {
    departements: []
  };

  originalData.departements.forEach((dept: any) => {
    const transformedDept: Departement = {
      nom: dept.nom,
      slug: createSlug(dept.nom),
      communes: []
    };

    dept.communes.forEach((commune: any) => {
      const transformedCommune: Commune = {
        nom: commune.nom,
        slug: createSlug(commune.nom),
        arrondissements: []
      };

      commune.arrondissements.forEach((arr: any) => {
        const transformedArr: Arrondissement = {
          nom: arr.nom,
          slug: createSlug(arr.nom),
          tarifs: {}
        };

        // Transformer les tarifs
        Object.keys(arr.tarifs).forEach((categorieKey) => {
          const categorie = arr.tarifs[categorieKey];
          transformedArr.tarifs[categorieKey] = {
            nom_categorie: categorie.nom_categorie,
            slug_categorie: createSlug(categorie.nom_categorie),
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

// Fonction principale pour exécuter la transformation
async function main() {
  try {
    console.log('🚀 Début de la transformation des données TFU...');
    
    // Chemin vers le fichier JSON d'origine
    const inputFilePath = path.join(__dirname, 'tfu_data.json');
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
    
  } catch (error) {
    console.error('❌ Erreur lors de la transformation:', error);
    process.exit(1);
  }
}

// Fonction pour calculer les statistiques
function getTransformationStats(data: StructureTarification) {
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
function previewSlugs(data: StructureTarification, limit: number = 5) {
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

// Exporter les fonctions pour une utilisation externe
// export {
//   createSlug,
//   transformDataWithSlugs,
//   StructureTarification,
//   Departement,
//   Commune,
//   Arrondissement,
//   Categorie
// };

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
