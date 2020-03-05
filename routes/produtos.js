const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    }else {
        cb(null, false);
    }
}

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 *1024 * 5
    },
    fileFilter: fileFilter,
});

//RETORNA TODOS OS PRODUTOS
router.get('/', (req, res, next) => {

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'SELECT * FROM produtos;',
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                const response = {
                    quantidade: result.length,
                    produtos: result.map(prod => {

                        const {id_produto, nome, preco, produto_imagem} = prod;
                        return{
                            id_produto,
                            nome,
                            preco,
                            produto_imagem,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna todos os produtos',
                                url: `http://localhost:3000/produtos/${prod.id_produto}`
                            }
                        }
                    })
                };

                return res.status(200).send({
                    response
                });
            }
        );
    });

});

//INSERE UM PRODUTO
router.post('/', upload.single('produto_imagem'), (req, res, next) => {
    const { nome, preco } = req.body;
    const produto_imagem = req.file.path;

    console.log(req.file);
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'INSERT INTO produtos (nome, preco, produto_imagem) VALUES (?,?,?);',
            [nome, preco, produto_imagem],
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                const id_produto = result.insertId;

                const response = {
                    mensagem: 'Produto inserido com sucesso',
                    produto: {
                        id_produto,
                        nome,
                        preco,
                        produto_imagem,
                        request: {
                            tipo: 'POST',
                            descricao: 'Insere um pruduto',
                            url: `http://localhost:3000/produtos/${id_produto}`
                        }
                    }
                };

                res.status(201).send(response);
            }
        );
    });
});

//RETORNA OS DADOS DE UM PRODUTO
router.get('/:id_produto', (req, res, next) => {
    const id = req.params.id_produto;

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'SELECT * FROM produtos WHERE id_produto = ?;',
            [id],
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado produto com este ID'
                    });
                }

                const {id_produto, nome, preco, produto_imagem} = result[0];

                const response = {
                    produto: {
                        id_produto,
                        nome,
                        preco,
                        produto_imagem,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna os detalhes de um produto específico',
                            url: `http://localhost:3000/produtos/`
                        }
                    }
                };

                return res.status(200).send(response);
            }
        );
    });
});

//ATUALIZA UM PRODUTO
router.patch('/:id_produto', (req, res, next) => {
    const { id_produto, nome, preco } = req.body;

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'UPDATE produtos SET nome = ?, preco = ? WHERE id_produto = ?;',
            [nome, preco, id_produto],
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado produto com este ID'
                    });
                }

                const response = {
                    id_produto,
                    nome,
                    preco,
                    request: {
                        tipo: 'PATCH',
                        descricao: 'Produto atualizado com sucesso',
                        url: `http://localhost:3000/produtos/${id_produto}`
                    }
                };

                return res.status(202).send(response);
            }
        );
    });
});

//DELETA UM PRODUTO
router.delete('/', (req, res, next) => {
    const id = req.body.id_produto;

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({error});
        conn.query(
            'DELETE FROM produtos WHERE id_produto = ?;',
            [id],
            (error, result, field) => {
                conn.release();
                if (error) return res.status(500).send({error});

                if (result.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado produto com este ID'
                    });
                }

                const response = {
                    request: {
                        tipo: 'DELETE',
                        descricao: 'Deleta um produto',
                    }
                };

                return res.status(202).send(response);
            }
        );
    });
});

module.exports = router;