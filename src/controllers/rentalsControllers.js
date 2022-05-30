import db from "../db.js";
import joi from "joi";
import dayjs from "dayjs";

export async function createRental(req, res) {
    const { body } = req;
    const rentalSchema = joi.object({
        customerId: joi.number().required(),
        gameId: joi.number().required(),
        daysRented: joi.number().min(1).required()
    });
    const validation = rentalSchema.validate(body, { abortEarly: true });
    if (validation.error) {
        console.log(validation.error.details);
        return res.sendStatus(400);
    }
    try {
        const result = await db.query(`SELECT games.'pricePerDay', games.'stockTotal' FROM rentals JOIN games ON rentals.$1 = games.id `, [body.gameId]);
        const totalPrice = result.rows[0].pricePerDay * body.daysRented;
        if (result.rows.length === result.rows[0].stockTotal) {
            return res.sendStatus(400);
        }
        console.log(totalPrice);
        await db.query(`INSERT INTO rentals (customerId, gameId, renDate, daysRented, originalPrice) VALUES ($1, $2, $3, $4, $5)`, [body.customerId, body.gameId, dayjs().format('YYYY-MM-DD'), body.daysRented, totalPrice]);
        res.sendStatus(201);
    } catch (error) {
        console.log("Deu erro na criação do aluguel", error);
        res.sendStatus(500);
    }
}

export async function listRentals(req, res) {
    try {
        const result = await db.query(`SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name
        FROM rentals JOIN customers ON rentals."customerId" = customers.id
        JOIN games ON rentals."gameId" = games.id
        JOIN categories ON categories.id = games."categoryId"
        `);
        res.send(result.rows);
    } catch (err) {
        console.log("Deu erro na listagem de aluguéis", err);
        res.sendStatus(500);
    }
}

export async function finishRent(req, res) {
    const { id } = req.params;
    try {
        const exist = await db.query(`SELECT * FROM rentals WHERE id=$1`, [id]);
        if (!exist) {
            return res.sendStatus(404);
        }
        if (exist.rows[0].returnDate === null) {
            return res.sendStatus(400);
        }
        const dataDiff = await db.query(`SELECT date(exist.renDate) - date(dayjs().format("YYYY-MM-DD")) `);
        const resultGame = await db.query(`SELECT games.'pricePerDay' FROM rentals JOIN games ON rentals.'gameId' = games.id`);
        await db.query(`UPDATE rentals SET returnDate = $1, delayFee = $2 WHERE id=$3`, [dayjs().format('YYYY-MM-DD'), dataDiff * resultGame.rows[0].pricePerDay, id]);
        res.sendStatus(200);
    } catch (err) {
        console.log("Deu erro na finalização do aluguel", err);
        res.sendStatus(500);
    }
}

export async function deleteRent(req, res) {
    const { id } = req.params;
    try {
        const exist = await db.query(`SELECT * FROM rentals WHERE id = $1`, [id]);
        if (!exist) {
            return res.sendStatus(404);
        }
        await db.query(`DELETE FROM rentals WHERE id = $1`, [id]);
        res.sendStatus(200);
    } catch (err) {
        console.log("Deu erro na exclusão do aluguel!", err);
        res.sendStatus(500);
    }
}