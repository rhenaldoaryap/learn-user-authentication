const path = require("path");

const express = require("express");
// using express-session
const session = require("express-session");
// using connect-mongodb-session for storing the session
const mongodbStore = require("connect-mongodb-session");

const db = require("./data/database");
const demoRoutes = require("./routes/demo");

// create MongoDBStore object with executing mongodbStore as a function and passing the session package as the parameter
// with that MongoDBStore is actually a Class, a constructor function we can execute to create a new object based on a certain blue prints. And for executing that see at the line 18
const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  // uri basically same as URL
  uri: "mongodb://localhost:27017",
  databaseName: "auth-demo",
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "super-secret",
    // only update the session if the data really change, so we set it to false
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

app.use(demoRoutes);

app.use(function (error, req, res, next) {
  res.render("500");
});

db.connectToDatabase().then(function () {
  app.listen(3000);
});
