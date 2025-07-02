import express from 'express';
import bodyParser from 'body-parser';
import ircmRoutes from './routes/IRCM.route';

const app = express();
app.use(bodyParser.json());

app.use('/api/ircm', ircmRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
