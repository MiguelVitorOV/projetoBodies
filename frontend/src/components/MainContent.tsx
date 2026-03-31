import { useNavigate } from 'react-router-dom';
import "../css/main.css";
import mascote from "../img/mascote-removebg-preview.png";

const MainContent = () => {
  const navigate = useNavigate();

  return (
    <div id="mainContent">
      
      {/* SEÇÃO 1: Banner Principal */}
      <section id="heroSection">
        <div className="hero-overlay"></div>
        <div id="textContent">
          <h1>Moda e Conforto para seu bebê</h1>
          <h3>Os melhores bodies com o carinho que seu pequeno merece.</h3>
          
          {/* Botão agora leva para o catálogo de verdade! */}
          <button className="btn-primary" onClick={() => navigate('/catalogo')}>
            Ver Produtos
          </button>
        </div>
      </section>

      {/* SEÇÃO 2: Diferenciais da Marca */}
      <section id="benefitsSection">
        <h2 className="section-title">Bodies Personalizados BereShit</h2>
        <p className="section-subtitle">Compre Online no Varejo e Atacado pelo WhatsApp!</p>
        
        <div id="contentSep">
          <div className="caixinha">
            <span className="material-symbols-outlined benefit-icon">check_circle</span>
            <h3>OS MELHORES BODIES</h3>
            <h4>Com os melhores preços!</h4>
          </div>
          
          <div className="separador"></div>
          
          <div className="caixinha">
            <span className="material-symbols-outlined benefit-icon">inventory_2</span>
            <h3>SEM QUANTIDADE MÍNIMA</h3>
            <h4>Compre de 1 até 100.000 peças!</h4>
          </div>
          
          <div className="separador"></div>
          
          <div className="caixinha">
            <span className="material-symbols-outlined benefit-icon">local_shipping</span>
            <h3>ENTREGA RÁPIDA</h3>
            <h4>Para todo o Brasil</h4>
          </div>
          
          <div className="separador"></div>
          
        </div>
      </section>

      {/* SEÇÃO 3: Sobre a Empresa */}
      <section id="aboutSection">
        <div className="about-image">
          <img src={mascote} alt="Mascote BereShit" />
        </div>
        
        <div className="about-text">
          <h2>Sobre a BereShit</h2>
          <p>
            Nascemos da paixão por vestir bem e da vontade de entregar qualidade de verdade. Na BereShit, acreditamos que a moda vai muito além de um pedaço de tecido; é sobre como você se sente quando veste algo feito com cuidado, dedicação e propósito.
          </p>
          <p>
            Nosso processo de confecção une a tradição do trabalho bem feito com as tendências mais modernas do mercado. Cada peça que sai da nossa produção é pensada nos mínimos detalhes: desde a escolha da melhor matéria-prima até o acabamento impecável, garantindo conforto e durabilidade para o seu dia a dia.
          </p>
          <p>
            Mais do que vender roupas, nosso objetivo é construir uma relação de confiança com você. Valorizamos o comércio justo, a transparência e, acima de tudo, a satisfação de quem veste a nossa marca. Queremos estar presentes nos seus melhores momentos, entregando um estilo autêntico e acessível.
          </p>
          <h3 className="about-highlight">Vista-se de você mesmo. Vista BereShit.</h3>
        </div>
      </section>

    </div>
  )
}

export default MainContent;