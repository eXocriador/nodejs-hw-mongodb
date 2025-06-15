# Contacts App Backend API

This is the backend API for the Contacts App, built with Node.js, Express, and TypeScript.

## Features

- RESTful API for managing contacts
- User authentication with JWT
- File upload support with Cloudinary
- API documentation with Swagger/OpenAPI
- Rate limiting and security features

## Prerequisites

- Node.js >= 18.0.0
- MongoDB
- Cloudinary account (for file uploads)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Installation

1. Install dependencies:

```bash
yarn install
```

2. Start the development server:

```bash
yarn dev
```

3. Build for production:

```bash
yarn build
```

4. Start production server:

```bash
yarn start
```

## API Documentation

API documentation is available at `/api-docs` when the server is running. The documentation is generated using Swagger/OpenAPI.

## Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build the project
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn build-docs` - Build API documentation
- `yarn preview-docs` - Preview API documentation
