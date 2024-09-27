const express = require('express');
const { startWorkout, startExercise, logSet, workoutHistory, getExercises, stopWorkout } = require('../controllers/workoutController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/startworkout", protect, startWorkout);
router.post("/startexercise", protect, startExercise);
router.post("/logset", protect, logSet);
router.get("/workouthistory", protect, workoutHistory);
router.get("/:workoutId", protect, getExercises);
router.post("/stopworkout", protect, stopWorkout);

module.exports = router;