const mongoose = require('mongoose');

const exerciseSchema = mongoose.Schema({
    workoutId: {
        type: mongoose.Schema.ObjectId,
        required: [true, "Please add a workout id"]
    },
    name: {
        type: String,
        trim: true,
        required: [true, "Please add a name"]
    },
    image: {
        type: String
    }
}, {
    timestamps: true
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;