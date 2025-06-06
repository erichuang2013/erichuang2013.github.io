# Python Functions

## Introduction to Functions

In Python, a function is a block of organized, reusable code that is used to perform a single, related action. Functions provide better modularity for your application and a high degree of code reusing.

You define a function using the `def` keyword, followed by the function name and parentheses `()`. Any input parameters or arguments should be placed within these parentheses. You can also define parameters inside these parentheses.

```python
def greet(name):
  """This function greets the person passed in as a parameter."""
  print("Hello, " + name + ". Good morning!")

greet("Alice")  # Output: Hello, Alice. Good morning!
```

## Functions as First-Class Objects

In Python, functions are first-class objects. This means that functions can be:
- Assigned to a variable
- Passed as an argument to another function
- Returned from another function

**Assigned to a variable:**
```python
def say_hello(name):
  return f"Hello, {name}"

greet_func = say_hello
print(greet_func("Bob"))  # Output: Hello, Bob
```

**Passed as an argument:**
```python
def shout(text):
  return text.upper()

def whisper(text):
  return text.lower()

def greet(func, message):
  print(func(message))

greet(shout, "Hello World")   # Output: HELLO WORLD
greet(whisper, "Hello World") # Output: hello world
```

## Inner Functions

Python allows you to define functions inside other functions. These are called inner functions. Inner functions can access variables from the enclosing (outer) function's scope (closure).

```python
def outer_function(text):
  def inner_function():
    print(text)
  inner_function()

outer_function("This is an inner function call.") # Output: This is an inner function call.
```
An inner function is not accessible from outside the outer function unless it is returned by the outer function.

## Functions as Return Values

Functions can also return other functions. This is a powerful feature that allows for the creation of higher-order functions and decorators.

```python
def create_adder(x):
  def adder(y):
    return x + y
  return adder

add_15 = create_adder(15)
print(add_15(10))  # Output: 25

add_5 = create_adder(5)
print(add_5(10))   # Output: 15
```
In this example, `create_adder` is a function that takes an argument `x` and returns a new function `adder`. The `adder` function takes an argument `y` and returns the sum of `x` and `y`. The variable `x` is remembered by the `adder` function due to closure.

# Python Decorators

## Introduction to Decorators

Decorators are a very powerful and useful tool in Python since they allow programmers to modify the behavior of a function or class. Decorators allow us to wrap another function in order to extend the behavior of the wrapped function, without permanently modifying it.

The main purpose of a decorator is to change a function's or a class's behavior.

## The `@` Syntax

The `@` symbol is used to apply a decorator to a function. This is syntactic sugar that makes decorators easier to read and use.

```python
@my_decorator
def say_whee():
  print("Whee!")

# This is equivalent to:
# def say_whee():
#   print("Whee!")
# say_whee = my_decorator(say_whee)
```

## Creating a Simple Decorator

A decorator is a function that takes another function (the decorated function) as an argument and returns a new function (the wrapper function). The wrapper function usually adds some behavior before or after calling the original function.

```python
def greet_decorator(func):
  def wrapper():
    print("Greetings!")
    func()
    print("End of greeting.")
  return wrapper

@greet_decorator
def say_hello():
  print("Hello!")

say_hello()
# Output:
# Greetings!
# Hello!
# End of greeting.
```

## Reusing Decorators

Decorators can be defined once and used to decorate multiple functions.

```python
def uppercase_decorator(func):
  def wrapper(text):
    return func(text).upper()
  return wrapper

@uppercase_decorator
def get_greeting(name):
  return f"Hello, {name}!"

@uppercase_decorator
def get_farewell(name):
  return f"Goodbye, {name}!"

print(get_greeting("Alice"))  # Output: HELLO, ALICE!
print(get_farewell("Bob"))    # Output: GOODBYE, BOB!
```

## Decorating Functions with Arguments

Sometimes you'll want to decorate functions that take arguments. You can use `*args` and `**kwargs` in the wrapper function to accept any number of positional and keyword arguments.

