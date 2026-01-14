import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import tpsRoutes from './routes/impots/general/tps/TPS.general.route';
import itsRoutes from './routes/impots/general/reel/ITS.general.route';
import tfuRoutes from './routes/impots/general/reel/TFU.general.route';
import irfRoutes from './routes/impots/general/reel/IRF.general.route';
import entrepriseGeneralEstimationRoutes from './routes/impots/general/entreprise.general.estimation.route';
import profillageRoutes from './routes/common/profillage.route';
import estimationSummaryRoutes from './routes/common/summurize.route';
import impotsAdminRoutes from './routes/admin/impots.route';
import { MongoConnection } from './config/databases/MongoConnection';
import { ImpotsSeeder } from './config/seeding/impots.seed';

const app = express();

// ✅ Middleware CORS pour autoriser toutes les origines
// app.use(cors({
//   origin: '*', // Autorise tout domaine
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(bodyParser.json());

// ➕ Route pour vérifier que l'API est vivante
app.get('/apiAlive', (_req, res) => {
  res.status(200).json({ message: 'API is alive 🚀' });
});

// Routes des impôts généraux
app.use('/api/general/', tpsRoutes);
app.use('/api/general/', itsRoutes);
app.use('/api/general/', tfuRoutes);
app.use('/api/general/', irfRoutes);
app.use('/api/general/', entrepriseGeneralEstimationRoutes);

// Routes communes
app.use('/api/', profillageRoutes);
app.use('/api/', estimationSummaryRoutes);

// Routes d'administration des impôts
app.use('/api/admin/impots', impotsAdminRoutes);

const PORT = 5001;

// Initialisation de MongoDB et seeding
async function initializeDatabase() {
  try {
    const mongoConnection = MongoConnection.getInstance();
    await mongoConnection.connect();
    
    // Exécuter le seeding des impôts
    const seeder = new ImpotsSeeder();
    await seeder.seed();
    
    console.log('✅ Base de données initialisée');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    // Ne pas bloquer le démarrage du serveur si MongoDB n'est pas disponible
    // En production, vous pourriez vouloir arrêter le serveur ici
  }
}

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
  console.log(`📊 Nouvelles routes disponibles:`);
  console.log(`  - POST http://0.0.0.0:${PORT}/api/estimation/summarize`);
  console.log(`  - POST http://0.0.0.0:${PORT}/api/estimation/stats`);
  
  // Initialiser la base de données après le démarrage du serveur
  await initializeDatabase();
});