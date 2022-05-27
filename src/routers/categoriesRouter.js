import { Router } from 'express';
import { createCategorie, searchCategorie } from '../controllers/categoriesControllers.js';

const categoriesRouter = Router();

categoriesRouter.post("/categories", createCategorie);
categoriesRouter.get("/categories", searchCategorie);

export default categoriesRouter;