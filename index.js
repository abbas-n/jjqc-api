const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT;
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());

app.use(cors({ origin: ["http://localhost:3000","https://jjqc.ir","http://jjqc.ir","https://hrdc.ir","http://192.168.1.73:3000","http://192.168.1.233:3000"],credentials: true}));

app.use(express.json());
app.use("/auth", require("./routes/authRoutes"));
app.use("/data", require("./routes/dataRoutes"));
app.use("/exam", require("./routes/examRoutes"));
app.use("/education", require("./routes/educationRoutes"));
app.use("/openAI", require("./routes/openAIRoutes"));
app.use("/public", require("./routes/publicRoutes"));
app.use(errorHandler); 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});