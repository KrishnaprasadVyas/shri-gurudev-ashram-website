import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../utils/helpers";

const ProductCard = ({ product }) => {
  const { i18n } = useTranslation();

  const getLocalizedText = (value) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      return value[i18n.language] || value.en || value.hi || value.mr || "";
    }
    return "";
  };

  return (
    <Link to={`/shop/${product.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-amber-100">
        <div className="relative h-64 overflow-hidden">
          <img
            src={product.image}
            alt={getLocalizedText(product.name)}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-amber-900 mb-2 line-clamp-2">
            {getLocalizedText(product.name)}
          </h3>
          <p className="text-2xl font-bold text-amber-700 mb-2">
            {formatCurrency(product.price)}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {getLocalizedText(product.description)}
          </p>
          {product.stock < 10 && product.stock > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              Only {product.stock} left!
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-sm text-red-600 mt-2">Out of Stock</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
