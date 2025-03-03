const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    transaction_id: String,
    date_close: Date,
    sum: Number,
    client_id: String,
    client_phone: String,
    client_lastname: String,
    payment_method_id: Number,
    history: Array
});

module.exports = mongoose.model('Receipt', receiptSchema);
