import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';

// Tipagem dos dados do usuário
interface User {
  id: string; // Aquele ID que você vai usar pro MercadoPago depois
  name: string;
  email: string;
  token: string;
}

// Tipagem do que o Contexto vai fornecer para a aplicação
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Criando o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider que vai envolver a aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Assim que o app carregar, verifica se o usuário já estava logado (salvo no LocalStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('@Bereshit:user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Função para logar o usuário
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('@Bereshit:user', JSON.stringify(userData));
  };

  // Função para deslogar
  const logout = () => {
    setUser(null);
    localStorage.removeItem('@Bereshit:user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do Contexto nos componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthProvider