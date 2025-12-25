// Unit tests for debounce utility
import { jest, describe, test, expect } from "@jest/globals";
import { debounce, throttle } from "../../../utils/debounce";

// Mock timers
jest.useFakeTimers();

describe("debounce", () => {
  test("delays function execution", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(99);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("cancels previous calls", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    jest.advanceTimersByTime(50);
    debouncedFn(); // This should cancel the first call
    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("passes arguments correctly", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn("arg1", "arg2", 123);
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123);
  });

  test("handles multiple rapid calls", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Rapid calls
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1); // Only called once
  });

  test("allows multiple executions after delay", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe("throttle", () => {
  test("executes immediately on first call", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("prevents execution within interval", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(50);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1); // Still 1, within interval
  });

  test("allows execution after interval", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test("passes arguments correctly", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn("test", 123);
    expect(mockFn).toHaveBeenCalledWith("test", 123);
  });

  test("handles rapid calls correctly", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn(); // Call 1 - executes
    throttledFn(); // Ignored
    throttledFn(); // Ignored

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn(); // Call 2 - executes
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
