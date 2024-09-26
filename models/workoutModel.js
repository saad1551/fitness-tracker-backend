const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const workoutSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        required: [true, "Please add a user id"]
    },
    name: {
        type: String,
        trim: true,
        required: [true, "Please add a name"]
    },
    date: {
        type: String,
        trim: true,
        required: [true, "Please add a date"]
    },
    beginning_time: {
        type: String,
        trim: true,
        required: [true, "Please add a beginning time"]
    },
    ending_time: {
        type: String,
        trim: true
    },
    onGoing: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;