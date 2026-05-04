import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const VTEX_API_APP_KEY = process.env.VTEX_API_APP_KEY;
const VTEX_API_APP_TOKEN = process.env.VTEX_API_APP_TOKEN;

async function testVtexAllFields() {
  const headers = {
    'Accept': 'application/json',
    'X-VTEX-API-AppKey': VTEX_API_APP_KEY!,
    'X-VTEX-API-AppToken': VTEX_API_APP_TOKEN!,
    'REST-Range': 'resources=0-50'

  };

  const url = `https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=checkouttag,rclastcart,createdIn,email,updatedIn&_sort=createdIn DESC`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data.slice(0, 10), null, 2));
}

testVtexAllFields().catch(console.error);



