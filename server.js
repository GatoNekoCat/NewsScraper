// Bring in dependencies
var bodyParser = require('body-parser');
var express = require('express');
var exphbs = require('express-handlebars');
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


app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set("view engine", "handlebars");

// Morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// routes
app.get("/", function (req, res) {
    Article.find({ saved: false }, function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render('home', hbsObject);
    });
});

app.get("/saved", function (req, res) {
    Article.find({ saved: true })
        .populate("notes")
        .exec(function (error, articles) {
            var hbsObject = {
                article: articles
            };
        });
});

app.get("/scrape", function (req, res) {
    request('https://www.coindesk.com/', function (error, response, html) {
        var $ = cheerio.load(html);

        $('a .stream-article').each(function (i, element) {
            var result = {};

            result.title = $(this)
                .attr("title");
            result.summary = $(this)
                .children('p').text();
            result.link = $(this)
                .attr("href");
            // create new entry based on Article model using result built
            var entry = new Article(result);
            entry.save(function (err, doc) {
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

app.get("/articles", function (req, res) {
    Article.find({}, function (error, doc) {
        if (error) {
            console.log(error);
        } else {
            res.json(doc);
        }
    });
});
app.get("/articles/:id", function (req, res) {
    Article.findOne({ _id: req.params.id })
        .populate("note")
        .exec(function (error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.json(doc);
            }
        });
});
app.post("/articles/save/:id", function (req, res) {
    Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })
        .exec(function (err, doc) {
            if (err) {
                console.log(error);
            } else {
                res.send(doc);
            }
        });
});

app.post("/articles/delete/:id", function (req, res) {
    Article.findOneAndUpdate({ _id: req.params.id }, { saved: false, notes: [] })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc);
            }
        });
});
app.post("notes/save/:id", function (req, res) {
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body);
    newNote.save(function (error, note) {
        if (error) {
            console.log(error);
        } else {
            Article.findOneandUpdate(
                { _id: req.params.id },
                { $push: { notes: note } })
                .exec(function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(note);
                    }
                });
        }
    });
});

app.delete("/notes/delete/:note_id/:article_id", function(req,res){
    Note.findOneAndRemove({ _id: req.params.note_id }, function(err){
        if (err){
            console.log(err);
            res.send(err);
        } else {
            res.send("Not Deleted");
        }
    });
});
// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});