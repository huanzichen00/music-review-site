import api from './axios';

export const guessBandOnlineApi = {
  createRoom: (data) => api.post('/guess-band-online/rooms', data),
  joinRoom: (data) => api.post('/guess-band-online/rooms/join', data),
  getRoom: (roomCode, playerToken) => api.get(`/guess-band-online/rooms/${roomCode}`, { params: { playerToken } }),
  startRoom: (roomCode, playerToken) => api.post(`/guess-band-online/rooms/${roomCode}/start`, { playerToken }),
  nextRound: (roomCode, playerToken) => api.post(`/guess-band-online/rooms/${roomCode}/next-round`, { playerToken }),
  rematch: (roomCode, playerToken) => api.post(`/guess-band-online/rooms/${roomCode}/rematch`, { playerToken }),
  submitGuess: (roomCode, playerToken, artistId) => api.post(`/guess-band-online/rooms/${roomCode}/guess`, { playerToken, artistId }),
  getRecords: () => api.get('/guess-band-online/records'),
};
