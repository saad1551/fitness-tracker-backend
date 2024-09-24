const User = require('../models/userModel');
const Token = require('../models/tokenModel');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1d'});
};

const registerUser = async(req, res) => {
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
    const userExists = await User.findOne({email});

    if (userExists) {
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

        await Token.deleteOne({userId: _id});

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
};

const verifyUser = asyncHandler(async(req, res) => {
    const token = req.params.verificationToken;

    // Hash token before saving to db
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const emailVerificationToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
    });

    if (!emailVerificationToken) {
        res.status(404);
        throw new Error("Invalid or Expired token");
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

    res.status(200).json({message: "Successfully verified email" });
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

module.exports = {
    registerUser,
    verifyUser,
    completeRegistration
};