// src/components/Footer.tsx
import "../css/footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        
        <div className="footer-column">
          <h3>Sua Marca</h3>
          <p>Vestindo você com conforto e estilo.</p>
        </div>

        <div className="footer-column">
          <h3>Links Úteis</h3>
          <a href="/produtos">Catálogo</a>
          <a href="/sobre">Sobre Nós</a>
          <a href="/contato">Contato</a>
        </div>

        <div className="footer-column">
          <h3>Redes Sociais</h3>
          <p>@suamarca.oficial</p>
          <p>(00) 90000-0000</p>
        </div>

      </div>
      
      <div className="footer-copyright">
        &copy; {new Date().getFullYear()} Sua Marca. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;