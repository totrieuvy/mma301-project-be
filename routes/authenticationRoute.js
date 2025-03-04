const express = require("express");
const bodyParser = require("body-parser");
const db = require("../models/index");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const authenticationRoute = express.Router();
authenticationRoute.use(bodyParser.json());

/**
 * @swagger
 * /api/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register new account
 *     description: Register new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - phone
 *               - password
 *               - username
 *     responses:
 *       200:
 *         description: Register success
 *       400:
 *         description: Register failed
 */
authenticationRoute.post("/register", async (req, res) => {
  try {
    const { email, phone, password, username } = req.body;

    // Validate input
    if (!email || !phone || !password || !username) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const existingEmail = await db.Account.findOne({ email });
    if (existingEmail) {
      return res.status(400).send({ message: "Email already exists" });
    }

    const existingPhone = await db.Account.findOne({ phone });
    if (existingPhone) {
      return res.status(400).send({ message: "Phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = new db.Account({ email, phone, password: hashedPassword, username, balance: 0 });
    await account.save();

    const templatePath = path.join(__dirname, "../templates/emailTemplate.html");
    let emailTemplate = fs.readFileSync(templatePath, "utf8");
    emailTemplate = emailTemplate.replace("{{email}}", email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Registration Successful",
      html: emailTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    const { password: _, ...accountWithoutPassword } = account.toObject();

    res.status(200).send({
      message: "Registration successful",
      account: accountWithoutPassword,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(400).send({ message: "Registration failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login to an existing account
 *     description: Allows a user to log into their account using email and password.
 *     security:
 *       - BearerAuth: [] # Chỉ định API này cần Bearer Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               password:
 *                 type: string
 *                 description: The password for the user account.
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful. Returns a JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticating further requests.
 *       400:
 *         description: Bad request. The request could not be processed due to invalid input.
 *       401:
 *         description: Unauthorized. Incorrect email or password.
 *       404:
 *         description: Account not found. No account exists with the provided email.
 *       500:
 *         description: Internal server error. Something went wrong on the server.
 */
authenticationRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: "All fields are required" });
    }
    const account = await db.Account.findOne({ email });
    if (!account) {
      return res.status(404).send({ message: "Email or password is not correct" });
    }
    if (account.status === false) {
      return res.status(401).send({ message: "Account is disabled" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, account.password);
    if (!isPasswordCorrect) {
      return res.status(401).send({ message: "Email or password is not correct" });
    }

    const token = jwt.sign({ _id: account._id, email: account.email, role: account.role }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    const { password: _, ...accountWithoutPassword } = account.toObject();

    res.status(200).send({
      message: "Login successful",
      account: accountWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Internal server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/forgot-password:
 *   post: # Method type
 *     tags:
 *       - Authentication # Tag group for the API
 *     summary: Forgot password
 *     description: Send an email to reset the password
 *     requestBody: # Defines the request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email of the account
 *             required:
 *               - email
 *     responses: # Possible responses
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Bad request (e.g., missing email or invalid format)
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
authenticationRoute.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const account = await db.Account.findOne({ email });

    const token = jwt.sign({ email: account.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    if (!account) {
      return res.status(404).send({ message: "Account not found" });
    }

    const templatePath = path.join(__dirname, "../templates/resetPasswordTemplate.html");
    let emailTemplate = fs.readFileSync(templatePath, "utf8");
    emailTemplate = emailTemplate.replace("{{email}}", email);
    emailTemplate = emailTemplate.replace("{{token}}", token);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      html: emailTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(200).send({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error during forgot password:", error);
    res.status(500).send({ message: "Internal server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Allows a user to reset their password using a token and a new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: The new password to set.
 *               token:
 *                 type: string
 *                 description: The token generated during the password reset request.
 *             required:
 *               - newPassword
 *               - token
 *     responses:
 *       200:
 *         description: Reset password successful. The user's password has been updated.
 *       400:
 *         description: Bad request. The provided data is invalid.
 *       401:
 *         description: Unauthorized. Invalid or expired token.
 *       404:
 *         description: Not Found. Token does not exist or has expired.
 *       500:
 *         description: Internal server error. Something went wrong on the server.
 */
authenticationRoute.post("/reset-password", async (req, res) => {
  try {
    const { newPassword, token } = req.body;

    if (!newPassword || !token) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.Account.findOneAndUpdate({ email }, { password: hashedPassword });

    res.status(200).send({ message: "Reset password successful" });
  } catch (error) {
    console.error("Error during reset password:", error);
    res.status(400).send({ message: "Reset password failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/account/{id}:
 *   get:
 *     summary: Get account by ID
 *     description: Retrieve an account by its unique ID.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the account
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
authenticationRoute.get("/account/:id", async (req, res) => {
  try {
    const account = await db.Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = authenticationRoute;
