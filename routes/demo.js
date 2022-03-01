const express = require("express");
// using bcryptjs for hashing password
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  // using inputData field as a key for storing the temporary value
  let sessionInputData = req.session.inputData;

  // checking user for the first time visiting signup page (include after visiting another page) so we set any values to empty initial states
  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      confirmEmail: "",
      password: "",
    };
  }

  // cleaning the session after user submit the valid data
  req.session.inputData = null;

  res.render("signup", { inputData: sessionInputData });
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
    // storing temporary value from user using session to preventing user re-type all of the values
    // inputData is name field, for name of that field, we can give any name we want, because that just a field that will create automatically for us
    req.session.inputData = {
      hasError: true,
      message: "Invalid input - please check your data.",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    // saving the temporary value in session collection
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
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
  // storing something to database will take a time that might be a milisecond or second, in conclusion written to database will be asynchronous that is why we using callback (the anonymous function)
  req.session.save(function () {
    res.redirect("/admin");
  });
  // end of adding session
});
// end of login page

router.get("/admin", function (req, res) {
  // start check whether user has a valid "ticket" for accessing protect page
  if (!req.session.isAuthenticated) {
    // alternative if we not storing optional flag if (!req.session.user)
    return res.status(401).render("401");
  }
  res.render("admin");
});

router.post("/logout", function (req, res) {
  // cleaning the user session
  req.session.user = null;
  req.session.isAuthenticated = false;

  res.redirect("/");
});

module.exports = router;
