'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const districtCodeSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    code: {
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

const GeoentitySubjectCode =  mongoose.model('GeoentitySubjectCode', districtCodeSchema);

module.exports = GeoentitySubjectCode;