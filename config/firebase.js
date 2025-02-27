const admin = require("firebase-admin");
const serviceAccount = require("../utils/sdn302.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
