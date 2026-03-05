# Tresvita Todo Frontend

**Managed by Wissen Team**

A modern React frontend for the Tresvita Todo Application. This application provides a beautiful and intuitive interface for managing todo items, integrated with the Java Spring Boot backend.

## 🚀 Features

- ✅ Create, Read, Update, Delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Filter todos (All, Active, Completed)
- ✅ Edit todos inline
- ✅ Real-time statistics
- ✅ Responsive design for all devices
- ✅ Modern UI with Bootstrap styling
- ✅ Docker containerization
- ✅ Kubernetes ready

## 🛠️ Technology Stack

- **React**: 18.x - Frontend library
- **Node.js**: 18.x - Runtime environment
- **Nginx**: Web server and reverse proxy
- **Bootstrap 5**: CSS framework
- **Font Awesome**: Icons
- **Docker**: Containerization

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker (for containerization)

## 🚀 Getting Started

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chilukavinayak/todo-frontend-eks.git
   cd todo-frontend-eks
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Access the application:**
   - Open http://localhost:3000 in your browser

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8080/api

# Other configurations
REACT_APP_APP_NAME=Tresvita Todo
REACT_APP_VERSION=1.0.0
```

### Production Build

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Serve production build:**
   ```bash
   npx serve -s build
   ```

## 🐳 Docker

### Build Docker Image

```bash
docker build -t tresvita-todo-frontend:latest .
```

### Run Docker Container

```bash
docker run -p 80:80 tresvita-todo-frontend:latest
```

### Run with Environment Variables

```bash
docker run -p 80:80 \
  -e REACT_APP_API_URL=http://backend:8080/api \
  tresvita-todo-frontend:latest
```

## ☸️ Kubernetes Deployment

The application is designed to run on AWS EKS. Use the Helm charts in the infrastructure repository:

```bash
# Deploy to EKS
helm upgrade --install todo-frontend ./helm_charts/todo-frontend \
  --namespace frontend \
  --set image.repository=<ecr-repo>/tresvita-todo-frontend \
  --set image.tag=v1.0.0 \
  --set env.REACT_APP_API_URL=http://tresvita-backend.local/api
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage --watchAll=false
```

### Lint Code

```bash
npm run lint
```

### Fix Lint Issues

```bash
npm run lint:fix
```

## 📁 Project Structure

```
todo-frontend-eks/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── TodoList.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── Dockerfile
├── nginx.conf
├── package.json
└── README.md
```

## 🔌 API Integration

The frontend communicates with the backend via REST APIs:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/todos` | GET | Get all todos |
| `/api/todos` | POST | Create new todo |
| `/api/todos/{id}` | PUT | Update todo |
| `/api/todos/{id}` | DELETE | Delete todo |
| `/api/todos/{id}/toggle` | PATCH | Toggle completion |

## 🎨 UI Components

### TodoList Component
- Displays list of todos
- Handles CRUD operations
- Manages filtering
- Shows statistics

### API Service
- Handles all HTTP requests
- Error handling
- Response parsing

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security

- Non-root user in Docker container
- Security headers configured in Nginx
- CORS enabled for API communication
- Input validation

## 🚀 Deployment Environments

### Development
```bash
npm start
```

### Staging
```bash
npm run build
# Deploy to staging EKS cluster
```

### Production
```bash
npm run build
# Deploy to production EKS cluster
```

## 📞 Support

For support, contact the **Wissen Team**.

---

**Client**: Tresvita  
**Managed by**: Wissen Team  
**Version**: 1.0.0  
**Last Updated**: 2024
