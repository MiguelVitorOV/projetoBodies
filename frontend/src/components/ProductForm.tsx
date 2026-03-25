import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/CreateProduct.css';
import { useAuth } from '../context/AuthContext';

// Estado local para facilitar a digitação na tela
interface SizeStock {
  size: string;
  stockQuantity: number;
}

interface ColorGroup {
  color: string;
  sizes: SizeStock[];
}

export function CreateProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const { token, user, isAuthenticated } = useAuth();
  const { id } = useParams();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

 useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      alert("Acesso restrito a administradores.");
      navigate('/'); 
      return; 
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
  if (id) {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);  // ← Salva produto completo
        setName(data.name);
        setDescription(data.description || '');
        setPrice(data.price.toString());
        setDiscount((data.discount || 0).toString());
        setColorGroups(groupByColor(data.variants || []));
        setImagePreview(data.imageUrl);  // ← Preview original
      })
      .catch(console.error);
  }
}, [id]);


  // Agora agrupamos por cor!
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([
    { color: '', sizes: [{ size: 'P', stockQuantity: 0 }] }
  ]);

  // Adiciona uma nova cor vazia
  const handleAddColorGroup = () => {
    setColorGroups([...colorGroups, { color: '', sizes: [{ size: 'P', stockQuantity: 0 }] }]);
  };

  // Adiciona um novo tamanho DENTRO de uma cor específica
  const handleAddSizeToColor = (colorIndex: number) => {
    const newGroups = [...colorGroups];
    newGroups[colorIndex].sizes.push({ size: 'P', stockQuantity: 0 });
    setColorGroups(newGroups);
  };

  // Atualiza o nome da cor
  const handleColorChange = (index: number, value: string) => {
    const newGroups = [...colorGroups];
    newGroups[index].color = value;
    setColorGroups(newGroups);
  };

  // Atualiza o tamanho ou estoque dentro de uma cor
  const handleSizeChange = (colorIndex: number, sizeIndex: number, field: keyof SizeStock, value: string) => {
  const newGroups = [...colorGroups];
  
  if (field === 'stockQuantity') {
    const numValue = Math.max(0, Number(value) || 0);  // ← NUNCA negativo
    newGroups[colorIndex].sizes[sizeIndex].stockQuantity = numValue;
  } else {
    newGroups[colorIndex].sizes[sizeIndex].size = value;  // ← size é string
  }
  
  setColorGroups(newGroups);
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!id && !image) {  // Imagem só no CREATE
    alert("Imagem obrigatória!");
    return;
  }

  // ✅ FLATENA VARIANTS ATUAL (substitui tudo)
  const flattenedVariants = colorGroups
    .filter(group => group.color.trim())  // Remove cores vazias
    .flatMap(group => 
      group.sizes
        .filter(s => s.stockQuantity >= 0)  // Remove estoque inválido
        .map(sizeObj => ({
          color: group.color,
          size: sizeObj.size,
          stockQuantity: Number(sizeObj.stockQuantity)
        }))
    );

  console.log('📤 SALVANDO:', { name, price, variants: flattenedVariants });

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('discount', discount || '0');
  formData.append('variants', JSON.stringify(flattenedVariants));
  
  if (image) formData.append('image', image);

  const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      alert(id ? 'Atualizado!' : 'Criado!');
      navigate('/admin');
    } else {
      const errorData = await res.json();
      console.error('❌ Backend:', errorData);
      alert(`Erro: ${errorData.error}`);
    }
  } catch (error) {
    console.error('❌ Network:', error);
    alert('Erro de conexão.');
  }
};
 const groupByColor = (variants: any[]) => {
  const groups: ColorGroup[] = [];
  variants.forEach(v => {
    let group = groups.find(g => g.color === v.color);
    if (!group) {
      group = { color: v.color, sizes: [] };
      groups.push(group);
    }
    group.sizes.push({ 
      size: v.size, 
      stockQuantity: Math.max(0, v.stockQuantity) // ← Corrige negativos do banco
    });
  });
  return groups.length ? groups : [{ color: '', sizes: [{ size: 'P', stockQuantity: 0 }] }];
};

  return (
    <div className="create-product-container">
      <button className="btn-back-form" onClick={() => navigate('/catalogo')}>← Voltar</button>
      <h2 className="title">{id ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
      
      <form onSubmit={handleSubmit} className="product-form">
        
        <div className="form-group">
          <label>Nome da Peça:</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required={!id} />
        </div>

        <div className="form-group">
          <label>Descrição:</label>
          <input type='text' value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Preço (R$):</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required={!id} />
          </div>
          <div className="form-group">
            <label>Desconto (%):</label>
            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>
        </div>

  <div className="form-group">
  <label>Imagem do Produto:</label>
  <input 
  type="file" 
  accept="image/*" 
  onChange={e => {
    const file = e.target.files ? e.target.files[0] : null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (product?.imageUrl) {
      setImagePreview(product.imageUrl);  // ← Volta imagem original
    }
  }} 
  required={!id}                                
/>
  {imagePreview && (
    <img src={imagePreview} alt="Preview" className="image-preview" />
  )}
</div>


        <div className="variants-section">
          <h3>Cores e Tamanhos (Estoque)</h3>
          
          {colorGroups.map((group, colorIndex) => (
            <div key={colorIndex} className="color-group-box">
              <div className="form-group color-input-group">
                <label>Cor {colorIndex + 1}:</label>
                <input 
                  type="text" 
                  placeholder="Ex: Azul Marinho" 
                  value={group.color} 
                  onChange={e => handleColorChange(colorIndex, e.target.value)} 
                  required={!id} 
                />
              </div>

              <div className="sizes-container">
                <label className="sizes-label">Tamanhos desta cor:</label>
                {group.sizes.map((sizeObj, sizeIndex) => (
                  <div key={sizeIndex} className="size-row">
                    <select 
                      value={sizeObj.size} 
                      onChange={e => handleSizeChange(colorIndex, sizeIndex, 'size', e.target.value)} 
                      required={!id} 
                    >
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    </select>
                    <input 
  type="number" 
  placeholder="Qtd no Estoque" 
  value={sizeObj.stockQuantity || 0} 
  // ← NUNCA negativo
  onChange={e => handleSizeChange(colorIndex, sizeIndex, 'stockQuantity', e.target.value)}
/>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => handleAddSizeToColor(colorIndex)} 
                  className="btn-add-size"
                >
                  + Adicionar outro tamanho em {group.color || 'nesta cor'}
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddColorGroup} className="btn-add-color">
            + Adicionar Nova Cor
          </button>
        </div>

        <button type="submit" className="btn-submit">Salvar Produto</button>
      </form>
    </div>
  );
}