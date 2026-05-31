require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const app = require('./app');
const path = require('path');
const fs = require('fs');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("Critical: MONGO_URI environment variable is missing.");
}

if (process.env.VERCEL) {
  mongoose.connect(mongoUri)
    .then(() => console.log("MongoDB connected successfully (Vercel runtime)"))
    .catch(err => console.error("MongoDB connection failed:", err.message));
} else {
  mongoose.connect(mongoUri)
    .then(() => {
      app.listen(process.env.PORT || 5000, () =>
        console.log(`Server running locally on port ${process.env.PORT || 5000}`)
      );
    })
    .catch(err => console.error("MongoDB connection failed:", err.message));
}

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  const clientIndexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(clientIndexPath)) {
    app.use(express.static(clientBuildPath));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      return res.sendFile(clientIndexPath);
    });
  }
}

module.exports = app;
