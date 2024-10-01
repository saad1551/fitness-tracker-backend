const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorMiddleware');
const userRouter = require('./routes/userRoute');
const workoutRouter = require('./routes/workoutRoute');
const cronJobs = require('./utils/cronJobs');

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',  // Allow requests from this origin
    credentials: true                 // Enable sending cookies and credentials
  }));

app.get("/", (req, res) => {
    res.send("Home Page");
});



app.use("/api/users", userRouter);
app.use("/api/workouts", workoutRouter);

app.use(errorHandler);

const PORT = process.env.PORT;

// connect to MongoDB and start server
mongoose
    .connect(
        process.env.MONGO_URI
    ).then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch((err) => {
        console.log(err);
    });