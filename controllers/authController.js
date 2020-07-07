const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const sendEmail = require('./../utilities/email');

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, 
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );
}

exports.signup = catchAsync (async(req, res, next) =>{
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
});

exports.login = catchAsync( async (req, res, next) => {
    const {email, password} = req.body;

    // 1.) Check If email and password exist

    if(!email || !password){
        return next(new AppError('Please provide email and password!', 400));
    }
    // 2.) Check If User exists && password is correct
    const user = await User.findOne({email}).select('+password');

    if(!user || !await user.correctPassword(password, user.password)){
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3.) If ecerything ok, send token to client
    var token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});

exports.protect =catchAsync(async (req, res, next) =>{
    // 1.) Getting token and check of It's there
    let token;
    if(req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {
         token = req.headers.authorization.split(' ')[1];

    }

    if(!token) {
        return next(
            new AppError('You are not loged in! Please log in to get access.', 401)
        );
    }

    // 2.) Verification token 
      const decoded = await promisify( jwt.verify)(token, process.env.JWT_SECRET);

    // 3.) Check If user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next( new AppError('The user belong to this token does not exist', 401));
    }

    // 4.) Check If user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(
            new AppError('User recently changed password! Please login again.', 401)
        );
    }

    //GRANT ACCESS PROTECTED ROUTE
    req.user = currentUser;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403))
        }

        next();
    };
};

exports.forgotPassword = catchAsync( async(req, res, next) =>{
    // 1.) Get user based on POSTed emal
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('There is no user with this email', 404));
    }

    // 2.) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3.) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`

    const message = `Forgot your passowd? Submit a PATCH request with your new password and
    passwordCnfirm to: ${resetURL}.\n If your didn't forget your password, Please ignore this email!`;
    try{
        await sendEmail({

        email: user.email,
        subject: 'your password reset token(valid for 10 min)',
        message

        });
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    }catch(err){
        console.log(err)
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError('Ther was an error sending the mail, Try again...', 500));
    }
    
});

exports.resetPassword = (req, res, next) =>{}