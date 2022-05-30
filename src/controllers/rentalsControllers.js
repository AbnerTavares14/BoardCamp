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
        const result = await db.query(`SELECT "pricePerDay", "stockTotal" FROM  games  WHERE id = $1 `, [body.gameId]);
        if (!result.rows || result.rows.length === result.rows[0].stockTotal) {
            return res.sendStatus(400);
        }
        const totalPrice = result.rows[0].pricePerDay * body.daysRented;
        await db.query(`INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "originalPrice") VALUES ($1, $2, $3, $4, $5)`, [body.customerId, body.gameId, dayjs().format('YYYY-MM-DD'), body.daysRented, totalPrice]);
        res.sendStatus(201);
    } catch (error) {
        console.log("Deu erro na criação do aluguel", error);
        res.sendStatus(500);
    }
}

export async function listRentals(req, res) {
    const { limit, offset } = req.query;
    try {
        if (limit && offset) {
            const result = await db.query(`SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name
            FROM rentals JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON categories.id = games."categoryId" LIMIT $1 OFFSET $2
            `, [limit, offset]);
            return res.send(result.rows);
        } else if (offset) {
            const result = await db.query(`SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name
            FROM rentals JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON categories.id = games."categoryId" OFFSET $1
            `, [offset]);
            return res.send(result.rows);
        } else if (limit) {
            const result = await db.query(`SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name
            FROM rentals JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON categories.id = games."categoryId" LIMIT $1
            `, limit);
            return res.send(result.rows);
        }
        const result = await db.query(`SELECT rentals.*, customers.id as "customerId", customers.name as "customerName", games.id as "gameId", games.name as "gameName", games."categoryId", categories.name as "categoryName"
        FROM rentals JOIN customers ON rentals."customerId" = customers.id
        JOIN games ON rentals."gameId" = games.id
        JOIN categories ON categories.id = games."categoryId"
        `);
        const resultFinal = [];
        result.rows.forEach((row) => {
            resultFinal.push({
                id: row.id,
                customerId: row.customerId,
                gameId: row.gameId,
                rentDate: row.rentDate,
                daysRented: row.daysRented,
                returnDate: row.returnDate,
                originalPrice: row.originalPrice,
                delayFee: row.delayFee,
                customer: {
                    id: row.customerId,
                    name: row.customerName
                },
                game: {
                    id: row.gameId,
                    name: row.gameName,
                    categoryId: row.categoryId,
                    categoryName: row.categoryName
                }

            })
        })
        console.log(resultFinal)
        res.send(resultFinal);
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
        if (exist.rows[0].returnDate !== null) {
            return res.sendStatus(400);
        }
        const dataDiff = await db.query(`SELECT DATE_PART('day', $2::timestamp - $1::timestamp)  `, [exist.rows[0].rentDate, dayjs().format("YYYY-MM-DD")]);
        const resultGame = await db.query(`SELECT games."pricePerDay" FROM rentals JOIN games ON rentals."gameId" = games.id`);
        if (dataDiff.rows[0].date_part <= exist.rows[0].daysRented) {
            await db.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = 0 WHERE id=$2`, [dayjs().format('YYYY-MM-DD'), id]);
            return res.sendStatus(200);
        }
        await db.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id=$3`, [dayjs().format('YYYY-MM-DD'), (dataDiff.rows[0].date_part - exist.rows[0].daysRented) * resultGame.rows[0].pricePerDay, id]);
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