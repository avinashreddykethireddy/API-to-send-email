# API-to-send-email

This project is an API in NodeJS using express to send emails using the Gmail REST API

Add your credential.json file and use this

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

GET http://localhost:3000/auth
```
-  After succesfull authorization API will be at.
```
     http://localhost:3000/action/auth
```
-  API for Sending mail give POST request using POSTMAN
```
Request Type: x-www-form-urlencoded
Request Body:
{
  to: Sender's Email ID
  subject: Email subject text
  message: Message to be sent in body
}

POST http://localhost:3000/action/auth/send
```
After sending mail you will get successfully email sent message <br>
and you can check mail now.
API for Sending mail


