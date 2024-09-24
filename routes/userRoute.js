const express = require('express');
const { registerUser, verifyUser, completeRegistration } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');


const router = express.Router();

router.post("/register", registerUser);
router.get("/verifyEmail/:verificationToken", verifyUser);
router.post("/completeRegistration", protect, completeRegistration);

module.exports = router;