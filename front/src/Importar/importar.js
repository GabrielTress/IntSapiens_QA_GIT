import React, { useState, useEffect } from 'react';
import './importar.css';
import { useNavigate } from 'react-router-dom';



const Importar = () => {
    const [authorized, setAuthorized] = useState(false); // Estado de autorização
    const [loading, setLoading] = useState(false); // Estado de carregamento

    const navigate = useNavigate();

    useEffect(() => {
        const senha = prompt("Informe a senha"); // Solicita a senha apenas uma vez
        if (senha === 'PPCPADM') {
            setAuthorized(true); // Define como autorizado se a senha estiver correta
        } else {
            alert('Senha Incorreta!');
            window.location.href = '/'; // Redireciona para a home ou outra página
        }
    }, []);

    const handleClick = async () => {
        setLoading(true); // Inicia o carregamento

        try {
            const response = await fetch('http://192.168.0.250:9002/importar-sapiens', {
                method: 'POST'
            });

            if (response.ok) {
                alert('Dados atualizados com sucesso!');
            } else {
                alert('Erro ao atualizar dados');
            }
        } catch (error) {
            console.error('Erro ao executar a função:', error);
            alert('Erro ao executar a função');
        } finally {
            setLoading(false); // Finaliza o carregamento
        }
    };

    if (!authorized) {
        return null; // Não renderiza nada enquanto não autorizado
    }

    return (
        <div className='container-import'>
            <h2>Integrar Sapiens</h2>
            <button onClick={handleClick} disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar Dados do Sapiens'}
            </button>
            <button className="button" onClick={() => navigate('/')}>
                Voltar
            </button>
            {loading && <p>Carregando, por favor aguarde...</p>}
        </div>
    );
};

export default Importar;
