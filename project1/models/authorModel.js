const mongoose = require ('mongoose');

const authorSchema = new mongoose.Schema({
    fname:{
        type: String,
        required: 'First name is required',
        trim : true
    },
    lname:{
        type: String,
        required: 'Last name is required',
        trim: true
    },
    title:{
        type: String,
    required: true,
        enum: ["Mr","Mrs","Miss"],
        trim: true
    },
    email:{
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        required: 'email should be present',
        validate:{
            validator: function (email) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
            }, message: 'Please fill a valid email address', isAsync: false
        },
    },
    password:{
        type: String,
        trim: true,
        required: 'Password is required'
           }
    }, {timestamps:true});
    
    module.exports = mongoose.model('Authors',authorSchema)
