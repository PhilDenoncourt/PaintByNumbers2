# Unit Testing Guide for PaintByNumbers2

This guide explains how to write and run unit tests for the PaintByNumbers2 application.

## Setup

The testing framework has been configured with:
- **Vitest**: Fast unit test framework (Vite-native alternative to Jest)
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM implementation for Node.js

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode - re-run tests on file changes
npm test -- --watch

# Run with UI dashboard
npm test:ui

# Generate coverage report
npm test:coverage

# Run specific test file
npm test -- colorUtils.test.ts

# Run tests matching a pattern
npm test -- --grep "colorUtils"
```

## Project Structure

Tests are organized in `src/test/` mirroring the source structure:

```
src/
├── algorithms/
│   ├── colorUtils.ts
│   └── ..other algorithms
├── components/
│   ├── controls/
│   ├── layout/
│   └── ...
├── state/
│   ├── appStore.ts
│   └── types.ts
├── utils/
│   ├── geometry.ts
│   ├── statisticsCalculator.ts
│   └── ...
└── test/
    ├── setup.ts
    ├── algorithms/
    │   ├── colorUtils.test.ts
    │   └── ...
    ├── components/
    │   ├── controls/
    │   │   ├── DetailControls.test.tsx
    │   │   └── ...
    │   └── ...
    ├── state/
    │   └── appStore.test.ts
    └── utils/
        ├── geometry.test.ts
        ├── statisticsCalculator.test.ts
        └── ...
```

## Test Types

### 1. Unit Tests for Pure Functions (Utilities & Algorithms)

Test mathematical functions and data transformations directly.

**Example: Testing Color Conversion**

```typescript
import { describe, it, expect } from 'vitest';
import { rgbToLab, labToRgb, rgbToHex } from '../../algorithms/colorUtils';

describe('colorUtils', () => {
  describe('rgbToLab', () => {
    it('should convert white RGB to LAB', () => {
      const [L, a, b] = rgbToLab(255, 255, 255);
      expect(L).toBeCloseTo(100, 1);
      expect(a).toBeCloseTo(0, 1);
      expect(b).toBeCloseTo(0, 1);
    });
  });

  describe('rgbToHex', () => {
    it('should convert colors correctly', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    });
  });
});
```

**Best Practices:**
- Use `toBeCloseTo()` for floating-point comparisons
- Test edge cases (black, white, primary colors)
- Test roundtrip conversions (RGB → LAB → RGB)
- Group related tests with `describe()`

### 2. Geometry and Math Tests

Test geometric calculations with various polygon shapes and edge cases.

**Example: Testing Polygon Area**

```typescript
describe('geometry', () => {
  describe('polygonArea', () => {
    it('should calculate area of a square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      expect(polygonArea(square)).toBe(100);
    });

    it('should return positive area regardless of winding order', () => {
      const ccw = [...square];
      const cw = [...square].reverse();
      expect(polygonArea(ccw)).toBe(polygonArea(cw));
    });
  });
});
```

**What to Test:**
- Standard cases (rectangles, triangles)
- Edge cases (degenerate polygons, single points)
- Different winding orders
- Boundary conditions

### 3. State Management Tests (Zustand)

Test store mutations and state transitions.

**Example: Testing AppStore**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../state/appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().reset();
  });

  it('should update settings partially', () => {
    const store = useAppStore.getState();
    store.updateSettings({ paletteSize: 16 });
    expect(store.settings.paletteSize).toBe(16);
  });

  it('should manage hover state', () => {
    const store = useAppStore.getState();
    store.setHoveredRegion(5);
    expect(store.ui.hoveredRegion).toBe(5);
    store.setHoveredRegion(null);
    expect(store.ui.hoveredRegion).toBeNull();
  });
});
```

**Best Practices:**
- Reset store state before each test
- Test state mutations don't affect original objects
- Test multiple state changes in sequence
- Mock external dependencies (async operations)

### 4. Component Tests (React)

Test React components using React Testing Library.

