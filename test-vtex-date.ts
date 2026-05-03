const VTEX_API_APP_KEY = process.env.VTEX_API_APP_KEY;
const VTEX_API_APP_TOKEN = process.env.VTEX_API_APP_TOKEN;

async function testVtex() {
  const headers = {
    'Accept': 'application/json',
    'X-VTEX-API-AppKey': VTEX_API_APP_KEY!,
    'X-VTEX-API-AppToken': VTEX_API_APP_TOKEN!,
    'REST-Range': 'resources=0-10'
  };

  const whereClause = "(createdIn between '2024-01-01T00:00:00Z' and '2024-12-31T23:59:59Z')";
  const url = `https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=email,createdIn&_sort=createdIn DESC&_where=${encodeURIComponent(whereClause)}`;

  const res = await fetch(url, { headers });
  const data = await res.text();
  console.log('Result length:', data.length > 500 ? data.slice(0, 500) + '...' : data);
}

testVtex().catch(console.error);
