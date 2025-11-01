import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { PlusIcon } from "./icons";

interface ProductManagerProps {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  loading?: boolean;
  error?: string;
  reload?: () => void;
}

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  hsnCode: "",
  uom: "",
};

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  addProduct,
  updateProduct,
  deleteProduct,
  loading,
  error,
  reload,
}) => {
  const [formData, setFormData] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        hsnCode: editingProduct.hsnCode || "",
        uom: editingProduct.uom || "",
      });
    } else {
      setFormData(emptyProduct);
    }
  }, [editingProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.name) return;
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        updateProduct({ ...editingProduct, ...formData });
        setFeedback(`Product "${formData.name}" updated successfully!`);
      } else {
        await addProduct(formData);
        setFeedback(`Product "${formData.name}" added successfully!`);
        setFormData(emptyProduct);
      }
      setEditingProduct(null);
      setTimeout(() => setFeedback(""), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className="fixed top-20 right-5 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg"
          role="alert"
        >
          <p className="font-bold">Success</p>
          <p>{feedback}</p>
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {editingProduct ? "Edit Product" : "Add New Product"}
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {editingProduct
            ? `Updating details for ${editingProduct.name}`
            : "Fill in the details to add a new product."}
        </p>
        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Product Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="hsnCode"
                className="block text-sm font-medium text-gray-700"
              >
                HSN Code
              </label>
              <input
                type="text"
                name="hsnCode"
                id="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="uom"
                className="block text-sm font-medium text-gray-700"
              >
                UOM (Unit of Measurement)
              </label>
              <input
                type="text"
                name="uom"
                id="uom"
                value={formData.uom}
                onChange={handleInputChange}
                placeholder="e.g., pcs, kg, hrs"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>
          <div className="flex justify-end items-center space-x-3 pt-2">
            {editingProduct && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              disabled={isSubmitting}
              type="submit"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {isSubmitting
                ? editingProduct
                  ? "Saving..."
                  : "Adding..."
                : editingProduct
                ? "Save Changes"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Product List</h2>
          <div className="flex items-center gap-3">
            {reload && (
              <button
                onClick={reload}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
            )}
            {loading && <span className="text-xs text-gray-500">Loading…</span>}
          </div>
        </div>
        {error && (
          <div className="mx-6 mt-4 mb-0 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  HSN Code
                </th>
                <th scope="col" className="px-6 py-3">
                  UOM
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4">{product.hsnCode || "-"}</td>
                  <td className="px-6 py-4">{product.uom || "-"}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    No products found. Add one using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
