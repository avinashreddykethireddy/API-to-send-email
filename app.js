
const opn = require('opn'); //opn module used for opening links in browser
const fs = require('fs');
//const readline = require('readline');
const {google} = require('googleapis');
const express = require('express')  
const bodyParser = require('body-parser'); //reading json data module
const OAuth2Data = require('./credentials.json'); //import credentials file

const app = express(); //initializing express
app.use(bodyParser.urlencoded({extended:true}));

const port = 3000;

const SCOPES = ['https://mail.google.com/'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const CLIENT_ID = OAuth2Data.installed.client_id; //read client_id from credentials.json 
const CLIENT_SECRET = OAuth2Data.installed.client_secret; //read client_secret from credentials.json
const REDIRECT_URL = OAuth2Data.installed.redirect_uris[0]; //read redirect_uris from credentials.json

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL) 

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    //callback(oAuth2Client);
  });
}

// function to check the gmail is verified and send the mail if not verified it automatically call for authorization 
function authorize_send(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback); // if no token then it creates a new token
    oAuth2Client.setCredentials(JSON.parse(token));      
    callback(oAuth2Client);
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  opn(authUrl); // to open the authUrl in browser
  
  //console.log('Authorize this app by visiting this url:', authUrl);
  // const rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout,
  // });
  
  // rl.question('Enter the code from that page here: ', (code) => {
  //   rl.close();
  //   oAuth2Client.getToken(code, (err, token) => {
  //     if (err) return console.error('Error retrieving access token', err);
  //     oAuth2Client.setCredentials(token);
  //     // Store the token to disk for later program executions
  //     fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
  //       if (err) return console.error(err);
  //       console.log('Token stored to', TOKEN_PATH);
  //     });
  //     callback(oAuth2Client);
  //   });
  // });

}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}

function makeBody(to, from, subject, message) {
  var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
      "MIME-Version: 1.0\n",
      "Content-Transfer-Encoding: 7bit\n",
      "to: ", to, "\n",
      "from: ", from, "\n",
      "subject: ", subject, "\n\n",
      message
  ].join('');  // email string

  var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
      return encodedMail;
}

function sendMessage(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.send({
      auth: auth,
      userId: 'me',
      resource: {
          raw: makeBody('avinashreddy482001@gmail.com', // to address
                        'me',                           // from address (it is default user address as authenticated)
                        'Sending mail using Gmail API', // subject                
                        'hi , this is working '         // message  
                        )  
      }
  }, function(err, response) {
      console.log(err || response);
  });
}

app.get('/',function(req,res){
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content),sendMessage );
  });

  res.redirect('/action/auth');
});

//Redirecting route with Authorization code
app.get('/action', function (req, res) {

  const code = req.query.code; //fetching code from req header from gmail using body parser

  if (code){
      // Get an access token based on our OAuth code
      oAuth2Client.getToken(code, function (err, tokens) {
          if (err) {
              //console.log('Error authenticating');
              //console.log(err);
              res.send(err);
          } 
          else{
              //console.log('Successfully authenticated');
              fs.writeFile(TOKEN_PATH, JSON.stringify({refresh_token:tokens.refresh_token,access_token:tokens.access_token}) ,function (err) {
                if (err) throw err; });
        
              res.send('Successfully Authenticated');
          }
      });
  }
});

app.get('/action/auth',function(req,res){
  res.send("Go to /send to send email");
});

app.get('/action/auth/send',function(req,res){
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize_send(JSON.parse(content),sendMessage);
  });

  res.send("Email sent successfully")
  
});

app.listen(port, () => {
  console.log(`Project listening at http://localhost:${port}`)
})