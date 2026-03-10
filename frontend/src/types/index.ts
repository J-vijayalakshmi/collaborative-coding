// User types
export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: Date
  lastLoginAt: Date
}

// Room types
export interface Room {
  id: string
  name: string
  ownerId: string
  ownerName: string
  language: string
  isPrivate: boolean
  password?: string
  participants: string[]
  maxParticipants: number
  createdAt: Date
  isActive: boolean
  code: string
  interviewMode: boolean
}

// Code execution
export interface ExecutionResult {
  output: string
  error?: string
  executionTime?: number
  memory?: string
}

// Chat message
export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
}

// Cursor position for collaborative editing
export interface CursorPosition {
  oderId: string
  userName: string
  color: string
  line: number
  column: number
}

// Language options for code editor
export interface LanguageOption {
  id: string
  name: string
  monacoId: string
  jdoodleId: string
  extension: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'javascript', name: 'JavaScript', monacoId: 'javascript', jdoodleId: 'nodejs', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', monacoId: 'typescript', jdoodleId: 'typescript', extension: '.ts' },
  { id: 'python', name: 'Python', monacoId: 'python', jdoodleId: 'python3', extension: '.py' },
  { id: 'java', name: 'Java', monacoId: 'java', jdoodleId: 'java', extension: '.java' },
  { id: 'cpp', name: 'C++', monacoId: 'cpp', jdoodleId: 'cpp17', extension: '.cpp' },
  { id: 'c', name: 'C', monacoId: 'c', jdoodleId: 'c', extension: '.c' },
  { id: 'csharp', name: 'C#', monacoId: 'csharp', jdoodleId: 'csharp', extension: '.cs' },
  { id: 'go', name: 'Go', monacoId: 'go', jdoodleId: 'go', extension: '.go' },
  { id: 'rust', name: 'Rust', monacoId: 'rust', jdoodleId: 'rust', extension: '.rs' },
  { id: 'php', name: 'PHP', monacoId: 'php', jdoodleId: 'php', extension: '.php' },
  { id: 'ruby', name: 'Ruby', monacoId: 'ruby', jdoodleId: 'ruby', extension: '.rb' },
  { id: 'swift', name: 'Swift', monacoId: 'swift', jdoodleId: 'swift', extension: '.swift' },
  { id: 'kotlin', name: 'Kotlin', monacoId: 'kotlin', jdoodleId: 'kotlin', extension: '.kt' },
]

