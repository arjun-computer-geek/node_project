// const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utilities/apiFeaures');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('../utilities/appError');

exports.aliasTopTours = (req, res, next) =>{
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty';
    next();
}


exports.getAllTours = catchAsync(async (req, res, next) => {
        
    //EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const tours = await features.query;
    
    // SEND RESPOSES
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
    
});

exports.createTour = catchAsync(async (req, res, next) =>{
   
    // const newId = tours[tours.length - 1].userId +1;
    // const newTour = Object.assign({userId: newId}, req.body);
    // tours.push(newTour);

    // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, 
    //                 JSON.stringify(tours), err =>{
    //    res.status(201).json({
            // status: 'success',
            // data:{
            //     tour: tours
            // }
        // });

    // });

    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    
    const tour = await Tour.findById(req.params.id)
    // Tour.findOne({_id: req.params.id})
    if(!tour){
        return next(new AppError('No tour Found with that id', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            tour
        } 
    });

});

exports.updateTour = catchAsync(async (req, res, next) =>{
    
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        // runValidators = true
    });

    if(!tour){
        return next(new AppError('No tour Found with that id', 404));
    }

    res.status(200).json({
    status: 'success',
    data: {
        tour
    }
    });
});

exports.deleteTour = catchAsync(async (req, res, next) =>{
    
   const tour =  await Tour.findByIdAndDelete(req.params.id)

    if(!tour){
        return next(new AppError('No tour Found with that id', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getTourStats = catchAsync(async (req, res, next) =>{
   
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte: 4.5}}
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                numTours: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'}
            }
        },
        {
            $sort: {
                avgprice: 1
            }
        },
        // {
        //     $match: {_id: {$ne:'EASY'}}
        // }
        
    ]);

    
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
        });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) =>{
    
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01.01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {$month: '$startDates'},
                numTourStarts: {$sum: 1},
                tours: {$push: '$name'}
            }
        },
        {
            $addFields: { month: '$_id'}
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 6
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
        });
    
});