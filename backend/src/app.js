const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

// Rutas
const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const clientRoutes    = require('./routes/clients');
const saleRoutes      = require('./routes/sales');
const userRoutes      = require('./routes/users');
const categoryRoutes  = require('./routes/categories');
const materialRoutes  = require('./routes/materials');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ── Middlewares globales ──────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Rutas API ─────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/clients',    clientRoutes);
app.use('/api/sales',      saleRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials',  materialRoutes);
app.use('/api/dashboard',  dashboardRoutes);

// ── Health check ─────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'KreaLab API' }));

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ── Error handler global ──────────────────────────────
app.use(errorHandler);

module.exports = app;
