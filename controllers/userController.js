const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const { findById } = require('./../models/userModel');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    })
    return newObj;
}

exports.getAllUsers = (req, res) => {
    
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined...'
    });
}

exports.createUser = (req, res) => {
    
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined...'
    });
}

exports.updateMe = catchAsync( async (req, res, next) =>{
    // 1.) Create an error if user post pasword data
    if(req.body.password || req.body.passwordConfirm){
        return next('This route is not for password updates. Please use /updateMyPassword.', 400);

    }
    // 2.) filtered out unwanted fieldnames that are not allowed to updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    // 3.) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, 
        runValidators: true
    });


    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }

    });
});

exports.deleteMe = catchAsync( async(req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getUser = (req, res) => {
    
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined...'
    });
}

exports.updateUser = (req, res) => {
    
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined...'
    });
}

exports.deleteUser = (req, res) => {
    
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined...'
    });
}
