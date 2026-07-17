const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });
const client = axios.create({ httpsAgent: agent, maxRedirects: 0, validateStatus: s => s >= 200 && s < 400 });

async function run() {
  const getRes = await client.get('https://accsoft.lnctu.ac.in/AccSoft2/StudentLogin.aspx');
  const $ = cheerio.load(getRes.data);
  const payload = {};
  $('input').each((i, el) => {
    if ($(el).attr('name')) {
      payload[$(el).attr('name')] = $(el).val() || '';
    }
  });
  payload['ctl00$cph1$rdbtnlType'] = '2';
  payload['ctl00$cph1$txtStuUser'] = 'lncdbtc11213';
  payload['ctl00$cph1$txtStuPsw'] = '23112003';
  payload['ctl00$cph1$btnStuLogin'] = 'Login »';
  
  const postRes = await client.post('https://accsoft.lnctu.ac.in/AccSoft2/StudentLogin.aspx', qs.stringify(payload), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: getRes.headers['set-cookie'] }
  });
  
  let cookies = [];
  if (getRes.headers['set-cookie']) cookies = cookies.concat(getRes.headers['set-cookie']);
  if (postRes.headers['set-cookie']) cookies = cookies.concat(postRes.headers['set-cookie']);
  const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
  
  const deskRes = await client.get('https://accsoft.lnctu.ac.in/AccSoft2/Parents/ParentDesk1.aspx', {
    headers: { Cookie: cookieStr, Referer: 'https://accsoft.lnctu.ac.in/AccSoft2/StudentLogin.aspx' }
  });
  
  console.log(deskRes.data.substring(0, 1000));
}
run().catch(console.error);
