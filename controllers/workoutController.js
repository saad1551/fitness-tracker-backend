const protect = require('../middleware/errorMiddleware');
const Workout = require('../models/workoutModel');
const asyncHandler = require('express-async-handler');

const startWorkout = asyncHandler(async(req, res) => {
    const { workout_name } = req.body;

    const userId = req.user._id;

    const workout = await Workout.create({
        userId,
        name: workout_name,
        date: new Date().toLocaleDateString(),
        beginning_time: new Date().toLocaleTimeString()
    });

    if (!workout) {
        res.status(400);
        throw new Error("Could not start workout, please try again");
    }

    res.status(201).json({
        userId: workout.userId,
        workout_name: workout.name,
        date: workout.date,
        beginning_time: workout.beginning_time
    });
});

const startExercise = asyncHandler(async(req, res) => {
    res.send("exercise started");
});

module.exports = {
    startWorkout,
    startExercise
};