import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import tpsRoutes from './routes/impots/general/tps/TPS.general.route';

const app = express();

// ✅ Middleware CORS pour autoriser toutes les origines
app.use(cors({
  origin: '*', // Autorise tout domaine
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// ➕ Route pour vérifier que l'API est vivante
app.get('/apiAlive', (_req, res) => {
  res.status(200).json({ message: 'API is alive 🚀' });
});

app.use('/api/general/', tpsRoutes);

const PORT = 5001;


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
});





















// import express from 'express';
// import bodyParser from 'body-parser';
// import cors from 'cors';

// import tpsRoutes from './routes/impots/general/tps/TPS.general.route';

// const app = express();


// app.use(bodyParser.json());

// // ➕ Route pour vérifier que l'API est vivante
// app.get('/apiAlive', (_req, res) => {
//   res.status(200).json({ message: 'API is alive 🚀' });
// });

// app.use('/api/general/', tpsRoutes);

// const PORT = 5001;
// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });


