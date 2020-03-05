const express = require('express');
const app = express();
const morgan = require('morgan');

const rotaProdutos = require('./routes/produtos');
const rotaPedidos = require('./routes/pedidos');
const rotaUsuarios = require('./routes/usuarios');

app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: false })); //apenas dados simples
app.use(express.json()); //json de entrada no body

app.use((req,res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Header', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (req.methods === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, ´POST, PATCH, DELETE, GET');
        return res.status(200).send({});
    }

    next();
});

app.use('/produtos', rotaProdutos);
app.use('/pedidos', rotaPedidos);
app.use('/usuarios', rotaUsuarios);

//Quando não encontra a rota, entra aqui
app.use((req, res, next) => {
    const erro = new Error('Não encontrado');
    erro.status = 404;
    next(erro);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    return res.send({
        erro: {
            mensagem: error.message
        }
    });
});

module.exports = app;