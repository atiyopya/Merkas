async function check() {
  const url = 'https://merkas.onrender.com';
  try {
    const res = await fetch(`${url}/api/carmodels`);
    const models = await res.json();
    console.log('Models on live server:', JSON.stringify(models, null, 2));
    
    const travego = models.find(m => m.name === 'TRAVEGO');
    if (travego) {
      console.log('Fetching parts for TRAVEGO id:', travego.id);
      const partsRes = await fetch(`${url}/api/carmodels/${travego.id}/parts`);
      const parts = await partsRes.json();
      console.log('Parts count on live server:', parts.length);
    } else {
      console.log('TRAVEGO not found on live server');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
check();
