import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Header from "./components/Header"; 
import { CartDrawer } from "./components/CartDrawer"; 

import LoginComponent from "./components/LoginComponent";
import CadastroComponent from "./components/CadastroComponent";
import MainPage from "./pages/MainPage";
import { ProductCatalog } from "./components/ProductCatalog";
import { CreateProduct } from "./components/ProductForm";
import { ProductDetails } from "./components/ProductDetails";
import { AdminPanel } from "./components/AdminPanel";
import { Checkout } from "./components/Checkout";
import { Contato } from "./components/Contato";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        
        <Header />
        <CartDrawer />

        <Routes>
          <Route path="/contato" element={<Contato/>}/>
          <Route path="/checkout" element={<Checkout/>}/>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/cadastro" element={<CadastroComponent />} />
          <Route path="/" element={<MainPage />} />
          <Route path="/catalogo" element={<ProductCatalog />} />
          <Route path="/cadastroProduct/:id?" element={<CreateProduct />} />
          <Route path="/produto/:id" element={<ProductDetails />} />
          <Route path="/admin" element={<AdminPanel/>}/>
        </Routes>
        
      </CartProvider>
    </AuthProvider>
  );
}

export default App;