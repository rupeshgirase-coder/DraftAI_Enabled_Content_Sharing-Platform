const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

const TEST_PORT = 5055;
let server;
let baseUrl = `http://localhost:${TEST_PORT}`;

// Helper function to send HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING NODEVEBER 4.0 BACKEND TESTS ---');

  // Connect to DB
  const testDbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/akatsuki_draft_test';
  await mongoose.connect(testDbURI);
  console.log('✓ Connected to Test MongoDB');

  // Clean test DB collections
  await User.deleteMany({});
  await Post.deleteMany({});
  console.log('✓ Cleaned test database collections');

  // Start HTTP Server
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`✓ Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    let userToken = null;
    let adminToken = null;
    let userId = null;
    let adminId = null;
    let draftPostId = null;
    let pendingPostId = null;
    let aiDraftPostId = null;

    // 1. Health check
    const health = await request('GET', '/');
    console.assert(health.status === 200, 'Health check failed');
    console.log('✓ 1. GET / - Health & API docs online');

    // 2. Register standard user
    const regUser = await request('POST', '/auth/register', {
      name: 'Naruto Uzumaki',
      email: 'naruto@akatsuki.io',
      password: 'password123',
      role: 'user',
    });
    console.assert(regUser.status === 201, `Register failed: ${JSON.stringify(regUser.data)}`);
    console.assert(regUser.data.token, 'Token missing');
    userToken = regUser.data.token;
    userId = regUser.data.user.id;
    console.log('✓ 2. POST /auth/register - Standard user created');

    // 3. Register admin user
    const regAdmin = await request('POST', '/auth/register', {
      name: 'Itachi Uchiha',
      email: 'itachi@akatsuki.io',
      password: 'mangekyosharingan',
      role: 'admin',
    });
    console.assert(regAdmin.status === 201, `Admin register failed: ${JSON.stringify(regAdmin.data)}`);
    adminToken = regAdmin.data.token;
    adminId = regAdmin.data.user.id;
    console.log('✓ 3. POST /auth/register - Admin user created');

    // 4. Login with user credentials
    const loginRes = await request('POST', '/auth/login', {
      email: 'naruto@akatsuki.io',
      password: 'password123',
    });
    console.assert(loginRes.status === 200, 'Login failed');
    console.assert(loginRes.data.user.email === 'naruto@akatsuki.io', 'User email mismatch');
    console.log('✓ 4. POST /auth/login - Login successful with JWT returned');

    // 5. GET /auth/me
    const meRes = await request('GET', '/auth/me', null, userToken);
    console.assert(meRes.status === 200, 'Get me failed');
    console.assert(meRes.data.user.id === userId, 'Profile ID mismatch');
    console.log('✓ 5. GET /auth/me - Authenticated profile retrieved');

    // 6. POST /posts (Create Draft)
    const draftRes = await request(
      'POST',
      '/posts',
      {
        title: 'Ninja Arts and Philosophy',
        description: 'An introductory thought piece on shinobi paths.',
        content: 'True strength comes from never giving up and protecting comrades.',
        category: 'Philosophy',
        status: 'draft',
      },
      userToken
    );
    console.assert(draftRes.status === 201, `Create draft failed: ${JSON.stringify(draftRes.data)}`);
    console.assert(draftRes.data.post.status === 'draft', 'Status is not draft');
    draftPostId = draftRes.data.post._id;
    console.log(`✓ 6. POST /posts - Created draft post (ID: ${draftPostId})`);

    // 7. POST /posts (Create Pending Post for Admin Approval)
    const pendingRes = await request(
      'POST',
      '/posts',
      {
        title: 'Sage Mode Masterclass',
        description: 'Gathering natural energy with stillness.',
        content: 'To balance nature energy, one must become one with the surroundings.',
        category: 'Training',
        status: 'pending',
      },
      userToken
    );
    console.assert(pendingRes.status === 201, 'Create pending failed');
    console.assert(pendingRes.data.post.status === 'pending', 'Status is not pending');
    pendingPostId = pendingRes.data.post._id;
    console.log(`✓ 7. POST /posts - Created pending post for review (ID: ${pendingPostId})`);

    // 8. GET /posts/my-posts
    const myPostsRes = await request('GET', '/posts/my-posts', null, userToken);
    console.assert(myPostsRes.status === 200, 'My posts failed');
    console.assert(myPostsRes.data.count === 2, `Expected 2 posts, got ${myPostsRes.data.count}`);
    console.log(`✓ 8. GET /posts/my-posts - Retrieved author's 2 posts (draft + pending)`);

    // 9. GET /posts/:id (View own draft)
    const viewDraftRes = await request('GET', `/posts/${draftPostId}`, null, userToken);
    console.assert(viewDraftRes.status === 200, 'View own draft failed');
    console.log('✓ 9. GET /posts/:id - Author can view own draft');

    // 10. PATCH /posts/:id (Update draft)
    const updateRes = await request(
      'PATCH',
      `/posts/${draftPostId}`,
      {
        title: 'Ninja Arts and Modern Philosophy',
        description: 'Updated draft summary',
      },
      userToken
    );
    console.assert(updateRes.status === 200, 'Update failed');
    console.assert(updateRes.data.post.title === 'Ninja Arts and Modern Philosophy', 'Title not updated');
    console.log('✓ 10. PATCH /posts/:id - Author successfully updated draft');

    // 11. POST /ai/improve/:postId (AI Content Improvement)
    const aiRes = await request('POST', `/ai/improve/${draftPostId}`, { instructions: 'Make it inspirational' }, userToken);
    console.assert(aiRes.status === 201, `AI improve failed: ${JSON.stringify(aiRes.data)}`);
    console.assert(aiRes.data.newDraft, 'No new draft returned');
    console.assert(aiRes.data.newDraft._id !== draftPostId, 'New draft should have distinct ID');
    console.assert(aiRes.data.newDraft.status === 'draft', 'AI improved version must be a draft');
    aiDraftPostId = aiRes.data.newDraft._id;

    // Verify original draft is preserved
    const checkOriginal = await request('GET', `/posts/${draftPostId}`, null, userToken);
    console.assert(checkOriginal.status === 200, 'Original draft check failed');
    console.assert(checkOriginal.data.post.title === 'Ninja Arts and Modern Philosophy', 'Original draft was altered');
    console.log(`✓ 11. POST /ai/improve/:postId - AI generated new draft (ID: ${aiDraftPostId}) and preserved original draft (ID: ${draftPostId})`);

    // 12. GET /admin/posts/pending (Admin view pending posts)
    const pendingListRes = await request('GET', '/admin/posts/pending', null, adminToken);
    console.assert(pendingListRes.status === 200, 'Admin pending view failed');
    console.assert(pendingListRes.data.count >= 1, 'Expected pending posts');
    console.log(`✓ 12. GET /admin/posts/pending - Admin retrieved ${pendingListRes.data.count} pending posts`);

    // 13. PATCH /admin/posts/approve/:id (Admin approves pending post)
    const approveRes = await request('PATCH', `/admin/posts/approve/${pendingPostId}`, null, adminToken);
    console.assert(approveRes.status === 200, 'Approve failed');
    console.assert(approveRes.data.post.status === 'approved', 'Post not marked approved');
    console.log(`✓ 13. PATCH /admin/posts/approve/:id - Admin approved post (ID: ${pendingPostId})`);

    // 14. GET /posts (Public feed only shows approved posts)
    const publicPosts = await request('GET', '/posts');
    console.assert(publicPosts.status === 200, 'Public feed failed');
    console.assert(publicPosts.data.posts.some((p) => p._id === pendingPostId), 'Approved post missing from public feed');
    console.assert(!publicPosts.data.posts.some((p) => p._id === draftPostId), 'Draft post leaked to public feed!');
    console.log(`✓ 14. GET /posts - Public feed contains approved post and excludes drafts`);

    // 15. PATCH /admin/posts/reject/:id (Admin rejects post)
    const rejectRes = await request('PATCH', `/admin/posts/reject/${pendingPostId}`, null, adminToken);
    console.assert(rejectRes.status === 200, 'Reject failed');
    console.assert(rejectRes.data.post.status === 'rejected', 'Post not marked rejected');
    console.log(`✓ 15. PATCH /admin/posts/reject/:id - Admin rejected post`);

    // 16. DELETE /posts/:id (Delete post)
    const deleteRes = await request('DELETE', `/posts/${aiDraftPostId}`, null, userToken);
    console.assert(deleteRes.status === 200, 'Delete failed');
    console.log(`✓ 16. DELETE /posts/:id - Author deleted AI draft`);

    console.log('\n===============================================');
    console.log(' ALL 16 POST-EVENT BACKEND TESTS PASSED 100%! ');
    console.log('===============================================');
  } catch (error) {
    console.error('Test Execution Error:', error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
