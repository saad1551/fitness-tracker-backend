const express = require('express');
const { registerUser, verifyUser, completeRegistration, forgotPassword, resetPassword, loginUser, logout, loginStatus, updateProfile, getUserProfile } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/loggedin", loginStatus);
router.get("/verifyEmail/:verificationToken", verifyUser);
router.post("/completeregistration", protect, completeRegistration);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword/:resetToken", resetPassword);
router.post("/updateprofile", protect, updateProfile);
router.get("/getuserprofile", protect, getUserProfile);


module.exports = router;