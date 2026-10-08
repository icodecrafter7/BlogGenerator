import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import dns from 'dns';
import connectDB from './config/db.js';

// Configure public DNS resolvers to bypass misconfigured local router/VPN DNS servers (fixes Atlas SRV lookups)
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Route imports
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blogs.js';
import generateRoutes from './routes/generate.js';
import commentRoutes from './routes/comments.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Body parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for easy local asset loading/SSE
}));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Disable caching for dynamic API responses to prevent back-navigation stale reads
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/blogs', generateRoutes); // Merged outline, stream, inline-edit routes under /api/blogs
app.use('/api/comments', commentRoutes);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(`Unhandled Server Error: ${err.stack}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
