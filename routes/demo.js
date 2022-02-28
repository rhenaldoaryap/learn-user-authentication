const express = require("express");
// using bcryptjs for hashing password
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  res.render("signup");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  // accessing form element.
  const enteredEmail = userData.email;
  // accessing with another way (not using dot notation) because confirm-email have a dash (-).
  // dash is not allowed to be a property inside of an object.
  const enteredConfirmEmail = userData["confirm-email"];
  const enteredPassword = userData.password;

  // second parameter represent how strong we want to secured the password and can't be decoded.
  // hash return a promise so we have to await
  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredEmail,
    password: hashedPassword,
  };

  console.log(user);

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {});

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.post("/logout", function (req, res) {});

module.exports = router;
