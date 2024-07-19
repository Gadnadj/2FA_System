# <strong style="font-size: 24px;">2FA Authentication System</strong>
This is a simple 2FA (Two-Factor Authentication) system built with Node.js, Express, and MongoDB. The system includes user registration, login, and 2FA verification using Google Authenticator.

# <strong style="font-size: 24px;">Features</strong>
- User registration with hashed password
- User login with email and password
- Two-Factor Authentication (2FA) using Google Authenticator
- Secure routes accessible only after successful 2FA verification

# <strong style="font-size: 24px;">Requirements</strong>
- Node.js (v12 or later)
- MongoDB (local or MongoDB Atlas)
- Git

# <strong style="font-size: 24px;">Installation</strong>
1. **Clone the repository:**

    ```bash
    git clone https://github.com/Gadnadj/2FA_System.git
    cd 2FA_system
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Create a `.env` file:**
   
    Create a `.env` file at the root of the project with the following content:

    ```plaintext
    DATABASE_URL=mongodb+srv://your-mongo-db-username:your-mongo-db-password@cluster0.mongodb.net/your-database-name?retryWrites=true&w=majority
    SECRET_KEY=yourSecretKey
    ```

    Replace the placeholder values with your actual MongoDB connection string and secret key.

4. **Start the server:**

    ```bash
    node app.js
    ```

# <strong style="font-size: 24px;">Usage</strong>
1. **Click on the Register button.**

2. **Fill in the registration form with a username, email, and password.**

3. **Scan the displayed QR code with Google Authenticator.**

4. **Click "Validate" to complete the registration process.**

5. **Try to log in and test the 2FA authentication.**
