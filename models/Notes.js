var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var NoteSchema = new Schema({
     id: {
         type: String,
         unique: true
     }, 
     name: {
         type: String
     },
     body: {
         type: String,
         required: "Message is required"         
     }
});

var Notes = mongoose.model("Note", NoteSchema);

module.exports = Notes;