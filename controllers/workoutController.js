const protect = require('../middleware/errorMiddleware');
const Workout = require('../models/workoutModel');
const Exercise = require('../models/exerciseModel');
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
    const { workout_id, exerciseName, image } = req.body;

    if (!workout_id || !exerciseName) {
        res.status(400);
        throw new Error("Could not start exercise");
    }

    const workout = await Workout.findById(workout_id);

    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }

    if (!workout._id.equals(req.user._id)) {
        res.status(401);
        throw new Error("User not authorized");
    }

    const exercise = await Exercise.create({
        workoutId: workout_id,
        name: exerciseName,
        image: image
    });

    if (!exercise) {
        res.status(400);
        throw new Error("Could not start exercise");
    }

    res.status(201).json({
        message: "Successfully started exercise",
        exercise: {
            id: exercise._id,
            workoutId: exercise.workoutId,
            name: exercise.name,
            image: exercise.image
        }
    });
});

module.exports = {
    startWorkout,
    startExercise
};