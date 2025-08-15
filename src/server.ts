import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import tpsRoutes from './routes/impots/general/tps/TPS.general.route';
import itsRoutes from './routes/impots/general/reel/ITS.general.route';
import tfuRoutes from './routes/impots/general/reel/TFU.general.route';
import irfRoutes from './routes/impots/general/reel/IRF.general.route';
import entrepriseGeneralEstimationRoutes from './routes/impots/general/entreprise.general.estimation.route';
import profillageRoutes from './routes/common/profillage.route';
const app = express();

// ✅ Middleware CORS pour autoriser toutes les origines
// app.use(cors({
//   origin: '*', // Autorise tout domaine
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(bodyParser.json());

app.use(bodyParser.json());

// ➕ Route pour vérifier que l'API est vivante
app.get('/apiAlive', (_req, res) => {
  res.status(200).json({ message: 'API is alive 🚀' });
});

app.use('/api/general/', tpsRoutes);
app.use('/api/general/', itsRoutes);
app.use('/api/general/', tfuRoutes);
app.use('/api/general/', irfRoutes);
app.use('/api/general/', entrepriseGeneralEstimationRoutes);
app.use('/api/', profillageRoutes);
const PORT = 5001;


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
});

