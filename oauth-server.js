const express = require('express');
const axios = require('axios');
require('dotenv').config();
const config = require('./config.json');
const fs = require('fs');
const { generateChallenge } = require('pkce-challenge');

const app = express();
const port = 3000;

// In-memory store for code verifiers
const codeVerifierStore = new Map();

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to store the code verifier
app.post('/store-verifier', (req, res) => {
	const userId = req.body.userId;
    const codeVerifier = req.body.codeVerifier;
	if (userId && codeVerifier) {
		codeVerifierStore.set(userId, codeVerifier);
        console.log(codeVerifierStore.get(userId));
		res.sendStatus(200);
	}
	else {
		res.status(400).send('User ID and code verifier are required.');
	}
});


app.get('/oauth/callback', async (req, res) => {
	const authCode = req.query.code;
	const state = req.query.state; // User ID

	if (!authCode) {
		return res.status(400).send('Authorization code not found.');
	}

	const codeVerifier = codeVerifierStore.get(state);
	if (!codeVerifier) {
		return res.status(400).send('Could not find a matching code verifier. Please try calling the login command on Discord again.');
	}

	try {
		const response = await axios.post('https://myanimelist.net/v1/oauth2/token', {
				client_id: config.malClientId,
				client_secret: config.malClientSecret,
				code: authCode,
				code_verifier: await generateChallenge(codeVerifier),
                grant_type: 'authorization_code',
			}, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		const { access_token, refresh_token, expires_in } = response.data;
		console.log('Access Token:', access_token);
		console.log('Refresh Token:', refresh_token);
		console.log('Expires In:', expires_in);

        fs.readFile('access_tokens.json', 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Failed to read access tokens file.');
                return;
            }
            let jsonData;
            if (data) {
                jsonData = JSON.parse(data);
            } else {
                jsonData = {};
            }
            jsonData.state = access_token;

            fs.writeFile('access_tokens.json', JSON.stringify(jsonData), (err) => {
                if (err) {
                    res.status(500).send('Failed to save access tokens file.');
                    return;
                }
            });
        });

		res.send('Login successful! You can now close this window.');
	}
	catch (error) {
		console.error('Error exchanging authorization code for access token:', error.response ? error.response.data : error.message);
		res.status(500).send('Failed to get access token.');
	}
	finally {
		// Clean up the stored code verifier
		codeVerifierStore.delete(state);
	}
});

app.listen(port, () => {
	console.log(`OAuth server listening at http://localhost:${port}`);
});

