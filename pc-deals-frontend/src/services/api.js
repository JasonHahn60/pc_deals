const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const handleResponse = async (response) => {
  if (response.status === 429) {
    const errorText = await response.text();
    throw new Error(errorText || "Rate limit exceeded. Please try again later.");
  }
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    } catch (e) {
      // If response is not JSON, try to get text
      const errorText = await response.text();
      throw new Error(errorText || "An error occurred");
    }
  }
  return response.json();
};

export const fetchListings = async () => {
  const response = await fetch(`${API_URL}/api/gpus/listings`);
  return handleResponse(response);
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const register = async (email, password) => {
  const response = await fetch(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const addFavorite = async (userId, model, token) => {
  const response = await fetch(`${API_URL}/api/users/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, model }),
  });
  return handleResponse(response);
};

export const removeFavorite = async (userId, model, token) => {
  const response = await fetch(`${API_URL}/api/users/favorites?user_id=${userId}&model=${model}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const setNotificationPreference = async (userId, gpuModel, priceThreshold, token) => {
  const response = await fetch(
    `${API_URL}/api/notifications/preferences?userId=${userId}&gpuModel=${gpuModel}&priceThreshold=${priceThreshold}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  return handleResponse(response);
};

export const fetchOutliers = async (threshold, token) => {
  const response = await fetch(`${API_URL}/api/gpus/listings/outliers?threshold=${threshold}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const deleteOutliers = async (threshold, token) => {
  const response = await fetch(`${API_URL}/api/gpus/listings/delete-outliers?threshold=${threshold}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const fetchNewListings = async (token) => {
  const response = await fetch(`${API_URL}/api/reddit/fetch-save-new`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};
