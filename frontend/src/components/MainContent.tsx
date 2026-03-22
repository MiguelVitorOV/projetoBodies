
import "../css/main.css"
import mascote from "../img/mascote-removebg-preview.png"
const MainContent = () => {
  return (
    <div id="mainContent">
      <section id="sectionUm">
        <div id="textContent">
          <h1>Moda e Conforto para seu bebê</h1>
          <h3>Os melhores bodies para seu pequeno!</h3>
          <button className="button">Ver Produtos</button>
        </div>
      </section>
      <section id="sectionDois">
        <h1>Bodies Personalizados BereShit: Compre Online no Varejo e Atacado pelo Whatsapp!</h1>
        <div id="contentSep">
          <div className="caixinhas">
            <h3>OS MELHORES BODIES</h3>
            <h4>Com os melhores preços!</h4>
          </div>
          <div className="separador"></div>
          <div className="caixinhas">
            <h3>SEM QUANTIDADE MINIMA</h3>
            <h4>Compre de 1 até 1000 peças!</h4>
          </div>
          <div className="separador"></div>
          <div className="caixinhas">
            <h3>ENTREGA RÁPIDA</h3>
            <h4>Para todo o Brasil</h4>
          </div>
          <div className="separador"></div>
          <div className="caixinhas">
            <h3>ATÉ 3X SEM JUROS</h3>
            <h4>No cartão de crédito</h4>
          </div>
        </div>
      </section>
      <section id="sectionTres">
        <div id="sNos">
          <img src = {mascote} alt="img" />
        </div>
        <div className="textSection">
          <h1>Sobre a BereShit</h1>
          <h3>
Nascemos da paixão por vestir bem e da vontade de entregar qualidade de verdade. Na BereShit, acreditamos que a moda vai muito além de um pedaço de tecido; é sobre como você se sente quando veste algo feito com cuidado, dedicação e propósito.

Nosso processo de confecção une a tradição do trabalho bem feito com as tendências mais modernas do mercado. Cada peça que sai da nossa produção é pensada nos mínimos detalhes: desde a escolha da melhor matéria-prima até o acabamento impecável, garantindo conforto e durabilidade para o seu dia a dia.

Mais do que vender roupas, nosso objetivo é construir uma relação de confiança com você. Valorizamos o comércio justo, a transparência e, acima de tudo, a satisfação de quem veste a nossa marca. Queremos estar presentes nos seus melhores momentos, entregando um estilo autêntico e acessível.

          </h3>
          <h1>Vista-se de você mesmo. Vista BereShit.</h1>
        </div>
      </section>
    </div>
  )
}

export default MainContent
