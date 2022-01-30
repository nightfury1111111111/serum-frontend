const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema(
    {
        userWallet:{
            type: String,
            required: true
        },
        tmpWallet:{
            type:String,
            required: true
        }
    }
)

module.exports = mongoose.model('User', UserSchema)