```python
def debug_decorator(func):
  def wrapper(*args, **kwargs):
    print(f"Calling {func.__name__} with arguments: {args}, {kwargs}")
    result = func(*args, **kwargs)
    print(f"{func.__name__} returned: {result}")
    return result
  return wrapper

@debug_decorator
def add(a, b):
  return a + b

@debug_decorator
def greet_person(name, greeting="Hello"):
  return f"{greeting}, {name}!"

add(5, 3)
# Output:
# Calling add with arguments: (5, 3), {}
# add returned: 8

greet_person("Charlie", greeting="Hi")
# Output:
# Calling greet_person with arguments: ('Charlie',), {'greeting': 'Hi'}
# greet_person returned: Hi, Charlie!!
```

## Returning Values from Decorated Functions

Decorators can return the value that the decorated function returns. The wrapper function should return the result of calling the original function.

```python
def bold_decorator(func):
  def wrapper(*args, **kwargs):
    # Call the decorated function and get its return value
    value = func(*args, **kwargs)
    # Add some behavior (e.g., wrap the result in <b> tags)
    return f"<b>{value}</b>"
  return wrapper

@bold_decorator
def get_full_name(first_name, last_name):
  return f"{first_name} {last_name}"

full_name = get_full_name("Grace", "Hopper")
print(full_name)  # Output: <b>Grace Hopper</b>
```

## Using `functools.wraps`

When you use a decorator, you are replacing the original function with the wrapper function. This means that the original function's metadata (like its name, docstring, and argument list) is lost.

The `functools.wraps` decorator can be used to copy the metadata from the original function to the wrapper function.

```python
import functools

def logging_decorator(func):
  @functools.wraps(func) # Preserves metadata of 'func'
  def wrapper(*args, **kwargs):
    print(f"Calling {func.__name__}...")
    result = func(*args, **kwargs)
    print(f"{func.__name__} finished.")
    return result
  return wrapper

@logging_decorator
def complex_calculation(a, b, c):
  """This is a complex calculation function."""
  return a * b + c

print(complex_calculation(2, 3, 4))
# Output:
# Calling complex_calculation...
# complex_calculation finished.
# 10

print(complex_calculation.__name__)      # Output: complex_calculation
print(complex_calculation.__doc__)       # Output: This is a complex calculation function.
```
Without `@functools.wraps(func)`, `complex_calculation.__name__` would be `wrapper` and `complex_calculation.__doc__` would be `None`.

# Real-World Examples of Decorators

Decorators are used in many real-world scenarios to add functionality to functions and methods in a clean and reusable way. Here are a few examples:

## `@timer` Decorator

This decorator measures the execution time of a function. This is useful for performance analysis and identifying bottlenecks in your code.

```python
import time
import functools
import math # Added for approximate_e example

def timer(func):
  """Print the runtime of the decorated function"""
  @functools.wraps(func)
  def wrapper_timer(*args, **kwargs):
    start_time = time.perf_counter()    # 1
    value = func(*args, **kwargs)
    end_time = time.perf_counter()      # 2
    run_time = end_time - start_time
    print(f"Finished {func.__name__!r} in {run_time:.4f} secs")
    return value
  return wrapper_timer

@timer
def waste_some_time(num_times):
  for _ in range(num_times):
    sum([i**2 for i in range(10000)])

waste_some_time(1)
# Expected Output (the exact time will vary):
# Finished 'waste_some_time' in 0.00XX secs
waste_some_time(999)
# Expected Output (the exact time will vary):
# Finished 'waste_some_time' in X.XXX secs
```
**Explanation:**
1.  `start_time = time.perf_counter()`: Records the time just before the decorated function is called.
2.  `end_time = time.perf_counter()`: Records the time just after the decorated function finishes.
The difference between `end_time` and `start_time` gives the total execution time.

## `@debug` Decorator

This decorator prints the arguments passed to a function and its return value. This is very helpful for debugging purposes.

