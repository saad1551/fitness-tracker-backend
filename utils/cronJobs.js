const cron = require('node-cron');
const User = require('./models/User'); // Adjust the path to your User model

// Run this task at midnight (00:00) every day
cron.schedule('0 0 * * *', async () => {
  try {
    console.log("Resetting workout_done for all users...");

    // Update all users' workout_done property to false
    await User.updateMany({}, { workout_done: false });

    console.log("Workout_done reset successfully!");
  } catch (error) {
    console.error("Error resetting workout_done:", error);
  }
});
