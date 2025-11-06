import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { PlusIcon } from "./icons";
import { Toast, ToastType } from "./Toast";
import { DataTable, Column } from "./DataTable";

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
    // Automatically replace any existing toast with the new one
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

    // Validate required fields
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
        showToast(
          `Product "${formData.name}" updated successfully!`,
          "success"
        );
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
    // Scroll to the form
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
      showToast(
        `Product "${deleteConfirm.name}" deleted successfully!`,
        "success"
      );
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
      <div
        id="product-form"
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
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
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="hsnCode"
                className="block text-sm font-medium text-gray-700"
              >
                HSN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hsnCode"
                id="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="uom"
                className="block text-sm font-medium text-gray-700"
              >
                UOM (Unit of Measurement){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="uom"
                id="uom"
                value={formData.uom}
                onChange={handleInputChange}
                placeholder="e.g., PCS, KG, HRS"
                required
                className="mt-1 block w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
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
            <div className="relative group">
              {(() => {
                const missingFields: string[] = [];
                if (!formData.name?.trim()) missingFields.push("Product Name");
                if (!formData.hsnCode?.trim()) missingFields.push("HSN Code");
                if (!formData.uom?.trim()) missingFields.push("UOM");
                const isDisabled = missingFields.length > 0 || isSubmitting;

                return (
                  <>
                    <button
                      disabled={isDisabled}
                      type="submit"
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isDisabled
                          ? "bg-gray-400 cursor-not-allowed"
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
                    {isDisabled &&
                      !isSubmitting &&
                      missingFields.length > 0 && (
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg max-w-xs">
                            <p className="font-semibold mb-1">
                              Please fill required fields:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {missingFields.map((field, index) => (
                                <li key={index}>{field}</li>
                              ))}
                            </ul>
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                  </>
                );
              })()}
            </div>
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
        <div className="p-6">
          <DataTable<Product>
            data={products}
            columns={[
              {
                header: "Name",
                accessor: "name",
                className: "font-medium text-gray-900",
              },
              {
                header: "HSN Code",
                accessor: "hsnCode",
              },
              {
                header: "UOM",
                accessor: "uom",
              },
            ]}
            searchable={true}
            searchPlaceholder="Search products by name, HSN code, or UOM..."
            searchKeys={["name", "hsnCode", "uom"]}
            itemsPerPage={10}
            emptyMessage="No products found. Add one using the form above."
            renderActions={(product) => (
              <>
                <button
                  onClick={() => handleEdit(product)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDeleteProduct(product)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          />
        </div>
      </div>

      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900">
              Delete product?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete "{deleteConfirm.name}"? This
              action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDeleteProduct}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