// Default code templates - Enhanced with more useful starting code
export const CODE_TEMPLATES: Record<string, string> = {
  javascript: `// JavaScript Code
// Welcome to Collaborative Code Editor!

// Basic example - Array operations
const numbers = [1, 2, 3, 4, 5];

// Map - transform each element
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Filter - keep elements that pass test
const evens = numbers.filter(n => n % 2 === 0);
console.log('Evens:', evens);

// Reduce - combine all elements
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log('Sum:', sum);

// Async example
async function fetchData() {
  console.log('Fetching data...');
  // Simulating API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { message: 'Hello, World!' };
}

fetchData().then(data => console.log(data));
`,
  typescript: `// TypeScript Code
// Welcome to Collaborative Code Editor!

// Define interfaces
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

// Generic function example
function filterItems<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}

// Sample data
const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@example.com', isActive: false },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', isActive: true },
];

// Filter active users
const activeUsers = filterItems(users, user => user.isActive);
console.log('Active users:', activeUsers);

// Type guard example
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

const value: unknown = 'Hello, TypeScript!';
if (isString(value)) {
  console.log(value.toUpperCase());
}
`,
  python: `# Python Code
# Welcome to Collaborative Code Editor!

# List comprehension examples
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Square of even numbers
squares = [x**2 for x in numbers if x % 2 == 0]
print(f"Squares of evens: {squares}")

# Dictionary comprehension
word = "hello"
char_count = {char: word.count(char) for char in set(word)}
print(f"Character count: {char_count}")

# Class example
class Calculator:
    def __init__(self, initial_value=0):
        self.value = initial_value
    
    def add(self, x):
        self.value += x
        return self
    
    def subtract(self, x):
        self.value -= x
        return self
    
    def multiply(self, x):
        self.value *= x
        return self
    
    def result(self):
        return self.value

# Method chaining
calc = Calculator(10)
result = calc.add(5).multiply(2).subtract(10).result()
print(f"Calculation result: {result}")

# Lambda and map
names = ["alice", "bob", "charlie"]
capitalized = list(map(lambda x: x.capitalize(), names))
print(f"Capitalized: {capitalized}")
`,
  java: `// Java Code
// Welcome to Collaborative Code Editor!

import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        // List operations with Streams
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        // Filter and map
        List<Integer> evenSquares = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .collect(Collectors.toList());
        
        System.out.println("Even squares: " + evenSquares);
        
        // Sum using reduce
        int sum = numbers.stream()
            .reduce(0, Integer::sum);
        
        System.out.println("Sum: " + sum);
        
        // String manipulation
        String[] words = {"Hello", "World", "Java"};
        String joined = String.join(" ", words);
        System.out.println(joined + "!");
        
        // HashMap example
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 87);
        scores.put("Charlie", 92);
        
        scores.forEach((name, score) -> 
            System.out.println(name + ": " + score));
    }
}
`,
  cpp: `// C++ Code
// Welcome to Collaborative Code Editor!

#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <map>

using namespace std;

// Template function
template<typename T>
T findMax(const vector<T>& vec) {
    return *max_element(vec.begin(), vec.end());
}

// Class example
class Person {
private:
    string name;
    int age;
    
public:
    Person(string n, int a) : name(n), age(a) {}
    
    void introduce() const {
        cout << "Hi, I'm " << name << ", " << age << " years old." << endl;
    }
    
    int getAge() const { return age; }
};

int main() {
    // Vector operations
    vector<int> numbers = {5, 2, 8, 1, 9, 3, 7, 4, 6};
    
    // Sort
    sort(numbers.begin(), numbers.end());
    
    cout << "Sorted: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;
    
    // Find max using template
    cout << "Max: " << findMax(numbers) << endl;
    
    // Lambda expression
    int sum = 0;
    for_each(numbers.begin(), numbers.end(), [&sum](int n) {
        sum += n;
    });
    cout << "Sum: " << sum << endl;
    
    // Class usage
    Person alice("Alice", 25);
    alice.introduce();
    
    // Map
    map<string, int> scores;
    scores["Alice"] = 95;
    scores["Bob"] = 87;
    
    for (const auto& [name, score] : scores) {
        cout << name << ": " << score << endl;
    }
    
    return 0;
}
`,
  c: `// C Code
// Welcome to Collaborative Code Editor!

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Structure definition
typedef struct {
    char name[50];
    int age;
    float gpa;
} Student;

// Function to print student info
void printStudent(const Student* s) {
    printf("Name: %s, Age: %d, GPA: %.2f\\n", s->name, s->age, s->gpa);
}

// Swap function using pointers
void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

// Bubble sort
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(&arr[j], &arr[j + 1]);
            }
        }
    }
}

int main() {
    printf("Hello, C Programming!\\n\\n");
    
    // Array operations
    int numbers[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    
    printf("Original array: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\\n");
    
    bubbleSort(numbers, n);
    
    printf("Sorted array: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\\n\\n");
    
    // Structure usage
    Student s1 = {"Alice", 20, 3.8};
    printStudent(&s1);
    
    // Dynamic memory
    int* dynamicArray = (int*)malloc(5 * sizeof(int));
    for (int i = 0; i < 5; i++) {
        dynamicArray[i] = (i + 1) * 10;
    }
    
    printf("\\nDynamic array: ");
    for (int i = 0; i < 5; i++) printf("%d ", dynamicArray[i]);
    printf("\\n");
    
    free(dynamicArray);
    
    return 0;
}
`,
  csharp: `// C# Code
// Welcome to Collaborative Code Editor!

using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, C#!\\n");
        
        // LINQ examples
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        
        // Where and Select (Filter and Map)
        var evenSquares = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .ToList();
        
        Console.WriteLine($"Even squares: {string.Join(", ", evenSquares)}");
        
        // Aggregate (Reduce)
        var sum = numbers.Aggregate(0, (acc, n) => acc + n);
        Console.WriteLine($"Sum: {sum}");
        
        // Class and object
        var person = new Person("Alice", 25);
        person.Introduce();
        
        // Dictionary
        var scores = new Dictionary<string, int>
        {
            ["Alice"] = 95,
            ["Bob"] = 87,
            ["Charlie"] = 92
        };
        
        Console.WriteLine("\\nScores:");
        foreach (var (name, score) in scores)
        {
            Console.WriteLine($"  {name}: {score}");
        }
        
        // Pattern matching
        object obj = 42;
        string result = obj switch
        {
            int n when n > 0 => $"Positive number: {n}",
            int n => $"Non-positive: {n}",
            string s => $"String: {s}",
            _ => "Unknown type"
        };
        Console.WriteLine($"\\nPattern match: {result}");
    }
}

class Person
{
    public string Name { get; }
    public int Age { get; }
    
    public Person(string name, int age) => (Name, Age) = (name, age);
    
    public void Introduce() => 
        Console.WriteLine($"\\nHi, I'm {Name}, {Age} years old.");
}
`,
  go: `// Go Code
// Welcome to Collaborative Code Editor!

package main

import (
	"fmt"
	"sort"
	"strings"
)

// Person struct
type Person struct {
	Name string
	Age  int
}

// Method on Person
func (p Person) Introduce() {
	fmt.Printf("Hi, I'm %s, %d years old.\\n", p.Name, p.Age)
}

// Generic function (Go 1.18+)
func Filter[T any](slice []T, predicate func(T) bool) []T {
	result := make([]T, 0)
	for _, item := range slice {
		if predicate(item) {
			result = append(result, item)
		}
	}
	return result
}

func main() {
	fmt.Println("Hello, Go!\\n")

	// Slice operations
	numbers := []int{5, 2, 8, 1, 9, 3, 7, 4, 6}
	
	// Sort
	sort.Ints(numbers)
	fmt.Println("Sorted:", numbers)
	
	// Filter even numbers
	evens := Filter(numbers, func(n int) bool {
		return n%2 == 0
	})
	fmt.Println("Evens:", evens)
	
	// Map
	scores := map[string]int{
		"Alice":   95,
		"Bob":     87,
		"Charlie": 92,
	}
	
	fmt.Println("\\nScores:")
	for name, score := range scores {
		fmt.Printf("  %s: %d\\n", name, score)
	}
	
	// Struct usage
	person := Person{Name: "Alice", Age: 25}
	fmt.Println()
	person.Introduce()
	
	// String operations
	words := []string{"Hello", "World", "Go"}
	joined := strings.Join(words, " ")
	fmt.Println("\\n" + joined + "!")
	
	// Goroutine example (concurrent)
	ch := make(chan string)
	go func() {
		ch <- "Message from goroutine"
	}()
	fmt.Println("\\n" + <-ch)
}
`,
  rust: `// Rust Code
// Welcome to Collaborative Code Editor!

use std::collections::HashMap;

// Struct with implementation
struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn new(name: &str, age: u32) -> Self {
        Person {
            name: name.to_string(),
            age,
        }
    }
    
    fn introduce(&self) {
        println!("Hi, I'm {}, {} years old.", self.name, self.age);
    }
}

// Generic function
fn find_max<T: Ord + Copy>(items: &[T]) -> Option<T> {
    items.iter().max().copied()
}

fn main() {
    println!("Hello, Rust!\\n");
    
    // Vector operations
    let mut numbers = vec![5, 2, 8, 1, 9, 3, 7, 4, 6];
    
    // Sort
    numbers.sort();
    println!("Sorted: {:?}", numbers);
    
    // Filter and map with iterators
    let even_squares: Vec<i32> = numbers
        .iter()
        .filter(|&n| n % 2 == 0)
        .map(|n| n * n)
        .collect();
    println!("Even squares: {:?}", even_squares);
    
    // Sum using fold
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
    
    // Find max using generic function
    if let Some(max) = find_max(&numbers) {
        println!("Max: {}", max);
    }
    
    // HashMap
    let mut scores = HashMap::new();
    scores.insert("Alice", 95);
    scores.insert("Bob", 87);
    scores.insert("Charlie", 92);
    
    println!("\\nScores:");
    for (name, score) in &scores {
        println!("  {}: {}", name, score);
    }
    
    // Struct usage
    let person = Person::new("Alice", 25);
    println!();
    person.introduce();
    
    // Option and Result handling
    let maybe_value: Option<i32> = Some(42);
    match maybe_value {
        Some(v) => println!("\\nValue: {}", v),
        None => println!("No value"),
    }
}
`,
  php: `<?php
// PHP Code
// Welcome to Collaborative Code Editor!

echo "Hello, PHP!\\n\\n";

// Array operations
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Filter even numbers
$evens = array_filter($numbers, fn($n) => $n % 2 === 0);
echo "Evens: " . implode(", ", $evens) . "\\n";

// Map to squares
$squares = array_map(fn($n) => $n * $n, $evens);
echo "Squares: " . implode(", ", $squares) . "\\n";

// Reduce to sum
$sum = array_reduce($numbers, fn($acc, $n) => $acc + $n, 0);
echo "Sum: $sum\\n\\n";

// Class example
class Person {
    private string $name;
    private int $age;
    
    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }
    
    public function introduce(): void {
        echo "Hi, I'm {$this->name}, {$this->age} years old.\\n";
    }
    
    public function getAge(): int {
        return $this->age;
    }
}

$person = new Person("Alice", 25);
$person->introduce();

// Associative array
$scores = [
    "Alice" => 95,
    "Bob" => 87,
    "Charlie" => 92
];

echo "\\nScores:\\n";
foreach ($scores as $name => $score) {
    echo "  $name: $score\\n";
}

// String functions
$text = "hello world";
echo "\\nUppercase: " . strtoupper($text) . "\\n";
echo "Words: " . str_word_count($text) . "\\n";

// Date and time
echo "\\nCurrent time: " . date("Y-m-d H:i:s") . "\\n";
?>
`,
  ruby: `# Ruby Code
# Welcome to Collaborative Code Editor!

puts "Hello, Ruby!\\n\\n"

# Array operations
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Select (filter) and map
even_squares = numbers.select { |n| n.even? }.map { |n| n ** 2 }
puts "Even squares: #{even_squares}"

# Reduce
sum = numbers.reduce(0) { |acc, n| acc + n }
puts "Sum: #{sum}"

# Each with index
puts "\\nNumbers with index:"
numbers.first(5).each_with_index do |n, i|
  puts "  Index #{i}: #{n}"
end

# Class example
class Person
  attr_reader :name, :age
  
  def initialize(name, age)
    @name = name
    @age = age
  end
  
  def introduce
    puts "Hi, I'm #{@name}, #{@age} years old."
  end
  
  def adult?
    @age >= 18
  end
end

puts
alice = Person.new("Alice", 25)
alice.introduce
puts "Is adult? #{alice.adult?}"

# Hash
scores = {
  "Alice" => 95,
  "Bob" => 87,
  "Charlie" => 92
}

puts "\\nScores:"
scores.each do |name, score|
  puts "  #{name}: #{score}"
end

# Symbols and blocks
words = %w[hello world ruby]
puts "\\nCapitalized: #{words.map(&:capitalize).join(' ')}"

# Range
puts "\\nRange 1..5: #{(1..5).to_a}"

# String interpolation and methods
name = "ruby programming"
puts "\\nTitle case: #{name.split.map(&:capitalize).join(' ')}"
`,
  swift: `// Swift Code
// Welcome to Collaborative Code Editor!

import Foundation

print("Hello, Swift!\\n")

// Array operations
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Filter and map
let evenSquares = numbers.filter { $0 % 2 == 0 }.map { $0 * $0 }
print("Even squares: \\(evenSquares)")

// Reduce
let sum = numbers.reduce(0, +)
print("Sum: \\(sum)")

// Struct example
struct Person {
    let name: String
    let age: Int
    
    func introduce() {
        print("Hi, I'm \\(name), \\(age) years old.")
    }
    
    var isAdult: Bool {
        return age >= 18
    }
}

print()
let alice = Person(name: "Alice", age: 25)
alice.introduce()
print("Is adult? \\(alice.isAdult)")

// Dictionary
let scores = [
    "Alice": 95,
    "Bob": 87,
    "Charlie": 92
]

print("\\nScores:")
for (name, score) in scores {
    print("  \\(name): \\(score)")
}

// Optional handling
let maybeValue: Int? = 42
if let value = maybeValue {
    print("\\nValue: \\(value)")
}

// Guard and unwrapping
func greet(name: String?) {
    guard let name = name else {
        print("No name provided")
        return
    }
    print("Hello, \\(name)!")
}

print()
greet(name: "World")

// Enum with associated values
enum Result {
    case success(String)
    case failure(String)
}

let result: Result = .success("Operation completed")
switch result {
case .success(let message):
    print("\\nSuccess: \\(message)")
case .failure(let error):
    print("\\nError: \\(error)")
}

// Closure
let multiply: (Int, Int) -> Int = { $0 * $1 }
print("\\n5 * 3 = \\(multiply(5, 3))")
`,
  kotlin: `// Kotlin Code
// Welcome to Collaborative Code Editor!

fun main() {
    println("Hello, Kotlin!\\n")
    
    // List operations
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    
    // Filter and map
    val evenSquares = numbers.filter { it % 2 == 0 }.map { it * it }
    println("Even squares: $evenSquares")
    
    // Reduce
    val sum = numbers.reduce { acc, n -> acc + n }
    println("Sum: $sum")
    
    // Data class
    data class Person(val name: String, val age: Int) {
        fun introduce() = println("Hi, I'm $name, $age years old.")
        val isAdult get() = age >= 18
    }
    
    println()
    val alice = Person("Alice", 25)
    alice.introduce()
    println("Is adult? \${alice.isAdult}")
    
    // Map
    val scores = mapOf(
        "Alice" to 95,
        "Bob" to 87,
        "Charlie" to 92
    )
    
    println("\\nScores:")
    scores.forEach { (name, score) ->
        println("  $name: $score")
    }
    
    // Null safety
    val maybeValue: Int? = 42
    maybeValue?.let { println("\\nValue: $it") }
    
    // When expression (pattern matching)
    val result = when (val x = 42) {
        in 1..10 -> "Small"
        in 11..100 -> "Medium"
        else -> "Large"
    }
    println("\\n42 is: $result")
    
    // Extension function
    fun String.addExclamation() = "$this!"
    println("\\n" + "Hello World".addExclamation())
    
    // Sealed class
    sealed class Result {
        data class Success(val data: String) : Result()
        data class Error(val message: String) : Result()
    }
    
    val opResult: Result = Result.Success("Operation completed")
    when (opResult) {
        is Result.Success -> println("\\nSuccess: \${opResult.data}")
        is Result.Error -> println("\\nError: \${opResult.message}")
    }
    
    // Sequence (lazy evaluation)
    val firstThreeEvens = numbers.asSequence()
        .filter { it % 2 == 0 }
        .take(3)
        .toList()
    println("\\nFirst 3 evens: $firstThreeEvens")
}
`,
}
