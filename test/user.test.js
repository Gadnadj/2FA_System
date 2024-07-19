const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../routes/models/user');
const speakeasy = require('speakeasy');

jest.setTimeout(20000); // Increase global timeout to 20 seconds

beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    await mongoose.connect(url);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('User Registration and Login', () => {
    beforeEach(async () => {
        // Clear all users before each test
        await User.deleteMany({});
    });

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Expect a redirection response (302)
        expect(response.status).toBe(302);
        
        // Check if the user was successfully created in the database
        const user = await User.findOne({ email: 'testuser@example.com' });
        expect(user).not.toBeNull();
        expect(user.username).toBe('testuser');
    });

    it('should login a user', async () => {
        // First, register a user
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Then, try to log in with the registered credentials
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Expect a redirection response (302) to the 2FA verification page
        expect(response.status).toBe(302);
        expect(response.header.location).toMatch(/\/auth\/verify_2fa\/.+/);
    });

    it('should not login a user with wrong password', async () => {
        // First, register a user
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Then, try to log in with an incorrect password
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'wrongpassword'
            });

        // Expect a redirection response (302) with an error message
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/auth/login?error=Invalid%20password');
    });

    it('should verify 2FA token successfully', async () => {
        // First, register a user
        const responseRegister = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        const user = await User.findOne({ email: 'testuser@example.com' });
        const token = speakeasy.totp({
            secret: user.fa_secret,
            encoding: 'base32'
        });
    
        // Then, try to verify the valid 2FA code
        const responseVerify = await request(app)
            .post(`/auth/verify_2fa/${user._id}`)
            .send({
                token
            });
    
        // Expect a redirection response (302) to the success page
        expect(responseVerify.status).toBe(302);
        expect(responseVerify.header.location).toBe('/success');
    });

    it('should not verify 2FA token with invalid token', async () => {
        // First, register a user
        const responseRegister = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        const user = await User.findOne({ email: 'testuser@example.com' });
    
        // Then, try to verify an invalid 2FA code
        const responseVerify = await request(app)
            .post(`/auth/verify_2fa/${user._id}`)
            .send({
                token: 'invalidtoken'
            });
    
        // Expect a redirection response (302) with an error message
        expect(responseVerify.status).toBe(302);
        expect(responseVerify.header.location).toBe(`/auth/verify_2fa/${user._id}?error=Invalid%202FA%20token`);
    });

    it('should not register a user with missing fields', async () => {
        // Try to register without providing an email
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
    
        // Expect a redirection response (302) with an error message
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/register?error=All%20fields%20are%20required');
    });

    it('should not login a user with unregistered email', async () => {
        // Try to log in with an email that does not exist in the database
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'nonexistentuser@example.com',
                password: 'testpassword'
            });
    
        // Expect a redirection response (302) with an error message
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/auth/login?error=User%20not%20found');
    });

    it('should show error messages for invalid registration', async () => {
        // Try to register without providing an email
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: '', // Missing email
                password: 'testpassword'
            });
    
        // Expect a redirection response (302) with an error message
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/register?error=All%20fields%20are%20required');
    });

    it('should not login with an empty password', async () => {
        // First, register a user
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        // Then, try to log in with an empty password
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: ''
            });
    
        // Expect a redirection response (302) with an error message
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/auth/login?error=Invalid%20password');
    });

    it('should redirect to the success page after a successful login', async () => {
        // Register a user
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        // Log in with the registered credentials
        const responseLogin = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        // Expect a redirection response (302) to the 2FA verification or next page
        expect(responseLogin.status).toBe(302);
        expect(responseLogin.header.location).toMatch(/\/auth\/verify_2fa\/.+/);
    });

    it('should access the home page without authentication', async () => {
        // Access the home page without authentication
        const response = await request(app)
            .get('/');
    
        // Expect a successful response (200)
        expect(response.status).toBe(200);
    });
});
