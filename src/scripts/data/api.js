const BASE_URL = 'https://story-api.dicoding.dev/v1';

export async function registerUser(name, email, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal register');
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal login');

  localStorage.setItem('token', data.loginResult.token);
  return data;
}

export async function fetchStories(page = 1, size = 10, location = 1) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Belum login. Silakan login dulu.');

  const response = await fetch(
    `https://story-api.dicoding.dev/v1/stories?page=${page}&size=${size}&location=${location}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil daftar story: ${errorText}`);
  }

  const result = await response.json();
  return result.listStory;
}

export async function addStory(formData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Gagal menambah story');
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function fetchStoryDetail(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/stories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Gagal mengambil detail story');
    const result = await response.json();
    return result.story;
  } catch (error) {
    console.error(error);
    return null;
  }
}
