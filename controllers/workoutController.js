const protect = require('../middleware/errorMiddleware');
const Workout = require('../models/workoutModel');
const Exercise = require('../models/exerciseModel');
const Set = require('../models/setModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

function getTimeDifferenceInHours(startTime, endTime) {
    // Parse time strings into Date objects
    const start = new Date(`1970-01-01T${startTime}:00Z`);
    const end = new Date(`1970-01-01T${endTime}:00Z`);
    
    // Calculate the difference in milliseconds
    const diffInMs = end - start;

    // Convert milliseconds to hours (1 hour = 3600000 milliseconds)
    const diffInHours = diffInMs / (1000 * 60 * 60);

    return diffInHours;
};

const startWorkout = asyncHandler(async(req, res) => {
    const { workout_name } = req.body;

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.workoutOngoing = true;

    await user.save();

    const workout = await Workout.create({
        userId,
        name: workout_name,
        date: new Date(),
        beginning_time: new Date().toLocaleTimeString()
    });

    if (!workout) {
        res.status(400);
        throw new Error("Could not start workout, please try again");
    }



    res.status(201).json({
        id: workout._id,
        userId: workout.userId,
        workout_name: workout.name,
        date: workout.date,
        beginning_time: workout.beginning_time
    });
});

const stopWorkout = asyncHandler(async(req, res) => {
    const { workout_id } = req.body;

    const workout = await Workout.findById(workout_id);

    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }

    if (!workout.userId.equals(req.user._id)) {
        res.status(401);
        throw new Error("User not authorized");
    }

    const exercises = await Exercise.find({
        workoutId: workout_id,
        setLogged: true
    });

    const user = await User.findById(workout.userId);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (exercises.length <= 0) {
        await Workout.deleteOne({_id: workout_id});
        user.workoutOngoing = false;
        res.status(200).json({message: "Successfully stopped workout, 0 exercises completed"});
        return;
    }

    if (workout.onGoing === false) {
        res.status(400);
        throw new Error("Workout has already been stopped");
    }

    workout.onGoing = false;

    workout.ending_time = new Date().toLocaleTimeString();

    workout.duration = new Date() - workout.date;

    await workout.save();



    user.workouts_completed += 1;

    user.workout_done = true;

    user.workoutOngoing = false;

    const d = new Date();

    if (user.last_completed_workout && user.last_completed_workout.getFullYear() === d.getFullYear && user.last_completed_workout.getMonth() === d.getMonth() && user.last_completed_workout.getDate() + 1 === d.getDate()) {
        user.workout_streak += 1;
    } else {
        user.workout_streak = 1;
    }

    await user.save();

    res.status(200).json({
        message: "Successfully stopped workout",
        workout
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

    exercise.setLogged = true;

    workout.exerciseLogged = true;

    await exercise.save();

    await workout.save();

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
        userId,
        exerciseLogged: true
    }).sort({ createdAt: 1 }).sort({ createdAt: 1 });

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
        }).sort({ createdAt: 1 });

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

    res.status(200).json({
        workout: workout,
        exercises: modifiedExercises
    });
});

const progressCharts = asyncHandler(async (req, res) => {
    const streak = req.user.workout_streak;
    const workoutsCompleted = req.user.workouts_completed;

    const now = new Date();

    // Start of the week (assuming Monday is the first day of the week)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday of this week
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6)); // Sunday of this week

    // Ensure time is set to the start of the day for `startOfWeek`
    startOfWeek.setHours(0, 0, 0, 0);
    // Ensure time is set to the end of the day for `endOfWeek`
    endOfWeek.setHours(23, 59, 59, 999);

    const workoutsThisWeek = await Workout.find({
        date: {
            $gte: startOfWeek,
            $lte: endOfWeek
        },
        onGoing: false // Ensure the workout is completed
    });

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);  // First day of the month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the month

    const workoutsThisMonth = await Workout.find({
        date: {
            $gte: startOfMonth,
            $lte: endOfMonth
        },
        onGoing: false  // Ensure the workout is completed
    });

    const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st
    startOfYear.setHours(0, 0, 0, 0); // Set time to start of the day

    const endOfYear = new Date(now.getFullYear(), 11, 31); // December 31st
    endOfYear.setHours(23, 59, 59, 999); // Set time to end of the day

    const workoutsThisYear = await Workout.find({
        date: {
            $gte: startOfYear,
            $lte: endOfYear
        },
        onGoing: false // Ensure the workout is completed
    });

    let timeThisWeek = 0;
    let timeThisMonth = 0;
    let timeThisYear = 0;

    const totalWorkoutsThisWeek = workoutsThisWeek.length; // To calculate average time
    const totalDurationThisWeek = []; // Store durations to calculate average

    // Array to hold time spent for each day of the week
    const dailyTimeSpent = Array(7).fill(0); // Initialize array for 7 days

    // Calculate time spent for this week
    for (const workout of workoutsThisWeek) {
        const durationInHours = workout.duration / (1000 * 60 * 60); // Convert milliseconds to hours
        timeThisWeek += durationInHours;
        totalDurationThisWeek.push(durationInHours);
        
        // Determine which day of the week the workout was done (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const workoutDate = new Date(workout.date); // Ensure it's a Date object
        const dayOfWeek = workoutDate.getDay();
        
        // Add the duration to the corresponding day
        dailyTimeSpent[dayOfWeek] += durationInHours;
    }
    
    // Calculate time spent for this month
    for (const workout of workoutsThisMonth) {
        const durationInHours = workout.duration / (1000 * 60 * 60); // Convert milliseconds to hours
        timeThisMonth += durationInHours;
    }
    
    // Calculate time spent for this year
    for (const workout of workoutsThisYear) {
        const durationInHours = workout.duration / (1000 * 60 * 60); // Convert milliseconds to hours
        timeThisYear += durationInHours;
    }

    // Calculate average time spent per workout for this week
    const averageTimeThisWeek = totalWorkoutsThisWeek ? 
        (totalDurationThisWeek.reduce((a, b) => a + b, 0) / totalWorkoutsThisWeek) : 0;

    res.status(200).json({
        streak,
        thisWeek: {
            workoutsCompleted: totalWorkoutsThisWeek,
            totalTimeSpent: timeThisWeek,
            averageTimeSpent: averageTimeThisWeek, // Include average time spent per workout
            dailyTimeSpent // Include daily time spent array
        },
        thisMonth: {
            workoutsCompleted: workoutsThisMonth.length,
            timeSpent: timeThisMonth
        },
        thisYear: {
            workoutsCompleted: workoutsThisYear.length,
            timeSpent: timeThisYear
        }
    });
});






const getWorkoutStatus = asyncHandler(async(req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        workoutOngoing: user.workoutOngoing
    });
})

module.exports = {
    startWorkout,
    startExercise,
    stopWorkout,
    logSet,
    workoutHistory,
    progressCharts,
    getExercises,
    getWorkoutStatus
};