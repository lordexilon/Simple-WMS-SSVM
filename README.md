# Simple-WMS-SSVM

A modern and efficient Warehouse Management System built with React, TypeScript, and Supabase. This system helps businesses manage their warehouse operations with an intuitive 3D visualization interface and advanced position management.

## Features

### Core Features
- **3D Warehouse Visualization**: Interactive 3D view of your warehouse layout
- **Position Management**: 
  - Bulk position creation with range support (rack, column, level, depth)
  - Advanced filtering and search capabilities
  - Status tracking (occupied/available)
- **Multi-warehouse Support**: Manage multiple storage locations
- **Movement Tracking**: Complete history of product movements
- **Stock Management**: Real-time inventory tracking

### Technical Features
- **Secure Authentication**: Powered by Supabase
- **Modern UI**: Built with React and Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Works on desktop and tablets

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lordexilon/Simple-WMS-SSVM.git
cd Simple-WMS-SSVM
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

## Project Structure

```
src/
├── components/         # React components
│   ├── Auth/          # Authentication components
│   ├── Dashboard/     # Dashboard views
│   └── Warehouse/     # Warehouse management
├── lib/               # Utilities and configurations
├── styles/            # Global styles
├── types/            # TypeScript definitions
└── App.tsx           # Main application component
```

## Database Schema

The system uses Supabase with the following main tables:
- `warehouses`: Storage locations
- `positions`: Individual storage positions
- `products`: Product catalog
- `movements`: Stock movements
- `users`: User management

## License

Simple-WMS-SSVM is available under a dual-license model:

### Community Edition - GNU AGPL v3
- Free for open source use
- Source code must be shared
- Perfect for:
  - Educational purposes
  - Personal use
  - Open source projects

### Commercial Edition
- Flexible usage rights
- Private modifications allowed
- Includes:
  - Priority support
  - Custom features
  - Consulting services

For commercial licensing inquiries, please contact:

Jose Alberto Villalba G.
- Email: albertovillalba@gmail.com
- GitHub: https://github.com/lordexilon
- Project: https://github.com/lordexilon/Simple-WMS-SSVM

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use Prettier for formatting
- Follow React hooks guidelines

## Support

For community support:
- Open an issue on GitHub
- Join our discussions

For commercial support:
- Contact via email: albertovillalba@gmail.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for all changes and releases.

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---
Copyright 2025 Jose Alberto Villalba G. All rights reserved.
