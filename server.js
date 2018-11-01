'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

//Application Setup
const app = express();
//local port 3000 
const PORT = process.env.PORT || 3000;

//Application Middleware
app.use(express.urlencoded({ extended: true }));

//Set the view engine for server side templating
app.set('view engine', 'ejs');
app.use(express.static('./public'));

//Reading the .env file
require('dotenv').config();

//DataBase dependencies
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.log(err));

//API routes-rendering the search form
app.get('/searches/new', newJobSearch);
app.post('/searches', getJob);

//Catch-all error handle

app.get('*', (request, response) => response.status(404).send('Resource could not be found, This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

//Helper fnctions
function handleError(err, response) {
  console.error(err);
  if (response) response.status(500).send('Internal server error');

}

//constructor 

function Jobs(response) {
  this.type = response.category.label || 'Not available';
  this.created = response.created || 'No date of creaton available for this job post';
  this.company = response.company.display_name || 'No Company name available';
  this.title = response.title || 'No title available';
  this.description = response.description || 'No description available';

}

function newJobSearch(request, response) {
  response.render('pages/searches/new'); //where is the information going
}

function getJob(request, response) {
  console.log(request.body, 'request.body');
  let url = `https://api.adzuna.com:443/v1/api/jobs/us/search/2?app_id=${process.env.app_id}&app_key=${process.env.app_key}&what=${request.body.searches}&title_only=${request.body.searchez}&content-type=application/json`;
  
  // `http://api.adzuna.com:443/v1/api/jobs/us/search/2?app_id=${process.env.app_id}&app_key=${process.env.app_key}&what=${request.body.searches}&title_only=${request.body.searchez}&content-type=application/json`;

  // 'https://api.adzuna.com:443/v1/api/jobs/us/search/2?app_id=95b38706&app_key=b41e1e1e9f37bd97662611f0364cd394&what=java&title_only=developer&content-type=application/json';
  
  // console.log(url, 'url');

  
  
  // let incomingInfo = [];
  superagent.get(url)
    // .set('Accept', 'application/json') //request not in this form for this API
    // .then(results => console.log(JSON.parse(results.text)))
    .then(apiResponse => {
      console.log(apiResponse.body.results)
      apiResponse = (apiResponse.body.results)
      return apiResponse.map(job => new Jobs(job))

    })
    .then(jobs => response.render('pages/searches/results', { arrayOfInfo: jobs }))
    .catch(error => handleError(error, response));
}
