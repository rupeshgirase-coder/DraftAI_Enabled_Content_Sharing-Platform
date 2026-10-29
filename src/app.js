const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root / Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    platform: "Akatsuki's Draft API",
    event: 'Nodevember 4.0',
    description: 'AI-Enabled Content Sharing Platform Backend',
    status: 'online',
    endpoints: {
      auth: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me'],
      posts: [
        'POST /posts',
        'GET /posts',
        'GET /posts/:id',
        'GET /posts/my-posts',
        'PATCH /posts/:id',
        'DELETE /posts/:id',
      ],
      admin: [
        'GET /admin/posts/pending',
        'PATCH /admin/posts/approve/:id',
        'PATCH /admin/posts/reject/:id',
      ],
      ai: ['POST /ai/improve/:postId'],
    },
  });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
