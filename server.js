const mongoose = require('mongoose'); 
const dotenv = require('dotenv');

process.on('uncaughtException', err =>{
    console.log('UNCAUTCH EXCEPTIONS');
    console.log(err.name, err.message);
    
    process.exit(1);
});

dotenv.config({path: './config.env'})

const app = require('./index');


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(con => console.log('DB connection successfull'));


const port = process.env.PORT;
const server = app.listen(port, () =>{
    console.log(`app running on port ${port}....`)
});


process.on('unhandledRejection', err =>{
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION  ... Shutting down.....');
    server.close(() =>{

        process.exit(1);
    });
});

process.on('uncaughtException', err =>{
    console.log('UNCAUTCH EXCEPTIONS');
    console.log(err.name, err.message);
    server.close( () =>{
        process.exit(1);
    });
});