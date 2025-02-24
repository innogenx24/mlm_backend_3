// server.js  09-01-2025 
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');
const { sequelize } = require('../models');
const path = require('path');
const cron = require('node-cron');
// s

// Routes
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const memberRoutes = require('./routes/userHierarchyGetRoutes');
const directMemberRoutes = require('./routes/userDirectHierarchyRoutes');
const orderRoutes = require('./routes/orderRouts');
const rolsRoutes = require('./routes/rolesRoutes');
const clubRoutes = require('./routes/clubRoutes');
const salesTargetrRoutes = require('./routes/salesTargetrRoutes');
const minimumStockRoutes = require('./routes/minimumStockRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const userSalesDetailRoutes = require('./routes/userSalesDetailRoutes');
const sectorAdminRoutes = require('./routes/sectorRoutes');
const notificationRoutes = require('./routes/monthly_notificationRoute/monthlyNotificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const mediaNewsRoutes = require('./routes/mediaNewsRoutes');
const deleteRequestRoutes = require('./routes/deleteRequestRoutes');

const documentRoutes = require('./routes/documentRoutes');
const editRequestRoutes = require('./routes/editRequestRoutes');
const userUpdateRoutes = require('./routes/userupdateRoutes');
const requestRoutes = require('./routes/requestRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const orderLimitRoutes = require('./routes/orderLimitRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const overalSalesRoutes = require('./routes/overall_sales_route/overalSalesRoutes');
const { sendMonthlyNotifications } = require('./controllers/notification/monthly_notification/sendMonthlyNotifications');
const sentOTPRoutes = require('./routes/sendOtpRoutes');
const fcmRoutes = require("./routes/fcmRoutes"); // Import FCM routes
const pushNotificationRoutes = require("./routes/pushNotificationRoutes");

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });



const app = express();
const port = process.env.PORT || 4000; 

dotenv.config();

// Environment Variables
const KERAMRUTH_DOMAIN_NAME = process.env.KERAMRUTH_DOMAIN_NAME;
const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const protocol = 'https';
const KERAMRUTH_ERP_DOMAIN_NAME = `${process.env.KERAMRUTH_ERP_SUBDOMAIN_PREFIX}.${KERAMRUTH_DOMAIN_NAME}`;
const server = http.createServer(app);
console.log(KERAMRUTH_ERP_DOMAIN_NAME,"product name");

// Socket.io setup
const io = new Server(server, {
});

///** For Cors Issue  **///
const corsOptions = {
  origin: (origin, callback) => {
    
    const allowedOrigins = [
      'http://localhost:5173',
      `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`,
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));


//** For Error Handaling **//
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


app.use((req, res, next) => {
  const origin = req.get('Origin'); 

  const allowedOrigins = [
    `http://localhost:5173`, 
    `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`, 
  ];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  const referrer = req.get('Referer');  // or req.headers.referer
  console.log('Origin:', origin);
  console.log('Referrer:', referrer);

  // Set response timeout (10 minutes)
  // res.setTimeout(600000, () => {
  //   console.log('Request has timed out');
  //   res.status(408).send('Request Timeout');
  // });

  // res.header('Access-Control-Allow-Origin', `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`);
  // res.header('Access-Control-Allow-Origin', `${protocol}://local${KERAMRUTH_ERP_DOMAIN_NAME}`);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Origin');
  next();
});




// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//**  Serve static files from the correct path **//
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));


// Routes
app.use('/api/salestarget', salesTargetrRoutes);
app.use('/api/delete_request', deleteRequestRoutes);

app.use('/api/sent-otp', sentOTPRoutes);


app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', (req, res, next) => {
  req.io = io;  // Pass the io object to the request
  next();
}, productRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/directMembers', directMemberRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/roles', rolsRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/minimumstock', minimumStockRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api', userUpdateRoutes);
app.use('/api/user_sales_detail', userSalesDetailRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/order-limits', orderLimitRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/announcements', (req, res, next) => {
  req.io = io;
  next();
}, announcementRoutes);

