const express = require('express');
const userRouter = require('./routes/userRoute')

const app = express();

app.get("/", (req, res) => {
    res.send("Home Page");
});

app.use("/api/users", userRouter);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`)
});