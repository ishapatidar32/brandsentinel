export const notFound = (req, res) => res.status(404).json({ error: 'Route not found' });

export const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
};