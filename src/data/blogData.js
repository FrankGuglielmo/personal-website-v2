// Export BlogData as an array of blog post objects
export const BlogData = [
  {
    id: 1,
    title: "Getting Started with React",
    date: "March 15, 2025",
    image: require("../images/projects/spot.png"), // Using an existing image as placeholder
    summary: "A beginner's guide to setting up your first React project and understanding the core concepts.",
    content: `
      <h2>Introduction to React</h2>
      <p>React is a JavaScript library for building user interfaces. It's maintained by Facebook and a community of individual developers and companies. React can be used as a base in the development of single-page or mobile applications.</p>
      
      <h2>Why React?</h2>
      <p>React allows developers to create large web applications that can change data, without reloading the page. The main purpose of React is to be fast, scalable, and simple. It works only on user interfaces in the application.</p>
      
      <h2>Setting Up Your Environment</h2>
      <p>To get started with React, you'll need to have Node.js installed on your computer. Once you have Node.js, you can create a new React application using Create React App:</p>
      
      <pre><code>npx create-react-app my-app
cd my-app
npm start</code></pre>
      
      <p>This will set up a new React project with all the necessary configurations and start a development server at <a href="http://localhost:3000">http://localhost:3000</a>.</p>
      
      <h2>Components in React</h2>
      <p>Components are the building blocks of any React application. A component is a JavaScript class or function that optionally accepts inputs (called "props") and returns a React element that describes how a section of the UI should appear.</p>
      
      <p>Stay tuned for more React tutorials in future blog posts!</p>
    `,
    media: [
      {
        type: "image",
        src: require("../images/projects/clixz_logo_white.png"),
        alt: "React Logo"
      }
    ]
  },
  {
    id: 2,
    title: "Building a Personal Portfolio Website",
    date: "March 10, 2025",
    image: require("../images/projects/librario.png"), // Using an existing image as placeholder
    summary: "Learn how to showcase your skills and projects with a professional portfolio website.",
    content: `
      <h2>Why You Need a Portfolio Website</h2>
      <p>A portfolio website is essential for any developer or designer looking to showcase their work and skills to potential employers or clients. It serves as a digital resume that can demonstrate your abilities in a way that a traditional resume cannot.</p>
      
      <h2>Planning Your Portfolio</h2>
      <p>Before diving into code, it's important to plan what you want to include in your portfolio. Some key sections might include:</p>
      <ul>
        <li>About Me - A brief introduction to who you are and what you do</li>
        <li>Projects - Showcasing your best work with descriptions and links</li>
        <li>Skills - A list of your technical skills and proficiencies</li>
        <li>Contact Information - How potential employers or clients can reach you</li>
      </ul>
      
      <h2>Choosing Your Tech Stack</h2>
      <p>There are many ways to build a portfolio website. Some popular options include:</p>
      <ul>
        <li>React - Great for creating interactive single-page applications</li>
        <li>Gatsby - A React-based framework that generates static sites</li>
        <li>Next.js - A React framework with server-side rendering capabilities</li>
        <li>Plain HTML/CSS/JavaScript - Simple and effective for smaller sites</li>
      </ul>
      
      <p>Choose the stack that best aligns with your skills and the complexity of the site you want to build.</p>
      
      <h2>Design Considerations</h2>
      <p>Your portfolio should reflect your personal brand while remaining clean and professional. Consider the following design principles:</p>
      <ul>
        <li>Use a consistent color scheme throughout the site</li>
        <li>Choose readable fonts for your content</li>
        <li>Ensure your site is responsive and looks good on all devices</li>
        <li>Use high-quality images and screenshots of your work</li>
      </ul>
      
      <p>I'll share more tips on portfolio optimization in future posts!</p>
    `,
    media: []
  }
];