**Example: Testing Control Component**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailControls } from '../../../components/controls/DetailControls';
import { useAppStore } from '../../../state/appStore';
import { vi } from 'vitest';

vi.mock('../../../state/appStore');

describe('DetailControls', () => {
  beforeEach(() => {
    const mockUpdateSettings = vi.fn();
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        settings: { detailLevel: 50, minRegionSize: 135 },
        pipeline: { status: 'idle' },
        updateSettings: mockUpdateSettings,
      };
      return selector(state);
    });
  });

  it('should render difficulty buttons', () => {
    render(<DetailControls />);
    expect(screen.getByText('Simple')).toBeInTheDocument();
  });

  it('should apply preset on button click', () => {
    render(<DetailControls />);
    fireEvent.click(screen.getByText('Simple'));
    expect(mockUpdateSettings).toHaveBeenCalled();
  });
});
```

**Best Practices:**
- Mock store and context dependencies
- Use `screen` queries instead of DOM queries
- Test user interactions (clicks, input changes)
- Test accessibility (labels, buttons)
- Test disabled states and error conditions

### 5. Integration Tests (Optional)

Test multiple components working together.

```typescript
describe('Pipeline Integration', () => {
  it('should process image through full pipeline', async () => {
    // Test multiple components interacting
    // Usually tests are more focused on units, but some integration
    // tests may be useful for critical paths
  });
});
```

## Testing Patterns

### Mocking Workers

Workers are mocked in the test setup. To test worker behavior:

```typescript
vi.mock('../../workers/myWorker.ts?worker', () => ({
  default: vi.fn(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
  })),
}));
```

### Mocking Async Operations

```typescript
import { vi } from 'vitest';

vi.mock('../../pipeline/PipelineController', () => ({
  runPipeline: vi.fn().mockResolvedValue({
    paletteRGB: [[255, 0, 0]],
    regions: [],
    indexMap: new Uint8Array(100 * 100),
  }),
}));
```

### Testing with ImageData

ImageData is mocked in test setup:

```typescript
const imageData = new ImageData(
  new Uint8ClampedArray(100 * 100 * 4),
  100,
  100
);
```

## Assertion Examples

### Common Assertions

```typescript
// Equality
expect(value).toBe(5);
expect(obj).toEqual({ a: 1, b: 2 });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2); // 2 decimal places

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(5);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);
expect(mockFn).toHaveBeenCalledTimes(2);

// DOM
expect(element).toBeInTheDocument();
expect(element).toHaveClass('active');
expect(element).toHaveAttribute('disabled');
```

## Coverage Goals

Aim for coverage targets:
- **Lines**: 70%+
- **Branches**: 60%+
- **Functions**: 70%+
- **Statements**: 70%+

Run coverage report:
```bash
npm test:coverage
```

## Tips for Effective Testing

1. **Test behavior, not implementation** - Focus on what the function does, not how
2. **Use descriptive test names** - `it('should return 0 for point on segment')`
3. **One assertion per test (when possible)** - Makes failures clear
4. **Test edge cases** - Boundaries, empty inputs, extreme values
5. **Keep tests focused** - Each test should test one thing
6. **DRY principle for setup** - Use `beforeEach` for common setup
7. **Mock external dependencies** - APIs, workers, file systems
8. **Test error conditions** - What happens when things go wrong?

## Adding Tests to New Features

When adding new functionality:

1. Create test file in `src/test/` matching source structure
2. Write tests before or alongside the code
3. Follow existing patterns in the codebase
4. Run tests frequently to catch issues early
5. Aim for 70%+ coverage of new code

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
- name: Upload coverage
  run: npm test:coverage
```

## Common Issues

### "Cannot find module" errors
- Ensure mock paths match import paths
- Check `setup.ts` for global mocks

### ImageData not defined
- This is mocked in `setup.ts` automatically

### Store not updating in tests
- Remember to reset store with `store.reset()` before each test
- Use `useAppStore.getState()` to access current state

### Component not rendering
- Check that all mocked dependencies return valid values
- Verify mock implementations match the interface

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)
