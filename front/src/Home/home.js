import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';


function HomePage() {
  const navigate = useNavigate();
/*          <button 
            className="button-home" 
            onClick={() => navigate('/importar-sapiens')}>
            Importar/Atualizar Sapiens - PCP
          </button>*/
  return (
    
        <div className='container-home'>
          <h2>MADESP</h2>
          <button 
            className="button-home" 
            onClick={() => navigate('/sequenciamento')}>
            Sequenciamento de OP's
          </button>
          <button 
            className="button-home" 
            onClick={() => navigate('/repasse')}>
            Repasse Linha Pintura
          </button>
          <button 
            className="button-home" 
            onClick={() => navigate('/frame')}>
            Apontamento Nó Finger
          </button>
          <button 
            className="button-home" 
            onClick={() => navigate('/inventario')}>
            Inventário
          </button>

        </div>
  );
}

export default HomePage;