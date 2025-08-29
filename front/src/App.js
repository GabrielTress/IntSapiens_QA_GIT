import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Home/home';
import Sequenciamento from './Sequenciamento/sequenciamento';
import Apontamento from './Apontamento/apontamento';
import Componentes from './Componentes/componentes';
import Frame from './Frame/frame';
import Inventario from './Inventario/inventario';
import ApontamentoFinger from './ApontamentoFinger/apontamentoFinger';
import ConsultaDesenho from './ConsultaDesenho/consultaDesenho';
import ConsultaPedido from './ConsultaPedido/consultaPedido';
import Importar from './Importar/importar';
import Repasse from './Repasse/repasse';
import './App.css';



const App = () => {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sequenciamento" element={<Sequenciamento />} />
        <Route path="/apontamento" element={<Apontamento />} />
        <Route path="/componentes" element={<Componentes />} />
        <Route path="/frame" element={<Frame />} />
        <Route path="/repasse" element={<Repasse />} />
        <Route path="/importar-sapiens" element={<Importar />} />
        <Route path="/apontamentoFinger" element={<ApontamentoFinger/>}/>
        <Route path="/inventario" element={<Inventario/>}/>
        <Route path="/consultaDesenho" element={<ConsultaDesenho/>}/>
        <Route path="/consultaPedido" element={<ConsultaPedido/>}/>
      
      </Routes>
    </Router>
  );

};

export default App;


