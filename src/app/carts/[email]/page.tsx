'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, ShoppingBag, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AbandonedCartClient, ApiResponse } from '@/types/cart';

export default function CartDetail({ params }: { params: Promise<{ email: string }> }) {
  const resolvedParams = use(params);
  const decodedEmail = decodeURIComponent(resolvedParams.email);
  
  const [client, setClient] = useState<AbandonedCartClient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCartDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/carts?email=${encodeURIComponent(decodedEmail)}`);
        const result: ApiResponse = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch data');
        }

        if (result.data && result.data.length > 0) {
          setClient(result.data[0]);
        } else {
          setError('No se encontró información del carrito para este cliente.');
        }
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al cargar el detalle.');
      } finally {
        setLoading(false);
      }
    };

    fetchCartDetail();
  }, [decodedEmail]);

  // Format price helper
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(price);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Detalle del Carrito
            </h1>
            <p className="text-slate-500 text-sm">
              Información completa del carrito abandonado.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200 h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500">Cargando detalles...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md">
            <h3 className="text-red-800 font-medium text-lg">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <Link href="/">
              <Button variant="outline" className="mt-4 bg-white">Volver al listado</Button>
            </Link>
          </div>
        ) : client ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center mb-6">
                    <div className="h-20 w-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-2xl font-bold mb-3 shadow-inner">
                      {client.firstName?.charAt(0) || ''}{client.lastName?.charAt(0) || ''}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{client.firstName} {client.lastName}</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-slate-100 p-2 rounded-md">
                        <Mail className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="text-slate-700 font-medium truncate">{client.email}</span>
                    </div>
                    {client.homePhone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-slate-100 p-2 rounded-md">
                          <Phone className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="text-slate-700 font-medium">{client.homePhone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShoppingBag className="h-5 w-5 text-amber-500" />
                      Datos del Carrito
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Contenido crudo del campo rclastcart
                    </CardDescription>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">
                    <Clock className="h-3 w-3 mr-1" /> Abandonado
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {client.cartType === 'url_params' && client.parsedCartItems ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="w-[80px]">Imagen</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {client.parsedCartItems.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name || 'Producto'} className="w-12 h-12 object-cover rounded-md border border-slate-200" />
                                ) : (
                                  <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center border border-slate-200">
                                    <ImageIcon className="h-5 w-5 text-slate-400" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <p className="font-medium text-slate-900">{item.name || `SKU: ${item.sku}`}</p>
                                <p className="text-xs text-slate-500">SKU: {item.sku} | Vendedor: {item.seller}</p>
                              </TableCell>
                              <TableCell className="text-right font-medium">{item.qty}</TableCell>
                              <TableCell className="text-right text-slate-600">{formatPrice(item.price)}</TableCell>
                              <TableCell className="text-right font-bold text-slate-900">
                                {formatPrice(item.price ? item.price * item.qty : undefined)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-slate-500 mb-1">Total Estimado</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatPrice(
                              client.parsedCartItems.reduce((acc, item) => acc + (item.price || 0) * item.qty, 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : client.cartType === 'json' && client.parsedCartJson ? (
                    <div className="bg-slate-900 rounded-b-lg p-6 overflow-auto max-h-[500px]">
                      <pre className="text-xs text-green-400 font-mono">
                        {JSON.stringify(client.parsedCartJson, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-b-lg p-6 break-words">
                      <p className="text-slate-700 font-mono text-sm">{client.rclastcart || 'Sin información válida.'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
