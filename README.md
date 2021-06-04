# RESTful-API-to-send-email

This project is an API in NodeJS using express to send emails using the Gmail REST API

# Installation
- Download and extract Zip file.
- Change directory to downloaded folder.
```
cd RESTful-API-to-send-email
```
```
npm install
```
```
npm start
```
# Test API Endpoints
```
API for Authorization

GET http://localhost:3000/
```
-  After succesfull authorization API will be at.
```
     http://localhost:3000/action/auth
```
-  API for Sending mail go to /send
```
GET http://localhost:3000/action/auth/send
```
After sending mail you will get successfully email sent message <br>
and you can check mail now.


