const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utilities/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globleErrorHandler = require('./controllers/errorController');

const app = express();

//1) GLOBAL MIDDLEWARES

//set HTPP headers
app.use(helmet());

//Development logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
//Limitng request from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request form this IP, Please try after an hour!'
});
app.use('/api', limiter);

//Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

//Date sanitization against XSS
app.use(xss());

//Prevent parameter polution
app.use(hpp({
    whitelist: [
        'duration', 
        'ratingsQuality',
        'ratingsAverage',
        'maxGroupSize', 
        'difficulty', 
        'price'
    ]
}));

//Serving static file
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
    // console.log(req.headers);
    req.requestTime = new Date().toISOString();
    next();
});

//3) ROUTS

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) =>{
    
    next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
});
app.use(globleErrorHandler);

module.exports = app;