import db from "../db.js";
import joi from "joi";

export async function createCategorie(req, res) {
    const { body } = req;
    const categorieSchema = joi.object({
        name: joi.string().required()
    });
    const validation = categorieSchema.validate(body);
    if (validation.error) {
        console.log(validation.error.details);
        return res.sendStatus(400);
    }
    try {
        const exist = await db.query(`SELECT * FROM categories WHERE name = $1`, [body.name]);
        if (exist.rows[0]) {
            console.log("Nome já existe");
            return res.sendStatus(409);
        }
        await db.query(`INSERT INTO categories (name) VALUES ($1)`, [body.name]);
        res.sendStatus(201);
    } catch (error) {
        console.log("Deu erro na criação de categoria", error);
        res.sendStatus(500);
    }
}

export async function searchCategorie(req, res) {
    try {
        const result = await db.query(`SELECT * FROM categories`);
        res.send(result.rows);
    } catch (err) {
        console.log("Deu erro na busca de categorias", err);
        res.sendStatus(500);
    }
}