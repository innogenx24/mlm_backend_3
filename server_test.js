// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');
const { sequelize } = require('./models');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const memberRoutes = require('./src/routes/userHierarchyGetRoutes');
const directMemberRoutes = require('./src/routes/userDirectHierarchyRoutes');
const orderRoutes = require('./src/routes/orderRouts');
const rolsRoutes = require('./src/routes/rolesRoutes');
const clubRoutes = require('./src/routes/clubRoutes');
const salesTargetrRoutes = require('./src/routes/salesTargetrRoutes');
const minimumStockRoutes = require('./src/routes/minimumStockRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const userSalesDetailRoutes = require('./src/routes/userSalesDetailRoutes');
const sectorAdminRoutes = require('./src/routes/sectorRoutes');
const notificationRoutes = require('./src/routes/monthly_notificationRoute/monthlyNotificationRoutes');



const announcementRoutes = require('./src/routes/announcementRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const editRequestRoutes = require('./src/routes/editRequestRoutes');
const userUpdateRoutes = require('./src/routes/userupdateRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const ordersRoutes = require('./src/routes/ordersRoutes'); // Ensure the path is correct
const orderLimitRoutes = require('./src/routes/orderLimitRoutes'); // Adjust the path as necessary
const path = require('path');
const cron = require('node-cron');
const { sendMonthlyNotifications } = require('./src/controllers/notification/monthly_notification/sendMonthlyNotifications');
const forgotPasswordRoutes = require('./src/routes/forgotPasswordRoutes');
const overalSalesRoutes = require('./src/routes/overall_sales_route/overalSalesRoutes')

const { authMiddleware } = require('./src/middlewares/authMiddleware');

// Load SSL certificate
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/innogenxtech.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/innogenxtech.com/fullchain.pem'),
};

const app = express();
const port = process.env.PORT || 3002;
// Create HTTPS server
const server = https.createServer(sslOptions, app);

const io = new Server(server, {
  cors: {
  origin: ['http://localhost:5173', 'https://api.innogenxtech.com:3002'],
  methods: ['GET', 'POST'],
}
});

const corsOptions = {
  origin: ['https://innogenxtech.com'], // Allow local development URL and API URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include OPTIONS to support preflight requests
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true, // Allow cookies if needed (optional)
};

app.use(cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use('/salestarget', salesTargetrRoutes);

// Pass `io` to the routes where needed
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/products', productRoutes);
app.use('/category', categoryRoutes);
app.use('/members', memberRoutes);
app.use('/directMembers', directMemberRoutes);
app.use('/orders', orderRoutes);
app.use('/roles', rolsRoutes);
app.use('/club', clubRoutes);
app.use('/minimumstock', minimumStockRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/api', userUpdateRoutes); // Use /api prefix for member update route
app.use('/user_sales_detail',userSalesDetailRoutes)
app.use('/api/requests', requestRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/order-limits', orderLimitRoutes); // Mount the order limit routes
app.use('/forgot-password', forgotPasswordRoutes);

// Announcement routes
app.use('/announcements', (req, res, next) => {
  req.io = io; // Attach `io` to the request object for announcement routes
  next();
}, announcementRoutes);

// Document routes
app.use('/documents', (req, res, next) => {
  req.io = io; // Attach `io` to the request object for document routes
  next();
}, documentRoutes);

app.use('/edit-requests', editRequestRoutes);
//sector Routes
app.use('/sectors',sectorAdminRoutes);
//**Overall Sales Calcultion route**//
app.use('/overall_sales', overalSalesRoutes);



io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Schedule monthly notification job
cron.schedule('0 12 15 * *', async () => {
  console.log('Running monthly notification job...');
  try {
    await sendMonthlyNotifications();
  } catch (error) {
    console.error('Error in monthly notification job:', error);
  }
});
//**send-notifications don't call this api --> only for development**//
app.use('/month_notifications', notificationRoutes);

server.listen(port, async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');
    console.log(`Server running on port ${port}`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});





































// // server.js

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const https = require('https');
// const fs = require('fs');
// const { Server } = require('socket.io');
// const { sequelize } = require('./models');
// const adminRoutes = require('./routes/adminRoutes');
// const userRoutes = require('./routes/userRoutes');
// const productRoutes = require('./routes/productRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
// const memberRoutes = require('./routes/userHierarchyGetRoutes');
// const directMemberRoutes = require('./routes/userDirectHierarchyRoutes');
// const orderRoutes = require('./routes/orderRouts');
// const rolsRoutes = require('./routes/rolesRoutes');
// const clubRoutes = require('./routes/clubRoutes');
// const salesTargetrRoutes = require('./routes/salesTargetrRoutes');
// const minimumStockRoutes = require('./routes/minimumStockRoutes');
// const feedbackRoutes = require('./routes/feedbackRoutes');
// const userSalesDetailRoutes = require('./routes/userSalesDetailRoutes');
// const sectorAdminRoutes = require('./routes/sectorRoutes');
// const notificationRoutes = require('./routes/monthly_notificationRoute/monthlyNotificationRoutes');  



// const announcementRoutes = require('./routes/announcementRoutes');
// const documentRoutes = require('./routes/documentRoutes'); 
// const editRequestRoutes = require('./routes/editRequestRoutes'); 
// const userUpdateRoutes = require('./routes/userupdateRoutes');
// const requestRoutes = require('./routes/requestRoutes');
// const ordersRoutes = require('./routes/ordersRoutes'); // Ensure the path is correct
// const orderLimitRoutes = require('./routes/orderLimitRoutes'); // Adjust the path as necessary
// const path = require('path');
// const cron = require('node-cron');
// const { sendMonthlyNotifications } = require('./controllers/notification/monthly_notification/sendMonthlyNotifications');
// const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
// const overalSalesRoutes = require('./routes/overall_sales_route/overalSalesRoutes')

// const { authMiddleware } = require('./middlewares/authMiddleware');

// // Load SSL certificate
// const sslOptions = {
//     key: fs.readFileSync('/etc/letsencrypt/live/innogenxtech.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/innogenxtech.com/fullchain.pem'),
// };

// const app = express();
// const port = process.env.PORT || 3002;
// // Create HTTPS server
// const server = https.createServer(sslOptions, app);

// const io = new Server(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST'],
//   },
// });

// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.urlencoded({ extended: true }));
// app.use('/salestarget', salesTargetrRoutes);

// // Pass `io` to the routes where needed
// app.use('/api/admin', adminRoutes);
// app.use('/api/user', userRoutes);
// app.use('/products', productRoutes);
// app.use('/category', categoryRoutes);
// app.use('/members', memberRoutes);
// app.use('/directMembers', directMemberRoutes);
// app.use('/orders', orderRoutes);
// app.use('/roles', rolsRoutes);
// app.use('/club', clubRoutes);
// app.use('/minimumstock', minimumStockRoutes);
// app.use('/feedback', feedbackRoutes);
// app.use('/api', userUpdateRoutes); // Use /api prefix for member update route
// app.use('/user_sales_detail',userSalesDetailRoutes)
// app.use('/api/requests', requestRoutes);
// app.use('/api/orders', ordersRoutes);
// app.use('/api/order-limits', orderLimitRoutes); // Mount the order limit routes
// app.use('/forgot-password', forgotPasswordRoutes);

// // Announcement routes
// app.use('/announcements', (req, res, next) => {
//   req.io = io; // Attach `io` to the request object for announcement routes
//   next();
// }, announcementRoutes);

// // Document routes
// app.use('/documents', (req, res, next) => {
//   req.io = io; // Attach `io` to the request object for document routes
//   next();
// }, documentRoutes);

// app.use('/edit-requests', editRequestRoutes);
// //sector Routes
// app.use('/sectors',sectorAdminRoutes);
// //**Overall Sales Calcultion route**//
// app.use('/overall_sales', overalSalesRoutes);



// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// // Schedule monthly notification job
// cron.schedule('0 12 15 * *', async () => {
//   console.log('Running monthly notification job...');
//   try {
//     await sendMonthlyNotifications();
//   } catch (error) {
//     console.error('Error in monthly notification job:', error);
//   }
// });
// //**send-notifications don't call this api --> only for development**//
// app.use('/month_notifications', notificationRoutes);

// server.listen(port, async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connected...');
//     console.log(`Server running on port ${port}`);
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// });
