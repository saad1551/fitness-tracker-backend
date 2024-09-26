const express = require('express');
const { startWorkout, startExercise, logSet } = require('../controllers/workoutController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/startworkout", protect, startWorkout);
router.post("/startexercise", protect, startExercise);
router.post("/logset", protect, logSet);

module.exports = router;