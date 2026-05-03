import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testSorting() {
  const VTEX_API_APP_KEY = process.env.VTEX_API_APP_KEY;
  const VTEX_API_APP_TOKEN = process.env.VTEX_API_APP_TOKEN;

  const url = `https://b2csinsa.vtexcommercestable.com.br/api/dataentities/CL/search?_fields=firstName,lastName,email,homePhone,rclastcart,updatedIn&_sort=updatedIn DESC`;
  
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': VTEX_API_APP_KEY || '',
      'X-VTEX-API-AppToken': VTEX_API_APP_TOKEN || '',
      'REST-Range': 'resources=0-5'
    }
  });

  console.log('Status:', res.status);
  console.log('Total Resources:', res.headers.get('REST-Content-Range'));
  if (res.ok) {
    const data = await res.json();
    data.forEach((d: any) => console.log(d.email, d.updatedIn, !!d.rclastcart));
  } else {
    console.log('Error:', await res.text());
  }
}

testSorting();