```python
import functools

def debug(func):
  """Print the function signature and return value"""
  @functools.wraps(func)
  def wrapper_debug(*args, **kwargs):
    args_repr = [repr(a) for a in args]                      # 1
    kwargs_repr = [f"{k}={v!r}" for k, v in kwargs.items()]  # 2
    signature = ", ".join(args_repr + kwargs_repr)           # 3
    print(f"Calling {func.__name__}({signature})")
    value = func(*args, **kwargs)
    print(f"{func.__name__!r} returned {value!r}")           # 4
    return value
  return wrapper_debug

@debug
def make_greeting(name, age=None):
  if age is None:
    return f"Howdy {name}!"
  else:
    return f"Whoa {name}! {age} already, you are growing up!"

make_greeting("Benjamin")
# Output:
# Calling make_greeting('Benjamin')
# 'make_greeting' returned 'Howdy Benjamin!'

make_greeting("Richard", age=11)
# Output:
# Calling make_greeting('Richard', age=11)
# 'make_greeting' returned 'Whoa Richard! 11 already, you are growing up!'

@debug
def approximate_e(terms=18):
  return sum(1 / math.factorial(n) for n in range(terms))

approximate_e(5)
# Output:
# Calling approximate_e(terms=5)
# 'approximate_e' returned 2.7166666666666663
```
**Explanation:**
1.  `args_repr = [repr(a) for a in args]`: Creates a list of string representations of positional arguments.
2.  `kwargs_repr = [f"{k}={v!r}" for k, v in kwargs.items()]`: Creates a list of string representations of keyword arguments.
3.  `signature = ", ".join(args_repr + kwargs_repr)`: Combines these lists into a single string representing the function's signature.
4.  The decorator then prints the signature before calling the function and the return value after the function call.

## `@slow_down` Decorator

This decorator adds a delay before calling the decorated function. This can be useful for purposes like rate limiting (e.g., to avoid overwhelming an API) or for simulating network latency.

```python
import time
import functools

def slow_down(delay_seconds=1):
  """Sleep for `delay_seconds` seconds before calling the function"""
  def decorator_slow_down(func):
    @functools.wraps(func)
    def wrapper_slow_down(*args, **kwargs):
      print(f"Slowing down for {delay_seconds} second(s)...")
      time.sleep(delay_seconds)
      return func(*args, **kwargs)
    return wrapper_slow_down
  return decorator_slow_down

@slow_down(delay_seconds=0.5) # Decorator with an argument
def process_data(data):
  print(f"Processing: {data}")

process_data("Important Data Packet 1")
# Output:
# Slowing down for 0.5 second(s)...
# Processing: Important Data Packet 1

@slow_down() # Using default delay
def send_notification(message):
  print(f"Sending notification: {message}")

send_notification("Your report is ready.")
# Output:
# Slowing down for 1 second(s)...
# Sending notification: Your report is ready.
```
**Explanation:**
The `slow_down` decorator is slightly different because it takes an argument (`delay_seconds`). This means it's a decorator factory: a function that returns a decorator.
1.  `slow_down(delay_seconds=1)`: This is the outer function that accepts the delay duration.
2.  `decorator_slow_down(func)`: This is the actual decorator, which takes the function to be decorated as an argument.
3.  `wrapper_slow_down(*args, **kwargs)`: This is the wrapper function that adds the delay using `time.sleep(delay_seconds)` before calling the original function.
This pattern allows you to customize the behavior of the decorator (in this case, the delay duration) when you apply it.
The `@slow_down()` syntax with parentheses is necessary even if using the default delay, as it calls `slow_down` which then returns the actual decorator.

# Advanced Decorator Concepts

## Decorating Classes

Decorators can be used not only for functions but also for classes. You can either decorate methods within a class or decorate the entire class.

**Decorating Methods in a Class:**
This is similar to decorating functions. The `self` argument of a method is handled correctly by `*args, **kwargs`.

```python
import functools

def method_logger(func):
  @functools.wraps(func)
  def wrapper(self, *args, **kwargs): # 'self' is the first argument
    print(f"Calling method {func.__name__} on {self.__class__.__name__} instance")
    return func(self, *args, **kwargs)
  return wrapper

class MyClass:
  def __init__(self, value):
    self.value = value

  @method_logger
  def get_value(self):
    return self.value

  @method_logger
  def set_value(self, new_value):
    self.value = new_value

obj = MyClass(10)
obj.set_value(20)
# Output:
# Calling method set_value on MyClass instance
print(obj.get_value())
# Output:
# Calling method get_value on MyClass instance
# 20
```

**Decorating an Entire Class:**
A class decorator is a function that takes a class as an argument and returns a modified class or a callable that replaces the class.
This can be used for various purposes, such as adding attributes/methods, modifying existing ones, or wrapping the class in some way (e.g., for singleton patterns or automatic logging).

