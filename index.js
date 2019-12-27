const express = require("express");
const app = express();
app.use(require("body-parser")());

const fortune = require("./lib/fortune.js"); // /signals that it should not look for the module in the node_modules directory

// set up handlebars view engine
const handlebars = require("express3-handlebars").create({
  defaultLayout: "main"
});
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("port", process.env.PORT || 3000);

//static middleware
app.use(express.static(__dirname + "/public"));

//middleware to detect test=1
app.use(function(req, res, next) {
  res.locals.showTests =
    app.get("env") !== "production" && req.query.test === "1";
  next();
});

//weather middleware
app.use(function(req, res, next) {
  if (!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weather = getWeatherData();
  next();
});

//routes
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/about", function(req, res) {
  res.render("about", {
    fortune: fortune.getFortune(),
    pageTestScript: "/qa/tests-about.js"
  });
});

app.get("/newsletter", function(req, res) {
  // we will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render("newsletter", { csrf: "CSRF token goes here" });
});
app.post("/process", function(req, res) {
  console.log("Form (from querystring): " + req.query.form);
  console.log("CSRF token (from hidden form field): " + req.body._csrf);
  console.log("Name (from visible form field): " + req.body.name);
  console.log("Email (from visible form field): " + req.body.email);
  res.redirect(303, "/thank-you");
});

app.get("/tours/hood-river", function(req, res) {
  res.render("tours/hood-river");
});
app.get("/tours/oregon-coast", function(req, res) {
  res.render("tours/oregon-coast");
});
app.get("/tours/request-group-rate", function(req, res) {
  res.render("tours/request-group-rate");
});

//weather
function getWeatherData() {
  return {
    locations: [
      {
        name: "Portland",
        forecastUrl: "http://www.wunderground.com/US/OR/Portland.html",
        iconUrl: "http://icons-ak.wxug.com/i/c/k/cloudy.gif",
        weather: "Overcast",
        temp: "54.1 F (12.3 C)"
      },
      {
        name: "Bend",
        forecastUrl: "http://www.wunderground.com/US/OR/Bend.html",
        iconUrl: "http://icons-ak.wxug.com/i/c/k/partlycloudy.gif",
        weather: "Partly Cloudy",
        temp: "55.0 F (12.8 C)"
      },
      {
        name: "Manzanita",
        forecastUrl: "http://www.wunderground.com/US/OR/Manzanita.html",
        iconUrl: "http://icons-ak.wxug.com/i/c/k/rain.gif",
        weather: "Light Rain",
        temp: "55.0 F (12.8 C)"
      }
    ]
  };
}

// custom 404 page
app.use(function(req, res) {
  res.status(404);
  res.render("404");
});

// custom 500 page
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

app.listen(app.get("port"), function() {
  console.log(
    "Express started on http://localhost:" +
      app.get("port") +
      "; press Ctrl-C to terminate."
  );
});
