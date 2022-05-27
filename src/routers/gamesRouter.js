import { Router } from 'express';
import { createGame, searchGames } from '../controllers/gamesControllers.js';

const gamesRouter = Router();

gamesRouter.get("/games", searchGames);
gamesRouter.post("/games", createGame);

export default gamesRouter;