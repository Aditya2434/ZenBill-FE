import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { PlusIcon } from "./icons";
import { Toast, ToastType } from "./Toast";
import { DataTable } from "./DataTable";

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
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: string;
    name?: string;
  }>({ open: false });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

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
    // Convert UOM input to uppercase
    const processedValue = name === "uom" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const missingFields: string[] = [];
    if (!formData.name?.trim()) missingFields.push("Product Name");
    if (!formData.hsnCode?.trim()) missingFields.push("HSN Code");
    if (!formData.uom?.trim()) missingFields.push("UOM");

    if (missingFields.length > 0) {
      setErrorMsg(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingProduct) {
        updateProduct({ ...editingProduct, ...formData });
        showToast(`Product "${formData.name}" updated successfully!`, "success");
      } else {
        await addProduct(formData);
        showToast(`Product "${formData.name}" added successfully!`, "success");
        setFormData(emptyProduct);
      }
      setEditingProduct(null);
    } catch (err: any) {
      showToast(err?.message || "Operation failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setTimeout(() => {
      const productForm = document.getElementById("product-form");
      if (productForm) {
        productForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo(0, 0);
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const confirmDeleteProduct = (product: Product) => {
    setDeleteConfirm({
      open: true,
      id: product.id,
      name: product.name,
    });
  };

  const performDeleteProduct = async () => {
    if (!deleteConfirm.id) return;
    try {
      deleteProduct(deleteConfirm.id);
      showToast(`Product "${deleteConfirm.name}" deleted successfully!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete product", "error");
    } finally {
      setDeleteConfirm({ open: false });
    }
  };

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
      
      {/* PREMIUM FORM SECTION */}
      <div
        id="product-form"
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {editingProduct
              ? `Updating catalog details for ${editingProduct.name}`
              : "Register a new item or service to your catalog."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 flex items-center shadow-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., High Alumina Fire Brick"
                className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="hsnCode" className="block text-sm font-semibold text-gray-700 mb-1.5">
                HSN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hsnCode"
                id="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                required
                placeholder="e.g., 69021010"
                className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono sm:text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="uom" className="block text-sm font-semibold text-gray-700 mb-1.5">
                UOM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="uom"
                id="uom"
                value={formData.uom}
                onChange={handleInputChange}
                placeholder="PCS, KG, etc."
                required
                className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-100">
            {editingProduct && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
            )}
            {(() => {
              const missingFields: string[] = [];
              if (!formData.name?.trim()) missingFields.push("Product Name");
              if (!formData.hsnCode?.trim()) missingFields.push("HSN Code");
              if (!formData.uom?.trim()) missingFields.push("UOM");
              const isDisabled = missingFields.length > 0 || isSubmitting;

              return (
                <button
                  disabled={isDisabled}
                  type="submit"
                  className={`inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${
                    isDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow"
                  }`}
                >
                  {isSubmitting ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <PlusIcon className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting
                    ? editingProduct
                      ? "Saving..."
                      : "Adding..."
                    : editingProduct
                    ? "Save Changes"
                    : "Add Product"}
                </button>
              );
            })()}
          </div>
        </form>
      </div>

      {/* PREMIUM LIST SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 ring-1 ring-black/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Product Catalog</h2>
            <p className="text-sm text-gray-500 mt-1">Manage all items available for billing and quotations.</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-blue-600 font-medium animate-pulse">Syncing...</span>}
            {reload && (
              <button
                onClick={reload}
                className="inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="m-6 mb-0 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 shadow-sm">
            {error}
          </div>
        )}

        <div className="p-6">
          <DataTable<Product>
            data={products}
            columns={[
              {
                header: "Product Name",
                accessor: "name",
                className: "font-semibold text-gray-900",
              },
              {
                header: "HSN Code",
                accessor: (product) => (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {product.hsnCode || "-"}
                  </span>
                ),
              },
              {
                header: "UOM",
                accessor: (product) => (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/20">
                    {product.uom || "-"}
                  </span>
                ),
              },
              {
                header: "Actions",
                className: "text-right",
                accessor: (product) => (
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(product);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Edit Product"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteProduct(product);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      title="Delete Product"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ),
              },
            ]}
            searchable={true}
            searchPlaceholder="Search catalog..."
            searchKeys={["name", "hsnCode", "uom"]}
            itemsPerPage={10}
            emptyMessage="Your catalog is empty. Add a product above to get started."
          />
        </div>
      </div>

      {/* PREMIUM DELETE MODAL */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 transform transition-all scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              Delete Product
            </h3>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Are you sure you want to permanently remove <span className="font-semibold text-gray-700">"{deleteConfirm.name}"</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false })}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDeleteProduct}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};