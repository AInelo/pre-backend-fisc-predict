const fs = require('fs');
const path = require('path');

function groupArrondissementsByCommune(data) {
  const result = {};

  data.departements.forEach(dept => {
    dept.communes.forEach(commune => {
      const communeSlug = commune.slug;

      result[communeSlug] = commune.arrondissements.map(arr => ({
        value: arr.slug,
        label: {
          fr: arr.nom,
          en: arr.nom // même nom en anglais
        }
      }));
    });
  });

  return result;
}

function main() {
  const inputPath = path.join(__dirname, 'tfu_data_with_slugs.json');
  const outputPath = path.join(__dirname, 'arrondissements_by_commune.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Le fichier ${inputPath} est introuvable.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(rawData);

  const groupedData = groupArrondissementsByCommune(data);

  fs.writeFileSync(outputPath, JSON.stringify(groupedData, null, 2), 'utf8');

  console.log('✅ Export des arrondissements par commune terminé :', outputPath);
}

if (require.main === module) {
  main();
}