```python
def add_str_representation(cls):
  """Adds a __str__ method to the class that shows instance attributes."""
  # functools.wraps can be used with classes too, but be careful with 'updated' and 'assigned'
  # For simplicity, we directly assign __str__ here.
  # A more robust version might use functools.update_wrapper or functools.wraps
  def __str__(self):
    attrs = ", ".join(f"{k}={v}" for k, v in self.__dict__.items())
    return f"[{self.__class__.__name__} attributes: {attrs}]"

  cls.__str__ = __str__
  return cls

@add_str_representation
class Product:
  def __init__(self, name, price):
    self.name = name
    self.price = price

@add_str_representation
class User:
  def __init__(self, username, email):
    self.username = username
    self.email = email

book = Product("The Hitchhiker's Guide", 12.50)
print(book) # Output: [Product attributes: name=The Hitchhiker's Guide, price=12.5]

alice = User("alice_g", "alice@example.com")
print(alice) # Output: [User attributes: username=alice_g, email=alice@example.com]
```

## Nesting Decorators

You can apply multiple decorators to a single function. The decorators are applied from bottom to top (or right to left if written on the same line).

```python
import functools

def bold_decorator(func):
  @functools.wraps(func)
  def wrapper(*args, **kwargs):
    return "<b>" + func(*args, **kwargs) + "</b>"
  return wrapper

def italic_decorator(func):
  @functools.wraps(func)
  def wrapper(*args, **kwargs):
    return "<em>" + func(*args, **kwargs) + "</em>"
  return wrapper

@bold_decorator   # Applied second
@italic_decorator # Applied first
def get_message():
  return "Hello, Decorators!"

print(get_message()) # Output: <b><em>Hello, Decorators!</em></b>
```
The `get_message` function is first wrapped by `italic_decorator`, and then the resulting (italicized) function is wrapped by `bold_decorator`.

## Decorators with Arguments

As seen in the `@slow_down` example, you can create decorators that accept arguments. This requires an extra layer of nesting. The outer function takes the decorator's arguments and returns the decorator itself.

```python
import functools

def repeat(num_times):
  """Decorator that repeats the execution of the decorated function."""
  def decorator_repeat(func):
    @functools.wraps(func)
    def wrapper_repeat(*args, **kwargs):
      for _ in range(num_times):
        value = func(*args, **kwargs)
      return value # Returns the result of the last call
    return wrapper_repeat
  return decorator_repeat

@repeat(num_times=3)
def say_hello(name):
  print(f"Hello, {name}!")
  return f"Said hello to {name}"

result = say_hello("World")
# Output:
# Hello, World!
# Hello, World!
# Hello, World!
print(result) # Output: Said hello to World
```

## Decorators with Optional Arguments

Sometimes you want a decorator that can be used with or without arguments. For example, `@my_decorator` or `@my_decorator(arg=value)`.
This is more complex. The decorator itself needs to determine if it was called with the function to be decorated as its first argument or with decorator arguments.

```python
import functools

def optional_args_decorator(_func=None, *, prefix="DEFAULT"):
  """A decorator that can be used with or without arguments."""
  def decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      print(f"{prefix}: Calling {func.__name__}")
      return func(*args, **kwargs)
    return wrapper

  if _func is None: # Called with arguments, e.g., @optional_args_decorator(prefix="CUSTOM")
    return decorator
  else: # Called without arguments, e.g., @optional_args_decorator
    return decorator(_func)

@optional_args_decorator
def func1():
  print("func1 executing")

@optional_args_decorator(prefix="CUSTOM")
def func2():
  print("func2 executing")

func1()
# Output:
# DEFAULT: Calling func1
# func1 executing

func2()
# Output:
# CUSTOM: Calling func2
# func2 executing
```

## State-tracking Decorators

Decorators can maintain state between calls. This can be achieved using function attributes or closures.

**Using Function Attributes:**
The wrapper function can have attributes that store state.

```python
import functools

def count_calls(func):
  @functools.wraps(func)
  def wrapper_count_calls(*args, **kwargs):
    wrapper_count_calls.num_calls += 1
    print(f"Call {wrapper_count_calls.num_calls} of {func.__name__!r}")
    return func(*args, **kwargs)
  wrapper_count_calls.num_calls = 0 # Initialize counter
  return wrapper_count_calls

@count_calls
def say_whee():
  print("Whee!")

say_whee() # Output: Call 1 of 'say_whee' \n Whee!
say_whee() # Output: Call 2 of 'say_whee' \n Whee!
say_whee() # Output: Call 3 of 'say_whee' \n Whee!
print(f"Total calls: {say_whee.num_calls}") # Output: Total calls: 3
```

