const admin = require("../config/firebase");

const verifyFirebaseToken = async (req, res, next) => {
  const idToken = req.body.idToken;

  if (!idToken) {
    return res.status(400).send({ message: "ID token is required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(401).send({ message: "Unauthorized", error: error.message });
  }
};

module.exports = verifyFirebaseToken;
