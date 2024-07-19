#2FA Authentication System
This is a simple 2FA (Two-Factor Authentication) system built with Node.js, Express, and MongoDB. The system includes user registration, login, and 2FA verification using Google Authenticator.

#Features
User registration with hashed password
User login with email and password
Two-Factor Authentication (2FA) using Google Authenticator
Secure routes accessible only after successful 2FA verification

#Requirements
Node.js (v12 or later)
MongoDB (local or MongoDB Atlas)
Git

#Installation
1. Clone the repository: https://github.com/Gadnadj/2FA_System.git
Access to the file : cd 2FA_system
2. Install dependencies: npm install
3. Create a .env file: Create a .env file at the root of the project with the following content:
   DATABASE_URL=mongodb+srv://your-mongo-db-username:your-mongo-db-password@cluster0.mongodb.net/your-database-name?retryWrites=true&w=majority
   SECRET_KEY=yourSecretKey
Replace the placeholder values with your actual MongoDB connection string and secret key
4. Start the server: node app.js

#Usage
Click on Register button
Fill in the registration form with a username, email, and password.
Scan the displayed QR code with Google Authenticator.
Click "Validate" to complete the registration process.

Try to login and test the 2FA authentification
