const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utilities/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globleErrorHandler = require('./controllers/errorController');

const app = express();

//1) GLOBAL MIDDLEWARES

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request form this IP, Please try after an hour!'
});

app.use('/api', limiter);

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

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