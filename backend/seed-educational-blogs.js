const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

function generateDocId() {
  return crypto.randomBytes(12).toString('hex');
}

const BLOGS_DATA = [
  // ==========================================
  // 1. DATA STRUCTURE AND ALGORITHMS
  // ==========================================
  // --- Fundamentals ---
  {
    topic: 'Data Structure and Algorithms',
    subtopic: 'Fundamentals',
    title: 'Analysis of Algorithms | Big-O, Big-Omega, and Big-Theta Notations',
    imgURL: 'https://images.unsplash.com/photo-1516116211227-bbc1552a8c3d?w=1200&auto=format&fit=crop&q=80',
    body: `## Introduction to Asymptotic Analysis

Asymptotic analysis of an algorithm evaluates its performance in terms of input size (usually denoted as **$n$**). Instead of measuring exact execution time (which varies by CPU and compiler), we quantify the rate of growth of execution steps and memory consumption.

![Algorithm Analysis](https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1000&auto=format&fit=crop&q=80)

### 1. Big-O Notation ($O$) - Upper Bound
Big-O notation represents the **worst-case** running time of an algorithm or an upper bound on the execution steps.

$$\\text{Formal Definition: } f(n) = O(g(n)) \\iff 0 \\le f(n) \\le c \\cdot g(n) \\text{ for all } n \\ge n_0$$

#### Common Time Complexities Ranked (Fastest to Slowest):
1. **$O(1)$** - Constant Time (e.g., Array index lookup, Hash map insertion average)
2. **$O(\\log n)$** - Logarithmic Time (e.g., Binary Search)
3. **$O(n)$** - Linear Time (e.g., Linear scan, Counting elements)
4. **$O(n \\log n)$** - Linearithmic Time (e.g., Merge Sort, Heap Sort)
5. **$O(n^2)$** - Quadratic Time (e.g., Bubble Sort, Nested loops)
6. **$O(2^n)$** - Exponential Time (e.g., Recursive Fibonacci)
7. **$O(n!)$** - Factorial Time (e.g., Traveling Salesperson brute force)

\`\`\`cpp
// Example: Binary Search (O(log n) Time, O(1) Space)
int binarySearch(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
\`\`\`

### 2. Big-Omega Notation ($\Omega$) - Lower Bound
$\Omega$ notation gives the lower bound of an algorithm's performance, defining the best-case execution duration.

### 3. Big-Theta Notation ($\Theta$) - Tight Bound
$\Theta$ defines both the upper and lower bounds simultaneously. An algorithm is $\Theta(g(n))$ if and only if it is both $O(g(n))$ and $\Omega(g(n))$.

---
*Created with care by Acin's LMS team.*`
  },
  {
    topic: 'Data Structure and Algorithms',
    subtopic: 'Fundamentals',
    title: 'Space and Time Complexity Analysis with Practical Examples',
    imgURL: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    body: `## Demystifying Space & Auxiliary Complexity

When evaluating algorithms, understanding **Auxiliary Space** versus **Total Space Complexity** is essential for high-performance systems and competitive programming.

- **Auxiliary Space**: Extra space or temporary space used by the algorithm during its execution.
- **Total Space Complexity**: Auxiliary space plus space used by the input values.

### Recursive Stack Space Analysis

Recursive functions utilize the call stack in memory. The maximum stack depth determines the auxiliary memory footprint.

\`\`\`python
# Recursive Fibonacci: O(2^n) Time, O(n) Space (Stack Depth)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

# Iterative Fibonacci: O(n) Time, O(1) Space
def fib_iterative(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
\`\`\`

### Key Optimization Tips
1. **Reuse buffers** instead of allocating new arrays inside tight loops.
2. Replace recursive implementations with iterative counterparts when stack overflow is a risk ($N > 10^5$).
3. Utilize bitsets or bit manipulation for state management when boolean arrays require heavy memory.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Maths & Recursion ---
  {
    topic: 'Data Structure and Algorithms',
    subtopic: 'Maths & Recursion',
    title: 'Euclidean Algorithm (Basic & Extended) for Greatest Common Divisor (GCD)',
    imgURL: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
    body: `## The Elegance of Euclidean GCD

The Euclidean algorithm is an efficient method for computing the greatest common divisor (GCD) of two integers $a$ and $b$. It relies on the principle that the greatest common divisor of two numbers also divides their difference.

![Mathematics](https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1000&auto=format&fit=crop&q=80)

### Basic Euclidean Algorithm

$$\\gcd(a, b) = \\gcd(b, a \\pmod b) \\quad \\text{where } \\gcd(a, 0) = a$$

\`\`\`cpp
// Time Complexity: O(log(min(a, b)))
long long gcd(long long a, long long b) {
    while (b != 0) {
        long long temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
\`\`\`

### Extended Euclidean Algorithm
The Extended Euclidean algorithm finds integers $x$ and $y$ such that:

$$a \\cdot x + b \\cdot y = \\gcd(a, b)$$

This is fundamental in Number Theory for computing **Modular Multiplicative Inverses** in cryptography and competitive programming.

\`\`\`cpp
long long extgcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    long long x1, y1;
    long long d = extgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - y1 * (a / b);
    return d;
}
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },
  {
    topic: 'Data Structure and Algorithms',
    subtopic: 'Maths & Recursion',
    title: 'Sieve of Eratosthenes & Prime Factorization in O(log N)',
    imgURL: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80',
    body: `## Sieve of Eratosthenes: Optimal Prime Generation

The Sieve of Eratosthenes is one of the most efficient ways to find all primes smaller than $N$ when $N \\le 10^7$.

### Algorithm Complexity
- **Time Complexity:** $O(N \\log \\log N)$
- **Space Complexity:** $O(N)$

\`\`\`cpp
#include <vector>
using namespace std;

vector<bool> sieve(int n) {
    vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    for (int p = 2; p * p <= n; p++) {
        if (isPrime[p]) {
            for (int i = p * p; i <= n; i += p) {
                isPrime[i] = false;
            }
        }
    }
    return isPrime;
}
\`\`\`

### Smallest Prime Factor (SPF) for $O(\\log N)$ Queries
By storing the Smallest Prime Factor for each number, multiple factorization queries can be answered in $O(\\log N)$ time.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Array & String ---
  {
    topic: 'Data Structure and Algorithms',
    subtopic: 'Array & String',
    title: "Kadane's Algorithm for Maximum Subarray Sum",
    imgURL: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    body: `## Finding Maximum Subarray Sum in Linear Time

Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

### Dynamic Programming Intuition
At every index $i$, the maximum subarray sum ending at $i$ is either:
1. The element itself: $\\text{nums}[i]$
2. The current element added to the previous subarray: $\\text{maxEndingHere} + \\text{nums}[i]$

\`\`\`cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

int maxSubArray(const vector<int>& nums) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];

    for (size_t i = 1; i < nums.size(); i++) {
        currentMax = max(nums[i], currentMax + nums[i]);
        maxSoFar = max(maxSoFar, currentMax);
    }
    return maxSoFar;
}
\`\`\`

### Complexity
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$

---
*Created with care by Acin's LMS team.*`
  },
  {
    topic: 'Data Structure and Algorithms',
    subtopic: 'Array & String',
    title: 'Two Pointer & Sliding Window Techniques: Comprehensive Guide',
    imgURL: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    body: `## The Power of Two Pointers & Sliding Window

Two pointer algorithms transform $O(N^2)$ brute-force solutions into sleek $O(N)$ linear scans by leveraging monotonicity and sorted properties.

### Common Patterns
1. **Opposite Ends**: Finding pairs with target sum in a sorted array.
2. **Fast & Slow**: Cycle detection in linked lists (Floyd's algorithm).
3. **Variable Size Sliding Window**: Longest substring without repeating characters.

\`\`\`cpp
// Longest Substring Without Repeating Characters (Sliding Window)
int lengthOfLongestSubstring(string s) {
    vector<int> lastIndex(256, -1);
    int maxLen = 0, left = 0;
    
    for (int right = 0; right < s.length(); right++) {
        if (lastIndex[s[right]] >= left) {
            left = lastIndex[s[right]] + 1;
        }
        lastIndex[s[right]] = right;
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // ==========================================
  // 2. WEB DEVELOPMENT
  // ==========================================
  // --- Frontend Basics ---
  {
    topic: 'Web Development',
    subtopic: 'Frontend Basics',
    title: 'Understanding the Critical Rendering Path & DOM Optimization',
    imgURL: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    body: `## How Modern Browsers Render Web Pages

The Critical Rendering Path (CRP) is the sequence of steps the browser undergoes to convert HTML, CSS, and JavaScript into actual pixels on the screen.

![Web Performance](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1000&auto=format&fit=crop&q=80)

### The 5 Steps of CRP:
1. **DOM Construction**: HTML tokens converted to DOM nodes.
2. **CSSOM Construction**: CSS rules parsed into CSS Object Model.
3. **Render Tree Creation**: Combining DOM and CSSOM to discard invisible elements (like \`display: none\`).
4. **Layout (Reflow)**: Calculating geometric positions and sizes.
5. **Paint & Compositing**: Filling pixels across GPU layers.

### Best Practices for High Performance:
- Minimize render-blocking CSS and JS using \`defer\` or \`async\`.
- Reduce layout thrashing by batching DOM reads and writes.
- Utilize CSS transforms and opacity for smooth 60fps animations.

---
*Created with care by Acin's LMS team.*`
  },
  {
    topic: 'Web Development',
    subtopic: 'Frontend Basics',
    title: 'Modern CSS: Flexbox vs Grid Architecture & Responsive Design',
    imgURL: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=1200&auto=format&fit=crop&q=80',
    body: `## Flexbox vs Grid: When to Use Which

Modern CSS provides two powerful layout systems: **Flexbox** (1-dimensional) and **CSS Grid** (2-dimensional).

### 1. Flexbox (One-Dimensional)
Best for rows or columns of items, toolbars, navigation bars, and aligning elements along a single axis.

\`\`\`css
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}
\`\`\`

### 2. CSS Grid (Two-Dimensional)
Best for overall page scaffolding, complex dashboards, and responsive card collections with auto-fit.

\`\`\`css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // --- Backend Development ---
  {
    topic: 'Web Development',
    subtopic: 'Backend Development',
    title: 'Designing Scalable RESTful APIs with Node.js & Express',
    imgURL: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    body: `## Principles of High-Performance REST APIs

Building robust RESTful backends requires adherence to stateless design, standard HTTP verbs, idempotency, and proper error response formats.

### Core Guidelines
- **Predictable Endpoints**: Use plural nouns (\`/api/courses\`, \`/api/users\`).
- **HTTP Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Error).
- **Pagination & Filtering**: Always paginate large datasets (\`?page=1&limit=20\`).

\`\`\`javascript
// Example Express Controller with Error Handling
const getCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const courses = await CourseService.fetchPaginated({ page, limit });
    
    return res.status(200).json({
      success: true,
      data: courses.items,
      meta: { total: courses.total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // --- DevOps ---
  {
    topic: 'Web Development',
    subtopic: 'DevOps',
    title: 'Dockerizing Fullstack Applications: Multi-Stage Builds & Optimization',
    imgURL: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&auto=format&fit=crop&q=80',
    body: `## Multi-Stage Docker Builds for Lean Production Images

Docker multi-stage builds enable compiling and packaging dependencies in a heavy build container, while producing an ultra-compact production artifact.

\`\`\`dockerfile
# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // ==========================================
  // 3. AI ML & DATA SCIENCE
  // ==========================================
  // --- Machine Learning ---
  {
    topic: 'AI ML & Data Science',
    subtopic: 'Machine Learning',
    title: 'Linear & Logistic Regression: Mathematical Foundations & Implementations',
    imgURL: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    body: `## Supervised Learning Foundations

Linear and Logistic Regression form the mathematical foundation for modern predictive modeling and statistical inference.

### 1. Linear Regression (Continuous Target)
Models the relationship between independent variables $X$ and dependent continuous variable $y$:

$$\\hat{y} = w^T X + b$$

Cost Function (Mean Squared Error):
$$J(w, b) = \\frac{1}{2m} \\sum_{i=1}^m (\\hat{y}^{(i)} - y^{(i)})^2$$

### 2. Logistic Regression (Classification)
Uses the Sigmoid activation function $\\sigma(z)$ to map predictions into probabilities $[0, 1]$:

$$\\sigma(z) = \\frac{1}{1 + e^{-z}}$$

---
*Created with care by Acin's LMS team.*`
  },

  // --- Deep Learning ---
  {
    topic: 'AI ML & Data Science',
    subtopic: 'Deep Learning',
    title: 'Neural Networks: Forward Propagation, Backpropagation, and Activation Functions',
    imgURL: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
    body: `## Inside Deep Neural Networks

Artificial Neural Networks (ANNs) consist of layered nodes connecting input features to target predictions through weights, biases, and non-linear activation functions.

![Deep Learning](https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80)

### Key Activation Functions:
- **ReLU**: $f(x) = \\max(0, x)$ (Solves vanishing gradient in deep layers)
- **Softmax**: Converts vector of logits into probability distribution for multiclass classification.
- **GELU / LeakyReLU**: Prevents dead neurons.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Data Analysis ---
  {
    topic: 'AI ML & Data Science',
    subtopic: 'Data Analysis',
    title: 'Exploratory Data Analysis (EDA) Workflow with Pandas and NumPy',
    imgURL: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
    body: `## Mastering Exploratory Data Analysis

Exploratory Data Analysis (EDA) is the critical initial investigation step to uncover patterns, anomalies, test hypotheses, and verify assumptions with summary statistics and graphical representations.

\`\`\`python
import pandas as pd
import numpy as np

# Load dataset and inspect distribution
df = pd.read_csv('dataset.csv')
print(df.info())
print(df.describe().T)

# Missing values handling
df.fillna(df.median(numeric_only=True), inplace=True)
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // ==========================================
  // 4. MACHINE LEARNING
  // ==========================================
  // --- Supervised Learning ---
  {
    topic: 'Machine Learning',
    subtopic: 'Supervised Learning',
    title: 'Gradient Descent Optimization Algorithms: SGD, Momentum, and Adam',
    imgURL: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=1200&auto=format&fit=crop&q=80',
    body: `## Optimization Algorithms in Machine Learning

Gradient Descent is the backbone of model optimization. Finding the global minimum of the loss surface efficiently requires intelligent parameter update strategies.

### Comparison of Optimizers:
1. **SGD (Stochastic Gradient Descent)**: Updates parameters per single sample or mini-batch; noisy but escapes shallow local minima.
2. **RMSProp**: Normalizes gradients using moving average of squared gradients.
3. **Adam (Adaptive Moment Estimation)**: Combines Momentum (first moment) and RMSProp (second moment), making it the default choice for deep models.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Unsupervised Learning ---
  {
    topic: 'Machine Learning',
    subtopic: 'Unsupervised Learning',
    title: 'K-Means Clustering & Principal Component Analysis (PCA)',
    imgURL: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1200&auto=format&fit=crop&q=80',
    body: `## Uncovering Hidden Structures in Unlabeled Data

Unsupervised learning algorithms identify intrinsic patterns and dimensional reductions without ground-truth labels.

### 1. K-Means Algorithm
- Randomly initialize $K$ cluster centroids.
- Assign each sample to the nearest centroid.
- Recompute centroids until convergence.

### 2. Principal Component Analysis (PCA)
Orthogonal linear transformation that projects high-dimensional data onto eigenvectors of greatest variance.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Reinforcement Learning ---
  {
    topic: 'Machine Learning',
    subtopic: 'Reinforcement Learning',
    title: 'Introduction to Reinforcement Learning: Markov Decision Processes & Q-Learning',
    imgURL: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1200&auto=format&fit=crop&q=80',
    body: `## Foundations of Autonomous Agents

Reinforcement Learning (RL) trains agents to make sequential decisions in an environment to maximize cumulative reward.

### Bellman Equation
$$Q(s, a) = R(s, a) + \\gamma \\max_{a'} Q(s', a')$$

Where $\\gamma \\in [0, 1)$ is the discount factor for future rewards.

---
*Created with care by Acin's LMS team.*`
  },

  // ==========================================
  // 5. PYTHON
  // ==========================================
  // --- Core Python ---
  {
    topic: 'Python',
    subtopic: 'Core Python',
    title: 'Python Memory Management, Garbage Collection, and the GIL',
    imgURL: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&auto=format&fit=crop&q=80',
    body: `## Behind the Scenes of CPython Runtime

Understanding how Python manages object allocations and references prevents memory leaks and performance bottlenecks in high-concurrency workloads.

### Reference Counting & Cyclic GC
Python primarily uses **reference counting**. When an object's reference counter drops to 0, its memory is instantly deallocated. A secondary **cyclic garbage collector** detects circular references across generations (Gen 0, 1, 2).

### The Global Interpreter Lock (GIL)
The GIL is a mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously in CPython. For CPU-bound tasks, use \`multiprocessing\` or C-extensions instead of threading.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Django & Web ---
  {
    topic: 'Python',
    subtopic: 'Django & Web',
    title: 'Building Production-Ready APIs with Django REST Framework (DRF)',
    imgURL: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80',
    body: `## Enterprise Web APIs with Django

Django REST Framework (DRF) provides powerful serialization, authentication, pagination, and viewset abstractions for web developers.

\`\`\`python
from rest_framework import serializers, viewsets
from .models import Course

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'tag', 'created_at']

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseSerializer
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // --- Data Science with Python ---
  {
    topic: 'Python',
    subtopic: 'Data Science with Python',
    title: 'NumPy Vectorized Operations and Advanced Array Manipulation',
    imgURL: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&auto=format&fit=crop&q=80',
    body: `## Ultra-Fast Computing with NumPy

NumPy achieves 50x-100x speedups over native Python lists by utilizing contiguous memory buffers in C and SIMD vectorization.

\`\`\`python
import numpy as np

# Vectorized dot product without explicit loops
A = np.random.randn(1000, 500)
B = np.random.randn(500, 200)
C = np.dot(A, B)
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // ==========================================
  // 6. JAVA
  // ==========================================
  // --- Core Java ---
  {
    topic: 'Java',
    subtopic: 'Core Java',
    title: 'JVM Architecture, Memory Model, and Garbage Collectors (G1, ZGC)',
    imgURL: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    body: `## Deep Dive into JVM Internals

The Java Virtual Machine (JVM) divides memory into the Heap (Young Generation: Eden, S0, S1, and Old Generation) and Non-Heap (Metaspace, Thread Stacks).

### Modern Garbage Collectors:
- **G1 GC (Garbage-First)**: Divides heap into equal regions; optimizes for high throughput and bounded pause times.
- **ZGC (Z Garbage Collector)**: Concurrent, scalable, ultra-low latency collector with sub-millisecond pause times for TB-scale heaps.

---
*Created with care by Acin's LMS team.*`
  },

  // --- Spring Boot ---
  {
    topic: 'Java',
    subtopic: 'Spring Boot',
    title: 'Spring Boot Dependency Injection, Microservices & JPA Best Practices',
    imgURL: 'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?w=1200&auto=format&fit=crop&q=80',
    body: `## Modern Enterprise Java with Spring Boot

Spring Boot dramatically accelerates Java backend development through Auto-Configuration, Dependency Injection (IoC), and starter dependencies.

\`\`\`java
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    @Autowired
    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.fetchPublishedCourses());
    }
}
\`\`\`

---
*Created with care by Acin's LMS team.*`
  },

  // --- Java Collections ---
  {
    topic: 'Java',
    subtopic: 'Java Collections',
    title: 'Internal Working of HashMap and Collision Handling in Java 8+',
    imgURL: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80',
    body: `## How Java HashMap Works Under the Hood

Java's \`HashMap\` is based on a hash table data structure with an array of \`Node<K,V>\` buckets.

### Key Mechanisms:
1. **Hashing**: \`hash(key) = (h = key.hashCode()) ^ (h >>> 16)\`
2. **Index Calculation**: \`index = (n - 1) & hash\`
3. **Collision Resolution (Java 8+)**: Linked List converts to a **Red-Black Tree** (\`TreeNode\`) when bucket threshold exceeds 8 (\`TREEIFY_THRESHOLD\`), improving worst-case lookup from $O(N)$ to $O(\\log N)$.

---
*Created with care by Acin's LMS team.*`
  }
];

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to database.');

  // Clear existing blogs
  await client.query('DELETE FROM blogs_author_lnk');
  await client.query('DELETE FROM blogs');
  console.log('Cleared existing blogs.');

  // Get admin or first instructor user ID to link author
  const userRes = await client.query("SELECT id FROM up_users WHERE username = 'alve' LIMIT 1");
  const authorUserId = userRes.rows[0]?.id || 44;

  let insertedCount = 0;

  for (const blog of BLOGS_DATA) {
    const docId = generateDocId();
    const insertRes = await client.query(
      `INSERT INTO blogs (document_id, title, topic, subtopic, body, img_url, is_published, published_at, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW(), NOW()) 
       RETURNING id`,
      [docId, blog.title, blog.topic, blog.subtopic, blog.body, blog.imgURL]
    );

    const blogId = insertRes.rows[0].id;

    // Link author
    await client.query(
      `INSERT INTO blogs_author_lnk (blog_id, user_id) VALUES ($1, $2)`,
      [blogId, authorUserId]
    );

    insertedCount++;
  }

  console.log(`Successfully seeded ${insertedCount} comprehensive educational blog posts with cover images and author linked!`);
  await client.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