app.use('/api/media-news', (req, res, next) => {
  req.io = io;
  next();
}, mediaNewsRoutes);
app.use('/api/documents', (req, res, next) => {
  req.io = io;
  next();
}, documentRoutes);
app.use('/api/edit-requests', editRequestRoutes);
app.use('/api/sectors', sectorAdminRoutes);
app.use('/api/overall_sales', overalSalesRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cron job for monthly notifications
cron.schedule('0 12 15 * *', async () => {
  console.log('Running monthly notification job...');
  try {
    await sendMonthlyNotifications();
  } catch (error) {
    console.error('Error in monthly notification job:', error);
  }
});
//**send-notifications don't call this api --> only for development**//
app.use('/api/month_notifications', notificationRoutes);
app.use("/api/fcm", fcmRoutes); // Mount FCM routes
app.use("/api/push-notifications", pushNotificationRoutes); // Send notifications



// Start server
server.listen(port, '::', async () => {
  // server.listen(port, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');
    console.log(`Server running in ${isDevelopment ? 'development' : 'production'} mode on port ${port}`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});





















////*********  server.js  09-01-2025 working code ************/////
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// // require('dotenv').config();
// const http = require('http');
// const https = require('https');
// const fs = require('fs');
// const { Server } = require('socket.io');
// const { sequelize } = require('../models');
// const path = require('path');
// const cron = require('node-cron');

// // Routes
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
// const ordersRoutes = require('./routes/ordersRoutes');
// const orderLimitRoutes = require('./routes/orderLimitRoutes');
// const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
// const overalSalesRoutes = require('./routes/overall_sales_route/overalSalesRoutes');
// const { sendMonthlyNotifications } = require('./controllers/notification/monthly_notification/sendMonthlyNotifications');

// const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
// dotenv.config({ path: envFile });

// const app = express();
// const port = process.env.PORT || 4000;

// // Environment Variables
// const KERAMRUTH_DOMAIN_NAME = process.env.KERAMRUTH_DOMAIN_NAME;
// const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
// const protocol = 'https';
// const KERAMRUTH_ERP_DOMAIN_NAME = `${process.env.KERAMRUTH_ERP_SUBDOMAIN_PREFIX}.${KERAMRUTH_DOMAIN_NAME} `;
// const server = http.createServer(app);

// // Socket.io setup
// const io = new Server(server, {
// });

// // app.use(cors(corsOptions));
// app.use((req, res, next) => {
//   const origin = req.get('Origin');  // or req.headers.referer
//   const referrer = req.get('Referer');  // or req.headers.referer
//   console.log('Origin:', origin);
//   console.log('Referrer:', referrer);

//   // Set response timeout (10 minutes)
//   res.setTimeout(600000, () => {
//     console.log('Request has timed out');
//     res.status(408).send('Request Timeout');
//   });

//   res.header('Access-Control-Allow-Origin', `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`);
//   // res.header('Access-Control-Allow-Origin', `${protocol}://local${KERAMRUTH_ERP_DOMAIN_NAME}`);
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Origin');
//   next();
// });




// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/api/salestarget', salesTargetrRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/category', categoryRoutes);
// app.use('/api/members', memberRoutes);
// app.use('/api/directMembers', directMemberRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/roles', rolsRoutes);
// app.use('/api/club', clubRoutes);
// app.use('/api/minimumstock', minimumStockRoutes);
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api', userUpdateRoutes);
// app.use('/api/user_sales_detail', userSalesDetailRoutes);
// app.use('/api/requests', requestRoutes);
// app.use('/api/orders', ordersRoutes);
// app.use('/api/order-limits', orderLimitRoutes);
// app.use('/api/forgot-password', forgotPasswordRoutes);
// app.use('/api/announcements', (req, res, next) => {
//   req.io = io;
//   next();
// }, announcementRoutes);
// app.use('/api/documents', (req, res, next) => {
//   req.io = io;
//   next();
// }, documentRoutes);
// app.use('/api/edit-requests', editRequestRoutes);
// app.use('/api/sectors', sectorAdminRoutes);
// app.use('/api/overall_sales', overalSalesRoutes);

// app.get('/', (req, res) => {
//   res.send('Welcome to the server!');
// });

// // Socket.io events
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// // Cron job for monthly notifications
// cron.schedule('0 12 15 * *', async () => {
//   console.log('Running monthly notification job...');
//   try {
//     await sendMonthlyNotifications();
//   } catch (error) {
//     console.error('Error in monthly notification job:', error);
//   }
// });
// //**send-notifications don't call this api --> only for development**//
// app.use('/api/month_notifications', notificationRoutes);

// // Start server
// server.listen(port, '::', async () => {
//   // server.listen(port, '0.0.0.0', async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connected...');
//     console.log(`Server running in ${isDevelopment ? 'development' : 'production'} mode on port ${port}`);
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// });




















// // server.js
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// // require('dotenv').config();
// const http = require('http');
// const https = require('https');
// const fs = require('fs');
// const { Server } = require('socket.io');
// const { sequelize } = require('../models');
// const path = require('path');
// const cron = require('node-cron');

// // Routes
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
// const ordersRoutes = require('./routes/ordersRoutes');
// const orderLimitRoutes = require('./routes/orderLimitRoutes');
// const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
// const overalSalesRoutes = require('./routes/overall_sales_route/overalSalesRoutes');
// const { sendMonthlyNotifications } = require('./controllers/notification/monthly_notification/sendMonthlyNotifications');

// const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
// dotenv.config({ path: envFile });

// const app = express();
// const port = process.env.PORT || 4000;

// // Environment Variables
// const KERAMRUTH_DOMAIN_NAME = process.env.KERAMRUTH_DOMAIN_NAME;
// const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
// const protocol = isDevelopment ? 'http' : 'https';
// // const KERAMRUTH_ERP_DOMAIN_NAME = isDevelopment ? `localerp.${KERAMRUTH_DOMAIN_NAME}` : `erp.${KERAMRUTH_DOMAIN_NAME}`;
// // const KERAMRUTH_ERP_DOMAIN_NAME = process.env.KERAMRUTH_ERP_DOMAIN_NAME;
// const KERAMRUTH_ERP_DOMAIN_NAME = isDevelopment ? KERAMRUTH_DOMAIN_NAME : `erp.${KERAMRUTH_DOMAIN_NAME}`;

// // console.log(process.env.NODE_ENV)
// // console.log(isDevelopment)
// // console.log(KERAMRUTH_DOMAIN_NAME)

// // SSL Options (only in production)
// const sslOptions = isDevelopment
//   ? {}
//   : {
//       key: fs.readFileSync(`/etc/letsencrypt/live/${KERAMRUTH_DOMAIN_NAME}-0001/privkey.pem`),
//       cert: fs.readFileSync(`/etc/letsencrypt/live/${KERAMRUTH_DOMAIN_NAME}-0001/fullchain.pem`),
//     };

// // Create server (HTTP for development, HTTPS for production)
// const server = isDevelopment
//   ? http.createServer(app)
//   : https.createServer(sslOptions, app);

//   const allowedOrigins = [`${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`, `${protocol}://local${KERAMRUTH_ERP_DOMAIN_NAME}`]

// // Socket.io setup
// const io = new Server(server, {
//   cors: {
//         origin: allowedOrigins,
//         // origin: [`${protocol}://${KERAMRUTH_DOMAIN_NAME}`, `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`],
//         methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//       },
// });

//   const corsOptions = {
//     origin: allowedOrigins,
//     // origin: [`${protocol}://${KERAMRUTH_DOMAIN_NAME}`, `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
//     credentials: true,
//     preflightContinue: false,
//   };

//   console.log(corsOptions)

//   app.use(cors(corsOptions));
//   app.options('*', cors(corsOptions));
//   app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`);
//     // res.header('Access-Control-Allow-Origin', `${protocol}://local${KERAMRUTH_ERP_DOMAIN_NAME}`);
//     res.header('Access-Control-Allow-Credentials', 'true');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Origin');
//     next();
//   });
  
// // // Socket.io setup
// // const io = new Server(server, {
// //   cors: isDevelopment
// //     ? {} // No CORS for development
// //     : {
// //         origin: [`${protocol}://${KERAMRUTH_DOMAIN_NAME}`, `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`],
// //         methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //       },
// // });

// // // CORS setup (only in production)
// // if (!isDevelopment) {
// //   const corsOptions = {
// //     origin: [`${protocol}://${KERAMRUTH_DOMAIN_NAME}`, `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`],
// //     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //     allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
// //     credentials: true,
// //     preflightContinue: false,
// //   };

// //   app.use(cors(corsOptions));
// //   app.options('*', cors(corsOptions));
// //   app.use((req, res, next) => {
// //     res.header('Access-Control-Allow-Origin', `${protocol}://${KERAMRUTH_ERP_DOMAIN_NAME}`);
// //     res.header('Access-Control-Allow-Credentials', 'true');
// //     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
// //     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Origin');
// //     next();
// //   });
// // }

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/salestarget', salesTargetrRoutes);
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
// app.use('/api', userUpdateRoutes);
// app.use('/user_sales_detail', userSalesDetailRoutes);
// app.use('/api/requests', requestRoutes);
// app.use('/api/orders', ordersRoutes);
// app.use('/api/order-limits', orderLimitRoutes);
// app.use('/forgot-password', forgotPasswordRoutes);
// app.use('/announcements', (req, res, next) => {
//   req.io = io;
//   next();
// }, announcementRoutes);
// app.use('/documents', (req, res, next) => {
//   req.io = io;
//   next();
// }, documentRoutes);
// app.use('/edit-requests', editRequestRoutes);
// app.use('/sectors', sectorAdminRoutes);
// app.use('/overall_sales', overalSalesRoutes);

// app.get('/', (req, res) => {
//   res.send('Welcome to the server!');
// });

// // Socket.io events
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// // Cron job for monthly notifications
// cron.schedule('0 12 15 * *', async () => {
//   console.log('Running monthly notification job...');
//   try {
//     await sendMonthlyNotifications();
//   } catch (error) {
//     console.error('Error in monthly notification job:', error);
//   }
// });

// // Start server
// server.listen(port, async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connected...');
//     console.log(`Server running in ${isDevelopment ? 'development' : 'production'} mode on port ${port}`);
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// });
















// // server.js

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const http = require('http');
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

// const app = express();
// const port = process.env.PORT || 4000;
// const server = http.createServer(app);

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
