# PC Deals - GPU Price Tracker

A full-stack application that tracks GPU prices from Reddit's hardware swap community, analyzes market trends, and helps users find the best deals.

## Features

- **Real-time GPU Listings**: Fetches and displays current GPU listings from Reddit's hardware swap community
- **Price Analysis**: Analyzes GPU prices and provides deal scores
- **Price History**: Tracks and displays historical price data
- **User Features**:
  - Save favorite GPUs
  - Set price alerts
  - Receive email notifications for deals

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Spring Boot (Java)
- **Database**: MySQL
- **Containerization**: Docker
- **APIs**: Reddit API, OpenAI API for price analysis

## Local Development

1. **Prerequisites**:
   - Docker and Docker Compose
   - Git

2. **Setup**:
   ```bash
   # Clone the repository
   git clone [your-repo-url]
   cd pc-deals

   # Create .env file with required environment variables
   # (See .env.example for required variables)

   # Start the application
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Environment Variables

Create a `.env` file with the following variables:
```
# Database Configuration
DB_URL=jdbc:mysql://db:3306/pc_deals
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Email Configuration
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_user_agent

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## Project Structure

```
pc-deals/
├── pc-deals-frontend/     # React frontend
├── pc-deals-backend/      # Spring Boot backend
├── init/                  # Database initialization scripts
├── docker-compose.yml     # Docker configuration
└── .env                   # Environment variables
```


This project demonstrates:
- Full-stack development with modern technologies
- RESTful API design
- Database design and management
- Containerization with Docker
- Error handling and user experience
- API integration (Reddit, OpenAI)
- Authentication and authorization
- Real-time data processing 