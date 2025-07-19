import express from 'express';
import bodyParser from 'body-parser';
import ircmRoutes from './routes/IRCM.route';
import aibRoutes from './routes/AIB.route';
// import ibaRoutes from './routes/IBA.route';
// import irfRoutes from './routes/IRF.route';
// import isRoutes from './routes/IS.route';
// import itsRoutes from './routes/ITS.route';
// import patenteRoutes from './routes/PATENTE.route';
// import tvaRoutes from './routes/TVA.route';
// import vpsRoutes from './routes/VPS.route';
// import tpsRoutes from './routes/TPS.route';

const app = express();
app.use(bodyParser.json());

// app.use('/api/ircm', ircmRoutes);
// app.use('/api/aib', aibRoutes);
// app.use('/api/iba', ibaRoutes);
// app.use('/api/irf', irfRoutes);
// app.use('/api/is', isRoutes);
// app.use('/api/its', itsRoutes);
// app.use('/api/patente', patenteRoutes);
// app.use('/api/tva', tvaRoutes);
// app.use('/api/vps', vpsRoutes);
// app.use('/api/tps', tpsRoutes);

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
