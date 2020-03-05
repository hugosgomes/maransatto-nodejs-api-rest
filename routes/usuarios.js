const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/cadastro', (req, res, next) => {
    const { email, senha } = req.body;

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        bcrypt.hash(senha, 10, (errBcrypt, hash) => {
            if(errBcrypt) { return res.status(500).send({error: errBcrypt})}
            conn.query(
                'INSERT INTO usuarios (email, senha) VALUES (?,?);',
                [email, hash],
                (error, result) => {
                    conn.release();
                    if (error) return res.status(500).send({error: error});
                    const response = {
                        mensagem: 'Usuário criado com sucesso',
                        usuarioCriado: {
                            id_usuario: result.insertId,
                            email: email,
                        }
                    }
                    return res.status(201).send(response);
                }
            );
        });
    });
});

router.post('/login', (req, res, next) => {
    const { email, senha } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({error: error})};
        const query = `SELECT * FROM usuarios WHERE email = ?`;
        conn.query(query, [email], (error, result, field) => {
            conn.release();
            if (error) { return res.status(500).send({error: error})};
            if (result.length < 1) {
                return res.status(401).send({mensagem: "Falha na autenticação"});
            }
            bcrypt.compare(senha, result[0].senha, (err, resultBcry) => {
                if (err) {
                    return res.status(401).send({mensagem: "Falha na autenticação"});
                }
                if (result) {
                    const token = jwt.sign({
                        id_usuario: result[0].id_usuario,
                        email: email,
                    }, process.env.JWT_KEY,
                    {
                        expiresIn: "1h"
                    });
                    return res.status(200).send({
                        mensagem: "Autenticado com sucesso",
                        token
                    });
                }
                return res.status(401).send({mensagem: "Falha na autenticação"});
            });
        })
    });
});

module.exports = router;