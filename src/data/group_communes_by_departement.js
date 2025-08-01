const fs = require('fs');
const path = require('path');

function groupCommunesByDepartement(data) {
  const result = {};

  data.departements.forEach(dept => {
    const deptSlug = dept.slug;

    result[deptSlug] = dept.communes.map(commune => ({
      value: commune.slug,
      label: {
        fr: commune.nom,
        en: commune.nom // en anglais, ici on garde le même nom
      }
    }));
  });

  return result;
}

function main() {
  const inputPath = path.join(__dirname, 'tfu_data_with_slugs.json');
  const outputPath = path.join(__dirname, 'communes_by_departement.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Le fichier ${inputPath} est introuvable.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(rawData);

  const groupedData = groupCommunesByDepartement(data);

  fs.writeFileSync(outputPath, JSON.stringify(groupedData, null, 2), 'utf8');

  console.log('✅ Export des communes par département terminé :', outputPath);
}

if (require.main === module) {
  main();
}
