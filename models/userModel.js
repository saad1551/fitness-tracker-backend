const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"]
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email"
        ]
    },
    password: {
        type: String,
        required: [true, "Please add a password"],
        minLength: [6, "Password must be at least 6 characters"],
        // maxLength: [23, "Password must be a maximum of 23 characters"]
    },
    phone: {
        type: String,
        trim: true,
        match : [/^\d{4}-\d{7}$/, "Please enter a valid phone number"]
    },
    age: {
        type: Number,
        trim: true
    },
    workout_time: {
        type: String,
        trim: true
    },
    workout_done: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    workouts_completed: {
        type: Number,
        default: 0
    },
    workout_streak: {
        type: Number,
        default: 0
    },
    last_completed_workout: {
        type: Date
    }
}, {
    timestamps: true
});

// Encrypt password before saving to db
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;