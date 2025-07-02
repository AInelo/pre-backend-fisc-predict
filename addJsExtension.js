import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le bon __dirname en ESM (corrige le double "C:\")
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construire le chemin proprement
const distPath = path.join(__dirname, 'dist');

// Vérifier si le dossier dist existe avant de continuer
if (!fs.existsSync(distPath)) {
  console.error(`Erreur : Le dossier "${distPath}" n'existe pas.`);
  process.exit(1);
}

console.log(`Chemin vers le dossier dist: ${distPath}`);

// Fonction pour ajouter .js aux imports dans les fichiers compilés
const addJsExtensionToImports = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      addJsExtensionToImports(filePath); // Récursion dans les sous-dossiers
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace(/(import.*?from\s+['"])(.*?)(['"])/g, (match, p1, p2, p3) => {
        // Vérifier si l'import est relatif (commence par './' ou '../')
        if (/^(\.\/|\.\.\/)/.test(p2) && !p2.endsWith('.js')) {
          return `${p1}${p2}.js${p3}`; // Ajouter .js si l'import ne l'a pas déjà
        }
        return match; // Ne rien faire si l'import n'est pas relatif
      });
      fs.writeFileSync(filePath, content); // Réécrit le fichier avec les modifications
    }
  });
};

// Exécuter le script
addJsExtensionToImports(distPath);
