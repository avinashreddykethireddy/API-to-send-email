
const open = require('open'); //open module used for opening links in browser
const fs = require('fs');
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

var oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL) 

function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
  });
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  open(authUrl); // to open the authUrl in browser
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

app.get('/',function(req,res){
  res.send("to start go to /auth");
});

app.get('/auth',function(req,res){
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content));
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
              res.send(err);
          } 
          else{
              //console.log('Successfully authenticated');
              fs.writeFile(TOKEN_PATH, JSON.stringify({refresh_token:tokens.refresh_token,access_token:tokens.access_token}) ,function (err) {
                if (err) throw err; 
              });
        
              res.send('Successfully Authenticated');
          }
      });
  }
});

app.get('/action/auth',function(req,res){
  res.send("Go to /send to send email");
});

// post request to send email 
// Request Body:
// {
//   to: Sender's Email ID
//   subject: Email subject text
//   message: Message to be sent in body
// }

app.post('/action/auth/send',function(req,res){
  
  var auth = oAuth2Client;
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.send({
      auth: auth,
      userId: 'me',
      resource: {
          raw: makeBody( req.body.to , // to address
                        'me',           // from address (it is default user address as authenticated)
                        req.body.subject, // subject                
                        req.body.message  // message  
                        )  
      }
  }, function(err, response) {
      console.log(err || response);
  });

  res.send("Email sent successfully")
  
});

app.listen(port, () => {
  console.log(`Project listening at http://localhost:${port}`)
})