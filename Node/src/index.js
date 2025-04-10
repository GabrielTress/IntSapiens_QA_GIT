const express = require('express');
const sequenciamentoService = require('./services/sequenciamentoService');


const app = express();
const PORT = 9002;

app.use(express.json());

app.get('/data', async (req, res) => {
    try {
        const data = await sequenciamentoService.getSequenciamentoFromSapiens();
        res.json(data);
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving data from SAPIENS', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
