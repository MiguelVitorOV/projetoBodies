
import '../css/ProductFilters.css';

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
}

export function ProductFilters({ searchTerm, setSearchTerm, selectedSize, setSelectedSize }: ProductFiltersProps) {
  const sizes = ['Todos', 'P', 'M', 'G', 'GG'];

  return (
    <div className="filters-container">
      <input
        type="text"
        className="search-input"
        placeholder="Buscar coleção..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="size-filters">
        {sizes.map(size => (
          <button
            key={size}
            className={`size-btn ${selectedSize === size ? 'active' : ''}`}
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}