# Unit Testing Quick Start Guide

## What's Been Set Up

Your PaintByNumbers2 project now has a complete unit testing infrastructure with:
- **Vitest** - Modern fast test runner
- **React Testing Library** - Component testing
- **Jest DOM** - Enhanced assertions
- **85+ tests** covering core functionality

## Running Tests

```bash
# One-time test run
npm test

# Watch mode (re-runs on file changes)
npm test -- --watch

# Interactive UI dashboard
npm test:ui

# Coverage report (shows % of code tested)
npm test:coverage
```

## What's Currently Tested ✅

### Algorithms
- ✅ Color utilities (RGB↔LAB conversion, hex conversion, distance)
- ✅ K-means color quantization
- ⬜ Connected components, Douglas-Peucker, marching squares

### Utilities  
- ✅ Geometry calculations (polygon area, centroid, point-in-polygon)
- ✅ Statistics (calculating region statistics)
- ✅ Session storage (save/load operations)
- ⬜ Image loading, preprocessing

### State Management
- ✅ Zustand store (update settings, navigation, selections)
- ✅ Undo/redo functionality
- ⬜ Async pipeline operations

### React Components
- ✅ DetailControls (difficulty presets)
- ⬜ ImageUploader, Canvas preview, export buttons

## Test File Locations

All tests live in `src/test/` mirroring the source structure:

```
src/test/
├── algorithms/colorUtils.test.ts
├── algorithms/kmeans.test.ts
├── components/controls/DetailControls.test.tsx
├── state/appStore.test.ts
└── utils/geometry.test.ts, sessionStorage.test.ts, statisticsCalculator.test.ts
```

## How to Write Tests

### Step 1: Create a Test File
Use the naming convention: `{module}.test.ts` or `.test.tsx`

Location: `src/test/{matching-src-path}/{module}.test.ts`

### Step 2: Choose Your Test Pattern

#### Testing a Utility Function
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../path/to/function';

describe('myFunction', () => {
  it('should do something specific', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    expect(myFunction(0)).toBeDefined();
    expect(myFunction(null)).toThrow();
  });
});
```

#### Testing State (Zustand)
```typescript
import { useAppStore } from '../../state/appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('should update settings', () => {
    const store = useAppStore.getState();
    store.updateSettings({ paletteSize: 16 });
    expect(store.settings.paletteSize).toBe(16);
  });
});
```

#### Testing a Component
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render button', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle click', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Step 3: Run Your Tests
```bash
npm test -- --watch myFunction.test.ts
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(5);
expect(obj).toEqual({ name: 'test' });

// Numbers
expect(value).toBeCloseTo(3.14159, 5);  // 5 decimal places
expect(value).toBeGreaterThan(10);

// Arrays
expect([1, 2, 3]).toContain(2);
expect([1, 2, 3]).toHaveLength(3);

// Strings
expect('hello').toMatch(/ell/);
expect('hello').toContain('ell');

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);

// DOM
expect(element).toBeInTheDocument();
expect(element).toBeDisabled();
expect(element).toHaveClass('active');
```

## Tips for Effective Tests

1. **Test behavior, not implementation**
   - ❌ Don't: Test internal variable values
   - ✅ Do: Test what the function returns/does

2. **Use descriptive names**
   - ❌ Don't: `it('works')`
   - ✅ Do: `it('should return area of polygon correctly')`

3. **Test edge cases**
   - Empty inputs, null, zero, negative, very large values
   - Boundary conditions

4. **One test = One concept**
   - Keep tests focused
   - Use `beforeEach` for common setup

5. **Mock dependencies**
   - Don't test external APIs
   - Focus on your code's behavior

## Troubleshooting

### Tests won't run?
```bash
# Make sure file ends with .test.ts or .test.tsx
# Make sure it's in src/test/ directory
npm test someFile.test.ts
```

### "Cannot find module" error?
- Check import paths are correct
- Verify file exists in the location
- Run `npm install` if dependencies missing

### Tests timeout?
```typescript
// Increase timeout for slow tests
it('slow test', async () => { ... }, 10000)
```

### How to skip a test?
```typescript
it.skip('not ready yet', () => { ... })

// Or run only one test
it.only('focused test', () => { ... })
```

## Coverage Reports

After running `npm test:coverage`, view the report:
```bash
# View command line report
npm test:coverage

# Or open HTML report
# coverage/index.html
```

Aim for:
- **Lines**: 70%+
- **Branches**: 60%+
- **Functions**: 70%+

## File Structure to Follow

When adding new tests, match the src structure:

```
src/                          →  src/test/
├── algorithms/
│   └── colorUtils.ts         →  colorUtils.test.ts
├── components/
│   └── controls/
│       └── Button.tsx        →  controls/Button.test.tsx
├── state/
│   └── appStore.ts           →  appStore.test.ts
└── utils/
    └── geometry.ts           →  utils/geometry.test.ts
```

## Reference Documentation

- **TESTING.md** - Comprehensive guide with all test patterns
- **src/test/README.md** - Quick reference
- **src/test/test-template.test.ts** - Copy-paste template

## Common Testing Tasks

### Test an async function
```typescript
it('should fetch data', async () => {
  const result = await myAsyncFunction();
  expect(result).toBeDefined();
});
```

### Mock an external module
```typescript
vi.mock('../../api/client', () => ({
  fetchData: vi.fn().mockResolvedValue({ id: 1 })
}));
```

### Test error handling
```typescript
it('should throw on invalid input', () => {
  expect(() => myFunction(null)).toThrow('Invalid input');
});
```

### Test component with state
```typescript
it('should update on click', () => {
  render(<Counter />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

## Next Steps

1. **Run existing tests**: `npm test`
2. **Add tests for new features**: Use template in `src/test/test-template.test.ts`
3. **Check coverage**: `npm test:coverage`
4. **Read full guide**: See `TESTING.md`

## Need Help?

- Check existing test files in `src/test/algorithms/`, `src/test/utils/`, etc.
- Read `TESTING.md` for detailed patterns and examples
- See `src/test/test-template.test.ts` for blank template  
- Look at example tests that match your use case

Happy testing! 🧪
