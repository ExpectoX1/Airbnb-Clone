const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { default: mongoose } = require("mongoose");
const UserModel = require("./models/User");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "3vrvrvr5gsvt5gws33";

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: "http://127.0.0.1:5173",
  })
);

console.log("Trying MongoDB Connection...");
mongoose.connect(process.env.MONGO_URL);
console.log("MongoDB Connected Successfully");

app.get("/test", (req, res) => {
  res.json("Hello World");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userDoc = await UserModel.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.json(userDoc);

    console.log(name, "Registered Successfully"); //Console log
  } catch (e) {
    res.status(422).json(e);
    console.log("Error");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const UserDoc = await UserModel.findOne({ email });
  if (UserDoc) {
    console.log("Found User", UserDoc.name);
    const passOK = bcrypt.compareSync(password, UserDoc.password);
    console.log(passOK);
    if (passOK) {
      jwt.sign(
        { email: UserDoc.email, id: UserDoc._id },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(UserDoc);
        }
      );
    } else {
      res.status(422).json("passNotOK");
    }
  } else {
    res.json("Not Found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const {name,email,_id} = await UserModel.findById(userData.id);
      res.json({name,email,_id});
    });
  } else {
    res.json(null);
  }
});

app.listen(4000);
