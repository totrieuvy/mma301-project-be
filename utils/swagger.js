const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { Brand, Product, Account, Feedback, QuizQuestion } = require("../models");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "This is the API documentation for the Node.js and MongoDB project",
    },
    servers: [
      {
        url: "https://mma301-project.onrender.com/", // Base URL for your API
        // url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // Indicates the format of the token
        },
      },
      schemas: {
        Category: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the category",
            },
            name: {
              type: "string",
              description: "The name of the category",
            },
            description: {
              type: "string",
              description: "A description of the category",
            },
            status: {
              type: "boolean",
              description: "The status of the category (true: active, false: inactive)",
            },
            createBy: {
              type: "string",
              description: "The ID of the user who created the category",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the category was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the category was last updated",
            },
          },
          required: ["name", "description", "createBy"],
        },
        Skin: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the skin",
            },
            type: {
              type: "string",
              description: "The type of skin",
            },
            status: {
              type: "boolean",
              description: "The status of the skin (true: active, false: inactive)",
            },
            createBy: {
              type: "string",
              description: "The ID of the user who created the skin",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the skin was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the skin was last updated",
            },
          },
          required: ["type", "createBy"],
        },
        Brand: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the brand",
            },
            name: {
              type: "string",
              description: "The name of the brand",
            },
            contact: {
              type: "string",
              description: "The contact information for the brand",
            },
            status: {
              type: "boolean",
              description: "The status of the brand (true: active, false: inactive)",
            },
            createBy: {
              type: "string",
              description: "The ID of the user who created the brand",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the brand was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the brand was last updated",
            },
          },
          required: ["name", "contact", "createBy"],
        },
        Product: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the product",
            },
            name: {
              type: "string",
              description: "The name of the product",
            },
            description: {
              type: "string",
              description: "A description of the product",
            },
            price: {
              type: "number",
              description: "The price of the product",
            },
            image: {
              type: "string",
              description: "The image URL of the product",
            },
            suitableSkin: {
              type: "string",
              description: "The ID of the skin suitable for the product",
            },
            category: {
              type: "string",
              description: "The ID of the category for the product",
            },
            brand: {
              type: "string",
              description: "The ID of the brand for the product",
            },
            createBy: {
              type: "string",
              description: "The ID of the user who created the product",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the product was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the product was last updated",
            },
          },
          required: ["name", "description", "price", "image", "suitableSkin", "category", "brand", "createBy"],
        },
        Account: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "The email address of the user",
            },
            phone: {
              type: "string",
              description: "The phone number of the user",
            },
            password: {
              type: "string",
              description: "The password of the user",
            },
            username: {
              type: "string",
              description: "The username of the user",
            },
            role: {
              type: "string",
              description: "The role of the user",
            },
            status: {
              type: "boolean",
              description: "The status of the user (true: active, false: inactive)",
            },
          },
          required: ["email", "password", "role"],
        },
        Feedback: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the feedback",
            },
            fromAccount: {
              type: "string",
              description: "The ID of the user who created the feedback",
            },
            product: {
              type: "string",
              description: "The ID of the product the feedback is about",
            },
            content: {
              type: "string",
              description: "The content of the feedback",
            },
            rating: {
              type: "number",
              description: "The rating of the feedback",
            },
            status: {
              type: "string",
              description: "The status of the feedback (true: active, false: inactive)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the feedback was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the feedback was last updated",
            },
          },
          required: ["content", "rating", "createBy"],
        },
        Routine: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the routine",
            },
            skin: {
              type: "string",
              description: "The ID of the skin the routine is for",
            },
            routineName: {
              type: "string",
              description: "The name of the routine",
            },
            steps: {
              type: "array",
              description: "The steps in the routine",
              items: {
                type: "object",
                properties: {
                  order: {
                    type: "number",
                    description: "The order of the step",
                  },
                  description: {
                    type: "string",
                    description: "The description of the step",
                  },
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the routine was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the routine was last updated",
            },
          },
          required: ["skin", "routineName", "steps"],
        },
        QuizQuestion: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the quiz question",
            },
            questionText: {
              type: "string",
              description: "The text of the quiz question",
            },
            answers: {
              type: "array",
              description: "The answers to the quiz question",
              items: {
                type: "object",
                properties: {
                  option: {
                    type: "string",
                    description: "The option for the answer",
                  },
                  text: {
                    type: "string",
                    description: "The text of the answer",
                  },
                  point: {
                    type: "number",
                    description: "The point value of the answer",
                  },
                },
              },
            },
          },
          required: ["questionText", "answers"],
        },
        Promotion: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier for the promotion",
            },
            name: {
              type: "string",
              description: "The name of the promotion",
            },
            description: {
              type: "string",
              description: "The description of the promotion",
            },
            discount: {
              type: "number",
              description: "The discount value of the promotion",
            },
            startDate: {
              type: "string",
              format: "date-time",
              description: "The start date of the promotion",
            },
            endDate: {
              type: "string",
              format: "date-time",
              description: "The end date of the promotion",
            },
            status: {
              type: "boolean",
              description: "The status of the promotion (true: active, false: inactive)",
            },
            createBy: {
              type: "string",
              description: "The ID of the user who created the promotion",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the promotion was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the promotion was last updated",
            },
          },
          required: ["name", "description", "discount", "startDate", "endDate", "createBy"],
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    "./routes/authenticationRoute.js",
    "./routes/categoryRoute.js",
    "./routes/skinRoute.js",
    "./routes/brandRoute.js",
    "./routes/productRoute.js",
    "./routes/dashboardRoute.js",
    "./routes/managerRoute.js",
    "./routes/orderRoute.js",
    "./routes/customerRoute.js",
    "./routes/feedbackRoute.js",
    "./routes/routineRoute.js",
    "./routes/quizRoute.js",
    "./routes/promotionRoute.js",
  ],
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
