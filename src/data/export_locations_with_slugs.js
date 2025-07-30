const fs = require('fs');
const path = require('path');

// Fonction pour extraire uniquement les slugs de localisation
function extractLocationSlugs(data) {
  return data.departements.map(dept => ({
    nom: dept.nom,
    slug: dept.slug,
    communes: dept.communes.map(commune => ({
      nom: commune.nom,
      slug: commune.slug,
      arrondissements: commune.arrondissements.map(arr => ({
        nom: arr.nom,
        slug: arr.slug
      }))
    }))
  }));
}

// Fonction principale
function main() {
  const inputFile = path.join(__dirname, 'tfu_data_with_slugs.json');
  const outputFile = path.join(__dirname, 'locations_with_slugs.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Le fichier ${inputFile} n'existe pas.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputFile, 'utf8');
  const data = JSON.parse(rawData);

  const locationOnly = extractLocationSlugs(data);

  fs.writeFileSync(outputFile, JSON.stringify(locationOnly, null, 2), 'utf8');

  console.log('✅ Fichier exporté avec succès :', outputFile);
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
