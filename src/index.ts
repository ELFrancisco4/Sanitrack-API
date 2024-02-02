import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { middleware } from './middlewares/security';
import customResponse from './helpers/response';
import routes from './routes/index'
import swagger from './config/swagger';
import auditMiddleware from './middlewares/audit';
import responseMessageMiddleware from './middlewares/response';
// Load environment variables from a .env file
dotenv.config();
// Create an Express application
const app: Express = express();

app.use(responseMessageMiddleware)

app.use(cors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
  }));
  

// Parse JSON bodies in requests
app.use(express.json());

// serve static files: 
app.use("/files", express.static("files"));

// Serve Swagger documentation at /api-docs using swagger-ui
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger));

// Middleware for security measures
app.use(middleware);

// call the audit middleware
app.use(auditMiddleware)

// Use the defined routes for handling API requests
app.use("/api", routes());

app.post('/health', (req, res) => { 
    res.json({message: "Healthy route"})
})

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Handle internal server errors and send a custom response
    return customResponse.serverErrorResponse("Internal server error", res, err);
});

// 404
app.use((req, res) => { 
    res.status(404).send("Invalid Route")
})

export default app;