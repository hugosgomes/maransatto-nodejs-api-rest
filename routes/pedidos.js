const express = require('express');
const router = express.Router();

const PedidosController = require('../controllers/pedidos-controller');

router.get('/', PedidosController.index);
router.post('/', PedidosController.store);
router.get('/:id_pedido', PedidosController.show);
router.delete('/',  PedidosController.delete);

module.exports = router;