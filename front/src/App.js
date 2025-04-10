import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Home/home';
import Sequenciamento from './Sequenciamento/sequenciamento';
import Apontamento from './Apontamento/apontamento';
import Componentes from './Componentes/componentes';
import Repasse from './Repasse/repasse';
import Frame from './Frame/frame';
import ApontamentoFinger from './ApontamentoFinger/apontamentoFinger';
import Importar from './Importar/importar';
import './App.css';



const App = () => {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sequenciamento" element={<Sequenciamento />} />
        <Route path="/apontamento" element={<Apontamento />} />
        <Route path="/componentes" element={<Componentes />} />
        <Route path="/repasse" element={<Repasse />} />
        <Route path="/frame" element={<Frame />} />
        <Route path="/importar-sapiens" element={<Importar />} />
        <Route path="/apontamentoFinger" element={<ApontamentoFinger/>}/>
      </Routes>
    </Router>
  );

};

export default App;


