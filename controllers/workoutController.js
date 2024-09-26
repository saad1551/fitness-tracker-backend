const protect = require('../middleware/errorMiddleware');
const Workout = require('../models/workoutModel');
const Exercise = require('../models/exerciseModel');
const Set = require('../models/setModel');
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

    if (!workout.userId.equals(req.user._id)) {
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

const logSet = asyncHandler(async(req, res) => {
    const { exercise_id, weight, reps, timeTaken } = req.body;

    if (!exercise_id || !weight || !reps || !timeTaken) {
        res.status(400);
        throw new Error("Incomplete information");
    }

    const exercise = await Exercise.findById(exercise_id);

    if (!exercise) {
        res.status(404);
        throw new Error("Exercise not found");
    }

    const workout = await Workout.findById(exercise.workoutId);

    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }

    if (!workout.userId.equals(req.user._id)) {
        res.status(401);
        throw new Error("User not authorized");
    }

    const set = await Set.create({
        exerciseId: exercise_id,
        weight,
        reps,
        timeTaken
    });

    if (!set) {
        res.status(400);
        throw new Error("Could not log set");
    }

    res.status(201).json({
        message: "Successfully logged set",
        set: {
            id: set._id,
            exercise_id: exercise._id,
            weight: set.weight,
            reps: set.reps,
            timeTaken: set.timeTaken
        }
    });
});

const workoutHistory = asyncHandler(async(req, res) => {
    const userId = req.user._id;

    const workouts = await Workout.find({
        userId
    });

    if (workouts.length <= 0) {
        res.status(404);
        throw new Error("No workouts found");
    }

    // Prepare an array to store the modified workouts
    const modifiedWorkouts = [];

    for (let workout of workouts) {
        const workoutId = workout._id;

        // Fetch the exercises related to this workout
        const exercises = await Exercise.find({
            workoutId: workoutId
        });

        // Convert the workout document to a plain JavaScript object
        const workoutObj = workout.toObject();

        // Add the exercisesCompleted property to the plain object
        workoutObj.exercisesCompleted = exercises.length;

        // Push the modified workout into the array
        modifiedWorkouts.push(workoutObj);
    }

    res.send(modifiedWorkouts);
});

const getExercises = asyncHandler(async(req, res) => {
    const { workoutId } = req.params;

    const workout = await Workout.findById(workoutId);

    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }

    const exercises = await Exercise.find({
        workoutId
    });

    if (exercises.length <= 0) {
        res.status(404);
        throw new Error("No exercises found");
    }

    const modifiedExercises = [];

    for (const exercise of exercises) {
        const exerciseId = exercise._id;

        const sets = await Set.find({
            exerciseId
        });

        const exerciseObj = exercise.toObject();

        exerciseObj.sets = sets;

        modifiedExercises.push(exerciseObj);
    }

    res.send(modifiedExercises);
});

module.exports = {
    startWorkout,
    startExercise,
    logSet,
    workoutHistory,
    getExercises
};