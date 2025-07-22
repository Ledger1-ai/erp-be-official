# Varuni Backoffice - The Graine Ledger

A comprehensive AI-powered restaurant management system built with Next.js, featuring advanced scheduling, inventory management, invoicing, and analytics capabilities.

## Features

### 🎯 Core Functionality
- **AI-Powered Management**: Varuni AI assistant provides intelligent insights and recommendations
- **Restaurant-Specific Design**: Tailored for restaurant operations and workflows
- **Modern UI/UX**: Clean, responsive design with Shadcn UI components
- **Real-Time Updates**: Live data synchronization and updates

### 📊 Dashboard & Analytics
- Comprehensive performance metrics and KPIs
- Revenue tracking and forecasting
- Customer satisfaction analytics
- Staff performance monitoring
- Interactive charts and visualizations with Recharts

### 👥 Team Management
- Staff scheduling and shift management
- Performance tracking and ratings
- Role-based access control
- Toast POS integration for employee data
- Attendance and time tracking

### 📦 Inventory Management
- Real-time stock tracking
- Low stock alerts and notifications
- Supplier management
- AI-powered reorder suggestions
- Category-based organization
- Cost tracking and optimization

### 💰 Invoicing & Finance
- Invoice generation and management
- Payment tracking
- Financial analytics and reporting
- Client management
- Revenue forecasting

### 🛡️ Security & Permissions
- Role-based access control
- Custom permission system
- User management
- Session management
- Secure authentication

### 🔗 Integrations
- **Toast POS**: Sync team members, roles, and data
- **GraphQL**: Modern API architecture
- **MongoDB**: Scalable database solution
- **External APIs**: Extensible integration framework

## Technology Stack

### Frontend
- **Next.js 15.4**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Modern component library
- **Recharts**: Interactive charts and graphs
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Backend & Data
- **GraphQL**: API query language
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Apollo Client**: GraphQL client

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Tailwind CSS**: Styling
- **Git**: Version control

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (optional for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd varuni-backoffice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Demo Login
For demonstration purposes, use any valid email and password (6+ characters) to access the system.

## Project Structure

```
varuni-backoffice/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── analytics/      # Analytics & reporting
│   │   │   ├── inventory/      # Inventory management
│   │   │   ├── invoicing/      # Financial management
│   │   │   ├── scheduling/     # Staff scheduling
│   │   │   ├── settings/       # System settings
│   │   │   └── team/          # Team management
│   │   ├── login/             # Authentication
│   │   └── page.tsx           # Root page
│   ├── components/            # Reusable components
│   │   ├── layout/            # Layout components
│   │   └── ui/               # Shadcn UI components
│   └── lib/                  # Utilities and helpers
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

## Key Features Breakdown

### 🧠 Varuni AI Assistant
- **Intelligent Insights**: Contextual recommendations for operations
- **Predictive Analytics**: Forecast trends and optimize decisions
- **Natural Language Interface**: Chat-based interaction
- **Proactive Suggestions**: Automated alerts and recommendations

### 📅 Advanced Scheduling
- **Calendar View**: Visual schedule management
- **AI Optimization**: Intelligent shift recommendations
- **Role-Based Assignments**: Match skills to roles
- **Availability Tracking**: Staff availability management

### 📈 Comprehensive Analytics
- **Revenue Analysis**: Detailed financial tracking
- **Performance Metrics**: Staff and operational KPIs
- **Customer Insights**: Satisfaction and retention analytics
- **Trend Analysis**: Historical data and predictions

### 🔧 System Administration
- **User Management**: Role-based access control
- **Integration Management**: External system connections
- **System Configuration**: Customizable settings
- **Data Export**: Comprehensive reporting

## Customization

### Branding
The application is white-labeled for "The Graine Ledger" but can be easily customized:
- Update branding in `src/app/login/page.tsx`
- Modify colors in `tailwind.config.js`
- Update logos and assets in `public/`

### Adding Features
1. Create new pages in `src/app/dashboard/`
2. Add navigation items in `src/components/layout/dashboard-layout.tsx`
3. Implement new UI components using Shadcn patterns

### API Integration
- GraphQL schemas can be added to `src/lib/graphql/`
- MongoDB models in `src/lib/models/`
- API routes in `src/app/api/`

## Production Deployment

### Environment Variables
Create a `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=your_domain
TOAST_API_KEY=your_toast_api_key
```

### Build and Deploy
```bash
npm run build
npm start
```

### Recommended Hosting
- **Vercel**: Optimal for Next.js applications
- **Netlify**: Alternative with great CI/CD
- **AWS/Azure/GCP**: For enterprise deployments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ for the restaurant industry**

*Powered by Varuni AI Technology*
