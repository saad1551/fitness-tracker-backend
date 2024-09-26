const mongoose = require('mongoose');

const setSchema = mongoose.Schema({
    exerciseId: {
        type: mongoose.Schema.ObjectId,
        required: [true, "Please add a workout id"]
    },
    weight: {
        type: String,
        trim: true,
        required: [true, "Please add a weight"]
    },
    reps: {
        type: String,
        trim: true,
    },
    timeTaken: {
        type: String,
        required: [true, "Please add the time taken to complete the set"]
    }
}, {
    timestamps: true
});

const Set = mongoose.model("Set", setSchema);

module.exports = Set;