**Using Closures (Nonlocal Variables):**
An inner wrapper function can modify variables from an outer scope using the `nonlocal` keyword (Python 3+).

```python
import functools

def count_calls_closure_factory(): # Renamed to signify it's a factory
  num_calls = 0 # This variable is part of the closure
  def decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      nonlocal num_calls
      num_calls += 1
      print(f"Call {num_calls} of {func.__name__!r} (closure)")
      # To access num_calls from outside, you'd need to expose it,
      # e.g., by adding an attribute to the wrapper itself
      # wrapper.get_num_calls = lambda: num_calls
      return func(*args, **kwargs)
    return wrapper
  return decorator

@count_calls_closure_factory() # Note: called as a factory
def say_ooh_la_la():
  print("Ooh la la!")

say_ooh_la_la() # Output: Call 1 of 'say_ooh_la_la' (closure) \n Ooh la la!
say_ooh_la_la() # Output: Call 2 of 'say_ooh_la_la' (closure) \n Ooh la la!
# Accessing num_calls directly isn't straightforward without explicit exposure.
```

## Class-Based Decorators

Instead of a function, you can use a class to define a decorator. This is useful when the decorator needs to maintain complex state or rely on object-oriented features like inheritance.

A class used as a decorator typically implements:
-   `__init__()`: Takes the function to be decorated as an argument and stores it (if it's a simple decorator). If the decorator takes arguments, `__init__` takes those arguments.
-   `__call__()`: If `__init__` stored the function, `__call__` is the wrapper. If `__init__` stored arguments, `__call__` takes the function and returns the wrapper.

**Simple Class Decorator (no arguments):**
```python
import functools

class CountCallsClassDecorator:
  def __init__(self, func):
    functools.update_wrapper(self, func) # Preserves metadata by copying to the instance 'self'
    self.func = func
    self.num_calls = 0

  def __call__(self, *args, **kwargs): # This is the wrapper
    self.num_calls += 1
    print(f"Call {self.num_calls} of {self.func.__name__!r} (class decorator)")
    return self.func(*args, **kwargs)

@CountCallsClassDecorator
def say_wow():
  print("Wow!")

say_wow() # Output: Call 1 of 'say_wow' (class decorator) \n Wow!
say_wow() # Output: Call 2 of 'say_wow' (class decorator) \n Wow!
print(f"Total calls: {say_wow.num_calls}") # Output: Total calls: 2
```
`functools.update_wrapper(self, func)` is used similarly to `functools.wraps` for function decorators, copying metadata from `func` to `self` (the decorator instance).

**Class Decorator with Arguments:**
Here, `__init__` takes the decorator's arguments, and `__call__` takes the function to be decorated and returns the wrapper.

```python
import functools
import time

class DelayDecorator:
    def __init__(self, seconds): # Takes decorator argument
        self.seconds = seconds

    def __call__(self, func): # Takes function to decorate, returns wrapper
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"Sleeping for {self.seconds}s before calling {func.__name__}")
            time.sleep(self.seconds)
            return func(*args, **kwargs)
        return wrapper

@DelayDecorator(seconds=0.7)
def important_task(task_name):
    print(f"Executing task: {task_name}")

important_task("Data Backup")
# Output:
# Sleeping for 0.7s before calling important_task
# Executing task: Data Backup
```

# More Advanced Real-World Decorator Examples

## `@singleton` Class Decorator

A singleton is a design pattern that restricts the instantiation of a class to a single object. This is useful when exactly one object is needed to coordinate actions across the system. A class decorator can enforce this.

```python
import functools

def singleton(cls):
  """Make a class a Singleton class (only one instance)"""
  @functools.wraps(cls) # Preserves class metadata
  def wrapper_singleton(*args, **kwargs):
    if not wrapper_singleton.instance:
      wrapper_singleton.instance = cls(*args, **kwargs)
    return wrapper_singleton.instance
  wrapper_singleton.instance = None # Store instance on the wrapper
  return wrapper_singleton

@singleton
class DatabaseConnection:
  def __init__(self, dsn):
    print(f"Connecting to database: {dsn}")
    self.dsn = dsn
    # Simulate a real connection setup
    time.sleep(0.1)

  def query(self, sql):
    return f"Executing '{sql}' on {self.dsn}"

# First instantiation
db_conn1 = DatabaseConnection("postgresql://user:pass@host:port/db")
print(db_conn1.query("SELECT * FROM users"))

# Second instantiation
db_conn2 = DatabaseConnection("mysql://user:pass@anotherhost:port/db") # This DSN will be ignored
print(db_conn2.query("SELECT * FROM products"))

print(f"db_conn1 is db_conn2: {db_conn1 is db_conn2}")
print(f"db_conn1 DSN: {db_conn1.dsn}")
print(f"db_conn2 DSN: {db_conn2.dsn}")

# Output:
# Connecting to database: postgresql://user:pass@host:port/db
# Executing 'SELECT * FROM users' on postgresql://user:pass@host:port/db
# Executing 'SELECT * FROM products' on postgresql://user:pass@host:port/db
# db_conn1 is db_conn2: True
# db_conn1 DSN: postgresql://user:pass@host:port/db
# db_conn2 DSN: postgresql://user:pass@host:port/db
```
**Explanation:**
- The `singleton` decorator takes a class `cls` as input.
- The `wrapper_singleton` function is what replaces the original class.
- `wrapper_singleton.instance` is a function attribute used to store the single instance of the class. It's initialized to `None`.
- When `wrapper_singleton` is called (i.e., when you try to create an instance like `DatabaseConnection(...)`), it first checks if `wrapper_singleton.instance` is `None`.
    - If it is `None`, a new instance of the original class `cls` is created and stored in `wrapper_singleton.instance`.
    - If it's not `None`, the existing instance is returned.
- This ensures that only one instance is ever created. Any subsequent attempts to "create" an instance will return the already existing one.
- `functools.wraps(cls)` helps maintain the original class's name, docstring, etc., on the `wrapper_singleton`.

## `@cache` Decorator for Memoization

Memoization is an optimization technique used primarily to speed up computer programs by storing the results of expensive function calls and returning the cached result when the same inputs occur again.

While Python 3.9+ offers `functools.cache` and earlier versions (3.2+) offer `functools.lru_cache` (Least Recently Used cache), here's how you could implement a simple cache decorator:

```python
import functools

def cache_decorator(func):
  """A simple cache decorator for functions with hashable arguments."""
  memo = {} # This dictionary stores the cached results

  @functools.wraps(func)
  def wrapper_cache(*args, **kwargs):
    # Create a key from arguments.
    # For simplicity, this example only handles hashable positional arguments.
    # A more robust key might involve inspect.signature to handle defaults,
    # and a way to represent kwargs.
    # For simplicity, we'll make a tuple of args and sorted kwargs items.
    # This requires all arguments to be hashable.
    key_args = args
    key_kwargs = tuple(sorted(kwargs.items()))
    cache_key = (key_args, key_kwargs)

    if cache_key not in memo:
      print(f"Cache miss for {func.__name__}{cache_key}. Computing...")
      memo[cache_key] = func(*args, **kwargs)
    else:
      print(f"Cache hit for {func.__name__}{cache_key}. Returning cached value.")
    return memo[cache_key]

  # Provide a way to clear the cache for this function
  def clear_cache():
    memo.clear()
    print(f"Cache cleared for {func.__name__}")
  wrapper_cache.clear_cache = clear_cache

  return wrapper_cache

@cache_decorator
def fibonacci(n):
  """Computes the nth Fibonacci number (inefficiently for demo)."""
  if n < 2:
    return n
  return fibonacci(n - 1) + fibonacci(n - 2)

print(f"Calculating fibonacci(10):")
result10 = fibonacci(10) # Will have many cache misses and some hits
print(f"Fibonacci(10) = {result10}")

print(f"\nCalculating fibonacci(10) again:")
result10_again = fibonacci(10) # Should be a single cache hit for the top call
print(f"Fibonacci(10) again = {result10_again}")

print(f"\nCalculating fibonacci(5) (some sub-problems already cached):")
result5 = fibonacci(5)
print(f"Fibonacci(5) = {result5}")

fibonacci.clear_cache()
print(f"\nCalculating fibonacci(5) after cache clear:")
result5_after_clear = fibonacci(5)
print(f"Fibonacci(5) after clear = {result5_after_clear}")

# Using built-in functools.cache (Python 3.9+) or functools.lru_cache
# from functools import cache # or lru_cache

# @cache # or @lru_cache(maxsize=None)
# def efficient_fibonacci(n):
#   if n < 2: return n
#   return efficient_fibonacci(n-1) + efficient_fibonacci(n-2)

# print(f"\nEfficient Fibonacci(100) using functools.cache: {efficient_fibonacci(100)}")
```
**Explanation of custom `@cache_decorator`:**
-   The `memo` dictionary is part of the closure of `wrapper_cache` and stores the results. It's defined when the decorator is applied to the function.
-   When the decorated function (`fibonacci` in this case) is called, `wrapper_cache` is executed.
-   It creates a `cache_key` from the function's arguments. For this key to be usable in a dictionary, the arguments themselves must be hashable. This simple example uses `args` directly (assuming they are hashable) and a tuple of sorted `kwargs.items()`.
-   If the `cache_key` is in `memo`, the stored result is returned immediately (cache hit).
-   If not, the original function `func` is called, its result is stored in `memo` with the `cache_key`, and then returned (cache miss).
-   An optional `clear_cache` method is added to the wrapper to allow external clearing of the specific function's cache.
-   **Advanced Features Used**: This decorator uses closures to maintain the `memo` state. `functools.wraps` preserves the original function's metadata. It also demonstrates how to add extra functionality (like `clear_cache`) to the decorated function.

**Note on `functools.cache` and `functools.lru_cache`:**
For most practical purposes, Python's built-in `functools.cache` (Python 3.9+) or `functools.lru_cache` (Python 3.2+) are preferred. They are highly optimized, handle various argument types more robustly (including keyword arguments and default values), and `lru_cache` provides options for limiting the cache size. The example above is for illustrating how such a decorator might be constructed.

# Conclusion: The Power of Python Decorators

Python decorators are a powerful and elegant way to modify or enhance functions and classes. Throughout this document, we've explored their fundamental concepts and progressively delved into more advanced applications.

**Summary of Key Concepts:**
-   **Purpose:** Decorators provide a way to add functionality to functions or classes dynamically without altering their core code.
-   **Syntax:** The `@decorator_name` syntax offers a readable way to apply decorators.
-   **Core Idea:** Decorators are higher-order functions that take a callable (function/class) as an argument and return a modified callable or a replacement.
-   **Common Use Cases:** Logging, timing, debugging, access control, input validation, and code reuse are frequent applications.
-   **`functools.wraps`:** Essential for preserving the metadata (name, docstring, etc.) of the decorated function.
-   **Advanced Techniques:** We saw how to create decorators that:
    -   Accept arguments, allowing for configurable behavior.
    -   Can be used with or without arguments.
    -   Maintain state between calls (e.g., for counting or caching).
    -   Can be implemented as classes for more complex scenarios or state management.
    -   Can decorate entire classes to modify their behavior or implement patterns like Singletons.

**Benefits of Using Decorators:**
-   **Code Reusability:** Define a piece of functionality once and apply it to multiple functions or classes.
-   **Readability:** Decorators can make code cleaner and more declarative by abstracting away common boilerplate or cross-cutting concerns. For example, `@timer` or `@debug` clearly states the intent.
-   **Separation of Concerns:** Decorators help separate auxiliary logic (like logging or caching) from the main business logic of a function or class. This improves maintainability and makes the core logic easier to understand and test.
-   **Extensibility:** Add new behaviors to existing code with minimal modifications to the original code itself.

**Further Exploration:**
Decorators are a cornerstone of idiomatic Python programming and are widely used in frameworks like Flask (for routing), Django (for view permissions), and many testing libraries. Understanding them deeply will significantly enhance your ability to write expressive, maintainable, and efficient Python code.

To continue your journey:
-   **Practice:** Try writing your own decorators for common tasks you encounter.
-   **Read Source Code:** Look for decorators in popular Python libraries and frameworks to see how they are used in real-world applications.
-   **Explore Built-in Decorators:** Dive deeper into decorators provided by Python's standard library, such as `@staticmethod`, `@classmethod`, `@property`, and the powerful caching tools in `functools`.

By mastering decorators, you unlock a more sophisticated level of Python programming, enabling you to write more powerful and Pythonic code. Happy decorating!
