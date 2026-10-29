require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Akatsuki's Draft Backend Server is running!`);
    console.log(` Port:    http://localhost:${PORT}`);
    console.log(` Mode:    ${process.env.NODE_ENV || 'development'}`);
    console.log(` Nodevember 4.0 Post-Event AI Content Platform `);
    console.log(`===============================================`);
  });
});
