var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileSchema = new Schema({
    filename: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    category: {
        type: String,
    },
    imageData: {
        data: Buffer, // Store binary image data
        contentType: String // Store content type (e.g., 'image/jpeg', 'image/png')
    }
});

module.exports = mongoose.model('File', fileSchema);

