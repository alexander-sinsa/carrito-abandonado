const VTEX_API_APP_KEY = process.env.VTEX_API_APP_KEY;
const VTEX_API_APP_TOKEN = process.env.VTEX_API_APP_TOKEN;

async function testVtex() {
  const url1 = 'https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=email,createdIn&_sort=createdIn DESC&_page=1&_per_page=100';
  
  const headers = {
    'Accept': 'application/json',
    'X-VTEX-API-AppKey': VTEX_API_APP_KEY!,
    'X-VTEX-API-AppToken': VTEX_API_APP_TOKEN!,
  };

  const res1 = await fetch(url1, { headers });
  const data1 = await res1.json();
  console.log('Result with _per_page=100: length =', Array.isArray(data1) ? data1.length : data1);

  const url2 = 'https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=email,createdIn&_sort=createdIn DESC';
  const headers2 = {
    ...headers,
    'REST-Range': 'resources=0-149'
  };
  const res2 = await fetch(url2, { headers: headers2 });
  const data2 = await res2.json();
  console.log('Result with REST-Range 0-149: length =', Array.isArray(data2) ? data2.length : data2);
}

testVtex().catch(console.error);
