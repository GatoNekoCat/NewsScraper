// Bring in dependencies
var bodyParser = require('body-parser');
var express = require('express');
var exphbs = require('express-handlebars');
var axios = require('axios');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var logger = require('morgan');

// Init express
var app = express();
// load models
var db = require('./models');

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var PORT = 3000;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);
mongoose.Promise = Promise;

app.use("/public", express.static("public"));


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set("view engine", "handlebars");

// Morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));


db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
  });

// routes
app.get("/", function(req,res){
    Article.find({ saved: false }, function(error, data){
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render('home', hbsObject);
    });
});

app.get("/saved", function(req,res){
    Article.find({ saved: true })
    .populate("notes")
    .exec(function(error, articles){
        var hbsObject = {
            article: articles
        };
    });
});

app.get("/scrape", function(req,res) {
    request('https://www.coindesk.com/', function(error, response, html) {
        var $ = cheerio.load(html);

        $('a .stream-article').each(function(i, element){
            var result = {};

            result.title = $(this)
            .attr("title");
            result.summary = $(this)
            .children('p').text();
            result.link = $(this)
            .attr("href");
            // create new entry based on Article model using result built
            var entry = new Article(result);
            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);
                }
            });
        });
        res.send("Scrape Complete");
    });
});


// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });