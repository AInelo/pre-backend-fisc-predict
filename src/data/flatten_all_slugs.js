const fs = require('fs');
const path = require('path');

// Fonction d'extraction à plat
function extractFlatStructure(data) {
  const departementsSet = new Map();
  const communesSet = new Map();
  const arrondissementsSet = new Map();
  const categoriesSet = new Map();

  data.departements.forEach(dept => {
    departementsSet.set(dept.slug, { label: dept.nom, value: dept.slug });

    dept.communes.forEach(commune => {
      communesSet.set(commune.slug, { label: commune.nom, value: commune.slug });

      commune.arrondissements.forEach(arr => {
        arrondissementsSet.set(arr.slug, { label: arr.nom, value: arr.slug });

        Object.values(arr.tarifs).forEach(cat => {
          if (cat && cat.description && cat.slug_description) {
            categoriesSet.set(cat.slug_description, {
              label: cat.description,
              value: cat.slug_description
            });
          }
        });

      });
    });
  });

  return {
    departements: Array.from(departementsSet.values()),
    communes: Array.from(communesSet.values()),
    arrondissements: Array.from(arrondissementsSet.values()),
    categories: Array.from(categoriesSet.values())
  };
}

// Fonction principale
function main() {
  const inputPath = path.join(__dirname, 'tfu_data_with_slugs.json');
  const outputPath = path.join(__dirname, 'all_slugs_flat.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Le fichier ${inputPath} n'existe pas.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);

  const flatStructure = extractFlatStructure(data);

  fs.writeFileSync(outputPath, JSON.stringify(flatStructure, null, 2), 'utf8');

  console.log('✅ Export terminé :', outputPath);
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}
