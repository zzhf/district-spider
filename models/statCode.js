'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const statCodeSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    statcode: {
        type: String,
        index: true,
        unqiue: true
    },
    sequencestart: {
        type: Date,
        default: Date.now
    },
    sequenceupdate: {
        type: Date,
        default: Date.now
    },
    sequenceend: {
        type: Date,
        default: null
    },
    sequencestate: {
        type: Number,
        default: 1
    },
    orderindex: {
        type: Number,
        default: 0
    },
    descinfo: {
        type: String,
        default: ''
    }
})

const GeoentityStatCode =  mongoose.model('GeoentityStatCode', statCodeSchema);

module.exports = GeoentityStatCode;