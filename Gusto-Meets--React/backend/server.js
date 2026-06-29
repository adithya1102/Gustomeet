const express = require('express');
const cors = require('cors');

// 1. Use the modern destructured imports for Firebase Admin
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Make sure you have your newly generated secure key here!
const serviceAccount = require('./serviceAccountKey.json');

// 2. Initialize using the new syntax
initializeApp({
  credential: cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// 3. The updated Auth Middleware using getAuth()
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Notice we use getAuth().verifyIdToken here instead of admin.auth()
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken; 
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

// ... (Your routes and app.listen stay exactly the same below this) ...

app.get('/api/protected-data', verifyFirebaseToken, (req, res) => {
  res.json({ 
    message: 'Success!', 
    userUid: req.user.uid 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));