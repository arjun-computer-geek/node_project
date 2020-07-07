const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { strict } = require('assert');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true[true, 'Enter Your Name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'A User must have an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please Enter a valid Email']

    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin' ],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please Enter a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please Confirm Your Password'],
        minlength: 8,
        validate: {
            validator: function(el) {
                return el === this.password;
            }
        },
        message: 'Password are not same'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date

});

userSchema.pre('save', async function(next){
    //this only run if password only modified
    if(!this.isModified('password')) return next();

    // Hash the password with cost of 12 
    this.password = await bcrypt.hash(this.password, 12);
    //Delete the password confirmed
    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return  await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {

   if(this.passwordChangedAt) {
       const changedTimestamp = parseInt(
           this.passwordChangedAt.getTime() / 1000,
            10
        );

       return JWTTimeStamp < changedTimestamp;
   }
   return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;