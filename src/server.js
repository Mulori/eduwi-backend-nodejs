require('dotenv/config');

const express = require('express');
const routes = require('./routes');
const routeActivity = require('./routes/routeActivity');
const routeUser = require('./routes/routeUser');
const routeConfig = require('./routes/routeConfig');
const routeWelcome = require('./routes/routeWelcome');
const app = express();

app.use(express.json());
app.use(routes);
app.use(routeActivity);
app.use(routeUser);
app.use(routeConfig);
app.use(routeWelcome);

app.listen(process.env.PORT || 8182);
