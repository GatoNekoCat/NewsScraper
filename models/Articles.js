var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ArticleSchema = new Schema({
    id: {
        type: String,
        require: true,
        unique: true
    },
    title: {
        type: String,
        require: true
    },
    link: {
        type: String,
        require: true
    },
    note: {
        type: Schema.Types.ObjectId,
        ref: "Notes",
    }
});

var Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;