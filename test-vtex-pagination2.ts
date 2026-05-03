const VTEX_API_APP_KEY = process.env.VTEX_API_APP_KEY;
const VTEX_API_APP_TOKEN = process.env.VTEX_API_APP_TOKEN;

async function testVtex() {
  const headers = {
    'Accept': 'application/json',
    'X-VTEX-API-AppKey': VTEX_API_APP_KEY!,
    'X-VTEX-API-AppToken': VTEX_API_APP_TOKEN!,
  };

  const res1 = await fetch('https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=email,createdIn&_sort=createdIn DESC&_page=1', { headers });
  const data1 = await res1.json();
  console.log('_page=1 length =', Array.isArray(data1) ? data1.length : data1);

  const res2 = await fetch('https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=email,createdIn&_sort=createdIn DESC&_page=2', { headers });
  const data2 = await res2.json();
  console.log('_page=2 length =', Array.isArray(data2) ? data2.length : data2);
}

testVtex().catch(console.error);
