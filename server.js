const express = require('express');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorMiddleware');
const userRouter = require('./routes/userRoute');

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Home Page");
});



app.use("/api/users", userRouter);

app.use(errorHandler);

const PORT = 5000;

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