const admin = require("firebase-admin");

let firebaseApp;

if (admin.apps.length === 0) {
  const serviceAccount = require("./firebaseAdminSDK.json"); // Replace with your actual service account key file
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  firebaseApp = admin.app(); // Use existing initialized app
}

module.exports = firebaseApp;
