async function test() {
  try {
    const baseUrl = 'http://localhost:5000/api';
    
    // Register or login
    let cookieStr = '';
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test1@example.com',
        password: 'Password123'
      })
    });
    
    let resData = await regRes.json();
    cookieStr = regRes.headers.get('set-cookie');
    
    if (resData.message === 'Email is already registered') {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test1@example.com',
          password: 'Password123'
        })
      });
      resData = await loginRes.json();
      cookieStr = loginRes.headers.get('set-cookie');
      console.log('Logged in', resData.user);
    } else {
      console.log('Registered', resData.user);
    }

    // Extract just the token=... part from set-cookie
    if (cookieStr) {
      cookieStr = cookieStr.split(';')[0];
    }

    console.log('Using cookie:', cookieStr);

    // Get bookings
    console.log('Fetching bookings...');
    const bookingsRes = await fetch(`${baseUrl}/bookings/my`, {
      method: 'GET',
      headers: {
        'Cookie': cookieStr || ''
      }
    });
    
    const bookingsData = await bookingsRes.json();
    console.log('Bookings Status:', bookingsRes.status);
    console.log('Bookings Response:', bookingsData);

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
