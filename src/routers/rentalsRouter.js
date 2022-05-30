import { Router } from 'express';
import { createRental, deleteRent, finishRent, listRentals } from '../controllers/rentalsControllers.js';

const rentalsRouter = Router();

rentalsRouter.post("/rentals", createRental);
rentalsRouter.get("/rentals", listRentals);
rentalsRouter.post("/rentals/:id/return", finishRent);
rentalsRouter.delete("/rentals/:id", deleteRent);

export default rentalsRouter;