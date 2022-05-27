import db from "../db.js";
import joi from "joi";

export async function createGame(req, res) {
    const { body } = req;
    const gameSchema = joi.object({
        name: joi.string().required(),
        image: joi.string().required(),
        stockTotal: joi.number().integer().greater(0).required(),
        categoryId: joi.number().integer().required(),
        pricePerDay: joi.number().integer().greater(0).required()
    });
    const validation = gameSchema.validate(body, { abortEarly: true });
    if (validation.error) {
        console.log(validation.error.details);
        return res.sendStatus(400);
    }
    try {
        const exist = await db.query(`SELECT * FROM categories WHERE id = $1`, [body.categoryId]);
        if (!exist.rows[0]) {
            console.log("Categoria não existe!");
            return res.sendStatus(400);
        }
        const existName = await db.query(`SELECT * FROM games WHERE name = $1`, [body.name]);
        if (existName.rows[0]) {
            console.log("Nome já existe!");
            return res.sendStatus(409);
        }
        await db.query(`INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)`, [body.name, body.image, body.stockTotal, body.categoryId, body.pricePerDay]);
        res.sendStatus(201);
    } catch (err) {
        console.log("Deu erro na criação do game", err);
        res.sendStatus(500);
    }

}

export async function searchGames(req, res) {
    const { name } = req.query;
    console.log(name);
    try {
        if (name) {
            const filteredGames = await db.query(`SELECT * FROM games WHERE name LIKE $1 `, [name + '%']);
            return res.send(filteredGames.rows);
        }
        const games = await db.query(`SELECT * FROM games`);
        res.send(games.rows);
    } catch (err) {
        console.log("Deu erro na busca pelos games", err);
        res.sendStatus(500);
    }
}