const cron = require('node-cron');
const moment = require('moment'); // For easier date handling
const User = require('../models/userModel'); // Adjust path as necessary
const sendEmail = require('./sendEmail'); // Import the mailer
const Notification = require('../models/notificationModel'); // Adjust path as necessary

// Job to reset workout_done property at the start of each day
cron.schedule('0 0 * * *', async () => {
    try {
        // Set workout_done to false for all users at midnight
        await User.updateMany({}, { workout_done: false });
        console.log('Workout done status reset for all users.');
    } catch (error) {
        console.error("Error resetting workout_done status:", error);
    }
});

// Job to send workout reminders every 30 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        const currentTime = moment(); // Get current time

        // Find users who need reminders
        const usersToRemind = await User.find({
            workout_done: false,
            workoutOngoing: false,
        });

        // Send reminders
        for (const user of usersToRemind) {
            // Parse workout_time string (e.g., "17:00") into a moment object
            const workoutTime = moment(user.workout_time, 'HH:mm'); // Convert workout_time string to moment object

            // If current time is past the workout time, send reminders
            if (currentTime.isAfter(workoutTime)) {
                // Send email reminder
                const subject = "Workout Reminder";
                const message = `Hi ${user.name}, it's time for your workout! Log in to the app now and start your workout.`;
                const send_to = user.email;
                const sent_from = process.env.EMAIL_USER;
                await sendEmail(subject, message, send_to, sent_from);

                // Send in-app notification
                await Notification.create({
                    userId: user._id,
                    message: message
                });
            }
        }

        console.log(`Reminders sent to ${usersToRemind.length} users.`);
    } catch (error) {
        console.error("Error sending reminders:", error);
    }
});