const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        trim: true,
        maxlength: [40, 'A tour name must have less or equal than 40 character'],
        minlength: [40, 'A tour name must have more or equal than 10 character']
        // validate: [validator.isAlpha, 'Tour name must only contain character']

    },
    slug: String,
    duration:{
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour should have difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Diffficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must above 1.0'],
        max: [5, 'Rating must above 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have price']
    },
    priceDiscount: {
        type: Number,
        validator: {
            function(val){
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below the regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover images']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        //GoeJSON
        type: {
            type: String,
            default: 'point',
            enum: ['point'] 
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
    {
       type: {
                type: String,
                default: 'point',
                enum: ['point']
            },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }]
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, {lower: true });
    next();
});

// tourSchema.pre('save', function(next){
//     console.log('will save documents');
//     next();
// });

// tourSchema.post('save', function(docs, next){
//     console.log(docs);
//     next();
// });

//QUERY MIDDLEWARE
// tourSchema.pre('find', function(next)
tourSchema.pre(/^find/, function(next){
    this.find({ secretTour: {$ne: true} });
    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function(docs,next){
    console.log(`Query took ${Date.now() - this.start} miliseconds`);
    // console.log(docs);
    next();
});

//AGGRITATION MIDDLEWARE
tourSchema.pre('aggregate', function(next){
    this.pipeline().unshift({$match: {secretTour: {$ne: true}}});

    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;