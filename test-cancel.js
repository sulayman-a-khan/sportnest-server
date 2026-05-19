async function test() {
  try {
    const baseUrl = 'http://localhost:5000/api';
    
    // Login
    let cookieStr = '';
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test1@example.com',
        password: 'Password123'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.log('Login failed', loginData);
      return;
    }
    
    let rawCookie = loginRes.headers.get('set-cookie');
    if (rawCookie) cookieStr = rawCookie.split(';')[0];
    
    // Get bookings
    console.log('Fetching bookings...');
    const bookingsRes = await fetch(`${baseUrl}/bookings/my`, {
      method: 'GET',
      headers: { 'Cookie': cookieStr || '' }
    });
    
    const bookingsData = await bookingsRes.json();
    console.log(`Found ${bookingsData.count} bookings.`);
    
    if (bookingsData.count > 0) {
      const firstBooking = bookingsData.data[0];
      console.log(`Attempting to cancel booking: ${firstBooking._id}`);
      
      const cancelRes = await fetch(`${baseUrl}/bookings/${firstBooking._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Cookie': cookieStr || '', 'Content-Type': 'application/json' }
      });
      
      console.log('Cancel Status:', cancelRes.status);
      const cancelData = await cancelRes.json();
      console.log('Cancel Response:', cancelData);
    } else {
      console.log('No bookings to cancel. The user must have a booking to test this.');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
