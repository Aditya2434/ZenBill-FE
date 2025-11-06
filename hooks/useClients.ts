import { useState, useCallback, useEffect } from 'react';
import { Client } from '../types';
import { apiListClients, apiCreateClient, apiUpdateClient, apiDeleteClient, apiGetClient } from '../utils/api';

const initialClients: Client[] = [];

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [isLoadingClients, setIsLoadingClients] = useState<boolean>(false);
    const [clientsError, setClientsError] = useState<string>('');

    const refreshClients = useCallback(async () => {
        setIsLoadingClients(true);
        setClientsError('');
        try {
            const body = await apiListClients();
            const list = Array.isArray(body) ? body : (Array.isArray((body as any)?.data) ? (body as any).data : []);
            const mapped: Client[] = list.map((c: any) => ({
                id: String(c.id ?? c.clientId ?? ''),
                name: String(c.clientName ?? c.name ?? ''),
                email: '',
                address: c.clientAddress ?? c.address ?? '',
                gstin: c.gstinNo ?? c.gstin ?? '',
                state: c.state ?? '',
                stateCode: c.code ?? '',
            }));
            setClients(mapped.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (e: any) {
            setClientsError(e?.message || 'Failed to load clients');
        } finally {
            setIsLoadingClients(false);
        }
    }, []);

    useEffect(() => {
        refreshClients();
    }, [refreshClients]);

    const addClient = useCallback(async (client: Omit<Client, 'id' | 'email'>) => {
        const body = {
            name: client.name,
            address: client.address,
            gstin: client.gstin,
            state: client.state,
            stateCode: client.stateCode,
        };
        const created = await apiCreateClient(body);
        const d: any = (created as any)?.data ?? created;
        const newClient: Client = {
            id: String(d?.id ?? `client-${Date.now()}`),
            name: String(d?.clientName ?? client.name),
            email: '',
            address: d?.clientAddress ?? client.address,
            gstin: d?.gstinNo ?? client.gstin,
            state: d?.state ?? client.state,
            stateCode: d?.code ?? client.stateCode,
        };
        setClients(current => [newClient, ...current].sort((a,b) => a.name.localeCompare(b.name)));
    }, []);

    const updateClient = useCallback(async (updatedClient: Client) => {
        await apiUpdateClient(updatedClient.id, {
            name: updatedClient.name,
            address: updatedClient.address,
            gstin: updatedClient.gstin,
            state: updatedClient.state,
            stateCode: updatedClient.stateCode,
        });
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c).sort((a,b) => a.name.localeCompare(b.name)));
    }, []);

    const deleteClient = useCallback(async (clientId: string) => {
        await apiDeleteClient(clientId);
        setClients(prev => prev.filter(c => c.id !== clientId));
    }, []);

    return { clients, addClient, updateClient, deleteClient, isLoadingClients, clientsError, refreshClients };
};
