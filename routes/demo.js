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

// start signup page
router.post("/signup", async function (req, res) {
  const userData = req.body;
  // accessing form element.
  const enteredEmail = userData.email;
  // accessing with another way (not using dot notation) because confirm-email have a dash (-).
  // dash is not allowed to be a property inside of an object.
  const enteredConfirmEmail = userData["confirm-email"];
  const enteredPassword = userData.password;

  // logic for checking the email, confirm email, and password are valid or not.
  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim() < 6 ||
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes("@") ||
    !enteredConfirmEmail.includes("@")
  ) {
    console.log("Incorret data occurred");
    return res.redirect("/signup");
  }
  // end of logic check

  // checking for existing email does not allowed to register again
  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (existingUser) {
    console.log("User already exists");
    return res.redirect("/signup");
  }

  // second parameter represent how strong we want to secured the password and can't be decoded.
  // hash return a promise so we have to await
  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredEmail,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});
// end of signup page

// start login page
router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  // check email
  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (!existingUser) {
    return res.redirect("/login");
  }
  // end of check email

  // check password that hashed by bcrypt
  // compare function return a promise
  const passwordsAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  );

  if (!passwordsAreEqual) {
    return res.redirect("/login");
  }
  // end of check password

  // start adding session is user login sucessfully
  req.session.user = { id: existingUser._id, email: existingUser.email };
  // below is optional flag we can add for adding more data
  req.session.isAuthenticated = true;
  // make sure this session written in database (by default that will be)
  // but that will be danger if we already direct user to the admin page BEFORE the session is updated in the database
  // that will make user couldn't access the admin page although user has a valid credential for accessing the admin page
  // storing something to database will take a time that might be a milisecond of second, in conclusion written to database will be asynchronous
  req.session.save(function () {
    res.redirect("/admin");
  });
  // end of adding session
});
// end of login page

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.post("/logout", function (req, res) {});

module.exports = router;
