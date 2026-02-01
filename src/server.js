const app = require('./app');
const http = require('http');
const PORT = process.env.PORT || 3000;
const path = require('path');

const rootDir = require('./utils/pathUtils');
const peekRouter = require('./routes/peekRouter');
const compressRouter = require('./routes/compressRouter');
const compressPPTRouter = require('./routes/compressPPTRouter');
const loginRouter = require('./routes/loginRouter');
const isAuthenticated = require('./middlewares/auth.middleware');
const usageLimit = require('./middlewares/usageLimit.middleware');

app.use((req, res, next) => {
  req.user = null; // Simulating an unauthenticated user
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.render('Home', { title: 'Home' });
});

app.use("/auth", loginRouter);

app.use('/peek', peekRouter); // <- isAuthenticated, add this after 

app.use("/compress/pdf", compressRouter); // <- isAuthenticated, usageLimit, add this after

app.use("/compress/ppt",compressPPTRouter);

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});