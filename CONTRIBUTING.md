# Contributing to Neurothumb

Thank you for your interest in contributing to Neurothumb! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

1. **Clear title**: Describe the bug concisely
2. **Description**: Explain what happened and what you expected
3. **Steps to reproduce**: Provide detailed steps to reproduce the issue
4. **Environment**: Include OS, Python version, Node.js version, etc.
5. **Screenshots**: If applicable, add screenshots or error messages
6. **Logs**: Include relevant error logs or console output

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

1. **Clear title**: Describe the feature concisely
2. **Description**: Explain the feature and why it would be useful
3. **Use cases**: Provide specific use cases or examples
4. **Implementation ideas**: If you have thoughts on how to implement it

### Submitting Pull Requests

1. **Fork the repository** and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines:
   - Use consistent indentation (2 spaces for JavaScript, 4 for Python)
   - Write clear, descriptive commit messages
   - Add comments for complex logic
   - Keep functions small and focused

3. **Test your changes**:
   ```bash
   # Frontend tests
   pnpm test
   
   # Linting
   pnpm lint
   
   # Manual testing
   pnpm dev
   ```

4. **Update documentation** if needed:
   - Update README.md for user-facing changes
   - Update API documentation for endpoint changes
   - Add comments to code for complex logic

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe your changes and why they're needed
   - Ensure CI/CD checks pass

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Modal account
- Supabase account

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sriharideveloper/neurothumb.git
   cd neurothumb
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Fill in your credentials
   ```

4. **Run development server**:
   ```bash
   pnpm dev
   ```

5. **Open in browser**:
   ```
   http://localhost:3000
   ```

## Project Structure

```
neurothumb/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/             # Authentication
│   └── page.jsx           # Main page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── byok-config.js    # BYOK configuration
│   └── byok-server.js    # Server-side config
├── modal_backend/         # Modal serverless backend
│   ├── backend.py        # TRIBE v2 inference
│   └── requirements.txt   # Python dependencies
├── scripts/              # Setup and utility scripts
├── docs/                 # Documentation
└── public/               # Static assets
```

## Code Style Guidelines

### JavaScript/React

- Use ES6+ syntax
- Use functional components with hooks
- Use descriptive variable names
- Add JSDoc comments for functions
- Use const/let, avoid var
- Use async/await over .then()

Example:
```javascript
/**
 * Analyze a YouTube thumbnail
 * @param {string} imageUrl - URL of the thumbnail
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeThumbnail(imageUrl) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ image_url: imageUrl })
  });
  return response.json();
}
```

### Python

- Follow PEP 8 style guide
- Use type hints
- Add docstrings to functions and classes
- Use descriptive variable names
- Keep functions focused and testable

Example:
```python
def analyze_thumbnail(image_url: str) -> dict:
    """
    Analyze a YouTube thumbnail using TRIBE v2 model.
    
    Args:
        image_url: URL of the thumbnail image
        
    Returns:
        Dictionary containing metrics and heatmap
    """
    # Implementation
    return results
```

### SCSS/CSS

- Use BEM naming convention for classes
- Keep specificity low
- Use variables for colors and spacing
- Mobile-first responsive design

Example:
```scss
.thumbnail-card {
  padding: var(--spacing-md);
  
  &__image {
    width: 100%;
    border-radius: var(--radius-md);
  }
  
  &__title {
    margin-top: var(--spacing-sm);
    font-size: var(--font-size-lg);
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write tests for new features
- Aim for >80% code coverage
- Use descriptive test names
- Test both happy paths and edge cases

Example:
```javascript
describe('analyzeThumbnail', () => {
  it('should return metrics for valid image URL', async () => {
    const result = await analyzeThumbnail('https://example.com/image.jpg');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('heatmap_base64');
  });

  it('should throw error for invalid URL', async () => {
    await expect(analyzeThumbnail('invalid')).rejects.toThrow();
  });
});
```

## Documentation

### Updating README

- Keep it concise and well-organized
- Include examples for common tasks
- Link to detailed documentation
- Update table of contents if needed

### Adding API Documentation

- Document all endpoints
- Include request/response examples
- Explain error codes
- Add usage examples

### Code Comments

- Comment why, not what
- Keep comments up-to-date
- Use JSDoc/docstrings for public APIs
- Avoid over-commenting obvious code

## Git Workflow

### Commit Messages

Use clear, descriptive commit messages:

```
Add: Brief description of what was added
Fix: Brief description of what was fixed
Update: Brief description of what was updated
Refactor: Brief description of refactoring
Docs: Brief description of documentation changes
```

Examples:
```
Add: BYOK configuration system for Modal, Supabase, Gemini
Fix: Modal endpoint extraction in setup script
Update: README with new API documentation
Refactor: Extract common utility functions
Docs: Add environment setup guide
```

### Branch Naming

Use descriptive branch names:

```
feature/byok-system
fix/modal-endpoint-extraction
docs/api-documentation
refactor/utility-functions
```

## Review Process

1. **Code Review**: Maintainers will review your PR for:
   - Code quality and style
   - Test coverage
   - Documentation
   - Performance implications

2. **Feedback**: Address any feedback or suggestions

3. **Approval**: Once approved, your PR will be merged

4. **Release**: Your changes will be included in the next release

## Release Process

Releases follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Getting Help

- Check existing issues and discussions
- Read the documentation in `/docs`
- Ask questions in GitHub Discussions
- Join our community Discord (if available)

## License

By contributing to Neurothumb, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project README

Thank you for contributing to Neurothumb! 🥐
