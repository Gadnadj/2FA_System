const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../routes/models/user');
const speakeasy = require('speakeasy');

jest.setTimeout(20000); // Augmenter le délai d'attente global à 20 secondes


beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    await mongoose.connect(url);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('User Registration and Login', () => {
    beforeEach(async () => {
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

        expect(response.status).toBe(302); // Redirection vers le QR code
        const user = await User.findOne({ email: 'testuser@example.com' });
        expect(user).not.toBeNull();
        expect(user.username).toBe('testuser');
    });

    it('should login a user', async () => {
        // D'abord, enregistrons un utilisateur
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Ensuite, essayons de nous connecter avec ces informations
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        expect(response.status).toBe(302); // Redirection vers la vérification 2FA ou la page suivante
        expect(response.header.location).toMatch(/\/auth\/verify_2fa\/.+/); // Vérifie que la redirection est vers la page de vérification 2FA
    });

    it('should not login a user with wrong password', async () => {
        // D'abord, enregistrons un utilisateur
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Ensuite, essayons de nous connecter avec un mot de passe incorrect
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(302); // Redirection vers la page de connexion avec un message d'erreur
        expect(response.header.location).toBe('/auth/login?error=Invalid%20password');
    });

    it('should verify 2FA token successfully', async () => {
        // D'abord, enregistrons un utilisateur
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
    
        // Ensuite, essayons de vérifier le code 2FA valide
        const responseVerify = await request(app)
            .post(`/auth/verify_2fa/${user._id}`)
            .send({
                token
            });
    
        expect(responseVerify.status).toBe(302); // Redirection vers la page de succès
        expect(responseVerify.header.location).toBe('/success');
    });

    it('should not verify 2FA token with invalid token', async () => {
        // D'abord, enregistrons un utilisateur
        const responseRegister = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        const user = await User.findOne({ email: 'testuser@example.com' });
    
        // Ensuite, essayons de vérifier un code 2FA invalide
        const responseVerify = await request(app)
            .post(`/auth/verify_2fa/${user._id}`)
            .send({
                token: 'invalidtoken'
            });
    
        expect(responseVerify.status).toBe(302); // Redirection vers la page de vérification 2FA avec un message d'erreur
        expect(responseVerify.header.location).toBe(`/auth/verify_2fa/${user._id}?error=Invalid%202FA%20token`);
    });

    it('should not register a user with missing fields', async () => {
        // Essayons de nous enregistrer sans email
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
    
        expect(response.status).toBe(302); // Redirection vers la page d'enregistrement avec un message d'erreur
        expect(response.header.location).toBe('/register?error=All%20fields%20are%20required');
    });

    it('should not login a user with unregistered email', async () => {
        // Essayons de nous connecter avec un email non enregistré
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'nonexistentuser@example.com',
                password: 'testpassword'
            });
    
        expect(response.status).toBe(302); // Redirection vers la page de connexion avec un message d'erreur
        expect(response.header.location).toBe('/auth/login?error=User%20not%20found');
    });

    it('should show error messages for invalid registration', async () => {
        // Essayons de nous inscrire sans certains champs requis
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: '', // Email manquant
                password: 'testpassword'
            });
    
        expect(response.status).toBe(302); // Redirection vers la page d'inscription avec un message d'erreur
        expect(response.header.location).toBe('/register?error=All%20fields%20are%20required');
    });

    it('should not login with an empty password', async () => {
        // D'abord, enregistrons un utilisateur
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        // Ensuite, essayons de nous connecter avec un mot de passe vide
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: ''
            });
    
        expect(response.status).toBe(302); // Redirection vers la page de connexion avec un message d'erreur
        expect(response.header.location).toBe('/auth/login?error=Invalid%20password');
    });

    it('should redirect to the success page after a successful login', async () => {
        // Enregistrer un utilisateur
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        // Se connecter
        const responseLogin = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });
    
        expect(responseLogin.status).toBe(302); // Redirection vers la vérification 2FA ou la page suivante
        expect(responseLogin.header.location).toMatch(/\/auth\/verify_2fa\/.+/);
    });

    it('should access the home page without authentication', async () => {
        const response = await request(app)
            .get('/');
    
        expect(response.status).toBe(200); // La page d'accueil devrait être accessible sans authentification
    });

});
