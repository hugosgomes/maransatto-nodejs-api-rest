const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;

//RETORNA TODOS OS PEDIDOS
router.get('/', (req, res, next) => {

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            `SELECT pedidos.id_pedido,
                pedidos.quantidade,
                produtos.id_produto,
                produtos.nome,
                produtos.preco
            FROM pedidos INNER JOIN produtos
            ON produtos.id_produto = pedidos.id_produto;`,
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                console.log(result);

                const response = {
                    quantidadePedidos: result.length,
                    pedidos: result.map(pedido => {
                        const {id_pedido, quantidade, id_produto, nome, preco} = pedido;
                        return{
                            id_pedido,
                            quantidade,
                            produto: {
                                id_produto,
                                nome,
                                preco
                            },
                            total: quantidade * preco,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna todos os pedidos',
                                url: `http://localhost:3000/pedidos/${id_pedido}`
                            }
                        }
                    })
                };

                return res.status(200).send(response);
            }
        );
    });
});

//INSERE UM PEDIDO
router.post('/', (req, res, next) => {
    const { id_produto, quantidade } = req.body;

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'SELECT * FROM produtos WHERE id_produto = ?',
            [id_produto],
            (error, result, field) => {                
                if (error) return res.status(500).send({error});

                if (result.length === 0) {
                    conn.release();
                    return res.status(404).send({
                        mensagem: 'Produto não encontrado'
                    });
                }

                conn.query(
                    'INSERT INTO pedidos (id_produto, quantidade) VALUES (?,?);',
                    [id_produto, quantidade],
                    (error, result, field) => {
                        conn.release();
                        if (error) return res.status(500).send({error});
        
                        const id_pedido = result.insertId;
        
                        const response = {
                            mensagem: 'Pedido inserido com sucesso',
                            pedidoCriado: {
                                id_pedido,
                                id_produto,
                                quantidade,
                                request: {
                                    tipo: 'POST',
                                    descricao: 'Insere um pedido',
                                    url: `http://localhost:3000/pedido/${id_pedido}`
                                }
                            }
                        };        
                        res.status(201).send(response);
                    }
                );
            }
        );        
    });
});

//RETORNA OS DADOS DE UM PEDIDO
router.get('/:id_pedido', (req, res, next) => {
    const {id_pedido} = req.params;
    
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            `SELECT pedidos.id_pedido,
                pedidos.quantidade,
                produtos.id_produto,
                produtos.nome,
                produtos.preco
            FROM pedidos INNER JOIN produtos
            ON produtos.id_produto = pedidos.id_produto WHERE id_pedido = ?;`,
            [id_pedido],
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado pedido com este ID'
                    });
                }

                const {id_pedido, quantidade, id_produto, nome, preco} = result[0];

                const response = {
                    id_pedido,
                    quantidade,
                    produto: {
                        id_produto,
                        nome,
                        preco
                    },
                    total: quantidade * preco,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna os detalhes de um pedido específico',
                            url: `http://localhost:3000/pedidos/`
                        }
                    }
                return res.status(200).send(response);
            }
        );
    });
});

//DELETA UM PEDIDO
router.delete('/', (req, res, next) => {
    const id = req.body.id_pedido;

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'DELETE FROM pedidos WHERE id_pedido = ?;',
            [id],
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado pedido com este ID'
                    });
                }

                const response = {
                    request: {
                        tipo: 'DELETE',
                        descricao: 'Pedido deletado com sucesso',
                    }
                };

                return res.status(202).send(response);
            }
        );
    });
});

module.exports = router;