const User = require('../models/userModel');
const Token = require('../models/tokenModel');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const ForgotPasswordToken = require('../models/forgotPasswordTokenModel');
const bcrypt = require('bcrypt')

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1d'});
};

const registerUser = asyncHandler(async(req, res) => {
    const {name, email, password} = req.body;

    // Validation
    if (!name || !email || !password) {
        res.status(400)
        throw new Error("Please fill in all required fields");
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must at least be 6 characters");
    }

    // Check if user email already exists
    const existingUser = await User.findOne({email});

    if (existingUser) {
        if (!existingUser.verified) {
            const {_id, name, email, verified} = existingUser

            await Token.deleteMany({userId: existingUser._id});

            const token = crypto.randomBytes(32).toString("hex") + existingUser._id;        
            // Hash token before saving to db
            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

            const emailVerificationToken = await Token.create({
                userId: existingUser._id,
                token: hashedToken,
                createdAt: Date.now(),
                expiresAt: Date.now() + 30 * (60 * 1000)
            });

            if (!emailVerificationToken) {
                res.status(400);
                throw new Error("Something went wrong, please try again");
            }

            // Construct Reset URL
            const verificationUrl = `${process.env.FRONTEND_URL}/verifyEmail/${token}`;

            // Verification email
            const message = `
            <h2>Hello ${existingUser.name}</h2>
            <p>Please use the link below to verify your 
            email and activate your account</p>
            <p>This link is valid for only 30 minutes</p>

            <a href=${verificationUrl} clicktracking=off>${verificationUrl}</a>

            <p>Regards...</p>
            <p>${process.env.APP_NAME} team</p>
            `;
            const subject = "Email Verification";
            const send_to = existingUser.email;
            const sent_from = process.env.EMAIL_USER;

            await sendEmail(subject, message, send_to, sent_from);

            return res.status(200).json({
                _id, name, email, verified
            })
        }
        res.status(400);
        throw new Error("Email has already been used");
    }


    // Create new user
    const user = await User.create({
        name,
        email,
        password,
        verified: false
    });

    if (user) {
        const {_id, name, email, verified} = user

        await Token.deleteMany({userId: _id});

        const token = crypto.randomBytes(32).toString("hex") + user._id;        
        // Hash token before saving to db
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const emailVerificationToken = await Token.create({
            userId: _id,
            token: hashedToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * (60 * 1000)
        });

        if (!emailVerificationToken) {
            res.status(400);
            throw new Error("Something went wrong, please try again");
        }

        // Construct Reset URL
        const verificationUrl = `${process.env.FRONTEND_URL}/verifyEmail/${token}`;

        // Verification email
        const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the link below to verify your 
        email and activate your account</p>
        <p>This link is valid for only 30 minutes</p>

        <a href=${verificationUrl} clicktracking=off>${verificationUrl}</a>

        <p>Regards...</p>
        <p>${process.env.APP_NAME} team</p>
        `;
        const subject = "Email Verification";
        const send_to = user.email;
        const sent_from = process.env.EMAIL_USER;

        await sendEmail(subject, message, send_to, sent_from);

        res.status(201).json({
            _id, name, email, verified
        })
    } else {
        res.status(400)
        throw new Error("Something went wrong, please try again");
    }
});

const verifyUser = asyncHandler(async(req, res) => {
    const token = req.params.verificationToken;

    // Hash token before saving to db
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const emailVerificationToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()},
    });

    if (!emailVerificationToken) {
        res.status(404);
        throw new Error("Verification token either invalid or expired, please try again with a different token or register again");
    }

    const user = await User.findOne({ _id: emailVerificationToken.userId });

    if (!user) {
        res.status(404);
        throw new Error("User not found, please register");
    }

    user.verified = true;

    await user.save();

    //Generate Token
    const jsonwebtoken = generateToken(user._id);

    // Send HTTP-only cookie 
    res.cookie("token", jsonwebtoken, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true
    });

    await Token.deleteMany({
        userId: user._id
    });

    res.status(200).json({message: "Successfully verified email, please complete your registration" });
});

const completeRegistration = asyncHandler(async(req,res) => {
    const { phone, age, workout_time } = req.body;

    const userId = req.user._id;

    if (!phone || !age || !workout_time) {
        res.status(400);
        throw new Error("Please enter all fields");
    }

    const user = await User.findById(userId);

    if (!user) {
        res.status(400);
        throw new Error("User not found, please register");
    }

    user.phone = phone;
    user.age = age;
    user.workout_time = workout_time;

    console.log("saving user");

    await user.save();

    console.log("user saved");

    res.status(200).json({message: "Registration completed successfully"});
});

const forgotPassword = asyncHandler(async(req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error("Email is required to reset your password");
    }

    const user = await User.findOne({email});

    if (!user) {
        res.status(404);
        throw new Error("User not found, please register");
    }

    let token = crypto.randomBytes(32).toString("hex") + user._id;
    
    // Hash token before saving to db
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const forgotPasswordToken = await ForgotPasswordToken.create({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000)
    });

    if (!forgotPasswordToken) {
        res.status(500);
        throw new Error("Something went wrong, please try again later");
    }

    // Construct Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${token}`;

        // Reset email
        const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please the url below to reset your 
        password</p>
        <p>This reset link is valid for only 30 minutes</p>

        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

        <p>Regards...</p>
        <p>${process.env.APP_NAME} Team</p>
    `;
    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendEmail(subject, message, send_to, sent_from);
        res.status(200).json({success: true, message: "Reset email sent"});
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }
})

const resetPassword = asyncHandler(async(req, res) => {
    const {password} = req.body;
    const {resetToken} = req.params;

    // Hash token, then compare with the token in the database
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // find token in db
    const forgotPasswordToken = await ForgotPasswordToken.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
    });

    if (!forgotPasswordToken) {
        res.status(404);
        throw new Error("Invalid or expired token");
    }

    // Find user
    const user = await User.findOne({_id: forgotPasswordToken.userId});
    user.password = password;
    await user.save();
    res.status(200).json({message: "Password reset successful, please login"});
});

// Login User
const loginUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body;

    // Validate request
    if (!email || !password) {
        res.status(400);
        throw new Error("Please add email and password");
    }

    // Check if user exists
    const user = await User.findOne({email});

    if (!user) {
        res.status(400);
        throw new Error("User not found. Please sign up.");
    }

    // User exists, now check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    const token = generateToken(user._id);
    
    // Send HTTP-only cookie 
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true
    });

    if (user && passwordIsCorrect) {
        const {_id, name, email, workout_done, verified, age, phone, workout_time} = user
        res.status(200).json({
            message: "Successfully logged in", 
            user: {
                _id, name, email, workout_done, verified, age, phone, workout_time
            }
        })
    } else {
        res.status(400);
        throw new Error("Invalid email and/or password");
    }
});

// Logout User
const logout = asyncHandler(async (req, res) => {
    res.cookie("token", '', {
        path: "/",
        httpOnly: true,
        expires: new Date(0), // 1 day
        sameSite: "none",
        secure: true
    });
    res.status(200).json({ message: "Successfully logged out" })
});

// Get login status
const loginStatus = asyncHandler(async(req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json(false);
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    const userId = verified.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (verified) {
        return res.json({
            loggedIn: true,
            user
        });
    } else {
        return res.json({
            loggedIn: false
        });
    }
});

// Update User 
const updateProfile = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const {name, email, age, phone, workout_time} = user
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.age = req.body.age || age;
        user.workout_time = req.body.workout_time || workout_time;

        const updatedUser = await user.save();
        res.status(200).json({
            _id: updatedUser._id, 
            name: updatedUser.name, 
            email: updatedUser.email, 
            age: updatedUser.age, 
            phone: updatedUser.phone, 
            workout_time: updatedUser.workout_time
        })
    } else {
        res.status(404)
        throw new Error("User not found");
    }
});

const getUserProfile = asyncHandler(async(req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json(false);
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    const userId = verified.id;

    const user = await User.findById(userId).select("-password");

    if (user) {
        res.status(200).json(user);
    }
})

module.exports = {
    registerUser,
    verifyUser,
    completeRegistration,
    forgotPassword,
    resetPassword,
    loginUser,
    logout,
    loginStatus,
    updateProfile,
    getUserProfile
};