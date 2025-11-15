# Contributing to Aurea

Thank you for your interest in contributing to Aurea! This document provides guidelines and instructions for contributing to the project.

## 🌟 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, app version)

### Suggesting Features

Feature requests are welcome! Please include:
- Clear description of the feature
- Use case and benefits
- Any relevant examples or mockups

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write tests** (if applicable)
5. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

## 📝 Commit Message Guidelines

Use clear, descriptive commit messages:

- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for updates to existing features
- `Refactor:` for code refactoring
- `Docs:` for documentation changes
- `Test:` for test-related changes
- `Style:` for formatting changes

Example:
```
Add: notification settings screen with time pickers
Fix: journal entry date validation bug
Update: improve food search performance
```

## 🏗️ Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up pre-commit hooks
pre-commit install

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd aurea-frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_api/test_journal.py

# Run with verbose output
pytest -v
```

### Frontend Tests

```bash
cd aurea-frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📋 Code Style Guidelines

### Backend (Python)

We follow PEP 8 with some modifications:

- **Line length**: 88 characters (Black default)
- **Imports**: Sorted with isort
- **Type hints**: Required for all functions
- **Docstrings**: Required for all public functions

**Formatting:**
```bash
# Format code
black .

# Sort imports
isort .

# Type checking
mypy app/

# Linting
flake8 app/
```

**Example:**
```python
from typing import List, Optional
from fastapi import APIRouter, Depends

def get_journal_entries(
    user_id: str,
    start_date: Optional[str] = None,
    limit: int = 100
) -> List[JournalEntry]:
    """
    Retrieve journal entries for a user.
    
    Args:
        user_id: The user's unique identifier
        start_date: Optional start date filter
        limit: Maximum number of entries to return
        
    Returns:
        List of journal entries
    """
    # Implementation
    pass
```

### Frontend (TypeScript/React Native)

- **TypeScript**: Use strict mode
- **Components**: Functional components with hooks
- **Props**: Define interfaces for all props
- **Naming**: PascalCase for components, camelCase for functions

**Example:**
```typescript
interface NotificationSettingsProps {
  navigation: any;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsProps> = ({
  navigation,
}) => {
  const [enabled, setEnabled] = useState(false);
  
  // Component implementation
  
  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};
```

## 🎨 UI/UX Guidelines

### Design Principles

1. **Accessibility First**: All components must be accessible
2. **Responsive**: Support various screen sizes
3. **Consistent**: Follow the established design system
4. **Intuitive**: Clear navigation and user flows

### Theme

Use the defined theme constants:

```typescript
import { theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
  },
});
```

### Colors

- Primary: `#800000` (Maroon)
- Accent: `#A52A2A` (Burgundy)
- Background: `#FFFFFF`
- Surface: `#f5f5f5`

## 📚 Documentation

### Code Documentation

- **Backend**: Use docstrings for all functions
- **Frontend**: Use JSDoc comments for complex functions
- **README**: Update if adding new features or changing setup

### API Documentation

- FastAPI automatically generates docs at `/docs`
- Update endpoint descriptions and examples
- Document all request/response models

## 🔍 Code Review Process

All contributions go through code review:

1. **Automated Checks**: CI/CD runs tests and linting
2. **Peer Review**: At least one maintainer reviews the code
3. **Feedback**: Address any comments or requested changes
4. **Approval**: Once approved, code is merged

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Commit messages are clear
- [ ] No merge conflicts

## 🐛 Debugging Tips

### Backend

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with debugger
python -m pdb app/main.py

# Check database
alembic current
alembic history
```

### Frontend

```bash
# Clear cache
npm start -- --reset-cache

# Debug mode
npm start -- --dev-client

# Check logs
npx react-native log-ios
npx react-native log-android
```

## 🚀 Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create release tag
6. Deploy to staging
7. Test on staging
8. Deploy to production

## 📞 Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Create an issue
- **Chat**: Join our community (if available)
- **Email**: support@aurea.app

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions help make Aurea better for expecting mothers everywhere. Thank you for your time and effort!
