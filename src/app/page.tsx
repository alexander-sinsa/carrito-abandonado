'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { RefreshCcw, ShoppingCart, Mail, Phone, ChevronRight, AlertCircle, ChevronLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AbandonedCartClient, ApiResponse } from '@/types/cart';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const pageParam = searchParams.get('page');
  const filterParam = searchParams.get('filter') || 'all';
  const limitParam = searchParams.get('limit') || '50';
  const startDateParam = searchParams.get('startDate') || '';
  const endDateParam = searchParams.get('endDate') || '';
  
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const [clients, setClients] = useState<AbandonedCartClient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCarts = useCallback(async (currentPage: number, currentFilter: string, currentLimit: number, currentStart: string, currentEnd: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/carts?_page=${currentPage}&limit=${currentLimit}`;
      if (currentFilter !== 'all') {
        url += `&filter=${currentFilter}`;
      }
      if (currentStart) {
        url += `&startDate=${currentStart}`;
      }
      if (currentEnd) {
        url += `&endDate=${currentEnd}`;
      }
      const res = await fetch(url);
      const result: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setClients(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarts(page, filterParam, limit, startDateParam, endDateParam);
  }, [page, filterParam, limit, startDateParam, endDateParam, fetchCarts]);

  const updateUrl = (newPage: number, newFilter: string, newLimit: number, newStart: string, newEnd: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('filter', newFilter);
    params.set('limit', newLimit.toString());
    if (newStart) params.set('startDate', newStart); else params.delete('startDate');
    if (newEnd) params.set('endDate', newEnd); else params.delete('endDate');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNextPage = () => updateUrl(page + 1, filterParam, limit, startDateParam, endDateParam);
  const handlePrevPage = () => updateUrl(Math.max(1, page - 1), filterParam, limit, startDateParam, endDateParam);
  
  const handleTabChange = (newFilter: string) => updateUrl(1, newFilter, limit, startDateParam, endDateParam);
  
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl(1, filterParam, parseInt(e.target.value, 10), startDateParam, endDateParam);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    updateUrl(1, filterParam, limit, field === 'start' ? value : startDateParam, field === 'end' ? value : endDateParam);
  };

  const exportToCSV = () => {
    if (clients.length === 0) return;
    
    const headers = ['Cliente', 'Email', 'Teléfono', 'Fecha Creación'];
    const csvRows = [headers.join(',')];

    clients.forEach(client => {
      const name = `"${client.firstName || ''} ${client.lastName || ''}"`;
      const email = `"${client.email || ''}"`;
      const phone = `"${client.homePhone || ''}"`;
      const date = `"${client.createdIn ? format(new Date(client.createdIn), "dd MMM yyyy HH:mm", { locale: es }) : ''}"`;
      csvRows.push([name, email, phone, date].join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `carritos_${filterParam}_p${page}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              Carritos Abandonados
            </h1>
            <p className="text-slate-500 mt-1">
              Monitorea y gestiona los clientes que dejaron compras pendientes en VTEX.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={handleLimitChange}
              disabled={loading}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 por página</option>
              <option value={30}>30 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
            <Button 
              onClick={exportToCSV} 
              disabled={clients.length === 0 || loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button 
              onClick={() => fetchCarts(page, filterParam, limit, startDateParam, endDateParam)} 
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Error de Conexión</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-2 sm:pb-0 gap-4">
          <div className="flex">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filterParam === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Todos
            </button>
            <button
              onClick={() => handleTabChange('email')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filterParam === 'email' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Con email
            </button>
            <button
              onClick={() => handleTabChange('phone')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filterParam === 'phone' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Con teléfono
            </button>
          </div>
          
          <div className="flex items-center gap-2 pb-2 sm:pb-0 px-2 sm:px-0">
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-500 font-medium">Desde:</label>
              <input 
                type="date" 
                value={startDateParam}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-500 font-medium">Hasta:</label>
              <input 
                type="date" 
                value={endDateParam}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(startDateParam || endDateParam) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateUrl(1, filterParam, limit, '', '')}
                className="text-slate-500 hover:text-slate-700 h-8 px-2"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <CardTitle>Listado de Clientes</CardTitle>
            <CardDescription>
              Mostrando página {page}. {clients.length > 0 
                ? `Se encontraron ${clients.length} carritos recientes en esta página.` 
                : 'No se encontraron carritos abandonados en esta página.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading && clients.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p>Cargando información desde VTEX...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[250px]">Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client, index) => (
                      <TableRow key={client.email || index} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {client.firstName?.charAt(0) || ''}{client.lastName?.charAt(0) || ''}
                            </div>
                            <div>
                              <p className="text-slate-900">{client.firstName} {client.lastName}</p>
                              <Badge variant="outline" className="mt-1 text-xs font-normal text-slate-500">
                                B2C
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-3 w-3" />
                              {client.email || 'Sin email'}
                            </div>
                            {client.homePhone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-3 w-3" />
                                {client.homePhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-700">
                            {client.createdIn ? format(new Date(client.createdIn), "dd MMM yyyy, HH:mm", { locale: es }) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/carts/${encodeURIComponent(client.email || 'unknown')}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                              Ver Detalle
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {clients.length === 0 && !loading && !error && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                          No hay registros disponibles en esta página.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-slate-100 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <div className="text-sm text-slate-500">
              Página <span className="font-medium text-slate-900">{page}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={clients.length === 0 || loading}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando aplicación...</div>}>
      <DashboardContent />
    </Suspense>
  );
}


