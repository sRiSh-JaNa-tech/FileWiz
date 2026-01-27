const app = require('./app');
const http = require('http');
const PORT = process.env.PORT || 3000;
const path = require('path');
const rootDir = require('./utils/pathUtils');
const userRouter = require('./routes/userRouter');

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(userRouter);

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});