const express = require('express');
const { startWorkout, startExercise, logSet, workoutHistory, getExercises, stopWorkout, progressCharts, getWorkoutStatus } = require('../controllers/workoutController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/startworkout", protect, startWorkout);
router.post("/startexercise", protect, startExercise);
router.post("/logset", protect, logSet);
router.get("/workouthistory", protect, workoutHistory);
router.post("/stopworkout", protect, stopWorkout);
router.get("/progresscharts", protect, progressCharts);
router.get("/workoutstatus", protect, getWorkoutStatus);
router.get("/:workoutId", protect, getExercises);


module.exports = router;