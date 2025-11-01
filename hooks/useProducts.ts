import { useEffect, useState, useCallback } from 'react';
import { Product } from '../types';
import { apiListProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct } from '../utils/api';

const initialProducts: Product[] = [];

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<string>('');

    const refreshProducts = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');
        try {
            const body = await apiListProducts();
            const list: any[] = Array.isArray(body) ? body : (Array.isArray((body as any)?.data) ? (body as any).data : []);
            const mapped: Product[] = list.map((p: any) => ({
                    id: String(p.id ?? p.productId ?? ''),
                    name: String(p.productName ?? p.name ?? ''),
                    hsnCode: p.hsnCode ?? '',
                    uom: p.uom ?? '',
                }));
            setProducts(mapped.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e: any) {
            setLoadError(e?.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProducts();
    }, [refreshProducts]);

    const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
        const body = await apiCreateProduct({
            productName: product.name,
            hsnCode: product.hsnCode || '',
            uom: product.uom || '',
        });
        const created: any = (body as any)?.data ?? body;
        const newProduct: Product = {
            id: String(created?.id ?? created?.productId ?? `prod-${Date.now()}`),
            name: String(created?.productName ?? product.name),
            hsnCode: created?.hsnCode ?? product.hsnCode,
            uom: created?.uom ?? product.uom,
        };
        setProducts(current => [newProduct, ...current].sort((a,b) => a.name.localeCompare(b.name)));
    }, []);

    const updateProduct = useCallback(async (updatedProduct: Product) => {
        try {
            await apiUpdateProduct(updatedProduct.id, {
                productName: updatedProduct.name,
                hsnCode: updatedProduct.hsnCode || '',
                uom: updatedProduct.uom || '',
            });
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name)));
        } catch (e) {
            // ignore
        }
    }, []);

    const deleteProduct = useCallback(async (productId: string) => {
        try {
            await apiDeleteProduct(productId);
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (e) {
            // ignore
        }
    }, []);

    return { products, addProduct, updateProduct, deleteProduct, isLoadingProducts: isLoading, loadError, refreshProducts };
};