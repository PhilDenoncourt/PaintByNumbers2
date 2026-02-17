# PaintByNumbers2 Test Suite

This directory contains unit tests for all components and services in the PaintByNumbers2 application.

## Quick Start

```bash
# Run all tests
npm test

# Run in watch mode (re-run on file changes)
npm test -- --watch

# View test UI dashboard
npm test:ui

# Generate coverage report
npm test:coverage
```

## Directory Structure

```
test/
├── test-template.test.ts       # Copy this to create new tests
├── setup.ts                     # Global test setup and mocks
├── algorithms/
│   ├── colorUtils.test.ts
│   └── kmeans.test.ts
├── components/
│   ├── controls/
│   │   └── DetailControls.test.tsx
│   └── ...
├── state/
│   └── appStore.test.ts
└── utils/
    ├── geometry.test.ts
    ├── statisticsCalculator.test.ts
    └── sessionStorage.test.ts
```

## Test Files

### Algorithms
- **colorUtils.test.ts** - RGB/LAB color conversion, distance calculations, hex conversion
- **kmeans.test.ts** - K-means color quantization algorithm

### Components
- **DetailControls.test.tsx** - Detail level difficulty presets and sliders
- More component tests to be added

### State Management
- **appStore.test.ts** - Zustand store state management, undo/redo, settings

### Utilities
- **geometry.test.ts** - Polygon calculations, point-in-polygon, distance calculations
- **statisticsCalculator.test.ts** - Region statistics and analysis
- **sessionStorage.test.ts** - Session save/load/export functionality

## Writing Tests

### Step 1: Create Test File
Copy from `test-template.test.ts` or follow the structure below:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../path/to/module';

describe('myFunction', () => {
  it('should do something specific', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Step 2: Place in Correct Location
- Algorithms → `test/algorithms/`
- Components → `test/components/`
- State → `test/state/`
- Utils → `test/utils/`

### Step 3: Name the File
Use the convention: `{original-filename}.test.ts` or `.test.tsx`

Example: If testing `src/utils/geometry.ts`, create `src/test/utils/geometry.test.ts`

## Test Coverage

Current test coverage includes:
- ✅ Color conversion utilities (colorUtils)
- ✅ Geometric calculations (geometry)
- ✅ K-means algorithm (kmeans)
- ✅ Statistics calculation
- ✅ Session storage
- ✅ State management (appStore)
- ✅ Control components (DetailControls)

## To Add Tests

Key areas that need testing:
```
[ ] ImageUploader component
[ ] Canvas preview components
[ ] Export functions (SVG, PNG, PDF)
[ ] Pipeline stages (segment, merge, contour)
[ ] Worker coordination
[ ] Region operations
[ ] Advanced preprocessing algorithms
[ ] Connected components algorithm
[ ] Douglas-Peucker simplification
[ ] Marching squares algorithm
[ ] More control components
```

## Running Specific Tests

```bash
# Run single file
npm test -- colorUtils.test.ts

# Run test matching pattern
npm test -- --grep "rgbToLab"

# Run with coverage
npm test:coverage -- --reporter=html

# Debug mode
npm test -- --inspect-brk
```

## Common Testing Commands

### Development
```bash
# Watch mode - tests re-run on file changes
npm test -- --watch

# UI Mode - visual test interface
npm test:ui
```

### CI/CD
```bash
# Single run with summary
npm test

# With coverage
npm test:coverage
```

### Debugging
```bash
# Verbose output
npm test -- --reporter=verbose

# Show test names and timing
npm test -- --reporter=verbose --no-color
```

## Test Patterns Used

### Pure Functions
- Direct input → output testing
- Edge cases and boundaries
- Floating-point comparison with `toBeCloseTo()`

### State Management
- Store instantiation and reset
- State mutations
- Undo/redo functionality
- History tracking

### React Components
- User interactions (clicks, input)
- State changes
- Disabled/loading states
- Accessibility

### Algorithms
- Correctness verification
- Performance characteristics
- Input validation
- Result format validation

## Mocking

### Auto-mocked in setup.ts
- Web Workers - `global.Worker`
- ImageData - `global.ImageData`

### Mocked per test file
- Zustand store - `useAppStore`
- External modules - `vi.mock()`

Example:
```typescript
vi.mock('../../state/appStore', () => ({
  useAppStore: vi.fn((selector) => selector(mockState)),
}));
```

## Best Practices

1. **Test behavior, not implementation**
   - Wrong: `expect(internal.flag).toBe(true)`
   - Right: `expect(result).toBe(expectedOutput)`

2. **Use descriptive names**
   - Wrong: `it('works')`
   - Right: `it('should return 0 for point on segment')`

3. **Keep tests focused**
   - One test = one concept
   - Use test groups with `describe()`

4. **Test edge cases**
   - Empty inputs, null, zero, negative, very large values

5. **Use beforeEach for setup**
   - Reduces duplication
   - Keeps tests clean

6. **Assert on the outcome**
   - Don't test intermediate steps
   - Test the final result

## Coverage Goals

Aim for:
- **Lines**: 70%+
- **Branches**: 60%+
- **Functions**: 70%+
- **Statements**: 70%+

View coverage:
```bash
npm test:coverage
```

## Troubleshooting

### Tests not running?
- Check file ends with `.test.ts` or `.test.tsx`
- Verify file is in `src/test/` directory
- Ensure imports are correct

### "Cannot find module" errors?
- Check import paths match file structure
- Verify mocks in `setup.ts` are correct
- Run `npm install` if dependencies missing

### ImageData/Worker errors?
- These are mocked globally in `setup.ts`
- Check setup.ts is referenced in vitest config

### Tests timeout?
- Increase timeout: `it('test', async () => {...}, 10000)`
- Check for infinite loops or hanging promises

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Contributing Tests

When adding new features:
1. Write tests alongside or before the code
2. Follow existing test patterns
3. Aim for 70%+ coverage
4. Run full test suite before committing
5. Update this README with new test locations

Questions? Check `TESTING.md` for detailed guidance!
