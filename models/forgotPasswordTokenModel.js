const mongoose = require('mongoose');

const forgotPasswordTokenSchema = mongoose.Schema({
    userId : {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "user"
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

const ForgotPasswordToken = mongoose.model("Forgot-Token", forgotPasswordTokenSchema);

module.exports = ForgotPasswordToken;