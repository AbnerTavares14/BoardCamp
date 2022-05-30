import { Router } from 'express';
import { searchCustomer, listCustomers, updateCustomer, createCustomer } from '../controllers/customersControllers.js';

const customersRouter = Router();

customersRouter.post("/customers", createCustomer);
customersRouter.get("/customers", listCustomers);
customersRouter.get("/customers/:id", searchCustomer);
customersRouter.put("/customers/:id", updateCustomer);

export default customersRouter;