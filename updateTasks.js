const mongoose = require('mongoose');
const Task = require('./models/Task');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const result = await Task.updateMany(
      { priority: { $exists: false } },
      { $set: { priority: 'Medium' } }
    );

    console.log(`Updated ${result.modifiedCount} tasks`);
    mongoose.disconnect();
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));