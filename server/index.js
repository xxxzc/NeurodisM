const express = require('express');

let app = express();

const neurodism = require('./api');
app.use('/neurodism', express.static('../public'));
app.use('/neurodism', neurodism);

app.listen(8070);
console.log('NeurodisM Server: started');

 