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
import { seedFiscalParameters } from './config/seeding.config';

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

const PORT = Number(process.env.PORT) || 5400;

async function bootstrap(): Promise<void> {
  try {
    await seedFiscalParameters();
  } catch (error) {
    console.warn('Seeding fiscal ignoré:', error instanceof Error ? error.message : error);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
    console.log(`Routes estimation disponibles sur /api`);
  });
}

void bootstrap();