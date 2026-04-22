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
import authRoutes from './routes/auth/auth.route';
import fiscalParametersRoutes from './routes/fiscal-parameters/fiscal-parameters.route';
import passport from './config/passport';
import { seedFiscalParameters } from './config/seeding.config';

const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine CORS non autorisée : ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(passport.initialize());

// ➕ Route pour vérifier que l'API est vivante
app.get('/apiAlive', (_req, res) => {
  res.status(200).json({ message: 'API is alive 🚀' });
});

// Authentification
app.use('/api/auth', authRoutes);

// Paramètres fiscaux
app.use('/api/fiscal', fiscalParametersRoutes);

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