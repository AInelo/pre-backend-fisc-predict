const fs = require('fs');
const path = require('path');

// Fonction pour extraire tous les slugs
function extractAllSlugs(data) {
  const departementSlugs = new Set();
  const communeSlugs = new Set();
  const arrondissementSlugs = new Set();
  const categorieSlugs = new Set();

  data.departements.forEach(dept => {
    departementSlugs.add(dept.slug);

    dept.communes.forEach(commune => {
      communeSlugs.add(commune.slug);

      commune.arrondissements.forEach(arr => {
        arrondissementSlugs.add(arr.slug);

        Object.values(arr.tarifs).forEach(cat => {
          if (cat.slug_categorie) categorieSlugs.add(cat.slug_categorie);
          if (cat.slug_description) categorieSlugs.add(cat.slug_description);
        });
      });
    });
  });

  return {
    departementSlugs: [...departementSlugs],
    communeSlugs: [...communeSlugs],
    arrondissementSlugs: [...arrondissementSlugs],
    categorieSlugs: [...categorieSlugs]
  };
}

// Fonction principale
function main() {
  const inputPath = path.join(__dirname, 'tfu_data_with_slugs.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Le fichier ${inputPath} n'existe pas.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);

  const slugs = extractAllSlugs(data);

  console.log('\n📦 Tous les slugs existants dans le système:\n');

  console.log('🏛️ Départements:');
  slugs.departementSlugs.forEach(slug => console.log(`  - ${slug}`));

  console.log('\n🏘️ Communes:');
  slugs.communeSlugs.forEach(slug => console.log(`  - ${slug}`));

  console.log('\n📍 Arrondissements:');
  slugs.arrondissementSlugs.forEach(slug => console.log(`  - ${slug}`));

  console.log('\n📑 Slugs de catégories et descriptions:');
  slugs.categorieSlugs.forEach(slug => console.log(`  - ${slug}`));
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
