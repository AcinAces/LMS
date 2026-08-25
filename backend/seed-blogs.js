require('dotenv').config();
﻿const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();

  // Clear existing blogs
  await client.query('DELETE FROM blogs');
  
  const topics = [
    {
      topic: 'Data Structure and Algorithms',
      sections: [
        {
          section: 'Fundamentals',
          categories: [
            { category: 'Programming', titles: ['Input and Output', 'Conditional Statements', 'For loop', 'While loop', 'Function', 'Classes and Objects'] },
            { category: 'Complexity Analysis', titles: ['Order of Growth', 'Asymptotic Analysis', 'Big-O', 'Theta', 'Time Complexity', 'Space Complexity'] }
          ]
        },
        {
          section: 'Maths, Pattern & Recursion',
          categories: [
            { category: 'Theory', titles: ['Recursion', 'Analysis of Recursion'] },
            { category: 'Easy Maths', titles: ['Even or Odd', 'Sum of Naturals', 'Closest Number', 'Sum of Consecutive'] },
            { category: 'Easy Pattern', titles: ['Solid Rectangle', 'Floyds Triangle', 'Hollow rectangle'] },
            { category: 'Easy Recursion', titles: ['Print 1 to n', 'Print n to 1', 'Factorial', 'GCD', 'Power'] }
          ]
        },
        {
          section: 'Array & String',
          categories: [
            { category: 'Theory', titles: ['Array', 'String', 'Matrix'] },
            { category: 'Easy Array', titles: ['Is Sorted', 'Multiply with Adjacent', 'Reverse', 'Reverse in Groups', 'Rotate'] }
          ]
        }
      ]
    },
    {
      topic: 'Web Development',
      sections: [
        {
          section: 'Frontend Basics',
          categories: [
            { category: 'HTML', titles: ['Tags and Elements', 'Forms and Inputs', 'Semantic HTML'] },
            { category: 'CSS', titles: ['Selectors', 'Flexbox', 'CSS Grid', 'Animations'] }
          ]
        }
      ]
    },
    {
      topic: 'AI ML & Data Science',
      sections: [
        {
          section: 'Machine Learning Basics',
          categories: [
            { category: 'Supervised', titles: ['Linear Regression', 'Logistic Regression', 'Decision Trees'] },
            { category: 'Unsupervised', titles: ['K-Means Clustering', 'PCA'] }
          ]
        }
      ]
    },
    {
      topic: 'Machine Learning',
      sections: [
        {
          section: 'Deep Learning',
          categories: [
            { category: 'Neural Networks', titles: ['Perceptrons', 'Backpropagation', 'Activation Functions'] }
          ]
        }
      ]
    },
    {
      topic: 'Python',
      sections: [
        {
          section: 'Basics',
          categories: [
            { category: 'Syntax', titles: ['Variables', 'Data Types', 'Operators'] }
          ]
        }
      ]
    },
    {
      topic: 'Java',
      sections: [
        {
          section: 'Core Java',
          categories: [
            { category: 'OOP', titles: ['Inheritance', 'Polymorphism', 'Encapsulation'] }
          ]
        }
      ]
    }
  ];

  let id = 1;
  for (const t of topics) {
    for (const s of t.sections) {
      for (const c of s.categories) {
        for (const title of c.titles) {
          const documentId = 'blog_' + Date.now() + '_' + id;
          const body = 'This is the detailed blog post content for ' + title + '. It covers all the fundamental concepts and practical examples you need to know.';
          
          await client.query(
            "INSERT INTO blogs (title, topic, section, category, body, published_at, created_at, updated_at, document_id) VALUES (, , , , , NOW(), NOW(), NOW(), )",
            [title, t.topic, s.section, c.category, body, documentId]
          );
          id++;
        }
      }
    }
  }

  console.log('Seeded ' + (id - 1) + ' blogs.');
  await client.end();
}

run().catch(console.error);

