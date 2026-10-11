import express from 'express';
import { app } from './server/src/app.js';
const application = express();
application.use(app);
export default application;
