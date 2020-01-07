const express = require("express");
const app = express();
app.use(require("body-parser")());
const formidable = require("formidable");
const credentials = require("./credentials.js");
const emailService = require('./lib/email.js')(credentials);

app.use(require("cookie-parser")(credentials.cookieSecret));
app.use(require("express-session")()); //save a user preference that applies across pages
const fortune = require("./lib/fortune.js"); // / signals that it should not look for the module in the node_modules directory

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

app.get("/thank-you", function(req, res) {
  res.render("thank-you");
});

app.get("/newsletter", function(req, res) {
  // we will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render("newsletter", { csrf: "CSRF token goes here" });
});

app.post("/process", function(req, res) {
  if (req.xhr || req.accepts("json,html") === "json") {
    // if there were an error, we would send { error: 'error description' }
    res.send({ success: true });
  } else {
    // if there were an error, we would redirect to an error page
    res.redirect(303, "/thank-you");
  }
});

app.get("/contest/vacation-photo", function(req, res) {
  var now = new Date();
  res.render("contest/vacation-photo", {
    year: now.getFullYear(),
    month: now.getMonth()
  });
});
app.post("/contest/vacation-photo/:year/:month", function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    if (err) return res.redirect(303, "/error");
    console.log("received fields:");
    console.log(fields);
    console.log("received files:");
    console.log(files);
    res.redirect(303, "/thank-you");
  });
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

//cart
const cartValidation = require('./lib/cartValidation.js');

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

app.post('/cart/add', function(req, res, next){
	const cart = req.session.cart || (req.session.cart = { items: [] });
	Product.findOne({ sku: req.body.sku }, function(err, product){
		if(err) return next(err);
		if(!product) return next(new Error('Unknown product SKU: ' + req.body.sku));
		cart.items.push({
			product: product,
			guests: req.body.guests || 0,
		});
		res.redirect(303, '/cart');
	});
});
app.get('/cart', function(req, res, next){
	var cart = req.session.cart;
	if(!cart) next();
	res.render('cart', { cart: cart });
});
app.get('/cart/checkout', function(req, res, next){
	var cart = req.session.cart;
	if(!cart) next();
	res.render('cart-checkout');
});
app.get('/cart/thank-you', function(req, res){
	res.render('cart-thank-you', { cart: req.session.cart });
});
app.get('/email/cart/thank-you', function(req, res){
	res.render('email/cart-thank-you', { cart: req.session.cart, layout: null });
});

app.post("/cart/checkout", function(req, res) {
  var cart = req.session.cart;
  if (!cart) next(new Error("Cart does not exist."));
  var name = req.body.name || "",
    email = req.body.email || "";
  // input validation
  if (!email.match(VALID_EMAIL_REGEX))
    return res.next(new Error("Invalid email address."));
  // assign a random cart ID; normally we would use a database ID here
  cart.number = Math.random()
    .toString()
    .replace(/^0\.0*/, "");
  cart.billing = {
    name: name,
    email: email
  };
  res.render("email/cart-thank-you", { layout: null, cart: cart }, function(
    err,
    html
  ) {
    if (err) console.log("error in email template");
    emailService.send(
      cart.billing.email,
      "Thank you for booking your trip with Meadowlark Travel!",
      html
    );
  });
  res.render("cart-thank-you", { cart: cart });
});

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
