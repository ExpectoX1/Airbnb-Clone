const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { default: mongoose } = require("mongoose");
const UserModel = require("./models/User");
const PlaceModel = require("./models/Place");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "3vrvrvr5gsvt5gws33";

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
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
      const { name, email, _id } = await UserModel.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("Logged Out Successfully");
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

const photosMiddleware = multer({ dest: "uploads/" });
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads\\", ""));
  }
  res.json(uploadedFiles);
});

app.post("/places", (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await PlaceModel.create({
      owner: userData.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  });
});

app.get("/places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await PlaceModel.find({ owner: id }));
  });
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await PlaceModel.findById(id));
});

app.put("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const placeDoc = await PlaceModel.findById(id);
    if (err) throw err;
    if (userData.id === placeDoc.owner.toString()) {
      await placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
      });
      await placeDoc.save();
      res.json("Updated");
    } else {
      res.status(401).json("Unauthorized");
    }
  });
});

app.listen(4000);
