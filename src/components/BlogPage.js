import React from 'react';
import BlogCard from './BlogCard';
import { BlogData } from '../data/blogData';
import Footer from './Footer';
import NavBar from './NavBar';
import '../styles/blogCard.css';

const BlogPage = () => {
  return (
    <div className="blog-page">
      <div className="relative min-h-screen">
        {/* Background similar to hero section but simplified */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 h-24 w-full absolute top-0 z-0"></div>
        
        {/* Navigation */}
        <NavBar />
        
        <div className="container mx-auto relative z-10 pt-32 pb-16 px-4">
          <div className="blog-page-header">
            <h1 className="blog-page-title text-white">Blog</h1>
          </div>
          
          <div className="blog-grid">
            {BlogData.map((post) => (
              <BlogCard 
                key={post.id}
                id={post.id}
                title={post.title}
                date={post.date}
                readLength={post.readLength}
                image={post.image}
                summary={post.summary}
              />
            ))}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default BlogPage;
