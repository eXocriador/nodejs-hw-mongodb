import { Router } from 'express';

const welcomeRoute = Router();

welcomeRoute.get('/', (req, res) => {
  const host = req.get('host');
  res.json({
    message: 'Welcome to Contacts API!',
    availableRoutes: {
      getAllContacts: `http://${host}/contacts`,
    },
  });
});

export default welcomeRoute;
