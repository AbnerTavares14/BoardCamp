import db from "../db.js";
import joi from "joi";
import dayjs from "dayjs";
// import joi from '@joi/date';

export async function createCustomer(req, res) {
    const { body } = req;
    const customerSchema = joi.object({
        name: joi.string().required(),
        phone: joi.string().pattern(/[0-9]{11}/).required(),
        cpf: joi.string().pattern(/[0-9]{11}/).required(),
        birthday: joi.string().required()
    });
    const validation = customerSchema.validate(body, { abortEarly: true });
    if (validation.error) {
        console.log(validation.error.details);
        return res.sendStatus(400);
    }
    if (!body.birthday) {
        return res.sendStatus(409);
    }

    if ((!dayjs(body.birthday).isValid())) {
        return res.sendStatus(409);
    }

    try {
        const exist = await db.query(`SELECT * FROM customers WHERE cpf= $1`, [body.cpf]);
        console.log(exist.rows)
        if (exist.rows[0]) {
            return res.sendStatus(409);
        }
        await db.query(`INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)`, [body.name, body.phone, body.cpf, body.birthday]);
        res.sendStatus(201);
    } catch (error) {
        console.log("Deu erro na criação do cliente", error);
        res.sendStatus(500);
    }
}

export async function listCustomers(req, res) {
    const { cpf } = req.query;
    try {
        if (cpf) {
            const filteredCustomers = await db.query(`SELECT * FROM customers WHERE name LIKE $1`, [cpf + '%']);
            return res.send(filteredCustomers.rows);
        }
        const customers = await db.query(`SELECT * FROM customers`);
        res.send(customers.rows);
    } catch (error) {
        console.log("Deu erro na listagem dos clientes", error);
    }
}

export async function searchCustomer(req, res) {
    const { id } = req.params;
    try {
        const customer = await db.query(`SELECT * FROM customers WHERE id = $1`, [id]);
        if (!customer) {
            return res.sendStatus(404);
        }
        res.send(customer.rows[0]);
    } catch (error) {
        console.log("Deu erro na busca do cliente específico", error);
        res.sendStatus(500);
    }
}

export async function updateCustomer(req, res) {
    const { id } = req.params;
    const { body } = req;
    const customerSchema = joi.object({
        name: joi.string().required(),
        phone: joi.string().pattern(/ [0-9] /).min(10).max(11).required(),
        cpf: joi.string().pattern(/[0-9]{11}/).required(),
        birthday: joi.string(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/).required()
    });
    const validation = customerSchema.validate(body, { abortEarly: true });
    if (validation.error) {
        console.log(validation.error.details);
        return res.sendStatus(400);
    }
    try {
        const exist = await db.query("SELECT * FROM customers WHERE id = $1", [id]);
        if (!exist) {
            return res.sendStatus(404);
        }
        await db.query(`UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5`, [body.name, body.phone, body.cpf, body.birthday, id]);
        res.sendStatus(200);
    } catch (error) {
        console.log("Deu erro na atualização dos dados do cliente!", error);
        res.sendStatus(500);
    }
}