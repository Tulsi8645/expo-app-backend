import express from "express";
import cors from "cors";
import "dotenv/config";
const app = express();
const PORT=process.env.PORT || 3001;

import { connectDB } from "./lib/db.js";

app.use(express.json());
app.use(cors());


app.get("/", (req, res) => {
    res.status(200).json({msg: "Bookworm Api is running"})
})

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connectDB();
});