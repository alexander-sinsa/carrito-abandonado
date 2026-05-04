import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('_page') || '1';
  const limitParam = searchParams.get('limit') || '50';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const email = searchParams.get('email');
  
  const page = parseInt(pageParam, 10) > 0 ? parseInt(pageParam, 10) : 1;
  const limit = parseInt(limitParam, 10) > 0 ? parseInt(limitParam, 10) : 50;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const VTEX_API_APP_KEY = process.env.VTEX_API_APP_KEY;
  const VTEX_API_APP_TOKEN = process.env.VTEX_API_APP_TOKEN;

  if (!VTEX_API_APP_KEY || !VTEX_API_APP_TOKEN) {
    return NextResponse.json(
      { error: 'Missing VTEX API Credentials in .env' },
      { status: 500 }
    );
  }

  let vtexUrl = `https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=firstName,lastName,email,homePhone,rclastcart,createdIn,checkouttag,updatedIn&_sort=createdIn DESC`;
  
  let whereClauses = [];
  if (startDate && endDate) {
    whereClauses.push(`(createdIn between '${startDate}T00:00:00.000Z' and '${endDate}T23:59:59.999Z')`);
  } else if (startDate) {
    whereClauses.push(`(createdIn between '${startDate}T00:00:00.000Z' and '2099-12-31T23:59:59.999Z')`);
  } else if (endDate) {
    whereClauses.push(`(createdIn between '2000-01-01T00:00:00.000Z' and '${endDate}T23:59:59.999Z')`);
  }
  
  if (whereClauses.length > 0) {
    vtexUrl += `&_where=${encodeURIComponent(whereClauses.join(' AND '))}`;
  }

  if (email) {
    vtexUrl += `&email=${encodeURIComponent(email)}`;
  }

  try {
    const response = await fetch(vtexUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': VTEX_API_APP_KEY,
        'X-VTEX-API-AppToken': VTEX_API_APP_TOKEN,
        'REST-Range': `resources=${start}-${end}`
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VTEX API Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch from VTEX API', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Leer contactos excluidos
    let excludedEmails: string[] = [];
    let excludedPhones: string[] = [];
    try {
      const excludedPath = path.join(process.cwd(), 'excluded-contacts.json');
      if (fs.existsSync(excludedPath)) {
        const excludedData = JSON.parse(fs.readFileSync(excludedPath, 'utf8'));
        excludedEmails = (excludedData.emails || []).map((e: string) => e.toLowerCase().trim());
        excludedPhones = (excludedData.phones || []).map((p: string) => p.replace(/\D/g, ''));
      }
    } catch (e) {
      console.error('Error reading excluded-contacts.json', e);
    }

    const filter = searchParams.get('filter');
    
    let withCarts = Array.isArray(data) 
      ? data.filter(client => {
          if (!client.rclastcart || client.rclastcart.trim() === '') return false;
          
          if (client.checkouttag?.DisplayValue === 'Finalizado') return false;
          
          // Filtrar excluidos
          if (client.email && excludedEmails.includes(client.email.toLowerCase().trim())) return false;
          if (client.homePhone) {
            const cleanPhone = client.homePhone.replace(/\D/g, '');
            if (excludedPhones.some(p => cleanPhone.includes(p) || p.includes(cleanPhone))) return false;
          }
          
          return true;
        })
      : [];
      
    if (filter === 'email') {
      withCarts = withCarts.filter(client => client.email && client.email.trim() !== '');
    } else if (filter === 'phone') {
      withCarts = withCarts.filter(client => client.homePhone && client.homePhone.trim() !== '');
    }

    // Si se está filtrando por email y hay resultados, procesar rclastcart
    if (email && withCarts.length > 0) {
      const client = withCarts[0];
      const cartStr = client.rclastcart;
      
      let parsedItems: any[] = [];
      let parsedJson: any = null;
      let isQueryString = false;

      // Intentar parsear como URL params
      if (cartStr.startsWith('add?')) {
        isQueryString = true;
        const paramsStr = cartStr.replace('add?', '');
        const params = new URLSearchParams(paramsStr);
        const skus = params.getAll('sku');
        const qtys = params.getAll('qty');
        const sellers = params.getAll('seller');
        
        parsedItems = skus.map((sku, i) => ({
          sku,
          qty: parseInt(qtys[i] || '1', 10),
          seller: sellers[i] || '1'
        }));
      } else {
        // Intentar JSON
        try {
          parsedJson = JSON.parse(cartStr);
        } catch(e) {}
      }

      // Si es un Query String válido con SKUs, buscar nombres y precios
      if (isQueryString && parsedItems.length > 0) {
        try {
          // Construir fq=skuId:xxx para todos los SKUs
          const fqParams = parsedItems.map(item => `fq=skuId:${item.sku}`).join('&');
          const searchUrl = `https://b2csinsa.vtexcommercestable.com.br/api/catalog_system/pub/products/search?${fqParams}`;
          
          const searchRes = await fetch(searchUrl, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
          });

          if (searchRes.ok) {
            const products = await searchRes.json();
            
            parsedItems = parsedItems.map(item => {
              // Buscar el producto que contiene este SKU
              const product = products.find((p: any) => 
                p.items?.some((i: any) => i.itemId === item.sku)
              );
              
              if (product) {
                const skuDetails = product.items.find((i: any) => i.itemId === item.sku);
                const price = skuDetails?.sellers?.[0]?.commertialOffer?.Price;
                const imageUrl = skuDetails?.images?.[0]?.imageUrl;
                return {
                  ...item,
                  name: product.productName,
                  price: price,
                  imageUrl: imageUrl
                };
              }
              return item;
            });
          }
        } catch (e) {
          console.error("Error fetching product details", e);
        }
      }

      // Adjuntar los items procesados al cliente
      client.parsedCartItems = isQueryString ? parsedItems : null;
      client.parsedCartJson = parsedJson;
      client.cartType = isQueryString ? 'url_params' : (parsedJson ? 'json' : 'raw');
    }

    return NextResponse.json({
      data: withCarts,
      totalFetched: Array.isArray(data) ? data.length : 0,
      totalWithCarts: withCarts.length
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
